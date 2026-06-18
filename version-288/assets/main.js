(function () {
    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    function normalize(value) {
        return String(value || "").trim().toLowerCase();
    }

    ready(function () {
        var menuButton = document.querySelector("[data-menu-button]");
        var siteNav = document.querySelector("[data-site-nav]");
        var navSearch = document.querySelector(".nav-search");

        if (menuButton && siteNav) {
            menuButton.addEventListener("click", function () {
                siteNav.classList.toggle("is-open");
                if (navSearch) {
                    navSearch.classList.toggle("is-open");
                }
            });
        }

        document.querySelectorAll("[data-search-form]").forEach(function (form) {
            form.addEventListener("submit", function (event) {
                var input = form.querySelector("input[name='q']");
                if (!input) {
                    return;
                }
                var value = input.value.trim();
                if (!value) {
                    event.preventDefault();
                    window.location.href = form.getAttribute("action") || "search.html";
                }
            });
        });

        var hero = document.querySelector("[data-hero]");
        if (hero) {
            var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
            var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
            var index = 0;

            function showSlide(nextIndex) {
                if (!slides.length) {
                    return;
                }
                index = (nextIndex + slides.length) % slides.length;
                slides.forEach(function (slide, pos) {
                    slide.classList.toggle("is-active", pos === index);
                });
                dots.forEach(function (dot, pos) {
                    dot.classList.toggle("is-active", pos === index);
                });
            }

            dots.forEach(function (dot, pos) {
                dot.addEventListener("click", function () {
                    showSlide(pos);
                });
            });

            if (slides.length > 1) {
                window.setInterval(function () {
                    showSlide(index + 1);
                }, 5200);
            }
        }

        var urlParams = new URLSearchParams(window.location.search);
        var queryValue = urlParams.get("q") || "";
        var filterInputs = Array.prototype.slice.call(document.querySelectorAll("[data-filter-input]"));
        var filterSelects = Array.prototype.slice.call(document.querySelectorAll("[data-filter-select]"));
        var cards = Array.prototype.slice.call(document.querySelectorAll("[data-card]"));

        if (queryValue && filterInputs.length) {
            filterInputs[0].value = queryValue;
        }

        function applyFilter() {
            var words = filterInputs.map(function (input) {
                return normalize(input.value);
            }).filter(Boolean);
            var selectValues = filterSelects.map(function (select) {
                return normalize(select.value);
            }).filter(Boolean);
            var terms = words.concat(selectValues);

            cards.forEach(function (card) {
                var haystack = normalize(card.getAttribute("data-search") || card.textContent);
                var matched = terms.every(function (term) {
                    return haystack.indexOf(term) !== -1;
                });
                card.classList.toggle("is-hidden", !matched);
            });
        }

        filterInputs.forEach(function (input) {
            input.addEventListener("input", applyFilter);
        });
        filterSelects.forEach(function (select) {
            select.addEventListener("change", applyFilter);
        });

        if (queryValue || filterInputs.length || filterSelects.length) {
            applyFilter();
        }
    });
})();
