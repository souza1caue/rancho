const CACHE_NAME='__CACHE_NAME__';
const PRECACHE=__PRECACHE__;
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(PRECACHE.map(url=>new Request(url,{cache:'reload'})))));
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    // Mantém uma versão anterior para abas abertas. Nunca altera os dados do usuário.
    const old=(await caches.keys()).filter(key=>key.startsWith('rancho-shell-')&&key!==CACHE_NAME);
    await Promise.all(old.slice(0,-1).map(key=>caches.delete(key)));
  })());
});
self.addEventListener('message',event=>{
  if(event.data?.type==='SKIP_WAITING')self.skipWaiting();
});
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==self.location.origin)return;
  if(url.pathname.startsWith('/api/'))return;
  if(request.mode==='navigate'){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE_NAME);
      try{
        const response=await fetch(request);
        if(response.ok)cache.put('/index.html',response.clone());
        return response;
      }catch{
        return (await cache.match('/index.html'))||new Response('O Rancho ainda não foi preparado para uso offline. Conecte-se à internet e abra o aplicativo novamente.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
      }
    })());
    return;
  }
  if(PRECACHE.includes(url.pathname)||url.pathname.startsWith('/assets/')){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE_NAME);
      const cached=(await cache.match(url.pathname))||(await caches.match(request));
      return cached||fetch(request);
    })());
  }
});
