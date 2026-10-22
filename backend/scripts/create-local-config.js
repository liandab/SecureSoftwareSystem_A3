const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const envFile=path.join(root,'.env');
const keydir=path.resolve(__dirname,'../secrets');
if(fs.existsSync(envFile)) {
 const existing=fs.readFileSync(envFile,'utf8');
 const additional=[];
 if(!/^EVP_APP_PASSWORD=/m.test(existing))additional.push(`EVP_APP_PASSWORD=${crypto.randomBytes(20).toString('hex')}`);
 if(!/^EVP_REPORT_PASSWORD=/m.test(existing))additional.push(`EVP_REPORT_PASSWORD=${crypto.randomBytes(20).toString('hex')}`);
 if(!/^MTLS_RESULTS_ENABLED=/m.test(existing))additional.push('MTLS_RESULTS_ENABLED=1');
 if(additional.length)fs.appendFileSync(envFile,`\n${additional.join('\n')}\n`);
 console.log('Local config preserved. Added any missing database-role and mTLS settings.');process.exit(0);
}
fs.mkdirSync(keydir,{recursive:true});
const {privateKey,publicKey}=crypto.generateKeyPairSync('rsa',{modulusLength:2048,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});
fs.writeFileSync(path.join(keydir,'jwt_private.pem'),privateKey,{mode:0o600});
fs.writeFileSync(path.join(keydir,'jwt_public.pem'),publicKey,{mode:0o644});
const rnd=()=>crypto.randomBytes(32).toString('base64');
const password=crypto.randomBytes(14).toString('base64url');
fs.writeFileSync(envFile,`# DEVELOPMENT ONLY. Never commit to GitHub.\nNODE_ENV=development\nENABLE_DEMO_SEED=1\nPUBLIC_ORIGIN=http://localhost:5173\nDB_PASSWORD=${crypto.randomBytes(20).toString('hex')}\nVOTE_ENCRYPTION_KEY=${rnd()}\nVOTE_HMAC_KEY=${rnd()}\nAUDIT_HMAC_KEY=${rnd()}\nTOTP_ENCRYPTION_KEY=${rnd()}\nDEMO_PASSWORD=${password}\nEVP_APP_PASSWORD=${crypto.randomBytes(20).toString('hex')}\nEVP_REPORT_PASSWORD=${crypto.randomBytes(20).toString('hex')}\nMTLS_RESULTS_ENABLED=1\n` ,{mode:0o600});
console.log('Created local .env and JWT keys. These are ignored by Git.');
console.log('Demo voter: demo.voter@localhost.test');
console.log('Demo administrator: demo.admin@localhost.test');
console.log('Local demo password (keep private):',password);
console.log('Run docker compose up --build; first-run logs show TOTP setup details.');
