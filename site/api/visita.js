// Conta uma visita (uma por sessão do navegador, na página de entrada). Só somas por dia, página e origem:
// nenhum IP, nome ou cookie. O visitante nunca vê erro daqui: se o banco falhar, a visita só não é contada.
import { rpc } from './_lib/supabase.js';
import { lerJsonProprio } from './_lib/proprio.js';
import { ehBot, limparTexto, caminhoPermitido } from './_lib/visita.js';

function lerCorpo(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try {
    return JSON.parse(String(req.body ?? ''));
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false });
  }

  // Só aceita envio vindo do próprio site.
  const origem = req.headers.origin;
  if (origem) {
    let host = '';
    try {
      host = new URL(origem).host;
    } catch {
      host = '';
    }
    if (host !== req.headers.host) return res.status(403).json({ ok: false });
  }

  // Robôs e prévias de link (WhatsApp, Facebook, etc.) não são visitas.
  if (ehBot(req.headers['user-agent'])) return res.status(204).end();

  const corpo = lerCorpo(req);
  if (!corpo || typeof corpo !== 'object') return res.status(400).json({ ok: false });

  let slugs;
  try {
    slugs = ((await lerJsonProprio(req, '/data/empreendimentos.json')).items || []).map((e) => e.slug);
  } catch (e) {
    console.error('visita: não leu a lista de empreendimentos:', e.message);
    return res.status(204).end();
  }

  const caminho = caminhoPermitido(corpo.caminho, slugs);
  if (!caminho) return res.status(400).json({ ok: false });

  try {
    await rpc('registrar_visita', {
      p: {
        caminho,
        fonte: limparTexto(corpo.fonte, 50),
        meio: limparTexto(corpo.meio, 50),
        campanha: limparTexto(corpo.campanha, 50),
      },
    });
  } catch (e) {
    // e.message tem só o status e a rota, nunca dados
    console.error('visita: falha ao gravar:', e.message);
  }
  return res.status(204).end();
}
