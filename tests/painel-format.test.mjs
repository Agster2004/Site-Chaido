import test from 'node:test';
import assert from 'node:assert/strict';
import {
  escapeHtml, tempoRelativo, horasDesde, aguardandoContato, resumoNumeros,
  filtrarLeads, valorOrigem, telefoneBonito, linkWhatsapp, linkTelefone, gerarCsv,
} from '../site/painel/js/format.js';

const AGORA = Date.parse('2026-10-03T15:00:00Z');
const antes = (min) => new Date(AGORA - min * 60000).toISOString();
const lead = (extra = {}) => ({
  id: '1', nome: 'Maria Souza', telefone: '+5513997770974', email: null, mensagem: null,
  empreendimento_slug: 'carmo', fase: 'novo', origem_fonte: 'instagram', origem_meio: null, origem_campanha: null,
  retornos: 0, criado_em: antes(30), ultimo_contato_em: null, vendido_em: null, ...extra,
});

test('escapeHtml neutraliza HTML', () => {
  assert.equal(escapeHtml('<img src=x onerror="a">&\''), '&lt;img src=x onerror=&quot;a&quot;&gt;&amp;&#39;');
  assert.equal(escapeHtml(null), '');
});

test('tempoRelativo', () => {
  assert.equal(tempoRelativo(antes(0), AGORA), 'agora');
  assert.equal(tempoRelativo(antes(12), AGORA), 'há 12 min');
  assert.equal(tempoRelativo(antes(180), AGORA), 'há 3 h');
  assert.equal(tempoRelativo(antes(60 * 24), AGORA), 'há 1 dia');
  assert.equal(tempoRelativo(antes(60 * 24 * 5), AGORA), 'há 5 dias');
});

test('horasDesde', () => assert.equal(horasDesde(antes(26 * 60), AGORA), 26));

test('aguardandoContato: só lead novo, sem contato, com mais de 24 h', () => {
  assert.equal(aguardandoContato(lead({ criado_em: antes(26 * 60) }), AGORA), true);
  assert.equal(aguardandoContato(lead({ criado_em: antes(23 * 60) }), AGORA), false);
  assert.equal(aguardandoContato(lead({ criado_em: antes(26 * 60), ultimo_contato_em: antes(60) }), AGORA), false);
  assert.equal(aguardandoContato(lead({ criado_em: antes(26 * 60), fase: 'contatado' }), AGORA), false);
});

test('resumoNumeros', () => {
  const leads = [
    lead({ id: 'a' }),
    lead({ id: 'b', criado_em: antes(26 * 60) }),
    lead({ id: 'c', fase: 'visita_agendada' }),
    lead({ id: 'd', fase: 'vendido', vendido_em: '2026-10-01T12:00:00Z' }),
    lead({ id: 'e', fase: 'vendido', vendido_em: '2026-09-20T12:00:00Z' }),
  ];
  assert.deepEqual(resumoNumeros(leads, AGORA), { novos: 2, aguardando: 1, visitas: 1, vendidosNoMes: 1 });
});

test('filtrarLeads por fase, imóvel, origem e datas', () => {
  const leads = [
    lead({ id: 'a', criado_em: '2026-10-01T12:00:00Z' }),
    lead({ id: 'b', empreendimento_slug: 'garrett', fase: 'proposta', origem_fonte: 'google', criado_em: '2026-09-10T12:00:00Z' }),
  ];
  assert.deepEqual(filtrarLeads(leads, { fase: 'proposta' }).map((l) => l.id), ['b']);
  assert.deepEqual(filtrarLeads(leads, { slug: 'carmo' }).map((l) => l.id), ['a']);
  assert.deepEqual(filtrarLeads(leads, { fonte: 'google' }).map((l) => l.id), ['b']);
  assert.deepEqual(filtrarLeads(leads, { de: '2026-09-30' }).map((l) => l.id), ['a']);
  assert.deepEqual(filtrarLeads(leads, { ate: '2026-09-30' }).map((l) => l.id), ['b']);
  assert.equal(filtrarLeads(leads, {}).length, 2);
});

test('valorOrigem e telefoneBonito', () => {
  assert.equal(valorOrigem(lead()), 'instagram');
  assert.equal(valorOrigem(lead({ origem_fonte: null })), 'direto');
  assert.equal(telefoneBonito('+5513997770974'), '(13) 99777-0974');
  assert.equal(telefoneBonito('+551332221000'), '(13) 3222-1000');
});

test('links de WhatsApp e telefone', () => {
  const zap = linkWhatsapp(lead(), 'Residencial Carmo');
  assert.match(zap, /^https:\/\/wa\.me\/5513997770974\?text=/);
  assert.match(decodeURIComponent(zap), /Olá, Maria!/);
  assert.match(decodeURIComponent(zap), /Residencial Carmo/);
  assert.equal(linkTelefone(lead()), 'tel:+5513997770974');
});

test('gerarCsv: cabeçalho, escape de aspas e proteção contra fórmulas de planilha', () => {
  const csv = gerarCsv(
    [lead({ nome: '=CMD()', mensagem: 'disse "oi"; tchau', retornos: 2 })],
    (id) => ({ novo: 'Novo' }[id] || id),
    (slug) => ({ carmo: 'Residencial Carmo' }[slug] || slug)
  );
  assert.equal(csv.startsWith('﻿Data;Nome;WhatsApp;E-mail;Empreendimento;Fase;Origem;Campanha;Mensagem;Retornos'), true);
  assert.match(csv, /"'=CMD\(\)"/);
  assert.match(csv, /"disse ""oi""; tchau"/);
  assert.match(csv, /Residencial Carmo/);
  assert.match(csv, /;"\+5513997770974";/);
  assert.equal(csv.includes("\"'+5513997770974"), false);
});
