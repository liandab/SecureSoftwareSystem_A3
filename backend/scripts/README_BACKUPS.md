# SR-14: Backup and restore rehearsal

The backup service saves hourly `pg_dump -Fc` files under `./backups/` (Git-ignored).
Database volume persistence is **not** a backup by itself.

From the project root, with Docker Desktop running:

```sh
docker compose run --rm backup sh /scripts/backup-once.sh
```

To rehearse recovery **without changing the live demo database**:

```sh
docker compose run --rm backup sh /scripts/check-restore.sh
```

The script restores the newest dump into a temporary database, confirms critical tables are readable, reports elapsed seconds, and drops the temporary database. Save the actual stdout as testing evidence.

The requirement asks for a 30-minute recovery. The above is a local rehearsal, not a measured disaster-recovery guarantee. For real systems, encrypt and store backups on independent infrastructure, exercise restoration of secrets/certificates, and measure full service recovery rather than only database restoration.
