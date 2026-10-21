const crypto=require('node:crypto');
function issueCsrf(req,res){
 const token=crypto.randomBytes(24).toString('hex');
 res.cookie('evp_csrf',token,{httpOnly:false,sameSite:'strict',secure:process.env.NODE_ENV==='production',path:'/'});
 res.json({csrfToken:token});
}
function requireCsrf(req,res,next){
 if(['GET','HEAD','OPTIONS'].includes(req.method))return next();
 const expected=req.cookies.evp_csrf;
 const supplied=req.get('x-csrf-token');
 if(!expected||!supplied||expected.length!==supplied.length || !crypto.timingSafeEqual(Buffer.from(expected),Buffer.from(supplied)))return res.status(403).json({error:'CSRF check failed'});
 const origin=req.get('origin');
 const allowed=process.env.PUBLIC_ORIGIN || 'http://localhost:5173';
 if(origin && origin!==allowed)return res.status(403).json({error:'Origin rejected'});
 next();
}
module.exports={issueCsrf,requireCsrf};
