import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../apps/web/package.json', import.meta.url));
const { createTranslator } = await import(require.resolve('next-intl'));
const directory = new URL('../apps/web/messages/', import.meta.url);
const uk = JSON.parse(readFileSync(new URL('uk.json', directory), 'utf8'));
const en = JSON.parse(readFileSync(new URL('en.json', directory), 'utf8'));

function keys(value, prefix = '') {
  return Object.entries(value).flatMap(([key, item]) => typeof item === 'string'
    ? [prefix + key] : keys(item, prefix + key + '.')).sort();
}

test('Ukrainian and English contain the same complete, nonempty interface messages', () => {
  assert.deepEqual(readdirSync(directory).filter(name => name.endsWith('.json')).sort(), ['en.json', 'uk.json']);
  assert.deepEqual(keys(uk), keys(en));
  for (const messages of [uk, en]) {
    for (const key of keys(messages)) {
      const text = key.split('.').reduce((value, part) => value[part], messages);
      assert.ok(text.trim(), key);
      assert.doesNotMatch(text, /[ыэъёЫЭЪЁ]/u, key);
    }
  }
});

test('every interface message formats in both languages without missing ICU values', () => {
  const values = { page: 2, count: 5, query: 'Jordan', year: 2021, races: 2, wins: 1, first: 1950,
    last: 2026, name: 'fixture.json', title: 'Fixture source', round: 1, percent: 125, type: 'constructor', total: 10 };
  for (const [locale, messages] of [['uk', uk], ['en', en]]) {
    const errors = [];
    const t = createTranslator({ locale, messages, namespace: 'UI', onError: error => errors.push(error) });
    for (const key of Object.keys(messages.UI)) t.rich(key, { ...values, license: chunks => chunks });
    assert.deepEqual(errors, [], locale);
  }
});

test('Ukrainian race and win counts use singular, few and many forms', () => {
  const t = createTranslator({ locale: 'uk', messages: uk, namespace: 'UI' });
  assert.equal(t('raceWins', { races: 1, wins: 1 }), '1 гонка · 1 перемога');
  assert.equal(t('raceWins', { races: 2, wins: 3 }), '2 гонки · 3 перемоги');
  assert.equal(t('raceWins', { races: 5, wins: 0 }), '5 гонок · 0 перемог');
});
