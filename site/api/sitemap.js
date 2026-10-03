// Gera o sitemap.xml a partir de data/empreendimentos.json, assim um empreendimento
// novo cadastrado no painel entra no sitemap sozinho, sem editar arquivo.
// Domínio oficial: para mudar, defina SITE_URL nas variáveis de ambiente da Vercel.
const SITE_URL = (process.env.SITE_URL || 'https://www.chiadoconstrutora.com.br').replace(/\/$/, '');

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default async function handler(req, res) {
  const urls = [SITE_URL + '/'];

  try {
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const r = await fetch(proto + '://' + req.headers.host + '/data/empreendimentos.json');
    if (r.ok) {
      const data = await r.json();
      (data.items || []).forEach((i) => {
        if (i.slug) urls.push(SITE_URL + '/imovel/' + encodeURIComponent(i.slug));
      });
    }
  } catch (err) {
    // se não conseguir ler os dados, ainda entrega o sitemap só com a home
  }

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) => '  <url><loc>' + esc(u) + '</loc></url>').join('\n') +
    '\n</urlset>\n';

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, must-revalidate');
  res.send(xml);
}
