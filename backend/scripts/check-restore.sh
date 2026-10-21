#!/bin/sh
set -eu
# Restores into a new temporary database. Never touches evp_demo.
file="${1:-}"
if [ -z "$file" ]; then
 file="$(find /backups -maxdepth 1 -type f -name 'evp_*.dump' | sort | tail -n 1)"
fi
if [ -z "$file" ] || [ ! -s "$file" ]; then
 echo 'No usable .dump file found' >&2; exit 2
fi
case "$file" in /backups/*) ;; *) echo 'Backup must be in /backups' >&2; exit 2;; esac
scratch="evp_restore_check_$$"
start="$(date +%s)"
cleanup(){ dropdb --if-exists --force "$scratch" >/dev/null 2>&1 || true; }
trap cleanup EXIT INT TERM
createdb "$scratch"
pg_restore --exit-on-error --no-owner --no-acl --dbname="$scratch" "$file"
psql -v ON_ERROR_STOP=1 -d "$scratch" -Atc \
 'SELECT json_build_object('\''voters'\'',(SELECT COUNT(*) FROM voters),'\''stored_votes'\'',(SELECT COUNT(*) FROM votes),'\''queued_votes'\'',(SELECT COUNT(*) FROM vote_queue));'
end="$(date +%s)"
elapsed=$((end-start))
echo "Isolated restore completed in ${elapsed}s. Compare measured time against the 1800s recovery target."
