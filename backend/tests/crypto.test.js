const test=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
process.env.VOTE_ENCRYPTION_KEY=crypto.randomBytes(32).toString('base64');
process.env.VOTE_HMAC_KEY=crypto.randomBytes(32).toString('base64');
process.env.TOTP_ENCRYPTION_KEY=crypto.randomBytes(32).toString('base64');
const {encrypt,decrypt,voteHmac,verifyVoteHmac,encryptTotp,decryptTotp}=require('../src/utils/crypto');
test('encrypt then decrypt a sample ballot',()=>{
 const payload={preferences:['DEMO_A','DEMO_B','DEMO_C']};
 const record=encrypt(payload,'DEMO_HOUSE:DEMO');
 assert.equal(Buffer.from(record.iv,'base64').length,16);
 assert.deepEqual(decrypt(record,'DEMO_HOUSE:DEMO'),payload);
});
test('AES-GCM rejects tampered ciphertext',()=>{
 const record=encrypt({preferences:['DEMO_A']},'DEMO_HOUSE:DEMO');
 record.ciphertext=Buffer.from('tampered').toString('base64');
 assert.throws(()=>decrypt(record,'DEMO_HOUSE:DEMO'));
});
test('HMAC detects tampered encrypted vote',()=>{
 const record={chamber:'DEMO_HOUSE',electorate:'DEMO',...encrypt({preferences:['DEMO_A']},'DEMO_HOUSE:DEMO')};
 record.integrity_hash=voteHmac(record);
 assert.equal(verifyVoteHmac(record),true);
 assert.equal(verifyVoteHmac({...record,electorate:'OTHER'}),false);
});
test('TOTP secret encryption round trip',()=>{
 assert.equal(decryptTotp(encryptTotp('JBSWY3DPEHPK3PXP')),'JBSWY3DPEHPK3PXP');
});
