import {useCallback,useEffect,useRef,useState} from 'react';
import {emptyData,normalize,equal,mergeData} from '../shared/data.js';
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
const keyFor=account=>account?'rancho-account-'+account.id:'origem-beta';
export default function useCloudData(initial){
  const [account,setAccount]=useState(()=>read('rancho-account',null));
  const [cached]=useState(()=>account?read(keyFor(account)+'-state',null):null);
  const [db,setDbState]=useState(()=>normalize(cached?.data||read(keyFor(account),account?emptyData():structuredClone(initial))));
  const [conflicts,setConflicts]=useState(()=>cached?.conflicts||(account?read(keyFor(account)+'-conflicts',[]):[]));
  const [status,setStatus]=useState(conflicts.length?'conflict':account?'pending':'local'),[error,setError]=useState(''),[revision,setRevision]=useState(0),[recovery,setRecovery]=useState('');
  const accountRef=useRef(account),dataRef=useRef(db),baseRef=useRef(cached?.base||(account?read(keyFor(account)+'-base',null):null)),busy=useRef(false),conflictRef=useRef(conflicts),generation=useRef(0),syncRef=useRef(null),retryDelay=useRef(1000);
  const persist=useCallback((data,user=accountRef.current)=>{if(user)localStorage.setItem(keyFor(user)+'-state',JSON.stringify({data,base:baseRef.current,conflicts:conflictRef.current}));else localStorage.setItem(keyFor(user),JSON.stringify(data));dataRef.current=data;setDbState(data)},[]);
  const setDb=useCallback(update=>{const next=normalize(typeof update==='function'?update(dataRef.current):update);try{persist(next);if(accountRef.current)setStatus('pending');setError('')}catch{setError('Não foi possível salvar neste aparelho. Exporte um backup antes de continuar.')}},[persist]);
  const setBase=(base,user)=>{baseRef.current=base;setRevision(base.revision)};
  const adopt=useCallback(user=>{
    generation.current++;accountRef.current=user;setAccount(user);const state=user?read(keyFor(user)+'-state',null):null;const pendingConflicts=state?.conflicts||(user?read(keyFor(user)+'-conflicts',[]):[]);conflictRef.current=pendingConflicts;setConflicts(pendingConflicts);setError('');
    if(user)localStorage.setItem('rancho-account',JSON.stringify(user));else localStorage.removeItem('rancho-account');
    baseRef.current=state?.base||(user?read(keyFor(user)+'-base',null):null);
    persist(normalize(state?.data||read(keyFor(user),user?emptyData():structuredClone(initial))),user);setStatus(pendingConflicts.length?'conflict':user?'pending':'local');
  },[initial,persist]);
  const sync=useCallback(async()=>{
    const user=accountRef.current,epoch=generation.current;
    if(!user||busy.current||conflictRef.current.length||!navigator.onLine||typeof fetch!=='function')return;
    busy.current=true;setStatus('syncing');
    try{
      const response=await fetch('/api/data',{cache:'no-store',credentials:'same-origin'});
      if(response.status===401){if(epoch===generation.current)setStatus('auth');return}const remote=await response.json();if(!response.ok)throw Error(remote.error||'Falha na sincronização.');if(epoch!==generation.current)return;
      const base=baseRef.current?.data||emptyData(),merged=mergeData(base,dataRef.current,normalize(remote.data));
      conflictRef.current=merged.conflicts;setBase({data:normalize(remote.data),revision:remote.revision},user);persist(merged.data,user);
      if(merged.conflicts.length){setConflicts(merged.conflicts);setStatus('conflict');return}
      if(equal(merged.data,remote.data)){retryDelay.current=1000;setStatus('synced');setError('');return}
      const sent=structuredClone(merged.data),result=await fetch('/api/data',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:remote.revision,data:sent})});
      if(epoch!==generation.current)return;
      if(result.status===401){setStatus('auth');return}
      if(result.status===409){setStatus('pending');return}
      const saved=await result.json();if(!result.ok)throw Error(saved.error||'Falha ao enviar registros.');
      retryDelay.current=1000;setBase({data:sent,revision:saved.revision},user);persist(dataRef.current,user);setStatus(equal(dataRef.current,sent)?'synced':'pending');setError('');
    }catch(e){if(epoch===generation.current){retryDelay.current=Math.min(60000,retryDelay.current*2);setError(e.message||'Sem conexão com o servidor.');setStatus('pending')}}finally{busy.current=false;if(epoch!==generation.current)setTimeout(()=>syncRef.current?.(),100)}
  },[persist]);
  syncRef.current=sync;
  useEffect(()=>{
    if(typeof fetch!=='function')return;
    let stopped=false;
    const check=async()=>{if(!navigator.onLine)return;try{const res=await fetch('/api/session',{cache:'no-store'});if(stopped)return;if(res.ok){const value=await res.json();if(accountRef.current?.id!==value.account.id)adopt(value.account);syncRef.current?.()}else if(res.status===401&&accountRef.current)setStatus('auth')}catch{}};
    check();
    const wake=()=>{if(document.visibilityState==='hidden')return;check();syncRef.current?.()};
    const timer=setInterval(()=>{if(document.visibilityState!=='hidden')wake()},30000);
    window.addEventListener('online',wake);window.addEventListener('focus',wake);window.addEventListener('pageshow',wake);document.addEventListener('visibilitychange',wake);
    return()=>{stopped=true;clearInterval(timer);window.removeEventListener('online',wake);window.removeEventListener('focus',wake);window.removeEventListener('pageshow',wake);document.removeEventListener('visibilitychange',wake)};
  },[adopt]);
  useEffect(()=>{if(!account||status!=='pending')return;const timer=setTimeout(()=>syncRef.current?.(),retryDelay.current);return()=>clearTimeout(timer)},[db,account,status]);
  const authenticate=async(mode,fields)=>{const res=await fetch('/api/'+mode,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(fields)});const value=await res.json();if(!res.ok)throw Error(value.error||'Não foi possível entrar.');adopt(value.account);setRecovery(value.recovery||'');await syncRef.current?.()};
  const logout=async()=>{if(!navigator.onLine)throw Error('Conecte-se para encerrar a sessão com segurança.');const res=await fetch('/api/logout',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});if(!res.ok&&res.status!==401)throw Error('Não foi possível sair.');adopt(null);setRecovery('')};
  const resolve=(conflict,choice)=>{
    const value=conflict[choice];setDb(data=>({...data,[conflict.kind]:[...data[conflict.kind].filter(r=>r.id!==conflict.id&&r.id!==conflict.otherId),...(value?[value]:[])]}));
    const rest=conflictRef.current.filter(c=>!(c.id===conflict.id&&c.kind===conflict.kind&&c.otherId===conflict.otherId));conflictRef.current=rest;persist(dataRef.current);setConflicts(rest);setStatus(rest.length?'conflict':'pending');
  };
  const importLocal=()=>{const local=normalize(read('origem-beta',emptyData()));const imported=mergeData(emptyData(),dataRef.current,local);if(imported.conflicts.length)throw Error('Há registros com o mesmo identificador. Use o backup para conferir os dados antes da importação.');const tags=imported.data.animals.map(a=>a.tag);if(new Set(tags).size!==tags.length)throw Error('Há animais diferentes com o mesmo brinco. Confira os cadastros antes de importar.');setDb(imported.data)};
  return {db,setDb,account,status,error,revision,recovery,clearRecovery:()=>setRecovery(''),authenticate,logout,sync,conflicts,resolve,importLocal};
}
