const privileges={
 voter:['read_ballot','cast_vote'],
 aec_staff:['read_ballot','view_audit_summary'],
 delegate:['read_ballot','view_audit_summary'],
 administrator:['read_ballot','view_audit_summary','view_results','verify_audit']
};
class AccessObjectFactory{
 static forRole(role){return Object.freeze(new Set(privileges[role]||[]));}
}
function requirePermission(permission){return (req,res,next)=>AccessObjectFactory.forRole(req.user?.role).has(permission)?next():res.status(403).json({error:'Access denied'});}
module.exports={AccessObjectFactory,requirePermission};
