import React, {useState} from 'react';
import {Plus, Download, Check, Clock, Search, ChevronDown, Milk, HeartPulse, Wallet, Sprout, Dna, CalendarDays} from 'lucide-react';
import {groupHistory, summarizeHistory} from './history-groups.js';

const formatDate = value => value ? new Date(value + 'T12:00:00').toLocaleDateString('pt-BR') : '—';
const number = value => Number(value).toLocaleString('pt-BR', {maximumFractionDigits: 2});
const fields = {date:'Data', animal:'Animal', title:'Descrição', detail:'Detalhes da tarefa', type:'Tipo', result:'Resultado', lot:'Lote', liters:'Litros', destination:'Destino do leite', quality:'Qualidade / descarte', quantity:'Quantidade (kg)', value:'Valor (R$)', category:'Categoria', product:'Produto', dose:'Dose / via', milkUntil:'Carência leite até', meatUntil:'Carência carne até', responsible:'Responsável', sire:'Touro / sêmen', productive:'Fase produtiva', reproductive:'Situação reprodutiva', lastCalving:'Último parto', lastService:'Última inseminação / cobertura', conception:'Concepção de referência', dryDate:'Secagem realizada', expected:'Previsão / retorno', gestationDays:'Referência gestação (dias)', dryDays:'Referência período seco (dias)', prepartumDays:'Referência pré-parto (dias)', waitDays:'Espera pós-parto (dias)', diagnosisDays:'Retorno diagnóstico (dias)', notes:'Observações', done:'Situação', completedAt:'Conclusão'};

