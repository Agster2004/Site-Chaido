// Funções puras do painel (sem tela, sem rede): fáceis de testar.

export function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function tempoRelativo(iso, agora = Date.now()) {
  const min = Math.max(0, Math.floor((agora - Date.parse(iso)) / 60000));
  if (min < 1) return 'agora';
  if (min < 60) return 'há ' + min + ' min';
  const h = Math.floor(min / 60);
  if (h < 24) return 'há ' + h + ' h';
  const d = Math.floor(h / 24);
  return 'há ' + d + (d === 1 ? ' dia' : ' dias');
}

export function horasDesde(iso, agora = Date.now()) {
  return Math.floor((agora - Date.parse(iso)) / 3600000);
}

// Novo, sem nenhuma anotação ou mudança de fase, e chegou há mais de 24 h.
export function aguardandoContato(lead, agora = Date.now()) {
  return lead.fase === 'novo' && !lead.ultimo_contato_em && agora - Date.parse(lead.criado_em) > 24 * 3600000;
}

// "aguardando contato há 9 dias": só é usado depois de 24 h, então o tempo sai sempre em dias.
export function textoAguardando(iso, agora = Date.now()) {
  return 'aguardando contato ' + tempoRelativo(iso, agora);
}

// ---- visitas (contador próprio; só somas, sem dado pessoal) ----

// "2026-10-13": o dia em São Paulo, que é o mesmo que o banco usa para somar as visitas.
export function diaSP(ms) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms));
}

export function rotuloVisita(l) {
  if (!l.fonte) return 'direto';
  return l.meio ? l.fonte + ' / ' + l.meio : l.fonte;
}

function agrupar(linhas, chave, total) {
  const mapa = new Map();
  for (const l of linhas) mapa.set(chave(l), (mapa.get(chave(l)) || 0) + l.total);
  return [...mapa.entries()].map(([k, t]) => ({ chave: k, total: t, pct: total ? (t / total) * 100 : 0 })).sort((a, b) => b.total - a.total);
}

export function resumoVisitas(linhas, leads, agora = Date.now()) {
  const DIA = 86400000;
  const hoje = diaSP(agora);
  const d7 = diaSP(agora - 6 * DIA);
  const d30 = diaSP(agora - 29 * DIA);
  const soma = (l) => l.reduce((t, x) => t + x.total, 0);
  const dentro = (de) => linhas.filter((l) => l.dia >= de && l.dia <= hoje);
  const ult30 = dentro(d30);
  const ultimos30 = soma(ult30);
  const leads30 = leads.filter((l) => diaSP(Date.parse(l.criado_em)) >= d30).length;

  const porDia = [];
  for (let i = 6; i >= 0; i--) {
    const dia = diaSP(agora - i * DIA);
    porDia.push({ dia, total: soma(linhas.filter((l) => l.dia === dia)) });
  }

  return {
    hoje: soma(linhas.filter((l) => l.dia === hoje)),
    ultimos7: soma(dentro(d7)),
    ultimos30,
    leads30,
    conversao: ultimos30 ? leads30 / ultimos30 : null,
    porOrigem: agrupar(ult30, rotuloVisita, ultimos30).map((o) => ({ rotulo: o.chave, total: o.total, pct: o.pct })),
    porPagina: agrupar(ult30, (l) => l.caminho, ultimos30).map((o) => ({ caminho: o.chave, total: o.total, pct: o.pct })),
    porDia,
  };
}

export function resumoNumeros(leads, agora = Date.now()) {
  const ref = new Date(agora);
  const mesmoMes = (iso) => {
    const d = new Date(iso);
    return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
  };
  return {
    novos: leads.filter((l) => l.fase === 'novo').length,
    aguardando: leads.filter((l) => aguardandoContato(l, agora)).length,
    visitas: leads.filter((l) => l.fase === 'visita_agendada').length,
    vendidosNoMes: leads.filter((l) => l.fase === 'vendido' && l.vendido_em && mesmoMes(l.vendido_em)).length,
  };
}

export function filtrarLeads(leads, f = {}) {
  const de = f.de ? Date.parse(f.de + 'T00:00:00') : null;
  const ate = f.ate ? Date.parse(f.ate + 'T23:59:59.999') : null;
  return leads.filter((l) => {
    if (f.fase && l.fase !== f.fase) return false;
    if (f.slug && (l.empreendimento_slug || '') !== f.slug) return false;
    if (f.fonte && (l.origem_fonte || '') !== f.fonte) return false;
    const t = Date.parse(l.criado_em);
    if (de !== null && t < de) return false;
    if (ate !== null && t > ate) return false;
    return true;
  });
}

export const valorOrigem = (lead) => lead.origem_fonte || 'direto';

export function telefoneBonito(t) {
  const d = String(t ?? '').replace(/\D/g, '').replace(/^55/, '');
  if (d.length === 11) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
  if (d.length === 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
  return String(t ?? '');
}

export function linkWhatsapp(lead, nomeEmpreendimento) {
  const primeiroNome = String(lead.nome).split(' ')[0];
  const interesse = nomeEmpreendimento && nomeEmpreendimento !== 'Não informado' ? ' no ' + nomeEmpreendimento : '';
  const msg = 'Olá, ' + primeiroNome + '! Aqui é da Chiado Construtora. Recebemos o seu interesse' + interesse + '. Posso ajudar?';
  return 'https://wa.me/' + String(lead.telefone).replace(/\D/g, '') + '?text=' + encodeURIComponent(msg);
}

export const linkTelefone = (lead) => 'tel:' + lead.telefone;

// Separador ";" e BOM para abrir certo no Excel brasileiro.
// Valores que começam com = + - @ ganham um apóstrofo: texto digitado por visitantes não vira fórmula.
export function gerarCsv(leads, nomeFase, nomeEmp) {
  // O telefone (coluna 2) já é validado pelo banco (+55 e só dígitos), então não leva o apóstrofo.
  const celula = (v, proteger = true) => {
    let t = String(v ?? '');
    if (proteger && /^[=+\-@\t\r]/.test(t)) t = "'" + t;
    return '"' + t.replace(/"/g, '""') + '"';
  };
  const cab = ['Data', 'Nome', 'WhatsApp', 'E-mail', 'Empreendimento', 'Fase', 'Origem', 'Campanha', 'Mensagem', 'Retornos'];
  const linhas = leads.map((l) =>
    [
      new Date(l.criado_em).toLocaleString('pt-BR'),
      l.nome,
      l.telefone,
      l.email,
      nomeEmp(l.empreendimento_slug),
      nomeFase(l.fase),
      valorOrigem(l),
      l.origem_campanha,
      l.mensagem,
      l.retornos,
    ].map((v, i) => celula(v, i !== 2)).join(';')
  );
  return '﻿' + cab.join(';') + '\n' + linhas.join('\n') + '\n';
}
