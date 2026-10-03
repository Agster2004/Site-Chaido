import * as api from './api.js';
import { app, estado, mensagemErro, h } from './ui.js';
import { telaLogin } from './tela-login.js';
import { telaLista } from './tela-lista.js';

async function carregarBase() {
  const [fases, motivos, emp] = await Promise.all([
    api.listarFases(),
    api.listarMotivos(),
    fetch('/data/empreendimentos.json').then((r) => r.json()),
  ]);
  estado.fases = fases;
  estado.motivos = motivos;
  estado.empreendimentos = emp.items || [];
}

async function rotear() {
  const hash = location.hash || '#/';
  const ficha = hash.match(/^#\/lead\/([0-9a-f-]{36})$/i);
  if (ficha) return (await import('./tela-ficha.js')).telaFicha(ficha[1]);
  if (hash === '#/pessoa') return (await import('./tela-pessoa.js')).telaPessoa();
  return telaLista();
}

async function iniciarApp() {
  try {
    if (!(await api.ehUsuarioPainel())) {
      await api.sair();
      return telaLogin(iniciarApp, 'Esta conta não tem acesso ao painel.');
    }
    await carregarBase();
  } catch (e) {
    app.innerHTML = '<p class="erro">' + h(mensagemErro(e)) + '</p>';
    return;
  }
  window.removeEventListener('hashchange', rotear);
  window.addEventListener('hashchange', rotear);
  rotear();
}

async function boot() {
  try {
    await api.iniciar();
  } catch (e) {
    app.innerHTML = '<p class="erro">O painel não está configurado.</p>';
    return;
  }
  if (await api.sessao()) return iniciarApp();
  telaLogin(iniciarApp);
}

boot();
