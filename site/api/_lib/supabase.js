// Acesso ao Supabase com a chave de serviço. Só roda no servidor (api/*).
// A chave nunca sai daqui: vem de variável de ambiente da Vercel.

function config() {
  const url = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !chave) throw new Error('Supabase não configurado');
  return { url, chave };
}

// Chaves novas do Supabase (sb_secret_...) não são JWT e vão só no cabeçalho apikey.
// Chaves antigas (service_role, JWT que começa com "eyJ") também vão em Authorization.
export function cabecalhos(chave, extras = {}) {
  const h = { apikey: chave, 'Content-Type': 'application/json', ...extras };
  if (chave.startsWith('eyJ')) h.Authorization = 'Bearer ' + chave;
  return h;
}

async function chamar(caminho, opcoes = {}) {
  const { url, chave } = config();
  const resp = await fetch(url + caminho, {
    ...opcoes,
    headers: cabecalhos(chave, opcoes.headers),
  });
  // Não inclui o corpo da resposta no erro: pode ter dados pessoais.
  if (!resp.ok) throw new Error('Supabase ' + resp.status + ' em ' + caminho.split('?')[0]);
  const bruto = await resp.text();
  return bruto ? JSON.parse(bruto) : null;
}

export const rpc = (nome, args) =>
  chamar('/rest/v1/rpc/' + nome, { method: 'POST', body: JSON.stringify(args) });

export const marcarAviso = (id, ok) =>
  chamar('/rest/v1/leads?id=eq.' + encodeURIComponent(id), {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ aviso_email_ok: ok }),
  });
