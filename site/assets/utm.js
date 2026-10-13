// Guarda de onde o visitante veio (primeira visita da sessão), para ir junto com o lead e com a mensagem de
// WhatsApp, e conta a visita (uma por sessão, só somas, sem dado pessoal). As funções puras ficam expostas
// também fora do navegador (testes em Node).
(function () {
  function limpo(v) {
    return String(v == null ? '' : v).toLowerCase().replace(/[^a-z0-9_.\-\/ ]/g, '').trim();
  }

  function hostDe(referrer) {
    try {
      return limpo(new URL(referrer).host.replace(/^www\./, ''));
    } catch (e) {
      return '';
    }
  }

  // "instagram/bio" (fonte/meio/campanha); sem UTM, usa o site de origem; sem nada, vazio.
  function rotuloOrigem(o) {
    if (!o) return '';
    var partes = [o.fonte, o.meio, o.campanha].map(limpo).filter(Boolean);
    var r = partes.join('/');
    if (!r && o.referrer) r = hostDe(o.referrer);
    return r.slice(0, 60);
  }

  // Acrescenta "(origem: ...)" ao texto de um link wa.me. Devolve o mesmo link se não der ou se já tiver.
  function comOrigem(href, origem) {
    var rotulo = rotuloOrigem(origem);
    if (!rotulo) return href;
    var u;
    try {
      u = new URL(href);
    } catch (e) {
      return href;
    }
    if (u.host !== 'wa.me') return href;
    var texto = u.searchParams.get('text') || '';
    if (texto.indexOf('(origem:') !== -1) return href;
    texto = (texto || 'Olá!') + ' (origem: ' + rotulo + ')';
    return 'https://wa.me' + u.pathname + '?text=' + encodeURIComponent(texto);
  }

  // O que vai para /api/visita: a página de entrada e a origem (UTM; sem UTM, o site de origem; sem nada, direto).
  function corpoVisita(o, busca) {
    o = o || {};
    var caminho = o.entrada || '/';
    if (caminho === '/index.html') caminho = '/';
    if (caminho === '/imovel.html') {
      var slug = '';
      try {
        slug = new URLSearchParams(busca || '').get('slug') || '';
      } catch (e) {}
      caminho = '/imovel/' + slug;
    }
    var fonte = limpo(o.fonte);
    var meio = limpo(o.meio);
    var campanha = limpo(o.campanha);
    if (!fonte && !meio && !campanha && o.referrer) {
      fonte = hostDe(o.referrer);
      meio = fonte ? 'referencia' : '';
    }
    return { caminho: caminho, fonte: fonte, meio: meio, campanha: campanha };
  }

  // Quem não quer ser contado (a equipe testando) abre o site uma vez com ?nao_contar=1 (e ?nao_contar=0 desfaz).
  function acaoNaoContar(busca) {
    var v = '';
    try {
      v = new URLSearchParams(busca || '').get('nao_contar');
    } catch (e) {}
    return v === '1' ? 'ligar' : v === '0' ? 'desligar' : null;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { rotuloOrigem: rotuloOrigem, comOrigem: comOrigem, corpoVisita: corpoVisita, acaoNaoContar: acaoNaoContar };
  }
  if (typeof document === 'undefined') return;

  // Conta a visita, a menos que este navegador tenha pedido para não ser contado (veja acaoNaoContar).
  try {
    var acao = acaoNaoContar(location.search);
    if (acao === 'ligar') localStorage.setItem('chiado_nao_contar', '1');
    if (acao === 'desligar') localStorage.removeItem('chiado_nao_contar');
  } catch (e) {}

  function contarVisita(origem) {
    try {
      if (location.protocol.indexOf('http') !== 0) return;
      if (localStorage.getItem('chiado_nao_contar')) return;
      var corpo = JSON.stringify(corpoVisita(origem, location.search));
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/visita', new Blob([corpo], { type: 'application/json' }));
      } else {
        fetch('/api/visita', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: corpo, keepalive: true });
      }
    } catch (e) {}
  }

  try {
    if (!sessionStorage.getItem('chiado_origem')) {
      var p = new URLSearchParams(location.search);
      var ref = '';
      if (document.referrer) {
        try {
          if (new URL(document.referrer).host !== location.host) ref = document.referrer;
        } catch (e) {}
      }
      var origem = {
        fonte: p.get('utm_source') || '',
        meio: p.get('utm_medium') || '',
        campanha: p.get('utm_campaign') || '',
        referrer: ref,
        entrada: location.pathname,
      };
      sessionStorage.setItem('chiado_origem', JSON.stringify(origem));
      contarVisita(origem);
    }
  } catch (e) {}

  // Os botões de WhatsApp são criados depois (render.js), então o link é ajustado no momento do clique.
  document.addEventListener(
    'click',
    function (ev) {
      var a = ev.target && ev.target.closest ? ev.target.closest('a[href*="wa.me/"]') : null;
      if (!a) return;
      try {
        var origem = JSON.parse(sessionStorage.getItem('chiado_origem') || 'null');
        var novo = comOrigem(a.href, origem);
        if (novo !== a.href) a.href = novo;
      } catch (e) {}
    },
    true
  );
})();
