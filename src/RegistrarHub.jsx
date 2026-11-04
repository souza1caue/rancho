import React from 'react';
import {CalendarDays,HeartPulse,Milk,Plus,Wallet,Sprout,Dna,Beef} from 'lucide-react';

const actions=[
  {page:'Produção de leite',label:'Leite',help:'Lançar a ordenha de várias vacas',icon:Milk},
  {page:'Agenda',label:'Cuidado ou tarefa',help:'Agendar uma atividade para o rebanho',icon:CalendarDays},
  {page:'Sanidade',label:'Saúde ou vacina',help:'Registrar aplicação, exame ou tratamento',icon:HeartPulse},
  {page:'Reprodução',label:'Reprodução',help:'Registrar cio, inseminação, diagnóstico ou parto',icon:Dna},
  {page:'animal',label:'Cadastrar animal',help:'Adicionar um animal ao rebanho',icon:Beef},
  {page:'Alimentação',label:'Alimentação',help:'Registrar alimento fornecido por lote',icon:Sprout},
  {page:'Financeiro',label:'Movimentação financeira',help:'Anotar receita ou despesa',icon:Wallet},
];

export default function RegistrarHub({onSelect}){
  return <section className="hub-grid" aria-label="Escolha o tipo de registro">{actions.map(({page,label,help,icon:Icon})=><button className="card hub-action" key={page} onClick={()=>onSelect(page)}><span className="hub-icon"><Icon size={21}/></span><span><strong>{label}</strong><small>{help}</small></span><Plus size={18}/></button>)}</section>;
}
