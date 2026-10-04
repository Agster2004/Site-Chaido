// Sobe o site (porta 4173) e um Supabase de mentira (porta 4174) para testar o /painel no navegador:
// login (cv.cvwill@gmail.com / senha-certa), lista, ficha, anotações, mudar fase, busca por pessoa e apagar.
// Como rodar: veja tests/ferramentas/LEIAME.md
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../site', import.meta.url));
process.env.SUPABASE_URL = 'http://localhost:4174/rest/v1/';
process.env.SUPABASE_ANON_KEY = 'anon-de-teste';

const A = '11111111-1111-1111-1111-111111111111';
const B = '22222222-2222-2222-2222-222222222222';
const usuarios = { 'cv.cvwill@gmail.com': { id: A, painel: true }, 'outro@exemplo.com': { id: B, painel: false } };
const agora = Date.now();
const antes = (min) => new Date(agora - min * 60000).toISOString();
const lead = (id, nome, extra) => ({
  id, nome, telefone: '+551399000000' + id.slice(-1), email: null, mensagem: null, empreendimento_slug: 'carmo',
  fase: 'novo', motivo_perda: null, origem_fonte: 'instagram', origem_meio: null, origem_campanha: null,
  retornos: 0, criado_em: antes(30), ultimo_contato_em: null, vendido_em: null, aviso_email_ok: true, ...extra,
});
const ID = (n) => 'aaaaaaaa-0000-0000-0000-00000000000' + n;
const leads = [
  lead(ID(1), 'Maria Souza', { criado_em: antes(12), email: 'maria@exemplo.com', mensagem: 'Quero saber o valor e se aceita financiamento.', origem_meio: 'social', origem_campanha: 'lancamento-carmo' }),
  lead(ID(2), 'João Pereira', { empreendimento_slug: 'garrett', origem_fonte: 'google', criado_em: antes(180), aviso_email_ok: false }),
  lead(ID(3), 'Ana Lima', { origem_fonte: 'anuncio', criado_em: antes(26 * 60), retornos: 2 }),
  lead(ID(4), 'Lia Costa', { fase: 'perdido', motivo_perda: 'preco', criado_em: antes(12 * 24 * 60), ultimo_contato_em: antes(5000) }),
];
const eventos = [];
let seq = 0;
const evento = (lead_id, tipo, extra = {}) => { eventos.push({ id: 'e' + (++seq), lead_id, criado_em: new Date().toISOString(), tipo, texto: null, de_fase: null, para_fase: null, autor: null, ...extra }); };
for (const l of leads) evento(l.id, 'mudanca_fase', { para_fase: 'novo', criado_em: l.criado_em });
evento(ID(3), 'retorno', { texto: 'voltei a olhar', criado_em: antes(60) });
const fases = [['novo', 'Novo'], ['contatado', 'Contatado'], ['visita_agendada', 'Visita agendada'], ['proposta', 'Proposta'], ['vendido', 'Vendido'], ['perdido', 'Perdido']].map(([id, nome], i) => ({ id, nome, ordem: i + 1 }));
const motivos = [['preco', 'Preço'], ['localizacao', 'Localização'], ['sem_retorno', 'Sem retorno'], ['comprou_outro', 'Comprou em outro lugar'], ['outro', 'Outro']].map(([id, nome], i) => ({ id, nome, ordem: i + 1 }));

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = (id, email) => b64({ alg: 'HS256', typ: 'JWT' }) + '.' + b64({ sub: id, email, role: 'authenticated', aud: 'authenticated', exp: Math.floor(agora / 1000) + 7200 }) + '.assinatura';
const subDoToken = (req) => { const h = String(req.headers.authorization || '').replace('Bearer ', ''); try { return JSON.parse(Buffer.from(h.split('.')[1], 'base64url').toString()).sub; } catch { return null; } };
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS' };
const json = (res, status, corpo) => { res.writeHead(status, { ...cors, 'Content-Type': 'application/json' }); res.end(JSON.stringify(corpo)); };
const lerCorpo = async (req) => { const p = []; for await (const c of req) p.push(c); const s = Buffer.concat(p).toString(); try { return JSON.parse(s); } catch { return {}; } };
const eq = (u, campo) => { const v = u.searchParams.get(campo); return v && v.startsWith('eq.') ? v.slice(3) : null; };

