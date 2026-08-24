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
