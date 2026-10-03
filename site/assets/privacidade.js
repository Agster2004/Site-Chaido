// Preenche os dados da empresa na política de privacidade a partir de data/empresa.json.
fetch('data/empresa.json', { cache: 'no-store' })
  .then(function (r) { return r.json(); })
  .then(function (e) {
    document.querySelectorAll('[data-empresa]').forEach(function (el) {
      var v = e[el.getAttribute('data-empresa')];
      if (v) el.textContent = v;
    });
    var mail = document.getElementById('link-email');
    if (mail && e.email_privacidade) mail.href = 'mailto:' + e.email_privacidade;
  })
  .catch(function () {});
