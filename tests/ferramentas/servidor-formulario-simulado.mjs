// Sobe o site (porta 4173) com a função REAL /api/lead; o Supabase e o Resend são simulados no próprio servidor.
// GET /__debug mostra o que a função mandou ao banco e ao e-mail. Como rodar: veja tests/ferramentas/LEIAME.md
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../site', import.meta.url));
process.env.SUPABASE_URL = 'https://proj.supabase.co/rest/v1/';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'chave-de-teste';
process.env.RESEND_API_KEY = 're_teste';
process.env.LEAD_NOTIFY_EMAILS = 'dono@exemplo.com';
process.env.LEAD_FROM_EMAIL = 'Chiado <onboarding@resend.dev>';
process.env.IP_HASH_SALT = 'sal-de-teste';

const chamadas = [];
const fetchReal = globalThis.fetch;
globalThis.fetch = async (url, opcoes = {}) => {
  const u = String(url);
  const resp = (corpo, ok = true, status = 200) => ({ ok, status, json: async () => corpo, text: async () => JSON.stringify(corpo ?? '') });
  if (u.includes('proj.supabase.co')) {
    chamadas.push({ tipo: 'supabase', url: u, corpo: opcoes.body ? JSON.parse(opcoes.body) : null });
    if (u.includes('/rpc/permitir_envio')) return resp(true);
    if (u.includes('/rpc/registrar_lead')) return resp({ id: 'abc', novo: true });
    return resp(null, true, 204);
  }
  if (u.includes('api.resend.com')) {
    const c = JSON.parse(opcoes.body);
    chamadas.push({ tipo: 'email', assunto: c.subject, para: c.to });
    return resp({ id: 'x' });
  }
  return fetchReal(url, opcoes);
};

const lead = (await import(pathToFileURL(path.join(root, 'api/lead.js')).href)).default;
const tipos = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.png': 'image/png', '.mp4': 'video/mp4' };

http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://localhost:4173');
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (o) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)); return res; };
  res.send = (b) => res.end(b);
  req.headers['x-forwarded-proto'] = 'http';

  if (u.pathname === '/__debug') return res.json(chamadas);
  if (u.pathname === '/api/lead') {
    const partes = [];
    for await (const p of req) partes.push(p);
    const bruto = Buffer.concat(partes).toString('utf8');
    try { req.body = bruto ? JSON.parse(bruto) : {}; } catch { req.body = bruto; }
    return lead(req, res);
  }
  let p = decodeURIComponent(u.pathname);
  if (p === '/') p = '/index.html';
  const f = path.resolve(root, '.' + p);
  if (!f.startsWith(path.resolve(root)) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.statusCode = 404; return res.end('404'); }
  res.setHeader('Content-Type', tipos[path.extname(f)] || 'application/octet-stream');
  fs.createReadStream(f).pipe(res);
}).listen(4173, () => console.log('ok'));
