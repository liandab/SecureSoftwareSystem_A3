# Security requirements — code coverage and verification status

**Audit date:** 21 October 2026. This is a release-candidate checklist, NOT a declaration that every security requirement has passed the assessment rubric. “Unit tested” does not mean deployment verified. Docker + PostgreSQL integration and attack tests still need to run on a team member's machine.

| SR | Implemented code or current approach | Verification state / significant remaining gap |
|---|---|---|
| SR-01 | SHA1/30s TOTP required at login; encrypted demo secrets; replay-step update | Unit-tested algorithm. No self-service QR setup or recovery; API integration to check. |
| SR-02 | Enrolment status, voter role and atomic one-vote flag protected by row lock | Basic behaviour manually tested earlier; rerun against updated database roles. |
| SR-03 | No voter FK on queue/stored encrypted ballots; shuffled release | Partial. Traffic, timing, access logs and buffer timing can permit correlation. No formal unlinkability proof. |
| SR-04 | AES-256-GCM with random 16-byte IV, 128-bit tag; authenticated metadata | Crypto unit tests pass. **TLS 1.3 is not enforced between all frontend/backend/DB containers.** |
| SR-05 | HMAC-SHA256 over encrypted ballot fields; reject invalid before count | Tampering unit tests pass; database injection/tally attack tests needed. |
| SR-06 | Four roles enforced by Secure Factory permission object | Unit test confirms voter/admin denial; endpoint-level RBAC tests needed. |
| SR-07 | DB-backed hash chain of HMAC-SHA256 events, verification endpoint | Unit test on canonical hashing; confirm full privileged action coverage, log storage integrity. |
| SR-08 | Durable encrypted queue; after fifth queued vote, release one random ballot; flush rest on close | Code added; concurrent Postgres tests and metadata/privacy analysis pending. |
| SR-09 | DB last-activity check at 5m; frontend warning and logout; logout works after timeout | End-to-end idle-time tests needed on updated build. |
| SR-10 | P-256 signed update verification and staging gate pinned to a trusted public key | Positive/negative unit tests pass; automated actual installer gate not wired to deployment. |
| SR-11 | API-wide rate limiting: 100/15 min per IP | No actual autoscaling or measured 15-minute recovery; infrastructure DoS testing pending. |
| SR-12 | Separate `evp_app` runtime and read-only `evp_report_reader`; SQL GRANT/REVOKE | Role/bootstrap code added; **DB integration and permission-denial tests required**. |
| SR-13 | Parameterised queries, input checks, CSP via Helmet, CSRF double-submit cookie/header and Origin check | Manual/API XSS, CSRF and SQLi negative tests still required. |
| SR-14 | Hourly `pg_dump` backups, isolated temporary restore-check and elapsed time output | Recovery script added; **actual timed restore not executed here**. Real disaster recovery not proven. |
| SR-15 | TLS 1.3 HTTPS results service requires trusted client certificate | Real TLS handshake unit test passed (with/without client cert). Docker/Postgres result endpoint test still required. |
| SR-16 | bcrypt cost 12 for seeded accounts; compare on login | No self-service registration; verify response and hash handling in integration tests. |
| SR-17 | Per-account failed-login records, 5/15-min lockout; audit event on failure | DB/API lockout and event audit test needed. |
| SR-18 | RS256 JWT with issuer/audience/algorithm/30-minute expiry, httpOnly SameSite cookie, DB session validation | Code present. Test expiry, invalid signature, revocation and timeout end-to-end. |
| SR-19 | Views for voter info, summary, and restricted encrypted vote data; report role can read view, not `votes` table | Static grant smoke test passes; DB permissions/views integration test needed. |
| SR-20 | Buffer entries nulled on shuffle; AES-GCM temporary plaintext Buffers zeroed where feasible | **Partial**. JS strings/GC cannot promise complete memory erasure; document residual risk. |

**Election-close improvement:** `election_control` row with shared/exclusive locks avoids casting a new ballot after the demo election has closed. This is additive and should be tested on Docker.

**Priority before submission:** verify Docker startup with existing/new volumes, run all 13 offline tests, exercise mTLS both ways, test SQL role permissions and vote lifecycle, rehearse timed restore, and capture evidence for each relevant issue. Do not mark open gaps as complete.
