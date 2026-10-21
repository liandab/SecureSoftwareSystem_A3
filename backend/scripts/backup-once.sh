#!/bin/sh
set -eu
# Run in a container with PostgreSQL client tools and PG* environment variables.
# This demonstration backs up data but does not prove a 30-minute recovery time.
mkdir -p /backups
umask 077
file="/backups/evp_$(date -u +%Y%m%dT%H%M%SZ).dump"
pg_dump -Fc --no-owner --no-acl --file="$file" --dbname="${PGDATABASE:-evp_demo}"
test -s "$file"
echo "Created backup $file"
