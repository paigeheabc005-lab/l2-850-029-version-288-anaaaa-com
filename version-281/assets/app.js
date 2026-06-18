(function () {
  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function normalizeText(value) {
    return (value || "").toString().toLowerCase().trim();
  }

  function setupMenu() {
    var button = $(".menu-toggle");
    var panel = $(".mobile-panel");
    if (!button || !panel) {
      return;
    }
    button.addEventListener("click", function () {
      var open = panel.classList.toggle("open");
      button.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  function setupHero() {
    var slides = $all(".hero-slide");
    var dots = $all(".hero-dot");
    if (!slides.length) {
      return;
    }
    var active = 0;
    var timer = null;
    function show(index) {
      active = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("active", i === active);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("active", i === active);
      });
    }
    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        show(i);
        restart();
      });
    });
    function restart() {
      if (timer) {
        clearInterval(timer);
      }
      timer = setInterval(function () {
        show(active + 1);
      }, 5200);
    }
    show(0);
    restart();
  }

  function setupSearchForms() {
    $all(".site-search").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        var input = form.querySelector("input[name='q']");
        if (!input || !input.value.trim()) {
          event.preventDefault();
          return;
        }
      });
    });
  }

  function setupFilterGrids() {
    $all(".filter-area").forEach(function (area) {
      var input = area.querySelector(".filter-input");
      var cards = $all(".movie-card", area);
      var empty = area.querySelector(".empty-message");
      if (!input || !cards.length) {
        return;
      }
      var params = new URLSearchParams(window.location.search);
      var q = params.get("q") || "";
      if (q) {
        input.value = q;
      }
      function apply() {
        var keyword = normalizeText(input.value);
        var visible = 0;
        cards.forEach(function (card) {
          var text = normalizeText(card.getAttribute("data-search") || card.textContent);
          var show = !keyword || text.indexOf(keyword) !== -1;
          card.classList.toggle("hidden-card", !show);
          if (show) {
            visible += 1;
          }
        });
        if (empty) {
          empty.style.display = visible ? "none" : "block";
        }
      }
      input.addEventListener("input", apply);
      apply();
    });
  }

  function setupAnchorButtons() {
    $all("[data-scroll-target]").forEach(function (button) {
      button.addEventListener("click", function () {
        var target = $(button.getAttribute("data-scroll-target"));
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  }

  window.startMoviePlayer = function (source) {
    var video = $("#movieVideo");
    var overlay = $(".player-overlay");
    if (!video || !source) {
      return;
    }
    var loaded = false;
    function loadVideo() {
      if (loaded) {
        return;
      }
      loaded = true;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source;
      } else if (window.Hls && window.Hls.isSupported()) {
        var hls = new window.Hls({ enableWorker: true });
        hls.loadSource(source);
        hls.attachMedia(video);
      } else {
        video.src = source;
      }
    }
    function playVideo() {
      loadVideo();
      if (overlay) {
        overlay.classList.add("is-hidden");
      }
      var promise = video.play();
      if (promise && promise.catch) {
        promise.catch(function () {});
      }
    }
    if (overlay) {
      overlay.addEventListener("click", playVideo);
    }
    video.addEventListener("click", function () {
      if (video.paused) {
        playVideo();
      }
    });
    video.addEventListener("play", function () {
      if (overlay) {
        overlay.classList.add("is-hidden");
      }
    });
  };

  document.addEventListener("DOMContentLoaded", function () {
    setupMenu();
    setupHero();
    setupSearchForms();
    setupFilterGrids();
    setupAnchorButtons();
  });
})();
