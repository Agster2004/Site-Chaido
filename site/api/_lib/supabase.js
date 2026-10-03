// Acesso ao Supabase com a chave de serviço. Só roda no servidor (api/*).
// A chave nunca sai daqui: vem de variável de ambiente da Vercel.

// Aceita o endereço do projeto com ou sem barra final e mesmo se vier com /rest/v1
// (a tela "Data API" do Supabase mostra a URL assim, e isso quebrava com PGRST125).
export function urlBase(valor) {
  return String(valor || '').trim().replace(/\/+$/, '').replace(/\/rest\/v1$/i, '').replace(/\/+$/, '');
}

function config() {
  const url = urlBase(process.env.SUPABASE_URL);
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
  const bruto = await resp.text();
  if (!resp.ok) {
    // Só status, rota, código e mensagem. Nunca "details"/"hint": podem trazer dados da pessoa.
    let extra = '';
    try {
      const c = JSON.parse(bruto);
      if (c && c.code) extra = ' [' + c.code + '] ' + String(c.message || '').slice(0, 160);
    } catch {}
    throw new Error('Supabase ' + resp.status + ' em ' + caminho.split('?')[0] + extra);
  }
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
