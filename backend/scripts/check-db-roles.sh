#!/bin/sh
set -eu
# Run with the backup container's DB owner credentials; verifies actual GRANTs.
expect_denied(){
 label="$1"; sql="$2"
 if psql -v ON_ERROR_STOP=1 -qAtc "$sql" >/dev/null 2>&1; then
  echo "FAIL: $label was unexpectedly allowed" >&2;exit 1
 fi
 echo "PASS: $label denied"
}
expect_denied 'report reader access to voters' 'SET ROLE evp_report_reader; SELECT COUNT(*) FROM voters;'
expect_denied 'report reader access to stored votes' 'SET ROLE evp_report_reader; SELECT COUNT(*) FROM votes;'
expect_denied 'application role reading stored votes' 'SET ROLE evp_app; SELECT COUNT(*) FROM votes;'
psql -v ON_ERROR_STOP=1 -qAtc 'SET ROLE evp_report_reader; SELECT COUNT(*) FROM vote_crypto_view;' >/dev/null
echo 'PASS: report reader may query the encrypted-only view'
psql -v ON_ERROR_STOP=1 -qAtc 'SET ROLE evp_app; SELECT COUNT(*) FROM voter_public_info;' >/dev/null
echo 'PASS: runtime role may query restricted voter information'
