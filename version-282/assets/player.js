(function () {
  var video = document.querySelector('.js-movie-video');
  var overlay = document.querySelector('.player-overlay');
  var startButton = document.querySelector('.player-start');
  var attached = false;
  var hlsInstance = null;

  if (!video) {
    return;
  }

  function attachStream() {
    var stream = video.getAttribute('data-stream');

    if (attached || !stream) {
      return;
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = stream;
      attached = true;
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      hlsInstance = new window.Hls({ enableWorker: true });
      hlsInstance.loadSource(stream);
      hlsInstance.attachMedia(video);
      attached = true;
      return;
    }

    video.src = stream;
    attached = true;
  }

  function hideOverlay() {
    if (overlay) {
      overlay.classList.add('is-hidden');
    }
  }

  function playVideo() {
    attachStream();
    hideOverlay();
    var playPromise = video.play();
    if (playPromise && playPromise.catch) {
      playPromise.catch(function () {});
    }
  }

  if (startButton) {
    startButton.addEventListener('click', playVideo);
  }

  if (overlay) {
    overlay.addEventListener('click', playVideo);
  }

  video.addEventListener('click', function () {
    if (video.paused) {
      playVideo();
    }
  });

  video.addEventListener('play', hideOverlay);

  window.addEventListener('pagehide', function () {
    if (hlsInstance) {
      hlsInstance.destroy();
      hlsInstance = null;
    }
  });
})();
