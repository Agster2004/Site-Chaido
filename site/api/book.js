// Entrega o PDF do book para quem tem um link assinado (criado por /api/lead). Sem token válido: 404.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
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

  // Na Vercel o arquivo vem junto da função (includeFiles); o ponto de partida muda conforme a pasta raiz do projeto.
  const bases = [path.join(process.cwd(), 'api', '_book'), path.join(process.cwd(), 'site', 'api', '_book')];
  if (typeof __dirname === 'string') bases.unshift(path.join(__dirname, '_book'));
  let pdf = null;
  for (const base of bases) {
    try {
      pdf = await readFile(path.join(base, slug + '.pdf'));
      break;
    } catch {
      // tenta a próxima pasta
    }
  }
  if (!pdf) {
    console.error('book: arquivo não encontrado para', slug);
    return res.status(404).send('Book indisponível no momento.');
  }
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="book-chiado-' + slug + '.pdf"');
  return res.status(200).send(pdf);
}
