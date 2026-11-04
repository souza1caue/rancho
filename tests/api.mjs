import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {onRequest} from '../functions/api/[[path]].js';
import {emptyData} from '../shared/data.js';
const sql=new DatabaseSync(':memory:');sql.exec(readFileSync('migrations/0001_cloud.sql','utf8'));
const prep=query=>({bind(...params){const st=sql.prepare(query);return {first:async()=>st.get(...params)||null,all:async()=>({results:st.all(...params)}),run:async()=>st.run(...params),_query:query,_params:params}}});
const DB={prepare:prep,async batch(statements){sql.exec('BEGIN');try{const result=statements.map(s=>{const st=sql.prepare(s._query);return /RETURNING|^SELECT/i.test(s._query)?{results:st.all(...s._params)}:{results:[],meta:st.run(...s._params)}});sql.exec('COMMIT');return result}catch(e){sql.exec('ROLLBACK');throw e}}};
const env={DB,AUTH_PEPPER:'only-local-test-pepper'};let cookie='';
async function call(path,method='GET',body,customCookie=cookie,origin='https://rancho.test'){
  const headers={Origin:origin,'CF-Connecting-IP':'test-ip','Content-Type':'application/json'};if(customCookie)headers.Cookie=customCookie;
  const request=new Request('https://rancho.test/api/'+path,{method,headers,...(body?{body:JSON.stringify(body)}:{})});let waits=[];
  const response=await onRequest({request,env,waitUntil:p=>waits.push(p)});await Promise.all(waits);const value=await response.json();return {response,value};
}
assert.equal((await call('data')).response.status,401);
let result=await call('register','POST',{username:'teste-rancho',name:'Teste',password:'senha de teste longa 123'});assert.equal(result.response.status,201);assert.ok(result.value.recovery);const recovery=result.value.recovery;cookie=result.response.headers.get('Set-Cookie').split(';')[0];assert.match(result.response.headers.get('Set-Cookie'),/HttpOnly; Secure; SameSite=Strict/);
result=await call('data');assert.equal(result.value.revision,0);const data=emptyData();data.animals.push({id:'cow',tag:'001',name:'Teste',birth:'2024-01-01'});
result=await call('data','POST',{revision:0,data});assert.equal(result.response.status,200);assert.equal(result.value.revision,1);
result=await call('data','POST',{revision:0,data:emptyData()});assert.equal(result.response.status,409);assert.equal(result.value.data.animals.length,1);
assert.equal((await call('backups')).value.backups.length,2);assert.equal((await call('data','POST',{revision:1,data},cookie,'https://attacker.test')).response.status,403);
const firstCookie=cookie;result=await call('register','POST',{username:'outro-rancho',name:'Outro',password:'outra senha longa 123'});const otherCookie=result.response.headers.get('Set-Cookie').split(';')[0];assert.equal((await call('data','GET',null,otherCookie)).value.data.animals.length,0);
assert.equal((await call('login','POST',{username:'teste-rancho',password:'errada'})).response.status,401);
result=await call('recover','POST',{username:'teste-rancho',password:'nova senha longa 456',recovery});assert.equal(result.response.status,200);assert.notEqual(result.value.recovery,recovery);assert.equal((await call('data','GET',null,firstCookie)).response.status,401);
cookie=result.response.headers.get('Set-Cookie').split(';')[0];assert.equal((await call('data')).value.data.animals.length,1);await call('logout','POST',{});assert.equal((await call('data')).response.status,401);
console.log('OK: API, contas isoladas, senha, sessão, recuperação, backup, controle de revisão e proteção de origem.');sql.close();
