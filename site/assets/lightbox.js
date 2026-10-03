window.initLightbox = function(){
  const galleries = document.querySelectorAll('.gallery-full');
  if(!galleries.length) return;

  // build a flat list of images per gallery container (usually just one per page)
  galleries.forEach(function(gallery){
    const links = Array.from(gallery.querySelectorAll('a'));
    if(!links.length) return;

    const images = links.map(function(a){
      const img = a.querySelector('img');
      // usa o WebP (bem mais leve) quando existe; o JPG continua como link de reserva
      return { src: a.getAttribute('data-webp') || a.getAttribute('href'), alt: img ? img.getAttribute('alt') : '' };
    });

    let current = 0;
    let lastFocused = null;

    // build lightbox DOM once per gallery
    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Galeria de fotos');
    lb.innerHTML =
      '<button class="lightbox-close" aria-label="Fechar">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>' +
      '</button>' +
      '<button class="lightbox-nav lightbox-prev" aria-label="Foto anterior">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>' +
      '</button>' +
      '<div class="lightbox-img-wrap"><img alt=""></div>' +
      '<button class="lightbox-nav lightbox-next" aria-label="Próxima foto">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>' +
      '</button>' +
      '<div class="lightbox-counter"></div>';
    document.body.appendChild(lb);

    const imgEl = lb.querySelector('img');
    const counterEl = lb.querySelector('.lightbox-counter');
    const closeBtn = lb.querySelector('.lightbox-close');
    const prevBtn = lb.querySelector('.lightbox-prev');
    const nextBtn = lb.querySelector('.lightbox-next');

    function show(index){
      current = (index + images.length) % images.length;
      imgEl.src = images[current].src;
      imgEl.alt = images[current].alt || '';
      counterEl.textContent = (current + 1) + ' / ' + images.length;
    }

    function open(index){
      lastFocused = document.activeElement;
      show(index);
      lb.classList.add('open');
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    }

    function close(){
      lb.classList.remove('open');
      document.body.style.overflow = '';
      if(lastFocused && typeof lastFocused.focus === 'function'){ lastFocused.focus(); }
      lastFocused = null;
    }

    links.forEach(function(a, i){
      a.addEventListener('click', function(e){
        e.preventDefault();
        open(i);
      });
    });

    closeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', function(){ show(current - 1); });
    nextBtn.addEventListener('click', function(){ show(current + 1); });

    lb.addEventListener('click', function(e){
      if(e.target === lb){ close(); }
    });

    const focusable = [closeBtn, prevBtn, nextBtn];

    document.addEventListener('keydown', function(e){
      if(!lb.classList.contains('open')) return;
      if(e.key === 'Escape') close();
      if(e.key === 'ArrowLeft') show(current - 1);
      if(e.key === 'ArrowRight') show(current + 1);
      if(e.key === 'Tab'){
        e.preventDefault();
        const idx = focusable.indexOf(document.activeElement);
        let next;
        if(e.shiftKey){ next = idx <= 0 ? focusable.length - 1 : idx - 1; }
        else { next = idx === -1 || idx === focusable.length - 1 ? 0 : idx + 1; }
        focusable[next].focus();
      }
    });

    // basic touch swipe support
    let touchStartX = null;
    lb.addEventListener('touchstart', function(e){ touchStartX = e.changedTouches[0].clientX; }, {passive:true});
    lb.addEventListener('touchend', function(e){
      if(touchStartX === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      if(Math.abs(dx) > 40){ dx > 0 ? show(current - 1) : show(current + 1); }
      touchStartX = null;
    }, {passive:true});
  });
};
