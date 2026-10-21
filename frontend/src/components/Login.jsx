import {useState} from 'react';
import {api} from '../services/api';
export default function Login({onLogin}){
 const [email,setEmail]=useState('demo.voter@localhost.test');
 const [password,setPassword]=useState('');
 const [code,setCode]=useState('');
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 async function submit(e){
  e.preventDefault();setBusy(true);setError('');
  try{const data=await api('/auth/login',{method:'POST',body:JSON.stringify({email,password,code})});onLogin(data.user);}catch(err){setError(err.message);}finally{setBusy(false);}
 }
 return <section className="panel login"><div className="eyebrow">Authentication</div><h2>Sign in to the demo</h2><p>This is a local learning prototype, not a government voting service.</p>
  <form onSubmit={submit}>
   <label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label>
   <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password"/></label>
   <label>Six-digit authenticator code<input inputMode="numeric" maxLength={6} pattern="[0-9]{6}" value={code} onChange={e=>setCode(e.target.value)} required/></label>
   {error && <div className="error" role="alert">{error}</div>}
   <button type="submit" disabled={busy}>{busy?'Checking…':'Sign in securely'}</button>
  </form><p className="helper">The first backend startup log contains local demo TOTP setup URIs. Use your own authenticator app and keep them private.</p>
 </section>;
}
