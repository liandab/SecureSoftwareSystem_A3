import {useEffect,useRef,useState} from 'react';
import Login from './components/Login';
import Ballot from './components/Ballot';
import Admin from './components/Admin';
import {api} from './services/api';
import './styles.css';
export default function App(){
 const [user,setUser]=useState(null);
 const [ballot,setBallot]=useState(null);
 const [notice,setNotice]=useState('');
 const [warning,setWarning]=useState(false);
 const latest=useRef(Date.now());const lastPing=useRef(0);
 async function refresh(){try{const {user:u}=await api('/auth/me');setUser(u);}catch{setUser(null);}}
 useEffect(()=>{refresh();},[]);
 useEffect(()=>{
  if(!user)return;
  latest.current=Date.now();
  const onActivity=()=>{
   latest.current=Date.now();setWarning(false);
   if(Date.now()-lastPing.current>45000){lastPing.current=Date.now();api('/auth/me').catch(()=>{setUser(null);setBallot(null);});}
  };
  const events=['pointerdown','keydown','touchstart'];
  for(const name of events)window.addEventListener(name,onActivity);
  const timer=setInterval(()=>{const elapsed=Date.now()-latest.current;
   if(elapsed>=300000){api('/auth/logout',{method:'POST'}).catch(()=>{});setUser(null);setBallot(null);setNotice('Logged out after inactivity.');}
   else if(elapsed>=240000)setWarning(true);
  },1000);
  return()=>{clearInterval(timer);for(const name of events)window.removeEventListener(name,onActivity);};
 },[user?.id,user?.email]);
 useEffect(()=>{if(user?.role==='voter')loadBallot();else setBallot(null);},[user?.role,user?.has_voted]);
 async function loadBallot(){try{setBallot(await api('/vote/ballot'));}catch(err){setNotice(err.message);}}
 async function logout(){try{await api('/auth/logout',{method:'POST'});}catch{}setUser(null);setBallot(null);setNotice('Signed out.');}
 return <div className="page"><header><div className="brand">EVP <span>Learning prototype</span></div><div className="right">{user?<><span>{user.email}</span><button className="outline" onClick={logout}>Sign out</button></>:<span>INTE2667 · RMIT</span>}</div></header>
  <main><div className="intro"><div className="eyebrow">Secure Software Systems / Assignment 3</div><h1>Electronic Voting Platform</h1><p>Security-focused classroom demonstration with authenticated access, vote encryption, and administrative integrity checking.</p></div>
   {warning&&user&&<div className="notice">Session will expire after five minutes of inactivity.</div>}
   {notice&&<div className="notice">{notice}</div>}
   {!user?<Login onLogin={u=>{setNotice('');setUser(u);}}/>:user.role==='voter'?(ballot?<Ballot ballot={ballot} onSubmitted={()=>{setNotice('Demo vote submitted.');refresh();loadBallot();}}/>:<div className="panel">Loading the ballot…</div>):<Admin/>}
   <p className="disclaimer">For coursework testing with synthetic data only. Do not use for real elections.</p>
  </main></div>;
}
