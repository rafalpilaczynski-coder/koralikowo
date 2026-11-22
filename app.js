// Koralikowo — Standalone Browser Engine (100% client-side, zero LLM, GitHub Pages ready)

const STANDARD_BEAD_PALETTE = [
  { code: 'K01', name: 'Biel', rgb: [250, 250, 250] },
  { code: 'K02', name: 'Kremowy', rgb: [245, 230, 200] },
  { code: 'K03', name: 'Cytrynowy', rgb: [255, 235, 59] },
  { code: 'K04', name: 'Żółty słoneczny', rgb: [255, 193, 7] },
  { code: 'K05', name: 'Brzoskwiniowy', rgb: [255, 204, 153] },
  { code: 'K06', name: 'Pomarańczowy', rgb: [255, 109, 0] },
  { code: 'K07', name: 'Koralowy', rgb: [255, 90, 95] },
  { code: 'K08', name: 'Czerwony', rgb: [211, 47, 47] },
  { code: 'K09', name: 'Bordowy', rgb: [136, 14, 79] },
  { code: 'K10', name: 'Jasny róż', rgb: [248, 187, 208] },
  { code: 'K11', name: 'Różowy', rgb: [236, 64, 122] },
  { code: 'K12', name: 'Fuksja', rgb: [216, 27, 96] },
  { code: 'K13', name: 'Lawendowy', rgb: [206, 147, 216] },
  { code: 'K14', name: 'Fioletowy', rgb: [123, 31, 162] },
  { code: 'K15', name: 'Śliwkowy', rgb: [74, 20, 140] },
  { code: 'K16', name: 'Błękit nieba', rgb: [129, 212, 250] },
  { code: 'K17', name: 'Turkusowy', rgb: [0, 172, 193] },
  { code: 'K18', name: 'Niebieski', rgb: [30, 136, 229] },
  { code: 'K19', name: 'Kobaltowy', rgb: [21, 101, 192] },
  { code: 'K20', name: 'Granatowy', rgb: [26, 35, 126] },
  { code: 'K21', name: 'Miętowy', rgb: [128, 203, 196] },
  { code: 'K22', name: 'Limonkowy', rgb: [156, 204, 101] },
  { code: 'K23', name: 'Zielony jasny', rgb: [76, 175, 80] },
  { code: 'K24', name: 'Zielony las', rgb: [46, 125, 50] },
  { code: 'K25', name: 'Ciemnozielony', rgb: [27, 94, 32] },
  { code: 'K26', name: 'Oliwkowy', rgb: [130, 119, 23] },
  { code: 'K27', name: 'Piaskowy', rgb: [215, 184, 153] },
  { code: 'K28', name: 'Karmelowy', rgb: [198, 134, 66] },
  { code: 'K29', name: 'Brązowy', rgb: [121, 85, 72] },
  { code: 'K30', name: 'Ciemny brąz', rgb: [78, 52, 46] },
  { code: 'K31', name: 'Jasnoszary', rgb: [207, 216, 220] },
  { code: 'K32', name: 'Szary', rgb: [144, 164, 174] },
  { code: 'K33', name: 'Grafitowy', rgb: [69, 90, 100] },
  { code: 'K34', name: 'Czarny', rgb: [30, 30, 30] },
  { code: 'K35', name: 'Morski', rgb: [0, 121, 107] },
  { code: 'K36', name: 'Łososiowy', rgb: [255, 138, 101] },
];

const DEFAULT_MANUAL_CODES = new Set(['K01', 'K04', 'K06', 'K08', 'K18', 'K23', 'K29', 'K34']);

const state = {
  width: 15,
  height: 15,
  colorCount: 8,
  snapToPalette: true,
  paletteMode: 'auto', // 'auto' | 'manual'
  manualCodes: new Set(DEFAULT_MANUAL_CODES),
  shadeTolerance: 10,
  cropMode: 'fill', // 'fill' | 'fit'
  sourceCanvas: null,
  sourceName: 'Przykład: Lisek',
  pattern: null,
  undoPattern: null,
  activeTab: 'map',
  showNumbers: true,
  placementMode: false,
  placedCells: new Set(),
  highlightedIndex: null,
  selectedCell: null,
  showOriginal: false,
  simMode: 'pegboard',
  showPins: true,
  ironIntensity: 0.65,
  mapView: { scale: 1, panX: 0, panY: 0 },
  simView: { scale: 1, panX: 0, panY: 0 },
  exportContent: 'both',
  exportFormat: 'pdf',
  replaceTargetIdx: null,
};

// --- Color Math: sRGB <-> CIE Lab ---

