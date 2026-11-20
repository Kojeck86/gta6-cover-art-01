// Neon Coast Cover Studio — cover engine.
//
// Pure canvas code: given a state (photos, layout, grade, caption) it
// draws one GTA-style poster cover at any size. No network, no DOM
// besides the canvas it is handed. The editor (main.js) owns the state;
// this file owns the look.

export const COVER_LAYOUTS = [
  { id: 'quad', name: 'Quad', panels: 4, blurb: 'Four panels, two by two' },
  { id: 'hero', name: 'Hero + Trio', panels: 4, blurb: 'One hero, three stacked' },
  { id: 'full', name: 'Full Bleed', panels: 1, blurb: 'One photo, edge to edge' },
  { id: 'tilted', name: 'Tilted Snaps', panels: 3, blurb: 'Three tilted snapshots' },
  { id: 'strip', name: 'Strip', panels: 3, blurb: 'Three bands, top to bottom' },
];

export const COVER_GRADES = [
  {
    id: 'sunset', name: 'Sunset', strength: 0.55,
    stops: [[0, [12, 8, 26]], [0.3, [86, 30, 96]], [0.55, [214, 58, 110]], [0.8, [255, 150, 80]], [1, [255, 236, 170]]],
  },
  {
    id: 'neon', name: 'Neon Nights', strength: 0.6,
    stops: [[0, [6, 8, 30]], [0.3, [40, 20, 90]], [0.55, [200, 40, 150]], [0.8, [60, 220, 225]], [1, [235, 250, 255]]],
  },
  {
    id: 'vice', name: 'Vice Gold', strength: 0.5,
    stops: [[0, [16, 10, 34]], [0.35, [92, 40, 110]], [0.65, [198, 110, 60]], [0.85, [255, 200, 90]], [1, [255, 244, 200]]],
  },
  {
    id: 'golden', name: 'Golden Hour', strength: 0.45,
    stops: [[0, [20, 14, 10]], [0.35, [96, 58, 28]], [0.65, [214, 140, 60]], [0.85, [255, 205, 120]], [1, [255, 240, 200]]],
  },
  {
    id: 'noir', name: 'Noir', strength: 0.7,
    stops: [[0, [0, 0, 0]], [0.25, [28, 28, 32]], [0.55, [110, 110, 116]], [0.8, [200, 200, 205]], [1, [255, 255, 255]]],
  },
];

export const EXPORT_SIZES = [
  { id: 'square', name: 'Square 1080 × 1080', w: 1080, h: 1080 },
  { id: 'portrait', name: 'Portrait 1080 × 1350', w: 1080, h: 1350 },
  { id: 'wide', name: 'Wide 1920 × 1080', w: 1920, h: 1080 },
];

/** Panel rectangles for a layout, in fractions of the cover (x, y, w, h, rot). */
export function layoutPanels(layoutId, w, h) {
  const g = 0.018; // gutter, as a fraction of the short side
  const pad = 0.03;
  const titleH = 0.16; // title band kept clear at the bottom
  const px = pad * Math.min(w, h);
  const gx = g * Math.min(w, h);
  const top = px;
  const bottom = h - titleH * h - px;
  const left = px;
  const right = w - px;
  const availW = right - left;
  const availH = bottom - top;
  switch (layoutId) {
    case 'quad': {
      const cw = (availW - gx) / 2;
      const ch = (availH - gx) / 2;
      return [
        { x: left, y: top, w: cw, h: ch, rot: 0 },
        { x: left + cw + gx, y: top, w: cw, h: ch, rot: 0 },
        { x: left, y: top + ch + gx, w: cw, h: ch, rot: 0 },
        { x: left + cw + gx, y: top + ch + gx, w: cw, h: ch, rot: 0 },
      ];
    }
    case 'hero': {
      const heroW = availW * 0.62;
      const sideW = availW - heroW - gx;
      const sh = (availH - 2 * gx) / 3;
      return [
        { x: left, y: top, w: heroW, h: availH, rot: 0 },
        { x: left + heroW + gx, y: top, w: sideW, h: sh, rot: 0 },
        { x: left + heroW + gx, y: top + sh + gx, w: sideW, h: sh, rot: 0 },
        { x: left + heroW + gx, y: top + 2 * (sh + gx), w: sideW, h: sh, rot: 0 },
      ];
    }
    case 'full':
      return [{ x: left, y: top, w: availW, h: availH, rot: 0 }];
    case 'tilted': {
      const cw = availW * 0.52;
      const ch = availH * 0.62;
      return [
        { x: left + availW * 0.02, y: top + availH * 0.04, w: cw, h: ch, rot: -0.09 },
        { x: left + availW * 0.42, y: top + availH * 0.02, w: cw, h: ch, rot: 0.07 },
        { x: left + availW * 0.22, y: top + availH * 0.3, w: cw, h: ch, rot: -0.02 },
      ];
    }
    case 'strip': {
      const sh = (availH - 2 * gx) / 3;
      return [
        { x: left, y: top, w: availW, h: sh, rot: 0 },
        { x: left, y: top + sh + gx, w: availW, h: sh, rot: 0 },
        { x: left, y: top + 2 * (sh + gx), w: availW, h: sh, rot: 0 },
      ];
    }
    default:
      return layoutPanels('quad', w, h);
  }
}

