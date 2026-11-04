import {useEffect,useRef,useState} from 'react';

export default function usePwa(){
  const [installEvent,setInstallEvent]=useState(null),[installed,setInstalled]=useState(()=>Boolean(window.matchMedia?.('(display-mode: standalone)').matches||navigator.standalone)),[online,setOnline]=useState(navigator.onLine),[offlineReady,setOfflineReady]=useState(false),[waiting,setWaiting]=useState(null),[error,setError]=useState(''),[installing,setInstalling]=useState(false);
  const registration=useRef(null),reloadRequested=useRef(false);
  useEffect(()=>{
    const connection=()=>setOnline(navigator.onLine);
    const canInstall=event=>{event.preventDefault();setInstallEvent(event)};
    const didInstall=()=>{setInstalled(true);setInstallEvent(null);navigator.storage?.persist?.().catch(()=>{})};
    const mode=window.matchMedia?.('(display-mode: standalone)');
    const modeChange=()=>setInstalled(Boolean(mode?.matches||navigator.standalone));
    const controller=()=>{if(reloadRequested.current){reloadRequested.current=false;window.location.reload()}};
    window.addEventListener('online',connection);window.addEventListener('offline',connection);window.addEventListener('beforeinstallprompt',canInstall);window.addEventListener('appinstalled',didInstall);mode?.addEventListener?.('change',modeChange);
    let disposed=false,timer;
    if(import.meta.env.PROD&&'serviceWorker' in navigator){
      navigator.serviceWorker.addEventListener('controllerchange',controller);
      navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'}).then(reg=>{
        if(disposed)return;registration.current=reg;
        if(reg.waiting)setWaiting(reg.waiting);
        navigator.serviceWorker.ready.then(()=>{if(!disposed)setOfflineReady(true)});
        const watch=()=>{
          const worker=reg.installing;
          worker?.addEventListener('statechange',()=>{if(disposed)return;if(worker.state==='installed'){setOfflineReady(true);if(navigator.serviceWorker.controller)setWaiting(reg.waiting||worker)}if(worker.state==='redundant'&&!reg.active)setError('Não foi possível preparar o acesso offline. Conecte-se e tente novamente.');});
        };
        reg.addEventListener('updatefound',watch);if(reg.installing)watch();
        timer=setInterval(()=>{if(navigator.onLine)reg.update().catch(()=>{})},60*60*1000);
      }).catch(()=>{if(!disposed)setError('O acesso offline ainda não foi preparado. Conecte-se e reabra o aplicativo.');});
    }
    return()=>{disposed=true;clearInterval(timer);window.removeEventListener('online',connection);window.removeEventListener('offline',connection);window.removeEventListener('beforeinstallprompt',canInstall);window.removeEventListener('appinstalled',didInstall);mode?.removeEventListener?.('change',modeChange);navigator.serviceWorker?.removeEventListener('controllerchange',controller)};
  },[]);
  const install=async()=>{
    if(!installEvent||installing)return;
    setInstalling(true);setError('');
    try{await installEvent.prompt();const choice=await installEvent.userChoice;if(choice.outcome==='accepted')setInstallEvent(null);else setInstallEvent(null)}catch{setError('Use o menu do navegador para instalar o Rancho.')}finally{setInstalling(false)}
  };
  const update=()=>{
    if(!waiting)return;
    reloadRequested.current=true;
    const activated=()=>{if(waiting.state==='activated'&&reloadRequested.current){reloadRequested.current=false;window.location.reload()}};
    waiting.addEventListener('statechange',activated);
    waiting.postMessage({type:'SKIP_WAITING'});
    activated();
  };
  const checkUpdate=async()=>{setError('');try{await registration.current?.update()}catch{setError('Não foi possível verificar atualizações. Confira a conexão.')}};
  return {installed,online,offlineReady,waiting,error,installing,canInstall:Boolean(installEvent),install,update,checkUpdate};
}