function srgbToLinear(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function linearToSrgb(c) {
  const cl = Math.max(0, Math.min(1, c));
  const v = cl <= 0.0031308 ? 12.92 * cl : 1.055 * Math.pow(cl, 1 / 2.4) - 0.055;
  return Math.round(v * 255);
}

function labF(t) {
  return t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
}

function labFInv(t) {
  const t3 = t * t * t;
  return t3 > 0.008856 ? t3 : (t - 16 / 116) / 7.787;
}

function rgbToLab(rgb) {
  const r = srgbToLinear(rgb[0]);
  const g = srgbToLinear(rgb[1]);
  const b = srgbToLinear(rgb[2]);
  const x = (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) / 0.95047;
  const y = (r * 0.2126729 + g * 0.7151522 + b * 0.072175) / 1.0;
  const z = (r * 0.0193339 + g * 0.119192 + b * 0.9503041) / 1.08883;
  const fx = labF(x), fy = labF(y), fz = labF(z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

function labToRgb(lab) {
  const fy = (lab[0] + 16) / 116;
  const fx = lab[1] / 500 + fy;
  const fz = fy - lab[2] / 200;
  const x = labFInv(fx) * 0.95047;
  const y = labFInv(fy) * 1.0;
  const z = labFInv(fz) * 1.08883;
  const r = x * 3.2404542 - y * 1.5371385 - z * 0.4985314;
  const g = -x * 0.969266 + y * 1.8760108 + z * 0.041556;
  const b = x * 0.0556434 - y * 0.2040259 + z * 1.0572252;
  return [linearToSrgb(r), linearToSrgb(g), linearToSrgb(b)];
}

function labDistSq(a, b) {
  const dl = a[0] - b[0];
  const da = a[1] - b[1];
  const db = a[2] - b[2];
  return dl * dl + da * da + db * db;
}

function rgbToHex(rgb) {
  return (
    '#' +
    rgb
      .map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0'))
      .join('')
  );
}

function isDarkColor(rgb) {
  const lum = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
  return lum < 0.52;
}

function describeRgbInPolish(rgb) {
  const r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let hue = 0;
  if (d > 1e-5) {
    if (max === r) hue = 60 * (((g - b) / d) % 6);
    else if (max === g) hue = 60 * ((b - r) / d + 2);
    else hue = 60 * ((r - g) / d + 4);
    if (hue < 0) hue += 360;
  }
  const sat = max <= 1e-5 ? 0 : d / max;
  if (max < 0.16) return 'Czerń';
  if (sat < 0.14) return max > 0.88 ? 'Biel' : max > 0.62 ? 'Jasnoszary' : 'Szary';
  if (hue < 18 || hue >= 342) return max > 0.75 ? 'Czerwony' : 'Bordowy';
  if (hue < 42) return sat < 0.45 ? 'Beżowy' : 'Pomarańczowy';
  if (hue < 68) return 'Żółty';
  if (hue < 155) return max > 0.65 ? 'Jasnozielony' : 'Zielony';
  if (hue < 195) return 'Turkusowy';
  if (hue < 252) return max > 0.7 ? 'Błękitny' : 'Niebieski';
  if (hue < 295) return 'Fioletowy';
  return 'Różowy';
}

// --- Built-in Sample Artwork Generators ---

function createSampleCanvas(kind) {
  const c = document.createElement('canvas');
  c.width = 360;
  c.height = 360;
  const ctx = c.getContext('2d');
  if (kind === 'fox') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 360, 360);
    // Ears
    ctx.fillStyle = '#FF6D00';
    ctx.beginPath(); ctx.moveTo(68, 130); ctx.lineTo(95, 42); ctx.lineTo(155, 102); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(292, 130); ctx.lineTo(265, 42); ctx.lineTo(205, 102); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#4E342E';
    ctx.beginPath(); ctx.moveTo(86, 114); ctx.lineTo(100, 62); ctx.lineTo(136, 98); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(274, 114); ctx.lineTo(260, 62); ctx.lineTo(224, 98); ctx.closePath(); ctx.fill();
    // Head
    ctx.fillStyle = '#FF6D00';
    ctx.beginPath(); ctx.ellipse(180, 195, 118, 96, 0, 0, Math.PI * 2); ctx.fill();
    // Cheeks
    ctx.fillStyle = '#FFF3DF';
    ctx.beginPath(); ctx.moveTo(64, 200); ctx.quadraticCurveTo(120, 290, 180, 290); ctx.quadraticCurveTo(135, 225, 64, 200); ctx.fill();
    ctx.beginPath(); ctx.moveTo(296, 200); ctx.quadraticCurveTo(240, 290, 180, 290); ctx.quadraticCurveTo(225, 225, 296, 200); ctx.fill();
    // Eyes & Nose
    ctx.fillStyle = '#1E1E1E';
    ctx.beginPath(); ctx.arc(132, 182, 14, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(228, 182, 14, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(180, 244, 16, 0, Math.PI * 2); ctx.fill();
  } else {
    c.height = 480;
    ctx.fillStyle = '#1A237E';
    ctx.fillRect(0, 0, 360, 480);
    // Stars
    ctx.fillStyle = '#FFEB3B';
    [[55, 70, 8], [305, 95, 9], [70, 330, 7], [300, 360, 8]].forEach(([x, y, r]) => {
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    });
    // Flame
    ctx.fillStyle = '#FF6D00';
    ctx.beginPath(); ctx.moveTo(135, 345); ctx.lineTo(180, 445); ctx.lineTo(225, 345); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#FFEB3B';
    ctx.beginPath(); ctx.moveTo(155, 345); ctx.lineTo(180, 412); ctx.lineTo(205, 345); ctx.closePath(); ctx.fill();
    // Fins
    ctx.fillStyle = '#D32F2F';
    ctx.beginPath(); ctx.moveTo(120, 260); ctx.lineTo(75, 345); ctx.lineTo(130, 335); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(240, 260); ctx.lineTo(285, 345); ctx.lineTo(230, 335); ctx.closePath(); ctx.fill();
    // Body
    ctx.fillStyle = '#FAFAFA';
    ctx.beginPath(); ctx.ellipse(180, 215, 62, 130, 0, 0, Math.PI * 2); ctx.fill();
    // Nosecone
    ctx.fillStyle = '#D32F2F';
    ctx.beginPath(); ctx.moveTo(125, 145); ctx.quadraticCurveTo(180, 50, 235, 145); ctx.closePath(); ctx.fill();
    // Porthole
    ctx.fillStyle = '#1E88E5';
    ctx.beginPath(); ctx.arc(180, 205, 28, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#90A4AE';
    ctx.lineWidth = 8;
    ctx.stroke();
  }
  return c;
}

// --- Pattern Quantization Engine ---

function sampleSourceToCells(sourceCanvas, targetW, targetH, cropMode) {
  const scale = 8;
  const workW = targetW * scale;
  const workH = targetH * scale;
  const work = document.createElement('canvas');
  work.width = workW;
  work.height = workH;
  const ctx = work.getContext('2d');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, workW, workH);

  const srcW = sourceCanvas.width;
  const srcH = sourceCanvas.height;
  if (cropMode === 'fill') {
    const s = Math.max(workW / srcW, workH / srcH);
    const cropW = Math.round(workW / s);
    const cropH = Math.round(workH / s);
    const sx = Math.max(0, Math.floor((srcW - cropW) / 2));
    const sy = Math.max(0, Math.floor((srcH - cropH) / 2));
    ctx.drawImage(sourceCanvas, sx, sy, cropW, cropH, 0, 0, workW, workH);
  } else {
    const s = Math.min(workW / srcW, workH / srcH);
    const dw = Math.max(1, Math.round(srcW * s));
    const dh = Math.max(1, Math.round(srcH * s));
    const dx = Math.floor((workW - dw) / 2);
    const dy = Math.floor((workH - dh) / 2);
    ctx.drawImage(sourceCanvas, 0, 0, srcW, srcH, dx, dy, dw, dh);
  }

  const data = ctx.getImageData(0, 0, workW, workH).data;
  const cells = new Array(targetW * targetH);
  const blockCount = scale * scale;
  for (let r = 0; r < targetH; r++) {
    for (let c = 0; c < targetW; c++) {
      let sr = 0, sg = 0, sb = 0;
      const by = r * scale;
      const bx = c * scale;
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const idx = ((by + dy) * workW + (bx + dx)) * 4;
          sr += data[idx];
          sg += data[idx + 1];
          sb += data[idx + 2];
        }
      }
      cells[r * targetW + c] = [
        Math.round(sr / blockCount),
        Math.round(sg / blockCount),
        Math.round(sb / blockCount),
      ];
    }
  }
  return cells;
}

function deterministicRand(seedRef) {
  seedRef.v = (seedRef.v * 1664525 + 1013904223) >>> 0;
  return seedRef.v / 4294967296;
}

function kMeansPlusPlusInit(points, k) {
  const seedRef = { v: 421337 };
  const centroids = [points[Math.floor(points.length / 2)].slice()];
  const minDists = new Float64Array(points.length).fill(Infinity);
  while (centroids.length < k) {
    const last = centroids[centroids.length - 1];
    let total = 0;
    for (let i = 0; i < points.length; i++) {
      const d = labDistSq(points[i], last);
      if (d < minDists[i]) minDists[i] = d;
      total += minDists[i];
    }
    if (total <= 1e-6) {
      centroids.push(points[Math.floor(deterministicRand(seedRef) * points.length)].slice());
      continue;
    }
    const target = deterministicRand(seedRef) * total;
    let acc = 0;
    let picked = points[points.length - 1];
    for (let i = 0; i < points.length; i++) {
      acc += minDists[i];
      if (acc >= target) {
        picked = points[i];
        break;
      }
    }
    centroids.push(picked.slice());
  }
  return centroids;
}

function generatePattern() {
  if (!state.sourceCanvas) return;
  const w = state.width;
  const h = state.height;
  const cells = sampleSourceToCells(state.sourceCanvas, w, h, state.cropMode);
  const total = cells.length;
  const labs = cells.map(rgbToLab);

  let assignments = new Int32Array(total);
  let initialInfos = [];

  if (state.paletteMode === 'manual') {
    const manualList = STANDARD_BEAD_PALETTE.filter((b) => state.manualCodes.has(b.code));
    const manualLabs = manualList.map((b) => rgbToLab(b.rgb));
    for (let i = 0; i < total; i++) {
      let bestIdx = 0;
      let bestD = Infinity;
      for (let m = 0; m < manualLabs.length; m++) {
        const d = labDistSq(labs[i], manualLabs[m]);
        if (d < bestD) {
          bestD = d;
          bestIdx = m;
        }
      }
      assignments[i] = bestIdx;
    }
    initialInfos = manualList.map((b) => ({ code: b.code, name: b.name, rgb: b.rgb.slice() }));
  } else {
    const uniqueMap = new Map();
    cells.forEach((rgb) => {
      const key = rgb.join(',');
      if (!uniqueMap.has(key)) uniqueMap.set(key, rgb);
    });
    const uniqueList = Array.from(uniqueMap.values());
    const k = Math.max(1, Math.min(state.colorCount, uniqueList.length));
    let clusterRgbs;

    if (uniqueList.length <= state.colorCount && !state.snapToPalette) {
      clusterRgbs = uniqueList;
      for (let i = 0; i < total; i++) {
        assignments[i] = uniqueList.findIndex((u) => u[0] === cells[i][0] && u[1] === cells[i][1] && u[2] === cells[i][2]);
      }
    } else {
      const centroids = kMeansPlusPlusInit(labs, k);
      for (let iter = 0; iter < 14; iter++) {
        const counts = new Int32Array(k);
        const sumL = new Float64Array(k);
        const sumA = new Float64Array(k);
        const sumB = new Float64Array(k);
        for (let i = 0; i < total; i++) {
          let bestC = 0, bestD = Infinity;
          for (let ci = 0; ci < k; ci++) {
            const d = labDistSq(labs[i], centroids[ci]);
            if (d < bestD) { bestD = d; bestC = ci; }
          }
          assignments[i] = bestC;
          counts[bestC]++;
          sumL[bestC] += labs[i][0];
          sumA[bestC] += labs[i][1];
          sumB[bestC] += labs[i][2];
        }
        for (let ci = 0; ci < k; ci++) {
          if (counts[ci] > 0) {
            centroids[ci] = [sumL[ci] / counts[ci], sumA[ci] / counts[ci], sumB[ci] / counts[ci]];
          }
        }
      }
      clusterRgbs = centroids.map(labToRgb);
    }

    if (state.snapToPalette) {
      const paletteLabs = STANDARD_BEAD_PALETTE.map((b) => ({ bead: b, lab: rgbToLab(b.rgb) }));
      const freq = new Int32Array(k);
      for (let i = 0; i < total; i++) freq[assignments[i]]++;
      const order = Array.from({ length: k }, (_, i) => i).sort((a, b) => freq[b] - freq[a]);
      const chosen = new Array(k);
      const used = new Set();

      order.forEach((ci) => {
        const cLab = rgbToLab(clusterRgbs[ci]);
        const sorted = paletteLabs
          .map((item) => ({ bead: item.bead, d2: labDistSq(cLab, item.lab) }))
          .sort((a, b) => a.d2 - b.d2);
        const bestAny = sorted[0];
        const bestUnused = sorted.find((s) => !used.has(s.bead.code));
        const selected =
          bestUnused && (!used.has(bestAny.bead.code) || bestUnused.d2 < bestAny.d2 * 1.85 + 60)
            ? bestUnused.bead
            : bestAny.bead;
        chosen[ci] = selected;
        used.add(selected.code);
      });

      initialInfos = chosen.map((b) => ({ code: b.code, name: b.name, rgb: b.rgb.slice() }));
    } else {
      initialInfos = clusterRgbs.map((rgb, idx) => ({
        code: `C${String(idx + 1).padStart(2, '0')}`,
        name: describeRgbInPolish(rgb),
        rgb,
      }));
    }
  }

  // Deduplicate identical RGBs
  const keyToNew = new Map();
  const dedupedInfos = [];
  const remap = new Int32Array(initialInfos.length);
  initialInfos.forEach((info, i) => {
    const key = info.rgb.join(',');
    if (keyToNew.has(key)) {
      remap[i] = keyToNew.get(key);
    } else {
      const ni = dedupedInfos.length;
      keyToNew.set(key, ni);
      dedupedInfos.push(info);
      remap[i] = ni;
    }
  });

  const remapped = new Int32Array(total);
  for (let i = 0; i < total; i++) remapped[i] = remap[assignments[i]];

  // Shade tolerance ΔE merging
  if (state.shadeTolerance > 0.5 && dedupedInfos.length > 1) {
    const n = dedupedInfos.length;
    const dLabs = dedupedInfos.map((info) => rgbToLab(info.rgb));
    const counts = new Int32Array(n);
    const active = new Array(n).fill(false);
    for (let i = 0; i < total; i++) {
      counts[remapped[i]]++;
      active[remapped[i]] = true;
    }
    const redirect = Array.from({ length: n }, (_, i) => i);
    while (true) {
      const activeIds = [];
      for (let i = 0; i < n; i++) if (active[i] && counts[i] > 0) activeIds.push(i);
      if (activeIds.length <= 1) break;
      let bestA = -1, bestB = -1, bestDE = Infinity;
      for (let i = 0; i < activeIds.length; i++) {
        for (let j = i + 1; j < activeIds.length; j++) {
          const de = Math.sqrt(labDistSq(dLabs[activeIds[i]], dLabs[activeIds[j]]));
          if (de < bestDE) {
            bestDE = de;
            bestA = activeIds[i];
            bestB = activeIds[j];
          }
        }
      }
      if (bestA < 0 || bestDE > state.shadeTolerance) break;
      const keeper = counts[bestA] >= counts[bestB] ? bestA : bestB;
      const absorbed = keeper === bestA ? bestB : bestA;
      counts[keeper] += counts[absorbed];
      counts[absorbed] = 0;
      active[absorbed] = false;
      for (let k = 0; k < n; k++) if (redirect[k] === absorbed) redirect[k] = keeper;
    }
    for (let i = 0; i < total; i++) remapped[i] = redirect[remapped[i]];
  }

  // Final counts & sort descending
  const finalCounts = new Int32Array(dedupedInfos.length);
  for (let i = 0; i < total; i++) finalCounts[remapped[i]]++;

  const sortedOld = Array.from({ length: dedupedInfos.length }, (_, i) => i)
    .filter((i) => finalCounts[i] > 0)
    .sort((a, b) => finalCounts[b] - finalCounts[a]);

  const oldToSorted = new Int32Array(dedupedInfos.length);
  const palette = sortedOld.map((oldIdx, idx) => {
    oldToSorted[oldIdx] = idx;
    const info = dedupedInfos[oldIdx];
    return {
      number: idx + 1,
      code: info.code,
      name: info.name,
      rgb: info.rgb,
      hex: rgbToHex(info.rgb),
      count: finalCounts[oldIdx],
    };
  });

  const grid = [];
  for (let r = 0; r < h; r++) {
    const row = [];
    for (let c = 0; c < w; c++) {
      row.push(oldToSorted[remapped[r * w + c]]);
    }
    grid.push(row);
  }

  state.pattern = { width: w, height: h, grid, palette, totalBeads: w * h };
  state.undoPattern = null;
  state.highlightedIndex = null;
  state.selectedCell = null;
  state.placedCells.clear();
  state.mapView = { scale: 1, panX: 0, panY: 0 };
  state.simView = { scale: 1, panX: 0, panY: 0 };
  refreshWorkspaceUI();
}

function replaceColorGlobally(fromIdx, toBead) {
  if (!state.pattern) return;
  const p = state.pattern;
  state.undoPattern = JSON.parse(JSON.stringify(p));

  const updatedInfos = p.palette.map((entry, i) =>
    i === fromIdx
      ? { code: toBead.code, name: toBead.name, rgb: toBead.rgb.slice() }
      : { code: entry.code, name: entry.name, rgb: entry.rgb.slice() }
  );

  const keyToNew = new Map();
  const deduped = [];
  const remap = new Int32Array(updatedInfos.length);
  updatedInfos.forEach((info, i) => {
    const key = info.rgb.join(',');
    if (keyToNew.has(key)) remap[i] = keyToNew.get(key);
    else {
      const ni = deduped.length;
      keyToNew.set(key, ni);
      deduped.push(info);
      remap[i] = ni;
    }
  });

  const counts = new Int32Array(deduped.length);
  const tempGrid = p.grid.map((row) =>
    row.map((val) => {
      const nv = remap[val];
      counts[nv]++;
      return nv;
    })
  );

  const sortedOld = Array.from({ length: deduped.length }, (_, i) => i)
    .filter((i) => counts[i] > 0)
    .sort((a, b) => counts[b] - counts[a]);

  const oldToSorted = new Int32Array(deduped.length);
  const palette = sortedOld.map((oldIdx, idx) => {
    oldToSorted[oldIdx] = idx;
    const info = deduped[oldIdx];
    return {
      number: idx + 1,
      code: info.code,
      name: info.name,
      rgb: info.rgb,
      hex: rgbToHex(info.rgb),
      count: counts[oldIdx],
    };
  });

  const grid = tempGrid.map((row) => row.map((v) => oldToSorted[v]));
  state.pattern = { width: p.width, height: p.height, grid, palette, totalBeads: p.totalBeads };
  state.highlightedIndex = null;
  state.selectedCell = null;
  refreshWorkspaceUI();
  showToast(`Zamieniono kolor na ${toBead.name} (${toBead.code})`);
}

// --- Shareable URL Codec (RLE + UTF-8 Base64URL in #p=...) ---

function encodePatternToUrl(pattern) {
  const palStr = pattern.palette
    .map((e) => `${e.code}~${e.hex.slice(1)}~${e.name.replace(/[|;~]/g, '')}`)
    .join(';');
  const flat = [];
  for (let r = 0; r < pattern.height; r++) {
    for (let c = 0; c < pattern.width; c++) flat.push(pattern.grid[r][c]);
  }
  const runs = [];
  for (let i = 0; i < flat.length; ) {
    const v = flat[i];
    let len = 1;
    while (i + len < flat.length && flat[i + len] === v) len++;
    runs.push(len > 1 ? `${len}x${v}` : `${v}`);
    i += len;
  }
  const raw = `1|${pattern.width}|${pattern.height}|${palStr}|${runs.join(',')}`;
  const bytes = new TextEncoder().encode(raw);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  const b64 = btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const base = window.location.href.split('#')[0].split('?')[0];
  return `${base}#p=${b64}`;
}

function shortProjectCode(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  const hex = (h >>> 0).toString(16).toUpperCase().padStart(8, '0');
  return `KRL-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
}

function decodePatternFromHash(input) {
  try {
    let payload = input.trim();
    if (payload.includes('#p=')) payload = payload.split('#p=')[1].split('&')[0];
    else if (payload.includes('?p=')) payload = payload.split('?p=')[1].split('&')[0];
    payload = payload.replace(/-/g, '+').replace(/_/g, '/');
    while (payload.length % 4) payload += '=';
    const bin = atob(payload);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const raw = new TextDecoder().decode(bytes);
    const parts = raw.split('|');
    if (parts.length !== 5 || parts[0] !== '1') return null;

    const width = parseInt(parts[1], 10);
    const height = parseInt(parts[2], 10);
    if (width < 2 || width > 80 || height < 2 || height > 80) return null;

    const rawPalette = parts[3].split(';').filter(Boolean).map((tok) => {
      const [code, hex, name] = tok.split('~');
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return { code, rgb: [r, g, b], hex: `#${hex}`, name };
    });

    const flat = [];
    parts[4].split(',').filter(Boolean).forEach((run) => {
      if (run.includes('x')) {
        const [cntStr, valStr] = run.split('x');
        const cnt = parseInt(cntStr, 10);
        const val = parseInt(valStr, 10);
        for (let k = 0; k < cnt; k++) flat.push(val);
      } else {
        flat.push(parseInt(run, 10));
      }
    });
    if (flat.length !== width * height) return null;

    const counts = new Int32Array(rawPalette.length);
    flat.forEach((v) => counts[v]++);

    const palette = rawPalette.map((p, idx) => ({
      number: idx + 1,
      code: p.code,
      name: p.name,
      rgb: p.rgb,
      hex: p.hex,
      count: counts[idx],
    }));
    const grid = [];
    for (let r = 0; r < height; r++) {
      grid.push(flat.slice(r * width, (r + 1) * width));
    }
    return { width, height, grid, palette, totalBeads: width * height };
  } catch {
    return null;
  }
}

