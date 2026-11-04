import React from 'react';
import {Activity,ArrowRight,BarChart3,CalendarDays,Check,ChevronRight,HeartPulse,Milk,Sprout,TrendingDown,TrendingUp} from 'lucide-react';
import AnimalIcon from './AnimalIcon.jsx';
import {animalLabel} from './animal-cycle.js';

const localDate=value=>value?new Date(value+'T12:00:00').toLocaleDateString('pt-BR'):'Data não informada';
const number=value=>Number(value||0).toLocaleString('pt-BR',{maximumFractionDigits:1});
const activeAnimal=animal=>!['Vendido','Óbito'].includes(animal.stage);

function milkPath(series){
  const max=Math.max(1,...series.map(point=>point.value));
  const points=series.map((point,index)=>({x:8+index*47.6,y:100-(point.value/max)*72}));
  const line=points.reduce((path,point,index)=>{
    if(!index)return `M ${point.x} ${point.y}`;
    const previous=points[index-1],middle=(previous.x+point.x)/2;
    return `${path} C ${middle} ${previous.y}, ${middle} ${point.y}, ${point.x} ${point.y}`;
  },'');
  return {line,area:`${line} L ${points.at(-1).x} 112 L ${points[0].x} 112 Z`,points};
}

function MilkTrend({series}){
  const {line,area,points}=milkPath(series);
  return <div className="milk-trend mt-4">
    <svg viewBox="0 0 302 124" className="h-36 w-full overflow-visible" role="img" aria-label="Produção de leite nos últimos sete dias">
      <defs><linearGradient id="milk-line" x1="0" x2="1"><stop offset="0%" stopColor="#4CAF50"/><stop offset="100%" stopColor="#ADD8E6"/></linearGradient><linearGradient id="milk-area" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#4CAF50" stopOpacity=".2"/><stop offset="100%" stopColor="#ADD8E6" stopOpacity=".02"/></linearGradient></defs>
      {[32,72,112].map(y=><line key={y} x1="0" x2="302" y1={y} y2={y} stroke="#e9efea" strokeDasharray="3 5"/>)}
      <path d={area} fill="url(#milk-area)"/><path d={line} fill="none" stroke="url(#milk-line)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
      {points.map((point,index)=><circle key={series[index].date} cx={point.x} cy={point.y} r="4" fill="#fff" stroke="#4CAF50" strokeWidth="2.5"><title>{localDate(series[index].date)}: {number(series[index].value)} litros</title></circle>)}
    </svg>
    <div className="flex justify-between px-1 text-[10px] font-medium text-gray-500">{series.map(point=><span key={point.date}>{point.label}</span>)}</div>
  </div>;
}

function HealthCoverage({animals,health,onOpen}){
  const cutoff=new Date();cutoff.setDate(cutoff.getDate()-365);const cutoffIso=`${cutoff.getFullYear()}-${String(cutoff.getMonth()+1).padStart(2,'0')}-${String(cutoff.getDate()).padStart(2,'0')}`;
  const eligible=animals.filter(activeAnimal);
  const covered=eligible.filter(animal=>health.some(record=>record.date>=cutoffIso&&(record.animalId===animal.id||record.animal===animalLabel(animal)))).length;
  const progress=eligible.length?Math.round(covered/eligible.length*100):0;
  const circumference=2*Math.PI*43;
  return <article className="dashboard-panel dashboard-health-panel p-5 sm:p-6">
    <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-gray-500">Acompanhamento</p><h2 className="mt-1 text-xl font-bold text-forest">Saúde do rebanho</h2></div><span className="grid h-10 w-10 place-items-center rounded-xl bg-sky/40 text-forest"><HeartPulse size={20}/></span></div>
    <div className="mt-5 flex items-center gap-5">
      <div className="dashboard-health-meter relative h-28 w-28 shrink-0"><svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" role="img" aria-label={`${progress}% de cobertura de registros sanitários`}><circle cx="50" cy="50" r="43" fill="none" stroke="#e8eee8" strokeWidth="9"/><circle cx="50" cy="50" r="43" fill="none" stroke="#4CAF50" strokeWidth="9" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference*(1-progress/100)}/></svg><div className="absolute inset-0 grid place-items-center text-2xl font-extrabold tracking-tight text-forest font-metric">{progress}%</div></div>
      <div><p className="text-sm font-semibold text-ink">{covered} de {eligible.length} animais</p><p className="mt-1 text-xs leading-relaxed text-gray-600">com algum registro sanitário nos últimos 12 meses.</p><p className="mt-2 text-[10px] leading-relaxed text-gray-500">Indicador de registros, não substitui avaliação veterinária.</p></div>
    </div>
    <button className="dashboard-health-link" onClick={onOpen}>Abrir saúde dos animais <ChevronRight size={16}/></button>
  </article>;
}

