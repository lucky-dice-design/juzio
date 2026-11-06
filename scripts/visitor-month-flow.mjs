// Der Flow läuft in Directus, unabhängig davon, ob die Theken-App geöffnet ist.
export async function setupVisitorMonthFlow(api, preset) {
  const name = 'JuZ.io · Besuchermonat automatisch wechseln';
  const flows = await api('/flows?limit=-1');
  let flow = flows.find(f => f.name === name);
  if (!flow) flow = await api('/flows', 'POST', { name, status: 'inactive', trigger: 'schedule', accountability: 'all', options: { cron: '0 * * * *' } });
  const operations = await api(`/operations?filter[flow][_eq]=${flow.id}&limit=-1`);
  const definitions = [
    { key: 'month', name: 'Kalendermonat in Berlin bestimmen', type: 'exec', position_x: 1, position_y: 1, options: { code: `module.exports = async function () {
      const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit' }).formatToParts(new Date());
      const year = Number(parts.find(p => p.type === 'year').value);
      const month = Number(parts.find(p => p.type === 'month').value);
      return { start: year + '-' + String(month).padStart(2, '0') + '-01', end: (month === 12 ? year + 1 : year) + '-' + String(month === 12 ? 1 : month + 1).padStart(2, '0') + '-01' };
    };` } },
    { key: 'update_view', name: 'Monatsansicht aktualisieren', type: 'item-update', position_x: 20, position_y: 1, options: { collection: 'directus_presets', key: [preset.id], payload: { filter: { visit_date: { _gte: '{{ month.start }}', _lt: '{{ month.end }}' } } }, permissions: '$full', emitEvents: false } }
  ];
  const saved = [];
  for (const definition of definitions) {
    const existing = operations.find(o => o.key === definition.key);
    saved.push(existing
      ? await api(`/operations/${existing.id}`, 'PATCH', definition)
      : await api('/operations', 'POST', { ...definition, flow: flow.id }));
  }
  await api(`/operations/${saved[0].id}`, 'PATCH', { resolve: saved[1].id });
  await api(`/flows/${flow.id}`, 'PATCH', { operation: saved[0].id, status: 'active', options: { cron: '0 * * * *' } });
}