// --- Canvas Rendering: Pattern Map & Realistic Simulation ---

function resizeCanvasToDisplaySize(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const w = Math.max(1, Math.round(rect.width * dpr));
  const h = Math.max(1, Math.round(rect.height * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  return { w, h, dpr };
}

function getMapGeometry(w, h, cols, rows) {
  const axisMargin = 38;
  const pad = 16;
  const availW = Math.max(40, w - pad * 2 - axisMargin);
  const availH = Math.max(40, h - pad * 2 - axisMargin);
  const cellSize = Math.min(availW / cols, availH / rows);
  const gridW = cellSize * cols;
  const gridH = cellSize * rows;
  const originX = (w - (axisMargin + gridW)) / 2 + axisMargin;
  const originY = (h - (axisMargin + gridH)) / 2 + axisMargin;
  return { originX, originY, cellSize, gridW, gridH, axisMargin };
}

function drawMapCanvas() {
  const canvas = document.getElementById('mapCanvas');
  if (!state.pattern || !canvas) return;
  const { w, h } = resizeCanvasToDisplaySize(canvas);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, w, h);

  const p = state.pattern;
  const geom = getMapGeometry(w, h, p.width, p.height);
  const { scale, panX, panY } = state.mapView;

  ctx.save();
  ctx.translate(panX, panY);
  ctx.scale(scale, scale);

  // Axis labels
  const step = Math.max(p.width, p.height) > 35 ? 5 : Math.max(p.width, p.height) > 20 ? 2 : 1;
  ctx.fillStyle = '#5B5046';
  ctx.font = `600 ${Math.max(11, Math.min(18, geom.cellSize * 0.42))}px "JetBrains Mono", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let c = 0; c < p.width; c++) {
    if (c === 0 || (c + 1) % step === 0) {
      ctx.fillText(String(c + 1), geom.originX + c * geom.cellSize + geom.cellSize / 2, geom.originY - 14);
    }
  }
  for (let r = 0; r < p.height; r++) {
    if (r === 0 || (r + 1) % step === 0) {
      ctx.fillText(String(r + 1), geom.originX - 18, geom.originY + r * geom.cellSize + geom.cellSize / 2);
    }
  }

  const numFontSize = Math.max(9, Math.min(20, geom.cellSize * 0.46));
  ctx.font = `700 ${numFontSize}px "JetBrains Mono", monospace`;

  for (let r = 0; r < p.height; r++) {
    for (let c = 0; c < p.width; c++) {
      const palIdx = p.grid[r][c];
      const entry = p.palette[palIdx];
      const x = geom.originX + c * geom.cellSize;
      const y = geom.originY + r * geom.cellSize;
      const isDimmed = state.highlightedIndex !== null && state.highlightedIndex !== palIdx;
      const isPlaced = state.placedCells.has(`${r},${c}`);

      ctx.globalAlpha = isDimmed ? 0.22 : isPlaced ? 0.36 : 1;
      ctx.fillStyle = entry.hex;
      ctx.fillRect(x, y, geom.cellSize + 0.5, geom.cellSize + 0.5);

      if (isPlaced) {
        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = isDarkColor(entry.rgb) ? '#FFFFFF' : '#1F1B17';
        ctx.lineWidth = Math.max(1.5, geom.cellSize * 0.11);
        ctx.beginPath();
        ctx.moveTo(x + geom.cellSize * 0.25, y + geom.cellSize * 0.52);
        ctx.lineTo(x + geom.cellSize * 0.44, y + geom.cellSize * 0.72);
        ctx.lineTo(x + geom.cellSize * 0.76, y + geom.cellSize * 0.28);
        ctx.stroke();
      } else if (state.showNumbers && geom.cellSize * scale >= 15) {
        ctx.globalAlpha = isDimmed ? 0.3 : 1;
        ctx.fillStyle = isDarkColor(entry.rgb) ? '#FFFFFF' : '#1F1B17';
        ctx.fillText(String(entry.number), x + geom.cellSize / 2, y + geom.cellSize / 2 + 1);
      }

      if (state.highlightedIndex === palIdx) {
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#D94E3B';
        ctx.lineWidth = Math.max(1.5, geom.cellSize * 0.08);
        ctx.strokeRect(x + 1, y + 1, geom.cellSize - 2, geom.cellSize - 2);
      }
    }
  }
  ctx.globalAlpha = 1;

  // Minor grid
  ctx.strokeStyle = 'rgba(130, 118, 106, 0.45)';
  ctx.lineWidth = Math.max(0.6, 1 / scale);
  for (let c = 0; c <= p.width; c++) {
    const x = geom.originX + c * geom.cellSize;
    ctx.beginPath(); ctx.moveTo(x, geom.originY); ctx.lineTo(x, geom.originY + geom.gridH); ctx.stroke();
  }
  for (let r = 0; r <= p.height; r++) {
    const y = geom.originY + r * geom.cellSize;
    ctx.beginPath(); ctx.moveTo(geom.originX, y); ctx.lineTo(geom.originX + geom.gridW, y); ctx.stroke();
  }

  // Major 5x5 lines
  ctx.strokeStyle = 'rgba(31, 27, 23, 0.65)';
  ctx.lineWidth = Math.max(1.2, 2.4 / scale);
  for (let c = 0; c <= p.width; c += 5) {
    const x = geom.originX + c * geom.cellSize;
    ctx.beginPath(); ctx.moveTo(x, geom.originY); ctx.lineTo(x, geom.originY + geom.gridH); ctx.stroke();
  }
  for (let r = 0; r <= p.height; r += 5) {
    const y = geom.originY + r * geom.cellSize;
    ctx.beginPath(); ctx.moveTo(geom.originX, y); ctx.lineTo(geom.originX + geom.gridW, y); ctx.stroke();
  }
  ctx.strokeRect(geom.originX, geom.originY, geom.gridW, geom.gridH);

  // Selected cell marker
  if (state.selectedCell) {
    const sx = geom.originX + state.selectedCell.col * geom.cellSize;
    const sy = geom.originY + state.selectedCell.row * geom.cellSize;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3 / scale;
    ctx.strokeRect(sx, sy, geom.cellSize, geom.cellSize);
    ctx.strokeStyle = '#D94E3B';
    ctx.lineWidth = 2 / scale;
    ctx.strokeRect(sx - 1, sy - 1, geom.cellSize + 2, geom.cellSize + 2);
  }

  ctx.restore();
}

function shadeHex(rgb, factor) {
  return rgbToHex(rgb.map((v) => Math.max(0, Math.min(255, Math.round(v + (factor > 0 ? (255 - v) * factor : v * factor))))));
}

function drawSimulationCanvas() {
  const canvas = document.getElementById('simCanvas');
  if (!state.pattern || !canvas) return;
  const { w, h } = resizeCanvasToDisplaySize(canvas);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);

  const p = state.pattern;
  const pad = 28;
  const cellSize = Math.min((w - pad * 2) / p.width, (h - pad * 2) / p.height);
  const gridW = cellSize * p.width;
  const gridH = cellSize * p.height;
  const startX = (w - gridW) / 2;
  const startY = (h - gridH) / 2;

  const { scale, panX, panY } = state.simView;
  ctx.save();
  ctx.translate(panX, panY);
  ctx.scale(scale, scale);

  const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, Math.max(w, h) * 0.75);
  bgGrad.addColorStop(0, '#F6F1E9');
  bgGrad.addColorStop(1, '#E3D8C8');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(-panX / scale, -panY / scale, w / scale, h / scale);

  const boardPad = Math.max(8, Math.min(22, cellSize * 0.45));
  if (state.simMode === 'pegboard') {
    ctx.fillStyle = 'rgba(0,0,0,0.10)';
    ctx.beginPath();
    ctx.roundRect(startX - boardPad + 4, startY - boardPad + 6, gridW + boardPad * 2, gridH + boardPad * 2, 16);
    ctx.fill();

    ctx.fillStyle = '#FDFBF7';
    ctx.beginPath();
    ctx.roundRect(startX - boardPad, startY - boardPad, gridW + boardPad * 2, gridH + boardPad * 2, 16);
    ctx.fill();
    ctx.strokeStyle = '#D6CEC2';
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    ctx.fillStyle = 'rgba(0,0,0,0.14)';
    ctx.beginPath();
    ctx.roundRect(startX + 4, startY + 6, gridW, gridH, cellSize * 0.25);
    ctx.fill();
  }

  const melt = state.simMode === 'ironed' ? state.ironIntensity : 0;

  for (let r = 0; r < p.height; r++) {
    for (let c = 0; c < p.width; c++) {
      const entry = p.palette[p.grid[r][c]];
      const seed = ((r * 73856093) ^ (c * 19349663)) & 0xffff;
      const jx = state.simMode === 'pegboard' ? ((((seed % 11) - 5) / 5) * cellSize * 0.022) : 0;
      const jy = state.simMode === 'pegboard' ? (((((seed / 11) | 0) % 11) - 5) / 5 * cellSize * 0.022) : 0;
      const cx = startX + c * cellSize + cellSize / 2 + jx;
      const cy = startY + r * cellSize + cellSize / 2 + jy;

      if (state.simMode === 'pegboard') {
        const outerR = cellSize * 0.435;
        const holeR = cellSize * 0.165;
        ctx.fillStyle = 'rgba(0,0,0,0.20)';
        ctx.beginPath();
        ctx.arc(cx + cellSize * 0.04, cy + cellSize * 0.055, outerR, 0, Math.PI * 2);
        ctx.fill();

        const grad = ctx.createRadialGradient(cx - outerR * 0.25, cy - outerR * 0.25, outerR * 0.1, cx, cy, outerR * 1.2);
        grad.addColorStop(0, shadeHex(entry.rgb, 0.16));
        grad.addColorStop(0.55, entry.hex);
        grad.addColorStop(1, shadeHex(entry.rgb, -0.18));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255,255,255,0.28)';
        ctx.lineWidth = Math.max(1, cellSize * 0.06);
        ctx.beginPath();
        ctx.arc(cx - outerR * 0.06, cy - outerR * 0.06, outerR * 0.76, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = state.showPins ? '#FDFBF7' : '#EBE3D7';
        ctx.beginPath();
        ctx.arc(cx, cy, holeR, 0, Math.PI * 2);
        ctx.fill();

        if (state.showPins) {
          ctx.fillStyle = '#D4CCC0';
          ctx.beginPath();
          ctx.arc(cx, cy, holeR * 0.56, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        const beadSize = cellSize * (0.89 + 0.115 * melt);
        const cornerR = cellSize * (0.44 - 0.30 * melt);
        const half = beadSize / 2;
        const grad = ctx.createLinearGradient(cx - half, cy - half, cx + half, cy + half);
        grad.addColorStop(0, shadeHex(entry.rgb, 0.12));
        grad.addColorStop(0.5, entry.hex);
        grad.addColorStop(1, shadeHex(entry.rgb, -0.14));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(cx - half, cy - half, beadSize, beadSize, cornerR);
        ctx.fill();

        const holeR = cellSize * (0.16 * (1 - melt * 0.88));
        if (holeR > 1.2) {
          ctx.fillStyle = '#E7DFD4';
          ctx.beginPath();
          ctx.arc(cx, cy, holeR, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  ctx.restore();
}

// --- Offscreen High-Res Export Renderers (PNG / JPG / PDF) ---

function renderMapExportCanvas(pattern) {
  const cellPx = Math.max(28, Math.min(52, Math.floor(960 / Math.max(pattern.width, pattern.height))));
  const axisMargin = 46;
  const pad = 34;
  const headerH = 82;
  const gridW = pattern.width * cellPx;
  const gridH = pattern.height * cellPx;
  const legendCols = 3;
  const legendRows = Math.max(1, Math.ceil(pattern.palette.length / legendCols));
  const legendH = legendRows * 42 + 44;

  const out = document.createElement('canvas');
  out.width = Math.max(700, pad * 2 + axisMargin + gridW);
  out.height = pad * 2 + headerH + axisMargin + gridH + legendH;
  const ctx = out.getContext('2d');
  ctx.fillStyle = '#FBF7F1';
  ctx.fillRect(0, 0, out.width, out.height);

  ctx.fillStyle = '#1F1B17';
  ctx.font = '700 28px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`Koralikowo • Mapa wzoru ${pattern.width} × ${pattern.height}`, pad, pad + 30);
  ctx.fillStyle = '#52473E';
  ctx.font = '500 18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`Razem ${pattern.totalBeads} koralików • ${pattern.palette.length} kolorów`, pad, pad + 60);

  const gx = pad + axisMargin;
  const gy = pad + headerH + axisMargin;

  ctx.fillStyle = '#6B5F55';
  ctx.font = `600 ${Math.max(12, cellPx * 0.4)}px "JetBrains Mono", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let c = 0; c < pattern.width; c++) ctx.fillText(String(c + 1), gx + c * cellPx + cellPx / 2, gy - 16);
  for (let r = 0; r < pattern.height; r++) ctx.fillText(String(r + 1), gx - 22, gy + r * cellPx + cellPx / 2);

  ctx.font = `700 ${Math.max(11, cellPx * 0.45)}px "JetBrains Mono", monospace`;
  for (let r = 0; r < pattern.height; r++) {
    for (let c = 0; c < pattern.width; c++) {
      const entry = pattern.palette[pattern.grid[r][c]];
      const x = gx + c * cellPx;
      const y = gy + r * cellPx;
      ctx.fillStyle = entry.hex;
      ctx.fillRect(x, y, cellPx, cellPx);
      ctx.strokeStyle = '#CBBFB2';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cellPx, cellPx);
      ctx.fillStyle = isDarkColor(entry.rgb) ? '#FFFFFF' : '#1F1B17';
      ctx.fillText(String(entry.number), x + cellPx / 2, y + cellPx / 2 + 1);
    }
  }

  ctx.strokeStyle = '#3E352E';
  ctx.lineWidth = 2.5;
  for (let c = 0; c <= pattern.width; c += 5) {
    ctx.beginPath(); ctx.moveTo(gx + c * cellPx, gy); ctx.lineTo(gx + c * cellPx, gy + gridH); ctx.stroke();
  }
  for (let r = 0; r <= pattern.height; r += 5) {
    ctx.beginPath(); ctx.moveTo(gx, gy + r * cellPx); ctx.lineTo(gx + gridW, gy + r * cellPx); ctx.stroke();
  }
  ctx.strokeRect(gx, gy, gridW, gridH);

  // Legend
  const legendTop = gy + gridH + 30;
  const colW = (out.width - pad * 2) / legendCols;
  pattern.palette.forEach((entry, idx) => {
    const lr = Math.floor(idx / legendCols);
    const lc = idx % legendCols;
    const lx = pad + lc * colW;
    const ly = legendTop + lr * 42;
    ctx.fillStyle = entry.hex;
    ctx.beginPath();
    ctx.roundRect(lx, ly, 26, 26, 7);
    ctx.fill();
    ctx.strokeStyle = '#9E9184';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = isDarkColor(entry.rgb) ? '#FFFFFF' : '#1F1B17';
    ctx.font = '700 13px "JetBrains Mono", monospace';
    ctx.fillText(String(entry.number), lx + 13, ly + 14);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#1F1B17';
    ctx.font = '500 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`${entry.name} (${entry.count} szt.)`, lx + 34, ly + 14);
  });

  return out;
}

