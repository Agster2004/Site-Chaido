// E-mail de aviso de lead novo, enviado pelo Resend (https://resend.com).

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export function montarEmail(lead, { retorno = false, nomesEmpreendimentos = {} }) {
  const imovel = nomesEmpreendimentos[lead.empreendimento_slug] || 'Não informado';
  const origem =
    [lead.origem_fonte, lead.origem_meio, lead.origem_campanha].filter(Boolean).join(' / ') ||
    'Direto ou não identificada';
  const primeiroNome = String(lead.nome).split(' ')[0];
  const zap =
    'https://wa.me/' +
    String(lead.telefone).replace(/\D/g, '') +
    '?text=' +
    encodeURIComponent('Olá, ' + primeiroNome + '! Aqui é da Chiado Construtora. Recebemos o seu interesse. Posso ajudar?');

  const assunto = (retorno ? 'Lead voltou: ' : 'Novo lead: ') + lead.nome + ' — ' + imovel;
  const linhas = [
    ['Nome', lead.nome],
    ['WhatsApp', lead.telefone],
    ['E-mail', lead.email || '—'],
    ['Interesse', imovel],
    ['Origem', origem],
    ['Mensagem', lead.mensagem || '—'],
  ];

  const texto =
    (retorno ? 'Este lead voltou a preencher o formulário.\n\n' : '') +
    linhas.map(([k, v]) => k + ': ' + v).join('\n') +
    '\n\nChamar no WhatsApp: ' + zap + '\n';

  const html =
    '<div style="font-family:Arial,sans-serif;font-size:15px;color:#1B2118">' +
    (retorno ? '<p><strong>Este lead voltou a preencher o formulário.</strong></p>' : '') +
    '<table style="border-collapse:collapse">' +
    linhas
      .map(
        ([k, v]) =>
          '<tr><td style="padding:4px 12px 4px 0;color:#555">' + esc(k) + '</td><td style="padding:4px 0">' + esc(v) + '</td></tr>'
      )
      .join('') +
    '</table>' +
    '<p><a href="' + esc(zap) + '" style="display:inline-block;background:#1F4029;color:#fff;padding:10px 18px;border-radius:4px;text-decoration:none">Chamar no WhatsApp</a></p>' +
    '</div>';

  return { assunto, html, texto };
}

export async function enviarEmail({ assunto, html, texto }) {
  const chave = process.env.RESEND_API_KEY;
  const para = (process.env.LEAD_NOTIFY_EMAILS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const de = process.env.LEAD_FROM_EMAIL;
  if (!chave || !para.length || !de) throw new Error('E-mail não configurado');

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + chave, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: de, to: para, subject: assunto, html, text: texto }),
  });
  if (!r.ok) throw new Error('Resend respondeu ' + r.status);
}
