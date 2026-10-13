// Guarda de onde o visitante veio (primeira visita da sessão), para ir junto com o lead
// e com a mensagem de WhatsApp. As funções puras ficam fora do navegador também (testes em Node).
(function () {
  function limpo(v) {
    return String(v == null ? '' : v).toLowerCase().replace(/[^a-z0-9_.\-\/ ]/g, '').trim();
  }

  // "instagram/bio" (fonte/meio/campanha); sem UTM, usa o site de origem; sem nada, vazio.
  function rotuloOrigem(o) {
    if (!o) return '';
    var partes = [o.fonte, o.meio, o.campanha].map(limpo).filter(Boolean);
    var r = partes.join('/');
    if (!r && o.referrer) {
      try {
        r = limpo(new URL(o.referrer).host.replace(/^www\./, ''));
      } catch (e) {}
    }
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

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { rotuloOrigem: rotuloOrigem, comOrigem: comOrigem };
  }
  if (typeof document === 'undefined') return;

  try {
    if (!sessionStorage.getItem('chiado_origem')) {
      var p = new URLSearchParams(location.search);
      var ref = '';
      if (document.referrer) {
        try {
          if (new URL(document.referrer).host !== location.host) ref = document.referrer;
        } catch (e) {}
      }
      sessionStorage.setItem(
        'chiado_origem',
        JSON.stringify({
          fonte: p.get('utm_source') || '',
          meio: p.get('utm_medium') || '',
          campanha: p.get('utm_campaign') || '',
          referrer: ref,
          entrada: location.pathname,
        })
      );
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