function renderSimExportCanvas(pattern) {
  const cellPx = Math.max(30, Math.min(54, Math.floor(960 / Math.max(pattern.width, pattern.height))));
  const pad = 42;
  const out = document.createElement('canvas');
  out.width = pattern.width * cellPx + pad * 2;
  out.height = pattern.height * cellPx + pad * 2;
  const ctx = out.getContext('2d');
  ctx.fillStyle = '#EFE9E0';
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.fillStyle = state.simMode === 'pegboard' ? '#FAF8F5' : '#F5EFE6';
  ctx.beginPath();
  ctx.roundRect(pad - 12, pad - 12, pattern.width * cellPx + 24, pattern.height * cellPx + 24, 18);
  ctx.fill();

  const melt = state.simMode === 'ironed' ? state.ironIntensity : 0;
  for (let r = 0; r < pattern.height; r++) {
    for (let c = 0; c < pattern.width; c++) {
      const entry = pattern.palette[pattern.grid[r][c]];
      const cx = pad + c * cellPx + cellPx / 2;
      const cy = pad + r * cellPx + cellPx / 2;
      if (state.simMode === 'pegboard') {
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.beginPath(); ctx.arc(cx + 2, cy + 3, cellPx * 0.43, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = entry.hex;
        ctx.beginPath(); ctx.arc(cx, cy, cellPx * 0.43, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#EAE2D7';
        ctx.beginPath(); ctx.arc(cx, cy, cellPx * 0.16, 0, Math.PI * 2); ctx.fill();
      } else {
        const s = cellPx * (0.89 + 0.11 * melt);
        const cr = cellPx * (0.44 - 0.30 * melt);
        ctx.fillStyle = entry.hex;
        ctx.beginPath(); ctx.roundRect(cx - s / 2, cy - s / 2, s, s, cr); ctx.fill();
        const hr = cellPx * (0.16 * (1 - melt * 0.86));
        if (hr > 1.2) {
          ctx.fillStyle = '#E7DFD4';
          ctx.beginPath(); ctx.arc(cx, cy, hr, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
  }
  return out;
}

function buildExportCanvas(pattern, content) {
  if (content === 'map') return renderMapExportCanvas(pattern);
  if (content === 'sim') return renderSimExportCanvas(pattern);
  const simC = renderSimExportCanvas(pattern);
  const mapC = renderMapExportCanvas(pattern);
  const gap = 24;
  const out = document.createElement('canvas');
  out.width = Math.max(simC.width, mapC.width);
  out.height = simC.height + gap + mapC.height;
  const ctx = out.getContext('2d');
  ctx.fillStyle = '#FBF7F1';
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(simC, (out.width - simC.width) / 2, 0);
  ctx.drawImage(mapC, (out.width - mapC.width) / 2, simC.height + gap);
  return out;
}

async function generateExportBlob(pattern, content, format) {
  if (format === 'pdf') {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      throw new Error('PDF_UNAVAILABLE');
    }
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();
    const addCanvasPage = (canvas, title, isFirst) => {
      if (!isFirst) pdf.addPage();
      pdf.setFontSize(14);
      pdf.text(title, 36, 36);
      const availW = pw - 72;
      const availH = ph - 88;
      const s = Math.min(availW / canvas.width, availH / canvas.height);
      const dw = canvas.width * s;
      const dh = canvas.height * s;
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', (pw - dw) / 2, 54, dw, dh);
    };
    if (content === 'map') {
      addCanvasPage(renderMapExportCanvas(pattern), `Koralikowo • Mapa wzoru (${pattern.width}×${pattern.height})`, true);
    } else if (content === 'sim') {
      addCanvasPage(renderSimExportCanvas(pattern), `Koralikowo • Symulacja koralików (${pattern.width}×${pattern.height})`, true);
    } else {
      addCanvasPage(renderMapExportCanvas(pattern), `Koralikowo • Strona 1: Mapa wzoru i legenda`, true);
      addCanvasPage(renderSimExportCanvas(pattern), `Koralikowo • Strona 2: Podgląd ułożenia koralików`, false);
    }
    return pdf.output('blob');
  }

  const canvas = buildExportCanvas(pattern, content);
  const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
  return new Promise((resolve) => canvas.toBlob(resolve, mime, 0.95));
}

// --- UI Sync & Interactions ---

function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => el.classList.add('hidden'), 2600);
}

function updateDimensionControls() {
  document.getElementById('widthValue').textContent = state.width;
  document.getElementById('heightValue').textContent = state.height;
  document.getElementById('widthSlider').value = state.width;
  document.getElementById('heightSlider').value = state.height;
  document.getElementById('totalPegsLabel').textContent = `Razem: ${state.width * state.height} miejsc (${state.width} × ${state.height})`;

  document.querySelectorAll('#boardPresets .chip').forEach((btn) => {
    const match = Number(btn.dataset.w) === state.width && Number(btn.dataset.h) === state.height;
    btn.classList.toggle('active', match);
  });

  const ratioBox = document.getElementById('ratioPreviewRect');
  const ratio = Math.max(0.35, Math.min(2.8, state.width / state.height));
  if (ratio >= 1) {
    ratioBox.style.width = '30px';
    ratioBox.style.height = `${Math.round(30 / ratio)}px`;
  } else {
    ratioBox.style.height = '30px';
    ratioBox.style.width = `${Math.round(30 * ratio)}px`;
  }
}

function renderManualPaletteGrid() {
  const grid = document.getElementById('manualPaletteGrid');
  grid.innerHTML = '';
  STANDARD_BEAD_PALETTE.forEach((bead) => {
    const selected = state.manualCodes.has(bead.code);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `manual-chip ${selected ? 'selected' : ''}`;
    btn.innerHTML = `<span class="bead-dot" style="background:${rgbToHex(bead.rgb)};color:${isDarkColor(bead.rgb) ? '#fff' : '#111'}">${selected ? '✓' : ''}</span><span>${bead.name}</span>`;
    btn.addEventListener('click', () => {
      if (state.manualCodes.has(bead.code)) {
        if (state.manualCodes.size <= 2) {
          showToast('Wybierz co najmniej 2 kolory koralików.');
          return;
        }
        state.manualCodes.delete(bead.code);
      } else {
        state.manualCodes.add(bead.code);
      }
      document.getElementById('manualCountBadge').textContent = state.manualCodes.size;
      renderManualPaletteGrid();
    });
    grid.appendChild(btn);
  });
  document.getElementById('manualCountBadge').textContent = state.manualCodes.size;
}

function updateSourceThumb() {
  if (!state.sourceCanvas) return;
  const thumb = document.getElementById('sourceThumbCanvas');
  const ctx = thumb.getContext('2d');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, thumb.width, thumb.height);
  const s = Math.max(thumb.width / state.sourceCanvas.width, thumb.height / state.sourceCanvas.height);
  const cw = thumb.width / s, ch = thumb.height / s;
  const sx = (state.sourceCanvas.width - cw) / 2;
  const sy = (state.sourceCanvas.height - ch) / 2;
  ctx.drawImage(state.sourceCanvas, sx, sy, cw, ch, 0, 0, thumb.width, thumb.height);

  ['mapOriginalOverlay', 'simOriginalOverlay'].forEach((id) => {
    const ov = document.getElementById(id);
    const octx = ov.getContext('2d');
    octx.drawImage(state.sourceCanvas, sx, sy, cw, ch, 0, 0, ov.width, ov.height);
  });
}

function refreshWorkspaceUI() {
  const p = state.pattern;
  if (!p) return;
  document.getElementById('patternTitle').textContent = `Wzór ${p.width} × ${p.height}`;
  document.getElementById('patternStats').textContent = `${p.totalBeads} koralików • ${p.palette.length} kolorów`;
  document.getElementById('btnUndoReplace').classList.toggle('hidden', !state.undoPattern);
  document.getElementById('placedCounter').textContent = state.placedCells.size;
  document.getElementById('btnClearPlaced').classList.toggle('hidden', state.placedCells.size === 0);
  document.getElementById('btnClearHighlight').classList.toggle('hidden', state.highlightedIndex === null);

  // Selected cell banner
  const banner = document.getElementById('selectedCellBanner');
  if (state.selectedCell && p.palette[state.selectedCell.paletteIndex]) {
    const entry = p.palette[state.selectedCell.paletteIndex];
    banner.classList.remove('hidden');
    const sw = document.getElementById('bannerSwatch');
    sw.style.background = entry.hex;
    sw.style.color = isDarkColor(entry.rgb) ? '#fff' : '#1F1B17';
    sw.textContent = entry.number;
    document.getElementById('bannerText').textContent = `Kol ${state.selectedCell.col + 1}, Wiersz ${state.selectedCell.row + 1} • ${entry.name} (${entry.code})`;
  } else {
    banner.classList.add('hidden');
  }

  // Palette highlight strip
  const strip = document.getElementById('paletteStrip');
  strip.innerHTML = '';
  p.palette.forEach((entry, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `strip-chip ${state.highlightedIndex === idx ? 'active' : ''}`;
    btn.innerHTML = `<span class="mini-swatch" style="background:${entry.hex};color:${isDarkColor(entry.rgb) ? '#fff' : '#1F1B17'}">${entry.number}</span><span>${entry.count} szt.</span>`;
    btn.addEventListener('click', () => {
      state.highlightedIndex = state.highlightedIndex === idx ? null : idx;
      refreshWorkspaceUI();
    });
    strip.appendChild(btn);
  });

  // Legend tab
  document.getElementById('legendTotalCount').textContent = `${p.totalBeads} szt.`;
  const list = document.getElementById('legendList');
  list.innerHTML = '';
  p.palette.forEach((entry, idx) => {
    const pct = Math.round((entry.count / p.totalBeads) * 100);
    const row = document.createElement('div');
    row.className = `legend-item ${state.highlightedIndex === idx ? 'active' : ''}`;
    row.innerHTML = `
      <div class="legend-bead" style="background:${entry.hex}"></div>
      <div class="legend-info">
        <div class="legend-title-row">
          <span>#${entry.number} ${entry.name}</span>
          <span class="code-pill">${entry.code}</span>
        </div>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${isDarkColor(entry.rgb) ? entry.hex : '#D94E3B'}"></div></div>
        <div class="muted small" style="font-family:var(--font-mono)">${entry.count} szt. (${pct}%)</div>
      </div>
      <button type="button" class="btn btn-outline btn-sm replace-btn">⇄ Zamień</button>
    `;
    row.addEventListener('click', (e) => {
      if (e.target.closest('.replace-btn')) {
        openReplaceModal(idx);
        return;
      }
      state.highlightedIndex = idx;
      switchTab('map');
      refreshWorkspaceUI();
    });
    list.appendChild(row);
  });

  drawMapCanvas();
  drawSimulationCanvas();
}

function switchTab(tab) {
  state.activeTab = tab;
  document.querySelectorAll('#workspaceTabs .seg-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  document.getElementById('tabMap').classList.toggle('active', tab === 'map');
  document.getElementById('tabSim').classList.toggle('active', tab === 'sim');
  document.getElementById('tabLegend').classList.toggle('active', tab === 'legend');
  if (tab === 'map') drawMapCanvas();
  if (tab === 'sim') drawSimulationCanvas();
}

function openReplaceModal(paletteIdx) {
  const p = state.pattern;
  if (!p || !p.palette[paletteIdx]) return;
  state.replaceTargetIdx = paletteIdx;
  const src = p.palette[paletteIdx];
  document.getElementById('replaceSourceInfo').textContent = `Obecny: #${src.number} ${src.name} (${src.code} • ${src.count} szt.)`;
  const grid = document.getElementById('replacePaletteGrid');
  grid.innerHTML = '';
  STANDARD_BEAD_PALETTE.forEach((bead) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'replace-card';
    card.innerHTML = `
      <span class="bead-dot" style="width:28px;height:28px;background:${rgbToHex(bead.rgb)}"></span>
      <span>${bead.name}</span>
      <span class="code-pill">${bead.code}</span>
    `;
    card.addEventListener('click', () => {
      document.getElementById('replaceModal').classList.add('hidden');
      replaceColorGlobally(paletteIdx, bead);
    });
    grid.appendChild(card);
  });
  document.getElementById('replaceModal').classList.remove('hidden');
}

function setupCanvasInteractions(canvasId, viewKey, onTapCallback) {
  const canvas = document.getElementById(canvasId);
  let dragging = false;
  let moved = false;
  let lastX = 0, lastY = 0;

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const view = state[viewKey];
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const mx = (e.clientX - rect.left) * dpr;
    const my = (e.clientY - rect.top) * dpr;
    const factor = e.deltaY < 0 ? 1.15 : 0.87;
    const nextScale = Math.max(1, Math.min(5, view.scale * factor));
    if (nextScale <= 1.02) {
      state[viewKey] = { scale: 1, panX: 0, panY: 0 };
    } else {
      const ratio = nextScale / view.scale;
      view.panX = mx - (mx - view.panX) * ratio;
      view.panY = my - (my - view.panY) * ratio;
      view.scale = nextScale;
    }
    drawMapCanvas();
    drawSimulationCanvas();
  }, { passive: false });

  canvas.addEventListener('pointerdown', (e) => {
    dragging = true;
    moved = false;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
    const dpr = window.devicePixelRatio || 1;
    if (state[viewKey].scale > 1.02) {
      state[viewKey].panX += dx * dpr;
      state[viewKey].panY += dy * dpr;
      drawMapCanvas();
      drawSimulationCanvas();
    }
    lastX = e.clientX;
    lastY = e.clientY;
  });

  canvas.addEventListener('pointerup', (e) => {
    dragging = false;
    if (!moved && onTapCallback) {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      onTapCallback((e.clientX - rect.left) * dpr, (e.clientY - rect.top) * dpr, canvas.width, canvas.height);
    }
  });
}

