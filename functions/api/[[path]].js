import {emptyData,normalize,validateData} from '../../shared/data.js';
const enc=new TextEncoder();
const hex=bytes=>Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,'0')).join('');
const random=()=>hex(crypto.getRandomValues(new Uint8Array(32)));
const hash=async value=>hex(await crypto.subtle.digest('SHA-256',enc.encode(value)));
const json=(value,status=200,headers={})=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
const cookie=(token,maxAge=2592000)=>`rancho_session=${token}; Path=/api; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
async function passwordHash(password,salt,pepper){
  const key=await crypto.subtle.importKey('raw',enc.encode(pepper),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const hardened=await crypto.subtle.sign('HMAC',key,enc.encode(password));
  const material=await crypto.subtle.importKey('raw',hardened,'PBKDF2',false,['deriveBits']);
  return hex(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:enc.encode(salt),iterations:100000},material,256));
}
function same(a,b){if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0}
async function session(request,db){
  const token=request.headers.get('Cookie')?.match(/(?:^|;\s*)rancho_session=([a-f0-9]{64})(?:;|$)/)?.[1];
  if(!token)return null;
  return db.prepare('SELECT a.id,a.username,a.name FROM sessions s JOIN accounts a ON a.id=s.account_id WHERE s.token_hash=? AND s.expires_at>?').bind(await hash(token),Date.now()).first();
}
async function limited(request,db){
  const now=Date.now(),ip=request.headers.get('CF-Connecting-IP')||'local',bucket=await hash(ip+':'+Math.floor(now/600000));
  const row=await db.prepare('INSERT INTO auth_limits(bucket,hits,expires_at) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET hits=hits+1 RETURNING hits').bind(bucket,now+600000).first();
  return row.hits>20;
}
async function startSession(account,db){const token=random();await db.prepare('INSERT INTO sessions(token_hash,account_id,expires_at) VALUES(?,?,?)').bind(await hash(token),account.id,Date.now()+2592000000).run();return token}
const publicAccount=a=>({id:a.id,name:a.name,username:a.username});
export async function onRequest({request,env,waitUntil}){
  const path=new URL(request.url).pathname.replace('/api/','');
  if(!env.DB||!env.AUTH_PEPPER)return json({error:'Serviço de conta ainda não configurado.'},503);
  if(request.method!=='GET'&&request.headers.get('Origin')!==new URL(request.url).origin)return json({error:'Origem inválida.'},403);
  try{
    if(path==='session'&&request.method==='GET'){const a=await session(request,env.DB);return a?json({account:publicAccount(a)}):json({account:null},401)}
    if(['register','login','recover'].includes(path)&&request.method==='POST'){
      if(await limited(request,env.DB))return json({error:'Muitas tentativas. Aguarde 10 minutos.'},429);
      if(Number(request.headers.get('Content-Length'))>10000)return json({error:'Pedido muito grande.'},413);
      const raw=await request.text();if(raw.length>10000)return json({error:'Pedido muito grande.'},413);
      const body=JSON.parse(raw),username=String(body.username||'').trim().toLowerCase(),password=String(body.password||'');
      if(!/^[a-z0-9_.-]{3,50}$/.test(username))return json({error:'Use um usuário com 3 a 50 letras sem acentos, números, ponto ou traço.'},400);
      if(path!=='login'&&(password.length<12||password.length>200))return json({error:'Use uma senha com pelo menos 12 caracteres (máximo 200).'},400);
      if(password.length>200)return json({error:'Credenciais inválidas.'},400);
      let a=await env.DB.prepare('SELECT * FROM accounts WHERE username=?').bind(username).first();
      if(path==='register'){
        if(a)return json({error:'Este usuário já existe. Escolha outro ou entre na conta.'},409);
        const name=String(body.name||'Rancho').trim().slice(0,100);if(!name)return json({error:'Informe seu nome.'},400);
        const id=crypto.randomUUID(),salt=random(),recovery=random(),time=new Date().toISOString();
        await env.DB.batch([
          env.DB.prepare('INSERT INTO accounts(id,username,name,salt,password_hash,recovery_hash,created_at) VALUES(?,?,?,?,?,?,?)').bind(id,username,name,salt,await passwordHash(password,salt,env.AUTH_PEPPER),await hash(recovery),time),
          env.DB.prepare('INSERT INTO farms(account_id,document,updated_at) VALUES(?,?,?)').bind(id,JSON.stringify(emptyData()),time),
          env.DB.prepare('INSERT INTO snapshots(account_id,revision,document,created_at) VALUES(?,0,?,?)').bind(id,JSON.stringify(emptyData()),time)
        ]);
        a={id,username,name};const token=await startSession(a,env.DB);
        return json({account:publicAccount(a),recovery},201,{'Set-Cookie':cookie(token)});
      }
      if(path==='recover'){
        const candidate=await hash(String(body.recovery||''));
        if(!a||!same(candidate,a.recovery_hash))return json({error:'Usuário ou código de recuperação inválido.'},401);
        const salt=random(),recovery=random();
        await env.DB.batch([env.DB.prepare('UPDATE accounts SET salt=?,password_hash=?,recovery_hash=? WHERE id=?').bind(salt,await passwordHash(password,salt,env.AUTH_PEPPER),await hash(recovery),a.id),env.DB.prepare('DELETE FROM sessions WHERE account_id=?').bind(a.id)]);
        const token=await startSession(a,env.DB);return json({account:publicAccount(a),recovery},200,{'Set-Cookie':cookie(token)});
      }
      const candidate=await passwordHash(password,a?.salt||'unknown-account',env.AUTH_PEPPER);
      if(!a||!same(candidate,a.password_hash))return json({error:'Usuário ou senha inválidos.'},401);
      const token=await startSession(a,env.DB);return json({account:publicAccount(a)},200,{'Set-Cookie':cookie(token)});
    }
    const a=await session(request,env.DB);if(!a)return json({error:'Entre na conta para sincronizar.'},401);
    if(path==='logout'&&request.method==='POST'){
      const token=request.headers.get('Cookie')?.match(/rancho_session=([a-f0-9]{64})/)?.[1];
      if(token)await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await hash(token)).run();return json({ok:true},200,{'Set-Cookie':cookie('',0)});
    }
    if(path==='data'&&request.method==='GET'){const row=await env.DB.prepare('SELECT document,revision,updated_at FROM farms WHERE account_id=?').bind(a.id).first();return json({data:normalize(JSON.parse(row.document)),revision:row.revision,updatedAt:row.updated_at})}
    if(path==='data'&&request.method==='POST'){
      const text=await request.text();if(text.length>1500000)return json({error:'Limite desta beta: 1,5 MB de registros por conta.'},413);
      const body=JSON.parse(text);if(!validateData(body.data)||!Number.isInteger(body.revision)||body.revision<0)return json({error:'Registros inválidos.'},400);
      const content=JSON.stringify(body.data),time=new Date().toISOString(),writeId=crypto.randomUUID();
      const result=await env.DB.batch([
        env.DB.prepare('UPDATE farms SET document=?,revision=revision+1,write_id=?,updated_at=? WHERE account_id=? AND revision=? RETURNING revision').bind(content,writeId,time,a.id,body.revision),
        env.DB.prepare('INSERT INTO snapshots(account_id,revision,document,created_at) SELECT account_id,revision,document,updated_at FROM farms WHERE account_id=? AND write_id=?').bind(a.id,writeId),
        env.DB.prepare('DELETE FROM snapshots WHERE account_id=? AND revision<(SELECT revision-29 FROM farms WHERE account_id=?)').bind(a.id,a.id)
      ]);
      if(!result[0].results.length){const row=await env.DB.prepare('SELECT document,revision FROM farms WHERE account_id=?').bind(a.id).first();return json({data:normalize(JSON.parse(row.document)),revision:row.revision},409)}
      waitUntil(env.DB.batch([env.DB.prepare('DELETE FROM auth_limits WHERE expires_at<?').bind(Date.now()),env.DB.prepare('DELETE FROM sessions WHERE expires_at<?').bind(Date.now())]));
      return json({revision:result[0].results[0].revision,updatedAt:time});
    }
    if(path==='backups'&&request.method==='GET'){const rows=await env.DB.prepare('SELECT revision,created_at FROM snapshots WHERE account_id=? ORDER BY revision DESC LIMIT 30').bind(a.id).all();return json({backups:rows.results})}
    if(path.startsWith('backups/')&&request.method==='GET'){const revision=Number(path.split('/')[1]);if(!Number.isInteger(revision))return json({error:'Versão inválida.'},400);const row=await env.DB.prepare('SELECT document,created_at FROM snapshots WHERE account_id=? AND revision=?').bind(a.id,revision).first();return row?json({data:normalize(JSON.parse(row.document)),revision,createdAt:row.created_at}):json({error:'Backup não encontrado.'},404)}
    return json({error:'Recurso não encontrado.'},404);
  }catch(error){console.error('API Rancho:',error?.message);return json({error:'Não foi possível concluir a operação. Tente novamente.'},500)}
}
