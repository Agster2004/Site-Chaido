import test from 'node:test';
import assert from 'node:assert/strict';

process.env.SUPABASE_URL = 'https://proj.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'chave-de-teste';
process.env.RESEND_API_KEY = 're_teste';
process.env.LEAD_NOTIFY_EMAILS = 'a@exemplo.com, b@exemplo.com';
process.env.LEAD_FROM_EMAIL = 'Chiado <leads@exemplo.com>';
process.env.IP_HASH_SALT = 'sal-de-teste';

const { default: handler } = await import('../site/api/lead.js');

function criarRes() {
  const r = {
    statusCode: 200, headers: {}, corpo: undefined,
    setHeader(k, v) { r.headers[k.toLowerCase()] = v; },
    status(c) { r.statusCode = c; return r; },
    json(o) { r.corpo = o; return r; },
    send(o) { r.corpo = o; return r; },
  };
  return r;
}

function instalarFetch(rotas) {
  const chamadas = [];
  globalThis.fetch = async (url, opcoes = {}) => {
    chamadas.push({ url: String(url), opcoes });
    for (const [padrao, resp] of rotas) {
      if (String(url).includes(padrao)) {
        const v = typeof resp === 'function' ? resp(opcoes) : resp;
        return {
          ok: v.ok !== false, status: v.status || 200,
          json: async () => v.corpo, text: async () => (v.corpo == null ? '' : JSON.stringify(v.corpo)),
        };
      }
    }
    throw new Error('fetch inesperado: ' + url);
  };
  return chamadas;
}

const rotasBase = () => [
  ['/data/empreendimentos.json', { corpo: { items: [{ slug: 'carmo', nome: 'Residencial Carmo' }] } }],
  ['/data/consentimento.json', { corpo: { versao: 'v1', texto: 'texto' } }],
  ['/rpc/permitir_envio', { corpo: true }],
  ['/rpc/registrar_lead', { corpo: { id: 'abc', novo: true } }],
  ['api.resend.com', { corpo: { id: 'x' } }],
  ['/rest/v1/leads?id=eq.abc', { status: 204, corpo: null }],
];

const corpoValido = () => ({
  nome: 'Maria Souza', telefone: '(13) 99777-0974', email: '', mensagem: 'Oi',
  empreendimento_slug: 'carmo', consentimento: true, consentimento_versao: 'v1',
  website: '', tempo_ms: 8000, origem_fonte: 'instagram', pagina_origem: '/imovel/carmo',
});

const req = (extra = {}) => ({
  method: 'POST',
  headers: { host: 'site.test', origin: 'https://site.test', 'x-forwarded-proto': 'https', 'x-forwarded-for': '200.1.2.3' },
  body: corpoValido(),
  ...extra,
});

const chamadasAoBanco = (c) => c.filter((x) => x.url.includes('supabase.co'));

test('só aceita POST', async () => {
  instalarFetch(rotasBase());
  const res = criarRes();
  await handler(req({ method: 'GET' }), res);
  assert.equal(res.statusCode, 405);
});

test('recusa requisição de outra origem', async () => {
  instalarFetch(rotasBase());
  const res = criarRes();
  await handler(req({ headers: { host: 'site.test', origin: 'https://evil.com' } }), res);
  assert.equal(res.statusCode, 403);
});

test('robô (campo-isca) recebe sucesso e nada é gravado', async () => {
  const c = instalarFetch(rotasBase());
  const res = criarRes();
  await handler(req({ body: { ...corpoValido(), website: 'http://spam' } }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(chamadasAoBanco(c).length, 0);
});

test('envio rápido demais devolve 400 sem gravar (pessoa com autopreenchimento pode tentar de novo)', async () => {
  const c = instalarFetch(rotasBase());
  const res = criarRes();
  await handler(req({ body: { ...corpoValido(), tempo_ms: 500 } }), res);
  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.corpo, { ok: false, erros: {} });
  assert.equal(chamadasAoBanco(c).length, 0);
});

test('dados inválidos devolvem 400 com os erros', async () => {
  instalarFetch(rotasBase());
  const res = criarRes();
  await handler(req({ body: { ...corpoValido(), telefone: '12' } }), res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.corpo.ok, false);
  assert.ok(res.corpo.erros.telefone);
});

test('limite de envios excedido responde sucesso sem gravar', async () => {
  const rotas = rotasBase().map((r) => (r[0] === '/rpc/permitir_envio' ? [r[0], { corpo: false }] : r));
  const c = instalarFetch(rotas);
  const res = criarRes();
  await handler(req(), res);
  assert.equal(res.statusCode, 200);
  assert.equal(c.some((x) => x.url.includes('registrar_lead')), false);
});

test('sucesso grava o lead e envia o e-mail', async () => {
  const c = instalarFetch(rotasBase());
  const res = criarRes();
  await handler(req(), res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.corpo, { ok: true });
  const reg = c.find((x) => x.url.includes('registrar_lead'));
  const enviado = JSON.parse(reg.opcoes.body).p;
  assert.equal(enviado.telefone, '+5513997770974');
  assert.equal(enviado.empreendimento_slug, 'carmo');
  const email = c.find((x) => x.url.includes('api.resend.com'));
  assert.deepEqual(JSON.parse(email.opcoes.body).to, ['a@exemplo.com', 'b@exemplo.com']);
  assert.equal(c.some((x) => x.opcoes.method === 'PATCH'), false);
});

test('falha no e-mail marca o aviso como não enviado e ainda responde 200', async () => {
  const rotas = rotasBase().map((r) => (r[0] === 'api.resend.com' ? [r[0], { ok: false, status: 500, corpo: {} }] : r));
  const c = instalarFetch(rotas);
  const res = criarRes();
  await handler(req(), res);
  assert.equal(res.statusCode, 200);
  const patch = c.find((x) => x.opcoes.method === 'PATCH');
  assert.deepEqual(JSON.parse(patch.opcoes.body), { aviso_email_ok: false });
});

test('falha no banco devolve 500 sem detalhes', async () => {
  const rotas = rotasBase().map((r) => (r[0] === '/rpc/registrar_lead' ? [r[0], { ok: false, status: 500, corpo: {} }] : r));
  instalarFetch(rotas);
  const res = criarRes();
  await handler(req(), res);
  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.corpo, { ok: false });
});
