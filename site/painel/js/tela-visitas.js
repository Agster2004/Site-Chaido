import { estado, moldura, nomeEmp, mensagemErro, h } from './ui.js';
import * as api from './api.js';
import { resumoVisitas, diaSP } from './format.js';

const nomePagina = (caminho) => {
  if (caminho === '/') return 'Página inicial';
  if (caminho === '/privacidade') return 'Política de privacidade';
  const m = caminho.match(/^\/imovel\/(.+)$/);
  return m ? nomeEmp(m[1]) : caminho;
};

const pct = (x) => (x * 100).toFixed(1).replace('.', ',') + '%';
const dataCurta = (dia) => dia.slice(8, 10) + '/' + dia.slice(5, 7);

function tabela(titulo, linhas, rotuloDe) {
  if (!linhas.length) return '';
  const corpo = linhas.slice(0, 10).map((l) =>
    '<tr><td>' + h(rotuloDe(l)) + '</td><td class="n">' + l.total + '</td>' +
    '<td class="barra-celula"><span class="barra-visita" style="width:' + Math.max(2, Math.round(l.pct)) + '%"></span></td>' +
    '<td class="n sub">' + Math.round(l.pct) + '%</td></tr>').join('');
  return '<h2>' + h(titulo) + '</h2><table class="tabela-simples"><tbody>' + corpo + '</tbody></table>';
}

export async function telaVisitas() {
  moldura('<p class="carregando">Carregando…</p>');
  let linhas;
  let leads;
  try {
    const desde = diaSP(Date.now() - 29 * 86400000);
    [linhas, leads] = await Promise.all([api.listarVisitas(desde), api.listarLeads()]);
  } catch (e) {
    const semTabela = e && (e.code === 'PGRST205' || e.code === '42P01' || /visitas_diarias/.test(e.message || ''));
    return moldura('<p class="erro">' + h(semTabela
      ? 'A tabela de visitas ainda não existe no Supabase. É preciso rodar a migração 0002_visitas.sql.'
      : mensagemErro(e)) + '</p>');
  }

  const r = resumoVisitas(linhas, leads);
  const vazio = r.ultimos30 === 0;
  const maxDia = Math.max(1, ...r.porDia.map((d) => d.total));
  const dias = r.porDia.map((d) =>
    '<tr><td>' + dataCurta(d.dia) + '</td><td class="n">' + d.total + '</td>' +
    '<td class="barra-celula"><span class="barra-visita" style="width:' + (d.total ? Math.max(2, Math.round((d.total / maxDia) * 100)) : 0) + '%"></span></td></tr>').join('');

  moldura(
    '<h1 class="titulo-tela">Visitas ao site</h1>' +
    '<div class="numeros">' +
    '<div class="num"><span>Hoje</span><strong>' + r.hoje + '</strong></div>' +
    '<div class="num"><span>Últimos 7 dias</span><strong>' + r.ultimos7 + '</strong></div>' +
    '<div class="num"><span>Últimos 30 dias</span><strong>' + r.ultimos30 + '</strong></div>' +
    '<div class="num"><span>Viraram lead (30 dias)</span><strong>' + (r.conversao === null ? '—' : pct(r.conversao)) + '</strong></div></div>' +
    (vazio
      ? '<p class="vazio">Ainda não há visitas contadas nos últimos 30 dias.</p>'
      : '<h2>Por dia (últimos 7 dias)</h2><table class="tabela-simples"><tbody>' + dias + '</tbody></table>' +
        tabela('De onde vêm (30 dias)', r.porOrigem, (o) => o.rotulo) +
        tabela('Páginas de entrada (30 dias)', r.porPagina, (p) => nomePagina(p.caminho))) +
    '<p class="sub nota-visitas">Cada visita é uma sessão do navegador, contada na página em que a pessoa entrou. Robôs e prévias de link ' +
    'são ignorados. Não guardamos IP nem cookies. Os números podem diferir um pouco dos do Vercel Analytics, que conta de outro jeito. ' +
    'Quem entra por um link com UTM aparece com a fonte e o meio do link (por exemplo, instagram / bio); sem UTM, aparece o site de origem ou "direto".</p>'
  );
}
