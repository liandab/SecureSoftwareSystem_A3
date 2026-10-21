-- This row protects the boundary between accepting a ballot and closing the demo election.
-- Existing demo volumes can run this script manually without deleting any ballot data.
CREATE TABLE IF NOT EXISTS election_control (
 id INTEGER PRIMARY KEY CHECK (id=1),
 is_open BOOLEAN NOT NULL DEFAULT TRUE,
 closed_at TIMESTAMPTZ
);
INSERT INTO election_control(id,is_open) VALUES(1,TRUE) ON CONFLICT (id) DO NOTHING;

-- Result-sharing code sees encrypted ballot columns, but not internal vote IDs.
CREATE OR REPLACE VIEW vote_crypto_view AS
 SELECT chamber,electorate,iv,ciphertext,auth_tag,integrity_hash FROM votes;
