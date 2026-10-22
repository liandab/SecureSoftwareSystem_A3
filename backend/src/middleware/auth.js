const jwt = require('jsonwebtoken');
const crypto = require('node:crypto');
const fs = require('node:fs');
const {pool}=require('../config/database');
const privateKey=()=>fs.readFileSync(process.env.JWT_PRIVATE_KEY_FILE,'utf8');
const publicKey=()=>fs.readFileSync(process.env.JWT_PUBLIC_KEY_FILE,'utf8');
async function startSession(user){
 const sessionId=crypto.randomUUID();
 const expiry=new Date(Date.now()+30*60000);
 await pool.query('INSERT INTO sessions(id,voter_id,expires_at) VALUES($1,$2,$3)',[sessionId,user.id,expiry]);
 const token=jwt.sign({sub:user.id,role:user.role,jti:sessionId},privateKey(),{algorithm:'RS256',expiresIn:'30m',issuer:'evp-demo',audience:'evp-client'});
 return token;
}
async function requireAuth(req,res,next){
 try{
   const token=req.cookies.evp_session;
   if(!token) return res.status(401).json({error:'Authentication required'});
   const payload=jwt.verify(token,publicKey(),{algorithms:['RS256'],issuer:'evp-demo',audience:'evp-client'});
   // Update only active sessions; JWT validity alone cannot bypass 5-minute idle timeout.
   const {rows}=await pool.query(`UPDATE sessions SET last_activity=now() WHERE id=$1 AND voter_id=$2
    AND last_activity > now()-interval '5 minutes' AND expires_at>now() RETURNING voter_id`,[payload.jti,payload.sub]);
   if(!rows.length) return res.status(401).json({error:'Session expired'});
   const result=await pool.query('SELECT id,email,role,status,has_voted FROM voter_public_info WHERE id=$1',[payload.sub]);
   if(!result.rows.length||result.rows[0].status==='disabled') return res.status(401).json({error:'Account unavailable'});
   req.user=result.rows[0]; req.sessionId=payload.jti;
   next();
 }catch(err){if(err.name==='TokenExpiredError'||err.name==='JsonWebTokenError')return res.status(401).json({error:'Invalid or expired session'});next(err);}
}
function requireRole(...roles){return (req,res,next)=>roles.includes(req.user?.role)?next():res.status(403).json({error:'Access denied'});}
module.exports={startSession,requireAuth,requireRole};
