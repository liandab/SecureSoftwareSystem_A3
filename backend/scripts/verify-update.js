// Usage: node scripts/verify-update.js UPDATE_FILE SIGNATURE_FILE TRUSTED_ECDSA_PUBLIC_KEY
// Reject unsigned or modified update packages before installation.
const {readFileSync}=require('node:fs');
const crypto=require('node:crypto');
function verifyUpdate(file,sig,pub){
  const trusted=crypto.createPublicKey(readFileSync(pub));
  if(trusted.asymmetricKeyType!=='ec'||trusted.asymmetricKeyDetails?.namedCurve!=='prime256v1')return false;
  return crypto.verify('sha256',readFileSync(file),trusted,readFileSync(sig));
}
if(require.main===module){
 try{
  const [file,signature,key]=process.argv.slice(2);
  if(!file||!signature||!key)throw new Error('Expected update, detached signature, public key');
  if(!verifyUpdate(file,signature,key)){console.error('UPDATE REJECTED: signature invalid');process.exitCode=1;}
  else console.log('Signature verified. Update package is authentic to this trusted key.');
 }catch(err){console.error('UPDATE REJECTED:',err.message);process.exitCode=1;}
}
module.exports={verifyUpdate};
