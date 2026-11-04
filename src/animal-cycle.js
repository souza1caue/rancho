export const defaults={gestationDays:280,dryDays:60,prepartumDays:21,waitDays:45,diagnosisDays:30};
export const dayDiff=(a,b)=>Math.round((Date.parse(a+'T12:00:00Z')-Date.parse(b+'T12:00:00Z'))/86400000);
export function addDays(date,days){if(!date)return '';const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+Number(days));return d.toISOString().slice(0,10)}
export const animalLabel=a=>a.tag+' · '+a.name;
export function getCycle(animal,records,today){
  const young=['Bezerra','Desmame','Novilha'].includes(animal.stage);
  let c={...defaults,productive:['Lactação','Seca'].includes(animal.stage)?animal.stage:'Não informado',reproductive:animal.sex==='Macho'||['Bezerra','Desmame'].includes(animal.stage)?'Não se aplica':animal.stage==='Gestante'?'Gestante':'Não informado',lastCalving:'',conception:'',expected:'',dryDate:'',lastService:'',...animal.cycle};
  const events=records.filter(r=>(r.animalId?r.animalId===animal.id:r.animal===animalLabel(animal))&&r.date<=today).map((r,i)=>({...r,_order:i})).sort((a,b)=>a.date.localeCompare(b.date)||b._order-a._order);
  for(const e of events){
    if(e.type==='Atualização do ciclo'){for(const k of [...Object.keys(defaults),'productive','reproductive','lastCalving','conception','expected','dryDate','lastService'])if(e[k]!==undefined)c[k]=e[k];}
    if(['Inseminação artificial','Monta natural'].includes(e.type)){c.lastService=e.date;c.conception='';c.expected='';c.reproductive='Aguardando diagnóstico';}
    if(e.type==='Diagnóstico de gestação'&&e.result==='Positivo'){c.reproductive='Gestante';c.conception=e.conception||c.lastService;c.expected=e.expected||'';}
    if(e.type==='Diagnóstico de gestação'&&e.result==='Negativo'){c.reproductive='Não gestante';c.conception='';c.expected='';}
    if(e.type==='Secagem'){c.productive='Seca';c.dryDate=e.date;}
    if(e.type==='Parto'){c.productive='Lactação';c.reproductive='Pós-parto';c.lastCalving=e.date;c.conception='';c.expected='';c.dryDate='';c.lastService='';}
    if(e.type==='Aborto'){c.reproductive='Não gestante';c.conception='';c.expected='';}
  }
  for(const key of Object.keys(defaults))c[key]=Number(c[key])||defaults[key];
  const expected=c.reproductive==='Gestante'?(c.expected||(c.conception?addDays(c.conception,c.gestationDays):'')):'';
  const waitUntil=c.lastCalving?addDays(c.lastCalving,c.waitDays):'';
  return {...c,young,expectedCalving:expected,dryExpected:expected?addDays(expected,-c.dryDays):'',prepartumExpected:expected?addDays(expected,-c.prepartumDays):'',waitUntil,diagnosisExpected:c.reproductive==='Aguardando diagnóstico'&&c.lastService?addDays(c.lastService,c.diagnosisDays):'',daysPostpartum:c.lastCalving?dayDiff(today,c.lastCalving):null,daysInMilk:c.lastCalving?(c.productive==='Seca'?(c.dryDate?dayDiff(c.dryDate,c.lastCalving):null):c.productive==='Lactação'?dayDiff(today,c.lastCalving):null):null,daysPregnant:c.reproductive==='Gestante'&&c.conception?dayDiff(today,c.conception):null};
}
export function cycleReminders(animals,records,today){
  return animals.filter(a=>a.sex!=='Macho'&&!['Vendido','Óbito','Bezerra','Desmame'].includes(a.stage)).flatMap(a=>{
    const c=getCycle(a,records,today),items=[];
    const push=(key,title,date)=>{if(date&&dayDiff(date,today)<=30)items.push({id:a.id+'-'+key,animal:a,title,date,overdue:date<today})};
    if(c.reproductive==='Pós-parto')push('wait','Avaliar recuperação e liberação reprodutiva',c.waitUntil);
    if(c.reproductive==='Aguardando diagnóstico')push('diagnosis','Confirmar diagnóstico de gestação',c.diagnosisExpected);
    if(c.reproductive==='Gestante'){
      if(c.productive!=='Seca')push('dry','Avaliar e confirmar secagem',c.dryExpected);
      push('prepartum','Revisar preparo para o parto',c.prepartumExpected);
      push('calving','Acompanhar previsão de parto',c.expectedCalving);
    }
    return items;
  }).sort((a,b)=>a.date.localeCompare(b.date));
}
