import React,{useState} from 'react';
import {isHerdMilkRecord} from '../shared/milk.js';

export default function MilkBatch({db,today,onSave,onCancel}){
  const [date,setDate]=useState(today);
  const [shift,setShift]=useState('Manhã');
  const [error,setError]=useState('');
  const existing=db.milk.find(record=>isHerdMilkRecord(record)&&record.date===date&&record.type===shift);
  return <form className="form milk-batch" onSubmit={event=>{
    event.preventDefault();
    if(existing){setError('Já existe um total para esta ordenha. Corrija pelo Histórico.');return}
    const form=Object.fromEntries(new FormData(event.currentTarget));
    const liters=Number(form.liters);
    if(!Number.isFinite(liters)||liters<0){setError('Informe um volume total válido.');return}
    onSave({id:crypto.randomUUID(),scope:'Rebanho',date,type:shift,liters:String(liters),destination:form.destination,notes:form.notes});
  }}>
    <p className="cycle-note">Registre uma única vez o volume total coletado nesta ordenha, somando o leite do rebanho.</p>
    <div className="form-grid">
      <label>Data<input type="date" name="date" value={date} max={today} required onChange={event=>setDate(event.target.value)}/></label>
      <label>Ordenha<select value={shift} onChange={event=>setShift(event.target.value)}>{['Manhã','Tarde','Noite'].map(value=><option key={value}>{value}</option>)}</select></label>
      <label className="wide">Volume total da ordenha (litros)<input name="liters" type="number" min="0" step="0.1" required placeholder="Ex.: 185,5"/></label>
      <label>Destino do leite<select name="destination">{['Tanque','Descarte','Alimentação de bezerros'].map(value=><option key={value}>{value}</option>)}</select></label>
      <label>Observações<input name="notes" placeholder="Opcional"/></label>
    </div>
    {existing&&<p className="filter-error" role="status">Já existe um total para esta ordenha. Corrija o registro pelo Histórico.</p>}
    {error&&<p className="filter-error" role="alert">{error}</p>}
    <div className="form-actions"><button type="button" className="secondary" onClick={onCancel}>Cancelar</button><button className="primary" disabled={Boolean(existing)}>Salvar total da ordenha</button></div>
  </form>;
}
