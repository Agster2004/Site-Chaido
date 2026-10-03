import test from 'node:test';
import assert from 'node:assert/strict';
import { cabecalhos } from '../site/api/_lib/supabase.js';

test('chave antiga (JWT) vai em apikey e em Authorization', () => {
  const h = cabecalhos('eyJabc.def.ghi');
  assert.equal(h.apikey, 'eyJabc.def.ghi');
  assert.equal(h.Authorization, 'Bearer eyJabc.def.ghi');
});

test('chave nova (sb_secret_) vai só em apikey', () => {
  const h = cabecalhos('sb_secret_abc123', { Prefer: 'return=minimal' });
  assert.equal(h.apikey, 'sb_secret_abc123');
  assert.equal(h.Authorization, undefined);
  assert.equal(h.Prefer, 'return=minimal');
});
