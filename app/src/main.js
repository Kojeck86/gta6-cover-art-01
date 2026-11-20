// Neon Coast Cover Studio — editor wiring.
//
// Owns the cover state, the controls and the preview canvas. The look
// lives in cover.js; this file only moves state into it and exports PNGs.

import {
  COVER_LAYOUTS,
  COVER_GRADES,
  EXPORT_SIZES,
  layoutPanels,
  renderCover,
  defaultCoverState,
} from './cover.js';

const SAMPLE_PHOTOS = [
  { name: 'Boulevard', src: 'samples/boulevard.jpg' },
  { name: 'Neon street', src: 'samples/neon.jpg' },
  { name: 'Pier', src: 'samples/pier.jpg' },
];

const $ = (id) => document.getElementById(id);
const preview = $('preview');
const pctx = preview.getContext('2d');

let state = defaultCoverState();
let images = []; // HTMLImageElements, parallel to state.photos
let selectedPanel = 0;
let selectedSize = EXPORT_SIZES[0];
let history = [];
let historyAt = -1;
let dragging = null;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function addPhoto(entry) {
  const img = await loadImage(entry.src);
  state.photos.push(entry);
  images.push(img);
  renderAll();
}

function rebuildPhotoOptions() {
  const sel = $('panelPhoto');
  sel.innerHTML = '';
  state.photos.forEach((p, i) => {
    const o = document.createElement('option');
    o.value = String(i);
    o.textContent = p.name;
    sel.appendChild(o);
  });
}

function serializeState() {
  return JSON.stringify({
    layout: state.layout,
    grade: state.grade,
    title: state.title,
    subtitle: state.subtitle,
    titleSize: state.titleSize,
    titleColor: state.titleColor,
    fillOne: state.fillOne,
    frame: state.frame,
    grain: state.grain,
    vignette: state.vignette,
    photos: state.photos.map((p) => p.name),
    panels: state.panels,
  });
}

function pushHistory() {
  const snap = serializeState();
  if (history[historyAt] === snap) return;
  history = history.slice(0, historyAt + 1);
  history.push(snap);
  if (history.length > 40) history.shift();
  historyAt = history.length - 1;
  $('undoBtn').disabled = historyAt <= 0;
  $('redoBtn').disabled = true;
}

function restoreHistory(snap) {
  const s = JSON.parse(snap);
  const photos = state.photos;
  const imgs = images;
  state = { ...defaultCoverState(), ...s, photos, panels: s.panels };
  images = imgs;
  syncControls();
  renderAll();
}

function undo() {
  if (historyAt <= 0) return;
  historyAt -= 1;
  restoreHistory(history[historyAt]);
  $('undoBtn').disabled = historyAt <= 0;
  $('redoBtn').disabled = false;
}

function redo() {
  if (historyAt >= history.length - 1) return;
  historyAt += 1;
  restoreHistory(history[historyAt]);
  $('undoBtn').disabled = false;
  $('redoBtn').disabled = historyAt >= history.length - 1;
}

function renderAll() {
  preview.width = selectedSize.w;
  preview.height = selectedSize.h;
  renderCover(pctx, preview.width, preview.height, state, images);
  drawSelection();
}

function drawSelection() {
  const panels = layoutPanels(state.layout, preview.width, preview.height);
  const rect = panels[selectedPanel];
  if (!rect) return;
  pctx.save();
  pctx.strokeStyle = '#ffd166';
  pctx.lineWidth = Math.max(3, preview.width * 0.006);
  pctx.setLineDash([14, 8]);
  pctx.strokeRect(rect.x - 4, rect.y - 4, rect.w + 8, rect.h + 8);
  pctx.restore();
}

function panelAt(cx, cy) {
  const r = preview.getBoundingClientRect();
  const x = ((cx - r.left) / r.width) * preview.width;
  const y = ((cy - r.top) / r.height) * preview.height;
  const panels = layoutPanels(state.layout, preview.width, preview.height);
  for (let i = panels.length - 1; i >= 0; i--) {
    const p = panels[i];
    if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) return i;
  }
  return -1;
}

