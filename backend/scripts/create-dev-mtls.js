// Local demonstration CA. These keys must never enter Git or be reused in production.
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const root=process.argv[2]||'/tls';
const server=path.join(root,'server');
const client=path.join(root,'client');
fs.mkdirSync(server,{recursive:true});
fs.mkdirSync(client,{recursive:true});
const caKey=path.join(root,'ca.key');
const caCert=path.join(root,'ca.crt');
if([caCert,path.join(server,'ca.crt'),path.join(server,'server.key'),path.join(server,'server.crt'),path.join(client,'ca.crt'),path.join(client,'client.key'),path.join(client,'client.crt')].every(file=>fs.existsSync(file))){
 console.log('Existing local mTLS certificates found.');process.exit(0);
}
function openssl(...args){execFileSync('openssl',args,{stdio:'pipe'});}
// Rotate together if any certificate is missing: a new CA invalidates previous signed keys.
for(const dir of [server,client])for(const name of fs.readdirSync(dir))fs.rmSync(path.join(dir,name),{force:true});
for(const name of ['ca.key','ca.crt','ca.srl'])fs.rmSync(path.join(root,name),{force:true});
openssl('genrsa','-out',caKey,'3072');
openssl('req','-x509','-new','-sha256','-key',caKey,'-out',caCert,'-days','30','-subj','/CN=EVP Classroom Demo CA');
function issue(dir,name,subject,extensions){
 const key=path.join(dir,name+'.key');const csr=path.join(dir,name+'.csr');const cert=path.join(dir,name+'.crt');
 const ext=path.join(dir,name+'.ext');
 fs.writeFileSync(ext,extensions);
 openssl('req','-new','-newkey','rsa:2048','-nodes','-keyout',key,'-out',csr,'-subj',subject);
 openssl('x509','-req','-in',csr,'-CA',caCert,'-CAkey',caKey,'-CAcreateserial','-out',cert,'-days','30','-sha256','-extfile',ext);
 fs.rmSync(csr);fs.rmSync(ext);
}
issue(server,'server','/CN=localhost','subjectAltName=DNS:localhost,IP:127.0.0.1\nextendedKeyUsage=serverAuth\n');
issue(client,'client','/CN=evp-result-reader','extendedKeyUsage=clientAuth\n');
fs.copyFileSync(caCert,path.join(server,'ca.crt'));
fs.copyFileSync(caCert,path.join(client,'ca.crt'));
for(const file of [caKey,path.join(server,'server.key'),path.join(client,'client.key')])fs.chmodSync(file,0o600);
console.log('Created local 30-day demo CA, server certificate and client certificate. No secrets printed.');
