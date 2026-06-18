(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  function initMenu() {
    var toggle = document.querySelector("[data-menu-toggle]");
    var menu = document.querySelector("[data-mobile-menu]");
    if (!toggle || !menu) {
      return;
    }
    toggle.addEventListener("click", function () {
      menu.classList.toggle("is-open");
      document.body.classList.toggle("no-scroll", menu.classList.contains("is-open"));
    });
  }

  function initHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll(".hero-dot"));
    if (slides.length < 2) {
      return;
    }
    var index = 0;
    var timer = null;
    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === index);
      });
    }
    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }
    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }
    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        show(i);
        start();
      });
    });
    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", start);
    show(0);
    start();
  }

  function initFilters() {
    var page = document.querySelector("[data-search-page]");
    if (!page) {
      return;
    }
    var input = page.querySelector("[data-search-input]");
    var year = page.querySelector("[data-year-filter]");
    var region = page.querySelector("[data-region-filter]");
    var type = page.querySelector("[data-type-filter]");
    var reset = page.querySelector("[data-filter-reset]");
    var empty = page.querySelector("[data-search-empty]");
    var items = Array.prototype.slice.call(page.querySelectorAll("[data-search-item]"));
    var params = new URLSearchParams(window.location.search);
    var query = params.get("q") || "";
    if (input && query) {
      input.value = query;
    }
    function valueOf(node) {
      return node ? node.value.trim().toLowerCase() : "";
    }
    function run() {
      var text = valueOf(input);
      var yearValue = valueOf(year);
      var regionValue = valueOf(region);
      var typeValue = valueOf(type);
      var visible = 0;
      items.forEach(function (item) {
        var haystack = item.getAttribute("data-haystack") || "";
        var pass = true;
        if (text && haystack.indexOf(text) === -1) {
          pass = false;
        }
        if (yearValue && (item.getAttribute("data-year") || "").toLowerCase() !== yearValue) {
          pass = false;
        }
        if (regionValue && (item.getAttribute("data-region") || "").toLowerCase() !== regionValue) {
          pass = false;
        }
        if (typeValue && (item.getAttribute("data-type") || "").toLowerCase() !== typeValue) {
          pass = false;
        }
        item.style.display = pass ? "" : "none";
        if (pass) {
          visible += 1;
        }
      });
      if (empty) {
        empty.classList.toggle("is-visible", visible === 0);
      }
    }
    [input, year, region, type].forEach(function (node) {
      if (node) {
        node.addEventListener("input", run);
        node.addEventListener("change", run);
      }
    });
    if (reset) {
      reset.addEventListener("click", function () {
        if (input) {
          input.value = "";
        }
        if (year) {
          year.value = "";
        }
        if (region) {
          region.value = "";
        }
        if (type) {
          type.value = "";
        }
        run();
      });
    }
    run();
  }

  function initPlayers() {
    var players = Array.prototype.slice.call(document.querySelectorAll("[data-player]"));
    players.forEach(function (player) {
      var video = player.querySelector("video");
      var overlay = player.querySelector("[data-play-button]");
      var source = player.getAttribute("data-video");
      var hls = null;
      var prepared = false;
      if (!video || !overlay || !source) {
        return;
      }
      function hideOverlay() {
        overlay.classList.add("is-hidden");
      }
      function showOverlay() {
        if (video.paused) {
          overlay.classList.remove("is-hidden");
        }
      }
      function playVideo() {
        hideOverlay();
        video.controls = true;
        var playPromise = video.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(function () {
            showOverlay();
          });
        }
      }
      function prepare() {
        if (prepared) {
          playVideo();
          return;
        }
        prepared = true;
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = source;
          playVideo();
          return;
        }
        if (window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls({ enableWorker: true });
          hls.attachMedia(video);
          hls.on(window.Hls.Events.MEDIA_ATTACHED, function () {
            hls.loadSource(source);
            playVideo();
          });
          hls.on(window.Hls.Events.ERROR, function (_, data) {
            if (data && data.fatal) {
              showOverlay();
            }
          });
          return;
        }
        video.src = source;
        playVideo();
      }
      overlay.addEventListener("click", prepare);
      video.addEventListener("click", function () {
        if (video.paused) {
          prepare();
        }
      });
      video.addEventListener("play", hideOverlay);
      video.addEventListener("pause", showOverlay);
      window.addEventListener("beforeunload", function () {
        if (hls) {
          hls.destroy();
        }
      });
    });
  }

  ready(function () {
    initMenu();
    initHero();
    initFilters();
    initPlayers();
  });
})();
