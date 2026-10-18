// Capa do empreendimento. Duas camadas:
//  1) apresentação de fotos (troca a cada 5,5 s); é a versão do celular e de quem reduz movimento;
//  2) vídeo (data-hero-video), só no computador: entra por cima das fotos quando começa a tocar.
window.initHeroSlides = function(){
  var raiz = document.querySelector('[data-hero-slides]');
  if(!raiz) return;
  var slides = raiz.querySelectorAll('.hero-slide');

  var reduz = false;
  try { reduz = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch(e){}
  if(reduz) return; // fica só a primeira foto, parada

  var intervalo = null;
  if(slides.length > 1){
    // pré-carrega as demais fotos para a troca não mostrar quadro vazio
    for(var i = 1; i < slides.length; i++){ var im = slides[i].querySelector('img'); if(im) im.loading = 'eager'; }
    var atual = 0;
    intervalo = setInterval(function(){
      if(document.hidden) return;
      slides[atual].classList.remove('is-active');
      slides[atual].setAttribute('aria-hidden', 'true');
      atual = (atual + 1) % slides.length;
      slides[atual].classList.add('is-active');
      slides[atual].removeAttribute('aria-hidden');
    }, 5500);
  }

  var larga = false, economiza = false;
  try { larga = window.matchMedia('(min-width: 761px)').matches; } catch(e){}
  try { economiza = !!(navigator.connection && navigator.connection.saveData); } catch(e){}
  if(economiza) return; // "economizar dados": só as fotos
  // computador: vídeo principal; celular: a versão leve (data-hero-video-celular), se existir; senão, só as fotos
  var src = larga ? raiz.getAttribute('data-hero-video') : raiz.getAttribute('data-hero-video-celular');
  if(!src) return;

  var v = document.createElement('video');
  v.className = 'hero-video';
  v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = true;
  v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true');
  v.preload = 'auto';
  v.addEventListener('playing', function(){
    raiz.classList.add('has-video');
    if(intervalo){ clearInterval(intervalo); intervalo = null; }
  }, { once: true });
  v.src = src;
  raiz.appendChild(v);
  var p = v.play();
  if(p && p.catch) p.catch(function(){}); // se o navegador não deixar, continuam as fotos
};
