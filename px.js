/* PXForge — shared page behavior (nav, mobile menu, reveal, progress) */
(function(){
  "use strict";
  var doc = document, body = doc.body;

  // progress bar
  var bar = doc.getElementById('progress');
  // nav scrolled state
  var nav = doc.querySelector('nav');
  function onScroll(){
    var y = window.scrollY || window.pageYOffset;
    if(nav) nav.classList.toggle('scrolled', y > 30);
    if(bar){
      var h = doc.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    }
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  // mobile menu
  var toggle = doc.querySelector('.menu-toggle');
  var menu = doc.querySelector('.mobile-menu');
  function closeMenu(){ body.classList.remove('menu-open'); if(toggle) toggle.setAttribute('aria-expanded','false'); }
  function openMenu(){ body.classList.add('menu-open'); if(toggle) toggle.setAttribute('aria-expanded','true'); }
  if(toggle){
    toggle.addEventListener('click', function(){
      body.classList.contains('menu-open') ? closeMenu() : openMenu();
    });
  }
  if(menu){
    menu.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', closeMenu); });
  }
  doc.addEventListener('keydown', function(e){ if(e.key === 'Escape') closeMenu(); });

  // scroll reveal
  var revealEls = doc.querySelectorAll('.reveal');
  if('IntersectionObserver' in window && revealEls.length){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(en.isIntersecting){ en.target.classList.add('visible'); io.unobserve(en.target); }
      });
    }, {threshold:0.12, rootMargin:'0px 0px -8% 0px'});
    revealEls.forEach(function(el){ io.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add('visible'); });
  }
})();
