import assert from 'node:assert/strict';
import {groupHistory, summarizeHistory} from '../src/history-groups.js';

const records=[
  {date:'2026-11-02',animal:'001 · Mimosa',type:'Manhã',liters:'12'},
  {date:'2026-11-04',animal:'002 · Estrela',type:'Manhã',liters:'18.5'},
  {date:'2026-11-04',animal:'001 · Mimosa',type:'Tarde',liters:'10'}
];
const original=JSON.stringify(records);
const days=groupHistory(records);
assert.deepEqual(days.map(g=>g.key),['2026-11-04','2026-11-02']);
assert.equal(days[0].items.length,2);
assert.equal(summarizeHistory(days[0].items).liters,28.5);
assert.equal(summarizeHistory(days[0].items).animals,2);
assert.equal(groupHistory(records,'animal')[0].items.length,2);
assert.equal(groupHistory(records,'type').length,2);
assert.equal(JSON.stringify(records),original);
const finance=[{date:'2026-11-04',category:'Leite',type:'Receita',value:'120.50'},{date:'2026-11-04',category:'Alimentação',type:'Despesa',value:'35.25'}];
assert.equal(groupHistory(finance,'category').length,2);
const total=summarizeHistory(finance);assert.equal(total.income-total.expenses,85.25);
assert.equal(groupHistory([{date:'2026-11-04'}],'animal')[0].key,'Rebanho / sem animal');
assert.deepEqual(groupHistory([]),[]);
const tasks=summarizeHistory([{done:true},{done:false},{done:false}]);assert.equal(tasks.done,1);assert.equal(tasks.pending,2);
console.log('OK: grupos por data, animal, tipo e categoria; totais de leite, financeiro e tarefas; registros sem vínculo.');
