const test=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
process.env.AUDIT_HMAC_KEY=crypto.randomBytes(32).toString('base64');
const {eventHash}=require('../src/utils/audit');
test('Audit event serialization remains stable when object key order changes',()=>{
 const first={action:'login_success',role:'voter'};
 const reordered={role:'voter',action:'login_success'};
 assert.equal(eventHash('GENESIS',first),eventHash('GENESIS',reordered));
 assert.notEqual(eventHash('GENESIS',first),eventHash('GENESIS',{role:'administrator',action:'login_success'}));
});

const {verifyChain}=require('../src/utils/audit');
test('Audit checker detects a modified event in a hash-chained record',async()=>{
 const first={action:'login_success',role:'voter'};
 const second={action:'view_results',role:'administrator'};
 const a=eventHash('GENESIS',first);
 const b=eventHash(a,second);
 const records=[{id:1,event:first,previous_hash:'GENESIS',entry_hash:a},
                {id:2,event:second,previous_hash:a,entry_hash:b}];
 const client={query:async()=>({rows:records})};
 assert.equal((await verifyChain(client)).valid,true);
 records[0].event={action:'login_success',role:'administrator'};
 assert.deepEqual(await verifyChain(client),{valid:false,first_bad_id:1});
});
