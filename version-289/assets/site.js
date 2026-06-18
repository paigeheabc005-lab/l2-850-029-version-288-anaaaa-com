import { H as Hls } from './video-vendor-dru42stk.js';

const searchState = {
  index: null,
  loading: false,
};

function normalizeText(value) {
  return String(value || '').toLowerCase().trim();
}

function setupMobileMenu() {
  const toggle = document.querySelector('[data-menu-toggle]');
  const nav = document.querySelector('[data-nav-links]');
  if (!toggle || !nav) {
    return;
  }

  toggle.addEventListener('click', () => {
    nav.classList.toggle('is-open');
  });
}

function setupImageFallbacks() {
  document.querySelectorAll('img[data-cover]').forEach((image) => {
    image.addEventListener('error', () => {
      image.classList.add('image-missing');
    }, { once: true });
  });
}

function setupHeroCarousel() {
  const hero = document.querySelector('[data-hero]');
  if (!hero) {
    return;
  }

  const slides = Array.from(hero.querySelectorAll('[data-hero-slide]'));
  const dots = Array.from(hero.querySelectorAll('[data-hero-dot]'));
  const thumbs = Array.from(hero.querySelectorAll('[data-hero-thumb]'));
  const prev = hero.querySelector('[data-hero-prev]');
  const next = hero.querySelector('[data-hero-next]');
  let current = 0;
  let timer = null;

  function showSlide(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle('is-active', slideIndex === current);
    });
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle('is-active', dotIndex === current);
    });
    thumbs.forEach((thumb, thumbIndex) => {
      thumb.classList.toggle('is-active', thumbIndex === current);
    });
  }

  function startTimer() {
    stopTimer();
    timer = window.setInterval(() => {
      showSlide(current + 1);
    }, 5000);
  }

  function stopTimer() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  prev?.addEventListener('click', () => {
    showSlide(current - 1);
    startTimer();
  });

  next?.addEventListener('click', () => {
    showSlide(current + 1);
    startTimer();
  });

  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      showSlide(Number(dot.dataset.heroDot));
      startTimer();
    });
  });

  thumbs.forEach((thumb) => {
    thumb.addEventListener('click', () => {
      showSlide(Number(thumb.dataset.heroThumb));
      startTimer();
    });
  });

  hero.addEventListener('mouseenter', stopTimer);
  hero.addEventListener('mouseleave', startTimer);
  startTimer();
}

function setupPageFilters() {
  const toolbar = document.querySelector('[data-filter-toolbar]');
  const list = document.querySelector('[data-filter-list]');
  if (!toolbar || !list) {
    return;
  }

  const input = toolbar.querySelector('[data-filter-input]');
  const region = toolbar.querySelector('[data-filter-region]');
  const year = toolbar.querySelector('[data-filter-year]');
  const category = toolbar.querySelector('[data-filter-category]');
  const count = toolbar.querySelector('[data-filter-count]');
  const cards = Array.from(list.querySelectorAll('[data-movie-card]'));

  function applyFilters() {
    const keyword = normalizeText(input?.value);
    const regionValue = normalizeText(region?.value);
    const yearValue = Number(year?.value || 0);
    const categoryValue = normalizeText(category?.value);
    let visible = 0;

    cards.forEach((card) => {
      const search = normalizeText(card.dataset.search);
      const cardRegion = normalizeText(card.dataset.region);
      const cardYear = Number(card.dataset.year || 0);
      const cardCategory = normalizeText(card.dataset.category);
      const matchesKeyword = !keyword || search.includes(keyword);
      const matchesRegion = !regionValue || cardRegion.includes(regionValue);
      const matchesYear = !yearValue || cardYear >= yearValue;
      const matchesCategory = !categoryValue || cardCategory === categoryValue;
      const shouldShow = matchesKeyword && matchesRegion && matchesYear && matchesCategory;
      card.hidden = !shouldShow;
      if (shouldShow) {
        visible += 1;
      }
    });

    if (count) {
      count.textContent = `当前显示 ${visible} 部 / 共 ${cards.length} 部`;
    }
  }

  [input, region, year, category].forEach((control) => {
    control?.addEventListener('input', applyFilters);
    control?.addEventListener('change', applyFilters);
  });

  applyFilters();
}

