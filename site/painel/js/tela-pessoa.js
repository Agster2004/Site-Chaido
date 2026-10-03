import { moldura, baixar, nomeFase, nomeEmp, h } from './ui.js';
import * as api from './api.js';
import { telefoneBonito } from './format.js';

export function telaPessoa() {
  moldura(
    '<section class="cartao"><h1>Dados da pessoa</h1>' +
    '<p class="sub">Busque por telefone ou e-mail para exportar ou apagar os dados de uma pessoa (LGPD).</p>' +
    '<form id="form-busca" class="busca"><input name="termo" required placeholder="Telefone ou e-mail" aria-label="Telefone ou e-mail"><button class="primario" type="submit">Buscar</button></form>' +
    '<div id="resultado" role="status" aria-live="polite"></div></section>'
  );

  const resultado = document.getElementById('resultado');

  async function buscar(termo) {
    resultado.innerHTML = '<p class="sub">Buscando…</p>';
    let leads;
    try {
      leads = await api.buscarPessoa(termo);
    } catch (e) {
      console.error(e);
      resultado.innerHTML = '<p class="erro">Não foi possível buscar. Tente de novo.</p>';
      return;
    }
    if (!leads.length) {
      resultado.innerHTML = '<p class="vazio">Nenhum cadastro com esse dado.</p>';
      return;
    }
    resultado.innerHTML =
      '<ul class="historico">' +
      leads.map((l) =>
        '<li><strong>' + h(l.nome) + '</strong><span class="l2">' + h(telefoneBonito(l.telefone)) + ' · ' + h(l.email || 'sem e-mail') + ' · ' + h(nomeEmp(l.empreendimento_slug)) + ' · ' + h(nomeFase(l.fase)) + '</span>' +
        '<span class="acoes"><button type="button" data-exportar="' + h(l.id) + '">Exportar dados</button>' +
        '<button type="button" class="perigo" data-apagar="' + h(l.id) + '" data-nome="' + h(l.nome) + '">Apagar dados</button></span></li>').join('') +
      '</ul>';
    resultado.dataset.termo = termo;
    resultado._leads = leads;
  }

  document.getElementById('form-busca').addEventListener('submit', (ev) => {
    ev.preventDefault();
    buscar(new FormData(ev.target).get('termo'));
  });

  resultado.addEventListener('click', async (ev) => {
    const exportar = ev.target.closest('[data-exportar]');
    const apagar = ev.target.closest('[data-apagar]');
    if (exportar) {
      const lead = resultado._leads.find((l) => l.id === exportar.dataset.exportar);
      try {
        const eventos = await api.listarEventos(lead.id);
        baixar('dados-' + lead.id + '.json', JSON.stringify({ lead, eventos }, null, 2), 'application/json');
      } catch (e) {
        console.error(e);
        resultado.insertAdjacentHTML('afterbegin', '<p class="erro">Não foi possível exportar. Tente de novo.</p>');
      }
    }
    if (apagar) {
      if (!window.confirm('Apagar todos os dados de ' + apagar.dataset.nome + '? Isso não pode ser desfeito.')) return;
      try {
        await api.apagarLead(apagar.dataset.apagar);
      } catch (e) {
        console.error(e);
        resultado.insertAdjacentHTML('afterbegin', '<p class="erro">Não foi possível apagar. Tente de novo.</p>');
        return;
      }
      buscar(resultado.dataset.termo);
    }
  });
}
