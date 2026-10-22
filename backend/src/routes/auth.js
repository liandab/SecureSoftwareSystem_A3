const express=require('express');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
const fs=require('node:fs');
const {pool}=require('../config/database');
const {decryptTotp}=require('../utils/crypto');
const {verifyTotp}=require('../utils/totp');
const {startSession,requireAuth}=require('../middleware/auth');
const {appendAudit}=require('../utils/audit');
const router=express.Router();
const genericError='Incorrect credentials or verification code';
async function record(event){
 const client=await pool.connect();
 try{await client.query('BEGIN');await appendAudit(client,event);await client.query('COMMIT');}
 catch(err){await client.query('ROLLBACK');throw err;}
 finally{client.release();}
}
router.post('/login',async(req,res,next)=>{
 try{
   const {email,password,code}=req.body||{};
   if(typeof email!=='string'||email.length>254||typeof password!=='string'||password.length>200||typeof code!=='string') return res.status(400).json({error:'Missing or invalid login details'});
   const normalized=email.trim().toLowerCase();
   const count=await pool.query(`SELECT count(*)::int AS failures FROM login_failures WHERE email=$1 AND attempted_at>now()-interval '15 minutes'`,[normalized]);
   if(count.rows[0].failures>=5) return res.status(429).json({error:'Too many failed attempts. Try again later.'});
   const users=await pool.query('SELECT id,email,password_hash,totp_secret_enc,last_totp_step,role,status FROM voters WHERE email=$1',[normalized]);
   const user=users.rows[0];
   const dummy='$2a$12$IEIUwceHoUe3wK9RjD4CbuukcrYoIQdjQo/rq0VKx2OXWJWyNJvUK';
   const match=await bcrypt.compare(password,user?.password_hash || dummy);
   let step=null;
   if(user && match && user.status!=='disabled')step=verifyTotp(decryptTotp(user.totp_secret_enc),code,user.last_totp_step);
   if(!user||!match||step===null||user.status==='disabled'){
     await pool.query('INSERT INTO login_failures(email) VALUES($1)',[normalized]);
     await record({action:'login_failed',email:normalized});
     return res.status(401).json({error:genericError});
   }
   const update=await pool.query('UPDATE voters SET last_totp_step=$1 WHERE id=$2 AND last_totp_step<$1 RETURNING id',[step,user.id]);
   if(!update.rowCount)return res.status(401).json({error:genericError});
   await pool.query('DELETE FROM login_failures WHERE email=$1',[normalized]);
   const token=await startSession(user);
   res.cookie('evp_session',token,{httpOnly:true,sameSite:'strict',secure:process.env.NODE_ENV==='production',maxAge:30*60*1000,path:'/'});
   await record({action:'login_success',role:user.role});
   return res.json({user:{email:user.email,role:user.role,status:user.status}});
 }catch(err){next(err);}
});
router.get('/me',requireAuth,(req,res)=>res.json({user:req.user}));
router.post('/logout',async(req,res,next)=>{
 try{
  // Expired sessions must still be able to clear their own cookie.
  const token=req.cookies.evp_session;
  if(token){
   try{
    const verified=jwt.verify(token,fs.readFileSync(process.env.JWT_PUBLIC_KEY_FILE,'utf8'),{
     algorithms:['RS256'],issuer:'evp-demo',audience:'evp-client',ignoreExpiration:true
    });
    if(verified.jti)await pool.query('DELETE FROM sessions WHERE id=$1',[verified.jti]);
   }catch{ /* Don't block logout just because the session is already invalid. */ }
  }
  res.clearCookie('evp_session',{sameSite:'strict',path:'/'});
  res.json({ok:true});
 }catch(err){next(err);}
});
module.exports=router;
