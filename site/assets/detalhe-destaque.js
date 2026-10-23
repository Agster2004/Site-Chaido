// Chiado Construtora - página do empreendimento no estilo "destaque" (layout: "destaque" no empreendimentos.json).
// Inspirada na página de empreendimento da GMV: capa grande, seções escuras e claras alternadas,
// faixa de características, galeria, plantas, mapa, andamento da obra, formulário e outros empreendimentos.
// Cada seção só aparece se o empreendimento tiver os dados dela. Quem não tem "layout" continua com a página antiga.

(function(){

  // Ícones de linha (24x24), na cor do texto.
  var ICONES = {
    casa: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    suite: '<path d="M3 18V8"/><path d="M3 14h18v4"/><path d="M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="2"/>',
    banheiro: '<path d="M4 12h16v2a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-2z"/><path d="M6 12V6a2 2 0 0 1 4 0"/><path d="M8 19l-1 2M16 19l1 2"/>',
    area: '<rect x="3" y="3" width="18" height="18" rx="1"/><path d="M3 9h4M3 15h4M9 3v4M15 3v4"/>',
    vaga: '<path d="M5 16V11l2-5h10l2 5v5"/><path d="M3 16h18v3H3z"/><circle cx="7.5" cy="13" r="1"/><circle cx="16.5" cy="13" r="1"/>',
    pino: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>'
  };

  function icone(nome){
    var p = ICONES[nome] || ICONES.casa;
    return '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
  }

  function pct(v){
    var n = parseFloat(String(v == null ? '' : v).replace(',', '.'));
    if(!isFinite(n)) return 0;
    return Math.max(0, Math.min(100, n));
  }

  function fmtPct(n){
    return (Math.round(n * 10) / 10).toString().replace('.', ',') + '%';
  }

  // Carrossel lateral: rolagem nativa com encaixe (celular arrasta com o dedo), setas e arrastar com o mouse no computador.
  function iniciarCarrossel(caixa){
    if(!caixa) return;
    var trilho = caixa.querySelector('.dd-trilho');
    var ant = caixa.querySelector('.dd-seta-ant'), prox = caixa.querySelector('.dd-seta-prox');
    function passo(){ var a = trilho.querySelector('a'); return a ? a.getBoundingClientRect().width + 14 : trilho.clientWidth * 0.8; }
    function atualizar(){
      if(caixa.ddLoop){ ant.disabled = false; prox.disabled = false; return; }
      var max = trilho.scrollWidth - trilho.clientWidth - 2;
      ant.disabled = trilho.scrollLeft <= 2;
      prox.disabled = trilho.scrollLeft >= max;
    }
    ant.addEventListener('click', function(){ trilho.scrollBy({ left: -passo(), behavior: 'smooth' }); });
    prox.addEventListener('click', function(){ trilho.scrollBy({ left: passo(), behavior: 'smooth' }); });
    trilho.addEventListener('scroll', atualizar, { passive: true });
    window.addEventListener('resize', atualizar);
    trilho.addEventListener('keydown', function(e){
      if(e.key === 'ArrowRight'){ e.preventDefault(); prox.click(); }
      if(e.key === 'ArrowLeft'){ e.preventDefault(); ant.click(); }
    });
    // arrastar com o mouse; se arrastou, o clique não abre a foto
    var inicioX = 0, inicioScroll = 0, arrastando = false, moveu = false;
    trilho.addEventListener('pointerdown', function(e){
      if(e.pointerType !== 'mouse' || e.button !== 0) return;
      arrastando = true; moveu = false; inicioX = e.clientX; inicioScroll = trilho.scrollLeft;
    });
    window.addEventListener('pointermove', function(e){
      if(!arrastando) return;
      var dx = e.clientX - inicioX;
      if(!moveu && Math.abs(dx) > 6){ moveu = true; trilho.classList.add('arrastando'); }
      if(moveu){ trilho.scrollLeft = inicioScroll - dx; e.preventDefault(); }
    });
    window.addEventListener('pointerup', function(){
      if(!arrastando) return;
      arrastando = false;
      if(moveu){
        trilho.classList.remove('arrastando');
        // volta ao encaixe mais próximo
        var p = passo(); trilho.scrollTo({ left: Math.round(trilho.scrollLeft / p) * p, behavior: 'smooth' });
      }
    });
    trilho.addEventListener('click', function(e){
      if(moveu){ e.preventDefault(); e.stopPropagation(); moveu = false; }
    }, true);
    trilho.addEventListener('dragstart', function(e){ e.preventDefault(); });
    caixa.ddAtualizar = atualizar;
    atualizar();
  }

  // Galeria contínua (marcada com data-dd-loop): clones das 3 últimas fotos antes e das 3 primeiras depois, avanço automático e salto
  // invisível quando chega ao fim, então gira sem parar nos dois sentidos e sempre abre nas primeiras fotos. Os clones são criados
  // DEPOIS do visualizador de fotos (lightbox.js), para não entrarem na contagem dele; tocar num clone abre a foto original.
  window.ddIniciarLoops = function(){
    document.querySelectorAll('[data-dd-loop]').forEach(function(caixa){
      var trilho = caixa.querySelector('.dd-trilho');
      var orig = Array.prototype.slice.call(trilho.querySelectorAll('a'));
      var n = orig.length;
      if(n < 4 || caixa.ddLoop) return;
      function clonar(a){
        var c = a.cloneNode(true);
        c.setAttribute('aria-hidden', 'true'); c.tabIndex = -1; c.setAttribute('data-clone', '1');
        c.querySelectorAll('img').forEach(function(i){ i.setAttribute('alt', ''); i.setAttribute('loading', 'eager'); });
        c.addEventListener('click', function(e){ e.preventDefault(); a.click(); });
        return c;
      }
      // largura do texto da página (o carrossel passa dela até as bordas da tela; ver .dd-carrossel[data-dd-loop] no style.css)
      function medirTexto(){
        var pai = caixa.parentElement, cs = getComputedStyle(pai);
        caixa.style.setProperty('--w', (pai.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)) + 'px');
      }
      medirTexto();
      var antes = orig.slice(n - 3).map(clonar), depois = orig.slice(0, 3).map(clonar);
      antes.forEach(function(c){ trilho.insertBefore(c, orig[0]); });
      depois.forEach(function(c){ trilho.appendChild(c); });
      caixa.ddLoop = true;
      function inicio(){ return orig[0].offsetLeft - antes[0].offsetLeft; }
      function periodo(){ return depois[0].offsetLeft - orig[0].offsetLeft; }
      function saltar(delta){
        trilho.style.scrollSnapType = 'none'; trilho.style.scrollBehavior = 'auto';
        trilho.scrollLeft += delta;
        requestAnimationFrame(function(){ requestAnimationFrame(function(){ trilho.style.scrollSnapType = ''; trilho.style.scrollBehavior = ''; }); });
      }
      var tocando = false, parou = null;
      function conferir(){
        if(tocando || trilho.classList.contains('arrastando')) return;
        var p = periodo(), s = inicio();
        if(trilho.scrollLeft >= s + p - 2) saltar(-p);
        else if(trilho.scrollLeft <= 2) saltar(p);
      }
      trilho.addEventListener('scroll', function(){ clearTimeout(parou); parou = setTimeout(conferir, 120); }, { passive: true });
      trilho.addEventListener('touchstart', function(){ tocando = true; }, { passive: true });
      trilho.addEventListener('touchend', function(){ tocando = false; clearTimeout(parou); parou = setTimeout(conferir, 200); }, { passive: true });
      var largura = trilho.clientWidth;
      window.addEventListener('resize', function(){
        if(trilho.clientWidth === largura) return; // no celular a barra do navegador também dispara resize
        largura = trilho.clientWidth; medirTexto(); saltar(inicio() - trilho.scrollLeft);
      });
      // começa sempre na primeira foto verdadeira
      trilho.style.scrollSnapType = 'none'; trilho.style.scrollBehavior = 'auto';
      trilho.scrollLeft = inicio();
      requestAnimationFrame(function(){ trilho.style.scrollSnapType = ''; trilho.style.scrollBehavior = ''; });
      if(caixa.ddAtualizar) caixa.ddAtualizar();
      // avanço automático: pausa com mouse/foco/toque (volta 6 s depois), com o visualizador aberto, aba escondida ou fora da tela;
      // não anda sozinho para quem pediu menos movimento
      var reduzido = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var sobre = false, ultimo = 0, visivel = false;
      function marcar(){ ultimo = Date.now(); }
      caixa.addEventListener('mouseenter', function(){ sobre = true; });
      caixa.addEventListener('mouseleave', function(){ sobre = false; marcar(); });
      caixa.addEventListener('focusin', function(){ sobre = true; });
      caixa.addEventListener('focusout', function(){ sobre = false; marcar(); });
      caixa.addEventListener('touchstart', marcar, { passive: true });
      caixa.addEventListener('pointerdown', marcar);
      if(window.IntersectionObserver){
        new IntersectionObserver(function(es){ visivel = es[0].isIntersecting; }, { threshold: 0.3 }).observe(caixa);
      } else { visivel = true; }
      if(!reduzido){
        setInterval(function(){
          if(sobre || !visivel || document.hidden || tocando || trilho.classList.contains('arrastando')) return;
          if(document.querySelector('.lightbox.open') || Date.now() - ultimo < 6000) return;
          var a = trilho.querySelector('a');
          trilho.scrollBy({ left: a ? a.getBoundingClientRect().width + 14 : trilho.clientWidth * 0.8, behavior: 'smooth' });
        }, 3800);
      }
    });
  };

  // Abas das plantas (uma por casa): clique ou setas do teclado trocam a casa.
  function iniciarAbas(caixa){
    if(!caixa) return;
    var abas = Array.prototype.slice.call(caixa.querySelectorAll('[role="tab"]'));
    if(!abas.length) return;
    function escolher(i, focar){
      abas.forEach(function(aba, j){
        var ativo = j === i;
        aba.setAttribute('aria-selected', ativo);
        if(ativo){ aba.removeAttribute('tabindex'); } else { aba.setAttribute('tabindex', '-1'); }
        var painel = document.getElementById(aba.getAttribute('aria-controls'));
        if(painel){
          painel.hidden = !ativo;
          if(ativo){
            var c = painel.querySelector('[data-dd-carrossel]');
            if(c){ c.querySelector('.dd-trilho').scrollLeft = 0; if(c.ddAtualizar) c.ddAtualizar(); }
          }
        }
      });
      if(focar) abas[i].focus();
    }
    abas.forEach(function(aba, i){
      aba.addEventListener('click', function(){ escolher(i, false); });
      aba.addEventListener('keydown', function(e){
        if(e.key === 'ArrowRight'){ e.preventDefault(); escolher((i + 1) % abas.length, true); }
        if(e.key === 'ArrowLeft'){ e.preventDefault(); escolher((i - 1 + abas.length) % abas.length, true); }
      });
    });
  }

  window.renderDetalheDestaque = function(root, item, items, p){
    var R = window.ChiadoRender;
    var esc = R.esc, picture = R.picture;

    // ---- capa ----
    var chips = '';
    if(item.bairro) chips += '<span class="dd-chip">' + esc(item.bairro) + '</span>';
    if(item.tag_label) chips += '<span class="dd-chip dd-chip-ouro">' + esc(item.tag_label) + '</span>';
    // selo do andamento da obra na capa (mesmo número da seção "Acompanhe o andamento da obra")
    var obraEtapas = (item.obra && item.obra.etapas || []).filter(function(e){ return e && e.nome; });
    var obraPct = null;
    if(item.obra && item.obra.total !== undefined && item.obra.total !== '') obraPct = pct(item.obra.total);
    else if(obraEtapas.length) obraPct = obraEtapas.reduce(function(t, e){ return t + pct(e.percentual); }, 0) / obraEtapas.length;
    if(obraPct !== null && item.status !== 'pronto') chips += '<span class="dd-chip dd-chip-obra" aria-label="Obra ' + fmtPct(obraPct) + ' concluída">Obra <b>' + fmtPct(obraPct) + '</b><i style="--pct:' + obraPct + '%"></i></span>';

    var capa = '' +
      '<div class="detail-hero dd-hero' + (p.temSlides ? ' detail-hero-slides' : '') + '">' +
        p.heroMidia +
        '<div class="dd-hero-overlay">' +
          '<div class="wrap dd-hero-content">' +
            '<div class="dd-chips">' + chips + '</div>' +
            '<h1>' + esc(item.nome) + '</h1>' +
            '<p class="dd-hero-end">' + esc(item.endereco) + '</p>' +
            '<div class="dd-hero-acoes">' +
              '<a class="btn dd-btn-ouro" href="#interesse">Quero saber mais</a>' +
              (item.book ? '<a class="btn dd-btn-vazado" href="#interesse" data-pedir-book>Baixar o book</a>' : '') +
              '<a class="btn dd-btn-vazado" href="' + esc(p.waHref) + '" target="_blank" rel="noopener">' + R.waIconSvg() + 'WhatsApp</a>' +
            '</div>' +
          '</div>' +
        '</div>' +
        (item.capa_nota ? '<span class="dd-hero-nota">' + esc(item.capa_nota) + '</span>' : '') +
      '</div>';

    // ---- sobre + características (escura) ----
    var paragrafos = (item.sobre && item.sobre.length ? item.sobre : [item.descricao]).filter(Boolean)
      .map(function(t){ return '<p>' + esc(t) + '</p>'; }).join('');

    var caracteristicas = (item.caracteristicas || []).filter(function(c){ return c && c.texto; }).map(function(c){
      return '<li class="dd-carac">' + icone(c.icone) + '<span>' + esc(c.texto) + '</span></li>';
    }).join('');

    var sobre = '' +
      '<section class="dd-sec dd-escuro" aria-labelledby="dd-sobre-titulo">' +
        '<div class="wrap">' +
          '<div class="dd-sobre reveal">' +
            '<div>' +
              '<div class="dd-eyebrow">O empreendimento</div>' +
              '<h2 id="dd-sobre-titulo">' + esc(item.nome) + '</h2>' +
            '</div>' +
            '<div class="dd-texto">' + paragrafos + '</div>' +
          '</div>' +
          (caracteristicas ? '<ul class="dd-caracs reveal" aria-label="Características">' + caracteristicas + '</ul>' : '') +
        '</div>' +
      '</section>';

    // ---- galeria (clara) ----
    var galeria = p.galleryItems ? (
      '<section class="dd-sec dd-claro" aria-labelledby="dd-galeria-titulo">' +
        '<div class="wrap">' +
          '<div class="dd-eyebrow">Galeria</div>' +
          '<h2 id="dd-galeria-titulo" class="dd-h2">Conheça as imagens do ' + esc(item.nome.replace(/^Residencial\s+/i, '')) + '</h2>' +
          // carrossel lateral (como na GMV): arrasta para o lado; setas no computador; tocar abre a foto ampliada
          '<div class="dd-carrossel reveal" data-dd-carrossel data-dd-loop>' +
            '<div class="gallery-full dd-trilho" tabindex="0" aria-label="Fotos (arraste para o lado)">' + p.galleryItems + '</div>' +
            '<button type="button" class="dd-seta dd-seta-ant" aria-label="Fotos anteriores"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg></button>' +
            '<button type="button" class="dd-seta dd-seta-prox" aria-label="Próximas fotos"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></button>' +
          '</div>' +
          p.galleryNote +
          (p.videosHtml ? '<div class="dd-videos">' + p.videosHtml + '</div>' : '') +
        '</div>' +
      '</section>'
    ) : '';

    // ---- plantas (clara): um botão por casa ("grupo") e os andares dela em carrossel lateral ----
    var listaPlantas = (item.plantas || []).filter(function(pl){ return pl && pl.src; });
    var grupos = [];
    listaPlantas.forEach(function(pl){
      var g = pl.grupo || '';
      var achado = grupos.filter(function(x){ return x.nome === g; })[0];
      if(!achado){ achado = { nome: g, itens: [] }; grupos.push(achado); }
      achado.itens.push(pl);
    });
    function cartaoPlanta(pl){
      var titulo = (pl.grupo ? pl.grupo + ' · ' : '') + (pl.nome || 'Planta');
      return '<a href="' + esc(pl.src) + '"' + (pl.webp ? ' data-webp="' + esc(pl.webp) + '"' : '') + ' target="_blank" rel="noopener">' +
        picture(pl.src, pl.webp, 'Planta ' + titulo, {lazy:true}) +
        '<span class="dd-planta-nome">' + esc(pl.nome || 'Planta') + '</span>' +
      '</a>';
    }
    function carrosselPlantas(itens, rotulo){
      return '<div class="dd-carrossel" data-dd-carrossel>' +
        '<div class="gallery-full dd-trilho dd-trilho-plantas' + (itens.length === 1 ? ' dd-trilho-unica' : '') + '" tabindex="0" aria-label="' + esc(rotulo) + ' (arraste para o lado)">' + itens.map(cartaoPlanta).join('') + '</div>' +
        '<button type="button" class="dd-seta dd-seta-ant" aria-label="Planta anterior"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg></button>' +
        '<button type="button" class="dd-seta dd-seta-prox" aria-label="Próxima planta"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></button>' +
      '</div>';
    }
    // tabela das casas (área e vagas): fica junto das plantas; sem plantas, vira uma seção própria
    var tabelaUnidades = p.unitRows ? (
      '<div class="dd-cartao dd-cartao-unid reveal">' +
        '<div class="section-label">' + esc(item.unidades_titulo || 'Unidades') + '</div>' +
        '<table class="unit-table">' +
          '<thead><tr><th>' + esc(item.unidades_col1 || 'Unidade') + '</th><th>Área</th><th>Vaga(s)</th></tr></thead>' +
          '<tbody>' + p.unitRows + '</tbody>' +
        '</table>' +
      '</div>'
    ) : '';
    var plantasSec = '';
    if(listaPlantas.length){
      var corpoPlantas;
      if(grupos.length > 1){
        var abas = grupos.map(function(g, i){
          return '<button type="button" role="tab" class="dd-aba" id="dd-aba-' + i + '" aria-controls="dd-painel-' + i + '" aria-selected="' + (i === 0) + '"' + (i === 0 ? '' : ' tabindex="-1"') + '>' + esc(g.nome || ('Opção ' + (i + 1))) + '</button>';
        }).join('');
        var paineis = grupos.map(function(g, i){
          var unidade = (item.unidades || []).filter(function(u){ return u.nome === g.nome; })[0];
          var info = unidade ? '<p class="dd-planta-info">' + esc([unidade.area, unidade.vaga].filter(Boolean).join(' · ')) + '</p>' : '';
          return '<div role="tabpanel" class="dd-painel" id="dd-painel-' + i + '" aria-labelledby="dd-aba-' + i + '"' + (i === 0 ? '' : ' hidden') + '>' +
            carrosselPlantas(g.itens, 'Plantas da ' + (g.nome || 'opção ' + (i + 1))) + info +
          '</div>';
        }).join('');
        corpoPlantas = '<div class="dd-abas" role="tablist" aria-label="Escolha a casa">' + abas + '</div>' + paineis;
      } else {
        corpoPlantas = carrosselPlantas(listaPlantas, 'Plantas');
      }
      plantasSec = '' +
        '<section class="dd-sec dd-claro" aria-labelledby="dd-plantas-titulo">' +
          '<div class="wrap">' +
            '<div class="dd-eyebrow">Plantas</div>' +
            '<h2 id="dd-plantas-titulo" class="dd-h2">Conheça a planta de cada ' + esc(grupos.length > 1 ? 'casa' : 'unidade') + '</h2>' +
            tabelaUnidades +
            '<div class="reveal" data-dd-plantas>' + corpoPlantas + '</div>' +
            '<p class="side-note">Toque na planta para ampliar. Imagens ilustrativas; medidas sujeitas a alterações no projeto executivo.</p>' +
          '</div>' +
        '</section>';
    }

    // ---- diferenciais (escura, em destaque) ----
    var projeto = p.features ? (
      '<section class="dd-sec dd-escuro" aria-labelledby="dd-projeto-titulo">' +
        '<div class="wrap">' +
          '<div class="dd-eyebrow">O projeto</div>' +
          '<h2 id="dd-projeto-titulo" class="dd-h2">Diferenciais do ' + esc(item.nome.replace(/^Residencial\s+/i, '')) + '</h2>' +
          '<div class="dd-difs reveal' + (((item.diferenciais || []).length % 3 !== 0 && (item.diferenciais || []).length % 2 === 0) ? ' dd-difs-2' : '') + '">' + p.features + '</div>' +
        '</div>' +
      '</section>'
    ) : '';
    // sem plantas, a tabela das casas não some: ganha uma seção clara própria
    var unidadesSec = (!listaPlantas.length && tabelaUnidades) ? (
      '<section class="dd-sec dd-claro"><div class="wrap">' + tabelaUnidades + '</div></section>'
    ) : '';

    // ---- região / mapa (escura) ----
    var mapa = '';
    if(item.mapa && item.mapa.endereco){
      var q = encodeURIComponent(item.mapa.endereco);
      mapa = '' +
        '<section class="dd-sec dd-escuro" aria-labelledby="dd-regiao-titulo">' +
          '<div class="wrap dd-regiao">' +
            '<div class="reveal">' +
              '<div class="dd-eyebrow">Localização</div>' +
              '<h2 id="dd-regiao-titulo">Explore a região</h2>' +
              (item.mapa.texto ? '<p class="dd-texto-solto">' + esc(item.mapa.texto) + '</p>' : '') +
              '<p class="dd-end">' + icone('pino') + '<span>' + esc(item.mapa.endereco) + '</span></p>' +
              '<a class="btn dd-btn-vazado" href="https://www.google.com/maps/search/?api=1&amp;query=' + q + '" target="_blank" rel="noopener">Abrir no Google Maps</a>' +
            '</div>' +
            // O mapa do Google só carrega se a pessoa pedir (não manda dados ao Google antes disso e deixa a página mais leve).
            '<div class="dd-mapa reveal" data-dd-mapa="' + q + '">' +
              '<button type="button" class="dd-mapa-botao">' + icone('pino') + '<span>Ver o mapa aqui</span><small>Carrega o mapa do Google</small></button>' +
            '</div>' +
          '</div>' +
        '</section>';
    }

    // ---- andamento da obra (clara) ----
    var obra = '';
    var etapas = (item.obra && item.obra.etapas || []).filter(function(e){ return e && e.nome; });
    // só o percentual geral (sem etapas): uma barra única, sem repetir o "Total geral"
    var soTotal = !etapas.length && item.obra && item.obra.total !== undefined && item.obra.total !== '';
    if(soTotal) etapas = [{ nome: 'Andamento geral', percentual: item.obra.total }];
    if(etapas.length){
      var soma = 0;
      var barras = etapas.map(function(e){
        var v = pct(e.percentual); soma += v;
        return '<li class="dd-etapa"><div class="dd-etapa-topo"><span>' + esc(e.nome) + '</span><b>' + fmtPct(v) + '</b></div>' +
          '<div class="dd-barra" role="progressbar" aria-label="' + esc(e.nome) + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + v + '"><i style="--pct:' + v + '%"></i></div></li>';
      }).join('');
      var total = (item.obra.total !== undefined && item.obra.total !== '') ? pct(item.obra.total) : soma / etapas.length;
      obra = '' +
        '<section class="dd-sec dd-claro" aria-labelledby="dd-obra-titulo">' +
          '<div class="wrap dd-obra reveal">' +
            '<div>' +
              '<div class="dd-eyebrow">Obra</div>' +
              '<h2 id="dd-obra-titulo" class="dd-h2">Acompanhe o andamento da obra</h2>' +
              (item.obra.atualizado_em ? '<p class="side-note">Atualizado em ' + esc(item.obra.atualizado_em) + '.</p>' : '') +
            '</div>' +
            '<div>' +
              '<ul class="dd-etapas">' + barras + '</ul>' +
              (soTotal ? '' : '<div class="dd-total"><span>Total geral</span><b>' + fmtPct(total) + '</b></div>') +
            '</div>' +
          '</div>' +
        '</section>';
    }

    // ---- formulário + contato (escura) ----
    var contato = '' +
      '<section id="interesse" class="dd-sec dd-escuro dd-interesse" aria-labelledby="dd-interesse-titulo">' +
        '<div class="wrap dd-interesse-grid">' +
          '<div class="reveal">' +
            '<div class="dd-eyebrow">Fale com a Chiado</div>' +
            '<h2 id="dd-interesse-titulo">Gostou do ' + esc(item.nome) + '?</h2>' +
            '<p class="dd-texto-solto">Deixe seus dados e retornamos com valores, plantas e condições. Se preferir, chame no WhatsApp.</p>' +
            (p.sidebarRows ? '<div class="dd-linhas">' + p.sidebarRows + '</div>' : '') +
            '<a class="btn dd-btn-ouro" href="' + esc(p.waHref) + '" target="_blank" rel="noopener">' + R.waIconSvg() + esc(item.sidebar_botao || 'Falar no WhatsApp') + '</a>' +
            (item.sidebar_nota ? '<p class="dd-nota">' + esc(item.sidebar_nota) + '</p>' : '') +
          '</div>' +
          '<div id="lead-form-root" data-empreendimento="' + esc(item.slug) + '"></div>' +
        '</div>' +
      '</section>';

    // ---- outros empreendimentos (clara) ----
    var outros = items.filter(function(i){ return i.slug !== item.slug; }).map(function(i){
      var specs = (i.specs_card || []).map(function(s){ return '<span>' + esc(s) + '</span>'; }).join('');
      return '' +
        '<a class="dd-outro reveal" href="imovel.html?slug=' + encodeURIComponent(i.slug) + '">' +
          '<div class="dd-outro-foto">' + picture(i.capa, i.capa_webp, 'Fachada do ' + i.nome, {lazy:true}) + '</div>' +
          '<div class="dd-outro-corpo">' +
            '<span class="dd-outro-tag">' + esc(i.tag_label) + '</span>' +
            '<h3>' + esc(i.nome) + '</h3>' +
            '<div class="card-specs">' + specs + '</div>' +
            '<span class="dd-outro-link">Conheça agora →</span>' +
          '</div>' +
        '</a>';
    }).join('');
    var outrosSec = outros ? (
      '<section class="dd-sec dd-claro2" aria-labelledby="dd-outros-titulo">' +
        '<div class="wrap">' +
          '<div class="dd-eyebrow">Chiado Construtora</div>' +
          '<h2 id="dd-outros-titulo" class="dd-h2">Conheça outros empreendimentos</h2>' +
          '<div class="dd-outros">' + outros + '</div>' +
        '</div>' +
      '</section>'
    ) : '';

    root.innerHTML = '<div class="dd-pagina">' + capa + sobre + galeria + projeto + plantasSec + unidadesSec + mapa + obra + contato + outrosSec + '</div>';

    root.querySelectorAll('[data-dd-carrossel]').forEach(iniciarCarrossel);
    iniciarAbas(root.querySelector('[data-dd-plantas]'));
    // "Baixar o book": leva ao formulário e marca o pedido do book (o formulário escuta este evento).
    root.querySelectorAll('[data-pedir-book]').forEach(function(b){
      b.addEventListener('click', function(){
        window.__chiadoQuerBook = true;
        document.dispatchEvent(new CustomEvent('chiado:book'));
      });
    });

    var caixa = root.querySelector('[data-dd-mapa]');
    if(caixa){
      caixa.querySelector('button').addEventListener('click', function(){
        caixa.innerHTML = '<iframe title="Mapa: ' + esc(item.mapa.endereco) + '" src="https://www.google.com/maps?q=' + caixa.getAttribute('data-dd-mapa') + '&amp;output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>';
      });
    }
  };

})();
