// Entrega a página do imóvel já com título, descrição e foto de compartilhamento
// (og:*) do empreendimento certo. Sem isso, WhatsApp/Instagram/Facebook, que não
// executam JavaScript, mostrariam sempre a prévia genérica da página.
// O resto da página continua sendo montado no navegador por assets/render.js.

// Domínio oficial do site. Para mudar, defina
// SITE_URL nas variáveis de ambiente da Vercel (ex: https://www.exemplo.com.br).
const SITE_URL = (process.env.SITE_URL || 'https://www.chiadoconstrutora.com.br').replace(/\/$/, '');

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function absolute(p) {
  return /^https?:\/\//.test(p) ? p : SITE_URL + '/' + String(p).replace(/^\//, '');
}

// Busca os arquivos do próprio site pela web (em vez de ler do disco da função),
// assim funciona igual em produção e nas prévias, sem depender de includeFiles.
async function fetchOwn(req, file) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const r = await fetch(proto + '://' + req.headers.host + file);
  if (!r.ok) throw new Error(file + ' respondeu ' + r.status);
  return r;
}

export default async function handler(req, res) {
  let html;
  try {
    html = await (await fetchOwn(req, '/imovel.html')).text();
  } catch (err) {
    res.status(500).send('Não foi possível carregar a página do empreendimento.');
    return;
  }

  try {
    const data = await (await fetchOwn(req, '/data/empreendimentos.json')).json();
    const items = data.items || [];
    const slug = Array.isArray(req.query.slug) ? req.query.slug[0] : req.query.slug;
    const item = items.find((i) => i.slug === slug);

    if (!item) {
      // Mesmo comportamento do render.js: slug desconhecido mostra o primeiro,
      // mas o status 404 evita que o Google indexe endereços inventados.
      res.status(404);
    }

    const it = item || items[0];
    if (it) {
      const title = it.nome + ' | Chiado Construtora';
      const desc = it.meta_descricao || it.descricao || '';
      const url = SITE_URL + '/imovel/' + encodeURIComponent(it.slug);
      const image = absolute(it.capa);

      // Tira as tags genéricas do modelo e põe as do empreendimento.
      html = html
        .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
        .replace(/<meta\s+name="description"[^>]*>\s*/i, '')
        .replace(/<meta\s+(?:property|name)="(?:og|twitter):(?:title|description|image|url|type)"[^>]*>\s*/gi, '')
        .replace(/<link\s+rel="canonical"[^>]*>\s*/i, '');

      const head =
        '<title>' + esc(title) + '</title>\n' +
        '<meta name="description" content="' + esc(desc) + '">\n' +
        '<link rel="canonical" href="' + esc(url) + '">\n' +
        '<meta property="og:type" content="website">\n' +
        '<meta property="og:url" content="' + esc(url) + '">\n' +
        '<meta property="og:title" content="' + esc(title) + '">\n' +
        '<meta property="og:description" content="' + esc(desc) + '">\n' +
        '<meta property="og:image" content="' + esc(image) + '">\n' +
        '<meta name="twitter:title" content="' + esc(title) + '">\n' +
        '<meta name="twitter:description" content="' + esc(desc) + '">\n' +
        '<meta name="twitter:image" content="' + esc(image) + '">\n';

      html = html.replace('</head>', head + '</head>');
    }
  } catch (err) {
    // Se algo falhar ao ler os dados, a página ainda abre com as tags genéricas.
  }

  // A página está em /imovel/<slug>; sem isso, "assets/..." apontaria para /imovel/assets/...
  html = html.replace(/<meta charset="UTF-8">/i, '<meta charset="UTF-8">\n<base href="/">');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, must-revalidate');
  res.send(html);
}
