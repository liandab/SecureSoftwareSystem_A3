const {Pool}=require('pg');
if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL missing');
const pool=new Pool({connectionString:process.env.DATABASE_URL,max:10});
// Results use a separate connection that cannot modify votes or voter records.
const reportPool=new Pool({connectionString:process.env.REPORT_DATABASE_URL||process.env.DATABASE_URL,max:3});
module.exports={pool,reportPool};
