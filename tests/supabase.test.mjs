import test from 'node:test';
import assert from 'node:assert/strict';
import { cabecalhos, urlBase } from '../site/api/_lib/supabase.js';

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

test('erro do Supabase mostra status, rota, código e mensagem, mas nunca os detalhes', async () => {
  process.env.SUPABASE_URL = 'https://proj.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'chave-de-teste';
  globalThis.fetch = async () => ({
    ok: false,
    status: 404,
    text: async () => JSON.stringify({ code: 'PGRST202', message: 'Could not find the function', details: 'Key (telefone)=(+5513900000000) already exists' }),
  });
  const { rpc } = await import('../site/api/_lib/supabase.js');
  await assert.rejects(() => rpc('permitir_envio', {}), (e) => {
    assert.match(e.message, /404/);
    assert.match(e.message, /permitir_envio/);
    assert.match(e.message, /PGRST202/);
    assert.match(e.message, /Could not find the function/);
    assert.equal(e.message.includes('+5513900000000'), false);
    return true;
  });
});

test('urlBase aceita o endereço com barra final ou com /rest/v1', () => {
  const certo = 'https://abc.supabase.co';
  assert.equal(urlBase('https://abc.supabase.co'), certo);
  assert.equal(urlBase('https://abc.supabase.co/'), certo);
  assert.equal(urlBase('https://abc.supabase.co/rest/v1'), certo);
  assert.equal(urlBase('https://abc.supabase.co/rest/v1/'), certo);
  assert.equal(urlBase('  https://abc.supabase.co/rest/v1/  '), certo);
  assert.equal(urlBase(''), '');
  assert.equal(urlBase(undefined), '');
});
