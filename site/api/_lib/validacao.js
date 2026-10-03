// Validação do lead e detecção de robô. Funções puras, sem rede, fáceis de testar.

export function normalizarTelefone(entrada) {
  let d = String(entrada ?? '').replace(/\D/g, '');
  if (d.startsWith('55') && (d.length === 12 || d.length === 13)) d = d.slice(2);
  if (d.length !== 10 && d.length !== 11) return null;
  if (Number(d.slice(0, 2)) < 11) return null;
  if (d.length === 11 && d[2] !== '9') return null;
  if (d.length === 10 && !/[2-9]/.test(d[2])) return null;
  return '+55' + d;
}

const texto = (v) => String(v ?? '').trim();
const limitar = (v, max) => {
  const t = texto(v);
  return t ? t.slice(0, max) : null;
};

export function validarLead(corpo, { slugsValidos, versaoConsentimento }) {
  const c = corpo && typeof corpo === 'object' ? corpo : {};
  const erros = {};

  const nome = texto(c.nome).replace(/\s+/g, ' ');
  if (nome.length < 2 || nome.length > 120) erros.nome = 'Informe seu nome.';

  const telefone = normalizarTelefone(c.telefone);
  if (!telefone) erros.telefone = 'Informe um WhatsApp válido, com DDD.';

  const email = texto(c.email);
  if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))) {
    erros.email = 'E-mail inválido.';
  }

  const mensagem = texto(c.mensagem);
  if (mensagem.length > 1000) erros.mensagem = 'Mensagem muito longa (máximo 1000 caracteres).';

  const slug = texto(c.empreendimento_slug);
  if (slug && !slugsValidos.includes(slug)) erros.empreendimento_slug = 'Empreendimento inválido.';

  if (c.consentimento !== true) {
    erros.consentimento = 'É preciso aceitar para enviar.';
  } else if (texto(c.consentimento_versao) !== versaoConsentimento) {
    erros.consentimento = 'O texto de consentimento mudou. Recarregue a página.';
  }

  if (Object.keys(erros).length) return { ok: false, erros };

  return {
    ok: true,
    dados: {
      nome,
      telefone,
      email: email || null,
      mensagem: mensagem || null,
      empreendimento_slug: slug || null,
      origem_fonte: limitar(c.origem_fonte, 100),
      origem_meio: limitar(c.origem_meio, 100),
      origem_campanha: limitar(c.origem_campanha, 150),
      pagina_origem: limitar(c.pagina_origem, 300),
      referrer: limitar(c.referrer, 300),
      consentimento_versao: versaoConsentimento,
    },
  };
}

// Campo-isca preenchido, ou formulário enviado em menos de 3 segundos, é robô.
export function ehRobo(corpo) {
  const c = corpo && typeof corpo === 'object' ? corpo : {};
  if (texto(c.website) !== '') return true;
  const t = Number(c.tempo_ms);
  if (!Number.isFinite(t) || t < 3000) return true;
  return false;
}
