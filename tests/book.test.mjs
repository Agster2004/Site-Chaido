import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

process.env.SUPABASE_URL = 'https://proj.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'chave-de-teste';
process.env.RESEND_API_KEY = 're_teste';
process.env.LEAD_NOTIFY_EMAILS = 'a@exemplo.com';
process.env.LEAD_FROM_EMAIL = 'Chiado <leads@exemplo.com>';
process.env.IP_HASH_SALT = 'sal-de-teste';

const { criarToken, verificarToken, VALIDADE_MS } = await import('../site/api/_lib/book.js');
const { default: leadHandler } = await import('../site/api/lead.js');
const { default: bookHandler } = await import('../site/api/book.js');

function criarRes() {
  const r = {
    statusCode: 200, headers: {}, corpo: undefined,
    setHeader(k, v) { r.headers[k.toLowerCase()] = v; },
    status(c) { r.statusCode = c; return r; },
    json(o) { r.corpo = o; return r; },
    send(o) { r.corpo = o; return r; },
    end() { return r; },
  };
  return r;
}

test('token vale para o próprio slug e vence em 10 minutos', () => {
  const agora = 1_800_000_000_000;
  const t = criarToken('carmo', agora);
  assert.equal(verificarToken(t, agora + 1000), 'carmo');
  assert.equal(verificarToken(t, agora + VALIDADE_MS + 1), null);
});

test('token adulterado ou de outro slug é recusado', () => {
  const agora = 1_800_000_000_000;
  const t = criarToken('carmo', agora);
  const [, exp, sig] = t.split('.');
  assert.equal(verificarToken('garrett.' + exp + '.' + sig, agora), null);
  assert.equal(verificarToken('carmo.' + (Number(exp) + 999999) + '.' + sig, agora), null);
  assert.equal(verificarToken('carmo.' + exp + '.' + sig.replace(/.$/, sig.endsWith('0') ? '1' : '0'), agora), null);
  assert.equal(verificarToken('lixo', agora), null);
  assert.equal(verificarToken('../../etc.1800000000000.abc', agora), null);
});

test('sem segredo configurado não há token', () => {
  const guardado = process.env.IP_HASH_SALT;
  delete process.env.IP_HASH_SALT;
  assert.equal(criarToken('carmo'), null);
  process.env.IP_HASH_SALT = guardado;
});

test('/api/book sem token ou com token inválido dá 404', async () => {
  for (const q of [{}, { t: 'x' }, { t: 'carmo.1.abc' }]) {
    const res = criarRes();
    await bookHandler({ method: 'GET', query: q }, res);
    assert.equal(res.statusCode, 404);
  }
});

test('/api/book só aceita GET', async () => {
  const res = criarRes();
  await bookHandler({ method: 'POST', query: {} }, res);
  assert.equal(res.statusCode, 405);
});

test('/api/book entrega o PDF com token válido', async () => {
  const t = criarToken('carmo');
  const res = criarRes();
  await bookHandler({ method: 'GET', query: { t } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers['content-type'], 'application/pdf');
  assert.match(res.headers['content-disposition'], /attachment/);
  assert.equal(String(res.corpo.subarray(0, 4)), '%PDF');
});

function instalarFetch({ comBook = true, permitido = true } = {}) {
  const chamadas = [];
  globalThis.fetch = async (url, opcoes = {}) => {
    const u = String(url);
    chamadas.push(u);
    const ok = (corpo) => ({ ok: true, status: 200, json: async () => corpo, text: async () => (corpo == null ? '' : JSON.stringify(corpo)) });
    if (u.includes('/data/empreendimentos.json')) return ok({ items: [{ slug: 'carmo', nome: 'Residencial Carmo', ...(comBook ? { book: true } : {}) }] });
    if (u.includes('/data/consentimento.json')) return ok({ versao: 'v1', texto: 't' });
    if (u.includes('/rpc/permitir_envio')) return ok(permitido);
    if (u.includes('/rpc/registrar_lead')) return ok({ id: 'abc', novo: true });
    if (u.includes('/rpc/registrar_book')) return ok(null);
    if (u.includes('api.resend.com')) return ok({ id: 'x' });
    if (u.includes('/rest/v1/leads?id=eq.abc')) return { ok: true, status: 204, json: async () => null, text: async () => '' };
    throw new Error('fetch inesperado: ' + u);
  };
  return chamadas;
}

const req = (extra = {}) => ({
  method: 'POST',
  headers: { host: 'site.test', origin: 'https://site.test', 'x-forwarded-proto': 'https', 'x-forwarded-for': '200.1.2.3' },
  body: {
    nome: 'Maria Souza', telefone: '(13) 99777-0974', email: '', mensagem: '', empreendimento_slug: 'carmo',
    consentimento: true, consentimento_versao: 'v1', website: '', tempo_ms: 8000, quer_book: true,
  },
  ...extra,
});

test('lead com quer_book devolve o link e registra o histórico', async () => {
  const chamadas = instalarFetch();
  const res = criarRes();
  await leadHandler(req(), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.corpo.ok, true);
  assert.match(res.corpo.book.url, /^\/api\/book\?t=carmo\.\d+\.[0-9a-f]{32}$/);
  assert.ok(chamadas.some((c) => c.includes('/rpc/registrar_book')));
  assert.equal(verificarToken(res.corpo.book.url.split('t=')[1]), 'carmo');
});

test('sem a migração 0003 o link sai do mesmo jeito', async () => {
  instalarFetch();
  const velho = globalThis.fetch;
  globalThis.fetch = async (url, o) => {
    if (String(url).includes('/rpc/registrar_book')) return { ok: false, status: 404, text: async () => '{"code":"PGRST202","message":"nao existe"}', json: async () => ({}) };
    return velho(url, o);
  };
  const res = criarRes();
  await leadHandler(req(), res);
  assert.equal(res.statusCode, 200);
  assert.ok(res.corpo.book);
});

test('empreendimento sem book no cadastro não recebe link', async () => {
  instalarFetch({ comBook: false });
  const res = criarRes();
  await leadHandler(req(), res);
  assert.deepEqual(res.corpo, { ok: true });
});

test('sem quer_book não há link', async () => {
  instalarFetch();
  const res = criarRes();
  const r = req();
  r.body.quer_book = false;
  await leadHandler(r, res);
  assert.deepEqual(res.corpo, { ok: true });
});

test('limite por hora excedido: sem gravar, sem link', async () => {
  instalarFetch({ permitido: false });
  const res = criarRes();
  await leadHandler(req(), res);
  assert.deepEqual(res.corpo, { ok: true });
});

test('robô (campo-isca) com quer_book não recebe link', async () => {
  instalarFetch();
  const res = criarRes();
  const r = req();
  r.body.website = 'http://spam';
  await leadHandler(r, res);
  assert.deepEqual(res.corpo, { ok: true });
});
