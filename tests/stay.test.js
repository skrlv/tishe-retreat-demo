import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDay, addDays, calculateStay, localToday, plural, money } from '../stay.js';
const base = { arrival: '2026-11-20', departure: '2026-11-23', roomId: 'forest', guests: 2, today: '2026-11-14' };
test('stay price counts calendar nights, including a DST transition', () => {
  assert.equal(calculateStay(base).total, 35700);
  assert.equal(calculateStay({ ...base, arrival: '2027-03-27', departure: '2027-03-29' }).nights, 2);
});
test('calendar dates reject overflow and malformed values', () => {
  for (const date of ['2026-02-29', '2026-13-01', '2026-04-31', '', '2026-1-01', '0200-01-01']) assert.equal(parseDay(date), null);
  assert.notEqual(parseDay('2028-02-29'), null);
});
test('date arithmetic safely crosses month and year boundaries', () => {
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2028-02-28', 1), '2028-02-29');
});
test('past, reversed, zero-night, overlong and invalid stays are rejected', () => {
  for (const delta of [{ arrival:'2026-11-13' }, { departure:'2026-11-20' }, { departure:'2026-11-19' }, { departure:'2026-12-21' }, { arrival:'2026-02-30' }]) assert.throws(() => calculateStay({ ...base, ...delta }));
  assert.equal(calculateStay({ ...base, departure:'2026-12-20' }).nights, 30);
});
test('guest capacity and guest values are enforced', () => {
  for (const guests of [0, 3, 4, 5, 1.5, 'bad', '']) assert.throws(() => calculateStay({ ...base, guests }));
  assert.equal(calculateStay({ ...base, roomId:'family', guests:4 }).total,59700);
});
test('unknown and inherited room keys do not produce a price', () => {
  for (const roomId of ['other', 'toString', 'constructor', '__proto__']) assert.throws(() => calculateStay({ ...base, roomId }));
});
test('date label input is local calendar date rather than UTC instant', () => {
  assert.equal(localToday(new Date(2026, 0, 2, 0, 5)), '2026-01-02');
});
test('Russian plurals handle teens and twenty-one', () => {
  assert.equal(plural(1,'ночь','ночи','ночей'),'ночь');
  assert.equal(plural(3,'ночь','ночи','ночей'),'ночи');
  assert.equal(plural(11,'ночь','ночи','ночей'),'ночей');
  assert.equal(plural(21,'ночь','ночи','ночей'),'ночь');
  assert.match(money(35700),/35\s700/);
});
