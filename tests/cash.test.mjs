import test from 'node:test';
import assert from 'node:assert/strict';
import { cashBalance, parseCashAmount } from '../public/lib/cash.js';

test('Kassensalden trennen Kassen und verrechnen Ein- und Ausgaben in Cent', () => {
  const rows = [
    { cash_register:'counter', direction:'income', amount_cents:10000 },
    { cash_register:'counter', direction:'expense', amount_cents:1250 },
    { cash_register:'general', direction:'income', amount_cents:5000 },
    { cash_register:'general', direction:'expense', amount_cents:6000 }
  ];
  assert.equal(cashBalance(rows,'counter'),8750);
  assert.equal(cashBalance(rows,'general'),-1000);
  assert.equal(cashBalance([],'counter'),0);
});

test('Eurobeträge werden ohne Rundungsfehler validiert und in Cent umgerechnet', () => {
  for (const [input, expected] of [['12,30',1230],['0.01',1],['5',500],['2,5',250],['1000000',100000000]]) assert.equal(parseCashAmount(input),expected);
  for (const input of ['-1','0','1,001','1e4','abc','1000001','Infinity','']) assert.throws(() => parseCashAmount(input));
});
