const bcrypt=require('bcryptjs');
const {Client}=require('pg');
const {generateSecret,uri}=require('../src/utils/totp');
const {encryptTotp}=require('../src/utils/crypto');
(async()=>{
 if(process.env.ENABLE_DEMO_SEED!=='1'){console.log('Demo seeding disabled.');return;}
 if(!process.env.DEMO_PASSWORD)throw new Error('Set DEMO_PASSWORD locally');
 const client=new Client({connectionString:process.env.DATABASE_URL});
 await client.connect();
 try{
   for(const [email,role,status] of [
    ['demo.voter@localhost.test','voter','enrolled'],
    ['demo.admin@localhost.test','administrator','enrolled']
   ]){
    const found=await client.query('SELECT 1 FROM voters WHERE email=$1',[email]);
    if(found.rowCount)continue;
    const secret=generateSecret();
    const hashed=await bcrypt.hash(process.env.DEMO_PASSWORD,12);
    await client.query('INSERT INTO voters (email,password_hash,role,status,totp_secret_enc) VALUES ($1,$2,$3,$4,$5)',
      [email,hashed,role,status,encryptTotp(secret)]);
    console.log(`DEMO ACCOUNT CREATED: ${email}`);
    console.log(`TOTP enrollment URI (use local authenticator; do not share): ${uri(secret,email)}`);
   }
 }finally{await client.end();}
})().catch(err=>{console.error(err);process.exit(1);});
