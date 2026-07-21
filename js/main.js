// Slider principal — réplica do MasterSlider "partial view" do site original:
// slide ativo 650x430 centralizado, vizinhos a 87,5% visíveis nas laterais,
// troca automática a cada 4s, pausa no hover, loop infinito, arraste e setas.
(function () {
  var slider = document.querySelector('.hero-slider');
  if (!slider) return;

  var track = slider.querySelector('.slides');
  var slides = [].slice.call(track.querySelectorAll('.slide'));
  var dotsWrap = slider.querySelector('.slider-dots');
  var arrowPrev = slider.querySelector('.slider-arrow.prev');
  var arrowNext = slider.querySelector('.slider-arrow.next');

  var BASE_W = 650;        // largura do slide ativo (config do site original)
  var BASE_H = 430;        // altura do slide ativo
  var SIDE_SCALE = 0.875;  // escala dos slides vizinhos (569/650)
  var INTERVAL = 4000;     // autoplay medido no site original (~3,9s)
  var SPEED = 900;         // duração da transição (ms)
  var DOTS_AREA = 36;      // faixa das bolinhas abaixo do slide

  var n = slides.length;
  var current = 0;
  var timer = null;
  var scale = 1;
  var lastD = new Array(n);
  var lastStep = 1; // quantos passos a última navegação avançou

  function ringDist(d) {
    d = ((d % n) + n) % n;
    if (d > n / 2) d -= n;
    return d;
  }

  slides.forEach(function (_, i) {
    var dot = document.createElement('button');
    dot.setAttribute('aria-label', 'Ir para o slide ' + (i + 1));
    dot.addEventListener('click', function () { goTo(i); restart(); });
    dotsWrap.appendChild(dot);
  });
  var dots = dotsWrap.querySelectorAll('button');

  function layout(animate) {
    var vw = slider.clientWidth;
    scale = Math.min(1, (vw - 20) / BASE_W);
    var w = BASE_W * scale;
    var h = BASE_H * scale;

    track.style.height = h + 'px';
    slider.style.height = (h + DOTS_AREA) + 'px';

    slides.forEach(function (el, i) {
      // distância no anel (menor caminho) para o loop infinito
      var d = ringDist(i - current);

      // slide que "deu a volta" no anel se reposiciona sem animação,
      // fora da tela, em vez de atravessar a tela animado
      var wrapped = lastD[i] !== undefined && Math.abs(d - lastD[i]) > lastStep;
      lastD[i] = d;

      var x = (vw - w) / 2 + d * w;
      el.style.transition = (animate && !wrapped)
        ? 'transform ' + SPEED + 'ms ease, opacity ' + SPEED + 'ms ease'
        : 'none';
      el.style.width = w + 'px';
      el.style.height = h + 'px';
      el.style.transform = 'translateX(' + x + 'px) scale(' + (d === 0 ? 1 : SIDE_SCALE) + ')';
      // sombreamento dos slides laterais, como no original (opacity 2/3)
      el.style.opacity = d === 0 ? '1' : '0.667';
      el.classList.toggle('active', d === 0);
    });

    // setas alinhadas às bordas do slide ativo (centerControls do original)
    var edge = (vw - w) / 2;
    arrowPrev.style.left = (edge + 10) + 'px';
    arrowNext.style.right = (edge + 10) + 'px';
    arrowPrev.style.top = arrowNext.style.top = (h / 2) + 'px';

    dots.forEach(function (dot, j) { dot.classList.toggle('active', j === current); });
  }

  function goTo(i) {
    var prev = current;
    current = ((i % n) + n) % n;
    lastStep = Math.max(1, Math.abs(ringDist(current - prev)));
    layout(true);
  }

  function restart() {
    clearInterval(timer);
    timer = setInterval(function () { goTo(current + 1); }, INTERVAL);
  }

  arrowPrev.addEventListener('click', function () { goTo(current - 1); restart(); });
  arrowNext.addEventListener('click', function () { goTo(current + 1); restart(); });

  // pausa no hover (overPause do original)
  slider.addEventListener('mouseenter', function () { clearInterval(timer); });
  slider.addEventListener('mouseleave', restart);

  // arraste / swipe (grabCursor + swipe do original)
  var dragStartX = null;
  track.addEventListener('pointerdown', function (e) {
    dragStartX = e.clientX;
    track.style.cursor = 'grabbing';
  });
  window.addEventListener('pointerup', function (e) {
    if (dragStartX === null) return;
    var dx = e.clientX - dragStartX;
    dragStartX = null;
    track.style.cursor = 'grab';
    if (dx < -40) { goTo(current + 1); restart(); }
    else if (dx > 40) { goTo(current - 1); restart(); }
  });
  track.addEventListener('dragstart', function (e) { e.preventDefault(); });

  window.addEventListener('resize', function () { layout(false); });

  layout(false);
  restart();
})();

