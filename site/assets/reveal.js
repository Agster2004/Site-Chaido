window.initReveal = function(){
  const els = document.querySelectorAll('.reveal:not([data-reveal-bound])');
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  els.forEach(el => { el.setAttribute('data-reveal-bound','1'); io.observe(el); });
};
document.addEventListener('DOMContentLoaded', function(){
  window.initReveal();
});
