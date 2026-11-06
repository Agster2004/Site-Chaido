import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { responderComModelo } from '../piloto-atendimento/modelo.mjs';

const { items } = JSON.parse(readFileSync(new URL('../site/data/empreendimentos.json', import.meta.url)));
const casos = [
  ['pergunta sobre loja preserva o endereço do escritório', ['vcs tem loja'], /^Posso te ajudar por aqui ou chamar alguém da nossa equipe\./, false],
  ['como funciona após selecionar Garrett', ['garret', 'como funciona?'], /Garrett.*Ocian.*3 dormitórios/, false],
  ['descrição do Garrett após escolha', ['garret', 'como é?'], /Garrett.*Ocian.*3 dormitórios/, false],
  ['descrição do Carmo após escolha', ['Carmo', 'me fala mais'], /Carmo.*Vila Tupy.*2 suítes/, false],
  ['Garet fixa o foco', ['sim, quais?', 'garet'], /Garrett/, false],
  ['pergunta depois de Garet', ['garet', 'que casas?'], /94,5/, false],
  ...['vcs vem sitio?', 'sítio?', 'vendem terreno?', 'tem fazenda?', 'vcs vendem apartamento?']
    .map(texto => [texto, [texto], /casas em condomínio/, false]),
  ['chácara não encaminha', ['vcs vendem chacara'], /casas em condomínio/, false],
  ['continua após pergunta sobre chácara', ['vcs vendem chacara', 'que casas'], /Garrett.*Carmo/, false],
  ['opções para quem ainda não escolheu', ['q casas?'], /Garrett.*Ocian.*Carmo.*Vila Tupy/, false],
  ['cliente não conhece o catálogo', ['q casas?', 'nem sei os q tem'], /Garrett.*Carmo/, false],
  ['Forte sem residencial confirmado', ['q casas?', 'nem sei os q tem', 'forte'], /desse bairro.*Garrett.*Carmo/, false],
  ['bairro seleciona o residencial', ['Ocian', 'q casas?'], /94,5/, false],
  ['saudação simples', ['oi'], /^Oi! Como posso te ajudar\?$/, false],
  ['saudação com pergunta', ['oi, tem piscina no garret?'], /Garrett não tem piscina.*Carmo tem piscina/, false],
  ['quantidade geral', ['vcs tem quantas casas?'], /2 casas.*5 casas/, false],
  ['localização', ['vcs tem casa de praia?'], /Praia Grande.*Ocian.*Vila Tupy/, false],
  ['unidades com abreviação', ['garrey', 'q casas que tem la?'], /94,5[\s\S]*89,1/, false],
  ['troca de residencial', ['Garrett', 'e do Carmo', 'quantas casas tem?'], /Carmo tem 5 casas/, false],
  ['garagem no residencial em foco', ['Garrett', 'e do Carmo', 'tem garagem?'], /Carmo tem garagem individual/, false],
  ['piscina no contexto', ['Garrett', 'tem churrasqueira?', 'e piscina?'], /Garrett não tem piscina.*Carmo tem piscina/, false],
  ['detalhe sem confirmação', ['Carmo', 'tem churrasqueira?'], /confirmar se o Residencial Carmo/, true],
  ['disponibilidade', ['Garrett', 'quais casas estão disponíveis?'], /equipe/, true],
  ['atendente em mensagens consecutivas', ['quero falar com um humano\nsobre o Garrett'], /equipe/, true],
];

for (const [nome, mensagens, resposta, encaminhar] of casos) {
  test(nome, async () => {
    const historico = mensagens.map(texto => ({ autor: 'Cliente', texto }));
    const resultado = await responderComModelo('modelo-de-teste', items, historico, AbortSignal.timeout(500));
    assert.match(resultado.texto, resposta);
    assert.equal(resultado.encaminhar, encaminhar);
  });
}
