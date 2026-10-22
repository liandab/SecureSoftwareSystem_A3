
import { useState } from 'react';
import { api } from '../services/api';

export default function Admin() {
  const [result, setResult] = useState(null);
  const [audit, setAudit] = useState(null);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState('');
  const [closedThisSession, setClosedThisSession] = useState(false);

  // Fetch results and validate the audit chain.
  async function refreshData() {
    const nextResult = await api('/admin/results');
    setResult(nextResult);

    const nextAudit = await api('/admin/audit-check');
    setAudit(nextAudit);
  }

  async function load() {
    if (busy) return;

    setBusy('loading');
    setError('');
    setFeedback('');

    try {
      await refreshData();

      setFeedback(
        `Results and audit chain refreshed at ${new Date().toLocaleTimeString()}. ` +
        'Vote counts will remain the same if no new ballots have been counted.'
      );
    } catch (err) {
      setError(`Unable to load results: ${err.message}`);
    } finally {
      setBusy('');
    }
  }

  async function flush() {
    if (busy || closedThisSession) return;

    setBusy('closing');
    setError('');
    setFeedback('');

    try {
      const response = await api('/admin/flush', {
        method: 'POST'
      });

      setClosedThisSession(true);

      setFeedback(
        `Demo election closed successfully. ` +
        `${response.flushed ?? 0} encrypted ballot(s) moved from the queue; ` +
        `${response.pending ?? 0} pending.`
      );

      // Refresh results without losing the successful close message.
      try {
        await refreshData();
      } catch (err) {
        setError(
          `Election was closed, but refreshing results failed: ${err.message}`
        );
      }
    } catch (err) {
      setError(`Unable to close the ballot queue: ${err.message}`);
    } finally {
      setBusy('');
    }
  }

  return (
    <section className="panel">
      <div className="eyebrow">Administrator view</div>

      <h2>Security checks and demo results</h2>

      <p>
        Results show first preferences only. This is not a federal election
        counting algorithm.
      </p>

      <div className="actions">
        <button
          type="button"
          onClick={flush}
          disabled={Boolean(busy) || closedThisSession}
        >
          {busy === 'closing'
            ? 'Closing and shuffling...'
            : closedThisSession
              ? 'Demo election closed'
              : 'Close demo ballot queue and shuffle'}
        </button>

        <button
          type="button"
          className="outline"
          onClick={load}
          disabled={Boolean(busy)}
        >
          {busy === 'loading'
            ? 'Loading results...'
            : 'Load results and check audit chain'}
        </button>
      </div>

      {feedback && (
        <p className="success" role="status">
          {feedback}
        </p>
      )}

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {result && (
        <>
          <h3>First-preference counts</h3>

          {Object.entries(result.counts).map(([key, value]) => (
            <p key={key}>
              {key}: <strong>{value}</strong>
            </p>
          ))}

          <p>
            Records rejected after integrity validation: {result.rejected}
          </p>
        </>
      )}

      {audit && (
        <p className={audit.valid ? 'success' : 'error'}>
          Audit chain: {audit.valid ? 'valid' : 'tampered or inconsistent'}
          {' '}({audit.entries ?? 'unknown'} entries)
        </p>
      )}
    </section>
  );
}