async function loadSearchIndex() {
  if (searchState.index) {
    return searchState.index;
  }
  if (searchState.loading) {
    while (searchState.loading) {
      await new Promise((resolve) => window.setTimeout(resolve, 50));
    }
    return searchState.index || [];
  }

  searchState.loading = true;
  try {
    const response = await fetch('assets/search-index.json', { cache: 'force-cache' });
    searchState.index = await response.json();
  } catch (error) {
    console.warn('搜索索引加载失败', error);
    searchState.index = [];
  } finally {
    searchState.loading = false;
  }
  return searchState.index;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderGlobalResults(resultsBox, items, keyword) {
  if (!keyword) {
    resultsBox.classList.remove('is-open');
    resultsBox.innerHTML = '';
    return;
  }

  if (!items.length) {
    resultsBox.classList.add('is-open');
    resultsBox.innerHTML = '<div class="search-empty">没有找到匹配影片</div>';
    return;
  }

  resultsBox.classList.add('is-open');
  resultsBox.innerHTML = items.slice(0, 12).map((item) => `
    <a class="search-result-item" href="${escapeHtml(item.url)}">
      <img src="${escapeHtml(item.cover)}" alt="${escapeHtml(item.title)} 封面" loading="lazy" data-cover>
      <span>
        <strong>${escapeHtml(item.title)}</strong>
        <small>${escapeHtml(item.year)} · ${escapeHtml(item.region)} · ${escapeHtml(item.category)}</small>
      </span>
      <em>★ ${escapeHtml(item.rating)}</em>
    </a>
  `).join('');
  setupImageFallbacks();
}

function setupGlobalSearch() {
  const search = document.querySelector('[data-global-search]');
  if (!search) {
    return;
  }

  const input = search.querySelector('[data-global-search-input]');
  const resultsBox = search.querySelector('[data-global-search-results]');
  if (!input || !resultsBox) {
    return;
  }

  input.addEventListener('input', async () => {
    const keyword = normalizeText(input.value);
    const index = await loadSearchIndex();
    const results = keyword
      ? index.filter((item) => normalizeText(item.search).includes(keyword))
      : [];
    renderGlobalResults(resultsBox, results, keyword);
  });

  document.addEventListener('click', (event) => {
    if (!search.contains(event.target)) {
      resultsBox.classList.remove('is-open');
    }
  });
}

function setupPlayer() {
  const video = document.querySelector('[data-video-player]');
  if (!video) {
    return;
  }

  const source = video.dataset.src;
  const box = video.closest('.player-box');
  const button = document.querySelector('[data-play-toggle]');
  const status = document.querySelector('[data-player-status]');

  function setStatus(message) {
    if (status) {
      status.textContent = message;
    }
  }

  if (source) {
    if (Hls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hls.loadSource(source);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setStatus('HLS 播放源已就绪，点击可播放');
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data?.fatal) {
          setStatus('播放源加载异常，可刷新后重试');
        }
      });
      window.addEventListener('beforeunload', () => hls.destroy(), { once: true });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = source;
      setStatus('浏览器原生 HLS 已就绪，点击可播放');
    } else {
      setStatus('当前浏览器不支持 HLS 播放');
    }
  }

  button?.addEventListener('click', async () => {
    try {
      if (video.paused) {
        await video.play();
      } else {
        video.pause();
      }
    } catch (error) {
      setStatus('浏览器阻止了自动播放，请再次点击视频控件');
    }
  });

  video.addEventListener('play', () => {
    box?.classList.add('is-playing');
    setStatus('正在播放');
  });

  video.addEventListener('pause', () => {
    box?.classList.remove('is-playing');
    setStatus('已暂停');
  });
}

setupMobileMenu();
setupImageFallbacks();
setupHeroCarousel();
setupPageFilters();
setupGlobalSearch();
setupPlayer();
