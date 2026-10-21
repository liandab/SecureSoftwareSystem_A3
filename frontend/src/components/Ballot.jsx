import {useState} from 'react';
import {api} from '../services/api';
export default function Ballot({ballot,onSubmitted}){
 const [preferences,setPreferences]=useState(()=>ballot.candidates.map(x=>x.id));
 const [error,setError]=useState('');const [busy,setBusy]=useState(false);
 function update(index,value){setPreferences(prev=>prev.map((x,i)=>i===index?value:x));}
 async function submit(e){
  e.preventDefault();setBusy(true);setError('');
  try{await api('/vote/cast',{method:'POST',body:JSON.stringify({preferences})});onSubmitted();}
  catch(err){setError(err.message);}finally{setBusy(false);}
 }
 return <section className="panel"><div className="eyebrow">Demo electorate</div><h2>Rank the candidates</h2>
 <p>List candidates in preference order, first choice at the top. This simplified ballot supports the software security demonstration.</p>
 {ballot.alreadyVoted?<div className="success">You have already submitted your ballot.</div>:!ballot.open?<div className="notice">This demo election is closed to new votes.</div>:
 <form onSubmit={submit}>{preferences.map((choice,index)=><label key={index}>Preference {index+1}
   <select value={choice} onChange={e=>update(index,e.target.value)}>{ballot.candidates.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
  </label>)}
  {error&&<div className="error" role="alert">{error}</div>}
  <button type="submit" disabled={busy || new Set(preferences).size!==preferences.length}>{busy?'Submitting…':'Submit demo ballot'}</button>
 </form>}
 </section>;
}
