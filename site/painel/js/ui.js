import { escapeHtml as h } from './format.js';
import * as api from './api.js';

export const app = document.getElementById('app');

export const estado = {
  fases: [], motivos: [], empreendimentos: [], leads: [],
  filtros: { fase: '', slug: '', fonte: '', de: '', ate: '' },
};

export const nomeFase = (id) => estado.fases.find((f) => f.id === id)?.nome ?? id;
export const nomeEmp = (slug) => estado.empreendimentos.find((e) => e.slug === slug)?.nome ?? (slug || 'Não informado');
export const mensagemErro = (e) => {
  console.error(e);
  return 'Não foi possível carregar. Verifique a internet e tente de novo.';
};

export function moldura(conteudo) {
  const aba = location.hash === '#/visitas' ? 'visitas' : location.hash === '#/pessoa' ? 'pessoa' : 'leads';
  app.innerHTML =
    '<header class="topo"><div class="abas"><a class="marca' + (aba === 'leads' ? ' ativa' : '') + '" href="#/">Leads</a>' +
    '<a class="aba' + (aba === 'visitas' ? ' ativa' : '') + '" href="#/visitas">Visitas</a></div><nav><a href="#/pessoa">Dados da pessoa</a>' +
    '<button id="sair" class="link" type="button">Sair</button></nav></header>' +
    '<main class="conteudo">' + conteudo + '</main>';
  document.getElementById('sair').addEventListener('click', async () => {
    await api.sair();
    location.hash = '';
    location.reload();
  });
}

export function baixar(nome, texto, tipo) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([texto], { type: tipo }));
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export { h };
