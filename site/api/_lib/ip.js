import { createHash } from 'node:crypto';

// O IP nunca é guardado em texto: só este hash, com um sal secreto (IP_HASH_SALT).
export function hashIp(ip, sal) {
  return createHash('sha256').update(String(sal) + '|' + String(ip)).digest('hex');
}

export function ipDaRequisicao(req) {
  const xf = req.headers['x-forwarded-for'];
  const bruto = Array.isArray(xf) ? xf[0] : String(xf ?? '');
  const primeiro = bruto.split(',')[0].trim();
  return primeiro || req.socket?.remoteAddress || 'desconhecido';
}
