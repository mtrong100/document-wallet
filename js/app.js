/* ==========================================================================
   app.js — Application logic for Ví Giấy Tờ (Document Wallet)
   ========================================================================== */
(() => {
  'use strict';

  const CATEGORIES = [
    { id: 'id',        icon: 'badge',              color: '--cat-id',        key: 'category.id' },
    { id: 'passport',  icon: 'flight_takeoff',     color: '--cat-passport',  key: 'category.passport' },
    { id: 'license',   icon: 'directions_car',     color: '--cat-license',   key: 'category.license' },
    { id: 'bank',      icon: 'credit_card',        color: '--cat-bank',      key: 'category.bank' },
    { id: 'insurance', icon: 'health_and_safety',  color: '--cat-insurance', key: 'category.insurance' },
    { id: 'education', icon: 'school',             color: '--cat-education', key: 'category.education' },
    { id: 'vehicle',   icon: 'two_wheeler',        color: '--cat-vehicle',   key: 'category.vehicle' },
    { id: 'other',     icon: 'folder',             color: '--cat-other',     key: 'category.other' },
  ];

  const catById = id => CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1];

  // ---- State ----
  let state = {
    filter: 'all',        // all | favorite | expiring | category:<id>
    query: '',
    sort: 'name',
    viewMode: STORAGE.getSettings().viewMode || 'grid',
    editingId: null,
    deleteTargetId: null,
    imageFrontData: null,
    imageBackData: null,
  };

  // ---- DOM refs ----
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));

  const el = {
    sidebar: $('#sidebar'),
    overlay: $('#sidebarOverlay'),
    btnMenu: $('#btnMenu'),
    categoryNav: $('#categoryNav'),
    categoryList: $('#categoryList'),
    docGrid: $('#docGrid'),
    emptyState: $('#emptyState'),
    noResultState: $('#noResultState'),
    searchInput: $('#searchInput'),
    searchClear: $('#searchClear'),
    sortSelect: $('#sortSelect'),
    btnViewToggle: $('#btnViewToggle'),
    btnLang: $('#btnLang'),
    langLabel: $('#langLabel'),
    activeFilterBar: $('#activeFilterBar'),
    activeFilterLabel: $('#activeFilterLabel'),
    btnClearFilter: $('#btnClearFilter'),
    statTotal: $('#statTotal'),
    statExpiring: $('#statExpiring'),
    statExpired: $('#statExpired'),
    statFavorite: $('#statFavorite'),
    countAll: $('#countAll'),
    countFavorite: $('#countFavorite'),
    countExpiring: $('#countExpiring'),

    // Detail modal
    detailModal: $('#detailModal'),
    detailHeader: $('#detailHeader'),
    detailIcon: $('#detailIcon'),
    detailTitle: $('#detailTitle'),
    detailCategory: $('#detailCategory'),
    detailBody: $('#detailBody'),
    detailFavBtn: $('#detailFavBtn'),
    detailEditBtn: $('#detailEditBtn'),
    detailDeleteBtn: $('#detailDeleteBtn'),
    btnCloseDetail: $('#btnCloseDetail'),

    // Form modal
    formModal: $('#formModal'),
    formModalTitle: $('#formModalTitle'),
    docForm: $('#docForm'),
    categoryPicker: $('#categoryPicker'),
    fieldName: $('#fieldName'),
    fieldNumber: $('#fieldNumber'),
    fieldHolder: $('#fieldHolder'),
    fieldIssueDate: $('#fieldIssueDate'),
    fieldExpiryDate: $('#fieldExpiryDate'),
    fieldIssuePlace: $('#fieldIssuePlace'),
    fieldNotes: $('#fieldNotes'),
    fieldFavorite: $('#fieldFavorite'),
    btnCloseForm: $('#btnCloseForm'),
    btnCancelForm: $('#btnCancelForm'),

    // Settings modal
    settingsModal: $('#settingsModal'),
    btnSettings: $('#btnSettings'),
    btnCloseSettings: $('#btnCloseSettings'),
    themeSwitchModal: $('#themeSwitchModal'),
    langSwitchModal: $('#langSwitchModal'),
    expiryThresholdSelect: $('#expiryThresholdSelect'),
    btnExportData: $('#btnExportData'),
    btnImportData: $('#btnImportData'),
    importFileInput: $('#importFileInput'),
    btnClearData: $('#btnClearData'),
    btnBackup: $('#btnBackup'),

    // Confirm modal
    confirmModal: $('#confirmModal'),
    confirmTitle: $('#confirmTitle'),
    confirmDesc: $('#confirmDesc'),
    confirmOkBtn: $('#confirmOkBtn'),
    confirmCancelBtn: $('#confirmCancelBtn'),

    toastContainer: $('#toastContainer'),

    // Image viewer
    imageViewerModal: $('#imageViewerModal'),
    imageViewerImg: $('#imageViewerImg'),
    btnCloseImageViewer: $('#btnCloseImageViewer'),
  };

  // ==========================================================================
  // Utilities
  // ==========================================================================
  function daysUntil(dateStr) {
    if (!dateStr) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr); target.setHours(0, 0, 0, 0);
    return Math.round((target - today) / 86400000);
  }

  function expiryStatus(dateStr) {
    if (!dateStr) return 'none';
    const threshold = STORAGE.getSettings().expiryThreshold || 30;
    const d = daysUntil(dateStr);
    if (d < 0) return 'expired';
    if (d <= threshold) return 'warn';
    return 'ok';
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    const lang = I18N.getLang();
    return d.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str ?? '';
    return div.innerHTML;
  }

  function toast(message, type = 'default', icon = 'check_circle') {
    const t = document.createElement('div');
    t.className = `toast toast--${type}`;
    t.innerHTML = `<span class="material-icons-round">${icon}</span><span>${escapeHtml(message)}</span>`;
    el.toastContainer.appendChild(t);
    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transition = 'opacity .2s ease';
      setTimeout(() => t.remove(), 200);
    }, 2400);
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function compressImage(dataUrl, maxDim = 900, quality = 0.82) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) { height = Math.round(height * maxDim / width); width = maxDim; }
          else { width = Math.round(width * maxDim / height); height = maxDim; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  // ==========================================================================
  // Sidebar / mobile nav
  // ==========================================================================
  function openSidebar() { el.sidebar.classList.add('is-open'); el.overlay.classList.add('is-open'); }
  function closeSidebar() { el.sidebar.classList.remove('is-open'); el.overlay.classList.remove('is-open'); }
  el.btnMenu.addEventListener('click', openSidebar);
  el.overlay.addEventListener('click', closeSidebar);

  // ==========================================================================
  // Category rendering (sidebar nav + form picker)
  // ==========================================================================
  function renderCategoryNav() {
    el.categoryList.innerHTML = CATEGORIES.map(cat => `
      <button class="nav-item" data-filter="category:${cat.id}">
        <span class="material-icons-round" style="color:var(${cat.color})">${cat.icon}</span>
        <span>${I18N.t(cat.key)}</span>
        <span class="nav-item__count" data-cat-count="${cat.id}">0</span>
      </button>
    `).join('');
  }

  function renderCategoryPicker(selected) {
    el.categoryPicker.innerHTML = CATEGORIES.map(cat => `
      <button type="button" class="category-chip ${selected === cat.id ? 'is-active' : ''}"
              data-cat="${cat.id}" style="${selected === cat.id ? `background:var(${cat.color})` : ''}">
        <span class="material-icons-round">${cat.icon}</span>
        <span>${I18N.t(cat.key)}</span>
      </button>
    `).join('');
    el.categoryPicker.querySelectorAll('.category-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        el.categoryPicker.querySelectorAll('.category-chip').forEach(c => { c.classList.remove('is-active'); c.style.background = ''; });
        chip.classList.add('is-active');
        chip.style.background = `var(${catById(chip.dataset.cat).color})`;
        el.categoryPicker.dataset.selected = chip.dataset.cat;
      });
    });
    el.categoryPicker.dataset.selected = selected;
  }

  // ==========================================================================
  // Filtering / sorting / rendering documents
  // ==========================================================================
  function getFilteredDocs() {
    let docs = STORAGE.getAll();
    const q = state.query.trim().toLowerCase();

    if (q) {
      docs = docs.filter(d =>
        d.name.toLowerCase().includes(q) ||
        (d.number || '').toLowerCase().includes(q) ||
        (d.holder || '').toLowerCase().includes(q) ||
        (d.issuePlace || '').toLowerCase().includes(q)
      );
    }

    if (state.filter === 'favorite') {
      docs = docs.filter(d => d.favorite);
    } else if (state.filter === 'expiring') {
      docs = docs.filter(d => expiryStatus(d.expiryDate) === 'warn' || expiryStatus(d.expiryDate) === 'expired');
    } else if (state.filter.startsWith('category:')) {
      const cat = state.filter.split(':')[1];
      docs = docs.filter(d => d.category === cat);
    }

    docs.sort((a, b) => {
      if (state.sort === 'name') return a.name.localeCompare(b.name, 'vi');
      if (state.sort === 'expiry') {
        if (!a.expiryDate) return 1;
        if (!b.expiryDate) return -1;
        return new Date(a.expiryDate) - new Date(b.expiryDate);
      }
      if (state.sort === 'created') return b.createdAt - a.createdAt;
      return 0;
    });

    return docs;
  }

  function statusBadge(dateStr) {
    const status = expiryStatus(dateStr);
    if (status === 'none') return '';
    const map = {
      ok: { cls: 'badge--ok', icon: 'check_circle', key: 'status.valid' },
      warn: { cls: 'badge--warn', icon: 'schedule', key: 'status.expiringSoon' },
      expired: { cls: 'badge--error', icon: 'error', key: 'status.expired' },
    };
    const s = map[status];
    return `<span class="badge ${s.cls}"><span class="material-icons-round" style="font-size:12px">${s.icon}</span>${I18N.t(s.key)}</span>`;
  }

  function renderDocCard(doc) {
    const cat = catById(doc.category);
    return `
      <article class="doc-card" data-id="${doc.id}" tabindex="0">
        <div class="doc-card__top" style="background:linear-gradient(135deg, var(${cat.color}), color-mix(in srgb, var(${cat.color}) 70%, black))">
          <span class="doc-card__cat-icon material-icons-round">${cat.icon}</span>
          <button class="doc-card__fav ${doc.favorite ? 'is-active' : ''}" data-action="fav" data-id="${doc.id}" aria-label="Favorite">
            <span class="material-icons-round">${doc.favorite ? 'star' : 'star_border'}</span>
          </button>
        </div>
        <div class="doc-card__body">
          <div>
            <div class="doc-card__name">${escapeHtml(doc.name || '—')}</div>
            <div class="doc-card__number">${escapeHtml(doc.number || '—')}</div>
          </div>
          <div class="doc-card__meta">
            <span class="doc-card__cat-name">${I18N.t(cat.key)}</span>
            ${statusBadge(doc.expiryDate)}
          </div>
        </div>
      </article>
    `;
  }

  function renderDocs() {
    const docs = getFilteredDocs();
    const allDocs = STORAGE.getAll();

    el.docGrid.innerHTML = docs.map(renderDocCard).join('');
    el.docGrid.classList.toggle('is-list', state.viewMode === 'list');

    el.emptyState.hidden = allDocs.length !== 0;
    el.noResultState.hidden = !(allDocs.length > 0 && docs.length === 0);
    el.docGrid.hidden = docs.length === 0;

    // Card click handlers
    el.docGrid.querySelectorAll('.doc-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('[data-action="fav"]')) return;
        openDetail(card.dataset.id);
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') openDetail(card.dataset.id);
      });
    });
    el.docGrid.querySelectorAll('[data-action="fav"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        STORAGE.toggleFavorite(btn.dataset.id);
        renderAll();
      });
    });

    renderStats(allDocs);
    renderActiveFilterBar();
  }

  function renderStats(allDocs) {
    const total = allDocs.length;
    const expiring = allDocs.filter(d => expiryStatus(d.expiryDate) === 'warn').length;
    const expired = allDocs.filter(d => expiryStatus(d.expiryDate) === 'expired').length;
    const favorite = allDocs.filter(d => d.favorite).length;

    el.statTotal.textContent = total;
    el.statExpiring.textContent = expiring;
    el.statExpired.textContent = expired;
    el.statFavorite.textContent = favorite;

    el.countAll.textContent = total;
    el.countFavorite.textContent = favorite;
    el.countExpiring.textContent = expiring + expired;

    CATEGORIES.forEach(cat => {
      const count = allDocs.filter(d => d.category === cat.id).length;
      const badge = el.categoryList.querySelector(`[data-cat-count="${cat.id}"]`);
      if (badge) badge.textContent = count;
    });
  }

  function renderActiveFilterBar() {
    if (state.filter === 'all') { el.activeFilterBar.hidden = true; return; }
    let label = '';
    if (state.filter === 'favorite') label = I18N.t('filter.favorite');
    else if (state.filter === 'expiring') label = I18N.t('filter.expiring');
    else if (state.filter.startsWith('category:')) label = I18N.t(catById(state.filter.split(':')[1]).key);
    el.activeFilterLabel.textContent = label;
    el.activeFilterBar.hidden = false;
  }

  function setFilter(filter) {
    state.filter = filter;
    $$('.nav-item').forEach(item => item.classList.toggle('is-active', item.dataset.filter === filter));
    renderDocs();
    closeSidebar();
  }

  el.categoryNav.addEventListener('click', (e) => {
    const btn = e.target.closest('.nav-item');
    if (btn) setFilter(btn.dataset.filter);
  });
  el.btnClearFilter.addEventListener('click', () => setFilter('all'));

  function renderAll() {
    renderCategoryNav();
    renderDocs();
  }

  // ==========================================================================
  // Search / sort / view toggle
  // ==========================================================================
  el.searchInput.addEventListener('input', () => {
    state.query = el.searchInput.value;
    el.searchClear.hidden = !state.query;
    renderDocs();
  });
  el.searchClear.addEventListener('click', () => {
    el.searchInput.value = '';
    state.query = '';
    el.searchClear.hidden = true;
    renderDocs();
  });

  el.sortSelect.addEventListener('change', () => {
    state.sort = el.sortSelect.value;
    renderDocs();
  });

  el.btnViewToggle.addEventListener('click', () => {
    state.viewMode = state.viewMode === 'grid' ? 'list' : 'grid';
    STORAGE.saveSettings({ viewMode: state.viewMode });
    el.btnViewToggle.querySelector('.material-icons-round').textContent =
      state.viewMode === 'grid' ? 'view_agenda' : 'grid_view';
    renderDocs();
  });

  // ==========================================================================
  // Detail modal
  // ==========================================================================
  function openModal(modalEl) { modalEl.hidden = false; document.body.style.overflow = 'hidden'; }
  function closeModal(modalEl) { modalEl.hidden = true; document.body.style.overflow = ''; }

  function openDetail(id) {
    const doc = STORAGE.getById(id);
    if (!doc) return;
    const cat = catById(doc.category);

    el.detailHeader.style.background = '';
    el.detailIcon.textContent = cat.icon;
    el.detailIcon.style.background = `var(${cat.color})`;
    el.detailIcon.style.color = '#fff';
    el.detailTitle.textContent = doc.name || '—';
    el.detailCategory.textContent = I18N.t(cat.key);
    el.detailFavBtn.classList.toggle('is-active', doc.favorite);
    el.detailFavBtn.querySelector('.material-icons-round').textContent = doc.favorite ? 'star' : 'star_border';
    el.detailFavBtn.dataset.id = id;
    el.detailEditBtn.dataset.id = id;
    el.detailDeleteBtn.dataset.id = id;

    let imagesHtml = '';
    if (doc.imageFront || doc.imageBack) {
      imagesHtml = `<div class="detail-images">
        ${doc.imageFront ? `<img src="${doc.imageFront}" alt="Front" class="zoomable-img" style="cursor: zoom-in;">` : ''}
        ${doc.imageBack ? `<img src="${doc.imageBack}" alt="Back" class="zoomable-img" style="cursor: zoom-in;">` : ''}
      </div>`;
    }

    const fields = [
      { label: I18N.t('detail.number'), value: doc.number, mono: true, copy: true },
      { label: I18N.t('detail.holder'), value: doc.holder, mono: false, copy: false },
      { label: I18N.t('detail.issueDate'), value: formatDate(doc.issueDate), mono: false, copy: false },
      { label: I18N.t('detail.expiryDate'), value: doc.expiryDate ? formatDate(doc.expiryDate) : I18N.t('detail.noExpiry'), mono: false, copy: false, badge: doc.expiryDate ? statusBadge(doc.expiryDate) : '' },
      { label: I18N.t('detail.issuePlace'), value: doc.issuePlace, mono: false, copy: false },
    ].filter(f => f.value);

    const fieldsHtml = fields.map(f => `
      <div class="detail-field">
        <span class="detail-field__label">${f.label}</span>
        <div class="detail-row">
          ${f.badge || ''}
          <span class="detail-field__value ${f.mono ? 'mono' : ''}">${escapeHtml(f.value)}</span>
          ${f.copy ? `<button class="detail-field__copy" data-copy="${escapeHtml(f.value)}"><span class="material-icons-round">content_copy</span></button>` : ''}
        </div>
      </div>
    `).join('');

    const notesHtml = doc.notes ? `<div class="detail-notes">${escapeHtml(doc.notes)}</div>` : '';

    el.detailBody.innerHTML = imagesHtml + fieldsHtml + notesHtml;

    el.detailBody.querySelectorAll('[data-copy]').forEach(btn => {
      btn.addEventListener('click', () => {
        navigator.clipboard?.writeText(btn.dataset.copy).then(() => toast(I18N.t('toast.copied'), 'success', 'content_copy'));
      });
    });

    el.detailBody.querySelectorAll('.zoomable-img').forEach(img => {
      img.addEventListener('click', () => {
        el.imageViewerImg.src = img.src;
        el.imageViewerModal.hidden = false;
      });
    });

    openModal(el.detailModal);
  }

  el.btnCloseDetail.addEventListener('click', () => closeModal(el.detailModal));
  el.detailModal.addEventListener('click', (e) => { if (e.target === el.detailModal) closeModal(el.detailModal); });

  el.detailFavBtn.addEventListener('click', () => {
    const id = el.detailFavBtn.dataset.id;
    const doc = STORAGE.toggleFavorite(id);
    toast(doc.favorite ? I18N.t('toast.favAdded') : I18N.t('toast.favRemoved'), 'success', 'star');
    openDetail(id);
    renderAll();
  });

  el.detailDeleteBtn.addEventListener('click', () => {
    state.deleteTargetId = el.detailDeleteBtn.dataset.id;
    closeModal(el.detailModal);
    openConfirm({
      title: I18N.t('confirm.deleteTitle'),
      desc: I18N.t('confirm.deleteDesc'),
      icon: 'delete_outline',
      onConfirm: () => {
        STORAGE.remove(state.deleteTargetId);
        toast(I18N.t('toast.deleted'), 'success', 'delete_outline');
        renderAll();
      },
    });
  });

  el.detailEditBtn.addEventListener('click', () => {
    const id = el.detailEditBtn.dataset.id;
    closeModal(el.detailModal);
    openForm(id);
  });

  // ==========================================================================
  // Form modal (add / edit)
  // ==========================================================================
  const imgFields = {
    front: { input: $('#fieldImageFront'), preview: $('#previewFront'), placeholder: $('#placeholderFront'), remove: $('#removeFront'), drop: $('#dropFront') },
    back: { input: $('#fieldImageBack'), preview: $('#previewBack'), placeholder: $('#placeholderBack'), remove: $('#removeBack'), drop: $('#dropBack') },
  };

  function resetImageField(side) {
    const f = imgFields[side];
    f.preview.hidden = true; f.preview.src = '';
    f.placeholder.hidden = false;
    f.remove.hidden = true;
    if (side === 'front') state.imageFrontData = null; else state.imageBackData = null;
  }

  function setImageField(side, dataUrl) {
    const f = imgFields[side];
    f.preview.src = dataUrl; f.preview.hidden = false;
    f.placeholder.hidden = true;
    f.remove.hidden = false;
    if (side === 'front') state.imageFrontData = dataUrl; else state.imageBackData = dataUrl;
  }

  Object.entries(imgFields).forEach(([side, f]) => {
    f.input.addEventListener('change', async () => {
      const file = f.input.files[0];
      if (!file) return;
      const raw = await readFileAsDataUrl(file);
      const compressed = await compressImage(raw);
      setImageField(side, compressed);
    });
    f.remove.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      resetImageField(side);
      f.input.value = '';
    });
  });

  function openForm(id = null) {
    state.editingId = id;
    el.docForm.reset();
    resetImageField('front');
    resetImageField('back');

    if (id) {
      const doc = STORAGE.getById(id);
      el.formModalTitle.textContent = I18N.t('form.editTitle');
      el.fieldName.value = doc.name || '';
      el.fieldNumber.value = doc.number || '';
      el.fieldHolder.value = doc.holder || '';
      el.fieldIssueDate.value = doc.issueDate || '';
      el.fieldExpiryDate.value = doc.expiryDate || '';
      el.fieldIssuePlace.value = doc.issuePlace || '';
      el.fieldNotes.value = doc.notes || '';
      el.fieldFavorite.checked = !!doc.favorite;
      if (doc.imageFront) setImageField('front', doc.imageFront);
      if (doc.imageBack) setImageField('back', doc.imageBack);
      renderCategoryPicker(doc.category);
    } else {
      el.formModalTitle.textContent = I18N.t('form.addTitle');
      renderCategoryPicker('id');
    }
    openModal(el.formModal);
    setTimeout(() => el.fieldName.focus(), 50);
  }

  function closeForm() { closeModal(el.formModal); }

  $('#btnAddDoc').addEventListener('click', () => openForm());
  $('#btnAddDocSidebar').addEventListener('click', () => { openForm(); closeSidebar(); });
  $('#btnEmptyAdd').addEventListener('click', () => openForm());
  el.btnCloseForm.addEventListener('click', closeForm);
  el.btnCancelForm.addEventListener('click', closeForm);
  el.formModal.addEventListener('click', (e) => { if (e.target === el.formModal) closeForm(); });

  el.docForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = el.fieldName.value.trim();
    if (!name) { toast(I18N.t('toast.nameRequired'), 'error', 'error'); el.fieldName.focus(); return; }

    const payload = {
      category: el.categoryPicker.dataset.selected || 'other',
      name,
      number: el.fieldNumber.value.trim(),
      holder: el.fieldHolder.value.trim(),
      issueDate: el.fieldIssueDate.value,
      expiryDate: el.fieldExpiryDate.value,
      issuePlace: el.fieldIssuePlace.value.trim(),
      notes: el.fieldNotes.value.trim(),
      favorite: el.fieldFavorite.checked,
      imageFront: state.imageFrontData,
      imageBack: state.imageBackData,
    };

    if (state.editingId) {
      STORAGE.update(state.editingId, payload);
      toast(I18N.t('toast.updated'), 'success', 'check_circle');
    } else {
      STORAGE.create(payload);
      toast(I18N.t('toast.saved'), 'success', 'check_circle');
    }
    closeForm();
    renderAll();
  });

  // ==========================================================================
  // Confirm dialog
  // ==========================================================================
  let confirmCallback = null;
  function openConfirm({ title, desc, icon = 'warning_amber', onConfirm }) {
    el.confirmTitle.textContent = title;
    el.confirmDesc.textContent = desc;
    el.confirmIconSet(icon);
    confirmCallback = onConfirm;
    openModal(el.confirmModal);
  }
  el.confirmIconSet = (icon) => { $('#confirmIcon').textContent = icon; };
  el.confirmOkBtn.addEventListener('click', () => {
    if (confirmCallback) confirmCallback();
    closeModal(el.confirmModal);
  });
  el.confirmCancelBtn.addEventListener('click', () => closeModal(el.confirmModal));

  // ==========================================================================
  // Settings modal
  // ==========================================================================
  el.btnSettings.addEventListener('click', () => {
    syncSettingsUI();
    openModal(el.settingsModal);
  });
  el.btnBackup.addEventListener('click', () => {
    syncSettingsUI();
    openModal(el.settingsModal);
  });
  el.btnCloseSettings.addEventListener('click', () => closeModal(el.settingsModal));
  el.settingsModal.addEventListener('click', (e) => { if (e.target === el.settingsModal) closeModal(el.settingsModal); });

  function syncSettingsUI() {
    const settings = STORAGE.getSettings();
    el.expiryThresholdSelect.value = settings.expiryThreshold;
    el.themeSwitchModal.querySelectorAll('[data-theme]').forEach(btn =>
      btn.classList.toggle('is-active', btn.dataset.theme === THEME.getMode()));
    el.langSwitchModal.querySelectorAll('[data-lang]').forEach(btn =>
      btn.classList.toggle('is-active', btn.dataset.lang === I18N.getLang()));
  }

  el.expiryThresholdSelect.addEventListener('change', () => {
    STORAGE.saveSettings({ expiryThreshold: parseInt(el.expiryThresholdSelect.value, 10) });
    renderDocs();
  });

  el.btnExportData.addEventListener('click', () => {
    const data = STORAGE.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url; a.download = `vi-giay-to-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast(I18N.t('toast.exported'), 'success', 'file_download');
  });

  el.btnImportData.addEventListener('click', () => el.importFileInput.click());
  el.importFileInput.addEventListener('change', async () => {
    const file = el.importFileInput.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      STORAGE.importData(text);
      toast(I18N.t('toast.imported'), 'success', 'file_upload');
      renderAll();
      closeModal(el.settingsModal);
    } catch (err) {
      toast(I18N.t('toast.importError'), 'error', 'error');
    }
    el.importFileInput.value = '';
  });

  el.btnClearData.addEventListener('click', () => {
    openConfirm({
      title: I18N.t('confirm.clearTitle'),
      desc: I18N.t('confirm.clearDesc'),
      icon: 'delete_forever',
      onConfirm: () => {
        STORAGE.clearAll();
        toast(I18N.t('toast.cleared'), 'success', 'delete_forever');
        renderAll();
        closeModal(el.settingsModal);
      },
    });
  });

  // ==========================================================================
  // Theme & language switches
  // ==========================================================================
  function bindThemeSwitch(container) {
    container.querySelectorAll('[data-theme]').forEach(btn => {
      btn.addEventListener('click', () => {
        THEME.setMode(btn.dataset.theme);
        container.querySelectorAll('[data-theme]').forEach(b => b.classList.toggle('is-active', b === btn));
        [$('#themeSwitch'), $('#themeSwitchModal')].forEach(sw => {
          sw.querySelectorAll('[data-theme]').forEach(b => b.classList.toggle('is-active', b.dataset.theme === THEME.getMode()));
        });
      });
    });
  }
  bindThemeSwitch($('#themeSwitch'));
  bindThemeSwitch($('#themeSwitchModal'));
  [$('#themeSwitch'), $('#themeSwitchModal')].forEach(sw => {
    sw.querySelectorAll('[data-theme]').forEach(b => b.classList.toggle('is-active', b.dataset.theme === THEME.getMode()));
  });

  function updateLangUI() {
    el.langLabel.textContent = I18N.getLang().toUpperCase();
    el.langSwitchModal.querySelectorAll('[data-lang]').forEach(b => b.classList.toggle('is-active', b.dataset.lang === I18N.getLang()));
  }
  el.btnLang.addEventListener('click', () => {
    I18N.setLang(I18N.getLang() === 'vi' ? 'en' : 'vi');
  });
  el.langSwitchModal.querySelectorAll('[data-lang]').forEach(btn => {
    btn.addEventListener('click', () => I18N.setLang(btn.dataset.lang));
  });

  window.addEventListener('langchange', () => {
    updateLangUI();
    renderAll();
  });

  // ==========================================================================
  // Keyboard shortcuts
  // ==========================================================================
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      [el.detailModal, el.formModal, el.settingsModal, el.confirmModal].forEach(m => { if (!m.hidden) closeModal(m); });
    }
    if ((e.key === '/' ) && document.activeElement !== el.searchInput) {
      const tag = document.activeElement.tagName;
      if (tag !== 'INPUT' && tag !== 'TEXTAREA') { e.preventDefault(); el.searchInput.focus(); }
    }
  });

  // ==========================================================================
  // Image Viewer Events
  // ==========================================================================
  el.btnCloseImageViewer.addEventListener('click', () => {
    el.imageViewerModal.hidden = true;
  });
  el.imageViewerModal.addEventListener('click', (e) => {
    if (e.target === el.imageViewerModal) {
      el.imageViewerModal.hidden = true;
    }
  });

  // ==========================================================================
  // Init
  // ==========================================================================
  function init() {
    I18N.apply();
    updateLangUI();
    el.sortSelect.value = state.sort;
    el.btnViewToggle.querySelector('.material-icons-round').textContent =
      state.viewMode === 'grid' ? 'view_agenda' : 'grid_view';
    el.expiryThresholdSelect.value = STORAGE.getSettings().expiryThreshold;
    renderAll();

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => {});
      });
    }
  }

  init();
})();
