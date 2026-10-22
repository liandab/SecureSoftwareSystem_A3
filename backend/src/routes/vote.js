const express=require('express');
const {pool}=require('../config/database');
const {requireAuth}=require('../middleware/auth');
const {requirePermission}=require('../middleware/rbac');
const {encrypt,voteHmac}=require('../utils/crypto');
const {releaseWhenFull}=require('../utils/shuffle');
const router=express.Router();
router.get('/ballot',requireAuth,requirePermission('read_ballot'),async(req,res,next)=>{
 try{
  const {rows}=await pool.query("SELECT id,name FROM candidates WHERE chamber='DEMO_HOUSE' AND electorate='DEMO' ORDER BY id");
  const election=await pool.query('SELECT is_open FROM election_control WHERE id=1');
  res.json({chamber:'DEMO_HOUSE',electorate:'DEMO',candidates:rows,alreadyVoted:req.user.has_voted,open:election.rows[0]?.is_open===true});
 }catch(err){next(err);}
});
router.post('/cast',requireAuth,requirePermission('cast_vote'),async(req,res,next)=>{
 const client=await pool.connect();
 try{
  const {preferences}=req.body||{};
  const candidates=await client.query("SELECT id FROM candidates WHERE chamber='DEMO_HOUSE' AND electorate='DEMO'");
  const allowed=candidates.rows.map(x=>x.id);
  if(!Array.isArray(preferences)||preferences.length!==allowed.length||!preferences.every(x=>typeof x==='string')||
     new Set(preferences).size!==allowed.length||preferences.some(x=>!allowed.includes(x)))return res.status(400).json({error:'Rank all available candidates once'});
  await client.query('BEGIN');
  const election=await client.query('SELECT is_open FROM election_control WHERE id=1 FOR SHARE');
  if(!election.rows[0]?.is_open){await client.query('ROLLBACK');return res.status(403).json({error:'Demo election is closed'});}
  const voters=await client.query('SELECT status,has_voted,role FROM voters WHERE id=$1 FOR UPDATE',[req.user.id]);
  if(!voters.rowCount||voters.rows[0].role!=='voter'||voters.rows[0].status!=='enrolled'||voters.rows[0].has_voted){
   await client.query('ROLLBACK');return res.status(403).json({error:'Not eligible or vote already cast'});
  }
  const chamber='DEMO_HOUSE',electorate='DEMO';
  const encrypted=encrypt({preferences},`${chamber}:${electorate}`);
  const record={chamber,electorate,...encrypted};
  record.integrity_hash=voteHmac(record);
  await client.query(`INSERT INTO vote_queue(chamber,electorate,iv,ciphertext,auth_tag,integrity_hash)
   VALUES($1,$2,$3,$4,$5,$6)`,[record.chamber,record.electorate,record.iv,record.ciphertext,record.auth_tag,record.integrity_hash]);
  await client.query('UPDATE voters SET has_voted=TRUE WHERE id=$1',[req.user.id]);
  await client.query('COMMIT');
  // The vote is accepted even if moving a queued encrypted record fails.
  // It remains in the durable queue for the next flush/recovery.
  try{await releaseWhenFull();}catch(error){console.error('Deferred shuffle retry:',error.message);}
  return res.status(201).json({ok:true,message:'Encrypted ballot safely queued (demonstration only)'});
 }catch(err){await client.query('ROLLBACK').catch(()=>{});next(err);}
 finally{client.release();}
});
module.exports=router;
