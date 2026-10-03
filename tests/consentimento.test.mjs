import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('o texto de consentimento do site é igual ao do banco (v1)', () => {
  const sql = readFileSync(new URL('../supabase/migrations/0001_leads.sql', import.meta.url), 'utf8');
  const noBanco = sql.match(/\('v1', '([^']*)'\)/)?.[1];
  const json = JSON.parse(readFileSync(new URL('../site/data/consentimento.json', import.meta.url), 'utf8'));
  assert.equal(json.versao, 'v1');
  assert.equal(json.texto, noBanco);
});
