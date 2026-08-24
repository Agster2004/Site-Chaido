// Chiado Construtora - renderizador de conteúdo a partir de data/empreendimentos.json
// Isso permite que o painel administrativo (/admin) edite empreendimentos sem tocar no HTML.

(function(){

  const WHATSAPP_NUMBER = "5513997770974";

  function waLink(msg){
    return "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(msg);
  }

  function waIconSvg(){
    return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm5.8 14.13c-.24.68-1.4 1.32-1.93 1.4-.5.08-1.12.11-1.8-.11-.42-.13-.96-.32-1.65-.62-2.9-1.25-4.79-4.17-4.94-4.36-.14-.19-1.18-1.57-1.18-3 0-1.42.75-2.12 1.02-2.41.27-.29.58-.36.78-.36.2 0 .39 0 .56.01.18.01.42-.07.66.5.24.58.82 2 .89 2.15.07.15.12.32.02.51-.1.19-.15.31-.29.48-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.29.76 1.25 1.63 2.02 1.12.99 2.06 1.3 2.35 1.45.29.15.46.13.63-.08.17-.2.72-.84.91-1.13.19-.29.38-.24.64-.14.26.1 1.65.78 1.93.92.29.15.48.22.55.34.07.13.07.72-.17 1.4Z"/></svg>';
  }

  function checkIconSvg(){
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>';
  }

  function esc(s){
    const d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }

  // Monta <picture> com webp quando disponível; senão, cai para <img> simples.
  function picture(jpgSrc, webpSrc, alt, opts){
    opts = opts || {};
    const cls = opts.cls ? ' class="' + esc(opts.cls) + '"' : '';
    const lazy = opts.lazy === false ? '' : ' loading="lazy"';
    const imgTag = '<img' + cls + ' src="' + esc(jpgSrc) + '" alt="' + esc(alt) + '"' + lazy + '>';
    if(webpSrc){
      return '<picture><source srcset="' + esc(webpSrc) + '" type="image/webp">' + imgTag + '</picture>';
    }
    return imgTag;
  }

  function bgImageSet(jpgSrc, webpSrc){
    if(webpSrc){
      return "background-image:url('" + jpgSrc + "'); background-image:image-set(url('" + webpSrc + "') type('image/webp'), url('" + jpgSrc + "') type('image/jpeg'));";
    }
    return "background-image:url('" + jpgSrc + "');";
  }

  function loadData(){
    return fetch('data/empreendimentos.json', {cache:'no-store'})
      .then(function(r){
        if(!r.ok) throw new Error('resposta não-ok: ' + r.status);
        return r.json();
      })
      .then(function(d){ return d.items || []; })
      .catch(function(err){
        // Abrindo o arquivo direto do computador (sem servidor), o navegador
        // bloqueia esse carregamento. Nesse caso, usamos a cópia local
        // embutida em data/empreendimentos.js como alternativa.
        if(window.EMPREENDIMENTOS_DATA && window.EMPREENDIMENTOS_DATA.items){
          console.warn('Usando cópia local de empreendimentos (pré-visualização sem servidor).');
          return window.EMPREENDIMENTOS_DATA.items;
        }
        throw err;
      });
  }

  // ---------- Nav dropdown (all pages) ----------
  function renderNav(items){
    const menu = document.getElementById('nav-empreendimentos-menu');
    if(!menu) return;
    let html = '';
    items.forEach(function(item){
      html += '<a href="imovel.html?slug=' + encodeURIComponent(item.slug) + '">' + esc(item.nome) + '</a>';
    });
    html += '<div class="nav-dropdown-soon">Alcantara Mar <span>Em breve</span></div>';
    menu.innerHTML = html;
  }

  // ---------- Home page cards ----------
  function renderCards(items){
    const container = document.getElementById('cards-container');
    if(!container) return;
    let html = '';
    items.forEach(function(item){
      const tagClass = item.status === 'pronto' ? 'tag-ready' : 'tag-building';
      const specs = (item.specs_card || []).map(s => '<span>' + esc(s) + '</span>').join('');
      html += '' +
        '<div class="card reveal">' +
          '<div class="card-cover">' +
            picture(item.capa, item.capa_webp, 'Fachada do ' + item.nome, {lazy:true}) +
            '<span class="card-tag ' + tagClass + '">' + esc(item.tag_label) + '</span>' +
          '</div>' +
          '<div class="card-body">' +
            '<h3>' + esc(item.nome) + '</h3>' +
            '<p class="card-address">' + esc(item.endereco) + '</p>' +
            '<div class="card-specs">' + specs + '</div>' +
            '<p class="card-desc">' + esc(item.resumo_curto) + '</p>' +
            '<div class="card-actions">' +
              '<a class="btn btn-dark" href="imovel.html?slug=' + encodeURIComponent(item.slug) + '">Saiba mais</a>' +
              '<a class="btn btn-outline-dark" href="' + waLink('Olá, tenho interesse no ' + item.nome + '.') + '" target="_blank" rel="noopener">WhatsApp</a>' +
            '</div>' +
          '</div>' +
        '</div>';
    });
    container.innerHTML = html;
  }

  // ---------- Detail page (imovel.html) ----------
  function renderDetail(items){
    const root = document.getElementById('detail-root');
    if(!root) return;

    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');
    const item = items.find(i => i.slug === slug) || items[0];

    if(!item){
      root.innerHTML = '<div class="wrap" style="padding:80px 0;"><p>Empreendimento não encontrado.</p></div>';
      return;
    }

    document.title = item.nome + ' | Chiado Construtora';
    const metaDesc = document.querySelector('meta[name="description"]');
    if(metaDesc) metaDesc.setAttribute('content', item.meta_descricao || item.descricao || '');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if(ogTitle) ogTitle.setAttribute('content', item.nome + ' | Chiado Construtora');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if(ogDesc) ogDesc.setAttribute('content', item.meta_descricao || item.descricao || '');
    const ogImage = document.querySelector('meta[property="og:image"]');
    if(ogImage) ogImage.setAttribute('content', item.capa);

    const tagClass = item.status === 'pronto' ? 'tag-ready' : 'tag-building';

    const features = (item.diferenciais || []).map(function(f){
      return '<div class="feature-item">' + checkIconSvg() + esc(f) + '</div>';
    }).join('');

    const unitRows = (item.unidades || []).map(function(u){
      return '<tr><td class="strong">' + esc(u.nome) + '</td><td>' + esc(u.area) + '</td><td>' + esc(u.vaga) + '</td></tr>';
    }).join('');

    const galleryItems = (item.galeria || []).map(function(g){
      return '<a href="' + esc(g.src) + '" target="_blank" rel="noopener">' + picture(g.src, g.webp, g.alt, {lazy:true}) + '</a>';
    }).join('');

    const galleryNote = item.galeria_nota ? '<p class="side-note" style="margin-top:10px;">' + esc(item.galeria_nota) + '</p>' : '';

    const videosHtml = (item.videos || []).map(function(v){
      return '' +
        '<div class="video-block">' +
          '<video controls preload="metadata" poster="' + esc(v.poster) + '">' +
            '<source src="' + esc(v.src) + '" type="video/mp4">' +
            'Seu navegador não suporta vídeo.' +
          '</video>' +
        '</div>' +
        '<p class="side-note" style="margin:10px 0 22px;">' + esc(v.legenda) + '</p>';
    }).join('');

    const sidebarRows = (item.sidebar_rows || []).map(function(r){
      return '<div class="side-row"><span>' + esc(r.label) + '</span><b>' + esc(r.value) + '</b></div>';
    }).join('');

    const waMsg = item.whatsapp_msg || ('Olá, tenho interesse no ' + item.nome + '.');

    root.innerHTML = '' +
      '<div class="wrap">' +
        '<a class="back-link" href="index.html">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>' +
          'Voltar aos empreendimentos' +
        '</a>' +
      '</div>' +

      '<div class="detail-hero">' +
        '<div class="detail-hero-bg" style="' + bgImageSet(item.capa, item.capa_webp) + '"></div>' +
        picture(item.capa, item.capa_webp, 'Fachada do ' + item.nome, {cls:'detail-hero-img', lazy:false}) +
        '<div class="detail-hero-overlay">' +
          '<div class="wrap detail-hero-content">' +
            '<span class="detail-tag ' + tagClass + '">' + esc(item.tag_label) + '</span>' +
            '<h1>' + esc(item.nome) + '</h1>' +
            '<p class="detail-address">' + esc(item.endereco) + '</p>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="wrap detail-body">' +
        '<div>' +
          '<p class="detail-desc">' + esc(item.descricao) + '</p>' +

          '<div class="section-label">Diferenciais</div>' +
          '<div class="feature-grid">' + features + '</div>' +

          (unitRows ? (
            '<div class="section-label">' + esc(item.unidades_titulo || 'Unidades') + '</div>' +
            '<table class="unit-table">' +
              '<thead><tr><th>' + esc(item.unidades_col1 || 'Unidade') + '</th><th>Área</th><th>Vaga(s)</th></tr></thead>' +
              '<tbody>' + unitRows + '</tbody>' +
            '</table>'
          ) : '') +

          '<div class="section-label">Fotos</div>' +
          '<div class="gallery-full">' + galleryItems + '</div>' +
          galleryNote +

          (videosHtml ? ('<div class="section-label">Vídeos</div>' + videosHtml) : '') +
        '</div>' +

        '<div class="side-panel">' +
          '<div class="lbl">Fale com a Chiado</div>' +
          sidebarRows +
          '<a class="btn btn-dark btn-full" href="' + waLink(waMsg) + '" target="_blank" rel="noopener">' +
            waIconSvg() + esc(item.sidebar_botao || 'Falar no WhatsApp') +
          '</a>' +
          '<p class="side-note">' + esc(item.sidebar_nota) + '</p>' +
        '</div>' +
      '</div>';

    // atualiza o botão do topo e o flutuante do WhatsApp com a mensagem deste empreendimento
    document.querySelectorAll('[data-wa-cta]').forEach(function(a){
      a.setAttribute('href', waLink(waMsg));
    });
  }

  document.addEventListener('DOMContentLoaded', function(){
    loadData().then(function(items){
      renderNav(items);
      renderCards(items);
      renderDetail(items);
      if(window.initReveal) window.initReveal();
      if(window.initLightbox) window.initLightbox();
    }).catch(function(err){
      console.error('Erro ao carregar empreendimentos:', err);
    });
  });

})();
