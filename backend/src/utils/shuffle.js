
const { pool } = require('../config/database');

const MIN_BUFFER_SIZE = 5;

// The queue keeps encrypted ballots until they are moved to vote storage.
async function moveOneRandom(client) {
  const { rows } = await client.query(
    'SELECT * FROM vote_queue ORDER BY random() LIMIT 1'
  );

  if (rows.length === 0) {
    return false;
  }

  const row = rows[0];

  await client.query(
    `INSERT INTO votes (
      vote_id,
      chamber,
      electorate,
      iv,
      ciphertext,
      auth_tag,
      integrity_hash
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      row.vote_id,
      row.chamber,
      row.electorate,
      row.iv,
      row.ciphertext,
      row.auth_tag,
      row.integrity_hash
    ]
  );

  // Remove the ballot from the queue after saving it.
  await client.query(
    'DELETE FROM vote_queue WHERE vote_id = $1',
    [row.vote_id]
  );

  // Best-effort cleanup of the temporary encrypted values.
  for (const field of [
    'iv',
    'ciphertext',
    'auth_tag',
    'integrity_hash'
  ]) {
    row[field] = null;
  }

  return true;
}

async function shuffleTransaction(shouldFlush) {
  const client = await pool.connect();
  let moved = 0;

  try {
    await client.query('BEGIN');

    // Prevent two shuffle operations from processing the queue together.
    await client.query('SELECT pg_advisory_xact_lock(555323)');

    const current = await client.query(
      'SELECT count(*)::int AS total FROM vote_queue'
    );

    const count = current.rows[0].total;

    if (shouldFlush) {
      // Move all remaining ballots when the election closes.
      for (let i = 0; i < count; i++) {
        if (await moveOneRandom(client)) {
          moved++;
        }
      }
    } else if (count >= MIN_BUFFER_SIZE) {
      // Move one randomly selected ballot once the buffer is full.
      if (await moveOneRandom(client)) {
        moved++;
      }
    }

    await client.query('COMMIT');

    return {
      flushed: moved,
      pending: count - moved
    };

  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;

  } finally {
    client.release();
  }
}

async function releaseWhenFull() {
  return shuffleTransaction(false);
}

async function flushBallots() {
  return shuffleTransaction(true);
}

module.exports = {
  releaseWhenFull,
  flushBallots,
  MIN_BUFFER_SIZE
};
