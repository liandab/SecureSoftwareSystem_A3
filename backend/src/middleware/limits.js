const {rateLimit}=require('express-rate-limit');

// The broad limit protects the demo API; account lockout is handled separately in auth.js.
const apiLimit=rateLimit({
 windowMs:15*60*1000,limit:100,standardHeaders:'draft-7',legacyHeaders:false,
 message:{error:'Too many requests. Please try again later.'}
});
module.exports={apiLimit};
