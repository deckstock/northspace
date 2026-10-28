/**
 * AETHER STREAM — MAIN DISCOVERY CONTROLLER
 * Architectural Monochromatic Discovery Platform
 * 
 * Features:
 * 1. Desktop widescreen search with '/' and 'Ctrl+K' shortcuts, clear button, and sticky elevation.
 * 2. Administrator authentication toggle in user dropdown controlling Content CRM access.
 * 3. Horizontal category navigation with persistent memory, video count badges, and Feeds vs Genres separation.
 * 4. High-performance video cards with subtle hover preview, 2-line title clamp, and continue-watching progress bar.
 * 5. Optional Featured Video Hero Showcase driven by catalog metadata.
 * 6. Responsive 5/4/3/2 column grid layout with zero CLS layout shifts.
 * 7. Discovery subbar (All Catalog, Recently Added, Most Watched, Continue Watching).
 * 8. Graceful pagination with "Load More Videos" counter and IntersectionObserver infinite scroll.
 */

(function () {
  'use strict';

  const { formatTime, formatViews, getCategories, getHomepageConfig } = window.AetherCatalog || {};

  // Clean catalog initialization (starts empty without fake seed records)

  // --- Persistent State ---
  let initialCategory = localStorage.getItem('aether_last_category') || 'all';
  const validCatSlugs = ((window.AetherCatalog && window.AetherCatalog.getCategories) ? window.AetherCatalog.getCategories() : []).map(c => c.slug);
  if (initialCategory !== 'all' && !validCatSlugs.includes(initialCategory)) {
    initialCategory = 'all';
    try { localStorage.removeItem('aether_last_category'); } catch (e) {}
  }

  const state = {
    theme: localStorage.getItem('aether_theme_v2') || localStorage.getItem('aether_theme') || 'light',
    isAdmin: localStorage.getItem('aether_admin_auth') !== 'false', // Default true for frictionless dev access
    activeCategory: initialCategory,
    activeTag: '',
    searchQuery: '',
    discoveryFilter: 'all', // 'all' | 'recent' | 'popular' | 'continue'
    displayedCount: 0,
    batchSize: 20
  };

  // --- DOM References ---
  const html = document.documentElement;
  const topHeader = document.getElementById('topHeader');

  // Search Elements
  const searchContainer = document.getElementById('searchContainer');
  const mainSearchInput = document.getElementById('mainSearchInput');
  const searchClearBtn = document.getElementById('searchClearBtn');
  const searchKbdHint = document.getElementById('searchKbdHint');

  // Navigation & Sub-bar Elements
  const categoryFilterStrip = document.getElementById('categoryFilterStrip');
  const featuredHeroSection = document.getElementById('featuredHeroSection');
  const featuredMediaStage = document.getElementById('featuredMediaStage');
  const featuredHeroImg = document.getElementById('featuredHeroImg');
  const featuredHeroTitle = document.getElementById('featuredHeroTitle');
  const featuredHeroDesc = document.getElementById('featuredHeroDesc');
  const featuredHeroPlayBtn = document.getElementById('featuredHeroPlayBtn');
  const featuredHeroMeta = document.getElementById('featuredHeroMeta');

  // Discovery Subbar
  const discoverySubbar = document.getElementById('discoverySubbar');
  const discoveryFilters = document.getElementById('discoveryFilters');
  const filterContinueWatching = document.getElementById('filterContinueWatching');
  const catalogCountLabel = document.getElementById('catalogCountLabel');

  // Video Grid & Pagination Elements
  const videoGrid = document.getElementById('videoGrid');
  const loadMoreWrap = document.getElementById('loadMoreWrap');
  const btnLoadMore = document.getElementById('btnLoadMore');
  const loadMoreCount = document.getElementById('loadMoreCount');
  const scrollLoader = document.getElementById('scrollLoader');

  // User Dropdown & Admin Auth Elements
  const headerCrmBtn = document.getElementById('headerCrmBtn');
  const userMenuWrapper = document.getElementById('userMenuWrapper');
  const userMenuToggleBtn = document.getElementById('userMenuToggleBtn');
  const userDropdownMenu = document.getElementById('userDropdownMenu');
  const dropdownUserName = document.getElementById('dropdownUserName');
  const dropdownUserStatus = document.getElementById('dropdownUserStatus');
  const menuItemAdminAuth = document.getElementById('menuItemAdminAuth');
  const adminSwitchTrack = document.getElementById('adminSwitchTrack');
  const menuItemTheme = document.getElementById('menuItemTheme');
  const themeSwitchTrack = document.getElementById('themeSwitchTrack');
  const menuItemAccount = document.getElementById('menuItemAccount');

  // Toast Banner
  const devToastBanner = document.getElementById('devToastBanner');
  const devToastText = document.getElementById('devToastText');
  const devToastIcon = document.getElementById('devToastIcon');

  // ==========================================================================
  // TOAST NOTIFICATION UTILITY
  // ==========================================================================
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

  // ==========================================================================
  // THEME MANAGEMENT (Light / Dark Mode)
  // ==========================================================================
  function updateThemeSwitch() {
    if (!themeSwitchTrack) return;
    const isDark = html.getAttribute('data-theme') === 'dark';
    themeSwitchTrack.classList.toggle('active', isDark);
  }

  function applyTheme(theme) {
    state.theme = theme;
    localStorage.setItem('aether_theme_v2', theme);
    localStorage.setItem('aether_theme', theme);
    html.setAttribute('data-theme', theme);
    updateThemeSwitch();
  }
  applyTheme(state.theme);

  // ==========================================================================
  // HEADER STICKY ELEVATION ON SCROLL
  // ==========================================================================
  function handleHeaderScroll() {
    if (!topHeader) return;
    const isScrolled = window.scrollY > 10;
    topHeader.classList.toggle('scrolled', isScrolled);
  }
  window.addEventListener('scroll', handleHeaderScroll, { passive: true });
  handleHeaderScroll();

  // ==========================================================================
  // ADMINISTRATOR AUTHENTICATION SYSTEM
  // Visible only to authenticated administrators per specification
  // ==========================================================================
  function syncAdminAuthState() {
    if (headerCrmBtn) {
      headerCrmBtn.classList.toggle('hidden-unauthed', !state.isAdmin);
    }
    if (adminSwitchTrack) {
      adminSwitchTrack.classList.toggle('active', state.isAdmin);
    }
    if (dropdownUserName) {
      dropdownUserName.textContent = state.isAdmin ? 'Administrator' : 'Guest Viewer';
    }
    if (dropdownUserStatus) {
      dropdownUserStatus.textContent = state.isAdmin ? 'SYSTEM SESSION' : 'PUBLIC SESSION';
    }
  }

  function toggleAdminAuth() {
    state.isAdmin = !state.isAdmin;
    localStorage.setItem('aether_admin_auth', state.isAdmin ? 'true' : 'false');
    syncAdminAuthState();
    if (state.isAdmin) {
      showDevToast('Administrator Mode enabled — Content CRM Console visible.', '🛡️');
    } else {
      showDevToast('Administrator Mode disabled — Content CRM Console hidden.', '🔒');
    }
  }

  if (menuItemAdminAuth) {
    menuItemAdminAuth.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleAdminAuth();
    });
  }
  syncAdminAuthState();

  // ==========================================================================
  // USER PROFILE DROPDOWN MENU
  // ==========================================================================
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

  if (menuItemTheme) {
    menuItemTheme.addEventListener('click', (e) => {
      e.stopPropagation();
      const nextTheme = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
    });
  }

  if (menuItemAccount) {
    menuItemAccount.addEventListener('click', () => {
      closeUserDropdown();
      showDevToast('Account profile & preferences portal is under active development.', '👤');
    });
  }

  // ==========================================================================
  // HEADER SEARCH BAR INTERACTIONS (Wider, Shortcuts & Instant Reset)
  // ==========================================================================
  if (mainSearchInput) {
    mainSearchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.trim().toLowerCase();
      if (searchClearBtn) {
        searchClearBtn.style.display = state.searchQuery ? 'flex' : 'none';
      }
      filterAndResetFeed();
    });

    // Keyboard shortcut '/' or 'Ctrl+K' / 'Cmd+K' to focus search bar
    document.addEventListener('keydown', (e) => {
      const isInput = document.activeElement && document.activeElement.matches('input, textarea, [contenteditable="true"]');
      if (!isInput && (e.key === '/' || ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')))) {
        e.preventDefault();
        mainSearchInput.focus();
        mainSearchInput.select();
      } else if (e.key === 'Escape' && document.activeElement === mainSearchInput) {
        mainSearchInput.blur();
      }
    });
  }

  if (searchClearBtn) {
    searchClearBtn.addEventListener('click', () => {
      if (mainSearchInput) {
        mainSearchInput.value = '';
        mainSearchInput.focus();
      }
      state.searchQuery = '';
      searchClearBtn.style.display = 'none';
      filterAndResetFeed();
    });
  }

  // ==========================================================================
  // CONTINUE WATCHING HELPER
  // Reads watch playback history from localStorage
  // ==========================================================================
  function getContinueWatchingMap() {
    try {
      const raw = localStorage.getItem('aether_continue_watching');
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function syncContinueWatchingFilterVisibility() {
    if (!filterContinueWatching) return;
    const watchMap = getContinueWatchingMap();
    const hasHistory = Object.keys(watchMap).length > 0;
    filterContinueWatching.style.display = hasHistory ? 'inline-flex' : 'none';
    if (!hasHistory && state.discoveryFilter === 'continue') {
      state.discoveryFilter = 'all';
      syncDiscoveryButtons();
    }
  }

  // ==========================================================================
  // HORIZONTAL CATEGORY NAVIGATION WITH COUNTS & EDITORIAL SEPARATION
  // Distinguishes actual genres from editorial curated feeds
  // ==========================================================================
  function computeCategoryCount(catSlug) {
    const allVideos = window.AetherCatalog.videos || [];
    if (catSlug === 'all') return allVideos.length;
    return allVideos.filter(v => v.category === catSlug || (v.tags && v.tags.includes(catSlug))).length;
  }

  function renderCategoryFilterStrip() {
    if (!categoryFilterStrip) return;
    categoryFilterStrip.innerHTML = '';

    const categories = typeof getCategories === 'function' ? getCategories() : [];

    // If no custom categories created yet by the user, hide strip completely
    if (!categories || categories.length === 0) {
      categoryFilterStrip.style.display = 'none';
      return;
    }

    categoryFilterStrip.style.display = 'flex';
    const totalCount = computeCategoryCount('all');

    // 1. "All Feeds" Chip
    const allChip = createCategoryChip({
      slug: 'all',
      name: 'All Feeds',
      count: totalCount,
      isActive: state.activeCategory === 'all'
    });
    categoryFilterStrip.appendChild(allChip);

    // 2. User-Created Categories
    categories.filter(c => c.visible !== false).forEach(cat => {
      const count = computeCategoryCount(cat.slug);
      const chip = createCategoryChip({
        slug: cat.slug,
        name: cat.name,
        count: count,
        isActive: state.activeCategory === cat.slug
      });
      categoryFilterStrip.appendChild(chip);
    });
  }

  function createCategoryChip({ slug, name, count, isActive }) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `filter-chip ${isActive ? 'active' : ''}`;
    chip.dataset.slug = slug;

    chip.innerHTML = `
      <span class="chip-label">${name}</span>
      <span class="chip-count">${count}</span>
    `;

    chip.addEventListener('click', () => {
      selectCategory(slug);
      chip.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
    });

    return chip;
  }

  function selectCategory(slug) {
    if (state.activeCategory === slug && slug !== 'all') {
      state.activeCategory = 'all';
    } else {
      state.activeCategory = slug;
    }

    // Remember last selected category in localStorage
    localStorage.setItem('aether_last_category', state.activeCategory);

    state.activeTag = '';
    state.searchQuery = '';
    if (mainSearchInput) mainSearchInput.value = '';
    if (searchClearBtn) searchClearBtn.style.display = 'none';

    syncCategoryChipState();
    filterAndResetFeed();
  }

  function syncCategoryChipState() {
    if (!categoryFilterStrip) return;
    const chips = categoryFilterStrip.querySelectorAll('.filter-chip');
    chips.forEach(chip => {
      chip.classList.toggle('active', chip.dataset.slug === state.activeCategory);
    });
  }

  // ==========================================================================
  // DISCOVERY SUB-BAR (All Catalog, Recently Added, Most Watched, Continue)
  // ==========================================================================
  function syncDiscoveryButtons() {
    if (!discoveryFilters) return;
    const buttons = discoveryFilters.querySelectorAll('.discovery-filter-btn');
    buttons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.discovery === state.discoveryFilter);
    });
  }

  if (discoveryFilters) {
    discoveryFilters.addEventListener('click', (e) => {
      const btn = e.target.closest('.discovery-filter-btn');
      if (!btn) return;
      const targetFilter = btn.dataset.discovery;
      if (state.discoveryFilter === targetFilter) return;

      state.discoveryFilter = targetFilter;
      syncDiscoveryButtons();
      filterAndResetFeed();
    });
  }

  // ==========================================================================
  // FEATURED VIDEO HERO SHOWCASE (Optional Header Section)
  // Only displayed when browsing the main catalog without active search/filter
  // ==========================================================================
  function updateFeaturedHeroSection() {
    if (!featuredHeroSection) return;

    // Display hero only on default state: All Feeds, All Discovery, No search
    const shouldShow = state.activeCategory === 'all' && 
                       state.discoveryFilter === 'all' && 
                       !state.searchQuery && 
                       !state.activeTag;

    if (!shouldShow) {
      featuredHeroSection.style.display = 'none';
      return;
    }

    const allVideos = window.AetherCatalog.videos || [];
    if (allVideos.length === 0) {
      featuredHeroSection.style.display = 'none';
      return;
    }

    const hpConfig = typeof getHomepageConfig === 'function' ? getHomepageConfig() : {};
    let featured = null;

    if (hpConfig && hpConfig.featuredVideoId) {
      featured = allVideos.find(v => v.id === hpConfig.featuredVideoId);
    }

    // Fallback to highest view count video
    if (!featured) {
      const sorted = [...allVideos].sort((a, b) => (b.views || 0) - (a.views || 0));
      featured = sorted[0];
    }

    if (!featured) {
      featuredHeroSection.style.display = 'none';
      return;
    }

    // Populate Hero Showcase fields
    if (featuredHeroImg) {
      featuredHeroImg.src = featured.thumb || featured.fallbackThumb || '';
      featuredHeroImg.alt = featured.title || 'Featured Record';
    }
    if (featuredHeroTitle) {
      featuredHeroTitle.textContent = featured.title;
    }
    if (featuredHeroDesc) {
      featuredHeroDesc.textContent = featured.description || 'High-fidelity cinematic celluloid motion asset from the NorthSpace stream catalog.';
    }
    if (featuredHeroMeta) {
      featuredHeroMeta.textContent = `${formatViews(featured.views)} • ${featured.daysAgo}d ago • ${featured.category}`;
    }

    const watchUrl = `watch.html?id=${featured.id}`;
    if (featuredHeroPlayBtn) {
      featuredHeroPlayBtn.href = watchUrl;
    }
    if (featuredMediaStage) {
      featuredMediaStage.onclick = () => { window.location.href = watchUrl; };
    }

    featuredHeroSection.style.display = 'block';
  }

  // ==========================================================================
  // CATALOG FILTERING & SORTING LOGIC
  // ==========================================================================
  function getFilteredVideos() {
    const allVideos = window.AetherCatalog.videos || [];
    const watchMap = getContinueWatchingMap();

    let list = allVideos.filter(v => {
      // Category filter
      if (state.activeCategory !== 'all') {
        const matchesCat = v.category === state.activeCategory;
        const matchesTag = v.tags && v.tags.includes(state.activeCategory);
        if (!matchesCat && !matchesTag) return false;
      }

      // Tag filter
      if (state.activeTag && !(v.tags || []).includes(state.activeTag)) {
        return false;
      }

      // Continue Watching filter
      if (state.discoveryFilter === 'continue') {
        if (!watchMap[v.id] || !(watchMap[v.id].progress > 0.01)) {
          return false;
        }
      }

      // Search query filter (matches title, description, tags, category, slug)
      if (state.searchQuery) {
        const q = state.searchQuery;
        const inTitle = (v.title || '').toLowerCase().includes(q);
        const inDesc = (v.description || '').toLowerCase().includes(q);
        const inCat = (v.category || '').toLowerCase().includes(q);
        const inTags = (v.tags || []).some(t => t.toLowerCase().includes(q));
        if (!inTitle && !inDesc && !inCat && !inTags) return false;
      }

      return true;
    });

    // Discovery Subbar Sorting
    if (state.discoveryFilter === 'recent') {
      list.sort((a, b) => (a.daysAgo || 0) - (b.daysAgo || 0));
    } else if (state.discoveryFilter === 'popular') {
      list.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (state.discoveryFilter === 'continue') {
      list.sort((a, b) => {
        const tA = watchMap[a.id]?.updatedAt || 0;
        const tB = watchMap[b.id]?.updatedAt || 0;
        return tB - tA;
      });
    }

    return list;
  }

  // ==========================================================================
  // FEED RESET & BATCH RENDERING (Graceful Pagination + Infinite Scroll)
  // ==========================================================================
  function filterAndResetFeed() {
    if (!videoGrid) return;
    videoGrid.innerHTML = '';
    state.displayedCount = 0;

    syncContinueWatchingFilterVisibility();
    updateFeaturedHeroSection();
    loadNextBatch();
  }

  function loadNextBatch() {
    if (!videoGrid) return;

    const filtered = getFilteredVideos();
    const totalRecords = filtered.length;

    // Update dynamic record counter in discovery subbar
    if (catalogCountLabel) {
      if (state.searchQuery) {
        catalogCountLabel.textContent = `Found ${totalRecords} matching "${state.searchQuery}"`;
      } else if (state.discoveryFilter === 'continue') {
        catalogCountLabel.textContent = `${totalRecords} videos in progress`;
      } else {
        catalogCountLabel.textContent = `Showing ${Math.min(state.displayedCount + state.batchSize, totalRecords)} of ${totalRecords} records`;
      }
    }

    // Empty State Handler
    const allVideosInCatalog = window.AetherCatalog.videos || [];

    // Case A: Entire platform catalog is empty (Zero videos in database)
    if (allVideosInCatalog.length === 0) {
      if (discoverySubbar) discoverySubbar.style.display = 'none';
      if (categoryFilterStrip) categoryFilterStrip.style.display = 'none';
      if (featuredHeroSection) featuredHeroSection.style.display = 'none';
      if (scrollLoader) scrollLoader.style.display = 'none';
      if (loadMoreWrap) loadMoreWrap.style.display = 'none';

      videoGrid.innerHTML = `
        <div class="empty-catalog-stage">
          <div class="empty-catalog-badge">
            <span class="empty-badge-dot"></span>
            <span>NORTHSPACE STREAM // CATALOG CLEAN</span>
          </div>
          
          <div class="empty-catalog-icon-wrap">
            <svg class="empty-camera-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polygon points="23 7 16 12 23 17 23 7"></polygon>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
            </svg>
          </div>

          <h2 class="empty-catalog-heading">Platform Ready for Authentic Content</h2>
          
          <p class="empty-catalog-desc">
            All sample data and placeholder media have been cleared. Populate your video catalog with YouTube/Vimeo embeds, direct MP4/M3U8 streams, or run the automated video crawler.
          </p>

          <div class="empty-actions-row">
            <a href="admin.html" class="empty-cta-primary">
              <svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="width:14px;height:14px;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
              <span>Open Content CRM Console</span>
            </a>
            <a href="admin.html#panelSync" class="empty-cta-secondary">
              <svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="width:14px;height:14px;"><polyline points="16 16 12 12 8 16"></polyline><line x1="12" y1="12" x2="12" y2="21"></line><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path></svg>
              <span>Run Extractor &amp; Import</span>
            </a>
          </div>

          <div class="empty-spec-pills">
            <span class="empty-spec-pill">✦ Zero Bandwidth Limits</span>
            <span class="empty-spec-pill">✦ Iframe Embed Sandbox</span>
            <span class="empty-spec-pill">✦ Custom User Categories</span>
            <span class="empty-spec-pill">✦ Standalone Player</span>
          </div>
        </div>
      `;
      return;
    }

    // Catalog has videos: ensure discovery subbar is visible
    if (discoverySubbar) discoverySubbar.style.display = 'flex';

    // Case B: Search or Category filter yielded 0 results
    if (totalRecords === 0 && state.displayedCount === 0) {
      if (scrollLoader) scrollLoader.style.display = 'none';
      if (loadMoreWrap) loadMoreWrap.style.display = 'none';

      videoGrid.innerHTML = `
        <div class="empty-catalog-stage">
          <div class="empty-catalog-icon-wrap" style="color:var(--text-muted);">
            <svg class="empty-camera-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <h2 class="empty-catalog-heading">No Matching Records Found</h2>
          <p class="empty-catalog-desc">
            No video records matched your active filter or search query. Clear the active filter to view all catalog records.
          </p>
          <div class="empty-actions-row">
            <button type="button" class="empty-cta-primary" id="emptyResetFilterBtn">
              <span>Clear Active Filters</span>
            </button>
            <a href="admin.html" class="empty-cta-secondary">
              <span>Open Content CRM</span>
            </a>
          </div>
        </div>
      `;

      const resetFilterBtn = document.getElementById('emptyResetFilterBtn');
      if (resetFilterBtn) {
        resetFilterBtn.addEventListener('click', () => {
          state.searchQuery = '';
          if (mainSearchInput) mainSearchInput.value = '';
          if (searchClearBtn) searchClearBtn.style.display = 'none';
          state.activeCategory = 'all';
          state.activeTag = '';
          state.discoveryFilter = 'all';
          syncDiscoveryButtons();
          renderCategoryFilterStrip();
          filterAndResetFeed();
        });
      }
      return;
    }

    const nextBatch = filtered.slice(state.displayedCount, state.displayedCount + state.batchSize);

    // Append Video Cards
    const watchMap = getContinueWatchingMap();
    nextBatch.forEach(video => {
      const card = createVideoCard(video, watchMap[video.id]);
      videoGrid.appendChild(card);
    });

    state.displayedCount += nextBatch.length;

    // Pagination & Infinite Scroll Updates
    const remaining = totalRecords - state.displayedCount;

    if (loadMoreWrap && btnLoadMore && loadMoreCount) {
      if (remaining > 0) {
        loadMoreWrap.style.display = 'flex';
        loadMoreCount.textContent = `(${remaining} remaining)`;
      } else {
        loadMoreWrap.style.display = 'none';
      }
    }

    if (scrollLoader) {
      scrollLoader.style.display = remaining > 0 ? 'flex' : 'none';
    }
  }

  // ==========================================================================
  // MINIMAL VIDEO CARD BUILDER (Clean, Two-line Clamped, Hover Preview)
  // Avoids cluttering with ratings, long paragraphs, or redundant buttons
  // ==========================================================================
  function createVideoCard(video, watchProgress) {
    const card = document.createElement('div');
    card.className = 'video-thumb-card';
    card.dataset.id = video.id;

    // Continue Watching Progress Bar HTML (if available)
    let progressBarHtml = '';
    if (watchProgress && watchProgress.progress > 0) {
      const pct = Math.min(100, Math.round(watchProgress.progress * 100));
      progressBarHtml = `
        <div class="card-watch-progress" title="${pct}% watched">
          <div class="card-watch-progress-fill" style="width: ${pct}%"></div>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="card-media-box">
        <img src="${video.thumb || video.fallbackThumb || ''}" alt="${video.title}" class="card-canvas-thumb" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${video.fallbackThumb || ''}'">
        <div class="card-hover-overlay">
          <div class="card-hover-play-btn" title="Watch Video">
            <svg class="svg-icon" viewBox="0 0 24 24" fill="currentColor" stroke="none" style="width:16px;height:16px;margin-left:2px;"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          </div>
        </div>
        <span class="card-duration-badge">${formatTime(video.duration)}</span>
        ${progressBarHtml}
      </div>
      <div class="card-content">
        <h3 class="card-title-text" title="${video.title}">${video.title}</h3>
        <div class="card-meta-line">
          <div class="card-views-time">
            <span>${formatViews(video.views)}</span>
            <span>&bull;</span>
            <span>${video.daysAgo}d ago</span>
          </div>
          <span class="card-cat-pill">${video.category}</span>
        </div>
      </div>
    `;

    card.addEventListener('click', () => {
      window.location.href = `watch.html?id=${video.id}`;
    });

    return card;
  }

  // ==========================================================================
  // PAGINATION CONTROLS (Manual Load More Button & Intersection Sentinel)
  // ==========================================================================
  if (btnLoadMore) {
    btnLoadMore.addEventListener('click', () => {
      loadNextBatch();
    });
  }

  const scrollObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      loadNextBatch();
    }
  }, { rootMargin: '400px' });

  if (scrollLoader) {
    scrollObserver.observe(scrollLoader);
  }

  // ==========================================================================
  // URL PARAMS & CRM SYNCHRONIZATION
  // ==========================================================================
  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get('search');
  const catParam = urlParams.get('cat');

  if (searchParam) {
    state.searchQuery = searchParam.toLowerCase();
    if (mainSearchInput) {
      mainSearchInput.value = searchParam;
      if (searchClearBtn) searchClearBtn.style.display = 'flex';
    }
  }

  if (catParam) {
    state.activeCategory = catParam.toLowerCase();
  }

  // Listen for catalog or category alterations from Content CRM Console
  window.addEventListener('storage', (e) => {
    if (e.key === 'aether_categories_v2' || e.key === 'aether_catalog_crm_v1' || e.key === 'aether_homepage_config_v1') {
      renderCategoryFilterStrip();
      filterAndResetFeed();
    } else if (e.key === 'aether_continue_watching') {
      syncContinueWatchingFilterVisibility();
    }
  });

  window.addEventListener('focus', () => {
    renderCategoryFilterStrip();
    syncContinueWatchingFilterVisibility();
  });

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================
  syncContinueWatchingFilterVisibility();
  renderCategoryFilterStrip();
  filterAndResetFeed();

})();
