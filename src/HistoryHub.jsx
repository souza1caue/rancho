import React from 'react';
import {CalendarDays,ChevronRight,Clock,HeartPulse,Milk,Wallet,Sprout,Dna} from 'lucide-react';

const groups=[
  {page:'Produção de leite',label:'Leite',key:'milk',icon:Milk},
  {page:'Sanidade',label:'Saúde e vacinação',key:'health',icon:HeartPulse},
  {page:'Reprodução',label:'Reprodução',key:'reproduction',icon:Dna},
  {page:'Agenda',label:'Agenda e cuidados',key:'tasks',icon:CalendarDays},
  {page:'Alimentação',label:'Alimentação',key:'feeding',icon:Sprout},
  {page:'Financeiro',label:'Financeiro',key:'finance',icon:Wallet},
];
const date=value=>value?new Date(value+'T12:00:00').toLocaleDateString('pt-BR'):'Data não informada';
const summary=(record,page)=>page==='Produção de leite'&&record.liters?`${record.liters} L`:record.title||record.product||record.type||'Registro';

export default function HistoryHub({db,onOpen}){
  const recent=groups.flatMap(group=>(db[group.key]||[]).map(record=>({...record,__page:group.page,__group:group.label}))).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))).slice(0,8);
  const total=groups.reduce((sum,group)=>sum+(db[group.key]||[]).length,0);
  return <>
    <section className="card history-overview"><Clock size={22}/><div><strong>{total} registros guardados</strong><p>Consulte por assunto para encontrar a atividade que procura.</p></div></section>
    <section className="hub-grid history-categories" aria-label="Histórico por assunto">{groups.map(({page,label,key,icon:Icon})=><button className="card hub-action" key={key} onClick={()=>onOpen(page)}><span className="hub-icon"><Icon size={21}/></span><span><strong>{label}</strong><small>{(db[key]||[]).length} registros</small></span><ChevronRight size={18}/></button>)}</section>
    <section className="card recent-history"><div className="section-head"><div><h2>Atividades recentes</h2><p>Registros mais novos de todas as áreas.</p></div></div>{recent.length?recent.map((record,index)=><button className="recent-row" key={record.id||index} onClick={()=>onOpen(record.__page)}><span><strong>{summary(record,record.__page)}</strong><small>{record.animal||record.lot||record.__group} · {record.__group}</small></span><time>{date(record.date)}</time><ChevronRight size={17}/></button>):<div className="empty">Ainda não há atividades registradas.</div>}</section>
  </>;
}
