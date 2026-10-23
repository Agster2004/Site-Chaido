// Link temporário para baixar o book. O PDF fica em api/_book/<slug>.pdf (fora da parte pública do site);
// quem só digita o endereço do arquivo não consegue baixar: precisa de um link assinado, válido por 10 minutos,
// que o servidor só entrega depois de gravar o lead.
import { createHmac, timingSafeEqual } from 'node:crypto';

export const VALIDADE_MS = 10 * 60 * 1000;

// Mesmo segredo do hash de IP (já está na Vercel); BOOK_SECRET, se existir, tem prioridade.
function segredo() {
  return process.env.BOOK_SECRET || process.env.IP_HASH_SALT || '';
}

function assinatura(slug, exp) {
  return createHmac('sha256', segredo()).update('book:' + slug + ':' + exp).digest('hex').slice(0, 32);
}

export function criarToken(slug, agora = Date.now()) {
  if (!segredo() || !/^[a-z0-9-]+$/.test(slug)) return null;
  const exp = agora + VALIDADE_MS;
  return slug + '.' + exp + '.' + assinatura(slug, exp);
}

// Devolve o slug se o token for legítimo e não tiver vencido; senão, null.
export function verificarToken(token, agora = Date.now()) {
  if (!segredo()) return null;
  const partes = String(token || '').split('.');
  if (partes.length !== 3) return null;
  const [slug, exp, sig] = partes;
  if (!/^[a-z0-9-]+$/.test(slug) || !/^\d{10,16}$/.test(exp)) return null;
  if (Number(exp) < agora) return null;
  const esperado = Buffer.from(assinatura(slug, exp));
  const recebido = Buffer.from(sig);
  if (esperado.length !== recebido.length || !timingSafeEqual(esperado, recebido)) return null;
  return slug;
}
