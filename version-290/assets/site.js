(function () {
  var base = document.body.getAttribute('data-base') || './';

  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function setupMobileMenu() {
    var button = qs('.menu-toggle');
    var panel = qs('.mobile-panel');
    if (!button || !panel) {
      return;
    }
    button.addEventListener('click', function () {
      var isOpen = panel.hasAttribute('hidden') === false;
      if (isOpen) {
        panel.setAttribute('hidden', '');
        button.setAttribute('aria-expanded', 'false');
      } else {
        panel.removeAttribute('hidden');
        button.setAttribute('aria-expanded', 'true');
      }
    });
  }

  function setupHero() {
    var hero = qs('[data-hero]');
    if (!hero) {
      return;
    }
    var slides = qsa('.hero-slide', hero);
    var dots = qsa('[data-hero-dot]', hero);
    if (!slides.length) {
      return;
    }
    var current = 0;
    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === current);
      });
    }
    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        show(index);
      });
    });
    setInterval(function () {
      show(current + 1);
    }, 5200);
  }

  function setupFilters() {
    var groups = qsa('[data-filter-group]');
    groups.forEach(function (group) {
      var area = group.closest('.section-block') || document;
      var cards = qsa('.filter-card', area);
      var search = qs('[data-card-search]', area);
      var currentType = 'all';
      function apply() {
        var term = search ? search.value.trim().toLowerCase() : '';
        cards.forEach(function (card) {
          var typeText = (card.getAttribute('data-type') || '') + ' ' + (card.getAttribute('data-genre') || '');
          var titleText = [
            card.getAttribute('data-title') || '',
            card.getAttribute('data-region') || '',
            card.getAttribute('data-year') || '',
            card.getAttribute('data-genre') || ''
          ].join(' ').toLowerCase();
          var typeMatch = currentType === 'all' || typeText.indexOf(currentType) !== -1;
          var searchMatch = !term || titleText.indexOf(term) !== -1;
          card.classList.toggle('is-hidden', !(typeMatch && searchMatch));
        });
      }
      qsa('[data-filter]', group).forEach(function (button) {
        button.addEventListener('click', function () {
          qsa('[data-filter]', group).forEach(function (item) {
            item.classList.remove('is-active');
          });
          button.classList.add('is-active');
          currentType = button.getAttribute('data-filter') || 'all';
          apply();
        });
      });
      if (search) {
        search.addEventListener('input', apply);
      }
    });
  }

  function setupSearchPage() {
    var page = qs('[data-search-page]');
    var target = qs('[data-search-results]');
    if (!page || !target || !window.SEARCH_MOVIES) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var query = (params.get('q') || '').trim();
    var input = qs('[data-search-input]');
    if (input) {
      input.value = query;
    }
    if (!query) {
      return;
    }
    var words = query.toLowerCase().split(/\s+/).filter(Boolean);
    var results = window.SEARCH_MOVIES.filter(function (movie) {
      var haystack = [
        movie.title,
        movie.year,
        movie.region,
        movie.type,
        movie.genre,
        movie.category,
        movie.line,
        (movie.tags || []).join(' ')
      ].join(' ').toLowerCase();
      return words.every(function (word) {
        return haystack.indexOf(word) !== -1;
      });
    });
    target.innerHTML = results.slice(0, 240).map(renderSearchCard).join('');
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, function (char) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[char];
    });
  }

  function renderSearchCard(movie) {
    var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
      return '<span>' + escapeHtml(tag) + '</span>';
    }).join('');
    return '' +
      '<article class="movie-card">' +
        '<a href="' + escapeHtml(movie.url) + '">' +
          '<div class="movie-card__poster">' +
            '<img src="' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">' +
            '<span class="movie-card__badge">' + escapeHtml(movie.type) + '</span>' +
            '<span class="movie-card__score">' + escapeHtml(movie.rating) + '</span>' +
          '</div>' +
          '<div class="movie-card__body">' +
            '<h3>' + escapeHtml(movie.title) + '</h3>' +
            '<p class="movie-card__meta">' + escapeHtml(movie.year) + ' · ' + escapeHtml(movie.region) + ' · ' + escapeHtml(movie.category) + '</p>' +
            '<p class="movie-card__line">' + escapeHtml(movie.line) + '</p>' +
            '<div class="tag-row">' + tags + '</div>' +
          '</div>' +
        '</a>' +
      '</article>';
  }

  function setupPlayers() {
    var players = qsa('.js-player');
    if (!players.length) {
      return;
    }
    players.forEach(function (player) {
      var video = qs('video', player);
      var cover = qs('.player-cover', player);
      var stream = player.getAttribute('data-stream');
      var loaded = false;
      var hlsInstance = null;
      if (!video || !cover || !stream) {
        return;
      }
      function attach() {
        if (loaded) {
          return Promise.resolve();
        }
        loaded = true;
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = stream;
          return Promise.resolve();
        }
        return ensureHls().then(function (Hls) {
          if (Hls && Hls.isSupported()) {
            hlsInstance = new Hls();
            hlsInstance.loadSource(stream);
            hlsInstance.attachMedia(video);
          } else {
            video.src = stream;
          }
        }).catch(function () {
          video.src = stream;
        });
      }
      function start() {
        cover.classList.add('hidden');
        video.controls = true;
        attach().then(function () {
          var promise = video.play();
          if (promise && promise.catch) {
            promise.catch(function () {});
          }
        });
      }
      cover.addEventListener('click', start);
      video.addEventListener('click', function () {
        if (!loaded || video.paused) {
          start();
        }
      });
      window.addEventListener('beforeunload', function () {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      });
    });
  }

  function ensureHls() {
    if (window.Hls) {
      return Promise.resolve(window.Hls);
    }
    if (window.__hlsLoading) {
      return window.__hlsLoading;
    }
    window.__hlsLoading = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = base + 'assets/hls.js';
      script.onload = function () {
        resolve(window.Hls);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
    return window.__hlsLoading;
  }

  setupMobileMenu();
  setupHero();
  setupFilters();
  setupSearchPage();
  setupPlayers();
})();
