// Entrega o PDF do book para quem tem um link assinado (criado por /api/lead). Sem token válido: 404.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verificarToken } from './_lib/book.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }
  const slug = verificarToken(req.query && req.query.t);
  if (!slug) return res.status(404).send('Link vencido ou inválido. Preencha o formulário de novo para receber outro.');

  let pdf;
  try {
    pdf = await readFile(path.join(path.dirname(fileURLToPath(import.meta.url)), '_book', slug + '.pdf'));
  } catch (e) {
    console.error('book: arquivo não encontrado para', slug);
    return res.status(404).send('Book indisponível no momento.');
  }
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="book-chiado-' + slug + '.pdf"');
  return res.status(200).send(pdf);
}
