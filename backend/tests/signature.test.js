const test=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');const os=require('node:os');const path=require('node:path');
const {verifyUpdate}=require('../scripts/verify-update');
test('ECDSA P-256 signature accepts authentic update, rejects modified update',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'evp-update-'));
 try{
  const {publicKey,privateKey}=crypto.generateKeyPairSync('ec',{namedCurve:'prime256v1'});
  const update=path.join(dir,'package.zip');const sig=path.join(dir,'update.sig');const pub=path.join(dir,'trusted.pem');
  fs.writeFileSync(update,'trusted sample artifact');
  fs.writeFileSync(sig,crypto.sign('sha256',fs.readFileSync(update),privateKey));
  fs.writeFileSync(pub,publicKey.export({type:'spki',format:'pem'}));
  assert.equal(verifyUpdate(update,sig,pub),true);
  fs.writeFileSync(update,'modified sample artifact');
  assert.equal(verifyUpdate(update,sig,pub),false);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
