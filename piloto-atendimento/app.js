const el = id => document.getElementById(id);
let selecionada = new URLSearchParams(location.search).get('conversa');
let ultimaTela;
let versao = 0;
let filtro = 'todas';

function novasMensagens(conversa, nome) {
  const chave = `chiado:lidas:${nome}:${conversa.id}`;
  const total = conversa.mensagens.filter(msg => msg.autor === 'Cliente').length;
  if (conversa.id === selecionada && !document.hidden && document.hasFocus()) {
    localStorage.setItem(chave, String(total));
  }
  return Math.max(0, total - Number(localStorage.getItem(chave) || 0));
}

function itemDaFila(item, nome) {
  const avatar = document.createElement('span');
  avatar.className = 'avatar';
  avatar.setAttribute('aria-hidden', 'true');
  avatar.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4.4 0-8 2-8 4.5V20h16v-1.5C20 16 16.4 14 12 14Z"/></svg>';
  const texto = document.createElement('span');
  const numero = document.createElement('strong');
  numero.textContent = item.cliente;
  const previa = document.createElement('small');
  previa.className = 'previa';
  const ultima = item.mensagens.at(-1);
  previa.textContent = ultima?.texto || '';
  const estado = document.createElement('small');
  estado.textContent = item.estado;
  texto.append(numero, previa, estado);
  const meta = document.createElement('span');
  meta.className = 'meta';
  const horario = document.createElement('small');
  horario.textContent = ultima ? new Date(ultima.hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
  meta.append(horario);
  const novas = novasMensagens(item, nome);
  if (novas) {
    const selo = document.createElement('span');
    selo.className = 'nao-lidas';
    selo.textContent = novas;
    selo.setAttribute('aria-label', `${novas} mensagens não lidas`);
    meta.append(selo);
  }
  return [avatar, texto, meta];
}

async function requisicao(caminho, dados) {
  const res = await fetch(caminho, dados === undefined ? {} : {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dados)
  });
  const corpo = await res.json();
  if (!res.ok) throw Object.assign(new Error(corpo.erro || 'Sessão encerrada.'), { status: res.status });
  return corpo;
}

function atualizarInterface({ nome, conversas }) {
  el('painel').hidden = false;
  el('acesso').hidden = true;
  el('sair').hidden = false;
  el('conta').textContent = `Conectado como ${nome}`;
  el('pendentes').textContent = `Aguardando atendimento: ${conversas.filter(c => c.estado === 'Aguardando atendimento').length}`;
  const conversa = conversas.find(c => c.id === selecionada);
  const busca = el('buscar').value.trim().toLowerCase();
  const visiveis = conversas.filter(item => {
    const novas = novasMensagens(item, nome);
    return item.cliente.toLowerCase().includes(busca)
      && (filtro !== 'novas' || novas > 0)
      && (filtro !== 'pendentes' || item.estado === 'Aguardando atendimento');
  });
  const assinatura = JSON.stringify([nome, conversas, selecionada, busca, filtro, visiveis.map(item => novasMensagens(item, nome))]);
  if (assinatura === ultimaTela) return;
  ultimaTela = assinatura;
  el('fila-vazia').hidden = visiveis.length > 0;
  el('chat-vazio').hidden = Boolean(conversa);
  el('painel').classList.toggle('conversa-aberta', Boolean(conversa));
  el('fila').replaceChildren();
  for (const item of visiveis) {
    const linha = document.createElement('li');
    const botao = document.createElement('button');
    botao.append(...itemDaFila(item, nome));
    botao.setAttribute('aria-current', String(item.id === selecionada));
    botao.onclick = () => { selecionada = item.id; atualizarInterface({ nome, conversas }); };
    linha.append(botao);
    el('fila').append(linha);
  }
  el('titulo').textContent = conversa?.cliente || 'Selecione uma conversa';
  el('situacao').textContent = conversa?.atendente ? `Em atendimento por ${conversa.atendente}` : conversa?.estado || '';
  el('assumir').hidden = !conversa || Boolean(conversa.atendente);
  el('encaminhar').hidden = conversa?.estado !== 'IA atendendo';
  el('digitando').hidden = !conversa?.digitando;
  el('cliente').hidden = !conversa?.modoCliente;
  el('resposta').hidden = conversa?.atendente !== nome;
  el('historico').replaceChildren();
  for (const msg of conversa?.mensagens || []) {
    const balao = document.createElement('li');
    balao.className = msg.autor === 'Cliente' ? 'balao' : 'balao equipe';
    const autor = document.createElement('small');
    autor.textContent = `${msg.autor} · ${new Date(msg.hora).toLocaleTimeString('pt-BR')}`;
    balao.append(autor, document.createTextNode(msg.texto));
    el('historico').append(balao);
  }
  const area = el('historico').parentElement;
  area.scrollTop = area.scrollHeight;
}

async function atualizar() {
  const atual = ++versao;
  try {
    const dados = await requisicao('/estado');
    if (atual === versao) atualizarInterface(dados);
  } catch (erro) {
    if (atual !== versao) return;
    if (erro.status !== 401) throw erro;
    el('acesso').hidden = false;
    el('painel').hidden = true;
    el('sair').hidden = true;
    ultimaTela = undefined;
  }
}

async function agir(acao) {
  el('erro').textContent = '';
  try { await acao(); await atualizar(); }
  catch (erro) { el('erro').textContent = erro.message; }
}

el('acesso').onsubmit = evento => {
  evento.preventDefault();
  agir(async () => {
    await requisicao('/entrar', Object.fromEntries(new FormData(evento.target)));
    evento.target.reset();
  });
};
el('sair').onclick = () => agir(() => requisicao('/sair', {}));
el('voltar').onclick = () => { selecionada = null; consultar(); };
el('simular').onclick = () => agir(() => requisicao('/simular', {}));
el('simular-cliente').onclick = () => agir(async () => {
  selecionada = (await requisicao('/simular', { modo: 'cliente' })).id;
});
el('assumir').onclick = () => agir(() => requisicao('/assumir', { id: selecionada }));
el('encaminhar').onclick = () => agir(() => requisicao('/encaminhar', { id: selecionada }));
for (const [formulario, rota] of [['resposta', '/responder'], ['cliente', '/cliente']]) {
  const form = el(formulario);
  const campo = form.elements.texto;
  const botao = form.querySelector('button');
  campo.addEventListener('keydown', evento => {
    if (evento.key !== 'Enter' || evento.shiftKey || evento.isComposing) return;
    evento.preventDefault();
    if (!evento.repeat && !botao.disabled) form.requestSubmit();
  });
  form.onsubmit = async evento => {
    evento.preventDefault();
    if (botao.disabled || !campo.value.trim()) return;
    const texto = campo.value;
    botao.disabled = true;
    try {
      await agir(async () => {
        await requisicao(rota, { id: selecionada, texto });
        if (campo.value === texto) campo.value = '';
      });
    } finally {
      botao.disabled = false;
    }
  };
}
function consultar() {
  atualizar().catch(erro => { el('erro').textContent = erro.message; });
}
el('buscar').addEventListener('input', consultar);
for (const botao of document.querySelectorAll('[data-filtro]')) {
  botao.onclick = () => {
    filtro = botao.dataset.filtro;
    for (const opcao of document.querySelectorAll('[data-filtro]')) {
      opcao.setAttribute('aria-pressed', String(opcao === botao));
    }
    consultar();
  };
}
window.addEventListener('focus', consultar);
consultar();
setInterval(consultar, 650);
