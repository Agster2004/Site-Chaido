// Regras do contador de visitas. Funções puras, fáceis de testar.

const ROBOS = /bot|crawl|spider|slurp|preview|headless|facebookexternalhit|whatsapp|telegram|discord|skype|linkedin|embedly|pinterest|quora|lighthouse|pingdom|monitor|uptime|vercel|curl|wget|python|node-fetch|axios|go-http|java\//i;

// Sem user-agent também conta como robô: navegador de verdade sempre manda.
export function ehBot(userAgent) {
  const ua = String(userAgent ?? '').trim();
  return !ua || ROBOS.test(ua);
}

// Minúsculas, só letras, números e _ . - / espaço; sem lixo e com tamanho máximo.
export function limparTexto(valor, max) {
  return String(valor ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9_.\-\/ ]/g, '')
    .trim()
    .slice(0, max);
}

// Só vale a home, a política e as páginas de imóveis que existem. Qualquer outra coisa é recusada,
// para ninguém encher o banco com endereços inventados.
export function caminhoPermitido(caminho, slugsValidos) {
  const c = String(caminho ?? '');
  if (c === '/' || c === '/privacidade') return c;
  const m = c.match(/^\/imovel\/([A-Za-z0-9_-]+)$/);
  return m && slugsValidos.includes(m[1]) ? c : null;
}
