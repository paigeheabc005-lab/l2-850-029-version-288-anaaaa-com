(function () {
    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    ready(function () {
        document.querySelectorAll("[data-player]").forEach(function (shell) {
            var video = shell.querySelector("video");
            var shade = shell.querySelector("[data-player-shade]");
            var button = shell.querySelector("[data-play-button]");
            var started = false;
            var hls = null;

            if (!video) {
                return;
            }

            function begin() {
                var stream = video.getAttribute("data-stream");
                if (!stream) {
                    return;
                }

                if (!started) {
                    started = true;
                    if (shade) {
                        shade.classList.add("is-hidden");
                    }

                    if (video.canPlayType("application/vnd.apple.mpegurl")) {
                        video.src = stream;
                    } else if (window.Hls && window.Hls.isSupported()) {
                        hls = new window.Hls({
                            enableWorker: true,
                            lowLatencyMode: true
                        });
                        hls.loadSource(stream);
                        hls.attachMedia(video);

                        if (window.Hls.Events && window.Hls.ErrorTypes) {
                            hls.on(window.Hls.Events.ERROR, function (event, data) {
                                if (!data || !data.fatal) {
                                    return;
                                }
                                if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                                    hls.startLoad();
                                } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                                    hls.recoverMediaError();
                                } else {
                                    hls.destroy();
                                }
                            });
                        }
                    } else {
                        video.src = stream;
                    }
                }

                var playPromise = video.play();
                if (playPromise && typeof playPromise.catch === "function") {
                    playPromise.catch(function () {});
                }
            }

            if (button) {
                button.addEventListener("click", begin);
            }

            if (shade && shade !== button) {
                shade.addEventListener("click", begin);
            }

            video.addEventListener("click", function () {
                if (!started || video.paused) {
                    begin();
                }
            });
        });
    });
})();
