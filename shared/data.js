import {isHerdMilkRecord} from './milk.js';

export const collections=['animals','milk','health','reproduction','feeding','finance','tasks','protocols'];
export const emptyData=()=>Object.fromEntries(collections.map(k=>[k,[]]));
export const normalize=data=>({...emptyData(),...data});
const stable=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
export const equal=(a,b)=>stable(a)===stable(b);
export function mergeData(base,local,remote){
  const merged=emptyData(),conflicts=[];
  for(const kind of collections){
    const maps=[base,local,remote].map(d=>new Map((d?.[kind]||[]).map(r=>[r.id,r])));
    for(const id of new Set([...maps[1].keys(),...maps[2].keys(),...maps[0].keys()])){
      const [b,l,r]=maps.map(m=>m.get(id));let value;
      if(equal(l,b))value=r;else if(equal(r,b)||equal(l,r))value=l;else {value=l;conflicts.push({kind,id,local:l,remote:r})}
      if(value)merged[kind].push(value);
    }
  }
  // Dois aparelhos podem criar IDs diferentes para a mesma ordenha offline.
  const baseMilk=new Map((base?.milk||[]).map(r=>[r.id,r]));
  const animalKey=r=>r.animalId||merged.animals.find(a=>a.tag+' · '+a.name===r.animal)?.id||r.animal;
  const slot=r=>isHerdMilkRecord(r)?['rebanho',r.date,r.type].join('|'):[animalKey(r),r.date,r.type,r.destination||''].join('|');
  for(const l of local?.milk||[]){
    if(equal(l,baseMilk.get(l.id)))continue;
    for(const r of remote?.milk||[]){
      if(l.id===r.id||equal(r,baseMilk.get(r.id))||slot(l)!==slot(r))continue;
      if(!merged.milk.some(item=>item.id===l.id)||!merged.milk.some(item=>item.id===r.id))continue;
      merged.milk=merged.milk.filter(item=>item.id!==r.id);
      conflicts.push({kind:'milk',id:l.id,otherId:r.id,local:l,remote:r,reason:'A mesma ordenha foi registrada em dois aparelhos. Escolha uma medição para evitar duplicidade.'});
    }
  }
  return {data:merged,conflicts};
}
export function validateData(value){
  if(!value||typeof value!=='object')return false;
  for(const kind of collections){if(!Array.isArray(value[kind])||value[kind].length>20000)return false;const ids=new Set();for(const row of value[kind]){if(!row||typeof row!=='object'||typeof row.id!=='string'||!row.id||row.id.length>100||ids.has(row.id))return false;ids.add(row.id)}}
  return true;
}
