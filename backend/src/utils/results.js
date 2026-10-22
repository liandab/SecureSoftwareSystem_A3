const {reportPool}=require('../config/database');
const {decrypt,verifyVoteHmac}=require('./crypto');

async function calculateResults(){
 const ballots=await reportPool.query('SELECT * FROM vote_crypto_view');
 const candidates=await reportPool.query('SELECT id,name FROM candidates ORDER BY id');
 const counts=Object.fromEntries(candidates.rows.map(item=>[item.id,0]));
 let rejected=0;
 for(const row of ballots.rows){
  try{
   if(!verifyVoteHmac(row)){rejected++;continue;}
   const vote=decrypt(row,`${row.chamber}:${row.electorate}`);
   if(!Array.isArray(vote.preferences)||vote.preferences.length!==candidates.rowCount||
      new Set(vote.preferences).size!==candidates.rowCount||
      vote.preferences.some(id=>!Object.hasOwn(counts,id))){rejected++;continue;}
   counts[vote.preferences[0]]++;
  }catch{rejected++;}
 }
 return {counts,rejected,total:ballots.rowCount,calculation:'DEMO_FIRST_PREFERENCE_ONLY'};
}
module.exports={calculateResults};
