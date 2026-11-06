import { setupVisitorMonthFlow } from './visitor-month-flow.mjs';
// Gemeinsame, optionale Ansichten; persönliche Filter bleiben unangetastet.
export async function setupVisitorViews(api, now = new Date()) {
  const month = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit' }).formatToParts(now);
  const year = month.find(p => p.type === 'year').value;
  const number = month.find(p => p.type === 'month').value;
  const label = new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', month: 'long', year: 'numeric' }).format(now);
  const presets = await api('/presets?filter[collection][_eq]=visitor_statistics&limit=-1');
  for (const [bookmark, filter] of [
    ['Aktueller Monat', { visit_date: { _gte: `${year}-${number}-01`, _lt: `${Number(number) === 12 ? Number(year) + 1 : year}-${String(Number(number) === 12 ? 1 : Number(number) + 1).padStart(2, '0')}-01` } }],
    ['Alle Monate', null]
  ]) {
    const existing = presets.find(p => !p.user && !p.role && (p.bookmark === bookmark || (bookmark === 'Aktueller Monat' && p.bookmark === `Ab ${label}`)));
    if (existing && bookmark === 'Alle Monate') continue;
    const preset = await api(existing ? `/presets/${existing.id}` : '/presets', existing ? 'PATCH' : 'POST', {
      collection: 'visitor_statistics', bookmark, user: null, role: null,
      layout: 'tabular', filter,
      layout_query: { tabular: { sort: ['-visit_date', '-created_at'] } },
      layout_options: { tabular: { fields: ['visit_date', 'visit_time', 'age_group', 'gender', 'quantity', 'note'] } },
      icon: 'calendar_month'
    });
    if (bookmark === 'Aktueller Monat') await setupVisitorMonthFlow(api, preset);
  }
}
