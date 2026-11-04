import React from 'react';
import {ArrowRight,CalendarDays,HeartPulse,Milk,Settings,Wallet,Sprout,ClipboardList,Baby,Dna} from 'lucide-react';

const links=[
  {page:'Agenda',label:'Agenda',detail:'Cuidados próximos e tarefas',icon:CalendarDays},
  {page:'Sanidade',label:'Saúde dos animais',detail:'Tratamentos, exames e aplicações',icon:HeartPulse},
  {page:'Vacinação',label:'Vacinação',detail:'Protocolos e doses previstas',icon:ClipboardList},
  {page:'Produção de leite',label:'Produção de leite',detail:'Detalhes e histórico de ordenha',icon:Milk},
  {page:'Alimentação',label:'Alimentação',detail:'Registros por lote',icon:Sprout},
  {page:'Financeiro',label:'Financeiro',detail:'Receitas e despesas',icon:Wallet},
  {page:'Relatórios',label:'Relatórios',detail:'Indicadores e exportações',icon:ArrowRight},
  {page:'Configurações',label:'Configurações e backup',detail:'Conta, sincronização e dados',icon:Settings},
];

export default function MoreHub({onOpen}){
  return <section className="hub-grid" aria-label="Outras áreas do Rancho">{links.map(({page,label,detail,icon:Icon})=><button className="card hub-action" key={page} onClick={()=>onOpen(page)}><span className="hub-icon"><Icon size={21}/></span><span><strong>{label}</strong><small>{detail}</small></span><ArrowRight size={17}/></button>)}</section>;
}
