export function groupHistory(records, by = 'date') {
  const groups = new Map();
  for (const record of records) {
    const key = record[by] || (by === 'animal' && record.scope === 'Rebanho' ? 'Rebanho' : by === 'animal' ? 'Rebanho / sem animal' : by === 'category' ? 'Sem categoria' : by === 'lot' ? 'Sem lote' : 'Outros');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(record);
  }
  return [...groups].sort(([a], [b]) => by === 'date' ? b.localeCompare(a) : a.localeCompare(b, 'pt-BR')).map(([key, items]) => ({key, items: [...items].sort((a,b) => b.date.localeCompare(a.date))}));
}

export function summarizeHistory(records) {
  return {
    count: records.length,
    liters: records.reduce((sum,r) => sum + Number(r.liters || 0), 0),
    animals: new Set(records.map(r => r.animal).filter(Boolean)).size,
    income: records.filter(r => r.type === 'Receita').reduce((sum,r) => sum + Number(r.value || 0), 0),
    expenses: records.filter(r => r.type === 'Despesa').reduce((sum,r) => sum + Number(r.value || 0), 0),
    pending: records.filter(r => !r.done).length,
    done: records.filter(r => r.done).length,
    quantity: records.reduce((sum,r) => sum + Number(r.quantity || 0), 0)
  };
}