// --- Initialization & Event Listeners ---

window.addEventListener('DOMContentLoaded', () => {
  updateDimensionControls();
  renderManualPaletteGrid();

  // Board presets & steppers
  document.querySelectorAll('#boardPresets .chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.width = Number(btn.dataset.w);
      state.height = Number(btn.dataset.h);
      updateDimensionControls();
    });
  });

  const setW = (v) => { state.width = Math.max(3, Math.min(60, v)); updateDimensionControls(); };
  const setH = (v) => { state.height = Math.max(3, Math.min(60, v)); updateDimensionControls(); };
  document.getElementById('widthMinus').addEventListener('click', () => setW(state.width - 1));
  document.getElementById('widthPlus').addEventListener('click', () => setW(state.width + 1));
  document.getElementById('widthSlider').addEventListener('input', (e) => setW(Number(e.target.value)));
  document.getElementById('heightMinus').addEventListener('click', () => setH(state.height - 1));
  document.getElementById('heightPlus').addEventListener('click', () => setH(state.height + 1));
  document.getElementById('heightSlider').addEventListener('input', (e) => setH(Number(e.target.value)));
  document.getElementById('btnSwapDims').addEventListener('click', () => {
    const tmp = state.width; state.width = state.height; state.height = tmp;
    updateDimensionControls();
  });

  // Image upload & built-in samples
  document.getElementById('imageFileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      const maxDim = 800;
      const s = Math.min(1, maxDim / Math.max(img.width, img.height));
      c.width = Math.max(1, Math.round(img.width * s));
      c.height = Math.max(1, Math.round(img.height * s));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      state.sourceCanvas = c;
      state.sourceName = file.name;
      document.getElementById('selectedFileName').textContent = file.name;
      document.getElementById('sampleFoxBtn').classList.remove('active');
      document.getElementById('sampleRocketBtn').classList.remove('active');
      updateSourceThumb();
      generatePattern();
    };
    img.src = URL.createObjectURL(file);
  });

  const loadSample = (kind, label) => {
    state.sourceCanvas = createSampleCanvas(kind);
    state.sourceName = label;
    document.getElementById('selectedFileName').textContent = label;
    document.getElementById('sampleFoxBtn').classList.toggle('active', kind === 'fox');
    document.getElementById('sampleRocketBtn').classList.toggle('active', kind === 'rocket');
    updateSourceThumb();
    generatePattern();
  };
  document.getElementById('sampleFoxBtn').addEventListener('click', () => loadSample('fox', 'Przykład: Lisek'));
  document.getElementById('sampleRocketBtn').addEventListener('click', () => loadSample('rocket', 'Przykład: Rakieta'));

  // Crop & palette controls
  document.querySelectorAll('#cropModeGroup .seg-btn').forEach((b) => {
    b.addEventListener('click', () => {
      state.cropMode = b.dataset.crop;
      document.querySelectorAll('#cropModeGroup .seg-btn').forEach((x) => x.classList.toggle('active', x === b));
    });
  });

  document.querySelectorAll('#paletteModeGroup .seg-btn').forEach((b) => {
    b.addEventListener('click', () => {
      state.paletteMode = b.dataset.pmode;
      document.querySelectorAll('#paletteModeGroup .seg-btn').forEach((x) => x.classList.toggle('active', x === b));
      document.getElementById('autoPaletteSection').classList.toggle('hidden', state.paletteMode !== 'auto');
      document.getElementById('manualPaletteSection').classList.toggle('hidden', state.paletteMode !== 'manual');
    });
  });

  const setColorCount = (v) => {
    state.colorCount = v;
    document.getElementById('colorCountSlider').value = v;
    document.getElementById('colorCountBadge').textContent = `${v} kolorów`;
    document.querySelectorAll('#colorCountChips .chip').forEach((c) => c.classList.toggle('active', Number(c.dataset.colors) === v));
  };
  document.querySelectorAll('#colorCountChips .chip').forEach((c) => c.addEventListener('click', () => setColorCount(Number(c.dataset.colors))));
  document.getElementById('colorCountSlider').addEventListener('input', (e) => setColorCount(Number(e.target.value)));
  document.getElementById('snapPaletteCheck').addEventListener('change', (e) => { state.snapToPalette = e.target.checked; });

  document.getElementById('btnManualBasic').addEventListener('click', () => {
    state.manualCodes = new Set(DEFAULT_MANUAL_CODES);
    renderManualPaletteGrid();
  });
  document.getElementById('btnManualAll').addEventListener('click', () => {
    state.manualCodes = new Set(STANDARD_BEAD_PALETTE.map((b) => b.code));
    renderManualPaletteGrid();
  });

  document.getElementById('toleranceSlider').addEventListener('input', (e) => {
    const v = Number(e.target.value);
    state.shadeTolerance = v;
    const label = v === 0 ? 'Wył. (0)' : v <= 12 ? `Łagodna (${v})` : v <= 24 ? `Średnia (${v})` : `Silna (${v})`;
    document.getElementById('toleranceBadge').textContent = label;
  });

  document.getElementById('btnGenerate').addEventListener('click', generatePattern);

  // Workspace tabs & tools
  document.querySelectorAll('#workspaceTabs .seg-btn').forEach((b) => {
    b.addEventListener('click', () => switchTab(b.dataset.tab));
  });
  document.getElementById('chkShowNumbers').addEventListener('change', (e) => {
    state.showNumbers = e.target.checked;
    drawMapCanvas();
  });
  document.getElementById('chkPlacementMode').addEventListener('change', (e) => {
    state.placementMode = e.target.checked;
  });
  document.getElementById('btnClearPlaced').addEventListener('click', () => {
    state.placedCells.clear();
    refreshWorkspaceUI();
  });
  document.getElementById('btnClearHighlight').addEventListener('click', () => {
    state.highlightedIndex = null;
    refreshWorkspaceUI();
  });
  document.getElementById('btnResetMapZoom').addEventListener('click', () => {
    state.mapView = { scale: 1, panX: 0, panY: 0 };
    drawMapCanvas();
  });
  document.getElementById('btnResetSimZoom').addEventListener('click', () => {
    state.simView = { scale: 1, panX: 0, panY: 0 };
    drawSimulationCanvas();
  });
  document.getElementById('btnBannerReplace').addEventListener('click', () => {
    if (state.selectedCell) openReplaceModal(state.selectedCell.paletteIndex);
  });
  document.getElementById('btnUndoReplace').addEventListener('click', () => {
    if (!state.undoPattern) return;
    state.pattern = state.undoPattern;
    state.undoPattern = null;
    refreshWorkspaceUI();
    showToast('Cofnięto zamianę koloru.');
  });
  document.getElementById('btnToggleOriginal').addEventListener('click', () => {
    state.showOriginal = !state.showOriginal;
    document.getElementById('mapOriginalOverlay').classList.toggle('hidden', !state.showOriginal);
    document.getElementById('simOriginalOverlay').classList.toggle('hidden', !state.showOriginal);
  });

  // Simulation controls
  document.querySelectorAll('#simModeGroup .seg-btn').forEach((b) => {
    b.addEventListener('click', () => {
      state.simMode = b.dataset.sim;
      document.querySelectorAll('#simModeGroup .seg-btn').forEach((x) => x.classList.toggle('active', x === b));
      document.getElementById('simPegsControl').classList.toggle('hidden', state.simMode !== 'pegboard');
      document.getElementById('simIronControl').classList.toggle('hidden', state.simMode !== 'ironed');
      drawSimulationCanvas();
    });
  });
  document.getElementById('chkShowPins').addEventListener('change', (e) => {
    state.showPins = e.target.checked;
    drawSimulationCanvas();
  });
  document.getElementById('ironSlider').addEventListener('input', (e) => {
    const v = Number(e.target.value);
    state.ironIntensity = v / 100;
    document.getElementById('ironBadge').textContent = `${v}%`;
    drawSimulationCanvas();
  });

  // Canvas interactions (tap cell + pan/zoom)
  setupCanvasInteractions('mapCanvas', 'mapView', (px, py, cw, ch) => {
    const p = state.pattern;
    if (!p) return;
    const geom = getMapGeometry(cw, ch, p.width, p.height);
    const ux = (px - state.mapView.panX) / state.mapView.scale;
    const uy = (py - state.mapView.panY) / state.mapView.scale;
    const col = Math.floor((ux - geom.originX) / geom.cellSize);
    const row = Math.floor((uy - geom.originY) / geom.cellSize);
    if (row >= 0 && row < p.height && col >= 0 && col < p.width) {
      state.selectedCell = { row, col, paletteIndex: p.grid[row][col] };
      if (state.placementMode) {
        const key = `${row},${col}`;
        if (state.placedCells.has(key)) state.placedCells.delete(key);
        else state.placedCells.add(key);
      }
      refreshWorkspaceUI();
    }
  });
  setupCanvasInteractions('simCanvas', 'simView', null);

  // Export & Link Modals
  document.getElementById('btnOpenExport').addEventListener('click', () => {
    if (!state.pattern) return;
    const link = encodePatternToUrl(state.pattern);
    document.getElementById('shareLinkBox').value = link;
    document.getElementById('shareShortCode').textContent = shortProjectCode(link);
    document.getElementById('exportModal').classList.remove('hidden');
  });
  document.getElementById('btnCloseExport').addEventListener('click', () => document.getElementById('exportModal').classList.add('hidden'));
  document.getElementById('btnCloseReplace').addEventListener('click', () => document.getElementById('replaceModal').classList.add('hidden'));

  document.querySelectorAll('#exportContentGroup .chip').forEach((c) => {
    c.addEventListener('click', () => {
      state.exportContent = c.dataset.econtent;
      document.querySelectorAll('#exportContentGroup .chip').forEach((x) => x.classList.toggle('active', x === c));
    });
  });
  document.querySelectorAll('#exportFormatGroup .seg-btn').forEach((b) => {
    b.addEventListener('click', () => {
      state.exportFormat = b.dataset.efmt;
      document.querySelectorAll('#exportFormatGroup .seg-btn').forEach((x) => x.classList.toggle('active', x === b));
    });
  });

  document.getElementById('btnDownloadExport').addEventListener('click', async () => {
    try {
      const blob = await generateExportBlob(state.pattern, state.exportContent, state.exportFormat);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `koralikowo_${state.pattern.width}x${state.pattern.height}.${state.exportFormat}`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`Pobrano plik ${state.exportFormat.toUpperCase()}`);
    } catch {
      showToast('Nie udało się wygenerować PDF (sprawdź połączenie z CDN).');
    }
  });

  document.getElementById('btnShareExport').addEventListener('click', async () => {
    try {
      const blob = await generateExportBlob(state.pattern, state.exportContent, state.exportFormat);
      const filename = `koralikowo_${state.pattern.width}x${state.pattern.height}.${state.exportFormat}`;
      const file = new File([blob], filename, { type: blob.type });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Koralikowo ${state.pattern.width}×${state.pattern.height}`,
          text: `Wzór koralików (${state.pattern.palette.length} kolorów)`,
          files: [file],
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Twoja przeglądarka pobrała plik — możesz go wysłać ręcznie.');
      }
    } catch {
      // cancelled share
    }
  });

  document.getElementById('btnCopyLink').addEventListener('click', async () => {
    const link = document.getElementById('shareLinkBox').value;
    await navigator.clipboard.writeText(link);
    showToast('Skopiowano link do schowka!');
  });

  document.getElementById('btnShareSocial').addEventListener('click', async () => {
    const link = document.getElementById('shareLinkBox').value;
    if (navigator.share) {
      await navigator.share({
        title: `Wzór Koralikowo ${state.pattern.width}×${state.pattern.height}`,
        text: `Zobacz mój wzór do koralików do prasowania:`,
        url: link,
      }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(link);
      showToast('Skopiowano link do udostępnienia!');
    }
  });

  // Import link modal
  const openImport = () => {
    document.getElementById('importErrorMsg').classList.add('hidden');
    document.getElementById('importLinkModal').classList.remove('hidden');
  };
  document.getElementById('btnOpenLinkModal').addEventListener('click', openImport);
  const closeImport = () => document.getElementById('importLinkModal').classList.add('hidden');
  document.getElementById('btnCloseImport').addEventListener('click', closeImport);
  document.getElementById('btnCancelImport').addEventListener('click', closeImport);
  document.getElementById('btnConfirmImport').addEventListener('click', () => {
    const raw = document.getElementById('importLinkInput').value;
    const decoded = decodePatternFromHash(raw);
    if (!decoded) {
      document.getElementById('importErrorMsg').classList.remove('hidden');
      return;
    }
    state.pattern = decoded;
    state.width = decoded.width;
    state.height = decoded.height;
    updateDimensionControls();
    refreshWorkspaceUI();
    closeImport();
    showToast(`Wczytano wzór (${decoded.width}×${decoded.height})`);
  });

  window.addEventListener('resize', () => {
    drawMapCanvas();
    drawSimulationCanvas();
  });

  // Load from URL hash if shared link was opened directly, otherwise load sample Fox
  if (window.location.hash && window.location.hash.includes('p=')) {
    const decoded = decodePatternFromHash(window.location.hash);
    if (decoded) {
      state.sourceCanvas = createSampleCanvas('fox');
      updateSourceThumb();
      state.pattern = decoded;
      state.width = decoded.width;
      state.height = decoded.height;
      updateDimensionControls();
      refreshWorkspaceUI();
      showToast('Wczytano wzór z udostępnionego linku!');
      return;
    }
  }
  loadSample('fox', 'Przykład: Lisek');
});
