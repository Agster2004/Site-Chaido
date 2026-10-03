import { estado, moldura, mensagemErro, nomeFase, nomeEmp, h } from './ui.js';
import * as api from './api.js';
import { tempoRelativo, telefoneBonito, linkWhatsapp, linkTelefone } from './format.js';

const chaveRascunho = (id) => 'rascunho-nota-' + id;

export async function telaFicha(id) {
  moldura('<p class="carregando">Carregando…</p>');
  let lead;
  let eventos;
  try {
    [lead, eventos] = await Promise.all([api.buscarLead(id), api.listarEventos(id)]);
  } catch (e) {
    return moldura('<p class="erro">' + h(mensagemErro(e)) + '</p>');
  }
  if (!lead) return moldura('<p class="vazio">Lead não encontrado. <a href="#/">Voltar à lista</a></p>');
  desenhar(lead, eventos);
}

function textoEvento(ev) {
  if (ev.tipo === 'nota') return '<strong>Anotação:</strong> ' + h(ev.texto);
  if (ev.tipo === 'retorno') return '<strong>Voltou a preencher o formulário.</strong>' + (ev.texto ? ' Mensagem: ' + h(ev.texto) : '');
  if (!ev.de_fase) return '<strong>Lead criado</strong>';
  const motivo = ev.texto ? ' (' + h(estado.motivos.find((m) => m.id === ev.texto)?.nome ?? ev.texto) + ')' : '';
  return '<strong>Fase:</strong> ' + h(nomeFase(ev.de_fase)) + ' → ' + h(nomeFase(ev.para_fase)) + motivo;
}

function desenhar(lead, eventos, aviso = '') {
  const emp = nomeEmp(lead.empreendimento_slug);
  const origem = [lead.origem_fonte, lead.origem_meio, lead.origem_campanha].filter(Boolean).join(' · ') || 'Direto ou não identificada';
  let rascunho = '';
  try { rascunho = localStorage.getItem(chaveRascunho(lead.id)) || ''; } catch (e) {}

  const fases = estado.fases.map((f) =>
    '<button type="button" class="chip' + (lead.fase === f.id ? ' on' : '') + (f.id === 'perdido' ? ' perigo' : '') + '" data-fase="' + h(f.id) + '">' + h(f.nome) + '</button>').join('');
  const motivos = estado.motivos.map((m) => '<option value="' + h(m.id) + '">' + h(m.nome) + '</option>').join('');
  const historico = eventos.map((ev) =>
    '<li><span class="l2">' + h(new Date(ev.criado_em).toLocaleString('pt-BR')) + '</span><span>' + textoEvento(ev) + '</span></li>').join('');

  moldura(
    '<a class="voltar" href="#/">← Voltar à lista</a>' +
    '<section class="cartao ficha">' +
    '<h1>' + h(lead.nome) + '</h1>' +
    '<p class="sub">' + h(telefoneBonito(lead.telefone)) + ' · chegou ' + h(tempoRelativo(lead.criado_em)) + (lead.retornos ? ' · voltou ' + lead.retornos + 'x' : '') + '</p>' +
    (lead.aviso_email_ok ? '' : '<p class="aviso">O e-mail de aviso deste lead não foi enviado.</p>') +
    '<div class="acoes"><a class="botao primario" href="' + h(linkWhatsapp(lead, emp)) + '" target="_blank" rel="noopener">Chamar no WhatsApp</a>' +
    '<a class="botao" href="' + h(linkTelefone(lead)) + '">Ligar</a></div>' +
    (aviso ? '<p class="erro" role="alert">' + h(aviso) + '</p>' : '') +
    '<dl class="dados"><dt>Interesse</dt><dd>' + h(emp) + '</dd><dt>Veio de</dt><dd>' + h(origem) + '</dd>' +
    (lead.email ? '<dt>E-mail</dt><dd>' + h(lead.email) + '</dd>' : '') +
    (lead.mensagem ? '<dt>Mensagem do cliente</dt><dd>' + h(lead.mensagem) + '</dd>' : '') +
    (lead.fase === 'perdido' && lead.motivo_perda ? '<dt>Motivo da perda</dt><dd>' + h(estado.motivos.find((m) => m.id === lead.motivo_perda)?.nome ?? lead.motivo_perda) + '</dd>' : '') +
    '</dl>' +
    '<h2>Fase da venda</h2><div class="filtros" id="fases">' + fases + '</div>' +
    '<div id="bloco-perda" class="perda" hidden><label>Motivo da perda<select id="motivo">' + motivos + '</select></label>' +
    '<button type="button" id="confirmar-perda" class="primario">Marcar como perdido</button></div>' +
    '<h2>Anotações</h2>' +
    '<form id="form-nota"><label class="sr-bloco">Nova anotação<textarea id="nota" rows="3" maxlength="2000">' + h(rascunho) + '</textarea></label>' +
    '<button type="submit" class="primario">Salvar anotação</button></form>' +
    '<h2>Histórico</h2><ul class="historico">' + historico + '</ul>' +
    '<p class="sub"><a href="#/pessoa">Dados da pessoa (LGPD): exportar ou apagar</a></p>' +
    '</section>'
  );

  async function recarregar(msg) {
    try {
      desenhar(await api.buscarLead(lead.id), await api.listarEventos(lead.id), msg);
    } catch (e) {
      moldura('<p class="erro">' + h(mensagemErro(e)) + '</p>');
    }
  }
  async function aplicar(fase, motivo) {
    try {
      await api.mudarFase(lead.id, fase, motivo);
    } catch (e) {
      console.error(e);
      return recarregar('Não foi possível mudar a fase. Tente de novo.');
    }
    recarregar();
  }

  document.getElementById('fases').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-fase]');
    if (!b || b.dataset.fase === lead.fase) return;
    if (b.dataset.fase === 'perdido') {
      document.getElementById('bloco-perda').hidden = false;
      document.getElementById('motivo').focus();
      return;
    }
    aplicar(b.dataset.fase, null);
  });
  document.getElementById('confirmar-perda').addEventListener('click', () => aplicar('perdido', document.getElementById('motivo').value));

  const campoNota = document.getElementById('nota');
  campoNota.addEventListener('input', () => {
    try { localStorage.setItem(chaveRascunho(lead.id), campoNota.value); } catch (e) {}
  });
  document.getElementById('form-nota').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const texto = campoNota.value.trim();
    if (!texto) return recarregar('Escreva a anotação antes de salvar.');
    try {
      await api.anotar(lead.id, texto);
    } catch (e) {
      console.error(e);
      return; // o rascunho continua guardado; nada se perde
    }
    try { localStorage.removeItem(chaveRascunho(lead.id)); } catch (e) {}
    recarregar();
  });
}
