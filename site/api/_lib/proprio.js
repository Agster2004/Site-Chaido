// Lê arquivos do próprio site pela web (mesmo jeito de api/imovel.js).
// Ler do disco não funciona nas funções da Vercel.
export async function lerJsonProprio(req, caminho) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const r = await fetch(proto + '://' + req.headers.host + caminho);
  if (!r.ok) throw new Error(caminho + ' respondeu ' + r.status);
  return r.json();
}
