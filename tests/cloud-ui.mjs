import {JSDOM} from 'jsdom';
import {readFileSync,readdirSync} from 'node:fs';
import assert from 'node:assert/strict';
import {emptyData} from '../shared/data.js';
let logged=false,network=true,remote=emptyData(),revision=0;
const account={id:'account-test',username:'produtor',name:'Produtor teste'};
const fakeFetch=async(url,opts={})=>{
  if(!network)throw Error('offline');
  let status=200,value;
  if(url==='/api/session'){value={account};if(!logged)status=401}
  else if(url==='/api/login'){logged=true;value={account}}
  else if(url==='/api/data'&&opts.method==='POST'){const b=JSON.parse(opts.body);if(b.revision!==revision){status=409;value={data:remote,revision}}else{remote=structuredClone(b.data);revision++;value={revision}}}
  else if(url==='/api/data')value={data:structuredClone(remote),revision};
  else throw Error('Unexpected request '+url);
  return new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
};
const dom=new JSDOM('<div id="root"></div>',{url:'https://rancho.test',runScripts:'dangerously',pretendToBeVisual:true,beforeParse(w){w.structuredClone=structuredClone;w.scrollTo=()=>{};w.fetch=fakeFetch;w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false}}});
const w=dom.window;w.eval(readFileSync('dist/assets/'+readdirSync('dist/assets').find(n=>n.endsWith('.js')),'utf8'));
const wait=(n=100)=>new Promise(r=>setTimeout(r,n));
const click=text=>{const b=[...w.document.querySelectorAll('button')].find(b=>b.textContent.trim()===text);assert.ok(b,text);b.click()};
const fill=(name,value)=>{const el=w.document.querySelector('[name="'+name+'"]');assert.ok(el,name);el.value=value};
const submit=form=>form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
await wait();click('Gestão');await wait();click('Configurações e backup');await wait();fill('username','produtor');fill('password','senha de teste longa');submit(w.document.querySelector('.cloud-panel form'));await wait(250);assert.equal(w.document.querySelector('.account-summary strong').textContent,'Produtor teste · produtor');
network=false;Object.defineProperty(w.navigator,'onLine',{value:false,configurable:true});w.dispatchEvent(new w.Event('offline'));
click('Animais');await wait();click('Cadastrar animal');await wait();fill('tag','010');fill('name','Vaca offline');fill('birth','2024-01-01');fill('lot','Lote 01');fill('weight','400');submit(w.document.querySelector('form.form'));await wait(1200);
assert.equal(remote.animals.length,0);let local=JSON.parse(w.localStorage.getItem('rancho-account-account-test'));assert.equal(local.animals[0].name,'Vaca offline');assert.ok(!w.localStorage.getItem('origem-beta')?.includes('Vaca offline'));
remote.tasks.push({id:'remote-task',date:'2026-11-04',title:'Outro aparelho',done:false});revision++;
network=true;Object.defineProperty(w.navigator,'onLine',{value:true,configurable:true});w.dispatchEvent(new w.Event('online'));await wait(350);assert.equal(remote.animals.length,1);assert.equal(remote.tasks.length,1);assert.equal(revision,2);
network=false;Object.defineProperty(w.navigator,'onLine',{value:false,configurable:true});w.dispatchEvent(new w.Event('offline'));w.document.querySelector('tbody tr').click();await wait();fill('weight','450');submit(w.document.querySelector('.animal-detail>form'));await wait();w.document.querySelector('[aria-label="Fechar"]').click();await wait();
remote.animals[0].weight='500';revision++;
network=true;Object.defineProperty(w.navigator,'onLine',{value:true,configurable:true});w.dispatchEvent(new w.Event('online'));await wait(350);click('Gestão');await wait();click('Configurações e backup');await wait();assert.equal(w.document.querySelectorAll('.sync-conflict').length,1);assert.equal(remote.animals[0].weight,'500','Não sobrescrever o servidor em conflito');
w.document.querySelectorAll('.sync-conflict .secondary')[1].click();await wait(1300);local=JSON.parse(w.localStorage.getItem('rancho-account-account-test'));assert.equal(local.animals[0].weight,'500');assert.equal(w.document.querySelectorAll('.sync-conflict').length,0);
console.log('OK: login, separação do modo local, lançamento offline, sincronização de dois aparelhos e resolução explícita de conflito.');dom.window.close();
