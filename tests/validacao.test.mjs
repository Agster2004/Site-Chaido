import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizarTelefone, validarLead, ehRobo } from '../site/api/_lib/validacao.js';
import { hashIp, ipDaRequisicao } from '../site/api/_lib/ip.js';

test('normalizarTelefone aceita celular com e sem formatação e com +55', () => {
  assert.equal(normalizarTelefone('(13) 99777-0974'), '+5513997770974');
  assert.equal(normalizarTelefone('13997770974'), '+5513997770974');
  assert.equal(normalizarTelefone('+55 13 99777-0974'), '+5513997770974');
  assert.equal(normalizarTelefone('5513997770974'), '+5513997770974');
});

test('normalizarTelefone aceita fixo e DDD 55', () => {
  assert.equal(normalizarTelefone('(13) 3222-1000'), '+551332221000');
  assert.equal(normalizarTelefone('55 99777-0974'), '+5555997770974');
});

test('normalizarTelefone rejeita valores inválidos', () => {
  for (const v of ['', 'abc', '1234', '(13) 89777-0974', '(03) 99777-0974', '999999999', null, undefined]) {
    assert.equal(normalizarTelefone(v), null, String(v));
  }
});

const ctx = { slugsValidos: ['garrett', 'carmo'], versaoConsentimento: 'v1' };
const base = () => ({
  nome: '  Maria   Souza ',
  telefone: '(13) 99777-0974',
  email: 'maria@exemplo.com',
  mensagem: 'Quero saber o valor.',
  empreendimento_slug: 'carmo',
  consentimento: true,
  consentimento_versao: 'v1',
  origem_fonte: 'instagram',
  pagina_origem: '/imovel/carmo',
});

test('validarLead aceita um lead completo e limpa os campos', () => {
  const r = validarLead(base(), ctx);
  assert.equal(r.ok, true);
  assert.equal(r.dados.nome, 'Maria Souza');
  assert.equal(r.dados.telefone, '+5513997770974');
  assert.equal(r.dados.empreendimento_slug, 'carmo');
  assert.equal(r.dados.origem_meio, null);
});

test('validarLead aceita só os campos obrigatórios', () => {
  const r = validarLead({ nome: 'Ana', telefone: '13997770974', consentimento: true, consentimento_versao: 'v1' }, ctx);
  assert.equal(r.ok, true);
  assert.equal(r.dados.email, null);
  assert.equal(r.dados.mensagem, null);
  assert.equal(r.dados.empreendimento_slug, null);
});

test('validarLead exige consentimento e a versão vigente', () => {
  assert.equal(validarLead({ ...base(), consentimento: false }, ctx).erros.consentimento, 'É preciso aceitar para enviar.');
  assert.match(validarLead({ ...base(), consentimento_versao: 'v0' }, ctx).erros.consentimento, /mudou/);
});

test('validarLead aponta cada campo inválido', () => {
  const r = validarLead({ nome: 'A', telefone: '12', email: 'sem-arroba', mensagem: 'x'.repeat(1001), empreendimento_slug: 'outro', consentimento: true, consentimento_versao: 'v1' }, ctx);
  assert.equal(r.ok, false);
  assert.deepEqual(Object.keys(r.erros).sort(), ['email', 'empreendimento_slug', 'mensagem', 'nome', 'telefone']);
});

test('validarLead não quebra com corpo vazio ou inválido', () => {
  assert.equal(validarLead(null, ctx).ok, false);
  assert.equal(validarLead('texto', ctx).ok, false);
});

test('ehRobo detecta campo-isca e preenchimento rápido demais', () => {
  assert.equal(ehRobo({ website: 'http://spam', tempo_ms: 9000 }), true);
  assert.equal(ehRobo({ website: '', tempo_ms: 500 }), true);
  assert.equal(ehRobo({ website: '', tempo_ms: 'abc' }), true);
  assert.equal(ehRobo({ website: '', tempo_ms: 8000 }), false);
  assert.equal(ehRobo(null), true);
});

test('hashIp é estável, depende do sal e não contém o IP', () => {
  const a = hashIp('200.1.2.3', 'sal1');
  assert.equal(a, hashIp('200.1.2.3', 'sal1'));
  assert.notEqual(a, hashIp('200.1.2.3', 'sal2'));
  assert.equal(a.includes('200.1.2.3'), false);
  assert.match(a, /^[0-9a-f]{64}$/);
});

test('ipDaRequisicao usa o primeiro IP de x-forwarded-for', () => {
  assert.equal(ipDaRequisicao({ headers: { 'x-forwarded-for': '200.1.2.3, 10.0.0.1' } }), '200.1.2.3');
  assert.equal(ipDaRequisicao({ headers: {}, socket: { remoteAddress: '127.0.0.1' } }), '127.0.0.1');
  assert.equal(ipDaRequisicao({ headers: {} }), 'desconhecido');
});
