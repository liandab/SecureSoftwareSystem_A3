const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const https=require('node:https');
const {execFileSync}=require('node:child_process');
const {createMtlsServer}=require('../src/mtls-results');

function fetchTls(port,options){
 return new Promise((resolve,reject)=>{
  const request=https.get({hostname:'localhost',port,path:'/results',minVersion:'TLSv1.3',...options},response=>{
   let body='';response.on('data',chunk=>body+=chunk);
   response.on('end',()=>resolve({status:response.statusCode,body}));
  });
  request.on('error',reject);
 });
}

test('mTLS exposes results only with a trusted client certificate',async t=>{
 try{execFileSync('openssl',['version'],{stdio:'ignore'});}catch{t.skip('OpenSSL unavailable');return;}
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'evp-mtls-'));
 let server;
 try{
  execFileSync(process.execPath,[path.resolve(__dirname,'../scripts/create-dev-mtls.js'),dir]);
  const ca=fs.readFileSync(path.join(dir,'client','ca.crt'));
  server=createMtlsServer(path.join(dir,'server'),async()=>({counts:{DEMO_A:1}}));
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=server.address().port;
  const approved=await fetchTls(port,{ca,cert:fs.readFileSync(path.join(dir,'client','client.crt')),
   key:fs.readFileSync(path.join(dir,'client','client.key'))});
  assert.equal(approved.status,200);
  assert.equal(JSON.parse(approved.body).counts.DEMO_A,1);
  await assert.rejects(fetchTls(port,{ca}),/certificate|alert|handshake|socket/i);
 }finally{
  if(server)await new Promise(resolve=>server.close(resolve));
  fs.rmSync(dir,{recursive:true,force:true});
 }
});
