import { estado, moldura, mensagemErro, nomeFase, nomeEmp, baixar, h } from './ui.js';
import * as api from './api.js';
import { tempoRelativo, horasDesde, aguardandoContato, resumoNumeros, filtrarLeads, valorOrigem, gerarCsv } from './format.js';

export async function telaLista() {
  moldura('<p class="carregando">Carregando…</p>');
  try {
    estado.leads = await api.listarLeads();
  } catch (e) {
    return moldura('<p class="erro">' + h(mensagemErro(e)) + '</p>');
  }
  desenhar();
}

function quando(l, agora) {
  const texto = aguardandoContato(l, agora) ? 'aguardando contato há ' + horasDesde(l.criado_em, agora) + ' h' : tempoRelativo(l.criado_em, agora);
  const voltou = l.retornos ? ' · voltou ' + l.retornos + (l.retornos === 1 ? ' vez' : ' vezes') : '';
  return h(nomeEmp(l.empreendimento_slug)) + ' · ' + h(valorOrigem(l)) + ' · ' + h(texto) + h(voltou);
}

function classes(l, agora) {
  return (l.fase === 'novo' ? 'novo ' : '') + (aguardandoContato(l, agora) ? 'aguardando' : '');
}

function desenhar() {
  const agora = Date.now();
  const n = resumoNumeros(estado.leads, agora);
  const f = estado.filtros;
  const lista = filtrarLeads(estado.leads, f);
  const fontes = [...new Set(estado.leads.map((l) => l.origem_fonte).filter(Boolean))].sort();

  const chips =
    '<button type="button" class="chip' + (f.fase ? '' : ' on') + '" data-fase="">Todos</button>' +
    estado.fases.map((x) => '<button type="button" class="chip' + (f.fase === x.id ? ' on' : '') + '" data-fase="' + h(x.id) + '">' + h(x.nome) + '</button>').join('');

  const opEmp = ['<option value="">Todos os imóveis</option>']
    .concat(estado.empreendimentos.map((e) => '<option value="' + h(e.slug) + '"' + (f.slug === e.slug ? ' selected' : '') + '>' + h(e.nome) + '</option>'))
    .join('');
  const opFonte = ['<option value="">Todas as origens</option>']
    .concat(fontes.map((x) => '<option value="' + h(x) + '"' + (f.fonte === x ? ' selected' : '') + '>' + h(x) + '</option>'))
    .join('');

  const cartoes = lista.map((l) =>
    '<li><a class="lead ' + classes(l, agora) + '" href="#/lead/' + h(l.id) + '">' +
    '<span class="l1"><strong>' + h(l.nome) + '</strong><span class="fase fase-' + h(l.fase) + '">' + h(nomeFase(l.fase)) + '</span></span>' +
    '<span class="l2">' + quando(l, agora) + '</span></a></li>').join('');

  const linhas = lista.map((l) =>
    '<tr class="' + classes(l, agora) + '"><td><a href="#/lead/' + h(l.id) + '"><strong>' + h(l.nome) + '</strong></a></td>' +
    '<td>' + h(nomeEmp(l.empreendimento_slug)) + '</td><td>' + h(valorOrigem(l)) + '</td>' +
    '<td><span class="fase fase-' + h(l.fase) + '">' + h(nomeFase(l.fase)) + '</span></td>' +
    '<td>' + h(aguardandoContato(l, agora) ? 'aguardando contato há ' + horasDesde(l.criado_em, agora) + ' h' : tempoRelativo(l.criado_em, agora)) + '</td></tr>').join('');

  moldura(
    '<div class="numeros">' +
    '<div class="num"><span>Novos</span><strong>' + n.novos + '</strong></div>' +
    '<div class="num alerta"><span>Aguardando contato há +24 h</span><strong>' + n.aguardando + '</strong></div>' +
    '<div class="num"><span>Visitas agendadas</span><strong>' + n.visitas + '</strong></div>' +
    '<div class="num"><span>Vendidos no mês</span><strong>' + n.vendidosNoMes + '</strong></div></div>' +
    '<div class="filtros" id="chips">' + chips + '</div>' +
    '<div class="filtros"><select id="f-slug" aria-label="Imóvel">' + opEmp + '</select>' +
    '<select id="f-fonte" aria-label="Origem">' + opFonte + '</select>' +
    '<label class="sr">De <input id="f-de" type="date" value="' + h(f.de) + '"></label>' +
    '<label class="sr">Até <input id="f-ate" type="date" value="' + h(f.ate) + '"></label></div>' +
    '<div class="barra"><span class="sub">' + lista.length + (lista.length === 1 ? ' lead' : ' leads') + '</span>' +
    '<button type="button" id="exportar">Exportar para planilha</button></div>' +
    (lista.length
      ? '<ul class="cards">' + cartoes + '</ul><table class="tabela"><thead><tr><th>Nome</th><th>Imóvel</th><th>Origem</th><th>Fase</th><th>Chegou</th></tr></thead><tbody>' + linhas + '</tbody></table>'
      : '<p class="vazio">Nenhum lead com esses filtros.</p>')
  );

  document.getElementById('chips').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-fase]');
    if (!b) return;
    estado.filtros.fase = b.dataset.fase;
    desenhar();
  });
  const ligar = (id, chave) => document.getElementById(id).addEventListener('change', (ev) => { estado.filtros[chave] = ev.target.value; desenhar(); });
  ligar('f-slug', 'slug'); ligar('f-fonte', 'fonte'); ligar('f-de', 'de'); ligar('f-ate', 'ate');
  document.getElementById('exportar').addEventListener('click', () => {
    baixar('leads-chiado.csv', gerarCsv(lista, nomeFase, nomeEmp), 'text/csv;charset=utf-8');
  });
}