function syncControls() {
  $('titleInput').value = state.title;
  $('subtitleInput').value = state.subtitle;
  $('titleSize').value = state.titleSize;
  $('titleColor').value = state.titleColor;
  $('fillOne').checked = state.fillOne;
  $('frameToggle').checked = state.frame;
  $('grainToggle').checked = state.grain;
  $('vignetteToggle').checked = state.vignette;
  document.querySelectorAll('#layoutRow button').forEach((b) =>
    b.classList.toggle('active', b.dataset.layout === state.layout),
  );
  document.querySelectorAll('#gradeRow button').forEach((b) =>
    b.classList.toggle('active', b.dataset.grade === state.grade),
  );
  document.querySelectorAll('#sizeRow button').forEach((b) =>
    b.classList.toggle('active', b.dataset.size === selectedSize.id),
  );
  const slot = state.panels[selectedPanel] || { photo: 0, zoom: 1 };
  $('panelPhoto').value = String(slot.photo || 0);
  $('panelZoom').value = slot.zoom || 1;
  $('panelLabel').textContent = `Panel ${selectedPanel + 1} of ${layoutPanels(state.layout, 100, 100).length}`;
}

function buildButtonRows() {
  const layoutRow = $('layoutRow');
  COVER_LAYOUTS.forEach((l) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.layout = l.id;
    b.textContent = l.name;
    b.title = l.blurb;
    b.addEventListener('click', () => {
      state.layout = l.id;
      selectedPanel = 0;
      syncControls();
      renderAll();
      pushHistory();
    });
    layoutRow.appendChild(b);
  });
  const gradeRow = $('gradeRow');
  COVER_GRADES.forEach((g) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.grade = g.id;
    b.textContent = g.name;
    b.addEventListener('click', () => {
      state.grade = g.id;
      syncControls();
      renderAll();
      pushHistory();
    });
    gradeRow.appendChild(b);
  });
  const sizeRow = $('sizeRow');
  EXPORT_SIZES.forEach((s) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.size = s.id;
    b.textContent = s.name;
    b.addEventListener('click', () => {
      selectedSize = s;
      syncControls();
      renderAll();
    });
    sizeRow.appendChild(b);
  });
  const photoSel = $('panelPhoto');
  state.photos.forEach((p, i) => {
    const o = document.createElement('option');
    o.value = String(i);
    o.textContent = p.name;
    photoSel.appendChild(o);
  });
}