export default function ActivityHistory({page, records, animals, onRegister, onToggle, download, view, setView}) {
  const [from,setFrom]=useState(''), [until,setUntil]=useState(''), [animal,setAnimal]=useState(''), [type,setType]=useState(''), [status,setStatus]=useState(''), [query,setQuery]=useState('');
  const [groupBy,setGroupBy]=useState('date');
  const agenda=page==='Agenda';
  const animalPages=['Sanidade','Reprodução','Produção de leite','Agenda'].includes(page);
  const filtered=records.filter(r=>(!from||r.date>=from)&&(!until||r.date<=until)&&(!animal||r.animal===animal)&&(!type||r.type===type)&&(!status||(status==='done'?r.done:!r.done))&&Object.values(r).join(' ').toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR'))).sort((a,b)=>b.date.localeCompare(a.date));
  const invalid=from&&until&&from>until;
  const groups=groupHistory(filtered,groupBy);
  const GroupIcon=({'Produção de leite':Milk,'Financeiro':Wallet,'Alimentação':Sprout,'Sanidade':HeartPulse,'Reprodução':Dna,'Agenda':CalendarDays})[page]||Clock;
  const dayLabel=value=>{
    const now=new Date();
    const local=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    if(value===local(now))return 'Hoje';
    now.setDate(now.getDate()-1);
    return value===local(now)?'Ontem':formatDate(value);
  };
  const groupSummary=items=>{
    const s=summarizeHistory(items);
    if(page==='Produção de leite')return `${number(s.liters)} L · ${s.animals} animais registrados`;
    if(page==='Financeiro')return `Receitas: R$ ${number(s.income)} · Despesas: R$ ${number(s.expenses)} · Saldo: R$ ${number(s.income-s.expenses)}`;
    if(agenda)return `${s.pending} pendentes · ${s.done} concluídas`;
    if(page==='Alimentação')return `${number(s.quantity)} kg fornecidos`;
    return `${s.animals} animais registrados`;
  };
  const fieldValue=(k,value)=>k==='done'?(value?'Concluída':'Pendente'):k==='completedAt'?(value?new Date(value).toLocaleString('pt-BR'):'—'):['date','milkUntil','meatUntil','expected'].includes(k)?formatDate(value):String(value);
  const pending=records.filter(r=>!r.done).sort((a,b)=>a.date.localeCompare(b.date));
  const clear=()=>{setFrom('');setUntil('');setAnimal('');setType('');setStatus('');setQuery('')};
  const exportRows=()=>{
    const columns=Object.keys(fields).filter(k=>filtered.some(r=>r[k]!==undefined));
    const safe=v=>{let s=String(v??'');if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"'};
    const rows=[columns.map(k=>fields[k]),...filtered.map(r=>columns.map(k=>k==='done'?(r.done?'Concluída':'Pendente'):k==='date'||k.endsWith('Until')||k==='expected'?formatDate(r[k]):k==='completedAt'?(r[k]?new Date(r[k]).toLocaleString('pt-BR'):''):r[k]))];
    download('\uFEFF'+rows.map(r=>r.map(safe).join(';')).join('\r\n'),'historico-'+page.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replaceAll(' ','-').toLowerCase()+'.csv','text/csv;charset=utf-8');
  };
  const tasks=list=>list.map(t=><div className="task" key={t.id}><button className={'check '+(t.done?'done':'')} aria-label={(t.done?'Reabrir: ':'Concluir: ')+t.title} onClick={()=>onToggle(t.id)}>{t.done&&<Check size={15}/>}</button><div><strong style={{textDecoration:t.done?'line-through':''}}>{t.title}</strong><p>{[t.animal,t.detail,t.notes].filter(Boolean).join(' · ')}</p><span className="task-type">{t.type} · {formatDate(t.date)} · {t.done?'Concluída':'Pendente'}{t.completedAt?' · Concluída em '+new Date(t.completedAt).toLocaleString('pt-BR'):''}</span></div></div>);
  return <div className="activity-area">
    <div className="activity-tabs" role="group" aria-label="Modo de atividade"><button aria-pressed={view==='register'} className={view==='register'?'active':''} onClick={()=>setView('register')}><Plus size={16}/>Registrar</button><button aria-pressed={view==='history'} className={view==='history'?'active':''} onClick={()=>setView('history')}><Clock size={16}/>Histórico <span>{records.length}</span></button></div>
    {view==='register'?<>
      <section className="card register-card"><span className="register-icon"><Plus size={24}/></span><div><h2>{agenda?'Organize os próximos cuidados':'Registre a rotina do Rancho'}</h2><p>{agenda?'Agende uma tarefa e acompanhe sua conclusão.':'Adicione um registro de '+page.toLowerCase()+'. Você poderá consultá-lo depois no Histórico.'}</p></div><button className="primary" onClick={onRegister}><Plus size={16}/>Novo registro</button></section>
      {agenda&&<section className="card full-tasks"><div className="section-head"><div><h2>Próximos cuidados</h2><p>{pending.length} tarefas pendentes · As concluídas ficam no Histórico.</p></div></div>{tasks(pending)}{!pending.length&&<div className="empty">Tudo em dia. Consulte os cuidados concluídos no Histórico.</div>}</section>}
      <button className="text-button history-shortcut" onClick={()=>setView('history')}>Consultar {records.length} registros no Histórico <Clock size={15}/></button>
    </>:<section className="card history-card">
      <div className="section-head"><div><h2>Histórico de {page.toLowerCase()}</h2><p>Consulte os registros e exporte o resultado dos filtros.</p></div><button className="secondary" disabled={!filtered.length||invalid} onClick={exportRows}><Download size={16}/>Exportar CSV</button></div>
      <div className="history-filters">
        <label>De<input aria-label="Data inicial" type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label>
        <label>Até<input aria-label="Data final" type="date" value={until} onChange={e=>setUntil(e.target.value)}/></label>
        {animalPages&&<label>Animal<select aria-label="Filtrar animal" value={animal} onChange={e=>setAnimal(e.target.value)}><option value="">Todos os animais</option>{[...new Set([...animals.map(a=>a.tag+' · '+a.name),...records.map(r=>r.animal).filter(Boolean)])].sort().map(a=><option key={a}>{a}</option>)}</select></label>}
        <label>Tipo<select aria-label="Filtrar tipo" value={type} onChange={e=>setType(e.target.value)}><option value="">Todos os tipos</option>{[...new Set(records.map(r=>r.type).filter(Boolean))].sort().map(t=><option key={t}>{t}</option>)}</select></label>
        {agenda&&<label>Situação<select aria-label="Filtrar situação" value={status} onChange={e=>setStatus(e.target.value)}><option value="">Todas</option><option value="pending">Pendentes</option><option value="done">Concluídas</option></select></label>}
        <label className="history-search">Buscar<input aria-label="Buscar no histórico" placeholder="Nome, lote, descrição..." value={query} onChange={e=>setQuery(e.target.value)}/></label>
        <button className="text-button" onClick={clear}>Limpar filtros</button>
      </div>
      {invalid&&<p className="filter-error" role="alert">A data final deve ser igual ou posterior à data inicial.</p>}
      <div className="history-count" aria-live="polite">{filtered.length} de {records.length} registros{page==='Produção de leite'?' · '+number(filtered.reduce((s,r)=>s+Number(r.liters||0),0))+' L no resultado':''}{page==='Financeiro'?' · Saldo do resultado: R$ '+number(filtered.reduce((s,r)=>s+(r.type==='Receita'?1:-1)*Number(r.value||0),0)):''}</div>
      <div className="group-toolbar"><label>Agrupar por<select aria-label="Agrupar histórico por" value={groupBy} onChange={e=>setGroupBy(e.target.value)}><option value="date">Dia</option>{animalPages&&<option value="animal">Animal</option>}{page==='Financeiro'&&<option value="category">Categoria</option>}{page==='Alimentação'&&<option value="lot">Lote</option>}<option value="type">Tipo</option></select></label><span>{groups.length} grupos · Toque para abrir ou recolher</span></div>
      <div className="history-groups" key={groupBy}>{groups.map(({key,items},index)=><details className="history-group" key={key} open={index===0}><summary className="group-heading"><span className="group-icon"><GroupIcon size={20}/></span><div><strong>{groupBy==='date'?dayLabel(key):key}<span>{items.length} {items.length===1?'atividade':'atividades'}</span></strong><small>{groupSummary(items)}</small></div><ChevronDown size={18} className="disclosure-arrow"/></summary><div className="group-records">{items.map(r=><details className="history-record" key={r.id}><summary><span className="record-dot"/><div><strong>{r.title||[r.type,r.animal||r.lot||'Rebanho'].filter(Boolean).join(' — ')}</strong><small>{[groupBy!=='date'?formatDate(r.date):'',r.liters?number(r.liters)+' L':'',r.value?'R$ '+number(r.value):'',r.quantity?number(r.quantity)+' kg':'',agenda?(r.done?'Concluída':'Pendente'):r.destination].filter(Boolean).join(' · ')||'Ver detalhes do registro'}</small></div><ChevronDown size={15} className="disclosure-arrow"/></summary><div className="record-details"><dl>{Object.entries(fields).filter(([k])=>r[k]!==undefined&&r[k]!=='').map(([k,label])=><div key={k}><dt>{label}</dt><dd>{fieldValue(k,r[k])}</dd></div>)}</dl>{agenda&&<button className="secondary" onClick={()=>onToggle(r.id)}><Check size={15}/>{r.done?'Reabrir tarefa':'Marcar como concluída'}</button>}</div></details>)}</div></details>)}</div>
      {!filtered.length&&<div className="empty"><Search size={26}/><h3>{records.length?'Nenhum registro com estes filtros':'Ainda não há registros'}</h3><p>{records.length?'Altere ou limpe os filtros para ampliar a consulta.':'Os novos registros aparecerão aqui, inclusive após fechar e abrir o sistema.'}</p><button className="secondary" onClick={records.length?clear:onRegister}>{records.length?'Limpar filtros':'Adicionar registro'}</button></div>}
    </section>}
  </div>;
}
