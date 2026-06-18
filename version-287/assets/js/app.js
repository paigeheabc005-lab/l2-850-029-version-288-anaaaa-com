(function () {
    const root = document.body.getAttribute('data-root') || '';

    function selectAll(selector, context) {
        return Array.prototype.slice.call((context || document).querySelectorAll(selector));
    }

    function setupMobileMenu() {
        const button = document.querySelector('.mobile-toggle');
        const panel = document.querySelector('.mobile-panel');
        if (!button || !panel) {
            return;
        }
        button.addEventListener('click', function () {
            const open = panel.classList.toggle('is-open');
            button.setAttribute('aria-expanded', open ? 'true' : 'false');
            button.textContent = open ? '×' : '☰';
        });
    }

    function setupHero() {
        const slides = selectAll('[data-hero-slide]');
        const dots = selectAll('[data-hero-dot]');
        if (slides.length <= 1) {
            return;
        }
        let current = 0;
        let timer = null;
        function show(index) {
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('is-active', slideIndex === current);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('is-active', dotIndex === current);
            });
        }
        function start() {
            timer = window.setInterval(function () {
                show(current + 1);
            }, 5200);
        }
        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                window.clearInterval(timer);
                show(Number(dot.getAttribute('data-hero-dot')) || 0);
                start();
            });
        });
        start();
    }

    function setupCardFilter() {
        const input = document.querySelector('.js-card-filter');
        if (!input) {
            return;
        }
        const cards = selectAll('.searchable-grid .movie-card');
        input.addEventListener('input', function () {
            const keyword = input.value.trim().toLowerCase();
            cards.forEach(function (card) {
                const haystack = [
                    card.getAttribute('data-title'),
                    card.getAttribute('data-tags'),
                    card.getAttribute('data-year'),
                    card.getAttribute('data-region'),
                    card.getAttribute('data-genre')
                ].join(' ').toLowerCase();
                card.classList.toggle('is-hidden', keyword && haystack.indexOf(keyword) === -1);
            });
        });
    }

    function setupSearchPage() {
        const results = document.getElementById('search-results');
        const title = document.getElementById('search-title');
        if (!results || !window.__MOVIES__) {
            return;
        }
        const params = new URLSearchParams(window.location.search);
        const keyword = (params.get('q') || '').trim().toLowerCase();
        const largeInput = document.querySelector('.large-search input[name="q"]');
        if (largeInput && keyword) {
            largeInput.value = keyword;
        }
        if (!keyword) {
            return;
        }
        const matched = window.__MOVIES__.filter(function (movie) {
            return [
                movie.title,
                movie.region,
                movie.type,
                movie.year,
                movie.genre,
                movie.tags,
                movie.oneLine
            ].join(' ').toLowerCase().indexOf(keyword) !== -1;
        }).slice(0, 120);
        title.textContent = matched.length ? '搜索结果' : '暂无匹配内容';
        results.innerHTML = matched.map(function (movie) {
            return renderSearchCard(movie);
        }).join('');
    }

    function renderSearchCard(movie) {
        return [
            '<article class="movie-card">',
            '    <a href="' + movie.href + '" class="poster-link" aria-label="' + escapeHtml(movie.title) + '">',
            '        <img src="' + movie.cover + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
            '        <span class="play-hover">▶</span>',
            '        <span class="year-badge">' + escapeHtml(movie.year) + '</span>',
            '    </a>',
            '    <div class="card-body">',
            '        <h2><a href="' + movie.href + '">' + escapeHtml(movie.title) + '</a></h2>',
            '        <p class="card-meta">' + escapeHtml(movie.region + ' · ' + movie.type + ' · ' + movie.genre) + '</p>',
            '        <p class="card-desc">' + escapeHtml(movie.oneLine) + '</p>',
            '    </div>',
            '</article>'
        ].join('');
    }

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>"']/g, function (char) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            }[char];
        });
    }

    function setupPlayers() {
        selectAll('[data-player]').forEach(function (shell) {
            const video = shell.querySelector('video');
            const mainButton = shell.querySelector('.big-play');
            const playButton = shell.querySelector('.control-play');
            const muteButton = shell.querySelector('.control-mute');
            const fullButton = shell.querySelector('.control-full');
            const progress = shell.querySelector('.progress span');
            if (!video) {
                return;
            }
            const url = video.getAttribute('data-hls');
            if (url) {
                if (window.Hls && window.Hls.isSupported()) {
                    const hls = new window.Hls({
                        enableWorker: true,
                        lowLatencyMode: true
                    });
                    hls.loadSource(url);
                    hls.attachMedia(video);
                } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = url;
                }
            }
            function playToggle() {
                if (video.paused) {
                    video.play().catch(function () {});
                } else {
                    video.pause();
                }
            }
            function syncState() {
                const playing = !video.paused && !video.ended;
                shell.classList.toggle('is-playing', playing);
                if (playButton) {
                    playButton.textContent = playing ? '❚❚' : '▶';
                }
            }
            video.addEventListener('click', playToggle);
            video.addEventListener('play', syncState);
            video.addEventListener('pause', syncState);
            video.addEventListener('ended', syncState);
            video.addEventListener('timeupdate', function () {
                if (progress && video.duration) {
                    progress.style.width = (video.currentTime / video.duration * 100) + '%';
                }
            });
            if (mainButton) {
                mainButton.addEventListener('click', playToggle);
            }
            if (playButton) {
                playButton.addEventListener('click', playToggle);
            }
            if (muteButton) {
                muteButton.addEventListener('click', function () {
                    video.muted = !video.muted;
                    muteButton.textContent = video.muted ? '🔇' : '🔊';
                });
            }
            if (fullButton) {
                fullButton.addEventListener('click', function () {
                    if (document.fullscreenElement) {
                        document.exitFullscreen();
                    } else if (shell.requestFullscreen) {
                        shell.requestFullscreen();
                    }
                });
            }
        });
    }

    function setupShareAndFavorite() {
        selectAll('.favorite-button').forEach(function (button) {
            button.addEventListener('click', function () {
                button.classList.toggle('is-active');
                button.textContent = button.classList.contains('is-active') ? '已收藏' : '收藏';
            });
        });
        selectAll('.share-button').forEach(function (button) {
            button.addEventListener('click', function () {
                if (navigator.clipboard && window.location.href) {
                    navigator.clipboard.writeText(window.location.href).then(function () {
                        button.textContent = '已复制';
                        window.setTimeout(function () {
                            button.textContent = '分享';
                        }, 1400);
                    });
                }
            });
        });
    }

    setupMobileMenu();
    setupHero();
    setupCardFilter();
    setupSearchPage();
    setupPlayers();
    setupShareAndFavorite();
})();
