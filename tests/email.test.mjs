import test from 'node:test';
import assert from 'node:assert/strict';
import { montarEmail } from '../site/api/_lib/email.js';

const lead = {
  nome: 'Maria <b>Souza</b>',
  telefone: '+5513997770974',
  email: 'maria@exemplo.com',
  mensagem: '<script>alert(1)</script> Quero saber o valor.',
  empreendimento_slug: 'carmo',
  origem_fonte: 'instagram',
  origem_meio: 'social',
  origem_campanha: 'lancamento-carmo',
};
const nomes = { carmo: 'Residencial Carmo' };

test('montarEmail escapa HTML vindo do visitante', () => {
  const { html } = montarEmail(lead, { retorno: false, nomesEmpreendimentos: nomes });
  assert.equal(html.includes('<script>'), false);
  assert.equal(html.includes('<b>Souza</b>'), false);
  assert.match(html, /&lt;script&gt;/);
});

test('montarEmail tem assunto de lead novo e de retorno', () => {
  assert.equal(montarEmail(lead, { retorno: false, nomesEmpreendimentos: nomes }).assunto.startsWith('Novo lead: '), true);
  assert.equal(montarEmail(lead, { retorno: true, nomesEmpreendimentos: nomes }).assunto.startsWith('Lead voltou: '), true);
});

test('montarEmail inclui imóvel, origem e link do WhatsApp só com dígitos', () => {
  const { html, texto } = montarEmail(lead, { retorno: false, nomesEmpreendimentos: nomes });
  assert.match(texto, /Residencial Carmo/);
  assert.match(texto, /instagram \/ social \/ lancamento-carmo/);
  assert.match(html, /https:\/\/wa\.me\/5513997770974\?text=/);
});

test('montarEmail lida com campos vazios', () => {
  const { texto } = montarEmail({ ...lead, email: null, mensagem: null, empreendimento_slug: null, origem_fonte: null, origem_meio: null, origem_campanha: null }, { retorno: false, nomesEmpreendimentos: nomes });
  assert.match(texto, /Não informado/);
  assert.match(texto, /Direto ou não identificada/);
});
