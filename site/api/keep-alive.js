// Mantém o projeto do Supabase ativo no plano gratuito (ele pausa após 1 semana sem uso).
// A Vercel chama esta rota todo dia (veja "crons" no vercel.json) e ela faz uma leitura real no banco.
// Cron só roda no deploy de Produção (o main), não nas prévias.
import { ler } from './_lib/supabase.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false });
  }

  // Se CRON_SECRET existir na Vercel, a chamada do cron já vem com ele no cabeçalho Authorization.
  const segredo = process.env.CRON_SECRET;
  if (segredo && req.headers.authorization !== 'Bearer ' + segredo) {
    return res.status(401).json({ ok: false });
  }

  try {
    await ler('/rest/v1/fases?select=id&limit=1');
    return res.status(200).json({ ok: true });
  } catch (e) {
    // e.message tem só o status e a rota, nunca dados de pessoas
    console.error('keep-alive: falha ao ler o banco:', e.message);
    return res.status(500).json({ ok: false });
  }
}