function exportCover(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  renderCover(canvas.getContext('2d'), size.w, size.h, state, images);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

async function downloadExport(size) {
  const blob = await exportCover(size);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `neon-coast-${size.id}-${size.w}x${size.h}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

function wireEvents() {
  $('titleInput').addEventListener('input', (e) => {
    state.title = e.target.value;
    renderAll();
  });
  $('titleInput').addEventListener('change', pushHistory);
  $('subtitleInput').addEventListener('input', (e) => {
    state.subtitle = e.target.value;
    renderAll();
  });
  $('subtitleInput').addEventListener('change', pushHistory);
  $('titleSize').addEventListener('input', (e) => {
    state.titleSize = Number(e.target.value);
    renderAll();
  });
  $('titleSize').addEventListener('change', pushHistory);
  $('titleColor').addEventListener('change', (e) => {
    state.titleColor = e.target.value;
    renderAll();
    pushHistory();
  });
  $('fillOne').addEventListener('change', (e) => {
    state.fillOne = e.target.checked;
    renderAll();
    pushHistory();
  });
  $('frameToggle').addEventListener('change', (e) => {
    state.frame = e.target.checked;
    renderAll();
    pushHistory();
  });
  $('grainToggle').addEventListener('change', (e) => {
    state.grain = e.target.checked;
    renderAll();
    pushHistory();
  });
  $('vignetteToggle').addEventListener('change', (e) => {
    state.vignette = e.target.checked;
    renderAll();
    pushHistory();
  });
  $('panelPhoto').addEventListener('change', (e) => {
    state.panels[selectedPanel].photo = Number(e.target.value);
    state.fillOne = false;
    $('fillOne').checked = false;
    renderAll();
    pushHistory();
  });
  $('panelZoom').addEventListener('input', (e) => {
    state.panels[selectedPanel].zoom = Number(e.target.value);
    renderAll();
  });
  $('panelZoom').addEventListener('change', pushHistory);
  $('shuffleBtn').addEventListener('click', () => {
    const layouts = COVER_LAYOUTS.map((l) => l.id);
    const grades = COVER_GRADES.map((g) => g.id);
    state.layout = layouts[Math.floor(Math.random() * layouts.length)];
    state.grade = grades[Math.floor(Math.random() * grades.length)];
    selectedPanel = 0;
    syncControls();
    renderAll();
    pushHistory();
  });
  $('undoBtn').addEventListener('click', undo);
  $('redoBtn').addEventListener('click', redo);
  $('exportBtn').addEventListener('click', () => downloadExport(selectedSize));
  $('exportAllBtn').addEventListener('click', async () => {
    for (const s of EXPORT_SIZES) {
      // eslint-disable-next-line no-await-in-loop
      await downloadExport(s);
    }
  });
  $('photoInput').addEventListener('change', async (e) => {
    const files = [...e.target.files];
    for (const f of files) {
      // eslint-disable-next-line no-await-in-loop
      await addPhoto({ name: f.name, src: URL.createObjectURL(f) });
    }
    rebuildPhotoOptions();
    syncControls();
    pushHistory();
  });
  preview.addEventListener('pointerdown', (e) => {
    const i = panelAt(e.clientX, e.clientY);
    if (i < 0) return;
    selectedPanel = i;
    dragging = { x: e.clientX, y: e.clientY, dx: state.panels[i].dx, dy: state.panels[i].dy };
    preview.setPointerCapture(e.pointerId);
    syncControls();
    renderAll();
  });
  preview.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const r = preview.getBoundingClientRect();
    const slot = state.panels[selectedPanel];
    slot.dx = dragging.dx + (e.clientX - dragging.x) / r.width;
    slot.dy = dragging.dy + (e.clientY - dragging.y) / r.height;
    slot.dx = Math.max(-0.5, Math.min(0.5, slot.dx));
    slot.dy = Math.max(-0.5, Math.min(0.5, slot.dy));
    renderAll();
  });
  preview.addEventListener('pointerup', () => {
    if (dragging) pushHistory();
    dragging = null;
  });
  preview.addEventListener('wheel', (e) => {
    const i = panelAt(e.clientX, e.clientY);
    if (i < 0) return;
    e.preventDefault();
    const slot = state.panels[i];
    slot.zoom = Math.max(0.6, Math.min(3, (slot.zoom || 1) * (e.deltaY < 0 ? 1.06 : 0.94)));
    selectedPanel = i;
    syncControls();
    renderAll();
  }, { passive: false });
}

// Hooks for the maker's own validation runs: drive the app from a
// headless browser without touching the UI.
window.__cover = {
  get state() {
    return state;
  },
  get images() {
    return images;
  },
  renderAll,
  exportCover,
  async exportDataURL(size) {
    const canvas = document.createElement('canvas');
    canvas.width = size.w;
    canvas.height = size.h;
    renderCover(canvas.getContext('2d'), size.w, size.h, state, images);
    return canvas.toDataURL('image/png');
  },
  setLayout(id) {
    state.layout = id;
    selectedPanel = 0;
    syncControls();
    renderAll();
  },
  setGrade(id) {
    state.grade = id;
    syncControls();
    renderAll();
  },
};

async function init() {
  buildButtonRows();
  wireEvents();
  for (const s of SAMPLE_PHOTOS) {
    // eslint-disable-next-line no-await-in-loop
    await addPhoto(s);
  }
  rebuildPhotoOptions();
  syncControls();
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }
  renderAll();
  pushHistory();
}

init();
