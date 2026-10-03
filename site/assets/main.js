(function(){
  const topbar = document.querySelector('.topbar');
  const toggle = document.querySelector('.nav-toggle');
  if(!topbar || !toggle) return;

  function closeMenu(){
    topbar.classList.remove('menu-open');
    toggle.setAttribute('aria-expanded', 'false');
  }

  toggle.addEventListener('click', function(){
    const isOpen = topbar.classList.toggle('menu-open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  document.querySelectorAll('.main-nav a').forEach(function(a){
    a.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && topbar.classList.contains('menu-open')) closeMenu();
  });

  document.addEventListener('click', function(e){
    if(topbar.classList.contains('menu-open') && !topbar.contains(e.target)) closeMenu();
  });
})();

// Mantém aria-expanded do botão "Empreendimentos" igual ao estado real do submenu
// (aberto por mouse, teclado ou pelo menu do celular).
(function(){
  const dd = document.querySelector('.nav-dropdown');
  if(!dd) return;
  const btn = dd.querySelector('.nav-dropdown-toggle');
  const menu = dd.querySelector('.nav-dropdown-menu');
  if(!btn || !menu) return;

  function sync(){
    // espera a transição de visibilidade do CSS (.15s) terminar
    setTimeout(function(){
      const visible = getComputedStyle(menu).visibility === 'visible';
      btn.setAttribute('aria-expanded', visible ? 'true' : 'false');
    }, 200);
  }

  ['mouseenter', 'mouseleave', 'focusin', 'focusout'].forEach(function(ev){
    dd.addEventListener(ev, sync);
  });
  window.addEventListener('resize', sync);

  const topbar = document.querySelector('.topbar');
  if(topbar) new MutationObserver(sync).observe(topbar, { attributes: true, attributeFilter: ['class'] });

  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && dd.contains(document.activeElement)){
      document.activeElement.blur();
      sync();
    }
  });

  sync();
})();
