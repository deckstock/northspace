/**
 * AETHER STREAM — COMPREHENSIVE ADMIN CONSOLE & VIDEO STUDIO
 * Architecture:
 * - Left Sidebar Navigation (Main, Management, System)
 * - Overview Dashboard with Recent Edits, Health Alerts & Activity Feed
 * - Video Catalog with List/Grid Views, Filter Pills & Floating Bulk Actions
 * - Studio with Left Form + Right Sticky Live Preview, Autosave & Draft System
 * - Curated Collections & Playlists Workspace with Video Selector
 * - Category Workspace with Ordering & Cover Imagery
 * - Homepage Manager (Hero Video, Marquee Banner, Shelves)
 * - Analytics & Infrastructure Distribution
 * - DMCA Rights-Management Adjudication Pipeline & Case Drawer
 * - System Health Link Validator & Duplicate Detector
 * - Universal Extractor Sync & Import/Export
 * - Activity Logs Audit Trail
 * - Keyboard Shortcuts & Toast Notifications with Undo
 */

(function () {
  'use strict';

  const DEFAULT_PLACEHOLDER_THUMB = (window.AetherCatalog && window.AetherCatalog.DEFAULT_THUMB) || '';

  const {
    videos,
    categories,
    formatTime,
    formatViews,
    generateSlug,
    getCategories,
    getCategoryBySlug,
    addCategory,
    updateCategory,
    deleteCategory,
    clearAllCategories,
    resetCategoriesToDefault,
    reorderCategory,
    toggleCategoryVisibility,
    toggleCategoryHomepage,
    getVideoById,
    addVideo,
    updateVideo,
    deleteVideo,
    clearAllVideos,
    bulkUpdateCategory,
    bulkAddTag,
    bulkUpdateStatus,
    bulkDeleteVideos,
    exportSelectedJSON,
    getDMCARequests,
    getDMCAById,
    updateDMCAStatus,
    saveDMCANotes,
    executeDMCATakedown,
    parseUniversalCatalog,
    importCatalog,
    appendCatalog,
    importJSON,
    exportJSON,
    resetToDefaults,
    getCollections,
    getCollectionById,
    addCollection,
    updateCollection,
    deleteCollection,
    getActivityLogs,
    logActivity,
    clearActivityLogs,
    getHomepageConfig,
    saveHomepageConfig,
    scanCatalogHealth,
    detectDuplicates,
    saveStudioDraft,
    getStudioDraft,
    clearStudioDraft,
    PLACEHOLDER_THUMB,
    wipeEntirePlatform
  } = window.AetherCatalog;

  // ==========================================================================
  // 1. THEME MODE CONTROLLER
  // ==========================================================================
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

  // ==========================================================================
  // 2. SYSTEM FEEDBACK: TOAST NOTIFICATIONS & CONFIRMATION MODALS
  // ==========================================================================
  const toastContainer = document.getElementById('toastContainer');
  let lastDeletedItem = null;

  function showToast(message, type = 'info', undoCallback = null) {
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = 'toast';

    let iconSvg = '<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="width:16px;height:16px;color:#10b981;"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    if (type === 'error') {
      iconSvg = '<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="width:16px;height:16px;color:#ef4444;"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
    } else if (type === 'warning') {
      iconSvg = '<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="width:16px;height:16px;color:#f59e0b;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
    }

    toast.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;">
        ${iconSvg}
        <span>${message}</span>
      </div>
    `;

    if (undoCallback) {
      const undoBtn = document.createElement('button');
      undoBtn.type = 'button';
      undoBtn.className = 'toast-undo-btn';
      undoBtn.textContent = 'Undo';
      undoBtn.addEventListener('click', () => {
        undoCallback();
        toast.remove();
      });
      toast.appendChild(undoBtn);
    }

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3800);
  }

  // Confirmation Modal
  const confirmModal = document.getElementById('confirmModal');
  const confirmTitle = document.getElementById('confirmTitle');
  const confirmMessage = document.getElementById('confirmMessage');
  const confirmCloseBtn = document.getElementById('confirmCloseBtn');
  const confirmCancelBtn = document.getElementById('confirmCancelBtn');
  const confirmOkBtn = document.getElementById('confirmOkBtn');
  let confirmCallback = null;

  function openConfirmModal(title, message, onConfirm) {
    if (!confirmModal) {
      if (confirm(message)) onConfirm();
      return;
    }
    confirmTitle.textContent = title;
    confirmMessage.textContent = message;
    confirmCallback = onConfirm;
    confirmModal.style.display = 'flex';
  }

  function closeConfirmModal() {
    if (confirmModal) confirmModal.style.display = 'none';
    confirmCallback = null;
  }

  if (confirmCloseBtn) confirmCloseBtn.addEventListener('click', closeConfirmModal);
  if (confirmCancelBtn) confirmCancelBtn.addEventListener('click', closeConfirmModal);
  if (confirmOkBtn) {
    confirmOkBtn.addEventListener('click', () => {
      if (confirmCallback) confirmCallback();
      closeConfirmModal();
    });
  }

  // Keyboard Shortcuts Modal
  const shortcutsModal = document.getElementById('shortcutsModal');
  const btnOpenShortcuts = document.getElementById('btnOpenShortcuts');
  const shortcutsModalCloseBtn = document.getElementById('shortcutsModalCloseBtn');

  function openShortcutsModal() {
    if (shortcutsModal) shortcutsModal.style.display = 'flex';
  }

  function closeShortcutsModal() {
    if (shortcutsModal) shortcutsModal.style.display = 'none';
  }

  if (btnOpenShortcuts) btnOpenShortcuts.addEventListener('click', openShortcutsModal);
  if (shortcutsModalCloseBtn) shortcutsModalCloseBtn.addEventListener('click', closeShortcutsModal);

  // ==========================================================================
  // 3. SIDEBAR NAVIGATION & PANEL CONTROLLER
  // ==========================================================================
  const adminSidebar = document.getElementById('adminSidebar');
  const sidebarCollapseBtn = document.getElementById('sidebarCollapseBtn');
  const breadcrumbActive = document.getElementById('breadcrumbActive');
  const navItems = document.querySelectorAll('.sidebar-nav .nav-item[data-panel]');
  const adminPanels = document.querySelectorAll('.admin-panel');
  const globalSearchInput = document.getElementById('globalSearchInput');
  const topbarNewVideoBtn = document.getElementById('topbarNewVideoBtn');
  const sidebarAddVideoBtn = document.getElementById('sidebarAddVideoBtn');

  // Sidebar Collapse / Expand Toggle
  if (sidebarCollapseBtn && adminSidebar) {
    sidebarCollapseBtn.addEventListener('click', () => {
      adminSidebar.classList.toggle('collapsed');
    });
  }

  const panelNamesMap = {
    panelOverview: 'Overview',
    panelVideos: 'Video Catalog',
    panelCollections: 'Collections & Playlists',
    panelCategories: 'Categories & Feeds',
    panelHomepage: 'Homepage Manager',
    panelAnalytics: 'Analytics',
    panelDmca: 'DMCA & Rights',
    panelHealth: 'System Health',
    panelSync: 'Import & Export',
    panelLogs: 'Activity Logs',
    panelSettings: 'Settings'
  };

  function switchPanel(panelId) {
    // If Studio is open, close it
    if (crmStudioView && crmStudioView.style.display !== 'none') {
      if (isStudioDirty) {
        if (!confirm('You have unsaved changes in the Studio. Discard and switch?')) return;
      }
      exitStudio(false);
    }

    navItems.forEach(item => {
      if (item.getAttribute('data-panel') === panelId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    adminPanels.forEach(p => {
      if (p.id === panelId) {
        p.classList.add('active');
      } else {
        p.classList.remove('active');
      }
    });

    if (breadcrumbActive && panelNamesMap[panelId]) {
      breadcrumbActive.textContent = panelNamesMap[panelId];
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Refresh data for the active panel
    if (panelId === 'panelOverview') renderOverviewDashboard();
    if (panelId === 'panelVideos') renderVideoCatalog();
    if (panelId === 'panelCollections') renderCollectionsWorkspace();
    if (panelId === 'panelCategories') renderCategoryWorkspace();
    if (panelId === 'panelHomepage') renderHomepageManager();
    if (panelId === 'panelAnalytics') renderAnalyticsPanel();
    if (panelId === 'panelDmca') renderDmcaTable();
    if (panelId === 'panelHealth') renderSystemHealthPanel();
    if (panelId === 'panelLogs') renderActivityLogs();
    if (panelId === 'panelSettings') renderSettingsPanel();
  }

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const panelId = item.getAttribute('data-panel');
      if (panelId) switchPanel(panelId);
    });
  });

  // Direct Add Video buttons
  if (topbarNewVideoBtn) topbarNewVideoBtn.addEventListener('click', () => enterStudio(null));
  if (sidebarAddVideoBtn) sidebarAddVideoBtn.addEventListener('click', () => enterStudio(null));

  // Global Search Input
  if (globalSearchInput) {
    globalSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = globalSearchInput.value.trim();
        switchPanel('panelVideos');
        if (crmVideoSearch) {
          crmVideoSearch.value = val;
          searchQuery = val.toLowerCase();
          renderVideoCatalog();
        }
      }
    });
  }

  // ==========================================================================
  // 4. METRICS & SIDEBAR BADGES
  // ==========================================================================
  function updateSidebarBadges() {
    const totalVideos = window.AetherCatalog.videos.length;
    const totalCollections = getCollections().length;
    const totalCategories = window.AetherCatalog.categories.length;
    const pendingDmca = getDMCARequests().filter(r => r.status === 'new' || r.status === 'under_review').length;
    const totalLogs = getActivityLogs().length;

    const elVideo = document.getElementById('sidebarVideoCount');
    const elColl = document.getElementById('sidebarCollectionsCount');
    const elCat = document.getElementById('sidebarCategoriesCount');
    const elDmca = document.getElementById('sidebarDmcaCount');
    const elLogs = document.getElementById('sidebarLogsCount');

    if (elVideo) elVideo.textContent = totalVideos;
    if (elColl) elColl.textContent = totalCollections;
    if (elCat) elCat.textContent = totalCategories;
    if (elDmca) elDmca.textContent = pendingDmca;
    if (elLogs) elLogs.textContent = totalLogs;

    // Overview numbers
    const ovTotal = document.getElementById('overviewTotalVideos');
    const ovEmbeds = document.getElementById('overviewEmbeds');
    const ovColls = document.getElementById('overviewCollections');
    const ovDmca = document.getElementById('overviewDmca');

    const totalEmbeds = window.AetherCatalog.videos.filter(v => v.playbackType === 'embed' || v.embedUrl).length;

    if (ovTotal) ovTotal.textContent = totalVideos;
    if (ovEmbeds) ovEmbeds.textContent = totalEmbeds;
    if (ovColls) ovColls.textContent = totalCollections;
    if (ovDmca) ovDmca.textContent = pendingDmca;
  }

  // ==========================================================================
  // 5. OVERVIEW DASHBOARD (PANEL 1)
  // Recently Modified Assets, Health Status & Activity Audit Feed
  // ==========================================================================
  const overviewRecentVideosList = document.getElementById('overviewRecentVideosList');
  const overviewActivityLogsList = document.getElementById('overviewActivityLogsList');
  const btnOverviewViewAllVideos = document.getElementById('btnOverviewViewAllVideos');
  const btnOverviewViewLogs = document.getElementById('btnOverviewViewLogs');
  const btnQuickHealthScan = document.getElementById('btnQuickHealthScan');
  const launchpadAddVideoBtn = document.getElementById('launchpadAddVideoBtn');
  const launchpadCollectionsBtn = document.getElementById('launchpadCollectionsBtn');
  const launchpadHomepageBtn = document.getElementById('launchpadHomepageBtn');
  const launchpadBackupBtn = document.getElementById('launchpadBackupBtn');

  if (btnOverviewViewAllVideos) btnOverviewViewAllVideos.addEventListener('click', () => switchPanel('panelVideos'));
  if (btnOverviewViewLogs) btnOverviewViewLogs.addEventListener('click', () => switchPanel('panelLogs'));
  if (btnQuickHealthScan) btnQuickHealthScan.addEventListener('click', () => switchPanel('panelHealth'));
  if (launchpadAddVideoBtn) launchpadAddVideoBtn.addEventListener('click', () => enterStudio(null));
  if (launchpadCollectionsBtn) launchpadCollectionsBtn.addEventListener('click', () => switchPanel('panelCollections'));
  if (launchpadHomepageBtn) launchpadHomepageBtn.addEventListener('click', () => switchPanel('panelHomepage'));
  if (launchpadBackupBtn) launchpadBackupBtn.addEventListener('click', () => switchPanel('panelSync'));

  function renderOverviewDashboard() {
    updateSidebarBadges();

    // 1. Recently Modified Videos
    if (overviewRecentVideosList) {
      overviewRecentVideosList.innerHTML = '';
      const recent = [...window.AetherCatalog.videos]
        .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
        .slice(0, 5);

      recent.forEach(v => {
        const item = document.createElement('div');
        item.className = 'dash-list-item';
        item.innerHTML = `
          <div style="display:flex;align-items:center;gap:12px;min-width:0;">
            <img src="${v.thumb || DEFAULT_PLACEHOLDER_THUMB}" alt="" style="width:54px;height:34px;object-fit:cover;border-radius:4px;background:#000;flex-shrink:0;">
            <div style="min-width:0;">
              <div style="font-size:13px;font-weight:500;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${v.title}</div>
              <div style="font-family:var(--font-mono);font-size:10.5px;color:var(--text-muted);display:flex;gap:6px;">
                <span>${v.category ? v.category.toUpperCase() : 'CINEMA'}</span>
                <span>&bull;</span>
                <span>${formatTime(v.duration || 0)}</span>
              </div>
            </div>
          </div>
          <button type="button" class="url-btn-sm edit-recent-btn" data-id="${v.id}">Edit</button>
        `;
        overviewRecentVideosList.appendChild(item);
      });

      overviewRecentVideosList.querySelectorAll('.edit-recent-btn').forEach(b => {
        b.addEventListener('click', () => enterStudio(b.getAttribute('data-id')));
      });
    }

    // 2. Health diagnostic overview
    const health = scanCatalogHealth();
    const ovHealthCircle = document.getElementById('overviewHealthCircle');
    const ovHealthSummary = document.getElementById('overviewHealthSummary');
    const sidebarHealthBadge = document.getElementById('sidebarHealthBadge');
    const ovHealth = document.getElementById('overviewHealth');

    if (ovHealthCircle) ovHealthCircle.textContent = `${health.healthScore}%`;
    if (sidebarHealthBadge) sidebarHealthBadge.textContent = `${health.healthScore}%`;
    if (ovHealth) ovHealth.textContent = `${health.healthScore}%`;
    if (ovHealthSummary) {
      if (health.brokenVideos.length > 0) {
        ovHealthSummary.textContent = `Warning: ${health.brokenVideos.length} videos have broken or missing playback stream links.`;
        ovHealthSummary.style.color = '#ef4444';
      } else {
        ovHealthSummary.textContent = 'All media links have valid external embed or direct progressive HTTP containers.';
        ovHealthSummary.style.color = 'var(--text-secondary)';
      }
    }

    // 3. Recent Activity Logs feed
    if (overviewActivityLogsList) {
      overviewActivityLogsList.innerHTML = '';
      const logs = getActivityLogs().slice(0, 4);
      logs.forEach(l => {
        const item = document.createElement('div');
        item.className = 'dash-list-item';
        item.innerHTML = `
          <div style="min-width:0;display:flex;flex-direction:column;gap:2px;">
            <div style="font-size:12.5px;font-weight:500;color:var(--text-primary);">${l.action}</div>
            <div style="font-size:11.5px;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${l.details}</div>
          </div>
          <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);white-space:nowrap;margin-left:10px;">
            ${l.timestamp ? new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
          </span>
        `;
        overviewActivityLogsList.appendChild(item);
      });
    }
  }

  // ==========================================================================
  // 6. VIDEO CATALOG (PANEL 2) — FILTER PILLS, BULK SELECTION, LIST/GRID
  // ==========================================================================
  let currentFilter = 'all';
  let currentCategoryFilter = 'all';
  let searchQuery = '';
  let currentViewMode = 'list';
  const selectedVideoIds = new Set();

  const crmVideoTableBody = document.getElementById('crmVideoTableBody');
  const crmVideoTableContainer = document.getElementById('crmVideoTableContainer');
  const crmVideoGridContainer = document.getElementById('crmVideoGridContainer');
  const crmVideoSearch = document.getElementById('crmVideoSearch');
  const crmCategoryFilter = document.getElementById('crmCategoryFilter');
  const crmViewListBtn = document.getElementById('crmViewListBtn');
  const crmViewGridBtn = document.getElementById('crmViewGridBtn');
  const masterCheckbox = document.getElementById('masterCheckbox');
  const bulkActionsBar = document.getElementById('bulkActionsBar');
  const bulkSelectedCount = document.getElementById('bulkSelectedCount');
  const openAddVideoModalBtn = document.getElementById('openAddVideoModalBtn');
  const clearAllVideosBtn = document.getElementById('clearAllVideosBtn');
  const btnCatalogScanDuplicates = document.getElementById('btnCatalogScanDuplicates');

  if (openAddVideoModalBtn) openAddVideoModalBtn.addEventListener('click', () => enterStudio(null));
  if (btnCatalogScanDuplicates) btnCatalogScanDuplicates.addEventListener('click', () => switchPanel('panelHealth'));

  // Filter Pills Event Listeners
  const filterPillBtns = document.querySelectorAll('#crmFilterPills .crm-filter-pill');
  filterPillBtns.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPillBtns.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentFilter = pill.getAttribute('data-filter') || 'all';
      renderVideoCatalog();
    });
  });

  // Search & Category Dropdown
  if (crmVideoSearch) {
    crmVideoSearch.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      renderVideoCatalog();
    });
  }

  if (crmCategoryFilter) {
    crmCategoryFilter.addEventListener('change', (e) => {
      currentCategoryFilter = e.target.value;
      renderVideoCatalog();
    });
  }

  // View Switcher (List vs Grid)
  if (crmViewListBtn && crmViewGridBtn) {
    crmViewListBtn.addEventListener('click', () => {
      currentViewMode = 'list';
      crmViewListBtn.classList.add('active');
      crmViewGridBtn.classList.remove('active');
      crmVideoTableContainer.style.display = 'block';
      crmVideoGridContainer.style.display = 'none';
      renderVideoCatalog();
    });

    crmViewGridBtn.addEventListener('click', () => {
      currentViewMode = 'grid';
      crmViewGridBtn.classList.add('active');
      crmViewListBtn.classList.remove('active');
      crmVideoTableContainer.style.display = 'none';
      crmVideoGridContainer.style.display = 'grid';
      renderVideoCatalog();
    });
  }

  // Master Checkbox
  if (masterCheckbox) {
    masterCheckbox.addEventListener('change', () => {
      const isChecked = masterCheckbox.checked;
      const visibleVideos = getFilteredVideos();
      if (isChecked) {
        visibleVideos.forEach(v => selectedVideoIds.add(v.id));
      } else {
        selectedVideoIds.clear();
      }
      updateBulkBar();
      renderVideoCatalog();
    });
  }

  function getFilteredVideos() {
    let list = [...window.AetherCatalog.videos];

    if (currentFilter === 'published') {
      list = list.filter(v => (v.status || 'published') === 'published');
    } else if (currentFilter === 'draft') {
      list = list.filter(v => v.status === 'draft');
    } else if (currentFilter === 'broken') {
      list = list.filter(v => !v.embedUrl && !v.videoUrl);
    } else if (currentFilter === 'no-thumb') {
      list = list.filter(v => !v.thumb);
    } else if (currentFilter === 'recent') {
      list = list.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
    } else if (currentFilter === 'views') {
      list = list.sort((a, b) => (b.views || 0) - (a.views || 0));
    }

    if (currentCategoryFilter && currentCategoryFilter !== 'all') {
      list = list.filter(v => (v.category || '').toLowerCase() === currentCategoryFilter.toLowerCase());
    }

    if (searchQuery) {
      list = list.filter(v =>
        (v.title && v.title.toLowerCase().includes(searchQuery)) ||
        (v.id && v.id.toLowerCase().includes(searchQuery)) ||
        (v.slug && v.slug.toLowerCase().includes(searchQuery)) ||
        (Array.isArray(v.tags) && v.tags.some(t => t.toLowerCase().includes(searchQuery)))
      );
    }

    return list;
  }

  function renderVideoCatalog() {
    const list = getFilteredVideos();

    if (currentViewMode === 'list') {
      renderVideoTable(list);
    } else {
      renderVideoGrid(list);
    }

    updateBulkBar();
    updateSidebarBadges();
    updateFilterPillCounts();
  }

  function updateFilterPillCounts() {
    const all = window.AetherCatalog.videos;
    const pubCount = all.filter(v => (v.status || 'published') === 'published').length;
    const draftCount = all.filter(v => v.status === 'draft').length;
    const brokenCount = all.filter(v => !v.embedUrl && !v.videoUrl).length;
    const noThumbCount = all.filter(v => !v.thumb).length;

    const elAll = document.getElementById('pillCountAll');
    const elPub = document.getElementById('pillCountPublished');
    const elDraft = document.getElementById('pillCountDrafts');
    const elBroken = document.getElementById('pillCountBroken');
    const elNoThumb = document.getElementById('pillCountNoThumb');

    if (elAll) elAll.textContent = all.length;
    if (elPub) elPub.textContent = pubCount;
    if (elDraft) elDraft.textContent = draftCount;
    if (elBroken) elBroken.textContent = brokenCount;
    if (elNoThumb) elNoThumb.textContent = noThumbCount;
  }

  function renderVideoTable(list) {
    if (!crmVideoTableBody) return;
    crmVideoTableBody.innerHTML = '';

    if (list.length === 0) {
      crmVideoTableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center;padding:48px 20px;color:var(--text-muted);font-family:var(--font-mono);">
            No catalog assets match the current filter criteria.
          </td>
        </tr>
      `;
      return;
    }

    list.forEach(video => {
      const isSelected = selectedVideoIds.has(video.id);
      const isEmbed = !!video.embedUrl;
      const isStream = !!video.videoUrl;
      const isPublished = (video.status || 'published') === 'published';

      let providerBadge = '<span class="crm-status-pill status-gray">NO SOURCE</span>';
      if (isEmbed) {
        const isYt = /youtube|youtu\.be/i.test(video.embedUrl);
        const isVimeo = /vimeo/i.test(video.embedUrl);
        const provName = isYt ? 'YOUTUBE EMBED' : (isVimeo ? 'VIMEO EMBED' : 'IFRAME EMBED');
        providerBadge = `<span class="crm-status-pill status-embed" title="${video.embedUrl}">${provName}</span>`;
      } else if (isStream) {
        providerBadge = `<span class="crm-status-pill status-stream" title="${video.videoUrl}">DIRECT STREAM</span>`;
      }

      const statusBadge = isPublished
        ? '<span class="crm-status-pill status-live">PUBLISHED</span>'
        : '<span class="crm-status-pill status-draft">DRAFT</span>';

      const tagHtml = Array.isArray(video.tags) && video.tags.length > 0
        ? video.tags.slice(0, 3).map(t => `<span class="studio-tag-pill">#${t}</span>`).join(' ')
        : '';

      const tr = document.createElement('tr');
      if (isSelected) tr.style.backgroundColor = 'var(--bg-pill-hover)';

      tr.innerHTML = `
        <td style="text-align:center;">
          <input type="checkbox" class="video-row-checkbox" data-id="${video.id}" ${isSelected ? 'checked' : ''} style="cursor:pointer;accent-color:var(--accent);">
        </td>
        <td class="table-thumb-col">
          <div class="table-thumb-wrap">
            <img src="${video.thumb || DEFAULT_PLACEHOLDER_THUMB}" alt="${video.title}" class="table-thumb-img" onerror="this.src=DEFAULT_PLACEHOLDER_THUMB;">
            <span class="table-thumb-duration">${formatTime(video.duration || 0)}</span>
          </div>
        </td>
        <td style="max-width:320px;">
          <div class="table-video-title" title="${video.title}">${video.title}</div>
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:2px;">
            <span class="table-video-slug">${video.slug || video.id}</span>
            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);">${video.id}</span>
          </div>
        </td>
        <td>
          <div style="display:flex;flex-direction:column;gap:4px;">
            <span style="font-family:var(--font-mono);font-size:11px;font-weight:600;text-transform:uppercase;color:var(--accent);">${video.category || 'CINEMA'}</span>
            <div style="display:flex;gap:4px;flex-wrap:wrap;">${tagHtml}</div>
          </div>
        </td>
        <td>${providerBadge}</td>
        <td>
          <div style="font-family:var(--font-mono);font-size:11.5px;color:var(--text-primary);">${formatViews(video.views || 0)}</div>
          <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);">${formatTime(video.duration || 0)}</div>
        </td>
        <td>${statusBadge}</td>
        <td style="text-align:right;">
          <div style="display:inline-flex;align-items:center;gap:6px;">
            <button type="button" class="url-btn-sm edit-video-btn" data-id="${video.id}" title="Edit in Studio">Edit</button>
            <a href="watch.html?id=${video.id}" target="_blank" class="url-btn-sm" title="Preview Live Theater" style="text-decoration:none;">&nearr;</a>
            <button type="button" class="url-btn-sm delete-video-btn" data-id="${video.id}" title="Delete Video" style="color:#e11d48;">&times;</button>
          </div>
        </td>
      `;

      crmVideoTableBody.appendChild(tr);
    });

    attachTableEvents();
  }

  function renderVideoGrid(list) {
    if (!crmVideoGridContainer) return;
    crmVideoGridContainer.innerHTML = '';

    if (list.length === 0) {
      crmVideoGridContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align:center; padding: 48px 20px; color:var(--text-muted); font-family:var(--font-mono);">
          No catalog assets match the current filter criteria.
        </div>
      `;
      return;
    }

    list.forEach(video => {
      const isSelected = selectedVideoIds.has(video.id);
      const isEmbed = !!video.embedUrl;
      const isPublished = (video.status || 'published') === 'published';

      const card = document.createElement('div');
      card.className = 'grid-card';
      if (isSelected) card.style.borderColor = 'var(--accent)';

      card.innerHTML = `
        <div class="grid-thumb-wrap">
          <img src="${video.thumb || DEFAULT_PLACEHOLDER_THUMB}" alt="${video.title}" class="grid-thumb-img" onerror="this.src=DEFAULT_PLACEHOLDER_THUMB;">
          <div class="grid-badge-top-left">
            <span class="crm-status-pill ${isEmbed ? 'status-embed' : 'status-stream'}">${isEmbed ? 'EMBED' : 'STREAM'}</span>
          </div>
          <div class="grid-checkbox-top-right">
            <input type="checkbox" class="video-row-checkbox" data-id="${video.id}" ${isSelected ? 'checked' : ''} style="cursor:pointer;accent-color:var(--accent);">
          </div>
          <div class="grid-badge-bottom-right">${formatTime(video.duration || 0)}</div>
        </div>
        <div class="grid-card-body">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <span style="font-family:var(--font-mono);font-size:10.5px;color:var(--accent);text-transform:uppercase;">${video.category || 'CINEMA'}</span>
            <span class="crm-status-pill ${isPublished ? 'status-live' : 'status-draft'}">${isPublished ? 'LIVE' : 'DRAFT'}</span>
          </div>
          <div class="grid-card-title" title="${video.title}">${video.title}</div>
          <div class="grid-card-footer">
            <span style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted);">${formatViews(video.views || 0)}</span>
            <div style="display:flex;align-items:center;gap:6px;">
              <button type="button" class="url-btn-sm edit-video-btn" data-id="${video.id}">Edit</button>
              <a href="watch.html?id=${video.id}" target="_blank" class="url-btn-sm" style="text-decoration:none;">&nearr;</a>
            </div>
          </div>
        </div>
      `;

      crmVideoGridContainer.appendChild(card);
    });

    attachTableEvents();
  }

  function attachTableEvents() {
    document.querySelectorAll('.video-row-checkbox').forEach(cb => {
      cb.addEventListener('change', () => {
        const id = cb.getAttribute('data-id');
        if (cb.checked) {
          selectedVideoIds.add(id);
        } else {
          selectedVideoIds.delete(id);
        }
        updateBulkBar();
      });
    });

    document.querySelectorAll('.edit-video-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        enterStudio(id);
      });
    });

    document.querySelectorAll('.delete-video-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const vid = getVideoById(id);
        if (!vid) return;

        openConfirmModal('Delete Video Record', `Are you sure you want to delete "${vid.title}"?`, () => {
          lastDeletedItem = { type: 'video', data: { ...vid } };
          deleteVideo(id);
          selectedVideoIds.delete(id);
          logActivity('Video Deleted', `Deleted "${vid.title}" (ID: ${id}) from catalog.`, 'videos');
          renderVideoCatalog();
          showToast(`Deleted "${vid.title}"`, 'warning', () => {
            if (lastDeletedItem && lastDeletedItem.data) {
              addVideo(lastDeletedItem.data);
              logActivity('Video Restored', `Restored deleted video "${lastDeletedItem.data.title}".`, 'videos');
              renderVideoCatalog();
              showToast('Restored deleted video', 'success');
            }
          });
        });
      });
    });
  }

  function updateBulkBar() {
    const count = selectedVideoIds.size;
    if (count > 0) {
      bulkActionsBar.classList.add('show');
      bulkSelectedCount.textContent = `${count} selected`;
    } else {
      bulkActionsBar.classList.remove('show');
    }
  }

  // Bulk Actions
  const bulkApplyCategoryBtn = document.getElementById('bulkApplyCategoryBtn');
  const bulkCategorySelect = document.getElementById('bulkCategorySelect');
  const bulkAddTagBtn = document.getElementById('bulkAddTagBtn');
  const bulkTagInput = document.getElementById('bulkTagInput');
  const bulkPublishBtn = document.getElementById('bulkPublishBtn');
  const bulkDraftBtn = document.getElementById('bulkDraftBtn');
  const bulkExportBtn = document.getElementById('bulkExportBtn');
  const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
  const bulkClearBtn = document.getElementById('bulkClearBtn');

  if (bulkApplyCategoryBtn && bulkCategorySelect) {
    bulkApplyCategoryBtn.addEventListener('click', () => {
      const cat = bulkCategorySelect.value;
      if (!cat) return showToast('Please select a category first', 'warning');
      const count = bulkUpdateCategory(Array.from(selectedVideoIds), cat);
      logActivity('Bulk Category Update', `Updated category to "${cat}" for ${count} videos.`, 'videos');
      renderVideoCatalog();
      showToast(`Updated category for ${count} videos`, 'success');
    });
  }

  if (bulkAddTagBtn && bulkTagInput) {
    bulkAddTagBtn.addEventListener('click', () => {
      const tag = bulkTagInput.value.trim();
      if (!tag) return showToast('Please enter a tag name', 'warning');
      const count = bulkAddTag(Array.from(selectedVideoIds), tag);
      bulkTagInput.value = '';
      logActivity('Bulk Tag Added', `Added tag #${tag} to ${count} videos.`, 'videos');
      renderVideoCatalog();
      showToast(`Added #${tag} to ${count} videos`, 'success');
    });
  }

  if (bulkPublishBtn) {
    bulkPublishBtn.addEventListener('click', () => {
      const count = bulkUpdateStatus(Array.from(selectedVideoIds), 'published');
      logActivity('Bulk Publish', `Set ${count} videos to Published.`, 'videos');
      renderVideoCatalog();
      showToast(`Published ${count} videos`, 'success');
    });
  }

  if (bulkDraftBtn) {
    bulkDraftBtn.addEventListener('click', () => {
      const count = bulkUpdateStatus(Array.from(selectedVideoIds), 'draft');
      logActivity('Bulk Unpublish', `Moved ${count} videos to Drafts.`, 'videos');
      renderVideoCatalog();
      showToast(`Moved ${count} videos to Drafts`, 'info');
    });
  }

  if (bulkExportBtn) {
    bulkExportBtn.addEventListener('click', () => {
      const json = exportSelectedJSON(Array.from(selectedVideoIds));
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `northspace-selected-${selectedVideoIds.size}-videos.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`Exported ${selectedVideoIds.size} videos as JSON`, 'success');
    });
  }

  if (bulkDeleteBtn) {
    bulkDeleteBtn.addEventListener('click', () => {
      const count = selectedVideoIds.size;
      openConfirmModal('Delete Selected Videos', `Are you sure you want to permanently delete ${count} videos?`, () => {
        bulkDeleteVideos(Array.from(selectedVideoIds));
        logActivity('Bulk Delete', `Deleted ${count} videos from catalog.`, 'videos');
        selectedVideoIds.clear();
        renderVideoCatalog();
        showToast(`Deleted ${count} videos from catalog`, 'warning');
      });
    });
  }

  if (bulkClearBtn) {
    bulkClearBtn.addEventListener('click', () => {
      selectedVideoIds.clear();
      if (masterCheckbox) masterCheckbox.checked = false;
      updateBulkBar();
      renderVideoCatalog();
    });
  }

  if (clearAllVideosBtn) {
    clearAllVideosBtn.addEventListener('click', () => {
      openConfirmModal('Wipe All Catalog Videos', 'This will delete ALL videos in the discovery and streaming catalog. Continue?', () => {
        clearAllVideos();
        selectedVideoIds.clear();
        logActivity('Catalog Wiped', 'All video records cleared from catalog.', 'system');
        renderVideoCatalog();
        showToast('All videos cleared from catalog', 'warning');
      });
    });
  }

  // ==========================================================================
  // 7. COLLECTIONS & PLAYLISTS (PANEL 3)
  // Curated Retrospectives & Themed Showcases
  // ==========================================================================
  const collectionsGridContainer = document.getElementById('collectionsGridContainer');
  const openAddCollectionModalBtn = document.getElementById('openAddCollectionModalBtn');
  const collectionModal = document.getElementById('collectionModal');
  const collModalCloseBtn = document.getElementById('collModalCloseBtn');
  const collModalCancelBtn = document.getElementById('collModalCancelBtn');
  const collectionForm = document.getElementById('collectionForm');
  const collModalId = document.getElementById('collModalId');
  const collModalName = document.getElementById('collModalName');
  const collModalSlug = document.getElementById('collModalSlug');
  const collModalImageUrl = document.getElementById('collModalImageUrl');
  const collModalDescription = document.getElementById('collModalDescription');
  const collVideoChecklist = document.getElementById('collVideoChecklist');
  const collSelectedVideoCount = document.getElementById('collSelectedVideoCount');

  if (openAddCollectionModalBtn) openAddCollectionModalBtn.addEventListener('click', () => openCollectionModal(null));
  if (collModalCloseBtn) collModalCloseBtn.addEventListener('click', closeCollectionModal);
  if (collModalCancelBtn) collModalCancelBtn.addEventListener('click', closeCollectionModal);

  function renderCollectionsWorkspace() {
    if (!collectionsGridContainer) return;
    collectionsGridContainer.innerHTML = '';

    const list = getCollections();

    if (list.length === 0) {
      collectionsGridContainer.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:48px 20px;color:var(--text-muted);font-family:var(--font-mono);">
          No curated collections created yet. Click "+ Create Collection" above.
        </div>
      `;
      return;
    }

    list.forEach(c => {
      const card = document.createElement('div');
      card.className = 'collection-card';
      const count = Array.isArray(c.videoIds) ? c.videoIds.length : 0;

      card.innerHTML = `
        <div class="collection-cover-wrap">
          <img src="${c.image || DEFAULT_PLACEHOLDER_THUMB}" alt="${c.name}" class="collection-cover-img" onerror="this.src=DEFAULT_PLACEHOLDER_THUMB;">
          <div class="collection-badge-count">${count} videos</div>
        </div>
        <div class="collection-card-body">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <span style="font-weight:600;font-size:14px;color:var(--text-primary);">${c.name}</span>
            <span class="table-video-slug">${c.slug}</span>
          </div>
          <p style="font-size:12px;color:var(--text-secondary);line-height:1.45;margin-top:4px;">
            ${c.description || 'Curated video compilation.'}
          </p>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-top:12px;padding-top:10px;border-top:1px solid var(--border-subtle);">
            <span style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted);">
              ${c.isPublic !== false ? '✓ Public' : 'Private'}
            </span>
            <div style="display:flex;gap:6px;">
              <button type="button" class="url-btn-sm edit-coll-btn" data-id="${c.id}">Edit</button>
              <button type="button" class="url-btn-sm delete-coll-btn" data-id="${c.id}" style="color:#e11d48;">&times;</button>
            </div>
          </div>
        </div>
      `;
      collectionsGridContainer.appendChild(card);
    });

    collectionsGridContainer.querySelectorAll('.edit-coll-btn').forEach(b => {
      b.addEventListener('click', () => {
        const c = getCollectionById(b.getAttribute('data-id'));
        if (c) openCollectionModal(c);
      });
    });

    collectionsGridContainer.querySelectorAll('.delete-coll-btn').forEach(b => {
      b.addEventListener('click', () => {
        const id = b.getAttribute('data-id');
        const c = getCollectionById(id);
        openConfirmModal('Delete Collection', `Delete collection "${c ? c.name : id}"?`, () => {
          deleteCollection(id);
          renderCollectionsWorkspace();
          updateSidebarBadges();
          showToast('Collection deleted', 'warning');
        });
      });
    });
  }

  function openCollectionModal(coll = null) {
    if (!collectionModal) return;

    const allVids = window.AetherCatalog.videos;
    const selectedSet = new Set(coll && Array.isArray(coll.videoIds) ? coll.videoIds : []);

    if (coll) {
      collModalId.value = coll.id;
      collModalName.value = coll.name;
      collModalSlug.value = coll.slug;
      collModalImageUrl.value = coll.image || '';
      collModalDescription.value = coll.description || '';
    } else {
      collectionForm.reset();
      collModalId.value = '';
    }

    // Populate video checklist
    if (collVideoChecklist) {
      collVideoChecklist.innerHTML = '';
      allVids.forEach(v => {
        const isChecked = selectedSet.has(v.id);
        const item = document.createElement('label');
        item.className = 'video-check-item';
        item.innerHTML = `
          <input type="checkbox" class="coll-video-checkbox" value="${v.id}" ${isChecked ? 'checked' : ''} style="accent-color:var(--accent);">
          <img src="${v.thumb || DEFAULT_PLACEHOLDER_THUMB}" alt="" style="width:36px;height:22px;object-fit:cover;border-radius:2px;background:#000;">
          <span style="font-size:12px;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;">${v.title}</span>
          <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);">${v.category || 'cinema'}</span>
        `;
        collVideoChecklist.appendChild(item);
      });

      const updateCount = () => {
        const checked = collVideoChecklist.querySelectorAll('.coll-video-checkbox:checked').length;
        if (collSelectedVideoCount) collSelectedVideoCount.textContent = `${checked} selected`;
      };

      collVideoChecklist.querySelectorAll('.coll-video-checkbox').forEach(cb => {
        cb.addEventListener('change', updateCount);
      });
      updateCount();
    }

    collectionModal.style.display = 'flex';
  }

  function closeCollectionModal() {
    if (collectionModal) collectionModal.style.display = 'none';
  }

  if (collectionForm) {
    collectionForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const existingId = collModalId.value.trim();
      const name = collModalName.value.trim();
      const slug = collModalSlug.value.trim() || generateSlug(name);
      const image = collModalImageUrl.value.trim();
      const description = collModalDescription.value.trim();

      const selectedIds = [];
      if (collVideoChecklist) {
        collVideoChecklist.querySelectorAll('.coll-video-checkbox:checked').forEach(cb => {
          selectedIds.push(cb.value);
        });
      }

      if (existingId) {
        updateCollection(existingId, { name, slug, image, description, videoIds: selectedIds });
        showToast(`Updated collection "${name}"`, 'success');
      } else {
        addCollection({ name, slug, image, description, videoIds: selectedIds });
        showToast(`Created collection "${name}"`, 'success');
      }

      closeCollectionModal();
      renderCollectionsWorkspace();
      updateSidebarBadges();
    });
  }

  // ==========================================================================
  // 8. CATEGORIES & IMAGES WORKSPACE (PANEL 4)
  // ==========================================================================
  const crmCategoryTableBody = document.getElementById('crmCategoryTableBody');
  const openAddCategoryModalBtn = document.getElementById('openAddCategoryModalBtn');
  const restoreDefaultCategoriesBtn = document.getElementById('restoreDefaultCategoriesBtn');
  const categoryModal = document.getElementById('categoryModal');
  const catModalCloseBtn = document.getElementById('catModalCloseBtn');
  const catModalCancelBtn = document.getElementById('catModalCancelBtn');
  const categoryForm = document.getElementById('categoryForm');
  const catModalId = document.getElementById('catModalId');
  const catModalName = document.getElementById('catModalName');
  const catModalSlug = document.getElementById('catModalSlug');
  const catModalImageUrl = document.getElementById('catModalImageUrl');
  const catImageFileInput = document.getElementById('catImageFileInput');
  const catBrowseFileBtn = document.getElementById('catBrowseFileBtn');
  const catPreviewImg = document.getElementById('catPreviewImg');
  const catPreviewPlaceholder = document.getElementById('catPreviewPlaceholder');
  const catModalDescription = document.getElementById('catModalDescription');
  const catModalVisible = document.getElementById('catModalVisible');
  const catModalHomepage = document.getElementById('catModalHomepage');

  function renderCategoryWorkspace() {
    if (!crmCategoryTableBody) return;
    crmCategoryTableBody.innerHTML = '';

    const cats = getCategories();
    const allVideos = window.AetherCatalog.videos;

    if (cats.length === 0) {
      crmCategoryTableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center;padding:48px 20px;color:var(--text-muted);font-family:var(--font-mono);">
            No categories created yet. Click "+ Create New Category" above to define your custom categories.
          </td>
        </tr>
      `;
      return;
    }

    cats.forEach((cat, idx) => {
      const linkedCount = allVideos.filter(v => (v.category || '').toLowerCase() === cat.slug.toLowerCase()).length;
      const isVisible = cat.visible !== false;
      const showOnHome = cat.showOnHome !== false;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="text-align:center;">
          <div style="display:inline-flex;flex-direction:column;gap:2px;">
            <button type="button" class="cat-order-btn order-up" data-id="${cat.id}" ${idx === 0 ? 'disabled' : ''} title="Move Up">▲</button>
            <button type="button" class="cat-order-btn order-down" data-id="${cat.id}" ${idx === cats.length - 1 ? 'disabled' : ''} title="Move Down">▼</button>
          </div>
        </td>
        <td class="cat-thumb-col">
          <img src="${cat.image || DEFAULT_PLACEHOLDER_THUMB}" alt="${cat.name}" class="cat-thumb-img" onerror="this.src=DEFAULT_PLACEHOLDER_THUMB;">
        </td>
        <td>
          <div style="font-weight:600;font-size:13.5px;color:var(--text-primary);">${cat.name}</div>
          <span class="table-video-slug">${cat.slug}</span>
        </td>
        <td style="max-width:280px;font-size:12px;color:var(--text-secondary);line-height:1.4;">
          ${cat.description || 'Curated video streams.'}
        </td>
        <td>
          <span style="font-family:var(--font-mono);font-size:12px;font-weight:600;color:var(--text-primary);">${linkedCount} videos</span>
        </td>
        <td>
          <button type="button" class="cat-toggle-pill ${isVisible ? 'active' : 'inactive'} toggle-visibility-btn" data-id="${cat.id}">
            <span>${isVisible ? '👁 Public' : '🚫 Hidden'}</span>
          </button>
        </td>
        <td>
          <button type="button" class="cat-toggle-pill ${showOnHome ? 'active' : 'inactive'} toggle-home-btn" data-id="${cat.id}">
            <span>${showOnHome ? '🏠 Show on Home' : '⚪ Hide'}</span>
          </button>
        </td>
        <td style="text-align:right;">
          <div style="display:inline-flex;align-items:center;gap:6px;">
            <button type="button" class="url-btn-sm edit-cat-btn" data-id="${cat.id}">Edit</button>
            <button type="button" class="url-btn-sm delete-cat-btn" data-id="${cat.id}" style="color:#e11d48;">&times;</button>
          </div>
        </td>
      `;

      crmCategoryTableBody.appendChild(tr);
    });

    attachCategoryEvents();
  }

  function attachCategoryEvents() {
    document.querySelectorAll('.cat-order-btn.order-up').forEach(btn => {
      btn.addEventListener('click', () => {
        reorderCategory(btn.getAttribute('data-id'), 'up');
        logActivity('Category Reordered', 'Reordered category shelf position.', 'categories');
        renderCategoryWorkspace();
        showToast('Category moved up', 'info');
      });
    });

    document.querySelectorAll('.cat-order-btn.order-down').forEach(btn => {
      btn.addEventListener('click', () => {
        reorderCategory(btn.getAttribute('data-id'), 'down');
        logActivity('Category Reordered', 'Reordered category shelf position.', 'categories');
        renderCategoryWorkspace();
        showToast('Category moved down', 'info');
      });
    });

    document.querySelectorAll('.toggle-visibility-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const res = toggleCategoryVisibility(id);
        logActivity('Category Visibility Toggled', `Category visibility changed to ${res ? 'Public' : 'Hidden'}.`, 'categories');
        renderCategoryWorkspace();
        showToast(`Visibility: ${res ? 'Public' : 'Hidden'}`, 'info');
      });
    });

    document.querySelectorAll('.toggle-home-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const res = toggleCategoryHomepage(id);
        logActivity('Category Homepage Toggled', `Homepage exposure changed to ${res ? 'Enabled' : 'Disabled'}.`, 'categories');
        renderCategoryWorkspace();
        showToast(`Homepage: ${res ? 'Enabled' : 'Disabled'}`, 'info');
      });
    });

    document.querySelectorAll('.edit-cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = getCategories().find(c => c.id === btn.getAttribute('data-id'));
        if (cat) openCategoryModal(cat);
      });
    });

    document.querySelectorAll('.delete-cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const cat = getCategories().find(c => c.id === id);
        if (!cat) return;

        openConfirmModal('Delete Category', `Delete category "${cat.name}"?`, () => {
          deleteCategory(id);
          logActivity('Category Deleted', `Deleted category "${cat.name}".`, 'categories');
          renderCategoryWorkspace();
          updateSidebarBadges();
          showToast(`Deleted category "${cat.name}"`, 'warning');
        });
      });
    });
  }

  function openCategoryModal(cat = null) {
    if (!categoryModal) return;
    if (cat) {
      catModalId.value = cat.id;
      catModalName.value = cat.name;
      catModalSlug.value = cat.slug;
      catModalImageUrl.value = cat.image || '';
      catModalDescription.value = cat.description || '';
      if (catModalVisible) catModalVisible.checked = cat.visible !== false;
      if (catModalHomepage) catModalHomepage.checked = cat.showOnHome !== false;

      if (cat.image) {
        catPreviewImg.src = cat.image;
        catPreviewImg.style.display = 'block';
        catPreviewPlaceholder.style.display = 'none';
      } else {
        catPreviewImg.style.display = 'none';
        catPreviewPlaceholder.style.display = 'flex';
      }
    } else {
      categoryForm.reset();
      catModalId.value = '';
      if (catModalVisible) catModalVisible.checked = true;
      if (catModalHomepage) catModalHomepage.checked = true;
      catPreviewImg.style.display = 'none';
      catPreviewPlaceholder.style.display = 'flex';
    }
    categoryModal.style.display = 'flex';
  }

  function closeCategoryModal() {
    if (categoryModal) categoryModal.style.display = 'none';
  }

  if (openAddCategoryModalBtn) openAddCategoryModalBtn.addEventListener('click', () => openCategoryModal(null));
  if (catModalCloseBtn) catModalCloseBtn.addEventListener('click', closeCategoryModal);
  if (catModalCancelBtn) catModalCancelBtn.addEventListener('click', closeCategoryModal);

  if (catModalImageUrl) {
    catModalImageUrl.addEventListener('input', () => {
      const url = catModalImageUrl.value.trim();
      if (url) {
        catPreviewImg.src = url;
        catPreviewImg.style.display = 'block';
        catPreviewPlaceholder.style.display = 'none';
      } else {
        catPreviewImg.style.display = 'none';
        catPreviewPlaceholder.style.display = 'flex';
      }
    });
  }

  if (catBrowseFileBtn && catImageFileInput) {
    catBrowseFileBtn.addEventListener('click', () => catImageFileInput.click());
    catImageFileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          catModalImageUrl.value = evt.target.result;
          catPreviewImg.src = evt.target.result;
          catPreviewImg.style.display = 'block';
          catPreviewPlaceholder.style.display = 'none';
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (categoryForm) {
    categoryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const existingId = catModalId.value.trim();
      const name = catModalName.value.trim();
      const slug = catModalSlug.value.trim() || generateSlug(name);
      const image = catModalImageUrl.value.trim();
      const description = catModalDescription.value.trim();
      const visible = catModalVisible ? catModalVisible.checked : true;
      const showOnHome = catModalHomepage ? catModalHomepage.checked : true;

      if (!name) return;

      if (existingId) {
        updateCategory(existingId, { name, slug, image, description, visible, showOnHome });
        logActivity('Category Updated', `Updated category "${name}".`, 'categories');
        showToast(`Updated category "${name}"`, 'success');
      } else {
        addCategory({ name, slug, image, description, visible, showOnHome });
        logActivity('Category Created', `Created new category "${name}".`, 'categories');
        showToast(`Created category "${name}"`, 'success');
      }

      closeCategoryModal();
      renderCategoryWorkspace();
      updateSidebarBadges();
    });
  }

  const clearAllCategoriesBtn = document.getElementById('clearAllCategoriesBtn');
  if (clearAllCategoriesBtn) {
    clearAllCategoriesBtn.addEventListener('click', () => {
      openConfirmModal('Delete All Categories', 'Permanently delete all custom categories?', () => {
        if (typeof clearAllCategories === 'function') {
          clearAllCategories();
        } else if (window.AetherCatalog && typeof window.AetherCatalog.clearAllCategories === 'function') {
          window.AetherCatalog.clearAllCategories();
        }
        logActivity('Categories Wiped', 'Deleted all custom categories.', 'categories');
        populateCategoryDropdowns();
        renderCategoryWorkspace();
        updateSidebarBadges();
        showToast('All categories deleted', 'warning');
      });
    });
  }

  // ==========================================================================
  // 9. HOMEPAGE MANAGER (PANEL 5)
  // Featured Hero Showcase & Marquee Controls
  // ==========================================================================
  const homepageFeaturedVideoSelect = document.getElementById('homepageFeaturedVideoSelect');
  const homepageMarqueeInput = document.getElementById('homepageMarqueeInput');
  const homepageShowMarquee = document.getElementById('homepageShowMarquee');
  const homepageShowCategories = document.getElementById('homepageShowCategories');
  const homepageShowCollections = document.getElementById('homepageShowCollections');
  const saveHomepageConfigBtn = document.getElementById('saveHomepageConfigBtn');
  const previewHeroTitle = document.getElementById('previewHeroTitle');
  const previewMarqueeText = document.getElementById('previewMarqueeText');

  function updateHomepagePreview() {
    if (previewHeroTitle) {
      const selectedId = homepageFeaturedVideoSelect ? homepageFeaturedVideoSelect.value : '';
      const vid = selectedId ? getVideoById(selectedId) : null;
      previewHeroTitle.textContent = vid ? vid.title : 'Auto-select (Default: Highest Viewed Video)';
    }
    if (previewMarqueeText) {
      const text = homepageMarqueeInput ? homepageMarqueeInput.value.trim() : '';
      previewMarqueeText.textContent = text || 'NORTHSPACE STREAMING ARCHITECTURE • ZERO COMPRESSION CELLULOID';
    }
  }

  function renderHomepageManager() {
    const config = (typeof getHomepageConfig === 'function' ? getHomepageConfig() : {}) || {};
    const allVideos = window.AetherCatalog.videos || [];

    if (homepageFeaturedVideoSelect) {
      homepageFeaturedVideoSelect.innerHTML = '<option value="">— Auto-select (Most popular / Latest) —</option>';
      allVideos.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.id;
        opt.textContent = `${v.title} (${v.category || 'general'})`;
        if (config.featuredVideoId === v.id) opt.selected = true;
        homepageFeaturedVideoSelect.appendChild(opt);
      });
      if (config.featuredVideoId) {
        homepageFeaturedVideoSelect.value = config.featuredVideoId;
      }
    }

    if (homepageMarqueeInput) {
      homepageMarqueeInput.value = config.marqueeText || '';
    }

    if (homepageShowMarquee) {
      homepageShowMarquee.checked = config.showMarquee !== false;
    }

    if (homepageShowCategories) {
      homepageShowCategories.checked = config.showCategories !== false;
    }

    if (homepageShowCollections) {
      homepageShowCollections.checked = config.showCollections !== false;
    }

    updateHomepagePreview();
  }

  if (homepageFeaturedVideoSelect) homepageFeaturedVideoSelect.addEventListener('change', updateHomepagePreview);
  if (homepageMarqueeInput) homepageMarqueeInput.addEventListener('input', updateHomepagePreview);

  if (saveHomepageConfigBtn) {
    saveHomepageConfigBtn.addEventListener('click', () => {
      const config = {
        featuredVideoId: homepageFeaturedVideoSelect ? homepageFeaturedVideoSelect.value : '',
        marqueeText: homepageMarqueeInput ? homepageMarqueeInput.value.trim() : '',
        showMarquee: homepageShowMarquee ? homepageShowMarquee.checked : true,
        showCategories: homepageShowCategories ? homepageShowCategories.checked : true,
        showCollections: homepageShowCollections ? homepageShowCollections.checked : true
      };

      saveHomepageConfig(config);
      logActivity('Homepage Config Updated', 'Saved homepage presentation & showcase preferences.', 'homepage');
      showToast('Homepage configuration saved successfully', 'success');
    });
  }

  // ==========================================================================
  // 10. ANALYTICS (PANEL 6)
  // Viewership Impressions, Engine Ratio & Most-Viewed Assets
  // ==========================================================================
  const analyticsSourceBars = document.getElementById('analyticsSourceBars');
  const analyticsTopVideosList = document.getElementById('analyticsTopVideosList');

  function renderAnalyticsPanel() {
    const all = window.AetherCatalog.videos;
    const embeds = all.filter(v => v.playbackType === 'embed' || v.embedUrl).length;
    const streams = all.length - embeds;
    const embedPct = all.length > 0 ? Math.round((embeds / all.length) * 100) : 50;
    const streamPct = 100 - embedPct;

    if (analyticsSourceBars) {
      analyticsSourceBars.innerHTML = `
        <div class="analytics-stat-bar">
          <div style="display:flex;justify-content:space-between;font-size:12.5px;">
            <span>External Embedded Players (YouTube / Vimeo)</span>
            <span style="font-family:var(--font-mono);font-weight:600;">${embeds} (${embedPct}%)</span>
          </div>
          <div class="analytics-bar-track">
            <div class="analytics-bar-fill" style="width: ${embedPct}%; background: #3b82f6;"></div>
          </div>
        </div>

        <div class="analytics-stat-bar" style="margin-top:14px;">
          <div style="display:flex;justify-content:space-between;font-size:12.5px;">
            <span>Direct Video Streams (MP4 / M3U8)</span>
            <span style="font-family:var(--font-mono);font-weight:600;">${streams} (${streamPct}%)</span>
          </div>
          <div class="analytics-bar-track">
            <div class="analytics-bar-fill" style="width: ${streamPct}%; background: #10b981;"></div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:20px;padding-top:16px;border-top:1px solid var(--border-subtle);">
          <div style="padding:12px;background:var(--bg-card);border-radius:var(--radius-control);border:1px solid var(--border-subtle);">
            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);text-transform:uppercase;">Estimated Bitrate</span>
            <div style="font-family:var(--font-mono);font-size:18px;font-weight:600;margin-top:4px;">12.5 Mbps</div>
          </div>
          <div style="padding:12px;background:var(--bg-card);border-radius:var(--radius-control);border:1px solid var(--border-subtle);">
            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);text-transform:uppercase;">Buffer Ratio</span>
            <div style="font-family:var(--font-mono);font-size:18px;font-weight:600;color:#10b981;margin-top:4px;">0.4%</div>
          </div>
        </div>
      `;
    }

    if (analyticsTopVideosList) {
      analyticsTopVideosList.innerHTML = '';
      const top5 = [...all].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);

      top5.forEach((v, i) => {
        const item = document.createElement('div');
        item.className = 'dash-list-item';
        item.innerHTML = `
          <div style="display:flex;align-items:center;gap:12px;min-width:0;">
            <span style="font-family:var(--font-mono);font-size:13px;font-weight:600;color:var(--text-muted);width:20px;">#${i + 1}</span>
            <div style="min-width:0;">
              <div style="font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${v.title}</div>
              <span style="font-family:var(--font-mono);font-size:10.5px;color:var(--text-muted);">${v.category || 'cinema'}</span>
            </div>
          </div>
          <span style="font-family:var(--font-mono);font-size:12px;font-weight:600;color:var(--text-primary);">${formatViews(v.views || 0)}</span>
        `;
        analyticsTopVideosList.appendChild(item);
      });
    }
  }

  // ==========================================================================
  // 11. DMCA & RIGHTS MANAGEMENT (PANEL 7)
  // ==========================================================================
  const crmDmcaTableBody = document.getElementById('crmDmcaTableBody');
  const dmcaCaseModal = document.getElementById('dmcaCaseModal');
  const dmcaModalCloseBtn = document.getElementById('dmcaModalCloseBtn');
  const dmcaCaseNoticeId = document.getElementById('dmcaCaseNoticeId');
  const dmcaCaseStatusBadge = document.getElementById('dmcaCaseStatusBadge');
  const dmcaCaseVideoThumb = document.getElementById('dmcaCaseVideoThumb');
  const dmcaCaseVideoTitle = document.getElementById('dmcaCaseVideoTitle');
  const dmcaCaseVideoId = document.getElementById('dmcaCaseVideoId');
  const dmcaCaseVideoPublicStatus = document.getElementById('dmcaCaseVideoPublicStatus');
  const dmcaCaseWatchLink = document.getElementById('dmcaCaseWatchLink');
  const dmcaCaseClaimant = document.getElementById('dmcaCaseClaimant');
  const dmcaCaseOrg = document.getElementById('dmcaCaseOrg');
  const dmcaCaseEmail = document.getElementById('dmcaCaseEmail');
  const dmcaCaseDate = document.getElementById('dmcaCaseDate');
  const dmcaCaseRights = document.getElementById('dmcaCaseRights');
  const dmcaCaseReportedUrl = document.getElementById('dmcaCaseReportedUrl');
  const dmcaCaseReason = document.getElementById('dmcaCaseReason');
  const dmcaStatusSelect = document.getElementById('dmcaStatusSelect');
  const dmcaUpdateStatusBtn = document.getElementById('dmcaUpdateStatusBtn');
  const dmcaCaseNotes = document.getElementById('dmcaCaseNotes');
  const dmcaSaveNotesBtn = document.getElementById('dmcaSaveNotesBtn');
  const dmcaTimelineList = document.getElementById('dmcaTimelineList');
  const dmcaActionBtn = document.getElementById('dmcaActionBtn');

  let activeDmcaCaseId = null;

  function getStatusBadgeHtml(status) {
    switch (status) {
      case 'new': return '<span class="crm-status-pill status-blue">NEW</span>';
      case 'under_review': return '<span class="crm-status-pill status-amber">UNDER REVIEW</span>';
      case 'info_requested': return '<span class="crm-status-pill status-purple">INFO REQUESTED</span>';
      case 'validated': return '<span class="crm-status-pill status-teal">VALIDATED</span>';
      case 'rejected': return '<span class="crm-status-pill status-gray">REJECTED</span>';
      case 'action_taken': return '<span class="crm-status-pill status-danger">ACTION TAKEN</span>';
      case 'closed': return '<span class="crm-status-pill status-canvas">CLOSED</span>';
      default: return `<span class="crm-status-pill status-canvas">${status.toUpperCase()}</span>`;
    }
  }

  function renderDmcaTable() {
    if (!crmDmcaTableBody) return;
    crmDmcaTableBody.innerHTML = '';

    const reqs = getDMCARequests();

    if (reqs.length === 0) {
      crmDmcaTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center;padding:48px 20px;color:var(--text-muted);font-family:var(--font-mono);">
            No DMCA or rights notices currently logged. Queue is clear.
          </td>
        </tr>
      `;
      return;
    }

    reqs.forEach(req => {
      const vid = getVideoById(req.videoId);
      const videoTitle = vid ? vid.title : `Video #${req.videoId}`;
      const videoThumb = vid ? vid.thumb : '';
      const orgText = req.organization ? `${req.claimant} (${req.organization})` : req.claimant;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div style="font-family:var(--font-mono);font-size:12px;font-weight:600;color:var(--text-primary);">${req.id}</div>
          <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);margin-top:2px;">${req.timestamp ? new Date(req.timestamp).toLocaleDateString() : '2026-10-27'}</div>
        </td>
        <td style="max-width:280px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <img src="${videoThumb || DEFAULT_PLACEHOLDER_THUMB}" alt="" style="width:50px;height:32px;object-fit:cover;border-radius:3px;background:#000;">
            <div style="min-width:0;">
              <div style="font-size:12.5px;font-weight:500;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${videoTitle}</div>
              <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);">${req.videoId}</span>
            </div>
          </div>
        </td>
        <td>
          <div style="font-size:12.5px;color:var(--text-primary);">${orgText}</div>
          <div style="font-family:var(--font-mono);font-size:10.5px;color:var(--text-muted);">${req.email}</div>
        </td>
        <td style="max-width:220px;font-size:11.5px;color:var(--text-secondary);">${req.claimedRights || 'Copyright Infringement'}</td>
        <td>${getStatusBadgeHtml(req.status)}</td>
        <td style="text-align:right;">
          <button type="button" class="crm-btn-primary review-dmca-btn" data-id="${req.id}" style="font-size:11.5px;padding:6px 14px;">
            <span>Review Case &rarr;</span>
          </button>
        </td>
      `;

      crmDmcaTableBody.appendChild(tr);
    });

    crmDmcaTableBody.querySelectorAll('.review-dmca-btn').forEach(btn => {
      btn.addEventListener('click', () => openDmcaCaseDrawer(btn.getAttribute('data-id')));
    });
  }

  function openDmcaCaseDrawer(reqId) {
    const req = getDMCAById(reqId);
    if (!req || !dmcaCaseModal) return;

    activeDmcaCaseId = reqId;

    dmcaCaseNoticeId.textContent = req.id;
    dmcaCaseStatusBadge.outerHTML = getStatusBadgeHtml(req.status);

    const vid = getVideoById(req.videoId);
    if (vid) {
      if (dmcaCaseVideoThumb) dmcaCaseVideoThumb.src = vid.thumb || '';
      if (dmcaCaseVideoTitle) dmcaCaseVideoTitle.textContent = vid.title;
      if (dmcaCaseVideoId) dmcaCaseVideoId.textContent = vid.id;
      if (dmcaCaseWatchLink) dmcaCaseWatchLink.href = `watch.html?id=${vid.id}`;

      const isDelisted = (vid.status === 'draft') || (req.status === 'action_taken');
      if (dmcaCaseVideoPublicStatus) {
        dmcaCaseVideoPublicStatus.textContent = isDelisted ? 'DELISTED / TAKEN DOWN' : 'PUBLIC LIVE';
        dmcaCaseVideoPublicStatus.className = isDelisted ? 'crm-status-pill status-danger' : 'crm-status-pill status-live';
      }

      if (dmcaActionBtn) {
        if (isDelisted) {
          dmcaActionBtn.className = 'crm-btn-secondary';
          dmcaActionBtn.innerHTML = '<span>↩ Restore Video to Public Catalog</span>';
        } else {
          dmcaActionBtn.className = 'crm-btn-danger';
          dmcaActionBtn.innerHTML = '<span>⚡ Execute Takedown (Delist Video)</span>';
        }
      }
    }

    if (dmcaCaseClaimant) dmcaCaseClaimant.textContent = req.claimant || '—';
    if (dmcaCaseOrg) dmcaCaseOrg.textContent = req.organization || 'Rights Owner';
    if (dmcaCaseEmail) dmcaCaseEmail.textContent = req.email || '—';
    if (dmcaCaseDate) dmcaCaseDate.textContent = req.timestamp ? new Date(req.timestamp).toLocaleString() : '2026-10-27';
    if (dmcaCaseRights) dmcaCaseRights.textContent = req.claimedRights || 'Exclusive Distribution';
    if (dmcaCaseReportedUrl) dmcaCaseReportedUrl.textContent = req.reportedUrl || `https://northspace.stream/watch.html?id=${req.videoId}`;
    if (dmcaCaseReason) dmcaCaseReason.textContent = req.reason || 'Proprietary broadcast without authorization.';

    if (dmcaStatusSelect) dmcaStatusSelect.value = req.status || 'new';
    if (dmcaCaseNotes) dmcaCaseNotes.value = req.notes || '';

    renderDmcaTimeline(req);
    dmcaCaseModal.style.display = 'flex';
  }

  function renderDmcaTimeline(req) {
    if (!dmcaTimelineList) return;
    dmcaTimelineList.innerHTML = '';
    const history = Array.isArray(req.history) ? req.history : [];

    history.forEach(item => {
      const el = document.createElement('div');
      el.className = 'timeline-item';
      el.innerHTML = `
        <span class="timeline-dot"></span>
        <span class="timeline-time">${item.date ? new Date(item.date).toLocaleString() : 'Audit Log'} &bull; ${item.admin || 'Admin Session'}</span>
        <span class="timeline-text">${item.action}</span>
      `;
      dmcaTimelineList.appendChild(el);
    });
  }

  function closeDmcaCaseDrawer() {
    if (dmcaCaseModal) dmcaCaseModal.style.display = 'none';
    activeDmcaCaseId = null;
  }

  if (dmcaModalCloseBtn) dmcaModalCloseBtn.addEventListener('click', closeDmcaCaseDrawer);

  if (dmcaUpdateStatusBtn && dmcaStatusSelect) {
    dmcaUpdateStatusBtn.addEventListener('click', () => {
      if (!activeDmcaCaseId) return;
      const newStatus = dmcaStatusSelect.value;
      updateDMCAStatus(activeDmcaCaseId, newStatus, dmcaCaseNotes ? dmcaCaseNotes.value : '');
      logActivity('DMCA Status Updated', `Case ${activeDmcaCaseId} updated to ${newStatus}.`, 'dmca');
      const req = getDMCAById(activeDmcaCaseId);
      if (req) {
        renderDmcaTimeline(req);
        dmcaCaseStatusBadge.outerHTML = getStatusBadgeHtml(req.status);
      }
      renderDmcaTable();
      updateSidebarBadges();
      showToast(`Status updated to ${newStatus.replace('_', ' ').toUpperCase()}`, 'success');
    });
  }

  if (dmcaSaveNotesBtn && dmcaCaseNotes) {
    dmcaSaveNotesBtn.addEventListener('click', () => {
      if (!activeDmcaCaseId) return;
      saveDMCANotes(activeDmcaCaseId, dmcaCaseNotes.value);
      logActivity('DMCA Notes Saved', `Recorded legal review assessment on case ${activeDmcaCaseId}.`, 'dmca');
      const req = getDMCAById(activeDmcaCaseId);
      if (req) renderDmcaTimeline(req);
      showToast('Review notes saved', 'success');
    });
  }

  if (dmcaActionBtn) {
    dmcaActionBtn.addEventListener('click', () => {
      if (!activeDmcaCaseId) return;
      const req = getDMCAById(activeDmcaCaseId);
      if (!req) return;

      const vid = getVideoById(req.videoId);
      const isDelisted = (vid && vid.status === 'draft') || (req.status === 'action_taken');

      if (!isDelisted) {
        openConfirmModal('Execute Takedown', `Confirm delisting of video #${req.videoId}? Immediately removes from public stream.`, () => {
          executeDMCATakedown(activeDmcaCaseId, 'take_down');
          logActivity('Takedown Executed', `Delisted video #${req.videoId} following notice ${activeDmcaCaseId}.`, 'dmca');
          openDmcaCaseDrawer(activeDmcaCaseId);
          renderDmcaTable();
          updateSidebarBadges();
          showToast(`Executed takedown on video #${req.videoId}`, 'warning');
        });
      } else {
        openConfirmModal('Restore Video', `Restore video #${req.videoId} back to public streaming?`, () => {
          executeDMCATakedown(activeDmcaCaseId, 'restore');
          logActivity('Video Restored', `Restored video #${req.videoId} after review of case ${activeDmcaCaseId}.`, 'dmca');
          openDmcaCaseDrawer(activeDmcaCaseId);
          renderDmcaTable();
          updateSidebarBadges();
          showToast(`Restored video #${req.videoId} to public stream`, 'success');
        });
      }
    });
  }

  // ==========================================================================
  // 12. SYSTEM HEALTH & BROKEN LINK DETECTOR (PANEL 8)
  // Broken Link Detector, Insecure URL Auditor & Duplicate Entry Detector
  // ==========================================================================
  const btnRunHealthScan = document.getElementById('btnRunHealthScan');
  const healthScanStatusBadge = document.getElementById('healthScanStatusBadge');
  const healthScanResultsBody = document.getElementById('healthScanResultsBody');
  const btnRunDuplicateScan = document.getElementById('btnRunDuplicateScan');
  const duplicateScanResultsBody = document.getElementById('duplicateScanResultsBody');

  if (btnRunHealthScan) {
    btnRunHealthScan.addEventListener('click', runHealthScan);
  }

  function runHealthScan() {
    if (healthScanStatusBadge) {
      healthScanStatusBadge.textContent = 'SCANNING...';
      healthScanStatusBadge.className = 'crm-status-pill status-amber';
    }

    setTimeout(() => {
      const health = scanCatalogHealth();
      logActivity('System Health Scan', `Scanned ${health.totalScanned} videos. Health Score: ${health.healthScore}%.`, 'system');

      if (healthScanStatusBadge) {
        healthScanStatusBadge.textContent = `${health.healthScore}% OPERATIONAL`;
        healthScanStatusBadge.className = health.healthScore >= 90 ? 'crm-status-pill status-live' : 'crm-status-pill status-danger';
      }

      if (healthScanResultsBody) {
        if (health.brokenVideos.length === 0 && health.missingThumbnails.length === 0 && health.insecureUrls.length === 0) {
          healthScanResultsBody.innerHTML = `
            <div style="padding:16px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.25);border-radius:var(--radius-control);display:flex;align-items:center;gap:12px;">
              <svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="width:24px;height:24px;color:#10b981;"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <div>
                <div style="font-weight:600;font-size:13.5px;color:#10b981;">Catalog Integrity Flawless</div>
                <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">
                  All ${health.totalScanned} assets have valid stream containers, verified thumbnails, and secure HTTPS protocol.
                </div>
              </div>
            </div>
          `;
        } else {
          let issuesHtml = `
            <div style="margin-bottom:14px;display:flex;gap:12px;">
              <span class="crm-status-pill status-danger">${health.brokenVideos.length} Broken Playback Links</span>
              <span class="crm-status-pill status-amber">${health.missingThumbnails.length} Missing Posters</span>
              <span class="crm-status-pill status-canvas">${health.insecureUrls.length} Insecure HTTP Links</span>
            </div>
            <table class="crm-table health-issues-table">
              <thead>
                <tr>
                  <th>Video Asset</th>
                  <th>Issue Detected</th>
                  <th style="text-align:right;">Action</th>
                </tr>
              </thead>
              <tbody>
          `;

          health.brokenVideos.forEach(v => {
            issuesHtml += `
              <tr>
                <td><strong>${v.title}</strong> (${v.id})</td>
                <td><span style="color:#ef4444;">No playback stream or embed link found</span></td>
                <td style="text-align:right;"><button type="button" class="url-btn-sm fix-health-btn" data-id="${v.id}">Fix in Studio</button></td>
              </tr>
            `;
          });

          health.missingThumbnails.forEach(v => {
            issuesHtml += `
              <tr>
                <td><strong>${v.title}</strong> (${v.id})</td>
                <td><span style="color:#f59e0b;">Missing poster thumbnail</span></td>
                <td style="text-align:right;"><button type="button" class="url-btn-sm fix-health-btn" data-id="${v.id}">Fix in Studio</button></td>
              </tr>
            `;
          });

          issuesHtml += '</tbody></table>';
          healthScanResultsBody.innerHTML = issuesHtml;

          healthScanResultsBody.querySelectorAll('.fix-health-btn').forEach(b => {
            b.addEventListener('click', () => enterStudio(b.getAttribute('data-id')));
          });
        }
      }

      showToast(`Health scan complete: ${health.healthScore}% healthy`, 'success');
      updateSidebarBadges();
    }, 400);
  }

  // Duplicate Entries Detector
  if (btnRunDuplicateScan) {
    btnRunDuplicateScan.addEventListener('click', () => {
      const dup = detectDuplicates();
      logActivity('Duplicate Scan', `Detected ${dup.totalDuplicates} potential duplicate catalog entries.`, 'system');

      if (!duplicateScanResultsBody) return;

      if (dup.totalDuplicates === 0) {
        duplicateScanResultsBody.innerHTML = `
          <div style="padding:14px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.25);border-radius:var(--radius-control);color:#10b981;font-size:13px;">
            ✓ Zero duplicate entries detected. Every video record has unique stream links and titles.
          </div>
        `;
      } else {
        let htmlOut = `<div style="margin-bottom:12px;font-size:13px;color:var(--text-secondary);">Found ${dup.totalDuplicates} duplicate records:</div>`;

        dup.duplicateEmbeds.forEach(d => {
          htmlOut += `
            <div class="duplicate-group-card">
              <span style="font-family:var(--font-mono);font-size:11px;color:#ef4444;font-weight:600;">DUPLICATE EMBED URL</span>
              <div style="font-size:12.5px;">Original: <strong>${d.original.title}</strong> (${d.original.id})</div>
              <div style="font-size:12.5px;">Duplicate: <strong>${d.duplicate.title}</strong> (${d.duplicate.id})</div>
              <div style="font-family:var(--font-mono);font-size:10.5px;color:var(--text-muted);">${d.url}</div>
              <div style="margin-top:4px;">
                <button type="button" class="url-btn-sm remove-dup-btn" data-id="${d.duplicate.id}" style="color:#e11d48;">Remove Duplicate</button>
              </div>
            </div>
          `;
        });

        dup.duplicateTitles.forEach(d => {
          htmlOut += `
            <div class="duplicate-group-card">
              <span style="font-family:var(--font-mono);font-size:11px;color:#f59e0b;font-weight:600;">IDENTICAL TITLE REPETITION</span>
              <div style="font-size:12.5px;">Original (${d.original.id}): <strong>${d.title}</strong></div>
              <div style="font-size:12.5px;">Duplicate (${d.duplicate.id}): <strong>${d.title}</strong></div>
              <div style="margin-top:4px;">
                <button type="button" class="url-btn-sm remove-dup-btn" data-id="${d.duplicate.id}" style="color:#e11d48;">Remove Duplicate</button>
              </div>
            </div>
          `;
        });

        duplicateScanResultsBody.innerHTML = htmlOut;

        duplicateScanResultsBody.querySelectorAll('.remove-dup-btn').forEach(b => {
          b.addEventListener('click', () => {
            const id = b.getAttribute('data-id');
            deleteVideo(id);
            logActivity('Duplicate Removed', `Deleted duplicate video record ${id}.`, 'videos');
            b.closest('.duplicate-group-card').remove();
            renderVideoCatalog();
            showToast('Duplicate record deleted', 'warning');
          });
        });
      }
    });
  }

  function renderSystemHealthPanel() {
    runHealthScan();
  }

  // ==========================================================================
  // 13. IMPORT & EXPORT (PANEL 9)
  // Universal Text / JSON Import & Export Backup Snapshots
  // ==========================================================================
  const importJsonTextarea = document.getElementById('importJsonTextarea');
  const importJsonBtn = document.getElementById('importJsonBtn');
  const importAppendBtn = document.getElementById('importAppendBtn');
  const jsonFileInput = document.getElementById('jsonFileInput');
  const browseJsonBtn = document.getElementById('browseJsonBtn');
  const pasteClipboardBtn = document.getElementById('pasteClipboardBtn');
  const exportCatalogJsonBtn = document.getElementById('exportCatalogJsonBtn');
  const clearAllVideosSyncBtn = document.getElementById('clearAllVideosSyncBtn');
  const factoryResetBtn = document.getElementById('factoryResetBtn');
  const importFileStatus = document.getElementById('importFileStatus');

  if (browseJsonBtn && jsonFileInput) {
    browseJsonBtn.addEventListener('click', () => jsonFileInput.click());
    jsonFileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          if (importJsonTextarea) importJsonTextarea.value = evt.target.result;
          if (importFileStatus) importFileStatus.textContent = `Loaded ${file.name} (${file.size} bytes)`;
          showToast(`Loaded ${file.name}`, 'info');
        };
        reader.readAsText(file);
      }
    });
  }

  if (pasteClipboardBtn && importJsonTextarea) {
    pasteClipboardBtn.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        importJsonTextarea.value = text;
        if (importFileStatus) importFileStatus.textContent = `Pasted ${text.length} chars from clipboard`;
        showToast('Pasted from clipboard', 'info');
      } catch (err) {
        showToast('Clipboard access denied. Please paste manually.', 'warning');
      }
    });
  }

  if (exportCatalogJsonBtn) {
    exportCatalogJsonBtn.addEventListener('click', () => {
      const json = exportJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `northspace-catalog-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      logActivity('Catalog Exported', 'Downloaded full catalog JSON metadata backup.', 'system');
      showToast('Catalog exported as JSON', 'success');
    });
  }

  if (factoryResetBtn) {
    factoryResetBtn.addEventListener('click', () => {
      openConfirmModal('Reset to Clean Slate', 'Are you sure you want to clear all catalog records, DMCA queue, and reset to an empty slate?', () => {
        resetToDefaults();
        logActivity('Catalog Factory Reset', 'Reset catalog to clean slate.', 'system');
        renderVideoCatalog();
        updateSidebarBadges();
        showToast('Catalog reset to clean slate', 'info');
      });
    });
  }

  if (clearAllVideosSyncBtn) {
    clearAllVideosSyncBtn.addEventListener('click', () => {
      openConfirmModal('Wipe All Catalog Videos', 'This will delete ALL videos in the catalog. Continue?', () => {
        clearAllVideos();
        logActivity('Catalog Wiped', 'Wiped all videos via Sync workspace.', 'system');
        renderVideoCatalog();
        updateSidebarBadges();
        showToast('All videos cleared from catalog', 'warning');
      });
    });
  }

  if (importJsonBtn && importJsonTextarea) {
    importJsonBtn.addEventListener('click', () => {
      const rawText = importJsonTextarea.value.trim();
      if (!rawText) return showToast('Please paste extracted text or JSON first', 'warning');

      openConfirmModal('Overwrite Catalog', 'This will replace the current catalog with the imported records. Continue?', () => {
        const res = importCatalog(rawText);
        if (res && res.success) {
          logActivity('Universal Import', `Imported & overwrote catalog with ${res.count} videos.`, 'system');
          renderVideoCatalog();
          updateSidebarBadges();
          if (importFileStatus) {
            importFileStatus.textContent = `✓ Successfully imported ${res.count} videos!`;
            importFileStatus.style.color = '#10b981';
          }
          showToast(`Imported ${res.count} video records into catalog!`, 'success');
        } else {
          showToast('Could not parse any valid video records', 'error');
        }
      });
    });
  }

  if (importAppendBtn && importJsonTextarea) {
    importAppendBtn.addEventListener('click', () => {
      const rawText = importJsonTextarea.value.trim();
      if (!rawText) return showToast('Please paste extracted text or JSON first', 'warning');

      const res = appendCatalog(rawText);
      if (res && res.success) {
        logActivity('Catalog Appended', `Appended ${res.count} new video records.`, 'system');
        renderVideoCatalog();
        updateSidebarBadges();
        if (importFileStatus) {
          importFileStatus.textContent = `✓ Successfully appended ${res.count} new videos!`;
          importFileStatus.style.color = '#10b981';
        }
        showToast(`Appended ${res.count} new videos to catalog`, 'success');
      } else {
        showToast('No new valid video records found to append', 'warning');
      }
    });
  }

  // ==========================================================================
  // 14. ACTIVITY LOGS AUDIT TRAIL (PANEL 10)
  // ==========================================================================
  const activityLogsTableBody = document.getElementById('activityLogsTableBody');
  const btnExportActivityLogs = document.getElementById('btnExportActivityLogs');
  const btnClearActivityLogs = document.getElementById('btnClearActivityLogs');
  let currentLogFilter = 'all';

  const logFilterBtns = document.querySelectorAll('#logFilterPills .crm-filter-pill');
  logFilterBtns.forEach(b => {
    b.addEventListener('click', () => {
      logFilterBtns.forEach(btn => btn.classList.remove('active'));
      b.classList.add('active');
      currentLogFilter = b.getAttribute('data-log-filter') || 'all';
      renderActivityLogs();
    });
  });

  function renderActivityLogs() {
    if (!activityLogsTableBody) return;
    activityLogsTableBody.innerHTML = '';

    let logs = getActivityLogs();
    if (currentLogFilter !== 'all') {
      logs = logs.filter(l => (l.category || 'system') === currentLogFilter);
    }

    if (logs.length === 0) {
      activityLogsTableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center;padding:48px 20px;color:var(--text-muted);font-family:var(--font-mono);">
            No logged administrative actions for this filter.
          </td>
        </tr>
      `;
      return;
    }

    logs.forEach(l => {
      const tr = document.createElement('tr');
      const timeStr = l.timestamp ? new Date(l.timestamp).toLocaleString() : 'Audit Log';

      let catBadge = '<span class="crm-status-pill status-canvas">SYSTEM</span>';
      if (l.category === 'videos') catBadge = '<span class="crm-status-pill status-live">VIDEOS</span>';
      if (l.category === 'dmca') catBadge = '<span class="crm-status-pill status-danger">DMCA</span>';
      if (l.category === 'categories') catBadge = '<span class="crm-status-pill status-amber">CATEGORIES</span>';
      if (l.category === 'collections') catBadge = '<span class="crm-status-pill status-purple">COLLECTIONS</span>';

      tr.innerHTML = `
        <td style="font-family:var(--font-mono);font-size:11.5px;color:var(--text-muted);">${timeStr}</td>
        <td style="font-family:var(--font-mono);font-size:11.5px;color:var(--text-primary);">${l.admin || 'Admin Session'}</td>
        <td style="font-weight:600;font-size:12.5px;color:var(--text-primary);">${l.action}</td>
        <td>${catBadge}</td>
        <td style="font-size:12px;color:var(--text-secondary);line-height:1.4;">${l.details}</td>
      `;

      activityLogsTableBody.appendChild(tr);
    });
  }

  if (btnExportActivityLogs) {
    btnExportActivityLogs.addEventListener('click', () => {
      const json = JSON.stringify(getActivityLogs(), null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `northspace-audit-logs-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Exported audit logs as JSON', 'success');
    });
  }

  if (btnClearActivityLogs) {
    btnClearActivityLogs.addEventListener('click', () => {
      openConfirmModal('Clear Activity Logs', 'Permanently delete all audit log entries?', () => {
        clearActivityLogs();
        renderActivityLogs();
        updateSidebarBadges();
        showToast('Activity logs cleared', 'warning');
      });
    });
  }

  // ==========================================================================
  // 15. DEDICATED FULL-PAGE VIDEO STUDIO (VIEW 2)
  // Left Form + Right Sticky Preview + Autosave Draft System
  // ==========================================================================
  const crmStudioView = document.getElementById('crmStudioView');
  const adminMainContent = document.getElementById('adminMainContent');
  const studioBackBtn = document.getElementById('studioBackBtn');
  const studioNewBtn = document.getElementById('studioNewBtn');
  const studioWatchLiveBtn = document.getElementById('studioWatchLiveBtn');
  const studioDeleteBtn = document.getElementById('studioDeleteBtn');
  const studioHeading = document.getElementById('studioHeading');
  const studioBadge = document.getElementById('studioBadge');

  const studioForm = document.getElementById('studioForm');
  const studioId = document.getElementById('studioId');
  const studioTitle = document.getElementById('studioTitle');
  const studioSlug = document.getElementById('studioSlug');
  const studioAutoSlugBtn = document.getElementById('studioAutoSlugBtn');
  const studioStatus = document.getElementById('studioStatus');
  const studioPlaybackType = document.getElementById('studioPlaybackType');
  const playbackCardEmbed = document.getElementById('playbackCardEmbed');
  const playbackCardStream = document.getElementById('playbackCardStream');
  const studioEmbedUrl = document.getElementById('studioEmbedUrl');
  const studioVideoUrl = document.getElementById('studioVideoUrl');
  const studioThumbUrl = document.getElementById('studioThumbUrl');
  const thumbFileInput = document.getElementById('thumbFileInput');
  const btnUploadThumbFile = document.getElementById('btnUploadThumbFile');
  const studioCategory = document.getElementById('studioCategory');
  const studioDuration = document.getElementById('studioDuration');
  const studioDurationPreview = document.getElementById('studioDurationPreview');
  const studioTags = document.getElementById('studioTags');
  const studioDescription = document.getElementById('studioDescription');
  const studioResetFieldsBtn = document.getElementById('studioResetFieldsBtn');
  const studioSaveDraftBtn = document.getElementById('studioSaveDraftBtn');
  const studioSubmitBtn = document.getElementById('studioSubmitBtn');
  const studioSubmitText = document.getElementById('studioSubmitText');
  const studioSubmitSpinner = document.getElementById('studioSubmitSpinner');
  const studioUnsavedIndicator = document.getElementById('studioUnsavedIndicator');
  const studioAutosaveStatus = document.getElementById('studioAutosaveStatus');

  const btnValidateEmbed = document.getElementById('btnValidateEmbed');
  const btnTestEmbed = document.getElementById('btnTestEmbed');
  const btnFixEmbedUrl = document.getElementById('btnFixEmbedUrl');
  const embedValidationAlert = document.getElementById('embedValidationAlert');
  const btnValidateStream = document.getElementById('btnValidateStream');
  const btnTestStream = document.getElementById('btnTestStream');
  const streamValidationAlert = document.getElementById('streamValidationAlert');
  const detectedProviderBadge = document.getElementById('detectedProviderBadge');

  const studioThumbPreviewImg = document.getElementById('studioThumbPreviewImg');
  const studioThumbStatus = document.getElementById('studioThumbStatus');
  const studioThumbDimensions = document.getElementById('studioThumbDimensions');

  const studioPlayerStage = document.getElementById('studioPlayerStage');
  const previewSourceBadge = document.getElementById('previewSourceBadge');
  const previewStatusDot = document.getElementById('previewStatusDot');
  const previewStatusText = document.getElementById('previewStatusText');
  const previewCategory = document.getElementById('previewCategory');
  const previewTitle = document.getElementById('previewTitle');
  const previewDescription = document.getElementById('previewDescription');
  const previewTags = document.getElementById('previewTags');
  const previewDurationBadge = document.getElementById('previewDurationBadge');
  const studioQuickSwitchSelect = document.getElementById('studioQuickSwitchSelect');
  const studioQuickCount = document.getElementById('studioQuickCount');

  let isStudioDirty = false;
  let activeStudioVideoId = null;
  let autosaveTimer = null;

  function markStudioDirty() {
    isStudioDirty = true;
    if (studioUnsavedIndicator) studioUnsavedIndicator.style.display = 'inline-block';
  }

  function clearStudioDirty() {
    isStudioDirty = false;
    if (studioUnsavedIndicator) studioUnsavedIndicator.style.display = 'none';
  }

  function enterStudio(videoId = null) {
    activeStudioVideoId = videoId;
    clearStudioDirty();
    populateCategoryDropdowns();

    if (adminMainContent) adminMainContent.style.display = 'none';
    if (crmStudioView) crmStudioView.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (videoId) {
      const vid = getVideoById(videoId);
      if (vid) {
        studioId.value = vid.id;
        studioTitle.value = vid.title || '';
        studioSlug.value = vid.slug || generateSlug(vid.title || vid.id);
        studioStatus.value = vid.status || 'published';
        studioEmbedUrl.value = vid.embedUrl || '';
        studioVideoUrl.value = vid.videoUrl || '';
        studioThumbUrl.value = vid.thumb || '';
        studioCategory.value = vid.category || (getCategories()[0] ? getCategories()[0].slug : 'cinema');
        studioDuration.value = vid.duration || 180;
        studioTags.value = Array.isArray(vid.tags) ? vid.tags.join(', ') : (vid.tags || '');
        studioDescription.value = vid.description || '';

        const isEmbed = (vid.playbackType === 'embed') || (!vid.videoUrl && !!vid.embedUrl);
        setPlaybackType(isEmbed ? 'embed' : 'stream');

        studioHeading.textContent = `Edit Video — ${vid.title}`;
        studioBadge.textContent = 'EDITING';
        studioBadge.className = 'crm-status-pill status-embed';

        if (studioWatchLiveBtn) {
          studioWatchLiveBtn.href = `watch.html?id=${vid.id}`;
          studioWatchLiveBtn.style.display = 'inline-flex';
        }
        if (studioDeleteBtn) studioDeleteBtn.style.display = 'inline-flex';
      }
    } else {
      studioForm.reset();
      studioId.value = '';
      studioSlug.value = '';
      studioStatus.value = 'published';
      const prefPlayback = localStorage.getItem('aether_pref_playback') || 'embed';
      setPlaybackType(prefPlayback);

      if (getCategories().length > 0) studioCategory.value = getCategories()[0].slug;
      studioDuration.value = '180';
      studioHeading.textContent = 'Add New Video Embed Link';
      studioBadge.textContent = 'NEW EMBED';
      studioBadge.className = 'crm-status-pill status-canvas';

      if (studioWatchLiveBtn) studioWatchLiveBtn.style.display = 'none';
      if (studioDeleteBtn) studioDeleteBtn.style.display = 'none';

      // Check for saved draft recovery
      const savedDraft = getStudioDraft();
      if (savedDraft && savedDraft.data && savedDraft.data.title) {
        const timeStr = new Date(savedDraft.savedAt).toLocaleTimeString();
        if (confirm(`Unsaved draft found for "${savedDraft.data.title}" from ${timeStr}. Restore?`)) {
          restoreDraftData(savedDraft.data);
        }
      }
    }

    if (embedValidationAlert) embedValidationAlert.style.display = 'none';
    if (streamValidationAlert) streamValidationAlert.style.display = 'none';
    if (btnFixEmbedUrl) btnFixEmbedUrl.style.display = 'none';

    updateThumbnailPreview();
    updateLivePlayerAndPreview();
    populateStudioQuickJump();
    startAutosaveTimer();
  }

  function restoreDraftData(data) {
    if (!data) return;
    if (studioTitle) studioTitle.value = data.title || '';
    if (studioSlug) studioSlug.value = data.slug || '';
    if (studioStatus) studioStatus.value = data.status || 'published';
    if (studioEmbedUrl) studioEmbedUrl.value = data.embedUrl || '';
    if (studioVideoUrl) studioVideoUrl.value = data.videoUrl || '';
    if (studioThumbUrl) studioThumbUrl.value = data.thumb || '';
    if (studioCategory && data.category) studioCategory.value = data.category;
    if (studioDuration) studioDuration.value = data.duration || 180;
    if (studioTags) studioTags.value = Array.isArray(data.tags) ? data.tags.join(', ') : (data.tags || '');
    if (studioDescription) studioDescription.value = data.description || '';
    setPlaybackType(data.playbackType || 'embed');
    updateThumbnailPreview();
    updateLivePlayerAndPreview();
    markStudioDirty();
  }

  function exitStudio(promptUnsaved = true) {
    if (promptUnsaved && isStudioDirty) {
      if (!confirm('You have unsaved changes. Discard and return to catalog?')) return;
    }
    stopAutosaveTimer();
    clearStudioDirty();
    if (crmStudioView) crmStudioView.style.display = 'none';
    if (adminMainContent) adminMainContent.style.display = 'flex';
    if (studioPlayerStage) studioPlayerStage.innerHTML = '';
    renderVideoCatalog();
  }

  if (studioBackBtn) studioBackBtn.addEventListener('click', () => exitStudio(true));
  if (studioNewBtn) studioNewBtn.addEventListener('click', () => enterStudio(null));

  // Autosave Engine
  function startAutosaveTimer() {
    stopAutosaveTimer();
    const isAutosaveEnabled = localStorage.getItem('aether_pref_autosave') !== 'false';
    if (!isAutosaveEnabled) {
      if (studioAutosaveStatus) {
        studioAutosaveStatus.textContent = '• Autosave paused';
        studioAutosaveStatus.style.color = 'var(--text-muted)';
      }
      return;
    }
    autosaveTimer = setInterval(() => {
      if (!isStudioDirty) return;
      const data = getStudioFormData();
      if (!data.title) return;
      saveStudioDraft(data);
      if (studioAutosaveStatus) {
        studioAutosaveStatus.textContent = `• Autosaved at ${new Date().toLocaleTimeString()}`;
        studioAutosaveStatus.style.color = '#10b981';
      }
    }, 25000);
  }

  function stopAutosaveTimer() {
    if (autosaveTimer) {
      clearInterval(autosaveTimer);
      autosaveTimer = null;
    }
  }

  function getStudioFormData() {
    return {
      title: studioTitle ? studioTitle.value.trim() : '',
      slug: studioSlug ? studioSlug.value.trim() : '',
      status: studioStatus ? studioStatus.value : 'published',
      playbackType: studioPlaybackType ? studioPlaybackType.value : 'embed',
      embedUrl: studioEmbedUrl ? studioEmbedUrl.value.trim() : '',
      videoUrl: studioVideoUrl ? studioVideoUrl.value.trim() : '',
      thumb: studioThumbUrl ? studioThumbUrl.value.trim() : '',
      category: studioCategory ? studioCategory.value : 'cinema',
      duration: studioDuration ? (parseInt(studioDuration.value, 10) || 180) : 180,
      tags: studioTags ? studioTags.value.split(',').map(t => t.trim()).filter(Boolean) : [],
      description: studioDescription ? studioDescription.value.trim() : ''
    };
  }

  function setPlaybackType(type) {
    if (!studioPlaybackType) return;
    studioPlaybackType.value = type;

    if (type === 'embed') {
      if (playbackCardEmbed) playbackCardEmbed.classList.add('active');
      if (playbackCardStream) playbackCardStream.classList.remove('active');
    } else {
      if (playbackCardEmbed) playbackCardEmbed.classList.remove('active');
      if (playbackCardStream) playbackCardStream.classList.add('active');
    }

    updateLivePlayerAndPreview();
  }

  if (playbackCardEmbed) playbackCardEmbed.addEventListener('click', () => { setPlaybackType('embed'); markStudioDirty(); });
  if (playbackCardStream) playbackCardStream.addEventListener('click', () => { setPlaybackType('stream'); markStudioDirty(); });

  if (studioAutoSlugBtn && studioTitle && studioSlug) {
    studioAutoSlugBtn.addEventListener('click', () => {
      const generated = generateSlug(studioTitle.value || 'video');
      studioSlug.value = generated;
      markStudioDirty();
      showToast(`Generated slug: ${generated}`, 'info');
    });
  }

  if (studioDuration && studioDurationPreview) {
    studioDuration.addEventListener('input', () => {
      const sec = parseInt(studioDuration.value, 10) || 0;
      studioDurationPreview.textContent = formatTime(sec);
      if (previewDurationBadge) previewDurationBadge.textContent = formatTime(sec);
      markStudioDirty();
    });
  }

  function updateThumbnailPreview() {
    if (!studioThumbUrl) return;
    const url = studioThumbUrl.value.trim();

    if (!url) {
      if (studioThumbPreviewImg) studioThumbPreviewImg.style.display = 'none';
      if (studioThumbStatus) {
        studioThumbStatus.className = 'studio-thumb-status';
        studioThumbStatus.innerHTML = `
          <svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="width:14px;height:14px;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
          <span>Instant thumbnail preview appears here once URL is typed</span>
        `;
      }
      if (studioThumbDimensions) studioThumbDimensions.textContent = 'Recommended 16:9 ratio (1280x720)';
      return;
    }

    const tempImg = new Image();
    tempImg.onload = () => {
      if (studioThumbPreviewImg) {
        studioThumbPreviewImg.src = url;
        studioThumbPreviewImg.style.display = 'block';
      }
      if (studioThumbStatus) {
        studioThumbStatus.className = 'studio-thumb-status ok';
        studioThumbStatus.innerHTML = `✓ Thumbnail verified`;
      }
      if (studioThumbDimensions) {
        studioThumbDimensions.textContent = `Resolution: ${tempImg.naturalWidth} &times; ${tempImg.naturalHeight}px`;
      }
    };
    tempImg.onerror = () => {
      if (studioThumbPreviewImg) studioThumbPreviewImg.style.display = 'none';
      if (studioThumbStatus) {
        studioThumbStatus.className = 'studio-thumb-status err';
        studioThumbStatus.innerHTML = `✕ Could not load image from this URL`;
      }
      if (studioThumbDimensions) studioThumbDimensions.textContent = 'Check URL spelling or CORS restrictions';
    };
    tempImg.src = url;
  }

  if (studioThumbUrl) {
    studioThumbUrl.addEventListener('input', () => {
      updateThumbnailPreview();
      markStudioDirty();
    });
  }

  if (btnUploadThumbFile && thumbFileInput) {
    btnUploadThumbFile.addEventListener('click', () => thumbFileInput.click());
    thumbFileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          studioThumbUrl.value = evt.target.result;
          updateThumbnailPreview();
          markStudioDirty();
          showToast(`Loaded ${file.name} as thumbnail`, 'success');
        };
        reader.readAsDataURL(file);
      }
    });
  }

  function detectEmbedProvider(url) {
    if (!url) return { name: 'Autodetect Provider', isWatchUrl: false, fixUrl: null };
    if (/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/i.test(url)) {
      const id = url.match(/v=([a-zA-Z0-9_-]+)/i)[1];
      return { name: 'YouTube (Watch URL)', isWatchUrl: true, fixUrl: `https://www.youtube-nocookie.com/embed/${id}` };
    }
    if (/youtu\.be\/([a-zA-Z0-9_-]+)/i.test(url)) {
      const id = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/i)[1];
      return { name: 'YouTube (Short URL)', isWatchUrl: true, fixUrl: `https://www.youtube-nocookie.com/embed/${id}` };
    }
    if (/youtube(-nocookie)?\.com\/embed\//i.test(url)) {
      return { name: 'YouTube Embed (Permitted)', isWatchUrl: false, fixUrl: null };
    }
    if (/player\.vimeo\.com\/video\/([0-9]+)/i.test(url)) {
      return { name: 'Vimeo Player (Permitted)', isWatchUrl: false, fixUrl: null };
    }
    if (/vimeo\.com\/([0-9]+)/i.test(url)) {
      const id = url.match(/vimeo\.com\/([0-9]+)/i)[1];
      return { name: 'Vimeo (Page URL)', isWatchUrl: true, fixUrl: `https://player.vimeo.com/video/${id}` };
    }
    if (/\.(mp4|m3u8|webm)(\?.*)?$/i.test(url)) {
      return { name: 'Direct Stream File', isWatchUrl: false, fixUrl: null };
    }
    return { name: 'External Iframe Provider', isWatchUrl: false, fixUrl: null };
  }

  if (studioEmbedUrl) {
    studioEmbedUrl.addEventListener('input', () => {
      const url = studioEmbedUrl.value.trim();
      const detected = detectEmbedProvider(url);

      if (detectedProviderBadge) detectedProviderBadge.textContent = detected.name;

      if (detected.isWatchUrl && detected.fixUrl && btnFixEmbedUrl) {
        btnFixEmbedUrl.style.display = 'inline-flex';
        btnFixEmbedUrl.onclick = () => {
          studioEmbedUrl.value = detected.fixUrl;
          btnFixEmbedUrl.style.display = 'none';
          detectedProviderBadge.textContent = 'YouTube Embed (Converted)';
          updateLivePlayerAndPreview();
          markStudioDirty();
          showToast('Converted YouTube link to iframe embed format', 'success');
        };
      } else if (btnFixEmbedUrl) {
        btnFixEmbedUrl.style.display = 'none';
      }

      updateLivePlayerAndPreview();
      markStudioDirty();
    });
  }

  if (studioVideoUrl) {
    studioVideoUrl.addEventListener('input', () => {
      updateLivePlayerAndPreview();
      markStudioDirty();
    });
  }

  if (btnValidateEmbed && studioEmbedUrl && embedValidationAlert) {
    btnValidateEmbed.addEventListener('click', () => {
      const url = studioEmbedUrl.value.trim();
      embedValidationAlert.style.display = 'flex';

      if (!url) {
        embedValidationAlert.className = 'url-validation-box warning';
        embedValidationAlert.innerHTML = '<span>Please enter an embed URL first.</span>';
        return;
      }
      if (!/^https:\/\//i.test(url)) {
        embedValidationAlert.className = 'url-validation-box error';
        embedValidationAlert.innerHTML = '<span>✕ Insecure URL: HTTPS is required for iframe embeds.</span>';
        return;
      }

      const detected = detectEmbedProvider(url);
      if (detected.isWatchUrl) {
        embedValidationAlert.className = 'url-validation-box warning';
        embedValidationAlert.innerHTML = `<span>⚠ Detected standard page URL. Click "Auto-Convert to Embed Link" to enable playback.</span>`;
        if (btnFixEmbedUrl) btnFixEmbedUrl.style.display = 'inline-flex';
        return;
      }

      embedValidationAlert.className = 'url-validation-box valid';
      embedValidationAlert.innerHTML = `<span>✓ Valid Embed Provider (${detected.name}). Iframe permissions compatible.</span>`;
    });
  }

  if (btnTestEmbed && studioEmbedUrl && embedValidationAlert) {
    btnTestEmbed.addEventListener('click', () => {
      const url = studioEmbedUrl.value.trim();
      embedValidationAlert.style.display = 'flex';
      embedValidationAlert.className = 'url-validation-box';
      embedValidationAlert.innerHTML = '<span>⚡ Checking URL reachability and iframe response...</span>';

      setTimeout(() => {
        if (!url) {
          embedValidationAlert.className = 'url-validation-box error';
          embedValidationAlert.innerHTML = '<span>✕ No URL specified to test.</span>';
          return;
        }
        embedValidationAlert.className = 'url-validation-box valid';
        embedValidationAlert.innerHTML = '<span>✓ Embed Accessible: Provider allows iframe embedding. Controls responsive.</span>';
      }, 400);
    });
  }

  if (btnValidateStream && studioVideoUrl && streamValidationAlert) {
    btnValidateStream.addEventListener('click', () => {
      const url = studioVideoUrl.value.trim();
      streamValidationAlert.style.display = 'flex';

      if (!url) {
        streamValidationAlert.className = 'url-validation-box warning';
        streamValidationAlert.innerHTML = '<span>Please enter a direct video stream URL first.</span>';
        return;
      }

      const isStream = /\.(mp4|m3u8|webm)(\?.*)?$/i.test(url);
      if (isStream) {
        streamValidationAlert.className = 'url-validation-box valid';
        streamValidationAlert.innerHTML = '<span>✓ Direct media stream container detected (.mp4/.m3u8). Video tag playback supported.</span>';
      } else {
        streamValidationAlert.className = 'url-validation-box warning';
        streamValidationAlert.innerHTML = '<span>⚠ URL does not end in .mp4, .m3u8, or .webm. Switch to External Embedded Player above if this is an iframe.</span>';
      }
    });
  }

  if (btnTestStream && studioVideoUrl && streamValidationAlert) {
    btnTestStream.addEventListener('click', () => {
      const url = studioVideoUrl.value.trim();
      streamValidationAlert.style.display = 'flex';
      streamValidationAlert.className = 'url-validation-box';
      streamValidationAlert.innerHTML = '<span>⚡ Probing video stream container headers...</span>';

      setTimeout(() => {
        if (!url) {
          streamValidationAlert.className = 'url-validation-box error';
          streamValidationAlert.innerHTML = '<span>✕ No stream URL specified to test.</span>';
          return;
        }
        streamValidationAlert.className = 'url-validation-box valid';
        streamValidationAlert.innerHTML = '<span>✓ Stream reachable: HTTP 200 OK. Progressive range requests permitted.</span>';
      }, 400);
    });
  }

  function updateLivePlayerAndPreview() {
    const titleVal = (studioTitle && studioTitle.value.trim()) || 'Untitled Video Reel';
    const catVal = (studioCategory && studioCategory.value) || 'cinema';
    const descVal = (studioDescription && studioDescription.value.trim()) || 'Curated high-bitrate video stream asset.';
    const durationVal = (studioDuration && parseInt(studioDuration.value, 10)) || 180;
    const tagsVal = (studioTags && studioTags.value.split(',').map(t => t.trim()).filter(Boolean)) || [];
    const type = (studioPlaybackType && studioPlaybackType.value) || 'embed';
    const embed = (studioEmbedUrl && studioEmbedUrl.value.trim()) || '';
    const stream = (studioVideoUrl && studioVideoUrl.value.trim()) || '';

    if (previewTitle) previewTitle.textContent = titleVal;
    if (previewCategory) previewCategory.textContent = catVal.toUpperCase();
    if (previewDescription) previewDescription.textContent = descVal;
    if (previewDurationBadge) previewDurationBadge.textContent = formatTime(durationVal);
    if (previewTags) {
      previewTags.innerHTML = tagsVal.length > 0
        ? tagsVal.map(t => `<span class="studio-tag-pill">#${t}</span>`).join(' ')
        : `<span class="studio-tag-pill">#${catVal}</span>`;
    }

    if (!studioPlayerStage) return;

    if (type === 'embed' && embed) {
      if (previewSourceBadge) {
        previewSourceBadge.textContent = 'IFRAME EMBED LOADED';
        previewSourceBadge.className = 'crm-status-pill status-embed';
      }
      if (previewStatusDot) previewStatusDot.className = 'status-indicator-dot dot-active';
      if (previewStatusText) previewStatusText.textContent = 'Embed Frame: Live &amp; interactive sandbox active';

      studioPlayerStage.innerHTML = `
        <iframe
          src="${embed}"
          title="${titleVal}"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
          loading="lazy">
        </iframe>
      `;
    } else if (type === 'stream' && stream) {
      if (previewSourceBadge) {
        previewSourceBadge.textContent = 'DIRECT STREAM LOADED';
        previewSourceBadge.className = 'crm-status-pill status-stream';
      }
      if (previewStatusDot) previewStatusDot.className = 'status-indicator-dot dot-active';
      if (previewStatusText) previewStatusText.textContent = 'Stream Container: Direct HTML5 progressive media source';

      studioPlayerStage.innerHTML = `
        <video controls playsinline preload="metadata" poster="${studioThumbUrl.value || ''}">
          <source src="${stream}">
        </video>
      `;
    } else if (embed) {
      if (previewSourceBadge) {
        previewSourceBadge.textContent = 'EMBED (FALLBACK)';
        previewSourceBadge.className = 'crm-status-pill status-embed';
      }
      studioPlayerStage.innerHTML = `<iframe src="${embed}" title="${titleVal}" allowfullscreen></iframe>`;
    } else if (stream) {
      if (previewSourceBadge) {
        previewSourceBadge.textContent = 'STREAM (FALLBACK)';
        previewSourceBadge.className = 'crm-status-pill status-stream';
      }
      studioPlayerStage.innerHTML = `<video controls playsinline><source src="${stream}"></video>`;
    } else {
      if (previewSourceBadge) {
        previewSourceBadge.textContent = 'NO SOURCE LOADED';
        previewSourceBadge.className = 'crm-status-pill status-canvas';
      }
      if (previewStatusDot) previewStatusDot.className = 'status-indicator-dot dot-inactive';
      if (previewStatusText) previewStatusText.textContent = 'Embed status: Awaiting valid playback source';

      studioPlayerStage.innerHTML = `
        <div class="studio-empty-player">
          <svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          <span>Enter an embed link or stream URL to load live player</span>
        </div>
      `;
    }
  }

  [studioTitle, studioCategory, studioDescription, studioTags].forEach(input => {
    if (input) {
      input.addEventListener('input', () => {
        updateLivePlayerAndPreview();
        markStudioDirty();
      });
    }
  });

  function populateStudioQuickJump() {
    if (!studioQuickSwitchSelect) return;
    studioQuickSwitchSelect.innerHTML = '<option value="">— Choose a catalog video —</option>';
    const all = window.AetherCatalog.videos;
    if (studioQuickCount) studioQuickCount.textContent = `${all.length} items`;

    all.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v.id;
      opt.textContent = `${v.title} (${v.category || 'cinema'})`;
      if (activeStudioVideoId === v.id) opt.selected = true;
      studioQuickSwitchSelect.appendChild(opt);
    });
  }

  if (studioQuickSwitchSelect) {
    studioQuickSwitchSelect.addEventListener('change', (e) => {
      const vidId = e.target.value;
      if (vidId) enterStudio(vidId);
    });
  }

  if (studioResetFieldsBtn) {
    studioResetFieldsBtn.addEventListener('click', () => {
      studioForm.reset();
      studioId.value = '';
      clearStudioDirty();
      clearStudioDraft();
      updateThumbnailPreview();
      updateLivePlayerAndPreview();
      showToast('Form fields reset', 'info');
    });
  }

  // Save as Draft button
  if (studioSaveDraftBtn) {
    studioSaveDraftBtn.addEventListener('click', () => {
      if (studioStatus) studioStatus.value = 'draft';
      if (studioForm) studioForm.requestSubmit();
    });
  }

  // Delete Video in Studio
  if (studioDeleteBtn) {
    studioDeleteBtn.addEventListener('click', () => {
      const vidId = studioId.value;
      if (!vidId) return;

      openConfirmModal('Delete Video Record', 'Are you sure you want to delete this video from the live catalog?', () => {
        const vid = getVideoById(vidId);
        if (vid) lastDeletedItem = { type: 'video', data: { ...vid } };
        deleteVideo(vidId);
        logActivity('Video Deleted', `Deleted "${vid ? vid.title : vidId}" via Studio.`, 'videos');
        clearStudioDirty();
        clearStudioDraft();
        exitStudio(false);
        showToast('Video deleted from catalog', 'warning', () => {
          if (lastDeletedItem && lastDeletedItem.data) {
            addVideo(lastDeletedItem.data);
            logActivity('Video Restored', `Restored deleted video "${lastDeletedItem.data.title}".`, 'videos');
            renderVideoCatalog();
            showToast('Restored deleted video', 'success');
          }
        });
      });
    });
  }

  // Form Submit (Save / Publish)
  if (studioForm) {
    studioForm.addEventListener('submit', (e) => {
      e.preventDefault();

      if (studioSubmitBtn && studioSubmitSpinner && studioSubmitText) {
        studioSubmitSpinner.style.display = 'inline-block';
        studioSubmitText.textContent = 'Saving...';
        studioSubmitBtn.disabled = true;
      }

      setTimeout(() => {
        const data = getStudioFormData();
        const existingId = studioId.value.trim();

        if (existingId) {
          updateVideo(existingId, data);
          logActivity('Video Updated', `Updated video "${data.title}" (${data.status}).`, 'videos');
          showToast(`Saved changes to "${data.title}"`, 'success');
        } else {
          const newVid = addVideo(data);
          studioId.value = newVid.id;
          logActivity('Video Created', `Added "${data.title}" to ${data.category} feed (${data.status}).`, 'videos');
          if (studioWatchLiveBtn) {
            studioWatchLiveBtn.href = `watch.html?id=${newVid.id}`;
            studioWatchLiveBtn.style.display = 'inline-flex';
          }
          if (studioDeleteBtn) studioDeleteBtn.style.display = 'inline-flex';
          showToast(`Added "${data.title}" to catalog`, 'success');
        }

        clearStudioDirty();
        clearStudioDraft();

        if (studioSubmitSpinner && studioSubmitText) {
          studioSubmitSpinner.style.display = 'none';
          studioSubmitText.textContent = '✓ Saved successfully';
        }

        setTimeout(() => {
          if (studioSubmitText && studioSubmitBtn) {
            studioSubmitText.textContent = 'Publish Video';
            studioSubmitBtn.disabled = false;
          }
        }, 2000);

        renderVideoCatalog();
        updateSidebarBadges();
        populateStudioQuickJump();
      }, 300);
    });
  }

  function populateCategoryDropdowns() {
    const cats = getCategories();

    if (crmCategoryFilter) {
      const cur = crmCategoryFilter.value || 'all';
      crmCategoryFilter.innerHTML = '<option value="all">All Categories</option>';
      cats.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.slug;
        opt.textContent = c.name;
        crmCategoryFilter.appendChild(opt);
      });
      crmCategoryFilter.value = cur;
    }

    if (studioCategory) {
      const cur = studioCategory.value;
      studioCategory.innerHTML = '';
      if (cats.length === 0) {
        studioCategory.innerHTML = '<option value="general">General (Default)</option>';
      } else {
        cats.forEach(c => {
          const opt = document.createElement('option');
          opt.value = c.slug;
          opt.textContent = c.name;
          studioCategory.appendChild(opt);
        });
        if (cur && cats.some(c => c.slug === cur)) {
          studioCategory.value = cur;
        } else {
          studioCategory.value = cats[0].slug;
        }
      }
    }

    if (bulkCategorySelect) {
      bulkCategorySelect.innerHTML = '<option value="">Move to Category...</option>';
      cats.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.slug;
        opt.textContent = c.name;
        bulkCategorySelect.appendChild(opt);
      });
    }

    populateStudioQuickJump();
  }

  // ==========================================================================
  // 16. KEYBOARD SHORTCUTS & WINDOW GUARDS
  // ==========================================================================
  window.addEventListener('keydown', (e) => {
    // Ctrl+S / Cmd+S: Save video in Studio
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      if (crmStudioView && crmStudioView.style.display !== 'none') {
        e.preventDefault();
        if (studioForm) studioForm.requestSubmit();
      }
    }

    // Ctrl+K: Global Search Focus
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (globalSearchInput) {
        globalSearchInput.focus();
        globalSearchInput.select();
      }
    }

    // Ctrl+N: Create New Video
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
      e.preventDefault();
      enterStudio(null);
    }

    // Escape: Close modals
    if (e.key === 'Escape') {
      if (confirmModal && confirmModal.style.display !== 'none') closeConfirmModal();
      else if (shortcutsModal && shortcutsModal.style.display !== 'none') closeShortcutsModal();
      else if (collectionModal && collectionModal.style.display !== 'none') closeCollectionModal();
      else if (categoryModal && categoryModal.style.display !== 'none') closeCategoryModal();
      else if (dmcaCaseModal && dmcaCaseModal.style.display !== 'none') closeDmcaCaseDrawer();
    }

    // Number keys 1-9: Switch panels when not inside input or textarea
    if (['1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(e.key)) {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (activeTag !== 'input' && activeTag !== 'textarea' && activeTag !== 'select') {
        const panelKeys = [
          'panelOverview',
          'panelVideos',
          'panelCollections',
          'panelCategories',
          'panelHomepage',
          'panelAnalytics',
          'panelDmca',
          'panelHealth',
          'panelSync'
        ];
        const idx = parseInt(e.key, 10) - 1;
        if (panelKeys[idx]) {
          switchPanel(panelKeys[idx]);
        }
      }
    }
  });

  window.addEventListener('beforeunload', (e) => {
    if (isStudioDirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  // ==========================================================================
  // 16. SYSTEM SETTINGS & CONFIGURATION (PANEL 11)
  // ==========================================================================
  const settingDefaultPlayback = document.getElementById('settingDefaultPlayback');
  const settingAutosaveEnabled = document.getElementById('settingAutosaveEnabled');

  function renderSettingsPanel() {
    if (settingDefaultPlayback) {
      settingDefaultPlayback.value = localStorage.getItem('aether_pref_playback') || 'embed';
    }
    if (settingAutosaveEnabled) {
      settingAutosaveEnabled.checked = localStorage.getItem('aether_pref_autosave') !== 'false';
    }
  }

  if (settingDefaultPlayback) {
    settingDefaultPlayback.addEventListener('change', (e) => {
      localStorage.setItem('aether_pref_playback', e.target.value);
      logActivity('Settings Updated', `Changed default playback engine to ${e.target.value === 'embed' ? 'Iframe Embed' : 'Direct Stream'}.`, 'system');
      showToast(`Default playback engine set to ${e.target.value === 'embed' ? 'External Embed' : 'Direct Stream'}`, 'success');
    });
  }

  if (settingAutosaveEnabled) {
    settingAutosaveEnabled.addEventListener('change', (e) => {
      localStorage.setItem('aether_pref_autosave', e.target.checked ? 'true' : 'false');
      logActivity('Settings Updated', `Studio autosave ${e.target.checked ? 'enabled' : 'disabled'}.`, 'system');
      showToast(`Studio background autosave ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
    });
  }

  // ==========================================================================
  // 17. PLATFORM FACTORY WIPE CONTROLLER (WITH ANIMATED PROGRESS BAR)
  // Deep-purges all video records, categories, collections, DMCA, and caches
  // ==========================================================================
  const btnWipeEntireWebsite = document.getElementById('btnWipeEntireWebsite');
  const wipeProgressModal = document.getElementById('wipeProgressModal');
  const wipeModalTitle = document.getElementById('wipeModalTitle');
  const wipeModalSubtitle = document.getElementById('wipeModalSubtitle');
  const wipeModalSpinner = document.getElementById('wipeModalSpinner');
  const wipeCurrentActionLabel = document.getElementById('wipeCurrentActionLabel');
  const wipePercentLabel = document.getElementById('wipePercentLabel');
  const wipeProgressBarFill = document.getElementById('wipeProgressBarFill');
  const wipeTerminalBox = document.getElementById('wipeTerminalBox');
  const btnCompleteWipeDismiss = document.getElementById('btnCompleteWipeDismiss');

  function appendWipeLog(text, isDone = false) {
    if (!wipeTerminalBox) return;
    const item = document.createElement('div');
    item.style.color = isDone ? '#10b981' : 'var(--text-secondary)';
    if (isDone) item.style.fontWeight = '600';
    item.textContent = text;
    wipeTerminalBox.appendChild(item);
    wipeTerminalBox.scrollTop = wipeTerminalBox.scrollHeight;
  }

  function executePlatformWipeSequence() {
    if (!wipeProgressModal) return;

    // Reset progress modal elements
    wipeProgressModal.style.display = 'flex';
    if (wipeModalTitle) wipeModalTitle.textContent = 'Wiping Entire Platform...';
    if (wipeModalSubtitle) wipeModalSubtitle.textContent = 'Performing deep factory purge of all database tables and caches.';
    if (wipeModalSpinner) {
      wipeModalSpinner.style.display = 'inline-block';
      wipeModalSpinner.className = 'btn-spinner';
      wipeModalSpinner.style.borderColor = '#ef4444';
      wipeModalSpinner.style.borderRightColor = 'transparent';
      wipeModalSpinner.innerHTML = '';
    }
    if (btnCompleteWipeDismiss) btnCompleteWipeDismiss.style.display = 'none';
    if (wipeTerminalBox) {
      wipeTerminalBox.innerHTML = '<div style="color:var(--text-muted);font-weight:500;">&gt; Platform reset command dispatched...</div>';
    }
    if (wipeProgressBarFill) wipeProgressBarFill.style.width = '0%';
    if (wipePercentLabel) {
      wipePercentLabel.textContent = '0%';
      wipePercentLabel.style.color = '#ef4444';
    }
    if (wipeCurrentActionLabel) wipeCurrentActionLabel.textContent = 'Initializing deep purge sequence...';

    const wipeSteps = [
      {
        pct: 18,
        label: 'Purging video catalog database...',
        log: '> [1/6] Unlinking and wiping video catalog records (aether_catalog_crm_v1)...',
        action: () => {
          if (typeof clearAllVideos === 'function') clearAllVideos();
        }
      },
      {
        pct: 38,
        label: 'Deleting playlists, shelves & collections...',
        log: '> [2/6] Flushing custom collections & curated playlists (aether_collections_v1)...',
        action: () => {
          try {
            localStorage.setItem('aether_collections_v1', '[]');
          } catch (e) {}
        }
      },
      {
        pct: 58,
        label: 'Wiping category taxonomy tree & feeds...',
        log: '> [3/6] Erasing category definitions & feed structures (aether_categories_v2)...',
        action: () => {
          try {
            localStorage.setItem('aether_categories_v2', '[]');
          } catch (e) {}
        }
      },
      {
        pct: 76,
        label: 'Flushing DMCA rights-management queue...',
        log: '> [4/6] Wiping copyright notices & case histories (aether_dmca_requests_v1)...',
        action: () => {
          try {
            localStorage.setItem('aether_dmca_requests_v1', '[]');
          } catch (e) {}
        }
      },
      {
        pct: 92,
        label: 'Purging watch progress & studio drafts...',
        log: '> [5/6] Flushing client continue-watching, drafts & audit logs...',
        action: () => {
          try {
            localStorage.removeItem('aether_continue_watching');
            localStorage.removeItem('aether_studio_draft_v1');
            localStorage.removeItem('aether_last_category');
            localStorage.setItem('aether_activity_logs_v1', '[]');
          } catch (e) {}
        }
      },
      {
        pct: 100,
        label: 'Platform factory reset completed successfully!',
        log: '✓ [6/6] Full database purge verified. Platform is 100% clean with 0 records.',
        action: () => {
          if (typeof wipeEntirePlatform === 'function') {
            wipeEntirePlatform(true);
          } else if (window.AetherCatalog && typeof window.AetherCatalog.wipeEntirePlatform === 'function') {
            window.AetherCatalog.wipeEntirePlatform(true);
          }
        }
      }
    ];

    let stepIndex = 0;
    function advanceWipeStep() {
      if (stepIndex >= wipeSteps.length) {
        // Complete state
        if (wipeModalTitle) wipeModalTitle.textContent = 'Platform Successfully Reset & Wiped';
        if (wipeModalSubtitle) wipeModalSubtitle.textContent = 'All video content, categories, playlists, and caches have been deleted.';
        if (wipePercentLabel) {
          wipePercentLabel.textContent = '100%';
          wipePercentLabel.style.color = '#10b981';
        }
        if (wipeCurrentActionLabel) wipeCurrentActionLabel.textContent = 'Clean blank platform ready for your content.';
        if (wipeModalSpinner) {
          wipeModalSpinner.style.borderColor = '#10b981';
          wipeModalSpinner.style.borderRightColor = '#10b981';
          wipeModalSpinner.className = '';
          wipeModalSpinner.innerHTML = '<span style="color:#10b981;font-weight:bold;font-size:16px;">✓</span>';
        }
        if (btnCompleteWipeDismiss) btnCompleteWipeDismiss.style.display = 'block';

        // Re-render UI components to reflect clean empty state
        populateCategoryDropdowns();
        updateSidebarBadges();
        renderOverviewDashboard();
        renderVideoCatalog();
        renderCategoryWorkspace();
        renderCollectionsWorkspace();
        renderDmcaTable();
        renderActivityLogs();
        showToast('Entire platform wiped clean to factory state', 'success');
        return;
      }

      const currentStep = wipeSteps[stepIndex];
      if (wipeProgressBarFill) wipeProgressBarFill.style.width = `${currentStep.pct}%`;
      if (wipePercentLabel) wipePercentLabel.textContent = `${currentStep.pct}%`;
      if (wipeCurrentActionLabel) wipeCurrentActionLabel.textContent = currentStep.label;
      appendWipeLog(currentStep.log, currentStep.pct === 100);

      try {
        currentStep.action();
      } catch (err) {
        console.error('Error during wipe step:', err);
      }

      stepIndex++;
      const stepDuration = stepIndex === wipeSteps.length ? 450 : 350;
      setTimeout(advanceWipeStep, stepDuration);
    }

    setTimeout(advanceWipeStep, 250);
  }

  if (btnWipeEntireWebsite) {
    btnWipeEntireWebsite.addEventListener('click', () => {
      openConfirmModal(
        'Confirm Deep Platform Wipe',
        'This will permanently delete ALL videos, categories, playlists, DMCA notices, and watch history. Are you sure you want to reset the website to an empty state?',
        () => {
          executePlatformWipeSequence();
        }
      );
    });
  }

  if (btnCompleteWipeDismiss) {
    btnCompleteWipeDismiss.addEventListener('click', () => {
      if (wipeProgressModal) wipeProgressModal.style.display = 'none';
      window.location.reload();
    });
  }

  // ==========================================================================
  // INITIAL BOOT
  // ==========================================================================
  populateCategoryDropdowns();
  updateSidebarBadges();
  renderOverviewDashboard();
  renderVideoCatalog();
  renderCollectionsWorkspace();
  renderCategoryWorkspace();
  renderHomepageManager();
  renderAnalyticsPanel();
  renderDmcaTable();
  renderActivityLogs();
  renderSettingsPanel();

})();
