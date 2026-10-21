const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

test('report role is granted a restricted view, not base votes table',()=>{
 const script=fs.readFileSync(path.resolve(__dirname,'../sql/003_roles.sh'),'utf8');
 assert.match(script,/GRANT SELECT ON vote_crypto_view, candidates TO evp_report_reader/);
 assert.doesNotMatch(script,/GRANT SELECT ON votes[, ]/);
});
