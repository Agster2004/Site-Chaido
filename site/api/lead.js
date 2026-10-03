// Recebe o formulário de interesse: valida, barra robôs, grava o lead e avisa por e-mail.
import { validarLead, motivoRobo } from './_lib/validacao.js';
import { hashIp, ipDaRequisicao } from './_lib/ip.js';
import { rpc, marcarAviso } from './_lib/supabase.js';
import { montarEmail, enviarEmail } from './_lib/email.js';
import { lerJsonProprio } from './_lib/proprio.js';

const LIMITE_POR_HORA = 5;

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

  const corpo = lerCorpo(req);

  const motivo = motivoRobo(corpo);
  // Campo-isca: só robô preenche. Responde como se tivesse dado certo, sem gravar nada.
  if (motivo === 'isca') return res.status(200).json({ ok: true });
  // Rápido demais pode ser uma pessoa com preenchimento automático: nada é gravado, mas
  // devolve erro para ela tentar de novo em instantes, sem perder o lead em silêncio.
  if (motivo === 'rapido') return res.status(400).json({ ok: false, erros: {} });

  let empreendimentos;
  let consentimento;
  try {
    empreendimentos = (await lerJsonProprio(req, '/data/empreendimentos.json')).items || [];
    consentimento = await lerJsonProprio(req, '/data/consentimento.json');
  } catch (e) {
    console.error('lead: não leu os JSONs do site:', e.message);
    return res.status(500).json({ ok: false });
  }

  const validacao = validarLead(corpo, {
    slugsValidos: empreendimentos.map((e) => e.slug),
    versaoConsentimento: consentimento.versao,
  });
  if (!validacao.ok) return res.status(400).json({ ok: false, erros: validacao.erros });

  let resultado;
  try {
    const ipHash = hashIp(ipDaRequisicao(req), process.env.IP_HASH_SALT || '');
    const permitido = await rpc('permitir_envio', { p_ip_hash: ipHash, p_limite: LIMITE_POR_HORA });
    if (permitido !== true) return res.status(200).json({ ok: true });

    resultado = await rpc('registrar_lead', { p: validacao.dados });
  } catch (e) {
    // e.message tem só o status e a rota, nunca dados do lead
    console.error('lead: falha ao gravar no banco:', e.message);
    return res.status(500).json({ ok: false });
  }

  // O lead já está salvo. Se o e-mail falhar, só marca o aviso como não enviado.
  try {
    const nomes = Object.fromEntries(empreendimentos.map((e) => [e.slug, e.nome]));
    await enviarEmail(montarEmail(validacao.dados, { retorno: resultado.novo === false, nomesEmpreendimentos: nomes }));
  } catch (e) {
    console.error('lead: aviso por e-mail não enviado:', e.message);
    await marcarAviso(resultado.id, false).catch(() => {});
  }

  return res.status(200).json({ ok: true });
}
