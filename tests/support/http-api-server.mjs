import http from 'node:http';
import {onRequest} from '../../functions/api/[[path]].js';
import {createTestDatabase} from './d1-test-db.mjs';

// Exclusivo para testes locais. Não carrega Wrangler, credenciais ou D1 remoto.
const database=createTestDatabase();
const env={DB:database.DB,AUTH_PEPPER:'isolated-test-pepper-not-for-production'};
const server=http.createServer(async(req,res)=>{
  try{
    const chunks=[];
    for await(const chunk of req)chunks.push(chunk);
    const body=Buffer.concat(chunks),base=`http://127.0.0.1:${server.address().port}`;
    const headers=new Headers();
    for(const [key,value] of Object.entries(req.headers))if(value!==undefined)headers.set(key,Array.isArray(value)?value.join(', '):value);
    headers.set('CF-Connecting-IP',req.headers['x-test-ip']||'127.0.0.1');
    const request=new Request(base+req.url,{method:req.method,headers,...(body.length?{body}:{} )});
    const pending=[];
    const response=await onRequest({request,env,waitUntil:promise=>pending.push(promise)});
    await Promise.all(pending);
    res.writeHead(response.status,Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  }catch(error){
    console.error('Test HTTP adapter:',error);
    res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Falha no adaptador local de testes.'}));
  }
});
server.listen(0,'127.0.0.1',()=>console.log(JSON.stringify({url:`http://127.0.0.1:${server.address().port}`})));
const stop=()=>server.close(()=>{database.close();process.exit(0)});
process.on('SIGTERM',stop);process.on('SIGINT',stop);
