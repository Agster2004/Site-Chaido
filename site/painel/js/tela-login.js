import { app, h } from './ui.js';
import * as api from './api.js';

export function telaLogin(aoEntrar, erro = '') {
  app.innerHTML =
    '<main class="login"><form id="form-login" class="cartao">' +
    '<h1>Painel de leads</h1><p class="sub">Chiado Construtora</p>' +
    '<label>E-mail<input name="email" type="email" autocomplete="username" required></label>' +
    '<label>Senha<input name="senha" type="password" autocomplete="current-password" required></label>' +
    '<p class="erro" role="alert">' + h(erro) + '</p>' +
    '<button class="primario" type="submit">Entrar</button></form></main>';

  document.getElementById('form-login').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const dados = new FormData(ev.target);
    const botao = ev.target.querySelector('button');
    botao.disabled = true;
    botao.textContent = 'Entrando…';
    const { error } = await api.entrar(dados.get('email'), dados.get('senha'));
    if (error) return telaLogin(aoEntrar, 'E-mail ou senha incorretos.');
    aoEntrar();
  });
}
