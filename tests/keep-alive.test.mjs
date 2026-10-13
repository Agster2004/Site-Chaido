import test from 'node:test';
import assert from 'node:assert/strict';

process.env.SUPABASE_URL = 'https://proj.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'chave-de-teste';

const { default: handler } = await import('../site/api/keep-alive.js');

function criarRes() {
  const r = {
    statusCode: 200, headers: {}, corpo: undefined,
    setHeader(k, v) { r.headers[k.toLowerCase()] = v; },
    status(c) { r.statusCode = c; return r; },
    json(o) { r.corpo = o; return r; },
  };
  return r;
}

function instalarFetch(resposta) {
  const chamadas = [];
  globalThis.fetch = async (url, opcoes = {}) => {
    chamadas.push({ url: String(url), opcoes });
    return {
      ok: resposta.ok !== false, status: resposta.status || 200,
      text: async () => (resposta.corpo == null ? '' : JSON.stringify(resposta.corpo)),
    };
  };
  return chamadas;
}

const req = (extra = {}) => ({ method: 'GET', headers: {}, ...extra });

test.afterEach(() => { delete process.env.CRON_SECRET; });

test('faz uma leitura real no banco e responde ok', async () => {
  const chamadas = instalarFetch({ corpo: [{ id: 'novo' }] });
  const res = criarRes();
  await handler(req(), res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.corpo, { ok: true });
  assert.equal(chamadas.length, 1);
  assert.match(chamadas[0].url, /^https:\/\/proj\.supabase\.co\/rest\/v1\/fases\?select=id&limit=1$/);
  assert.equal(res.headers['cache-control'], 'no-store');
});

test('só aceita GET', async () => {
  const chamadas = instalarFetch({ corpo: [] });
  const res = criarRes();
  await handler(req({ method: 'POST' }), res);
  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.allow, 'GET');
  assert.equal(chamadas.length, 0);
});

test('com CRON_SECRET definido, recusa chamada sem a senha e não toca no banco', async () => {
  process.env.CRON_SECRET = 'segredo-de-teste';
  const chamadas = instalarFetch({ corpo: [] });
  const res = criarRes();
  await handler(req(), res);
  assert.equal(res.statusCode, 401);
  assert.equal(chamadas.length, 0);
});

test('com CRON_SECRET definido, aceita a chamada com a senha certa', async () => {
  process.env.CRON_SECRET = 'segredo-de-teste';
  instalarFetch({ corpo: [{ id: 'novo' }] });
  const res = criarRes();
  await handler(req({ headers: { authorization: 'Bearer segredo-de-teste' } }), res);
  assert.equal(res.statusCode, 200);
});

test('se o banco falhar, responde 500 sem vazar detalhes', async () => {
  instalarFetch({ ok: false, status: 503, corpo: { code: 'XX', message: 'Project paused', details: 'dado-secreto' } });
  const res = criarRes();
  const erros = [];
  const original = console.error;
  console.error = (...a) => erros.push(a.join(' '));
  try {
    await handler(req(), res);
  } finally {
    console.error = original;
  }
  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.corpo, { ok: false });
  assert.ok(erros.some((e) => e.includes('503')));
  assert.ok(!erros.join(' ').includes('dado-secreto'));
});
