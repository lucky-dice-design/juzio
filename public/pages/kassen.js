import { api } from '../lib/api.js';
import { esc, money, today, dateText, uid } from '../lib/format.js';
import { heading } from '../lib/ui.js';
import { cashBalance, parseCashAmount } from '../lib/cash.js';

export async function cashPage(app) {
  const registers = { counter: 'Thekenkasse', general: 'Allgemeine Kasse' };
  let rows = await api('/api/staff/cash-entries');
  let requestKey = uid();
  app.innerHTML = heading('Team', 'Kassenverwaltung', 'Manuelles Kassenbuch. Thekenverkäufe werden nicht automatisch übernommen.') + `
    <div id="cash-balances" class="dashboard-grid"></div>
    <form id="cash-form" class="panel form-panel">
      <h2>Buchung erfassen</h2>
      <p>Den Anfangsbestand als Einnahme mit dem Zweck „Anfangsbestand“ eintragen. Umbuchungen als Ausgabe der einen und Einnahme der anderen Kasse erfassen.</p>
      <label>Kasse<select name="cash_register">${Object.entries(registers).map(([v,l]) => `<option value="${v}">${l}</option>`).join('')}</select></label>
      <label>Datum<input name="booking_date" type="date" value="${today()}" required></label>
      <label>Buchungsart<select name="direction"><option value="income">Einnahme</option><option value="expense">Ausgabe</option></select></label>
      <label>Betrag in Euro<input name="amount" inputmode="decimal" placeholder="0,00" required></label>
      <label>Verwendungszweck<input name="purpose" maxlength="240" required></label>
      <label>Belegnummer (optional)<input name="receipt" maxlength="120"></label>
      <label>Notiz (optional)<textarea name="note" maxlength="1200"></textarea></label>
      <button class="primary-button">Buchung speichern</button><p id="cash-status" role="status"></p>
    </form>
    <section class="panel"><h2>Kassenbuch</h2>
      <label>Kasse anzeigen<select id="cash-filter"><option value="">Beide Kassen</option>${Object.entries(registers).map(([v,l]) => `<option value="${v}">${l}</option>`).join('')}</select></label>
      <div class="table-wrap"><table><thead><tr><th>Datum</th><th>Kasse</th><th>Zweck</th><th>Beleg</th><th>Einnahme</th><th>Ausgabe</th><th>Notiz</th></tr></thead><tbody id="cash-rows"></tbody></table></div>
    </section>`;
  const filter = app.querySelector('#cash-filter');
  function render() {
    app.querySelector('#cash-balances').innerHTML = Object.entries(registers).map(([key,label]) => `<div class="panel"><h2>${label}</h2><strong>${money(cashBalance(rows,key))}</strong><p>Saldo aller erfassten Buchungen</p></div>`).join('');
    const visible = rows.filter(r => !filter.value || r.cash_register === filter.value);
    app.querySelector('#cash-rows').innerHTML = visible.map(r => `<tr><td>${esc(dateText(r.booking_date))}</td><td>${esc(registers[r.cash_register] || r.cash_register)}</td><td>${esc(r.purpose)}</td><td>${esc(r.receipt)}</td><td>${r.direction === 'income' ? money(r.amount_cents) : '–'}</td><td>${r.direction === 'expense' ? money(r.amount_cents) : '–'}</td><td>${esc(r.note)}</td></tr>`).join('') || '<tr><td colspan="7">Noch keine Buchungen.</td></tr>';
  }
  filter.onchange = render;
  render();
  const form = app.querySelector('#cash-form');
  form.onsubmit = async event => {
    event.preventDefault();
    const button = form.querySelector('button');
    if (button.disabled) return;
    button.disabled = true;
    const status = app.querySelector('#cash-status');
    try {
      const data = Object.fromEntries(new FormData(form));
      await api('/api/staff/cash-entries', { ...data, amount_cents: parseCashAmount(data.amount), request_key: requestKey });
      requestKey = uid();
      for (const name of ['amount','purpose','receipt','note']) form.elements[name].value = '';
      status.textContent = 'Buchung gespeichert.';
      rows = await api('/api/staff/cash-entries');
      render();
    } catch(error) { status.textContent = error.message; }
    finally { button.disabled = false; }
  };
}
