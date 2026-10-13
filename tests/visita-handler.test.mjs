import test from 'node:test';
import assert from 'node:assert/strict';

process.env.SUPABASE_URL = 'https://proj.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'chave-de-teste';

const { default: handler } = await import('../site/api/visita.js');
const { ehBot, limparTexto, caminhoPermitido } = await import('../site/api/_lib/visita.js');

function criarRes() {
  const r = {
    statusCode: 200, headers: {}, corpo: undefined, fim: false,
    setHeader(k, v) { r.headers[k.toLowerCase()] = v; },
    status(c) { r.statusCode = c; return r; },
    json(o) { r.corpo = o; r.fim = true; return r; },
    end() { r.fim = true; return r; },
  };
  return r;
}

function instalarFetch({ rpcOk = true } = {}) {
  const chamadas = [];
  globalThis.fetch = async (url, opcoes = {}) => {
    chamadas.push({ url: String(url), opcoes });
    const u = String(url);
    if (u.includes('/data/empreendimentos.json')) {
      return { ok: true, status: 200, json: async () => ({ items: [{ slug: 'carmo' }, { slug: 'garrett' }] }) };
    }
    if (u.includes('/rpc/registrar_visita')) {
      return rpcOk
        ? { ok: true, status: 204, text: async () => '' }
        : { ok: false, status: 503, text: async () => JSON.stringify({ code: 'XX', message: 'Project paused', details: 'dado-secreto' }) };
    }
    throw new Error('fetch inesperado: ' + u);
  };
  return chamadas;
}

const NAV = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1';
const req = (corpo, extra = {}) => ({
  method: 'POST',
  headers: { host: 'site.test', origin: 'https://site.test', 'x-forwarded-proto': 'https', 'user-agent': NAV },
  body: corpo,
  ...extra,
});
const corpoOk = (extra = {}) => ({ caminho: '/imovel/carmo', fonte: 'instagram', meio: 'bio', campanha: '', ...extra });
const chamadasRpc = (c) => c.filter((x) => x.url.includes('/rpc/registrar_visita'));

test('ehBot reconhece robôs e prévias de link, e deixa navegador passar', () => {
  for (const ua of ['Googlebot/2.1', 'facebookexternalhit/1.1', 'WhatsApp/2.23', 'Mozilla/5.0 HeadlessChrome/120', 'Twitterbot/1.0', 'curl/8.0', '', undefined]) {
    assert.equal(ehBot(ua), true, String(ua));
  }
  assert.equal(ehBot(NAV), false);
});

test('limparTexto deixa minúsculas, tira caracteres estranhos e corta o tamanho', () => {
  assert.equal(limparTexto('Instagram', 50), 'instagram');
  assert.equal(limparTexto('x<script>alert(1)</script>', 50), 'xscriptalert1/script');
  assert.equal(limparTexto('a'.repeat(100), 50).length, 50);
  assert.equal(limparTexto(null, 50), '');
  assert.equal(limparTexto(123, 50), '123');
});

test('caminhoPermitido: só a home, /privacidade e imóveis que existem', () => {
  const slugs = ['carmo', 'garrett'];
  assert.equal(caminhoPermitido('/', slugs), '/');
  assert.equal(caminhoPermitido('/privacidade', slugs), '/privacidade');
  assert.equal(caminhoPermitido('/imovel/carmo', slugs), '/imovel/carmo');
  assert.equal(caminhoPermitido('/imovel/inventado', slugs), null);
  assert.equal(caminhoPermitido('/qualquer/coisa', slugs), null);
  assert.equal(caminhoPermitido('/imovel/carmo/../../x', slugs), null);
  assert.equal(caminhoPermitido(null, slugs), null);
});

test('visita válida grava uma vez e responde 204 sem corpo', async () => {
  const chamadas = instalarFetch();
  const res = criarRes();
  await handler(req(corpoOk()), res);
  assert.equal(res.statusCode, 204);
  assert.equal(res.headers['cache-control'], 'no-store');
  const rpc = chamadasRpc(chamadas);
  assert.equal(rpc.length, 1);
  assert.deepEqual(JSON.parse(rpc[0].opcoes.body), { p: { caminho: '/imovel/carmo', fonte: 'instagram', meio: 'bio', campanha: '' } });
});

test('só aceita POST', async () => {
  const chamadas = instalarFetch();
  const res = criarRes();
  await handler(req(corpoOk(), { method: 'GET' }), res);
  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.allow, 'POST');
  assert.equal(chamadasRpc(chamadas).length, 0);
});

test('recusa envio vindo de outro site', async () => {
  const chamadas = instalarFetch();
  const res = criarRes();
  await handler(req(corpoOk(), { headers: { host: 'site.test', origin: 'https://outro.com', 'user-agent': NAV } }), res);
  assert.equal(res.statusCode, 403);
  assert.equal(chamadasRpc(chamadas).length, 0);
});

test('robô e prévia de link são ignorados sem erro', async () => {
  const chamadas = instalarFetch();
  const res = criarRes();
  await handler(req(corpoOk(), { headers: { host: 'site.test', 'user-agent': 'WhatsApp/2.23' } }), res);
  assert.equal(res.statusCode, 204);
  assert.equal(chamadasRpc(chamadas).length, 0);
});

test('caminho inventado é recusado e não grava', async () => {
  const chamadas = instalarFetch();
  const res = criarRes();
  await handler(req(corpoOk({ caminho: '/imovel/inventado' })), res);
  assert.equal(res.statusCode, 400);
  assert.equal(chamadasRpc(chamadas).length, 0);
});

test('origem é limpa e cortada antes de gravar', async () => {
  const chamadas = instalarFetch();
  await handler(req(corpoOk({ fonte: 'INSTA<b>', meio: 'z'.repeat(200), campanha: 'Carmo Out' })), criarRes());
  const p = JSON.parse(chamadasRpc(chamadas)[0].opcoes.body).p;
  assert.equal(p.fonte, 'instab');
  assert.equal(p.meio.length, 50);
  assert.equal(p.campanha, 'carmo out');
});

test('se o banco falhar, o visitante não vê erro e nada vaza no log', async () => {
  instalarFetch({ rpcOk: false });
  const res = criarRes();
  const erros = [];
  const original = console.error;
  console.error = (...a) => erros.push(a.join(' '));
  try {
    await handler(req(corpoOk()), res);
  } finally {
    console.error = original;
  }
  assert.equal(res.statusCode, 204);
  assert.ok(erros.some((e) => e.includes('503')));
  assert.ok(!erros.join(' ').includes('dado-secreto'));
});

test('corpo que chega como texto (sendBeacon) também funciona', async () => {
  const chamadas = instalarFetch();
  const res = criarRes();
  await handler(req(JSON.stringify(corpoOk())), res);
  assert.equal(res.statusCode, 204);
  assert.equal(chamadasRpc(chamadas).length, 1);
});
