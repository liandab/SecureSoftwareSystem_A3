# Team handover: work that must be verified before GitHub submission

**Main repository:** https://github.com/liandab/SecureSoftwareSystem_A3

This package is a shared AI-assisted release candidate, not 20 closed issues and not five students' finished individual work. The team must review it, own real fixes/tests, verify requirements and accurately declare assistance.

## Suggested ownership (agreed team mapping)

| Developer | SRs | Genuine review/implementation focus before sign-off |
|---|---|---|
| Krish | 01, 09, 16, 18 | Check TOTP enrolment, browser/session expiry, invalid JWT, role/session claims; implement missing tests or usability/security corrections. |
| Suhani | 02, 06, 12, 19 | Verify two SQL roles under Docker, test `GRANT` denial, voting eligibility/one-vote atomicity, and view column restrictions; resolve migration issues. |
| Kartikeya | 05, 07, 11, 17 | Attempt HMAC tampering before tally, audit-chain modifications, five-failure lockout, and API 429; add endpoint tests and audit coverage fixes. |
| Nivedita | 03, 04, 08, 20 | Check queue threshold, delayed ordering, AES-GCM tamper rejection and residual voter linkability; contribute meaningful privacy/crypto fixes and evidence. |
| Lian | 10, 13, 14, 15 | Execute local ECDSA rejection test, CSRF negative tests, timed restore, mTLS access without/with client cert; fix deployment/cert issues. |

## Safe Git flow

1. Confirm the **latest actual** `main` contents; do not overwrite newer teammate changes with an older ZIP.
2. Create a baseline/integration PR that *honestly identifies* the shared starter and its code provenance. Review secret exclusions and run tests before merge.
3. Each member pulls latest main and creates branches for genuine work (`feature/sr-XX-specific-work`).
4. Link the PR to the **real GitHub issue number** for the SR. SR-16 is not automatically `#16`.
5. Commit meaningful fixes, features and independently written or verified tests. Do not split formatting changes into fake commits. If changes are small because a fix is small, describe and evidence the impact rather than inflating the commit count.
6. Request teammate review. Run backend tests, Docker smoke test and negative security tests. Merge only after checking integration.
7. Capture issue-ID → files/PR → tested command → actual result/screenshots → unresolved limitations for the report.

The assignment expects *regular*, roughly comparable **meaningful** contributions. One team-wide initial import cannot replace genuine contributions from the other members. Co-writing, debugging, test implementation and integration work can all be valid if reflected accurately in the actual change history.

## Local demo verification checklist

- [ ] Create or extend `.env` (without sharing its contents).
- [ ] For prior Postgres volumes, run the role and election-control migrations from README.
- [ ] `docker compose up --build -d` works; `docker compose ps` shows healthy/started services.
- [ ] `cd backend && npm test` passes; note any OpenSSL skips on Windows.
- [ ] Voter and administrator can sign in with the correct TOTP codes.
- [ ] Ineligible, second-vote and post-close vote submissions are rejected.
- [ ] At least five encrypted votes enter the shuffle process with multiple enrolled test voters.
- [ ] Audit-chain checker detects tampered audit data in an isolated test DB.
- [ ] Reporting DB user cannot read `voters` or base `votes`; runtime user cannot SELECT stored votes.
- [ ] API limits, failed-login lockout, CSRF and role denials work.
- [ ] Client-certificate mTLS request succeeds; anonymous TLS request fails.
- [ ] Backup restores into a separate temporary DB and elapsed duration is captured.
- [ ] A signed update is staged and tampered update rejected.
- [ ] TLS1.3 between all required components and autoscaling requirements are evaluated; do not misrepresent gaps.

**Keep screenshots and logs free of passwords, TOTP secrets, session cookies and private keys.**
