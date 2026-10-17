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

  window.renderDetalheDestaque = function(root, item, items, p){
    var R = window.ChiadoRender;
    var esc = R.esc, picture = R.picture;

    // ---- capa ----
    var chips = '';
    if(item.bairro) chips += '<span class="dd-chip">' + esc(item.bairro) + '</span>';
    if(item.tag_label) chips += '<span class="dd-chip dd-chip-ouro">' + esc(item.tag_label) + '</span>';

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
              '<a class="btn dd-btn-vazado" href="' + esc(p.waHref) + '" target="_blank" rel="noopener">' + R.waIconSvg() + 'WhatsApp</a>' +
            '</div>' +
          '</div>' +
        '</div>' +
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
          '<div class="gallery-full dd-galeria reveal">' + p.galleryItems + '</div>' +
          p.galleryNote +
          (p.videosHtml ? '<div class="dd-videos">' + p.videosHtml + '</div>' : '') +
        '</div>' +
      '</section>'
    ) : '';

    // ---- diferenciais + casas (clara 2) ----
    var plantas = (item.plantas || []).filter(function(pl){ return pl && pl.src; }).map(function(pl){
      return '<a href="' + esc(pl.src) + '"' + (pl.webp ? ' data-webp="' + esc(pl.webp) + '"' : '') + ' target="_blank" rel="noopener">' +
        picture(pl.src, pl.webp, 'Planta ' + (pl.nome || ''), {lazy:true}) +
        '<span class="dd-planta-nome">' + esc(pl.nome || 'Planta') + '</span>' +
      '</a>';
    }).join('');

    var projeto = '' +
      '<section class="dd-sec dd-claro2" aria-labelledby="dd-projeto-titulo">' +
        '<div class="wrap">' +
          '<div class="dd-eyebrow">O projeto</div>' +
          '<h2 id="dd-projeto-titulo" class="dd-h2">Diferenciais e ' + esc((item.unidades_titulo || 'unidades').toLowerCase()) + '</h2>' +
          '<div class="dd-projeto reveal">' +
            '<div class="dd-cartao">' +
              '<div class="section-label">Diferenciais</div>' +
              '<div class="feature-grid">' + p.features + '</div>' +
            '</div>' +
            (p.unitRows ? (
              '<div class="dd-cartao">' +
                '<div class="section-label">' + esc(item.unidades_titulo || 'Unidades') + '</div>' +
                '<table class="unit-table">' +
                  '<thead><tr><th>' + esc(item.unidades_col1 || 'Unidade') + '</th><th>Área</th><th>Vaga(s)</th></tr></thead>' +
                  '<tbody>' + p.unitRows + '</tbody>' +
                '</table>' +
              '</div>'
            ) : '') +
          '</div>' +
          (plantas ? (
            '<div class="section-label dd-plantas-label">Plantas</div>' +
            '<div class="gallery-full dd-plantas reveal">' + plantas + '</div>' +
            '<p class="side-note">Toque na planta para ampliar. Imagens ilustrativas.</p>'
          ) : '') +
        '</div>' +
      '</section>';

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
              '<div class="dd-total"><span>Total geral</span><b>' + fmtPct(total) + '</b></div>' +
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

    root.innerHTML = '<div class="dd-pagina">' + capa + sobre + galeria + projeto + mapa + obra + contato + outrosSec + '</div>';

    var caixa = root.querySelector('[data-dd-mapa]');
    if(caixa){
      caixa.querySelector('button').addEventListener('click', function(){
        caixa.innerHTML = '<iframe title="Mapa: ' + esc(item.mapa.endereco) + '" src="https://www.google.com/maps?q=' + caixa.getAttribute('data-dd-mapa') + '&amp;output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>';
      });
    }
  };

})();
