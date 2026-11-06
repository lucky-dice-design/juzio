import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { setupVisitorMonthFlow } from '../scripts/visitor-month-flow.mjs';

test('Monatswechsel berücksichtigt Berliner Zeit und den Jahreswechsel', async () => {
  const writes = [];
  await setupVisitorMonthFlow(async (url, method, body) => {
    if (!method) return [];
    writes.push(body);
    return { id: String(writes.length), ...body };
  }, { id: 42 });
  const code = writes.find(w => w.type === 'exec').options.code;
  for (const [now, start, end] of [
    ['2026-11-30T23:00:00Z', '2026-12-01', '2027-01-01'],
    ['2026-12-31T23:00:00Z', '2027-01-01', '2027-02-01'],
    ['2028-02-20T12:00:00Z', '2028-02-01', '2028-03-01']
  ]) {
    const context = { module: {}, Intl, Date: class extends Date { constructor() { super(now); } } };
    vm.runInNewContext(code, context);
    const result = await context.module.exports();
    assert.equal(result.start, start);
    assert.equal(result.end, end);
  }
  assert.deepEqual(writes.find(w => w.type === 'item-update').options.key, [42]);
});
