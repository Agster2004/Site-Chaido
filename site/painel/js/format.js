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
