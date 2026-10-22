const test=require('node:test');
const assert=require('node:assert/strict');
const {AccessObjectFactory,requirePermission}=require('../src/middleware/rbac');

test('voters cannot view results, administrators cannot cast ballots',()=>{
 assert.equal(AccessObjectFactory.forRole('voter').has('cast_vote'),true);
 assert.equal(AccessObjectFactory.forRole('voter').has('view_results'),false);
 assert.equal(AccessObjectFactory.forRole('administrator').has('cast_vote'),false);
 const check=requirePermission('view_results');
 let code;
 check({user:{role:'voter'}},{status(n){code=n;return this;},json(){}},()=>{});
 assert.equal(code,403);
});
