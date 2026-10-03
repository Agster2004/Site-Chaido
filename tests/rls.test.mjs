import test from 'node:test';
import assert from 'node:assert/strict';

const URL_BASE = process.env.TESTE_SUPABASE_URL;
const ANON = process.env.TESTE_ANON_KEY;
const SERVICO = process.env.TESTE_SERVICE_KEY;
const pular = !URL_BASE || !ANON || !SERVICO ? 'defina TESTE_SUPABASE_URL, TESTE_ANON_KEY e TESTE_SERVICE_KEY' : false;

const chamar = (caminho, chave, opcoes = {}) =>
  fetch(URL_BASE.replace(/\/$/, '') + caminho, {
    ...opcoes,
    headers: {
      apikey: chave,
      ...(chave.startsWith('eyJ') ? { Authorization: 'Bearer ' + chave } : {}),
      'Content-Type': 'application/json',
      ...(opcoes.headers || {}),
    },
  });

test('visitante anônimo não lê leads', { skip: pular }, async () => {
  const r = await chamar('/rest/v1/leads?select=id', ANON);
  const corpo = r.ok ? await r.json() : [];
  assert.deepEqual(corpo, []);
});

test('visitante anônimo não grava lead direto no banco', { skip: pular }, async () => {
  const r = await chamar('/rest/v1/leads', ANON, {
    method: 'POST',
    body: JSON.stringify({ nome: 'Teste', telefone: '+5513900000001', consentimento_em: new Date().toISOString(), consentimento_versao: 'v1' }),
  });
  assert.equal(r.ok, false);
});

test('visitante anônimo não executa registrar_lead', { skip: pular }, async () => {
  const r = await chamar('/rest/v1/rpc/registrar_lead', ANON, { method: 'POST', body: JSON.stringify({ p: {} }) });
  assert.equal(r.ok, false);
});

test('visitante anônimo não executa permitir_envio', { skip: pular }, async () => {
  const r = await chamar('/rest/v1/rpc/permitir_envio', ANON, { method: 'POST', body: JSON.stringify({ p_ip_hash: 'x', p_limite: 5 }) });
  assert.equal(r.ok, false);
});

test('visitante anônimo lê o texto de consentimento v1', { skip: pular }, async () => {
  const r = await chamar('/rest/v1/textos_consentimento?select=versao&versao=eq.v1', ANON);
  assert.equal(r.ok, true);
  assert.deepEqual(await r.json(), [{ versao: 'v1' }]);
});

test('servidor registra lead, repete o telefone como retorno e limpa', { skip: pular }, async () => {
  const p = { nome: 'Teste Automatico', telefone: '+5513900000001', consentimento_versao: 'v1' };
  const um = await (await chamar('/rest/v1/rpc/registrar_lead', SERVICO, { method: 'POST', body: JSON.stringify({ p }) })).json();
  assert.equal(um.novo, true);
  const dois = await (await chamar('/rest/v1/rpc/registrar_lead', SERVICO, { method: 'POST', body: JSON.stringify({ p }) })).json();
  assert.equal(dois.novo, false);
  assert.equal(dois.id, um.id);
  const lead = (await (await chamar('/rest/v1/leads?select=retornos&id=eq.' + um.id, SERVICO)).json())[0];
  assert.equal(lead.retornos, 1);
  const del = await chamar('/rest/v1/leads?id=eq.' + um.id, SERVICO, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
  assert.equal(del.ok, true);
});
