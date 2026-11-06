// Gemeinsame, optionale Ansichten; persönliche Filter bleiben unangetastet.
export async function setupVisitorViews(api, now = new Date()) {
  const month = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit' }).formatToParts(now);
  const year = month.find(p => p.type === 'year').value;
  const number = month.find(p => p.type === 'month').value;
  const label = new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', month: 'long', year: 'numeric' }).format(now);
  const presets = await api('/presets?filter[collection][_eq]=visitor_statistics&limit=-1');
  for (const [bookmark, filter] of [
    [`Ab ${label}`, { visit_date: { _gte: `${year}-${number}-01` } }],
    ['Alle Monate', null]
  ]) {
    if (presets.some(p => p.bookmark === bookmark && !p.user && !p.role)) continue;
    await api('/presets', 'POST', {
      collection: 'visitor_statistics', bookmark, user: null, role: null,
      layout: 'tabular', filter,
      layout_query: { tabular: { sort: ['-visit_date', '-created_at'] } },
      layout_options: { tabular: { fields: ['visit_date', 'visit_time', 'age_group', 'gender', 'quantity', 'note'] } },
      icon: 'calendar_month'
    });
  }
}
