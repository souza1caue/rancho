import {addDays,dayDiff,animalLabel} from './animal-cycle.js';
export function vaccinationSchedule(animals,protocols,health,today){
  return protocols.filter(p=>p.approved===true||p.approved==='sim').flatMap(p=>animals.filter(a=>!['Vendido','Óbito'].includes(a.stage)&&(!p.sex||p.sex==='Todos'||a.sex===p.sex)&&(!p.stage||p.stage==='Todos'||a.stage===p.stage||(p.stage==='Vaca'&&['Lactação','Seca','Gestante'].includes(a.stage)))).map(a=>{
    const records=health.filter(r=>r.type==='Vacinação'&&r.protocolId===p.id&&(r.animalId===a.id||r.animal===animalLabel(a))&&r.date<=today).sort((x,y)=>x.date.localeCompare(y.date));
    const last=records.at(-1);let due='',dose='Primeira dose';
    if(!last)due=addDays(a.birth,Number(p.startAgeDays));
    else if(last.nextDose){due=last.nextDose;dose='Próxima dose indicada'}
    else if(records.length<Number(p.initialDoses||1)&&Number(p.boosterDays)>0){due=addDays(last.date,Number(p.boosterDays));dose='Reforço inicial'}
    else if(Number(p.repeatDays)>0){due=addDays(last.date,Number(p.repeatDays));dose='Revacinação'}
    const outside=!last&&p.maxAgeDays&&dayDiff(today,a.birth)>Number(p.maxAgeDays);
    return {id:p.id+'-'+a.id,protocol:p,animal:a,date:due,dose,count:records.length,lastDate:last?.date||'',outside:Boolean(outside),status:!due?'Esquema registrado':outside?'Revisar janela com veterinário':due<today?'Atrasada':due===today?'Hoje':'A vencer'};
  })).sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999'));
}
