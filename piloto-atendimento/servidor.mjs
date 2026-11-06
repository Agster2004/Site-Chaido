import { responderComModelo } from './modelo.mjs';
import { createServer } from 'node:http';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';

const origem = 'http://127.0.0.1:8791';
const sessoes = new Map();
const conversas = new Map();
const respostasPendentes = new Map();
const modelo = process.env.CHIADO_MODELO_LOCAL;
const equipe = new Map([['will', 'Will']]);
const senha = Buffer.from(process.env.CHIADO_SENHA_PILOTO || 'chiado-piloto-local');
const arquivos = new Map([
  ['/', ['./index.html', 'text/html; charset=utf-8']],
  ['/app.js', ['./app.js', 'text/javascript; charset=utf-8']],
  ['/painel.css', ['./painel.css', 'text/css; charset=utf-8']],
  ['/logo-chiado.png', ['../site/assets/logo-icon.png', 'image/png']],
]);

function mensagem(conversa, autor, texto) {
  conversa.mensagens.push({ autor, texto, hora: new Date().toISOString() });
}

function lerCatalogo() {
  const { items } = JSON.parse(readFileSync(new URL('../site/data/empreendimentos.json', import.meta.url), 'utf8'));
  if (!Array.isArray(items) || !items.length) throw new Error('Catálogo inválido');
  return items;
}

function responderSimulacao(conversa, texto) {
  const pedido = texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  const nome = pedido.match(/\b(carmo|karmo|garret{0,2}|garet{0,2})\b/)?.[1];
  const imovel = nome && (nome.endsWith('armo') ? 'carmo' : 'garrett');
  conversa.imovel = imovel || conversa.imovel;
  if (/\b(visita|visitar|preco|valor|disponibilidade|disponivel|atendente|humano|negociar)\b|quanto custa|ainda tem|falar com (alguem|a equipe)/.test(pedido)) {
    conversa.estado = 'Aguardando atendimento';
    return 'Vou encaminhar seu pedido para a equipe da Chiado continuar por aqui.';
  }
  if (conversa.imovel && /\b(onde|bairro|localizacao|fica)\b/.test(pedido)) {
    return conversa.imovel === 'garrett'
      ? 'O Garrett fica no Ocian, em Praia Grande.'
      : 'O Carmo fica na Vila Tupy, em Praia Grande.';
  }
  const ficha = lerCatalogo().find(item => item.slug === conversa.imovel);
  if (ficha && /\b(garagem|vagas?|estacionamento)\b/.test(pedido)) {
    const detalhe = ficha.diferenciais?.find(item => /garagem/i.test(item));
    if (detalhe) return `Sim, o ${ficha.nome} tem ${detalhe.toLowerCase()}.`;
    const vagas = Object.values(ficha).flatMap(valor => Array.isArray(valor) ? valor : []).find(item => /garagem/i.test(item?.vaga || ''))?.vaga;
    if (vagas) return `Sim, a ficha do ${ficha.nome} informa ${vagas}.`;
    return 'Posso encaminhar essa dúvida sobre a garagem para a equipe confirmar.';
  }
  if (ficha && /nao (foi isso|perguntei)/.test(pedido)) {
    return `Entendi, me adiantei. O que você queria saber sobre o ${ficha.nome}?`;
  }
  if (/\b(dormitorios?|quartos?|suites?|lavabo)\b/.test(pedido)) {
    if (conversa.imovel === 'carmo') return 'As casas do Carmo têm duas suítes e um lavabo.';
    if (conversa.imovel === 'garrett') return 'As casas do Garrett têm três dormitórios, sendo uma suíte, e um lavabo.';
  }
  if (/^(oi|ola|bom dia|boa tarde|boa noite)[!. ]*$/.test(pedido)) {
    return 'Olá! Sou a assistente virtual da Chiado. Em qual empreendimento você tem interesse?';
  }
  if (ficha) return `O que você gostaria de saber sobre o ${ficha.nome}?`;
  return 'Posso ajudar com informações do Carmo ou do Garrett. Qual deles você quer conhecer?';
}

async function ler(req) {
  let corpo = '';
  for await (const parte of req) {
    corpo += parte;
    if (corpo.length > 8192) throw new Error('Mensagem muito longa');
  }
  return JSON.parse(corpo);
}

