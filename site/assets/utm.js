// Guarda de onde o visitante veio (primeira visita da sessão), para ir junto com o lead.
(function () {
  try {
    if (sessionStorage.getItem('chiado_origem')) return;
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
  } catch (e) {}
})();
