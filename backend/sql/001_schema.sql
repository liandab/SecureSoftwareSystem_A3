-- DEMO SCHEMA. This is not an actual Australian electoral system.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS voters (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 email TEXT NOT NULL UNIQUE,
 password_hash TEXT NOT NULL,
 role TEXT NOT NULL CHECK (role IN ('voter','aec_staff','delegate','administrator')),
 status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','enrolled','disabled')),
 has_voted BOOLEAN NOT NULL DEFAULT FALSE,
 totp_secret_enc TEXT NOT NULL,
 last_totp_step BIGINT NOT NULL DEFAULT -1
);
CREATE TABLE IF NOT EXISTS sessions (
 id UUID PRIMARY KEY,
 voter_id UUID NOT NULL REFERENCES voters(id) ON DELETE CASCADE,
 last_activity TIMESTAMPTZ NOT NULL DEFAULT now(),
 expires_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE IF NOT EXISTS votes (
 vote_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 chamber TEXT NOT NULL,
 electorate TEXT NOT NULL,
 iv TEXT NOT NULL,
 ciphertext TEXT NOT NULL,
 auth_tag TEXT NOT NULL,
 integrity_hash TEXT NOT NULL
);
-- Durable pending ballot pool; unlike an in-memory queue, accepted ballots survive a restart.
CREATE TABLE IF NOT EXISTS vote_queue (
 vote_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 chamber TEXT NOT NULL, electorate TEXT NOT NULL, iv TEXT NOT NULL, ciphertext TEXT NOT NULL,
 auth_tag TEXT NOT NULL, integrity_hash TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS candidates (
 id TEXT PRIMARY KEY,
 name TEXT NOT NULL,
 chamber TEXT NOT NULL DEFAULT 'DEMO_HOUSE',
 electorate TEXT NOT NULL DEFAULT 'DEMO'
);
INSERT INTO candidates (id,name) VALUES
 ('DEMO_A','Candidate A'), ('DEMO_B','Candidate B'), ('DEMO_C','Candidate C')
 ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS audit_logs (
 id BIGSERIAL PRIMARY KEY,
 event JSONB NOT NULL,
 previous_hash TEXT NOT NULL,
 entry_hash TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS login_failures (
 id BIGSERIAL PRIMARY KEY,
 email TEXT NOT NULL,
 attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS login_failures_lookup ON login_failures(email, attempted_at);
-- Demonstration of column restriction; service-specific GRANTs require a deliberate deployment setup.
CREATE OR REPLACE VIEW voter_public_info AS SELECT id, email, role, status, has_voted FROM voters;
CREATE OR REPLACE VIEW vote_results_view AS SELECT vote_id, chamber, electorate FROM votes;
CREATE OR REPLACE VIEW audit_summary_view AS SELECT id, event, created_at FROM audit_logs;
