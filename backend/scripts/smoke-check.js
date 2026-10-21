// Quick unauthenticated checks against a running local Docker demo.
const root=process.env.EVP_URL||'http://localhost:5173';
async function check(path,options,expected){
 const result=await fetch(`${root}/api${path}`,options);
 if(result.status!==expected)throw new Error(`${path}: expected ${expected}, received ${result.status}`);
 console.log('PASS',result.status,path);
}
(async()=>{
 await check('/health',{},200);
 await check('/vote/ballot',{},401);
 await check('/admin/results',{},401);
 await check('/vote/cast',{method:'POST',headers:{'content-type':'application/json'},body:'{"preferences":[]}'},403);
 console.log('Smoke checks passed; authenticated scenarios still require manual/API tests.');
})().catch(err=>{console.error('Smoke check failed:',err.message);process.exitCode=1;});
