export function birthFromEvent(event,animals){
  if(event.type!=='Parto'||event.calfRegister!=='sim')return null;
  if(!event.calfTag?.trim()||!event.calfName?.trim()||!(Number(event.calfWeight)>0))throw Error('Informe brinco, nome e peso da cria.');
  if(animals.some(a=>a.tag===event.calfTag.trim()))throw Error('O brinco da cria já está cadastrado.');
  return {id:crypto.randomUUID(),tag:event.calfTag.trim(),name:event.calfName.trim(),sex:event.calfSex||'Fêmea',breed:event.calfBreed,birth:event.date,weight:event.calfWeight,lot:event.calfLot||'Bezerreiro',stage:event.calfOutcome==='Natimorto'?'Óbito':'Bezerra',origin:'Nascimento na fazenda',mother:event.animal,motherId:event.animalId,father:event.calfFather||'',notes:event.calfOutcome==='Natimorto'?'Natimorto':'',birthEventId:event.id};
}
export function correctRecord(record,values,reason){
  if(!reason.trim())throw Error('Informe o motivo da correção.');
  for(const key of ['liters','quantity','value'])if(values[key]!==undefined&&(!Number.isFinite(Number(values[key]))||Number(values[key])<0||values[key]===''))throw Error('Informe uma quantidade ou valor válido, igual ou maior que zero.');
  if(values.date&&!/^\d{4}-\d{2}-\d{2}$/.test(values.date))throw Error('Revise a data.');
  const {corrections,...before}=record;
  return {...record,...values,id:record.id,corrections:[...(corrections||[]),{at:new Date().toISOString(),reason:reason.trim(),before}]};
}
