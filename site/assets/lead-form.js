// Formulário de interesse. O visitante preenche, o servidor (/api/lead) valida e grava.
(function () {
  var WHATSAPP = '5513997770974';

  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }

  // O link da política é a própria frase "Política de Privacidade" do texto (sem repetir).
  function textoConsentimento(texto) {
    var link = '<a href="privacidade" target="_blank" rel="noopener">Política de Privacidade</a>';
    var seguro = esc(texto);
    return seguro.indexOf('Política de Privacidade') >= 0
      ? seguro.replace('Política de Privacidade', link)
      : seguro + ' ' + link;
  }

  function mascara(v) {
    var d = v.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return d ? '(' + d : '';
    if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    var corte = d.length > 10 ? 7 : 6;
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, corte) + '-' + d.slice(corte);
  }

  function linkWhatsapp(msg) {
    return 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(msg);
  }

  function origemDaSessao() {
    try {
      return JSON.parse(sessionStorage.getItem('chiado_origem') || '{}');
    } catch (e) {
      return {};
    }
  }

  window.initLeadForm = function (items) {
    var raiz = document.getElementById('lead-form-root');
    if (!raiz || raiz.dataset.pronto) return;
    raiz.dataset.pronto = '1';
    items = items || [];

    var slugInicial = raiz.getAttribute('data-empreendimento') || '';
    var inicio = Date.now();

    fetch('data/consentimento.json', { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('consentimento');
        return r.json();
      })
      .then(montar)
      .catch(function () {
        raiz.innerHTML =
          '<div class="lead-card"><h2>Quero saber mais</h2><p>Não conseguimos carregar o formulário agora. Fale com a gente pelo WhatsApp.</p>' +
          '<a class="btn btn-dark" target="_blank" rel="noopener" href="' + esc(linkWhatsapp('Olá, vim pelo site e quero saber mais sobre os empreendimentos da Chiado.')) + '">Chamar no WhatsApp</a></div>';
      });

    function montar(cons) {
      var opcoes = ['<option value="">Ainda não sei</option>']
        .concat(items.map(function (i) {
          return '<option value="' + esc(i.slug) + '"' + (i.slug === slugInicial ? ' selected' : '') + '>' + esc(i.nome) + '</option>';
        }))
        .join('');

      raiz.innerHTML =
        '<div class="lead-card">' +
        '<h2>Quero saber mais</h2>' +
        '<p class="lead-sub">Deixe seu contato e a equipe da Chiado fala com você pelo WhatsApp.</p>' +
        '<form id="lead-form" novalidate>' +
        '<label for="lf-emp">Empreendimento de interesse</label><select id="lf-emp" name="empreendimento_slug">' + opcoes + '</select>' +
        '<label for="lf-nome">Nome *</label><input id="lf-nome" name="nome" type="text" autocomplete="name" required maxlength="120" aria-describedby="lf-nome-erro"><p class="lead-erro" id="lf-nome-erro"></p>' +
        '<label for="lf-tel">WhatsApp *</label><input id="lf-tel" name="telefone" type="tel" inputmode="tel" autocomplete="tel" required placeholder="(13) 99999-9999" aria-describedby="lf-telefone-erro"><p class="lead-erro" id="lf-telefone-erro"></p>' +
        '<label for="lf-email">E-mail</label><input id="lf-email" name="email" type="email" autocomplete="email" maxlength="254" aria-describedby="lf-email-erro"><p class="lead-erro" id="lf-email-erro"></p>' +
        '<label for="lf-msg">Mensagem</label><textarea id="lf-msg" name="mensagem" rows="3" maxlength="1000" aria-describedby="lf-mensagem-erro"></textarea><p class="lead-erro" id="lf-mensagem-erro"></p>' +
        '<div class="lead-isca" aria-hidden="true"><label for="lf-site">Não preencha este campo</label><input id="lf-site" name="website" type="text" tabindex="-1" autocomplete="off"></div>' +
        '<div class="lead-consent"><input id="lf-consent" name="consentimento" type="checkbox" aria-describedby="lf-consentimento-erro"><label for="lf-consent">' + textoConsentimento(cons.texto) + '</label></div><p class="lead-erro" id="lf-consentimento-erro"></p>' +
        '<button class="btn btn-dark" type="submit" id="lf-enviar">Enviar</button>' +
        '<div class="lead-status" id="lf-status" role="status" aria-live="polite"></div>' +
        '</form></div>';

      var form = document.getElementById('lead-form');
      var tel = document.getElementById('lf-tel');
      var status = document.getElementById('lf-status');
      var botao = document.getElementById('lf-enviar');

      tel.addEventListener('input', function () {
        tel.value = mascara(tel.value);
      });

      function limparErros() {
        form.querySelectorAll('.lead-erro').forEach(function (p) { p.textContent = ''; });
        form.querySelectorAll('[aria-invalid]').forEach(function (c) { c.removeAttribute('aria-invalid'); });
      }

      function mostrarErros(erros) {
        var primeiro = null;
        Object.keys(erros).forEach(function (campo) {
          var p = document.getElementById('lf-' + campo + '-erro');
          var el = form.elements[campo];
          if (p) p.textContent = erros[campo];
          if (el) {
            el.setAttribute('aria-invalid', 'true');
            if (!primeiro) primeiro = el;
          }
        });
        if (primeiro) primeiro.focus();
      }

      function falhaEnvio() {
        status.innerHTML =
          '<p class="lead-erro-geral">Não conseguimos enviar agora. Seus dados continuam no formulário. Tente de novo ou fale com a gente pelo WhatsApp.</p>' +
          '<a class="btn btn-outline-dark" target="_blank" rel="noopener" href="' + esc(linkWhatsapp('Olá, vim pelo site e quero saber mais sobre os empreendimentos da Chiado.')) + '">Chamar no WhatsApp</a>';
      }

      form.addEventListener('submit', function (ev) {
        ev.preventDefault();
        limparErros();
        status.textContent = '';
        var o = origemDaSessao();
        var corpo = {
          nome: form.elements.nome.value,
          telefone: form.elements.telefone.value,
          email: form.elements.email.value,
          mensagem: form.elements.mensagem.value,
          empreendimento_slug: form.elements.empreendimento_slug.value,
          consentimento: form.elements.consentimento.checked,
          consentimento_versao: cons.versao,
          website: form.elements.website.value,
          tempo_ms: Date.now() - inicio,
          origem_fonte: o.fonte || '',
          origem_meio: o.meio || '',
          origem_campanha: o.campanha || '',
          referrer: o.referrer || '',
          pagina_origem: location.pathname,
        };

        botao.disabled = true;
        botao.textContent = 'Enviando…';

        fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) })
          .then(function (r) {
            return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, corpo: j }; });
          })
          .then(function (res) {
            if (res.status === 200 && res.corpo.ok) {
              var nomeImovel = '';
              items.forEach(function (i) { if (i.slug === corpo.empreendimento_slug) nomeImovel = i.nome; });
              var msg = 'Olá, acabei de deixar meu contato no site' + (nomeImovel ? ' sobre o ' + nomeImovel : '') + '.';
              raiz.innerHTML =
                '<div class="lead-card"><h2>Recebemos seu contato</h2><p>A equipe da Chiado vai falar com você pelo WhatsApp. Se preferir, já pode chamar agora.</p>' +
                '<a class="btn btn-dark" target="_blank" rel="noopener" href="' + esc(linkWhatsapp(msg)) + '">Chamar no WhatsApp</a></div>';
              return;
            }
            if (res.status === 400 && res.corpo.erros && Object.keys(res.corpo.erros).length) {
              mostrarErros(res.corpo.erros);
            } else {
              falhaEnvio();
            }
            botao.disabled = false;
            botao.textContent = 'Enviar';
          })
          .catch(function () {
            falhaEnvio();
            botao.disabled = false;
            botao.textContent = 'Enviar';
          });
      });
    }
  };
})();
