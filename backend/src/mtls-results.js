const fs=require('node:fs');
const https=require('node:https');

function createMtlsServer(certDir,loadResults){
 return https.createServer({
  key:fs.readFileSync(`${certDir}/server.key`),
  cert:fs.readFileSync(`${certDir}/server.crt`),
  ca:fs.readFileSync(`${certDir}/ca.crt`),
  minVersion:'TLSv1.3',requestCert:true,rejectUnauthorized:true
 },async(req,res)=>{
  res.setHeader('Content-Type','application/json');
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET'||req.url!=='/results'){
   res.writeHead(404);res.end(JSON.stringify({error:'Not found'}));return;
  }
  if(!req.socket.authorized){res.writeHead(403);res.end(JSON.stringify({error:'Client certificate required'}));return;}
  try{res.writeHead(200);res.end(JSON.stringify(await loadResults()));}
  catch(err){console.error('mTLS report error:',err.message);res.writeHead(500);res.end(JSON.stringify({error:'Result sharing failed'}));}
 });
}
function startMtlsResults(){
 if(process.env.MTLS_RESULTS_ENABLED!=='1')return null;
 const {calculateResults}=require('./utils/results');
 const certDir=process.env.MTLS_CERT_DIR||'/app/tls';
 const server=createMtlsServer(certDir,calculateResults);
 const port=Number(process.env.MTLS_PORT||5443);
 server.listen(port,'0.0.0.0',()=>console.log(`mTLS result sharing enabled on port ${port}`));
 return server;
}
module.exports={createMtlsServer,startMtlsResults};
