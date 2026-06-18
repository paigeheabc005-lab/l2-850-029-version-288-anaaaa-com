(function () {
  var navButton = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.site-nav');

  if (navButton && nav) {
    navButton.addEventListener('click', function () {
      nav.classList.toggle('is-open');
    });
  }

  document.querySelectorAll('.site-search-form').forEach(function (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var input = form.querySelector('input[name="q"]');
      var query = input ? input.value.trim() : '';
      var action = form.getAttribute('action') || 'search.html';
      if (query) {
        window.location.href = action + '?q=' + encodeURIComponent(query);
      } else {
        window.location.href = action;
      }
    });
  });

  var hero = document.querySelector('[data-hero]');
  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var current = 0;

    function showSlide(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === current);
      });
    }

    if (slides.length > 0) {
      showSlide(0);
      var next = hero.querySelector('[data-hero-next]');
      var prev = hero.querySelector('[data-hero-prev]');
      if (next) {
        next.addEventListener('click', function () {
          showSlide(current + 1);
        });
      }
      if (prev) {
        prev.addEventListener('click', function () {
          showSlide(current - 1);
        });
      }
      dots.forEach(function (dot, index) {
        dot.addEventListener('click', function () {
          showSlide(index);
        });
      });
      window.setInterval(function () {
        showSlide(current + 1);
      }, 5600);
    }
  }

  var filterInput = document.querySelector('[data-search-input]');
  var cards = Array.prototype.slice.call(document.querySelectorAll('.searchable-grid .movie-card'));
  var emptyState = document.querySelector('[data-empty-state]');
  var chipButtons = Array.prototype.slice.call(document.querySelectorAll('[data-filter-value]'));
  var activeChip = '';

  function normalize(value) {
    return String(value || '').toLowerCase();
  }

  function getCardText(card) {
    return normalize([
      card.getAttribute('data-title'),
      card.getAttribute('data-region'),
      card.getAttribute('data-genre'),
      card.getAttribute('data-year'),
      card.getAttribute('data-tags'),
      card.getAttribute('data-type')
    ].join(' '));
  }

  function applyFilter() {
    if (!cards.length) {
      return;
    }

    var query = normalize(filterInput ? filterInput.value.trim() : '');
    var chip = normalize(activeChip);
    var visibleCount = 0;

    cards.forEach(function (card) {
      var text = getCardText(card);
      var visible = (!query || text.indexOf(query) !== -1) && (!chip || text.indexOf(chip) !== -1);
      card.style.display = visible ? '' : 'none';
      if (visible) {
        visibleCount += 1;
      }
    });

    if (emptyState) {
      emptyState.classList.toggle('is-visible', visibleCount === 0);
    }
  }

  if (filterInput && cards.length) {
    var params = new URLSearchParams(window.location.search);
    var initialQuery = params.get('q') || '';
    if (initialQuery) {
      filterInput.value = initialQuery;
    }
    filterInput.addEventListener('input', applyFilter);
  }

  chipButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      activeChip = button.getAttribute('data-filter-value') || '';
      chipButtons.forEach(function (item) {
        item.classList.toggle('is-active', item === button);
      });
      applyFilter();
    });
  });

  applyFilter();
})();