http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://localhost:4174');
  if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end(); }
  if (u.pathname === '/__estado') return json(res, 200, { leads, eventos });
  if (u.pathname === '/auth/v1/token') {
    const c = await lerCorpo(req); const us = usuarios[c.email];
    if (!us || c.password !== 'senha-certa') return json(res, 400, { code: 400, error_code: 'invalid_credentials', msg: 'Invalid login credentials' });
    return json(res, 200, { access_token: jwt(us.id, c.email), token_type: 'bearer', expires_in: 7200, expires_at: Math.floor(agora / 1000) + 7200, refresh_token: 'r', user: { id: us.id, aud: 'authenticated', role: 'authenticated', email: c.email, app_metadata: {}, user_metadata: {}, created_at: antes(1000) } });
  }
  if (u.pathname === '/auth/v1/user') { const sub = subDoToken(req); const email = Object.keys(usuarios).find((e) => usuarios[e].id === sub); return email ? json(res, 200, { id: sub, aud: 'authenticated', email }) : json(res, 401, { msg: 'sem sessão' }); }
  if (u.pathname === '/auth/v1/logout') { res.writeHead(204, cors); return res.end(); }
  const sub = subDoToken(req);
  const ehPainel = Object.values(usuarios).some((x) => x.id === sub && x.painel);
  if (u.pathname === '/rest/v1/rpc/eh_usuario_painel') return json(res, 200, ehPainel);
  if (!ehPainel) return json(res, 200, []);

  if (u.pathname === '/rest/v1/fases') return json(res, 200, fases);
  if (u.pathname === '/rest/v1/motivos_perda') return json(res, 200, motivos);

  if (u.pathname === '/rest/v1/leads' && req.method === 'GET') {
    const id = eq(u, 'id');
    const ilike = (campo) => {
      const v = u.searchParams.get(campo);
      if (!v || !v.startsWith('ilike.')) return null;
      return new RegExp(v.slice(6).split('%').map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*'), 'i');
    };
    const rEmail = ilike('email');
    const rTel = ilike('telefone');
    let r = leads;
    if (id) r = r.filter((l) => l.id === id);
    if (rEmail) r = r.filter((l) => l.email && rEmail.test(l.email));
    if (rTel) r = r.filter((l) => rTel.test(l.telefone));
    return json(res, 200, r);
  }
  if (u.pathname === '/rest/v1/leads' && req.method === 'DELETE') {
    const id = eq(u, 'id');
    const i = leads.findIndex((l) => l.id === id);
    if (i >= 0) {
      leads.splice(i, 1);
      for (let k = eventos.length - 1; k >= 0; k--) if (eventos[k].lead_id === id) eventos.splice(k, 1);
    }
    res.writeHead(204, cors);
    return res.end();
  }
  if (u.pathname === '/rest/v1/lead_eventos' && req.method === 'GET') {
    const id = eq(u, 'lead_id');
    return json(res, 200, eventos.filter((e) => e.lead_id === id).sort((x, y) => Date.parse(y.criado_em) - Date.parse(x.criado_em)));
  }
  if (u.pathname === '/rest/v1/lead_eventos' && req.method === 'POST') {
    const c = await lerCorpo(req);
    if (c.autor !== sub) return json(res, 403, { code: '42501', message: 'new row violates row-level security policy' });
    evento(c.lead_id, c.tipo, { texto: c.texto, autor: c.autor });
    const l = leads.find((x) => x.id === c.lead_id); if (l && c.tipo === 'nota') l.ultimo_contato_em = new Date().toISOString();
    res.writeHead(201, cors); return res.end();
  }
  if (u.pathname === '/rest/v1/rpc/mudar_fase') {
    const c = await lerCorpo(req); const l = leads.find((x) => x.id === c.p_lead);
    if (!l) return json(res, 400, { code: 'P0001', message: 'lead nao encontrado' });
    if (c.p_fase === 'perdido' && !c.p_motivo) return json(res, 400, { code: '23514', message: 'perdido_exige_motivo' });
    const antiga = l.fase;
    l.fase = c.p_fase; l.motivo_perda = c.p_fase === 'perdido' ? c.p_motivo : null; l.vendido_em = c.p_fase === 'vendido' ? new Date().toISOString() : null;
    evento(l.id, 'mudanca_fase', { de_fase: antiga, para_fase: c.p_fase, texto: c.p_motivo ?? null, autor: sub });
    l.ultimo_contato_em = new Date().toISOString();
    return json(res, 200, null);
  }
  return json(res, 404, { message: 'rota nao simulada: ' + req.method + ' ' + u.pathname });
}).listen(4174, () => console.log('supabase de mentira em 4174'));

const painelConfig = (await import(pathToFileURL(path.join(root, 'api/painel-config.js')).href)).default;
const tipos = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://localhost:4173');
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (o) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)); return res; };
  if (u.pathname === '/api/painel-config') return painelConfig(req, res);
  let p = decodeURIComponent(u.pathname);
  if (p === '/painel' || p === '/painel/') p = '/painel/index.html';
  const f = path.resolve(root, '.' + p);
  if (!f.startsWith(path.resolve(root)) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.statusCode = 404; return res.end('404'); }
  res.setHeader('Content-Type', tipos[path.extname(f)] || 'application/octet-stream');
  fs.createReadStream(f).pipe(res);
}).listen(4173, () => console.log('site em 4173'));
