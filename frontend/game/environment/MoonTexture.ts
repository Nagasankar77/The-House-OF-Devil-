/**
 * PHOTOGRAPHIC ASTRONOMICAL FULL MOON GENERATOR
 *
 * Produces an ultra-realistic, authentic photographic full-moon texture based on
 * genuine astronomical albedo geography (near-side near-zero phase angle opposition effect):
 * - Spherical Lommel-Seeliger limb darkening (soft 3D celestial depth, not a flat disc)
 * - True lunar regolith palette: soft silvery-pearl ash highlands (#cfcac2 / #b8b3ab)
 * - Authentic basaltic lunar maria with feathered organic shorelines:
 *   Oceanus Procellarum, Mare Imbrium (with Sinus Iridum), Mare Serenitatis,
 *   Mare Tranquillitatis, Mare Crisium (distinct isolated oval), Mare Nubium, Humorum, Nectaris
 * - Full-moon opposition albedo features (bright ray ejecta systems, NO cartoon black shadows):
 *   Tycho (brilliant halo + delicate divergent filament rays spanning 1200+ pixels)
 *   Copernicus (dendritic ray nebula)
 *   Kepler (starburst rays)
 *   Aristarchus (the dazzling diamond-bright beacon)
 *   Plato (dark basalt-floored crater)
 * - Micro-regolith fractal grain and sub-pixel antialiased limb against black cosmos
 */

