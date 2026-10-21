#!/bin/sh
set -eu
: "${EVP_APP_PASSWORD:?EVP_APP_PASSWORD missing}"
: "${EVP_REPORT_PASSWORD:?EVP_REPORT_PASSWORD missing}"

# Bootstrap runs as the database owner, not from the public API process.
psql -v ON_ERROR_STOP=1 -U "${POSTGRES_USER:-evp_owner}" -d "${POSTGRES_DB:-evp_demo}" \
  -v app_password="$EVP_APP_PASSWORD" -v report_password="$EVP_REPORT_PASSWORD" <<'SQL'
SELECT format('CREATE ROLE evp_app LOGIN PASSWORD %L', :'app_password')
 WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='evp_app') \gexec
SELECT format('CREATE ROLE evp_report_reader LOGIN PASSWORD %L', :'report_password')
 WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='evp_report_reader') \gexec
ALTER ROLE evp_app PASSWORD :'app_password';
ALTER ROLE evp_report_reader PASSWORD :'report_password';
REVOKE ALL ON DATABASE evp_demo FROM PUBLIC;
GRANT CONNECT ON DATABASE evp_demo TO evp_app, evp_report_reader;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO evp_app, evp_report_reader;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM evp_app, evp_report_reader;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM evp_app, evp_report_reader;
GRANT SELECT,INSERT,UPDATE ON voters TO evp_app;
GRANT SELECT,INSERT,UPDATE,DELETE ON sessions TO evp_app;
GRANT SELECT,INSERT,UPDATE,DELETE ON login_failures TO evp_app;
GRANT SELECT,INSERT ON audit_logs TO evp_app;
GRANT SELECT,INSERT,DELETE ON vote_queue TO evp_app;
GRANT SELECT ON candidates, election_control, voter_public_info TO evp_app;
GRANT UPDATE ON election_control TO evp_app;
GRANT INSERT ON votes TO evp_app;
GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA public TO evp_app;
GRANT SELECT ON vote_crypto_view, candidates TO evp_report_reader;
-- Neither API role can alter tables, create accounts or drop the schema.
SQL
