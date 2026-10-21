const test=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {approveUpdate}=require('../scripts/approve-update');

test('only authentic ECDSA P-256 updates enter the approved directory',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'evp-verify-'));
 try{
  const {privateKey,publicKey}=crypto.generateKeyPairSync('ec',{namedCurve:'prime256v1'});
  const archive=path.join(dir,'update.bin');const sig=path.join(dir,'signature.bin');
  const pub=path.join(dir,'trusted.pub');const staged=path.join(dir,'staged');
  fs.writeFileSync(archive,'version A');
  fs.writeFileSync(sig,crypto.sign('sha256',fs.readFileSync(archive),privateKey));
  fs.writeFileSync(pub,publicKey.export({format:'pem',type:'spki'}));
  const dest=approveUpdate(archive,sig,pub,staged);
  assert.equal(fs.readFileSync(dest,'utf8'),'version A');
  fs.writeFileSync(archive,'version B');
  assert.throws(()=>approveUpdate(archive,sig,pub,staged),/signature check failed/);
  assert.equal(fs.readdirSync(staged).length,1);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
