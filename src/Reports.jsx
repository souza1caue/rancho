import React,{useState} from 'react';
import {effectiveMilkRecords,milkLiters} from '../shared/milk.js';

const num=value=>Number(value||0).toLocaleString('pt-BR',{maximumFractionDigits:2});
const dateLabel=value=>new Date(value+'T12:00:00').toLocaleDateString('pt-BR');

export default function Reports({db,today,download}){
  const [from,setFrom]=useState(today.slice(0,7)+'-01'),[until,setUntil]=useState(today);
  const inside=record=>record.date>=from&&record.date<=until;
  const rawMilk=db.milk.filter(inside),milk=effectiveMilkRecords(rawMilk);
  const finance=db.finance.filter(inside),total=milkLiters(milk);
  const income=finance.filter(record=>record.type==='Receita').reduce((sum,record)=>sum+Number(record.value||0),0);
  const expense=finance.filter(record=>record.type==='Despesa').reduce((sum,record)=>sum+Number(record.value||0),0);
  const milkingSummary=[...milk.reduce((groups,record)=>{
    const key=`${record.date}|${record.type||'Ordenha'}`;
    const row=groups.get(key)||{date:record.date,shift:record.type||'Ordenha',liters:0,entries:0};
    row.liters+=Number(record.liters||0);row.entries+=1;groups.set(key,row);return groups;
  },new Map()).values()].sort((a,b)=>a.date.localeCompare(b.date)||a.shift.localeCompare(b.shift,'pt-BR'));
  const exportReport=()=>{
    const rows=[['Período inicial',from],['Período final',until],['Leite total do rebanho (L)',total],['Receitas (R$)',income],['Despesas (R$)',expense],['Saldo (R$)',income-expense],[],['Data','Ordenha','Volume total (L)','Registros incluídos'],...milkingSummary.map(row=>[row.date,row.shift,row.liters,row.entries])];
    const safe=value=>'"'+String(value??'').replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"';
    download('\uFEFF'+rows.map(row=>row.map(safe).join(';')).join('\r\n'),'rancho-relatorio.csv','text/csv;charset=utf-8');
  };
  return <>
    <section className="card"><div className="history-filters"><label>De<input type="date" value={from} onChange={event=>setFrom(event.target.value)} required/></label><label>Até<input type="date" value={until} onChange={event=>setUntil(event.target.value)} required/></label><button className="secondary" disabled={!from||!until||from>until} onClick={exportReport}>Exportar relatório CSV</button></div></section>
    {from>until&&<p className="filter-error">Revise o intervalo de datas.</p>}
    <div className="stats report-stats">{[['Leite registrado',num(total)+' L'],['Receitas','R$ '+num(income)],['Despesas','R$ '+num(expense)],['Saldo financeiro','R$ '+num(income-expense)]].map(([label,value])=><div className="card stat" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
    <section className="card"><div className="section-head"><div><h2>Leite por dia e ordenha</h2><p>Volumes totais informados para cada período de ordenha.</p></div></div><div className="table-wrap"><table><thead><tr><th>DATA</th><th>ORDENHA</th><th>VOLUME TOTAL</th></tr></thead><tbody>{milkingSummary.map(row=><tr key={row.date+'-'+row.shift}><td>{dateLabel(row.date)}</td><td>{row.shift}</td><td>{num(row.liters)} L</td></tr>)}</tbody></table>{!milkingSummary.length&&<div className="empty">Sem ordenhas no período.</div>}</div></section>
    <section className="card report-destinations"><h2>Destino do leite registrado</h2>{['Tanque','Descarte','Alimentação de bezerros'].map(destination=><p key={destination}>{destination}: <strong>{num(milkLiters(milk.filter(record=>record.destination===destination)))} L</strong></p>)}</section>
    <section className="card"><div className="section-head"><div><h2>Pesagens e evolução do rebanho</h2><p>Pesagens registradas no período e peso atual informado na ficha.</p></div></div><div className="table-wrap"><table><thead><tr><th>ANIMAL</th><th>PESAGENS NO PERÍODO</th><th>PRIMEIRA → ÚLTIMA</th><th>PESO ATUAL</th></tr></thead><tbody>{db.animals.map(animal=>{const rows=(animal.events||[]).filter(record=>record.weight&&inside(record)).sort((a,b)=>a.date.localeCompare(b.date));return <tr key={animal.id}><td>{animal.tag} · {animal.name}</td><td>{rows.length}</td><td>{rows.length?num(rows[0].weight)+' → '+num(rows.at(-1).weight)+' kg':'Sem pesagens no período'}</td><td>{num(animal.weight)} kg</td></tr>})}</tbody></table></div></section>
    {rawMilk.some(record=>!record.scope&&milk.some(current=>current.scope==='Rebanho'&&current.date===record.date))&&<p className="cycle-note">Os registros individuais antigos continuam disponíveis no Histórico. Nos totais, dias com volume do rebanho usam esse total para evitar somar os mesmos litros duas vezes.</p>}
    <p className="cycle-note">Despesas consideram apenas lançamentos do Financeiro. Custos informados em Alimentação não são somados automaticamente. Volumes de leite são consolidados por dia e ordenha.</p>
  </>;
}
