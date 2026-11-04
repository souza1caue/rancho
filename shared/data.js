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
  return {data:merged,conflicts};
}
export function validateData(value){
  if(!value||typeof value!=='object')return false;
  for(const kind of collections){if(!Array.isArray(value[kind])||value[kind].length>20000)return false;const ids=new Set();for(const row of value[kind]){if(!row||typeof row!=='object'||typeof row.id!=='string'||!row.id||row.id.length>100||ids.has(row.id))return false;ids.add(row.id)}}
  return true;
}
