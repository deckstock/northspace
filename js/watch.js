/**
 * AETHER STREAM — STANDALONE WATCH ENGINE
 * Powers watch.html with standalone playback (Iframe Embed, Direct Stream, or Procedural Canvas),
 * recommendation algorithm, continue watching progress tracking, and DMCA takedown notice reporting.
 */

(function () {
  'use strict';

  const { videos, formatTime, formatViews, getVideoById, submitDMCA } = window.AetherCatalog;

  // Read URL parameters
  const params = new URLSearchParams(window.location.search);
  const videoId = params.get('id');
  const currentVideo = (videoId ? getVideoById(videoId) : (videos && videos[0] ? videos[0] : null)) || {
    id: videoId,
    title: "Video Record Not Found",
    category: "archive",
    tags: ["archive"],
    duration: 0,
    views: 0,
    daysAgo: 0,
    likes: 0,
    thumb: "",
    fallbackThumb: "",
    embedUrl: "",
    videoUrl: "",
    description: "This video has been removed, delisted via DMCA, or does not exist in the catalog."
  };

  // --- Theme Mode ---
  const html = document.documentElement;
  const savedTheme = localStorage.getItem('aether_theme_v2') || localStorage.getItem('aether_theme') || 'light';
  html.setAttribute('data-theme', savedTheme);

  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const nextTheme = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', nextTheme);
      localStorage.setItem('aether_theme_v2', nextTheme);
      localStorage.setItem('aether_theme', nextTheme);
    });
  }

  // --- Continue Watching Progress Tracking ---
  function recordProgress(currentSec, totalSec) {
    if (!currentVideo || !currentVideo.id) return;
    try {
      const raw = localStorage.getItem('aether_continue_watching');
      const cwMap = raw ? JSON.parse(raw) : {};
      const pct = Math.min(1, Math.max(0, currentSec / (totalSec || 1)));
      if (pct > 0.02) {
        cwMap[currentVideo.id] = {
          id: currentVideo.id,
          progress: pct,
          currentTime: Math.floor(currentSec),
          duration: Math.floor(totalSec || 180),
          updatedAt: Date.now()
        };
        localStorage.setItem('aether_continue_watching', JSON.stringify(cwMap));
      }
    } catch (e) {}
  }

  // --- DOM Elements ---
  const playerVideo = document.getElementById('playerVideo');
  const watchPlayerWrapper = document.getElementById('watchPlayerWrapper');
  const playerOverlay = document.getElementById('playerOverlay');
  const bigPlayBtn = document.getElementById('bigPlayBtn');
  const playerControlsBar = document.getElementById('playerControlsBar');
  const playerScrubTrack = document.getElementById('playerScrubTrack');
  const playerBufferBar = document.getElementById('playerBufferBar');
  const playerFillBar = document.getElementById('playerFillBar');
  const playerHead = document.getElementById('playerHead');
  const playerHoverTime = document.getElementById('playerHoverTime');
  const ctrlPlayBtn = document.getElementById('ctrlPlayBtn');
  const ctrlRewindBtn = document.getElementById('ctrlRewindBtn');
  const ctrlForwardBtn = document.getElementById('ctrlForwardBtn');
  const ctrlMuteBtn = document.getElementById('ctrlMuteBtn');
  const ctrlVolRange = document.getElementById('ctrlVolRange');
  const watchCurrentTime = document.getElementById('watchCurrentTime');
  const watchDuration = document.getElementById('watchDuration');
  const ctrlSpeedBtn = document.getElementById('ctrlSpeedBtn');
  const ctrlPipBtn = document.getElementById('ctrlPipBtn');
  const ctrlFullBtn = document.getElementById('ctrlFullBtn');

  // Metadata
  const watchTitle = document.getElementById('watchTitle');
  const watchViews = document.getElementById('watchViews');
  const watchDate = document.getElementById('watchDate');
  const watchCategory = document.getElementById('watchCategory');
  const watchDescription = document.getElementById('watchDescription');
  const watchTagsRow = document.getElementById('watchTagsRow');
  const likeCount = document.getElementById('likeCount');
  const watchLikeBtn = document.getElementById('watchLikeBtn');
  const watchSaveBtn = document.getElementById('watchSaveBtn');
  const watchDmcaBtn = document.getElementById('watchDmcaBtn');
  const recommendedGrid = document.getElementById('recommendedGrid');
  const recommendedFilterNote = document.getElementById('recommendedFilterNote');

  // Populate Video Metadata
  document.title = `${currentVideo.title} — NorthSpace`;
  if (watchTitle) watchTitle.textContent = currentVideo.title;
  if (watchViews) watchViews.textContent = formatViews(currentVideo.views);
  if (watchDate) watchDate.textContent = `${currentVideo.daysAgo} days ago`;
  if (watchCategory) watchCategory.textContent = currentVideo.category;
  if (watchDescription) watchDescription.textContent = currentVideo.description;
  if (likeCount) likeCount.textContent = (currentVideo.likes / 1000).toFixed(1) + 'k';
  if (watchDuration) watchDuration.textContent = formatTime(currentVideo.duration);

  // Tags
  if (watchTagsRow) {
    watchTagsRow.innerHTML = '';
    (currentVideo.tags || []).forEach(t => {
      const pill = document.createElement('span');
      pill.className = 'watch-tag-pill';
      pill.textContent = `#${t}`;
      pill.addEventListener('click', () => {
        window.location.href = `index.html?search=${encodeURIComponent(t)}`;
      });
      watchTagsRow.appendChild(pill);
    });
  }

  // --- Dynamic Playback Source Handler ---
  const hasEmbedUrl = !!(currentVideo.embedUrl && currentVideo.embedUrl.trim());
  const hasDirectVideo = !!(currentVideo.videoUrl && currentVideo.videoUrl.trim());

  if (hasEmbedUrl) {
    // Mode A: External Iframe Embed (YouTube, Vimeo, CDN Embed)
    if (playerVideo) playerVideo.style.display = 'none';
    if (playerOverlay) playerOverlay.style.display = 'none';
    if (playerControlsBar) playerControlsBar.style.display = 'none';

    const iframe = document.createElement('iframe');
    iframe.src = currentVideo.embedUrl;
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
    iframe.setAttribute('allowfullscreen', 'true');
    iframe.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;border:none;z-index:10;background:#000;';
    watchPlayerWrapper.appendChild(iframe);

    // Track simulated progress for external embeds
    recordProgress(30, currentVideo.duration || 180);

  } else if (hasDirectVideo) {
    // Mode B: Direct MP4 / Video Stream URL
    if (playerVideo) {
      playerVideo.src = currentVideo.videoUrl;
      playerVideo.load();
      setupDirectControls(playerVideo);
    }

  } else {
    // Mode C: Procedural Architectural Canvas Stream
    setupProceduralCanvas();
  }

  // --- Setup Procedural Canvas Generator ---
  function setupProceduralCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');

    const stream = canvas.captureStream ? canvas.captureStream(30) : null;
    if (stream && playerVideo) {
      playerVideo.srcObject = stream;
      playerVideo.play().catch(() => {});
    }

    let frame = 0;
    function renderPlayerLoop() {
      frame++;
      const time = frame / 30;

      // Dark background
      ctx.fillStyle = '#060606';
      ctx.fillRect(0, 0, 1280, 720);

      // Architectural grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < 1280; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 720); ctx.stroke();
      }
      for (let y = 0; y < 720; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1280, y); ctx.stroke();
      }

      // Concentric sweep
      ctx.save();
      ctx.translate(640, 360);
      ctx.rotate((time * 0.35) % (Math.PI * 2));
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 120 + Math.sin(time * 2.5) * 10, 0, Math.PI * 1.3);
      ctx.stroke();
      ctx.restore();

      // Title & Specs
      ctx.fillStyle = '#ffffff';
      ctx.font = '500 24px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(currentVideo.title, 640, 350);

      ctx.fillStyle = '#a1a1aa';
      ctx.font = '500 12px "Geist Mono", monospace';
      ctx.fillText(`FEED // ${(currentVideo.category || '').toUpperCase()}`, 640, 390);

      requestAnimationFrame(renderPlayerLoop);
    }
    renderPlayerLoop();

    setupSimulatedControls();
  }

  // --- Simulated Canvas Controls ---
  function setupSimulatedControls() {
    let isPlaying = false;
    let simulatedSeconds = 0;

    function togglePlay() {
      isPlaying = !isPlaying;
      const playIcon = ctrlPlayBtn ? ctrlPlayBtn.querySelector('.play-icon') : null;
      const pauseIcon = ctrlPlayBtn ? ctrlPlayBtn.querySelector('.pause-icon') : null;

      if (isPlaying) {
        if (playIcon) playIcon.style.display = 'none';
        if (pauseIcon) pauseIcon.style.display = 'block';
        if (playerOverlay) playerOverlay.classList.add('hidden');
      } else {
        if (playIcon) playIcon.style.display = 'block';
        if (pauseIcon) pauseIcon.style.display = 'none';
        if (playerOverlay) playerOverlay.classList.remove('hidden');
      }
    }

    if (bigPlayBtn) bigPlayBtn.addEventListener('click', togglePlay);
    if (playerOverlay) playerOverlay.addEventListener('click', togglePlay);
    if (ctrlPlayBtn) ctrlPlayBtn.addEventListener('click', togglePlay);

    setInterval(() => {
      if (isPlaying) {
        simulatedSeconds++;
        const dur = currentVideo.duration || 180;
        if (simulatedSeconds > dur) simulatedSeconds = 0;
        if (watchCurrentTime) watchCurrentTime.textContent = formatTime(simulatedSeconds);
        const pct = (simulatedSeconds / dur) * 100;
        if (playerFillBar) playerFillBar.style.width = `${pct}%`;
        if (playerBufferBar) playerBufferBar.style.width = `${Math.min(100, pct + 22)}%`;
        if (playerHead) playerHead.style.left = `${pct}%`;

        // Record continue watching progress
        recordProgress(simulatedSeconds, dur);
      }
    }, 1000);

    if (playerScrubTrack) {
      playerScrubTrack.addEventListener('click', (e) => {
        const rect = playerScrubTrack.getBoundingClientRect();
        const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const dur = currentVideo.duration || 180;
        simulatedSeconds = Math.floor(pos * dur);
        if (watchCurrentTime) watchCurrentTime.textContent = formatTime(simulatedSeconds);
        if (playerFillBar) playerFillBar.style.width = `${pos * 100}%`;
        recordProgress(simulatedSeconds, dur);
      });

      playerScrubTrack.addEventListener('mousemove', (e) => {
        const rect = playerScrubTrack.getBoundingClientRect();
        const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const dur = currentVideo.duration || 180;
        if (playerHoverTime) {
          playerHoverTime.textContent = formatTime(pos * dur);
          playerHoverTime.style.left = `${pos * 100}%`;
        }
      });
    }

    if (ctrlRewindBtn) {
      ctrlRewindBtn.addEventListener('click', () => {
        simulatedSeconds = Math.max(0, simulatedSeconds - 10);
        if (watchCurrentTime) watchCurrentTime.textContent = formatTime(simulatedSeconds);
      });
    }
    if (ctrlForwardBtn) {
      ctrlForwardBtn.addEventListener('click', () => {
        const dur = currentVideo.duration || 180;
        simulatedSeconds = Math.min(dur, simulatedSeconds + 10);
        if (watchCurrentTime) watchCurrentTime.textContent = formatTime(simulatedSeconds);
      });
    }

    wireCommonControls();
  }

  // --- Direct HTML5 Video Controls ---
  function setupDirectControls(videoEl) {
    function togglePlay() {
      if (videoEl.paused) {
        videoEl.play();
        if (playerOverlay) playerOverlay.classList.add('hidden');
      } else {
        videoEl.pause();
        if (playerOverlay) playerOverlay.classList.remove('hidden');
      }
    }

    if (bigPlayBtn) bigPlayBtn.addEventListener('click', togglePlay);
    if (playerOverlay) playerOverlay.addEventListener('click', togglePlay);
    if (ctrlPlayBtn) ctrlPlayBtn.addEventListener('click', togglePlay);

    videoEl.addEventListener('play', () => {
      const playIcon = ctrlPlayBtn ? ctrlPlayBtn.querySelector('.play-icon') : null;
      const pauseIcon = ctrlPlayBtn ? ctrlPlayBtn.querySelector('.pause-icon') : null;
      if (playIcon) playIcon.style.display = 'none';
      if (pauseIcon) pauseIcon.style.display = 'block';
    });

    videoEl.addEventListener('pause', () => {
      const playIcon = ctrlPlayBtn ? ctrlPlayBtn.querySelector('.play-icon') : null;
      const pauseIcon = ctrlPlayBtn ? ctrlPlayBtn.querySelector('.pause-icon') : null;
      if (playIcon) playIcon.style.display = 'block';
      if (pauseIcon) pauseIcon.style.display = 'none';
    });

    videoEl.addEventListener('timeupdate', () => {
      const curr = videoEl.currentTime;
      const dur = videoEl.duration || currentVideo.duration || 180;
      if (watchCurrentTime) watchCurrentTime.textContent = formatTime(curr);
      const pct = (curr / dur) * 100;
      if (playerFillBar) playerFillBar.style.width = `${pct}%`;
      if (playerHead) playerHead.style.left = `${pct}%`;

      // Record continue watching progress
      recordProgress(curr, dur);
    });

    if (playerScrubTrack) {
      playerScrubTrack.addEventListener('click', (e) => {
        const rect = playerScrubTrack.getBoundingClientRect();
        const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const dur = videoEl.duration || currentVideo.duration || 180;
        videoEl.currentTime = pos * dur;
      });
    }

    if (ctrlRewindBtn) {
      ctrlRewindBtn.addEventListener('click', () => {
        videoEl.currentTime = Math.max(0, videoEl.currentTime - 10);
      });
    }
    if (ctrlForwardBtn) {
      ctrlForwardBtn.addEventListener('click', () => {
        const dur = videoEl.duration || currentVideo.duration || 180;
        videoEl.currentTime = Math.min(dur, videoEl.currentTime + 10);
      });
    }

    wireCommonControls();
  }

  function wireCommonControls() {
    if (ctrlVolRange && playerVideo) {
      ctrlVolRange.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value) / 100;
        playerVideo.volume = val;
      });
    }

    if (ctrlMuteBtn && playerVideo && ctrlVolRange) {
      ctrlMuteBtn.addEventListener('click', () => {
        playerVideo.muted = !playerVideo.muted;
        ctrlVolRange.value = playerVideo.muted ? 0 : 80;
      });
    }

    const speeds = ['0.75x', '1x', '1.25x', '1.5x', '2x'];
    let speedIdx = 1;
    if (ctrlSpeedBtn && playerVideo) {
      ctrlSpeedBtn.addEventListener('click', () => {
        speedIdx = (speedIdx + 1) % speeds.length;
        ctrlSpeedBtn.textContent = speeds[speedIdx];
        playerVideo.playbackRate = parseFloat(speeds[speedIdx]);
      });
    }

    if (ctrlPipBtn && playerVideo) {
      ctrlPipBtn.addEventListener('click', async () => {
        try {
          if (document.pictureInPictureElement) {
            await document.exitPictureInPicture();
          } else if (playerVideo.requestPictureInPicture) {
            await playerVideo.requestPictureInPicture();
          }
        } catch (e) {}
      });
    }

    if (ctrlFullBtn && watchPlayerWrapper) {
      ctrlFullBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          watchPlayerWrapper.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }
  }

  // --- DMCA Takedown Modal Handling ---
  const dmcaModal = document.getElementById('dmcaModal');
  const closeDmcaModalBtn = document.getElementById('closeDmcaModalBtn');
  const cancelDmcaModalBtn = document.getElementById('cancelDmcaModalBtn');
  const dmcaForm = document.getElementById('dmcaForm');
  const dmcaTargetTitle = document.getElementById('dmcaTargetTitle');
  const dmcaClaimant = document.getElementById('dmcaClaimant');
  const dmcaEmail = document.getElementById('dmcaEmail');
  const dmcaReason = document.getElementById('dmcaReason');

  function openDmcaModal() {
    if (dmcaTargetTitle) dmcaTargetTitle.value = currentVideo.title;
    if (dmcaModal) dmcaModal.style.display = 'flex';
  }

  function closeDmcaModal() {
    if (dmcaModal) dmcaModal.style.display = 'none';
  }

  if (watchDmcaBtn) watchDmcaBtn.addEventListener('click', openDmcaModal);
  if (closeDmcaModalBtn) closeDmcaModalBtn.addEventListener('click', closeDmcaModal);
  if (cancelDmcaModalBtn) cancelDmcaModalBtn.addEventListener('click', closeDmcaModal);

  if (dmcaModal) {
    dmcaModal.addEventListener('click', (e) => {
      if (e.target === dmcaModal) closeDmcaModal();
    });
  }

  if (dmcaForm) {
    dmcaForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const claimant = dmcaClaimant.value.trim();
      const email = dmcaEmail.value.trim();
      const reason = dmcaReason.value.trim();

      const req = window.AetherCatalog.submitDMCA(currentVideo.id, claimant, email, reason);
      closeDmcaModal();
      dmcaForm.reset();

      alert(`Your DMCA takedown notice has been logged into the CRM Takedown Queue (Notice ID: ${req.id}). Platform administrators can review and delist the content.`);
    });
  }

  // --- Populate Up Next Queue (Beside Player) ---
  const watchQueueList = document.getElementById('watchQueueList');
  const queueCount = document.getElementById('queueCount');

  const allVids = window.AetherCatalog.videos;
  let queueVids = allVids.filter(v => v.id !== currentVideo.id && v.category === currentVideo.category);
  if (queueVids.length < 12) {
    queueVids = queueVids.concat(allVids.filter(v => v.id !== currentVideo.id && v.category !== currentVideo.category));
  }

  if (queueCount) {
    queueCount.textContent = `${queueVids.length} Videos`;
  }

  if (watchQueueList) {
    watchQueueList.innerHTML = '';
    if (queueVids.length === 0) {
      watchQueueList.innerHTML = '<div style="padding:24px 16px;text-align:center;font-size:12px;color:var(--text-muted);font-family:var(--font-mono);">No queued videos in catalog.</div>';
    } else {
      queueVids.forEach((vid, idx) => {
      const qItem = document.createElement('div');
      qItem.className = 'queue-item' + (idx === 0 ? ' next-up' : '');
      qItem.innerHTML = `
        <div class=\"queue-item-thumb\">
          <img src=\"${vid.thumb || vid.fallbackThumb}\" alt=\"\" loading=\"lazy\" onerror=\"this.src='${vid.fallbackThumb || ''}'\">
          <span class=\"queue-item-dur\">${formatTime(vid.duration)}</span>
        </div>
        <div class=\"queue-item-info\">
          <div class=\"queue-item-title\" title=\"${vid.title}\">${vid.title}</div>
          <div class=\"queue-item-sub\">
            <span style=\"text-transform:uppercase;\">${vid.category}</span>
            <span>&bull;</span>
            <span>${formatViews(vid.views)}</span>
          </div>
        </div>
      `;
      qItem.addEventListener('click', () => {
        window.location.href = `watch.html?id=${vid.id}`;
      });
      watchQueueList.appendChild(qItem);
    });
    }
  }

  // --- Populate Scroll-Down More Videos Section ---
  const moreFilterChips = document.getElementById('moreFilterChips');
  let currentMoreFilter = 'all';

  function renderMoreVideos() {
    if (!recommendedGrid) return;
    recommendedGrid.innerHTML = '';

    const filtered = allVids.filter(v => {
      if (v.id === currentVideo.id) return false;
      if (currentMoreFilter === 'all') return true;
      return v.category === currentMoreFilter;
    });

    if (filtered.length === 0) {
      recommendedGrid.innerHTML = '<div style="grid-column:1/-1;padding:32px 16px;text-align:center;font-size:12.5px;color:var(--text-muted);font-family:var(--font-mono);">No additional video assets in this shelf.</div>';
      return;
    }

    filtered.slice(0, 16).forEach(rec => {
      const card = document.createElement('div');
      card.className = 'video-thumb-card';
      card.innerHTML = `
        <div class=\"card-media-box\">
          <img src=\"${rec.thumb || rec.fallbackThumb}\" alt=\"${rec.title}\" class=\"card-canvas-thumb\" loading=\"lazy\" onerror=\"this.src='${rec.fallbackThumb || ''}'\">
          <span class=\"card-duration-badge\">${formatTime(rec.duration)}</span>
        </div>
        <div class=\"card-content\">
          <h3 class=\"card-title-text\" title=\"${rec.title}\">${rec.title}</h3>
          <div class=\"card-meta-line\">
            <div class=\"card-views-time\">
              <span>${formatViews(rec.views)}</span>
              <span>&bull;</span>
              <span>${rec.daysAgo}d ago</span>
            </div>
            <span class=\"card-cat-pill\">${rec.category}</span>
          </div>
        </div>
      `;
      card.addEventListener('click', () => {
        window.location.href = `watch.html?id=${rec.id}`;
      });
      recommendedGrid.appendChild(card);
    });
  }

  if (moreFilterChips) {
    moreFilterChips.querySelectorAll('.more-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        moreFilterChips.querySelectorAll('.more-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        currentMoreFilter = chip.getAttribute('data-cat');
        renderMoreVideos();
      });
    });
  }

  renderMoreVideos();

  // --- Interactive Share Destinations Modal ---
  const shareModal = document.getElementById('shareModal');
  const watchShareBtn = document.getElementById('watchShareBtn');
  const closeShareModalBtn = document.getElementById('closeShareModalBtn');
  const shareUrlInput = document.getElementById('shareUrlInput');
  const copyShareUrlBtn = document.getElementById('copyShareUrlBtn');
  const copySuccessFeedback = document.getElementById('copySuccessFeedback');

  const shareDestWhatsapp = document.getElementById('shareDestWhatsapp');
  const shareDestX = document.getElementById('shareDestX');
  const shareDestTelegram = document.getElementById('shareDestTelegram');
  const shareDestReddit = document.getElementById('shareDestReddit');
  const shareDestEmail = document.getElementById('shareDestEmail');
  const shareDestNative = document.getElementById('shareDestNative');

  function openShareModal() {
    if (!shareModal) return;
    const currentUrl = window.location.href;
    const shareTitle = currentVideo.title || 'NorthSpace';

    if (shareUrlInput) shareUrlInput.value = currentUrl;
    if (copySuccessFeedback) copySuccessFeedback.style.display = 'none';

    // Populate destination URLs
    if (shareDestWhatsapp) {
      shareDestWhatsapp.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareTitle + ' ' + currentUrl)}`;
    }
    if (shareDestX) {
      shareDestX.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(currentUrl)}`;
    }
    if (shareDestTelegram) {
      shareDestTelegram.href = `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(shareTitle)}`;
    }
    if (shareDestReddit) {
      shareDestReddit.href = `https://reddit.com/submit?url=${encodeURIComponent(currentUrl)}&title=${encodeURIComponent(shareTitle)}`;
    }
    if (shareDestEmail) {
      shareDestEmail.href = `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent('Check out this video on NorthSpace: ' + currentUrl)}`;
    }

    if (shareDestNative) {
      if (navigator.share) {
        shareDestNative.style.display = 'inline-flex';
        shareDestNative.onclick = () => {
          navigator.share({ title: shareTitle, url: currentUrl }).catch(() => {});
        };
      } else {
        shareDestNative.style.display = 'none';
      }
    }

    shareModal.style.display = 'flex';
  }

  function closeShareModal() {
    if (shareModal) shareModal.style.display = 'none';
  }

  if (watchShareBtn) watchShareBtn.addEventListener('click', openShareModal);
  if (closeShareModalBtn) closeShareModalBtn.addEventListener('click', closeShareModal);
  if (shareModal) {
    shareModal.addEventListener('click', (e) => {
      if (e.target === shareModal) closeShareModal();
    });
  }

  if (copyShareUrlBtn && shareUrlInput) {
    copyShareUrlBtn.addEventListener('click', () => {
      shareUrlInput.select();
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareUrlInput.value);
      } else {
        document.execCommand('copy');
      }
      if (copySuccessFeedback) {
        copySuccessFeedback.style.display = 'block';
        setTimeout(() => { copySuccessFeedback.style.display = 'none'; }, 3000);
      }
    });
  }

  // --- Clean User Menu & Professional Sliding Switch ---
  const userMenuWrapper = document.getElementById('userMenuWrapper');
  const userMenuToggleBtn = document.getElementById('userMenuToggleBtn');
  const userDropdownMenu = document.getElementById('userDropdownMenu');

  const menuItemAccount = document.getElementById('menuItemAccount');
  const menuItemTheme = document.getElementById('menuItemTheme');
  const themeSwitchTrack = document.getElementById('themeSwitchTrack');

  const devToastBanner = document.getElementById('devToastBanner');
  const devToastText = document.getElementById('devToastText');
  const devToastIcon = document.getElementById('devToastIcon');

  let toastTimer = null;
  function showDevToast(msg, icon = 'ℹ️') {
    if (!devToastBanner || !devToastText) return;
    if (devToastIcon) devToastIcon.textContent = icon;
    devToastText.textContent = msg;
    devToastBanner.style.display = 'block';

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      devToastBanner.style.display = 'none';
    }, 3500);
  }

  function toggleUserDropdown() {
    if (!userDropdownMenu) return;
    const isVisible = userDropdownMenu.style.display === 'block';
    userDropdownMenu.style.display = isVisible ? 'none' : 'block';
    if (userMenuToggleBtn) {
      userMenuToggleBtn.setAttribute('aria-expanded', !isVisible);
    }
  }

  function closeUserDropdown() {
    if (userDropdownMenu) userDropdownMenu.style.display = 'none';
    if (userMenuToggleBtn) userMenuToggleBtn.setAttribute('aria-expanded', 'false');
  }

  if (userMenuToggleBtn) {
    userMenuToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleUserDropdown();
    });
  }

  document.addEventListener('click', (e) => {
    if (userMenuWrapper && !userMenuWrapper.contains(e.target)) {
      closeUserDropdown();
    }
  });

  // Theme Sliding Switch Sync
  function updateThemeSwitch() {
    if (!themeSwitchTrack) return;
    const isDark = html.getAttribute('data-theme') === 'dark';
    themeSwitchTrack.classList.toggle('active', isDark);
  }
  updateThemeSwitch();

  if (menuItemTheme) {
    menuItemTheme.addEventListener('click', (e) => {
      e.stopPropagation();
      const nextTheme = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', nextTheme);
      localStorage.setItem('aether_theme_v2', nextTheme);
      localStorage.setItem('aether_theme', nextTheme);
      updateThemeSwitch();
    });
  }

  if (menuItemAccount) {
    menuItemAccount.addEventListener('click', () => {
      closeUserDropdown();
      showDevToast('Account profile system is currently under active development.', '🛠️');
    });
  }

})();