/** Build a 256-entry luminance -> RGB lookup for one grade. */
export function gradeLookup(gradeId) {
  const grade = COVER_GRADES.find((g) => g.id === gradeId) || COVER_GRADES[0];
  const lut = { r: new Uint8Array(256), g: new Uint8Array(256), b: new Uint8Array(256) };
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let a = grade.stops[0];
    let b = grade.stops[grade.stops.length - 1];
    for (let s = 0; s < grade.stops.length - 1; s++) {
      if (t >= grade.stops[s][0] && t <= grade.stops[s + 1][0]) {
        a = grade.stops[s];
        b = grade.stops[s + 1];
        break;
      }
    }
    const f = b[0] === a[0] ? 0 : (t - a[0]) / (b[0] - a[0]);
    lut.r[i] = Math.round(a[1][0] + (b[1][0] - a[1][0]) * f);
    lut.g[i] = Math.round(a[1][1] + (b[1][1] - a[1][1]) * f);
    lut.b[i] = Math.round(a[1][2] + (b[1][2] - a[1][2]) * f);
  }
  return { lut, strength: grade.strength };
}

/** Recolour a canvas in place through the grade lookup, blended by strength. */
export function applyGrade(canvas, gradeId) {
  const { lut, strength } = gradeLookup(gradeId);
  const ctx = canvas.getContext('2d');
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const lum = Math.round(0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]);
    d[i] = Math.round(d[i] + (lut.r[lum] - d[i]) * strength);
    d[i + 1] = Math.round(d[i + 1] + (lut.g[lum] - d[i + 1]) * strength);
    d[i + 2] = Math.round(d[i + 2] + (lut.b[lum] - d[i + 2]) * strength);
  }
  ctx.putImageData(img, 0, 0);
}

/** Draw one photo into a panel rect, cover-fit, with its pan/zoom transform.
 *  A rotated panel rotates first and clips second, so the photo fills
 *  the tilted frame instead of being cut by the upright one. */
export function drawPanelPhoto(ctx, photo, rect, transform) {
  const { x, y, w, h, rot } = rect;
  const zoom = transform.zoom || 1;
  const dx = transform.dx || 0;
  const dy = transform.dy || 0;
  const iw = photo.naturalWidth || photo.width;
  const ih = photo.naturalHeight || photo.height;
  const base = Math.max(w / iw, h / ih) * zoom;
  const dw = iw * base;
  const dh = ih * base;
  ctx.save();
  if (rot) {
    // Rotate about the panel centre; after this the panel's own
    // top-left corner is the origin, so clip and draw at (0, 0).
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(rot);
    ctx.translate(-w / 2, -h / 2);
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    ctx.clip();
    ctx.drawImage(photo, (w - dw) / 2 + dx * w, (h - dh) / 2 + dy * h, dw, dh);
  } else {
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.drawImage(photo, x + (w - dw) / 2 + dx * w, y + (h - dh) / 2 + dy * h, dw, dh);
  }
  ctx.restore();
}

/** A thin white inner frame plus a soft drop shadow around a panel. */
export function drawPanelFrame(ctx, rect) {
  const { x, y, w, h, rot } = rect;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = Math.max(6, w * 0.02);
  ctx.shadowOffsetY = Math.max(3, w * 0.008);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(2, w * 0.012);
  if (rot) {
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(rot);
    ctx.translate(-w / 2, -h / 2);
    ctx.strokeRect(0, 0, w, h);
  } else {
    ctx.strokeRect(x, y, w, h);
  }
  ctx.restore();
}

/** Film grain: a tiled noise pattern drawn faintly over the cover. */
let grainTile = null;
export function drawGrain(ctx, w, h) {
  if (!grainTile) {
    grainTile = document.createElement('canvas');
    grainTile.width = 140;
    grainTile.height = 140;
    const g = grainTile.getContext('2d');
    const img = g.createImageData(140, 140);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.floor(Math.random() * 255);
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 22;
    }
    g.putImageData(img, 0, 0);
  }
  const pattern = ctx.createPattern(grainTile, 'repeat');
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** Darkened corners pulling the eye to the middle of the cover. */
export function drawVignette(ctx, w, h) {
  const r = Math.hypot(w, h) / 2;
  const grad = ctx.createRadialGradient(w / 2, h / 2, r * 0.45, w / 2, h / 2, r);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.34)');
  ctx.save();
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** The caption: a big Anton title with a sunset gradient fill and a
 *  Pacifico neon subtitle beneath it, centred in the title band. */
