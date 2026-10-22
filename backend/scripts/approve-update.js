// Only verified files can enter the staged-update directory. This never executes an archive.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {verifyUpdate}=require('./verify-update');
function approveUpdate(archive,signature,trustedPublicKey,outDir){
 if(!verifyUpdate(archive,signature,trustedPublicKey))throw new Error('Update rejected: signature check failed');
 fs.mkdirSync(outDir,{recursive:true});
 const digest=crypto.createHash('sha256').update(fs.readFileSync(archive)).digest('hex');
 const destination=path.join(outDir,`verified-${digest}.bin`);
 fs.copyFileSync(archive,destination,fs.constants.COPYFILE_EXCL);
 return destination;
}
if(require.main===module){
 try{
  const [file,sig,dir]=process.argv.slice(2);
  const key=process.env.TRUSTED_UPDATE_PUBLIC_KEY_FILE;
  if(!file||!sig||!dir||!key)throw new Error('Set TRUSTED_UPDATE_PUBLIC_KEY_FILE and pass ARCHIVE SIG OUTDIR');
  console.log('Staged verified update:',approveUpdate(file,sig,key,dir));
 }catch(err){console.error(err.message);process.exitCode=1;}
}
module.exports={approveUpdate};
