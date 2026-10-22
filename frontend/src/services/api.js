let csrfToken=null;
export async function api(path,options={}) {
  const method=options.method||'GET';
  if(method!=='GET' && !csrfToken){
    const response=await fetch('/api/auth/csrf',{credentials:'same-origin'});
    if(!response.ok)throw new Error('Unable to start secure request');
    csrfToken=(await response.json()).csrfToken;
  }
  const res=await fetch(`/api${path}`,{
    credentials:'same-origin',
    headers:{'Content-Type':'application/json',...(method==='GET'?{}:{'x-csrf-token':csrfToken})},
    ...options
  });
  const body=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error(body.error || `Request failed (${res.status})`);
  return body;
}
