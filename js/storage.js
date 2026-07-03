/* ==========================================================================
   storage.js — localStorage persistence layer
   ========================================================================== */
const STORAGE = (() => {
  const DOCS_KEY = 'vgt_documents';
  const SETTINGS_KEY = 'vgt_settings';

  const defaultSettings = {
    expiryThreshold: 30,
    viewMode: 'grid', // grid | list
  };

  function uid() {
    return 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function getAll() {
    try {
      const raw = localStorage.getItem(DOCS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Failed to read documents', e);
      return [];
    }
  }

  function saveAll(docs) {
    localStorage.setItem(DOCS_KEY, JSON.stringify(docs));
  }

  function getById(id) {
    return getAll().find(d => d.id === id) || null;
  }

  function create(doc) {
    const docs = getAll();
    const newDoc = {
      id: uid(),
      category: doc.category || 'other',
      name: doc.name || '',
      number: doc.number || '',
      holder: doc.holder || '',
      issueDate: doc.issueDate || '',
      expiryDate: doc.expiryDate || '',
      issuePlace: doc.issuePlace || '',
      notes: doc.notes || '',
      imageFront: doc.imageFront || null,
      imageBack: doc.imageBack || null,
      favorite: !!doc.favorite,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    docs.unshift(newDoc);
    saveAll(docs);
    return newDoc;
  }

  function update(id, patch) {
    const docs = getAll();
    const idx = docs.findIndex(d => d.id === id);
    if (idx === -1) return null;
    docs[idx] = { ...docs[idx], ...patch, updatedAt: Date.now() };
    saveAll(docs);
    return docs[idx];
  }

  function remove(id) {
    const docs = getAll().filter(d => d.id !== id);
    saveAll(docs);
  }

  function toggleFavorite(id) {
    const doc = getById(id);
    if (!doc) return null;
    return update(id, { favorite: !doc.favorite });
  }

  function clearAll() {
    localStorage.removeItem(DOCS_KEY);
  }

  function getSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? { ...defaultSettings, ...JSON.parse(raw) } : { ...defaultSettings };
    } catch (e) {
      return { ...defaultSettings };
    }
  }

  function saveSettings(patch) {
    const settings = { ...getSettings(), ...patch };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return settings;
  }

  function exportData() {
    return JSON.stringify({
      app: 'vi-giay-to',
      version: 1,
      exportedAt: new Date().toISOString(),
      documents: getAll(),
      settings: getSettings(),
    }, null, 2);
  }

  function importData(jsonString) {
    const parsed = JSON.parse(jsonString);
    if (!parsed || !Array.isArray(parsed.documents)) {
      throw new Error('Invalid backup file format');
    }
    saveAll(parsed.documents);
    if (parsed.settings) saveSettings(parsed.settings);
    return parsed.documents.length;
  }

  return {
    getAll, saveAll, getById, create, update, remove, toggleFavorite, clearAll,
    getSettings, saveSettings, exportData, importData, uid,
  };
})();
