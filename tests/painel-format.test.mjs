import test from 'node:test';
import assert from 'node:assert/strict';
import {
  escapeHtml, tempoRelativo, horasDesde, aguardandoContato, textoAguardando, diaSP, rotuloVisita, resumoVisitas, resumoNumeros,
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

test('textoAguardando mostra dias, não horas', () => {
  assert.equal(textoAguardando(antes(25 * 60), AGORA), 'aguardando contato há 1 dia');
  assert.equal(textoAguardando(antes(47 * 60), AGORA), 'aguardando contato há 1 dia');
  assert.equal(textoAguardando(antes(48 * 60), AGORA), 'aguardando contato há 2 dias');
  assert.equal(textoAguardando(antes(232 * 60), AGORA), 'aguardando contato há 9 dias');
  assert.doesNotMatch(textoAguardando(antes(232 * 60), AGORA), /\d+ h\b/);
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

// ---- visitas ----
const AGORA_V = Date.parse('2026-10-13T15:00:00Z'); // 12h em São Paulo
const v = (dia, caminho, fonte, meio, total) => ({ dia, caminho, fonte, meio, campanha: '', total });

test('diaSP usa o dia de São Paulo, não o do UTC', () => {
  assert.equal(diaSP(Date.parse('2026-10-13T15:00:00Z')), '2026-10-13');
  assert.equal(diaSP(Date.parse('2026-10-14T01:30:00Z')), '2026-10-13'); // 22h30 em SP ainda é dia 13
  assert.equal(diaSP(Date.parse('2026-10-14T03:30:00Z')), '2026-10-14');
});

test('rotuloVisita: fonte / meio, ou direto', () => {
  assert.equal(rotuloVisita({ fonte: 'instagram', meio: 'bio' }), 'instagram / bio');
  assert.equal(rotuloVisita({ fonte: 'google', meio: '' }), 'google');
  assert.equal(rotuloVisita({ fonte: '', meio: '' }), 'direto');
});

test('resumoVisitas soma hoje, 7 e 30 dias e ignora o que passou de 30 dias', () => {
  const linhas = [
    v('2026-10-13', '/', 'instagram', 'bio', 5),
    v('2026-10-13', '/imovel/carmo', '', '', 2),
    v('2026-10-10', '/', 'google', 'organic', 3),
    v('2026-10-07', '/', 'instagram', 'bio', 4),   // 6 dias atrás: dentro dos 7
    v('2026-10-06', '/', 'instagram', 'bio', 10),  // 7 dias atrás: fora dos 7, dentro dos 30
    v('2026-09-15', '/', 'instagram', 'bio', 1),   // 28 dias atrás: dentro dos 30
    v('2026-09-14', '/', 'instagram', 'bio', 100), // 29 dias atrás: último dia dos 30
    v('2026-09-13', '/', 'instagram', 'bio', 999), // 30 dias atrás: fora
  ];
  const r = resumoVisitas(linhas, [], AGORA_V);
  assert.equal(r.hoje, 7);
  assert.equal(r.ultimos7, 7 + 3 + 4);
  assert.equal(r.ultimos30, 7 + 3 + 4 + 10 + 1 + 100);
});

test('resumoVisitas agrupa por origem e por página, do maior para o menor', () => {
  const linhas = [
    v('2026-10-13', '/', 'instagram', 'bio', 5),
    v('2026-10-12', '/imovel/carmo', 'instagram', 'bio', 3),
    v('2026-10-12', '/', '', '', 4),
    v('2026-10-11', '/', 'google', '', 1),
  ];
  const r = resumoVisitas(linhas, [], AGORA_V);
  assert.deepEqual(r.porOrigem.map((o) => [o.rotulo, o.total]), [['instagram / bio', 8], ['direto', 4], ['google', 1]]);
  assert.deepEqual(r.porPagina.map((o) => [o.caminho, o.total]), [['/', 10], ['/imovel/carmo', 3]]);
  assert.equal(Math.round(r.porOrigem[0].pct), 62);
});

test('resumoVisitas: conversão = leads dos últimos 30 dias ÷ visitas dos últimos 30 dias', () => {
  const linhas = [v('2026-10-13', '/', '', '', 40), v('2026-10-01', '/', '', '', 60)];
  const leads = [
    { criado_em: '2026-10-13T12:00:00Z' }, { criado_em: '2026-10-02T12:00:00Z' },
    { criado_em: '2026-10-01T12:00:00Z' }, { criado_em: '2026-08-01T12:00:00Z' }, // este está fora dos 30 dias
  ];
  const r = resumoVisitas(linhas, leads, AGORA_V);
  assert.equal(r.leads30, 3);
  assert.equal(r.conversao, 3 / 100);
  assert.equal(resumoVisitas([], leads, AGORA_V).conversao, null); // sem visitas não divide por zero
});

test('resumoVisitas: porDia traz os últimos 7 dias, do mais antigo ao de hoje, com zero onde não houve visita', () => {
  const r = resumoVisitas([v('2026-10-13', '/', '', '', 5), v('2026-10-11', '/', '', '', 2)], [], AGORA_V);
  assert.deepEqual(r.porDia, [
    { dia: '2026-10-07', total: 0 }, { dia: '2026-10-08', total: 0 }, { dia: '2026-10-09', total: 0 },
    { dia: '2026-10-10', total: 0 }, { dia: '2026-10-11', total: 2 }, { dia: '2026-10-12', total: 0 },
    { dia: '2026-10-13', total: 5 },
  ]);
});
