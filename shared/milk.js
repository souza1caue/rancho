export const isHerdMilkRecord = record => record?.scope === 'Rebanho' || record?.scope === 'herd' || (!record?.animalId && record?.animal === 'Rebanho');

export function milkRecordsForDate(records, date) {
  const rows = records.filter(record => record.date === date);
  const herdRows = rows.filter(isHerdMilkRecord);
  return herdRows.length ? herdRows : rows;
}

export function effectiveMilkRecords(records) {
  const dates = [...new Set(records.map(record => record.date))];
  return dates.flatMap(date => milkRecordsForDate(records, date));
}

export const milkLiters = records => records.reduce((sum, record) => sum + Number(record.liters || 0), 0);
