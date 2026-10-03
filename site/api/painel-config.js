// Entrega ao painel a URL e a chave pública (anon) do Supabase.
// A chave anon é pública por desenho: quem manda é a regra de acesso (RLS) do banco.
import { urlBase } from './_lib/supabase.js';

export default function handler(req, res) {
  const url = urlBase(process.env.SUPABASE_URL);
  const anonKey = process.env.SUPABASE_ANON_KEY;
  res.setHeader('Cache-Control', 'no-store');
  if (!url || !anonKey) return res.status(500).json({ ok: false });
  return res.status(200).json({ url, anonKey });
}