export function drawTitleBlock(ctx, w, h, state) {
  const bandY = h * 0.84;
  const bandH = h * 0.16;
  const cx = w / 2;
  const title = (state.title || '').toUpperCase();
  const sub = state.subtitle || '';
  const base = Math.min(w, h);
  const titlePx = Math.round(base * 0.085 * (state.titleSize || 1));
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // A dark ribbon behind the lettering so it reads on any photo.
  ctx.fillStyle = 'rgba(10,6,20,0.55)';
  ctx.fillRect(0, bandY - bandH * 0.08, w, bandH * 1.08);
  ctx.fillStyle = '#ff5e8a';
  ctx.fillRect(0, bandY - bandH * 0.08, w, Math.max(2, h * 0.004));
  const grad = ctx.createLinearGradient(0, bandY, 0, bandY + titlePx);
  if (state.titleColor === 'white') {
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, '#ffe9c9');
  } else if (state.titleColor === 'neon') {
    grad.addColorStop(0, '#ff5e8a');
    grad.addColorStop(0.55, '#c86bff');
    grad.addColorStop(1, '#54e8e0');
  } else {
    grad.addColorStop(0, '#ffd166');
    grad.addColorStop(0.5, '#ff7a59');
    grad.addColorStop(1, '#ff4d8d');
  }
  ctx.font = `${titlePx}px Anton, 'Arial Black', sans-serif`;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(20,8,24,0.9)';
  ctx.lineWidth = Math.max(2, titlePx * 0.09);
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = Math.max(4, titlePx * 0.12);
  ctx.shadowOffsetY = Math.max(2, titlePx * 0.05);
  const ty = bandY + bandH * 0.32;
  ctx.strokeText(title, cx, ty);
  ctx.fillStyle = grad;
  ctx.fillText(title, cx, ty);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  if (sub) {
    const subPx = Math.round(base * 0.038);
    ctx.font = `${subPx}px Pacifico, cursive`;
    ctx.fillStyle = state.titleColor === 'neon' ? '#7df3ec' : '#ffd166';
    ctx.fillText(sub, cx, bandY + bandH * 0.78);
  }
  ctx.restore();
}

/** Draw the whole cover onto ctx at its own size. `photos` is an array
 *  of loaded HTMLImageElements, parallel to state.photos. */
export function renderCover(ctx, w, h, state, photos) {
  ctx.clearRect(0, 0, w, h);
  // Deep violet backdrop: the panels float on it.
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#1b0f2e');
  bg.addColorStop(1, '#0d0718');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const panels = layoutPanels(state.layout, w, h);
  const graded = document.createElement('canvas');
  panels.forEach((rect, i) => {
    const slot = state.panels[i] || { photo: 0, zoom: 1, dx: 0, dy: 0 };
    const photoIndex = state.fillOne ? 0 : slot.photo || 0;
    const photo = photos[photoIndex] || photos[0];
    if (!photo) return;
    // Grade on a panel-sized scratch canvas so the grade is per panel.
    const pw = Math.max(2, Math.round(rect.w));
    const ph = Math.max(2, Math.round(rect.h));
    graded.width = pw;
    graded.height = ph;
    const gctx = graded.getContext('2d');
    const fit = { x: 0, y: 0, w: pw, h: ph, rot: 0 };
    drawPanelPhoto(gctx, photo, fit, slot);
    applyGrade(graded, state.grade);
    ctx.save();
    if (rect.rot) {
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate(rect.rot);
      ctx.translate(-rect.w / 2, -rect.h / 2);
      ctx.drawImage(graded, 0, 0, rect.w, rect.h);
    } else {
      ctx.drawImage(graded, rect.x, rect.y, rect.w, rect.h);
    }
    ctx.restore();
    if (state.frame !== false) drawPanelFrame(ctx, rect);
  });

  if (state.vignette !== false) drawVignette(ctx, w, h);
  if (state.grain !== false) drawGrain(ctx, w, h);
  drawTitleBlock(ctx, w, h, state);
}

/** A fresh default state for a new cover. */
export function defaultCoverState() {
  return {
    layout: 'hero',
    grade: 'sunset',
    title: 'NEON COAST',
    subtitle: 'Vice City nights',
    titleSize: 1,
    titleColor: 'sunset',
    fillOne: true,
    frame: true,
    grain: true,
    vignette: true,
    photos: [],
    panels: [
      { photo: 0, zoom: 1.05, dx: 0, dy: 0 },
      { photo: 1, zoom: 1.05, dx: 0, dy: 0 },
      { photo: 2, zoom: 1.05, dx: 0, dy: 0 },
      { photo: 0, zoom: 1.05, dx: 0, dy: 0 },
    ],
  };
}
