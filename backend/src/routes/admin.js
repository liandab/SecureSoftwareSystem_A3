const express=require('express');
const {pool}=require('../config/database');
const {requireAuth}=require('../middleware/auth');
const {requirePermission}=require('../middleware/rbac');
const {calculateResults}=require('../utils/results');
const {appendAudit,verifyChain}=require('../utils/audit');
const {flushBallots}=require('../utils/shuffle');
const router=express.Router();
async function logAdminAction(action,role){
 const client=await pool.connect();
 try{
  await client.query('BEGIN');
  await appendAudit(client,{action,role});
  await client.query('COMMIT');
 }catch(err){await client.query('ROLLBACK').catch(()=>{});throw err;}
 finally{client.release();}
}

router.post('/flush',requireAuth,requirePermission('view_results'),async(req,res,next)=>{
 const client=await pool.connect();
 try{
  await client.query('BEGIN');
  // Close voting while holding the same lock that vote submission checks.
  await client.query('SELECT is_open FROM election_control WHERE id=1 FOR UPDATE');
  await client.query('UPDATE election_control SET is_open=false,closed_at=COALESCE(closed_at,now()) WHERE id=1');
  await appendAudit(client,{action:'close_ballot',role:req.user.role});
  await client.query('COMMIT');
  res.json(await flushBallots());
 }catch(err){await client.query('ROLLBACK').catch(()=>{});next(err);}
 finally{client.release();}
});
router.get('/results',requireAuth,requirePermission('view_results'),async(req,res,next)=>{
 try{const results=await calculateResults();await logAdminAction('view_results',req.user.role);res.json(results);}catch(err){next(err);}
});
router.get('/audit-check',requireAuth,requirePermission('verify_audit'),async(req,res,next)=>{
 try{const validation=await verifyChain(pool);await logAdminAction('verify_audit',req.user.role);res.json(validation);}catch(err){next(err);}
});
module.exports=router;
