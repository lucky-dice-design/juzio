export function cashBalance(rows, register) {
  return rows.filter(row => row.cash_register === register).reduce((sum, row) =>
    sum + (row.direction === 'expense' ? -row.amount_cents : row.amount_cents), 0);
}
export function parseCashAmount(value) {
  const match = /^(\d+)(?:[.,](\d{1,2}))?$/.exec(String(value).trim());
  if (!match) throw new Error('Bitte einen Betrag mit höchstens zwei Nachkommastellen eingeben.');
  const cents = Number(match[1]) * 100 + Number((match[2] || '').padEnd(2, '0'));
  if (!Number.isSafeInteger(cents) || cents < 1 || cents > 100000000) throw new Error('Betrag muss zwischen 0,01 und 1.000.000 Euro liegen.');
  return cents;
}
