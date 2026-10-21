const crypto = require('node:crypto');
function canonical(value){
 if(Array.isArray(value))return value.map(canonical);
 if(value && typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])]));
 return value;
}
function eventHash(previousHash,event){
 const key=Buffer.from(process.env.AUDIT_HMAC_KEY || '', 'base64');
 if(key.length!==32) throw new Error('AUDIT_HMAC_KEY must be 32 bytes');
 return crypto.createHmac('sha256',key).update(JSON.stringify({previousHash,event:canonical(event)})).digest('hex');
}
async function appendAudit(client,event){
 // Advisory lock makes even the first event serialised across concurrent requests.
 await client.query('SELECT pg_advisory_xact_lock(124567)');
 const {rows}=await client.query('SELECT entry_hash FROM audit_logs ORDER BY id DESC LIMIT 1');
 const previousHash=rows[0]?.entry_hash || 'GENESIS';
 const entryHash=eventHash(previousHash,event);
 await client.query('INSERT INTO audit_logs(event,previous_hash,entry_hash) VALUES ($1,$2,$3)',[JSON.stringify(event),previousHash,entryHash]);
}
async function verifyChain(client){
 const {rows}=await client.query('SELECT id,event,previous_hash,entry_hash FROM audit_logs ORDER BY id');
 let previousHash='GENESIS';
 for(const row of rows){
   if(row.previous_hash!==previousHash || row.entry_hash!==eventHash(previousHash,row.event)) return {valid:false,first_bad_id:row.id};
   previousHash=row.entry_hash;
 }
 return {valid:true,entries:rows.length};
}
module.exports = {appendAudit,verifyChain,eventHash};