export default function DashboardOverview({db,today,total,onNavigate,onRecord,onCompleteTask}){
  const animals=db.animals.filter(activeAnimal);
  const series=Array.from({length:7},(_,index)=>{
    const date=new Date(today+'T12:00:00');date.setDate(date.getDate()-(6-index));const iso=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    return {date:iso,label:date.toLocaleDateString('pt-BR',{weekday:'short'}).replace('.',''),value:db.milk.filter(record=>record.date===iso).reduce((sum,record)=>sum+Number(record.liters||0),0)};
  });
  const previous=series.at(-2)?.value||0,change=previous>0?Math.round((total-previous)/previous*100):null;
  const tasks=db.tasks.filter(task=>!task.done).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,4);
  const shortcuts=[
    {title:'Rebanho',detail:`${animals.length} animais ativos`,icon:<AnimalIcon stage="Lactação" size={27}/>,page:'Rebanho'},
    {title:'Nutrição',detail:'Lotes e alimentação',icon:<Sprout size={21}/>,page:'Alimentação'},
    {title:'Saúde',detail:'Cuidados e vacinação',icon:<HeartPulse size={21}/>,page:'Sanidade'},
    {title:'Métricas',detail:'Relatórios da fazenda',icon:<BarChart3 size={21}/>,page:'Relatórios'},
  ];
  return <section className="dashboard-shell" aria-label="Painel principal do Rancho">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-sm font-semibold text-forest">Resumo de hoje</p><p className="mt-1 text-xs text-gray-500">Produção, saúde e cuidados do rebanho.</p></div>
      <span className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-white px-3 py-2 text-xs font-semibold text-forest shadow-sm"><span className="h-2 w-2 rounded-full bg-field"/>Fazenda ativa</span>
    </div>

    <div className="dashboard-summary-grid">
      <article className="dashboard-panel dashboard-milk-panel overflow-hidden p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-gray-500">Leite de hoje</p><h2 className="mt-1 text-xl font-bold text-forest">Produção de leite</h2><p className="mt-1 text-xs text-gray-500">Total registrado por animal.</p></div><span className="grid h-10 w-10 place-items-center rounded-xl bg-green-50 text-field"><Milk size={21}/></span></div>
        <div className="dashboard-milk-summary mt-5 flex flex-wrap items-end justify-between gap-3"><div><strong className="font-metric text-4xl font-extrabold tracking-tight text-forest">{number(total)}<span className="ml-2 text-xl font-bold">L</span></strong><p className="mt-1 text-xs text-gray-500">{db.milk.filter(record=>record.date===today).length} ordenhas registradas</p></div>{change!==null&&<span className={`mb-1 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${change>=0?'bg-green-50 text-forest':'bg-amber-50 text-amber-800'}`}>{change>=0?<TrendingUp size={14}/>:<TrendingDown size={14}/>} {Math.abs(change)}% vs. ontem</span>}</div>
        <MilkTrend series={series}/>
        <button className="dashboard-record-cta" onClick={onRecord}><Milk size={16}/>Registrar ordenha <ArrowRight size={15}/></button>
      </article>
      <HealthCoverage animals={animals} health={db.health} onOpen={()=>onNavigate('Sanidade')}/>
    </div>

    <section className="dashboard-shortcuts mt-6" aria-labelledby="shortcut-title"><div className="mb-3 flex items-end justify-between"><div><h2 id="shortcut-title" className="text-xl font-bold text-forest">Acesso rápido</h2><p className="mt-1 text-xs text-gray-500">Principais áreas da fazenda.</p></div><Activity size={19} className="text-field"/></div><div className="dashboard-shortcuts-grid">{shortcuts.map(item=><button key={item.page} className="dashboard-shortcut" onClick={()=>onNavigate(item.page)}><span className="shortcut-icon">{item.icon}</span><span className="shortcut-copy"><strong>{item.title}</strong><small>{item.detail}</small></span><ChevronRight size={17} className="text-gray-400"/></button>)}</div></section>

    <section className="dashboard-panel mt-6 overflow-hidden" aria-labelledby="care-title"><div className="flex items-center justify-between gap-4 p-5 sm:px-6"><div><h2 id="care-title" className="text-lg font-bold text-forest">Próximos cuidados</h2><p className="mt-1 text-xs text-gray-500">Tarefas que precisam de atenção.</p></div><span className="rounded-full bg-wheat/30 px-3 py-1 text-xs font-bold text-forest">{db.tasks.filter(task=>!task.done).length}</span></div>{tasks.length?tasks.map(task=><div className="dashboard-task" key={task.id}><button className="dashboard-check" aria-label={'Concluir '+task.title} onClick={()=>onCompleteTask(task.id)}><Check size={13}/></button><span className="min-w-0 flex-1"><strong>{task.title}</strong><small>{[task.animal,task.detail,task.type,localDate(task.date)].filter(Boolean).join(' · ')}</small></span><CalendarDays size={16} className="shrink-0 text-gray-400"/></div>):<div className="px-6 pb-6 text-sm text-gray-500">Nenhum cuidado pendente por enquanto.</div>}<button className="dashboard-more-link" onClick={()=>onNavigate('Agenda')}>Abrir agenda <ArrowRight size={15}/></button></section>
  </section>;
}
