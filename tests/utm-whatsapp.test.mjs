import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

// utm.js é um script de navegador (sem módulos); quando carregado no Node ele só exporta as funções puras.
const { rotuloOrigem, comOrigem, corpoVisita, acaoNaoContar } = createRequire(import.meta.url)('../site/assets/utm.js');

const insta = { fonte: 'instagram', meio: 'bio', campanha: '', referrer: '' };
const link = (texto) => 'https://wa.me/5513997770974' + (texto == null ? '' : '?text=' + encodeURIComponent(texto));
const textoDe = (href) => new URL(href).searchParams.get('text');

test('rotuloOrigem junta fonte, meio e campanha', () => {
  assert.equal(rotuloOrigem(insta), 'instagram/bio');
  assert.equal(rotuloOrigem({ fonte: 'instagram', meio: 'paid_social', campanha: 'carmo-out' }), 'instagram/paid_social/carmo-out');
});

test('rotuloOrigem sem UTM usa o site de origem; sem nada devolve vazio', () => {
  assert.equal(rotuloOrigem({ fonte: '', meio: '', campanha: '', referrer: 'https://l.instagram.com/?u=x' }), 'l.instagram.com');
  assert.equal(rotuloOrigem({ fonte: '', meio: '', campanha: '', referrer: 'https://www.google.com/' }), 'google.com');
  assert.equal(rotuloOrigem({ fonte: '', meio: '', campanha: '', referrer: '' }), '');
  assert.equal(rotuloOrigem(null), '');
});

test('rotuloOrigem limpa caracteres estranhos e limita o tamanho', () => {
  assert.equal(rotuloOrigem({ fonte: 'x<script>alert(1)</script>', meio: '', campanha: '' }), 'xscriptalert1/script');
  assert.ok(rotuloOrigem({ fonte: 'a'.repeat(200), meio: '', campanha: '' }).length <= 60);
});

test('comOrigem acrescenta a origem à mensagem do WhatsApp', () => {
  const novo = comOrigem(link('Olá, tenho interesse no Residencial Carmo.'), insta);
  assert.equal(textoDe(novo), 'Olá, tenho interesse no Residencial Carmo. (origem: instagram/bio)');
  assert.match(novo, /^https:\/\/wa\.me\/5513997770974\?text=/);
});

test('comOrigem cria a mensagem quando o link não tem texto', () => {
  assert.equal(textoDe(comOrigem(link(null), insta)), 'Olá! (origem: instagram/bio)');
});

test('comOrigem não repete a origem nem mexe sem origem ou em outros links', () => {
  const uma = comOrigem(link('Oi'), insta);
  assert.equal(comOrigem(uma, insta), uma);
  assert.equal(comOrigem(link('Oi'), { fonte: '', meio: '', campanha: '', referrer: '' }), link('Oi'));
  assert.equal(comOrigem('https://exemplo.com/?text=Oi', insta), 'https://exemplo.com/?text=Oi');
  assert.equal(comOrigem('not a url', insta), 'not a url');
});

test('corpoVisita usa a UTM quando existe', () => {
  assert.deepEqual(corpoVisita({ fonte: 'instagram', meio: 'bio', campanha: '', referrer: '', entrada: '/' }),
    { caminho: '/', fonte: 'instagram', meio: 'bio', campanha: '' });
});

test('corpoVisita sem UTM usa o site de origem como "referencia"; sem nada fica em branco (direto)', () => {
  assert.deepEqual(corpoVisita({ fonte: '', meio: '', campanha: '', referrer: 'https://l.instagram.com/?u=x', entrada: '/' }),
    { caminho: '/', fonte: 'l.instagram.com', meio: 'referencia', campanha: '' });
  assert.equal(corpoVisita({ fonte: '', meio: '', campanha: '', referrer: 'https://www.google.com/', entrada: '/' }).fonte, 'google.com');
  assert.deepEqual(corpoVisita({ fonte: '', meio: '', campanha: '', referrer: '', entrada: '/' }),
    { caminho: '/', fonte: '', meio: '', campanha: '' });
});

test('corpoVisita converte o endereço antigo do imóvel e a página inicial', () => {
  assert.equal(corpoVisita({ entrada: '/imovel.html' }, '?slug=carmo').caminho, '/imovel/carmo');
  assert.equal(corpoVisita({ entrada: '/imovel/garrett' }, '').caminho, '/imovel/garrett');
  assert.equal(corpoVisita({ entrada: '/index.html' }, '').caminho, '/');
  assert.equal(corpoVisita({ entrada: '/privacidade' }, '').caminho, '/privacidade');
  assert.equal(corpoVisita(null).caminho, '/');
});

test('acaoNaoContar: ?nao_contar=1 liga, ?nao_contar=0 desliga, qualquer outra coisa não faz nada', () => {
  assert.equal(acaoNaoContar('?nao_contar=1'), 'ligar');
  assert.equal(acaoNaoContar('?utm_source=x&nao_contar=1'), 'ligar');
  assert.equal(acaoNaoContar('?nao_contar=0'), 'desligar');
  assert.equal(acaoNaoContar('?nao_contar=2'), null);
  assert.equal(acaoNaoContar('?utm_source=instagram'), null);
  assert.equal(acaoNaoContar(''), null);
  assert.equal(acaoNaoContar(undefined), null);
});