createServer(async (req, res) => {
  const json = (status, dados) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(dados));
  };
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'self'; style-src 'self'; frame-ancestors 'none'");
  if (req.headers.host !== new URL(origem).host) return json(403, {});
  const arquivo = arquivos.get(req.url);
  if (req.method === 'GET' && arquivo) {
    const [caminho, tipo] = arquivo;
    const conteudo = readFileSync(new URL(caminho, import.meta.url));
    res.writeHead(200, { 'Content-Type': tipo });
    return res.end(conteudo);
  }

  const token = /(?:^|; )chiado_piloto=([\w-]+)/.exec(req.headers.cookie || '')?.[1];
  const sessao = sessoes.get(token);
  const nome = sessao?.ate > Date.now() ? sessao.nome : null;
  try {
    if (req.method === 'GET' && req.url === '/estado') {
      return nome ? json(200, { nome, conversas: [...conversas.values()].reverse() }) : json(401, {});
    }
    if (req.method !== 'POST' || req.headers.origin !== origem) return json(403, {});
    if (req.url === '/entrar') {
      const dados = await ler(req);
      const digitada = Buffer.from(String(dados.senha ?? ''));
      const pessoa = equipe.get(dados.login);
      if (!pessoa || digitada.length !== senha.length || !timingSafeEqual(digitada, senha)) {
        return json(401, { erro: 'Login ou senha inválidos.' });
      }
      sessoes.delete(token);
      const id = randomUUID();
      sessoes.set(id, { nome: pessoa, ate: Date.now() + 8 * 3600000 });
      res.setHeader('Set-Cookie', `chiado_piloto=${id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800`);
      return json(200, {});
    }
    if (!nome) return json(401, { erro: 'Entre novamente.' });
    if (req.url === '/sair') {
      sessoes.delete(token);
      res.setHeader('Set-Cookie', 'chiado_piloto=; Max-Age=0; Path=/');
      return json(200, {});
    }
    const { id, texto, modo } = await ler(req);
    if (req.url === '/simular') {
      const conversa = { id: randomUUID(), cliente: `+55 (00) 90000-${String(conversas.size + 1).padStart(4, '0')}`, estado: 'IA atendendo', mensagens: [] };
      conversa.modoCliente = modo === 'cliente';
      if (!conversa.modoCliente) {
        mensagem(conversa, 'Cliente', 'Oi! O Carmo tem duas suítes?');
        mensagem(conversa, 'IA simulada', 'Sim, as casas do Carmo têm duas suítes e um lavabo.');
      }
      conversas.set(conversa.id, conversa);
      return json(201, { id: conversa.id });
    }
    const conversa = conversas.get(id);
    if (!conversa) return json(404, { erro: 'Conversa não encontrada.' });
    if (req.url === '/cliente' && conversa.modoCliente) {
      if (typeof texto !== 'string' || !texto.trim() || texto.length > 2000) {
        return json(400, { erro: 'Escreva uma mensagem de até 2.000 caracteres.' });
      }
      mensagem(conversa, 'Cliente', texto.trim());
      if (conversa.estado === 'IA atendendo') {
        const anterior = respostasPendentes.get(id);
        clearTimeout(anterior?.timer);
        const quantidade = (anterior?.quantidade ?? 0) + 1;
        const pedido = anterior ? (anterior.pedido + '\n' + texto).slice(-6000) : texto;
        conversa.digitando = true;
        const espera = Math.min(2400, 1300 + texto.length * 15);
        anterior?.controle.abort();
        const controle = new AbortController();
        const timer = setTimeout(async () => {
          try {
            if (modelo) {
              const resultado = await responderComModelo(modelo, lerCatalogo(), [
                ...conversa.mensagens.slice(0, -quantidade),
                { autor: 'Cliente', texto: pedido },
              ], controle.signal);
              if (controle.signal.aborted || conversa.estado !== 'IA atendendo') return;
              mensagem(conversa, 'Assistente Chiado', resultado.texto);
              if (resultado.encaminhar) conversa.estado = 'Aguardando atendimento';
            } else {
              mensagem(conversa, 'IA simulada', responderSimulacao(conversa, pedido));
            }
          } catch {
            if (!controle.signal.aborted) {
              mensagem(conversa, 'Painel', 'Modelo local indisponível. A conversa foi encaminhada para a equipe.');
              conversa.estado = 'Aguardando atendimento';
            }
          } finally {
            if (respostasPendentes.get(id)?.controle === controle) {
              respostasPendentes.delete(id);
              conversa.digitando = false;
            }
          }
        }, espera);
        respostasPendentes.set(id, { timer, pedido, quantidade, controle });
      }
    } else if (req.url === '/encaminhar' && conversa.estado === 'IA atendendo') {
      mensagem(conversa, 'Cliente', 'Quero marcar uma visita.');
      mensagem(conversa, 'IA simulada', 'Vou pedir à equipe da Chiado para confirmar os horários.');
      conversa.estado = 'Aguardando atendimento';
    } else if (req.url === '/assumir' && !conversa.atendente) {
      conversa.estado = 'Em atendimento';
      conversa.atendente = nome;
      mensagem(conversa, 'Painel', `${nome} assumiu o atendimento.`);
    } else if (req.url === '/responder' && conversa.atendente === nome) {
      if (typeof texto !== 'string' || !texto.trim() || texto.length > 2000) {
        return json(400, { erro: 'Escreva uma mensagem de até 2.000 caracteres.' });
      }
      mensagem(conversa, nome, texto.trim());
    } else {
      return json(409, { erro: 'A conversa mudou. Confira o estado no painel.' });
    }
    if (conversa.estado !== 'IA atendendo') {
      clearTimeout(respostasPendentes.get(id)?.timer);
      respostasPendentes.get(id)?.controle.abort();
      respostasPendentes.delete(id);
      conversa.digitando = false;
    }
    return json(200, {});
  } catch {
    return json(400, { erro: 'Pedido inválido.' });
  }
}).listen(8791, '127.0.0.1', () => console.log(`Piloto Chiado em ${origem}`));