export function createPhotographicMoonCanvas(size = 2048): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const cx = size * 0.5;
  const cy = size * 0.5;
  const r = size * 0.485; // Natural astronomical radius with clean antialiased margin

  ctx.clearRect(0, 0, size, size);

  // 1. Circular clipping mask with sub-pixel antialiasing
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  // 2. Base Lunar Highlands with Spherical Limb Darkening (Photometric opposition effect)
  // Real full moon has subtle darkening towards the limb (~15-20% drop) that produces true 3D spherical depth
  const baseGrad = ctx.createRadialGradient(cx - r * 0.06, cy - r * 0.06, r * 0.05, cx, cy, r);
  baseGrad.addColorStop(0, '#d2cdc5');      // Highland center
  baseGrad.addColorStop(0.35, '#c5c0b7');   // Mid anorthosite regolith
  baseGrad.addColorStop(0.70, '#b4afa6');   // Outer highlands
  baseGrad.addColorStop(0.88, '#9d9890');   // Limb transition begins
  baseGrad.addColorStop(0.97, '#7b766f');   // Limb darkening
  baseGrad.addColorStop(1.0, '#58554f');    // Deep limb edge
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, size, size);

  // 3. High-resolution photographic regolith micro-grain (fractal texture)
  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;
  const rSq = r * r;
  const step = size >= 2048 ? 2 : 1;

  for (let y = 0; y < size; y += step) {
    for (let x = 0; x < size; x += step) {
      const dx = x - cx;
      const dy = y - cy;
      const distSq = dx * dx + dy * dy;
      if (distSq < rSq) {
        // Natural mineral micro-noise: delicate low-amplitude variation
        const n = (Math.random() - 0.5) * 16;
        const idx = (y * size + x) * 4;
        data[idx] = Math.min(255, Math.max(0, data[idx] + n));
        data[idx + 1] = Math.min(255, Math.max(0, data[idx + 1] + n));
        data[idx + 2] = Math.min(255, Math.max(0, data[idx + 2] + n));

        if (step > 1 && x + 1 < size) {
          const idx2 = (y * size + (x + 1)) * 4;
          data[idx2] = data[idx];
          data[idx2 + 1] = data[idx + 1];
          data[idx2 + 2] = data[idx + 2];
        }
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // Helper for rendering soft, multi-layered organic lunar maria (dark basaltic plains)
  const drawMareLobe = (
    mx: number,
    my: number,
    rw: number,
    rh: number,
    angle: number,
    coreColor: string,
    edgeColor: string,
    alpha: number
  ) => {
    ctx.save();
    ctx.translate(cx + mx, cy + my);
    ctx.rotate(angle);
    const grad = ctx.createRadialGradient(0, 0, rw * 0.08, 0, 0, Math.max(rw, rh));
    grad.addColorStop(0, coreColor);
    grad.addColorStop(0.55, edgeColor);
    grad.addColorStop(0.85, 'rgba(78, 74, 68, 0.28)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.globalAlpha = alpha;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, rw, rh, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // 4. Authentic Near-Side Lunar Maria (Astronomically accurate locations & shapes)
  const s = size / 2048;

  // Oceanus Procellarum (Sprawling multi-lobed western volcanic basin)
  drawMareLobe(-360 * s, -60 * s, 380 * s, 460 * s, -0.12, 'rgba(54, 50, 45, 0.88)', 'rgba(64, 60, 54, 0.72)', 0.90);
  drawMareLobe(-430 * s, 140 * s, 300 * s, 360 * s, 0.15, 'rgba(56, 52, 47, 0.85)', 'rgba(68, 64, 58, 0.65)', 0.85);
  drawMareLobe(-260 * s, 80 * s, 260 * s, 240 * s, 0, 'rgba(58, 54, 49, 0.82)', 'rgba(70, 66, 60, 0.60)', 0.80);
  // Sinus Roris & northern bays
  drawMareLobe(-340 * s, -380 * s, 210 * s, 180 * s, 0.25, 'rgba(60, 56, 50, 0.80)', 'rgba(72, 68, 62, 0.55)', 0.75);

  // Mare Imbrium (Northwest circular basin with dark basalt interior)
  drawMareLobe(-170 * s, -290 * s, 290 * s, 270 * s, 0.05, 'rgba(50, 46, 42, 0.92)', 'rgba(62, 58, 52, 0.75)', 0.92);
  drawMareLobe(-140 * s, -260 * s, 230 * s, 210 * s, 0, 'rgba(46, 43, 39, 0.94)', 'rgba(58, 54, 48, 0.78)', 0.90);
  // Sinus Iridum (Distinctive northwestern arc of Mare Imbrium)
  drawMareLobe(-310 * s, -430 * s, 130 * s, 95 * s, 0.35, 'rgba(48, 44, 40, 0.86)', 'rgba(65, 61, 55, 0.65)', 0.85);

  // Mare Serenitatis (North-central circular sea with darker titanium-rich collar)
  drawMareLobe(120 * s, -250 * s, 210 * s, 190 * s, 0.18, 'rgba(54, 50, 45, 0.88)', 'rgba(68, 64, 58, 0.70)', 0.88);
  drawMareLobe(110 * s, -240 * s, 160 * s, 140 * s, 0.15, 'rgba(62, 58, 52, 0.82)', 'rgba(74, 70, 64, 0.60)', 0.85);

  // Mare Tranquillitatis (Center-east sea - distinctly darker, slate-charcoal Apollo 11 terrain)
  drawMareLobe(260 * s, -80 * s, 240 * s, 210 * s, -0.22, 'rgba(42, 39, 36, 0.94)', 'rgba(52, 49, 45, 0.80)', 0.92);
  drawMareLobe(340 * s, -40 * s, 180 * s, 150 * s, 0.10, 'rgba(46, 43, 39, 0.90)', 'rgba(58, 54, 49, 0.72)', 0.88);

  // Mare Crisium (Sharp, isolated oval basin on eastern limb - hallmark of lunar near-side)
  drawMareLobe(560 * s, -170 * s, 155 * s, 125 * s, -0.28, 'rgba(40, 37, 34, 0.96)', 'rgba(52, 49, 45, 0.82)', 0.95);

  // Mare Fecunditatis & Mare Nectaris (Southeast seas)
  drawMareLobe(320 * s, 180 * s, 220 * s, 190 * s, 0.32, 'rgba(52, 48, 44, 0.86)', 'rgba(65, 61, 55, 0.68)', 0.86);
  drawMareLobe(170 * s, 240 * s, 150 * s, 130 * s, -0.10, 'rgba(48, 44, 40, 0.88)', 'rgba(62, 58, 52, 0.70)', 0.88);

  // Mare Nubium & Mare Humorum (Southwest seas)
  drawMareLobe(-150 * s, 310 * s, 240 * s, 200 * s, 0.15, 'rgba(52, 48, 43, 0.88)', 'rgba(66, 62, 56, 0.68)', 0.86);
  drawMareLobe(-370 * s, 330 * s, 140 * s, 130 * s, -0.18, 'rgba(48, 44, 40, 0.90)', 'rgba(60, 56, 50, 0.72)', 0.88);

  // Sinus Medii (Central bay reaching toward lunar equator)
  drawMareLobe(10 * s, 30 * s, 110 * s, 85 * s, 0.1, 'rgba(58, 54, 49, 0.82)', 'rgba(72, 68, 62, 0.55)', 0.78);

  // Montes Apenninus (Bright jagged mountain arc framing southeastern edge of Mare Imbrium)
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.strokeStyle = 'rgba(235, 230, 222, 0.85)';
  ctx.lineWidth = 3.5 * s;
  ctx.beginPath();
  ctx.arc(cx - 20 * s, cy - 170 * s, 160 * s, 2.2, 3.8);
  ctx.stroke();
  ctx.restore();

  // 5. Full-Moon Opposition Albedo Features (Bright Impact Ray Blankets)
  // At full moon, craters do not show shadow cones; instead, their brilliant pulverized ejecta rays gleam intensely

  // 5a. Tycho Ray System (Massive brilliant southern ray system)
  const tyX = cx - 95 * s;
  const tyY = cy + 510 * s;
  const tychoRayCount = 64;

  ctx.save();
  ctx.globalAlpha = 0.85;

  // Tycho broad ejecta glow blanket
  const tyGlow = ctx.createRadialGradient(tyX, tyY, 12 * s, tyX, tyY, 90 * s);
  tyGlow.addColorStop(0, 'rgba(255, 252, 245, 0.95)');
  tyGlow.addColorStop(0.25, 'rgba(245, 240, 230, 0.65)');
  tyGlow.addColorStop(0.65, 'rgba(225, 220, 210, 0.25)');
  tyGlow.addColorStop(1, 'rgba(200, 195, 185, 0)');
  ctx.fillStyle = tyGlow;
  ctx.beginPath();
  ctx.arc(tyX, tyY, 90 * s, 0, Math.PI * 2);
  ctx.fill();

  // Delicate divergent ray filaments traversing the entire southern hemisphere
  for (let i = 0; i < tychoRayCount; i++) {
    const angle = (i / tychoRayCount) * Math.PI * 2 + (Math.sin(i * 4.7) * 0.08);
    // Filament rays can stretch up to 1300 pixels across the disc
    const rayLen = (350 + ((i * 37) % 650) + (i % 3 === 0 ? 450 : 0)) * s;
    const rGrad = ctx.createLinearGradient(tyX, tyY, tyX + Math.cos(angle) * rayLen, tyY + Math.sin(angle) * rayLen);
    rGrad.addColorStop(0, 'rgba(255, 252, 245, 0.65)');
    rGrad.addColorStop(0.15, 'rgba(245, 240, 232, 0.40)');
    rGrad.addColorStop(0.55, 'rgba(230, 225, 218, 0.15)');
    rGrad.addColorStop(1, 'rgba(220, 215, 208, 0)');
    ctx.strokeStyle = rGrad;
    ctx.lineWidth = (1.2 + (i % 4) * 0.7) * s;
    ctx.beginPath();
    ctx.moveTo(tyX + Math.cos(angle) * 14 * s, tyY + Math.sin(angle) * 14 * s);
    ctx.lineTo(tyX + Math.cos(angle) * rayLen, tyY + Math.sin(angle) * rayLen);
    ctx.stroke();
  }
  ctx.restore();

  // 5b. Copernicus Ray Nebula (Equatorial-west, soft dendritic ejecta blanket)
  const copX = cx - 210 * s;
  const copY = cy - 95 * s;
  ctx.save();
  ctx.globalAlpha = 0.80;

  const copGlow = ctx.createRadialGradient(copX, copY, 8 * s, copX, copY, 140 * s);
  copGlow.addColorStop(0, 'rgba(255, 252, 245, 0.90)');
  copGlow.addColorStop(0.30, 'rgba(240, 236, 228, 0.55)');
  copGlow.addColorStop(0.70, 'rgba(220, 215, 205, 0.18)');
  copGlow.addColorStop(1, 'rgba(200, 195, 185, 0)');
  ctx.fillStyle = copGlow;
  ctx.beginPath();
  ctx.arc(copX, copY, 140 * s, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 36; i++) {
    const angle = (i / 36) * Math.PI * 2 + (Math.sin(i * 3.1) * 0.12);
    const rayLen = (120 + ((i * 29) % 240)) * s;
    const rGrad = ctx.createLinearGradient(copX, copY, copX + Math.cos(angle) * rayLen, copY + Math.sin(angle) * rayLen);
    rGrad.addColorStop(0, 'rgba(255, 252, 245, 0.55)');
    rGrad.addColorStop(0.35, 'rgba(240, 235, 225, 0.28)');
    rGrad.addColorStop(1, 'rgba(220, 215, 205, 0)');
    ctx.strokeStyle = rGrad;
    ctx.lineWidth = (1.1 + (i % 3) * 0.6) * s;
    ctx.beginPath();
    ctx.moveTo(copX, copY);
    ctx.lineTo(copX + Math.cos(angle) * rayLen, copY + Math.sin(angle) * rayLen);
    ctx.stroke();
  }
  ctx.restore();

  // 5c. Kepler Starburst Ray System (Western Oceanus Procellarum)
  const kepX = cx - 390 * s;
  const kepY = cy - 70 * s;
  ctx.save();
  ctx.globalAlpha = 0.75;
  const kepGlow = ctx.createRadialGradient(kepX, kepY, 5 * s, kepX, kepY, 75 * s);
  kepGlow.addColorStop(0, 'rgba(255, 252, 245, 0.85)');
  kepGlow.addColorStop(0.40, 'rgba(235, 230, 220, 0.40)');
  kepGlow.addColorStop(1, 'rgba(210, 205, 195, 0)');
  ctx.fillStyle = kepGlow;
  ctx.beginPath();
  ctx.arc(kepX, kepY, 75 * s, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2;
    const rayLen = (70 + ((i * 17) % 110)) * s;
    ctx.strokeStyle = 'rgba(245, 240, 230, 0.35)';
    ctx.lineWidth = 1.0 * s;
    ctx.beginPath();
    ctx.moveTo(kepX, kepY);
    ctx.lineTo(kepX + Math.cos(angle) * rayLen, kepY + Math.sin(angle) * rayLen);
    ctx.stroke();
  }
  ctx.restore();

  // 5d. Aristarchus Plateau: The Brightest Albedo Feature on the Entire Moon
  const arX = cx - 440 * s;
  const arY = cy - 245 * s;
  ctx.save();
  const arGrad = ctx.createRadialGradient(arX, arY, 3 * s, arX, arY, 40 * s);
  arGrad.addColorStop(0, '#ffffff'); // Dazzling pearlescent point
  arGrad.addColorStop(0.20, 'rgba(255, 252, 245, 0.95)');
  arGrad.addColorStop(0.55, 'rgba(240, 235, 225, 0.50)');
  arGrad.addColorStop(1, 'rgba(210, 205, 195, 0)');
  ctx.fillStyle = arGrad;
  ctx.beginPath();
  ctx.arc(arX, arY, 40 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 5e. Plato Crater (North Imbrium - Distinct flat dark basalt ink-drop floor)
  const plX = cx - 130 * s;
  const plY = cy - 475 * s;
  ctx.save();
  ctx.fillStyle = 'rgba(36, 33, 30, 0.95)';
  ctx.beginPath();
  ctx.ellipse(plX, plY, 26 * s, 18 * s, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(225, 220, 210, 0.85)';
  ctx.lineWidth = 2.0 * s;
  ctx.stroke();
  ctx.restore();

  // 5f. Grimaldi Crater (Dark basalt floor near western limb)
  const grX = cx - 560 * s;
  const grY = cy + 80 * s;
  ctx.save();
  ctx.fillStyle = 'rgba(38, 35, 31, 0.92)';
  ctx.beginPath();
  ctx.ellipse(grX, grY, 24 * s, 32 * s, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 5g. Embedded Natural High-Albedo Impact Craters (subtle bright dots with soft rims, NOT black strokes)
  const prominentCraters: [number, number, number][] = [
    [cx - 95 * s, cy + 510 * s, 16 * s],   // Tycho core
    [cx - 210 * s, cy - 95 * s, 18 * s],   // Copernicus core
    [cx - 390 * s, cy - 70 * s, 10 * s],   // Kepler core
    [cx + 120 * s, cy + 390 * s, 14 * s],  // Theophilus
    [cx + 190 * s, cy + 470 * s, 13 * s],  // Cyrillus
    [cx + 250 * s, cy + 550 * s, 12 * s],  // Catharina
    [cx - 70 * s, cy + 330 * s, 15 * s],   // Ptolemaeus
    [cx - 75 * s, cy + 400 * s, 13 * s],   // Alphonsus
    [cx - 80 * s, cy + 450 * s, 12 * s],   // Arzachel
    [cx + 530 * s, cy + 100 * s, 14 * s],  // Langrenus
    [cx + 570 * s, cy + 240 * s, 15 * s],  // Petavius
    [cx + 420 * s, cy + 380 * s, 12 * s],  // Piccolomini
    [cx + 480 * s, cy + 480 * s, 13 * s],  // Rheita
    [cx - 320 * s, cy - 430 * s, 11 * s],  // Bianchini
    [cx - 240 * s, cy - 490 * s, 10 * s],  // Harpalus
    [cx + 340 * s, cy - 360 * s, 12 * s],  // Posidonius
    [cx + 410 * s, cy - 140 * s, 9 * s],   // Proclus (very bright ray crater beside Crisium)
    [cx + 170 * s, cy - 350 * s, 10 * s],  // Aristillus
    [cx + 120 * s, cy - 380 * s, 9 * s],   // Autolycus
    [cx - 150 * s, cy - 180 * s, 11 * s],  // Eratosthenes
    [cx - 30 * s, cy - 120 * s, 8 * s],    // Manilius
    [cx + 80 * s, cy - 100 * s, 9 * s],    // Menelaus
    [cx + 360 * s, cy + 120 * s, 11 * s],  // Taruntius
  ];

  ctx.save();
  for (const [px, py, cr] of prominentCraters) {
    const cg = ctx.createRadialGradient(px, py, 1, px, py, cr * 1.5);
    cg.addColorStop(0, 'rgba(255, 252, 245, 0.90)');
    cg.addColorStop(0.45, 'rgba(240, 235, 225, 0.50)');
    cg.addColorStop(1, 'rgba(215, 210, 200, 0)');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(px, py, cr * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Soft crater rim highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.70)';
    ctx.lineWidth = Math.max(1, cr * 0.15);
    ctx.beginPath();
    ctx.arc(px, py, cr, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // 5h. Natural craterlet speckle distribution across highlands
  ctx.save();
  ctx.fillStyle = 'rgba(245, 240, 230, 0.45)';
  for (let i = 0; i < 280; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.sqrt(Math.random()) * (r * 0.94);
    const px = cx + Math.cos(angle) * dist;
    const py = cy + Math.sin(angle) * dist;
    const sz = (1.5 + Math.random() * 4.5) * s;
    ctx.beginPath();
    ctx.arc(px, py, sz, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.restore(); // Restore circular clip

  // 6. Sub-pixel Edge Antialiasing Falloff
  // Gently fades the outermost 2 pixels to guarantee razor-sharp antialiasing without jagged artifacts
  const finalData = ctx.getImageData(0, 0, size, size);
  const fData = finalData.data;
  const innerR = r - 2.5;
  const outerR = r + 0.5;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > innerR && d <= outerR + 1.5) {
        const idx = (y * size + x) * 4;
        if (d > outerR) {
          fData[idx + 3] = 0;
        } else {
          const factor = Math.max(0, Math.min(1, (outerR - d) / (outerR - innerR)));
          fData[idx + 3] = Math.round(fData[idx + 3] * factor);
        }
      }
    }
  }
  ctx.putImageData(finalData, 0, 0);

  return canvas;
}

/**
 * Creates a soft, natural photographic atmospheric glow/halo canvas texture.
 * Believable low-intensity optical scattering in cool night air, with zero neon or blown-out white lamp look.
 */
export function createPhotographicMoonHaloCanvas(size = 512): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const cx = size * 0.5;
  const cy = size * 0.5;
  const r = size * 0.48;

  const grad = ctx.createRadialGradient(cx, cy, r * 0.35, cx, cy, r);
  // Gentle, soft cool-white atmospheric falloff
  grad.addColorStop(0, 'rgba(210, 225, 245, 0.16)');
  grad.addColorStop(0.30, 'rgba(175, 198, 230, 0.08)');
  grad.addColorStop(0.65, 'rgba(110, 140, 180, 0.025)');
  grad.addColorStop(0.92, 'rgba(60, 80, 120, 0.005)');
  grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  return canvas;
}
