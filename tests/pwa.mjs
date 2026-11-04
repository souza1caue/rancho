import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
const manifest=JSON.parse(readFileSync('dist/manifest.webmanifest','utf8'));
assert.equal(manifest.display,'standalone');assert.equal(manifest.start_url,'/');assert.equal(manifest.scope,'/');
for(const icon of manifest.icons){assert.ok(existsSync('dist'+icon.src));const bytes=readFileSync('dist'+icon.src);assert.equal(bytes.readUInt32BE(16),Number(icon.sizes.split('x')[0]));assert.equal(bytes.readUInt32BE(20),Number(icon.sizes.split('x')[1]));}
assert.ok(manifest.icons.some(i=>i.purpose==='maskable'));
const html=readFileSync('dist/index.html','utf8');assert.match(html,/rel="manifest"/);assert.match(html,/apple-touch-icon/);
const handlers={},stores=new Map();let online=true,skipped=false;
const cacheFor=name=>{if(!stores.has(name))stores.set(name,new Map());const entries=stores.get(name);return {async addAll(requests){for(const req of requests){assert.ok(existsSync('dist'+new URL(req.url).pathname));entries.set(new URL(req.url).pathname,new Response(readFileSync('dist'+new URL(req.url).pathname)))}},async match(req){return entries.get(typeof req==='string'?req:new URL(req.url).pathname)?.clone()},async put(key,response){entries.set(typeof key==='string'?key:new URL(key.url).pathname,response.clone())}}};
class LocalRequest extends Request{constructor(url,options){super(new URL(url,'https://rancho.test'),options)}}
const caches={async open(name){return cacheFor(name)},async keys(){return [...stores.keys()]},async delete(name){return stores.delete(name)},async match(req){for(const name of stores.keys()){const hit=await cacheFor(name).match(req);if(hit)return hit}}};
const context={Request:LocalRequest,URL,caches,fetch:async req=>{if(!online)throw Error('offline');return new Response('network')},self:{location:{origin:'https://rancho.test'},addEventListener:(type,fn)=>handlers[type]=fn,skipWaiting:()=>{skipped=true}}};
vm.runInNewContext(readFileSync('dist/sw.js','utf8'),context);
let install;handlers.install({waitUntil:p=>install=p});await install;
assert.ok(stores.size);assert.equal(skipped,false,'Não ativar atualizações sem solicitação');
online=false;
const request=async(path,navigate=false)=>{let response;handlers.fetch({request:{url:'https://rancho.test'+path,method:'GET',mode:navigate?'navigate':'cors'},respondWith:p=>response=p});return response};
const offline=await request('/qualquer-pagina',true);assert.match(await offline.text(),/Rancho/);
online=true;const live=await request('/',true);assert.equal(await live.text(),'network','Priorizar a página publicada quando houver conexão');online=false;
const js='/assets/'+readdirSync('dist/assets').find(n=>n.endsWith('.js'));const response=await request(js);assert.ok((await response.text()).length>1000);
handlers.message({data:{type:'SKIP_WAITING'}});assert.equal(skipped,true);
stores.set('another-app-cache',new Map());let activated;handlers.activate({waitUntil:p=>activated=p});await activated;assert.ok(stores.has('another-app-cache'),'Preservar caches de outros aplicativos');
let externalIntercepted=false;handlers.fetch({request:{url:'https://fonts.googleapis.com/css',method:'GET'},respondWith:()=>externalIntercepted=true});assert.equal(externalIntercepted,false);
console.log('OK: manifesto, dimensões dos ícones, instalação do cache, navegação e arquivos offline, atualização solicitada e preservação de outros caches.');