// Busca — abre o overlay de tela cheia; Enter envia a pesquisa para todo o site
(function () {
  var overlay = document.querySelector('.search-overlay');
  var toggle = document.querySelector('.search-toggle');
  var close = document.querySelector('.search-close');
  var input = overlay ? overlay.querySelector('input') : null;
  if (!overlay || !toggle) return;

  function openSearch() {
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    setTimeout(function () { input.focus(); }, 300);
  }
  function closeSearch() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    input.value = '';
  }

  toggle.addEventListener('click', openSearch);
  close.addEventListener('click', closeSearch);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeSearch();
  });
})();

// Paginação do grid (blog, galeria e categorias): N por página com bolinhas
// cinzas e troca deslizante horizontal, como o Owl Carousel do grid original
(function () {
  var grid = document.querySelector('.archive-grid[data-per-page]');
  if (!grid) return;
  var per = parseInt(grid.getAttribute('data-per-page'), 10);
  var tiles = [].slice.call(grid.querySelectorAll('.archive-tile'));
  if (tiles.length <= per) return;

  var dotsWrap = document.querySelector('.grid-dots');
  var pages = Math.ceil(tiles.length / per);
  var current = 0;

  // monta o carrossel: viewport > track > páginas (cada uma com sua grade)
  var viewport = document.createElement('div');
  viewport.className = 'grid-viewport';
  var track = document.createElement('div');
  track.className = 'grid-track';
  viewport.appendChild(track);
  var pageEls = [];
  for (var p = 0; p < pages; p++) {
    var pageDiv = document.createElement('div');
    pageDiv.className = 'grid-page';
    var g = document.createElement('div');
    g.className = grid.className;
    for (var i = p * per; i < Math.min((p + 1) * per, tiles.length); i++) {
      g.appendChild(tiles[i]);
    }
    pageDiv.appendChild(g);
    track.appendChild(pageDiv);
    pageEls.push(pageDiv);
  }
  grid.parentNode.replaceChild(viewport, grid);

  function setHeight() {
    viewport.style.height = pageEls[current].offsetHeight + 'px';
  }

  function show(p, scroll) {
    current = p;
    track.style.transform = 'translateX(-' + (p * 100) + '%)';
    setHeight();
    [].forEach.call(dotsWrap.children, function (d, i) {
      d.classList.toggle('active', i === p);
    });
    if (scroll) {
      window.scrollTo({ top: viewport.getBoundingClientRect().top + window.scrollY - 130, behavior: 'smooth' });
    }
  }

  for (var i = 0; i < pages; i++) {
    (function (p) {
      var dot = document.createElement('div');
      dot.className = 'dot';
      dot.setAttribute('role', 'button');
      dot.setAttribute('aria-label', 'Página ' + (p + 1));
      dot.appendChild(document.createElement('span'));
      dot.addEventListener('click', function () { show(p, true); });
      dotsWrap.appendChild(dot);
    })(i);
  }

  // a altura acompanha o carregamento das imagens e o redimensionamento
  track.addEventListener('load', setHeight, true);
  window.addEventListener('resize', setHeight);
  window.addEventListener('load', setHeight);

  show(0, false);
})();

// Menu mobile
(function () {
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.querySelector('.menu');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', function () { menu.classList.toggle('open'); });

  // Em telas pequenas, o primeiro toque em um item com submenu abre o submenu
  document.querySelectorAll('.has-sub > a').forEach(function (link) {
    link.addEventListener('click', function (e) {
      if (window.innerWidth <= 640) {
        e.preventDefault();
        link.parentElement.classList.toggle('open');
      }
    });
  });
})();
