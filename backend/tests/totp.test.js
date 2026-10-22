const test=require('node:test');
const assert=require('node:assert/strict');
const {codeAt,verifyTotp,encodeBase32,decodeBase32}=require('../src/utils/totp');
const secret=encodeBase32(Buffer.from('12345678901234567890','utf8'));
test('Base32 encode/decode matches',()=>assert.equal(decodeBase32(secret).toString(),'12345678901234567890'));
test('RFC 6238 SHA1 first 6 digits at T=59 seconds',()=>assert.equal(codeAt(secret,1),'287082'));
test('TOTP replay is rejected',()=>{
 const step=1000;
 const code=codeAt(secret,step);
 assert.equal(verifyTotp(secret,code,-1,step*30000),step);
 assert.equal(verifyTotp(secret,code,step,step*30000),null);
});
