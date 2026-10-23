import * as THREE from 'three';

/**
 * Procedural texture generator for authentic damp colonial underground basement surfaces.
 * Uses Devil color palette:
 * #05050A (Abyssal Void), #450F10 (Deep Maroon), #6B1310 (Classic Maroon),
 * #7D1616 (Blood Stone), #860111 (Devil Red), #0D2118 (Aztec Shadow), #153832 (Damp Moss)
 */
export class BasementTextureGenerator {
  private static cache = new Map<string, THREE.CanvasTexture>();

  /**
   * Heavy colonial damp flagstone cellar floor with mortar seams and dark moisture stains.
   */
  public static createStoneFloorTexture(): THREE.CanvasTexture {
    if (this.cache.has('b_stone_floor')) return this.cache.get('b_stone_floor')!;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Dark charcoal foundation with #05050A and #450F10 deep maroon undertones
    ctx.fillStyle = '#141214';
    ctx.fillRect(0, 0, 512, 512);

    // Grid of irregular stone flagstone slabs
    const cols = 6;
    const rows = 8;
    const cellW = 512 / cols;
    const cellH = 512 / rows;

    for (let r = 0; r < rows; r++) {
      const rowOffset = (r % 2 === 0) ? 0 : cellW * 0.5;
      for (let c = -1; c <= cols; c++) {
        const x = c * cellW + rowOffset;
        const y = r * cellH;

        // Individual stone color variance
        const shade = Math.floor((Math.random() - 0.5) * 18);
        const redTint = Math.floor(Math.random() * 12);
        ctx.fillStyle = `rgb(${38 + shade + redTint}, ${34 + shade}, ${32 + shade})`;
        ctx.fillRect(x + 2, y + 2, cellW - 4, cellH - 4);

        // Weathered stone stippling
        for (let p = 0; p < 60; p++) {
          const px = x + 3 + Math.random() * (cellW - 6);
          const py = y + 3 + Math.random() * (cellH - 6);
          ctx.fillStyle = Math.random() > 0.5 ? 'rgba(15,10,12,0.35)' : 'rgba(75,65,60,0.25)';
          ctx.fillRect(px, py, 1.5, 1.5);
        }

        // Damp Aztec green/moss corners in mortar seams (#0D2118 / #153832)
        if (Math.random() > 0.45) {
          ctx.fillStyle = 'rgba(13, 33, 24, 0.45)';
          ctx.fillRect(x + 1, y + cellH - 4, cellW - 2, 3);
        }
      }
    }

    // Deep mortar joints
    ctx.strokeStyle = '#080608';
    ctx.lineWidth = 3;
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * cellH);
      ctx.lineTo(512, r * cellH);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(6, 5);
    this.cache.set('b_stone_floor', texture);
    return texture;
  }

  /**
   * Massive ancient ashlar stone block walls with saltpeter efflorescence and water trickles.
   */
  public static createStoneWallTexture(): THREE.CanvasTexture {
    if (this.cache.has('b_stone_wall')) return this.cache.get('b_stone_wall')!;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#181416';
    ctx.fillRect(0, 0, 512, 512);

    const rows = 10;
    const blockH = 512 / rows;
    const cols = 5;
    const blockW = 512 / cols;

    for (let r = 0; r < rows; r++) {
      const offset = (r % 2 === 0) ? 0 : blockW * 0.5;
      for (let c = -1; c <= cols; c++) {
        const x = c * blockW + offset;
        const y = r * blockH;

        const baseV = 42 + Math.floor((Math.random() - 0.5) * 16);
        ctx.fillStyle = `rgb(${baseV + 6}, ${baseV}, ${baseV - 2})`;
        ctx.fillRect(x + 2, y + 2, blockW - 4, blockH - 4);

        // Mineral weathering & micro-cracks
        ctx.strokeStyle = 'rgba(12, 8, 10, 0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 6, y + blockH * 0.4);
        ctx.lineTo(x + blockW * 0.6, y + blockH * 0.7);
        ctx.stroke();

        // Water seepage streak down the block
        if (Math.random() > 0.65) {
          const grad = ctx.createLinearGradient(x, y, x, y + blockH);
          grad.addColorStop(0, 'rgba(10, 8, 12, 0.6)');
          grad.addColorStop(1, 'rgba(21, 56, 50, 0.35)');
          ctx.fillStyle = grad;
          ctx.fillRect(x + blockW * 0.3, y + 2, blockW * 0.25, blockH - 4);
        }
      }
    }

    // Heavy mortar seams
    ctx.strokeStyle = '#0a080a';
    ctx.lineWidth = 3;
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * blockH);
      ctx.lineTo(512, r * blockH);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 2);
    this.cache.set('b_stone_wall', texture);
    return texture;
  }

  /**
   * Heavy blackened colonial timber ceiling rafters.
   */
  public static createRafterCeilingTexture(): THREE.CanvasTexture {
    if (this.cache.has('b_rafter_ceil')) return this.cache.get('b_rafter_ceil')!;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#100c0a';
    ctx.fillRect(0, 0, 512, 512);

    const beamCount = 8;
    const beamW = 512 / beamCount;

    for (let i = 0; i < beamCount; i++) {
      const x = i * beamW;
      ctx.fillStyle = (i % 2 === 0) ? '#181210' : '#140e0c';
      ctx.fillRect(x + 2, 0, beamW - 4, 512);

      // Wood grain
      ctx.strokeStyle = 'rgba(8, 5, 4, 0.7)';
      ctx.lineWidth = 1;
      for (let g = 0; g < 15; g++) {
        const gx = x + Math.random() * beamW;
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx + (Math.random() - 0.5) * 6, 512);
        ctx.stroke();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    this.cache.set('b_rafter_ceil', texture);
    return texture;
  }

  /**
   * HUGE STAR-SHAPED RITUAL MUGGU FLOOR TEXTURE (2048 x 2048):
   * Elaborate traditional South Indian geometric floor rangoli / tantric yantra,
   * arranged as an ominous underground ritual symbol on the flagstone cellar floor.
   * Features:
   * - One enormous central five-pointed star occupying ~85% of walkable floor
   * - Precise geometric lines, interlocking interwoven ribbon chords with over/under weave
   * - Concentric circular borders with scalloped muggu petal loops and diamond knot decagon
   * - Inverted concentric nested inner star inside the central pentagon
   * - Central sacred bindu core medallion with radiating 10-fold spokes
   * - Aged ivory-white powder (#ECE3D2), deep maroon (#7D1616), muted dark-red (#450F10)
   * - Realistic stippled powder grains and ancient stone abrasion
   */
  public static createStarRitualFloorTexture(): THREE.CanvasTexture {
    if (this.cache.has('b_star_ritual_floor')) return this.cache.get('b_star_ritual_floor')!;
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d')!;

    const cx = 1024;
    const cy = 1024;

    // 1. Deep aged ritual flagstone base (#100e0e to #161212)
    ctx.fillStyle = '#110f0f';
    ctx.fillRect(0, 0, 2048, 2048);

    // Flagstone slab grid (irregular weathered paving slabs)
    const slabCols = 16;
    const slabRows = 16;
    const sw = 2048 / slabCols;
    const sh = 2048 / slabRows;
    for (let r = 0; r < slabRows; r++) {
      const rowOffset = (r % 2 === 0) ? 0 : sw * 0.5;
      for (let c = -1; c <= slabCols; c++) {
        const sx = c * sw + rowOffset;
        const sy = r * sh;
        const v = 22 + Math.floor((Math.random() - 0.5) * 8);
        ctx.fillStyle = `rgb(${v + 4}, ${v}, ${v - 1})`;
        ctx.fillRect(sx + 2, sy + 2, sw - 4, sh - 4);

        // Stone texture stippling & mineral spots
        for (let p = 0; p < 35; p++) {
          const px = sx + Math.random() * sw;
          const py = sy + Math.random() * sh;
          ctx.fillStyle = Math.random() > 0.5 ? 'rgba(5, 4, 4, 0.45)' : 'rgba(45, 38, 35, 0.25)';
          ctx.fillRect(px, py, 2, 2);
        }
      }
    }

    // Flagstone mortar grooves
    ctx.strokeStyle = '#080606';
    ctx.lineWidth = 3;
    for (let r = 0; r <= slabRows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * sh);
      ctx.lineTo(2048, r * sh);
      ctx.stroke();
    }
    for (let r = 0; r < slabRows; r++) {
      const rowOffset = (r % 2 === 0) ? 0 : sw * 0.5;
      for (let c = 0; c <= slabCols + 1; c++) {
        const sx = c * sw + rowOffset;
        ctx.beginPath();
        ctx.moveTo(sx, r * sh);
        ctx.lineTo(sx, (r + 1) * sh);
        ctx.stroke();
      }
    }

    // Palette Constants:
    const colIvory = 'rgba(238, 230, 215, 0.94)';     // Aged ivory-white rice powder
    const colIvoryThin = 'rgba(238, 230, 215, 0.75)';
    const colMaroon = 'rgba(125, 22, 22, 0.88)';      // Deep maroon (#7D1616)
    const colDarkRed = 'rgba(69, 15, 16, 0.92)';      // Muted dark-red (#450F10)
    const colVermilion = 'rgba(168, 34, 30, 0.85)';   // Sacred Sindoor vermilion
    const colShadow = 'rgba(10, 5, 6, 0.7)';          // Ritual groove shadow

    // Helper: draw line with soft chalk powder edge
    const drawPowderLine = (x1: number, y1: number, x2: number, y2: number, w: number, color = colIvory) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = w;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.restore();
    };

    // Helper: draw circle
    const drawCircle = (r: number, w: number, color = colIvory) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    };

    // =========================================================================
    // 2. CONCENTRIC GEOMETRIC BORDERS
    // =========================================================================

    // (A) Outermost Concentric Double Ring (Radius 910 and 880)
    drawCircle(910, 9, colIvory);
    drawCircle(880, 6, colIvory);

    // Between 910 and 880: Concentric Vermilion Fill with 40 Traditional Muggu Petal Arcs & Dots
    ctx.save();
    ctx.strokeStyle = colMaroon;
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.arc(cx, cy, 895, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    const petalCount = 40;
    for (let i = 0; i < petalCount; i++) {
      const a = (i * Math.PI * 2) / petalCount;
      const px = cx + Math.cos(a) * 895;
      const py = cy + Math.sin(a) * 895;

      // Ivory white powder dot
      ctx.fillStyle = colIvory;
      ctx.beginPath();
      ctx.arc(px, py, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Scalloped connecting loop
      const aNext = ((i + 1) * Math.PI * 2) / petalCount;
      const aMid = (a + aNext) / 2;
      const mx = cx + Math.cos(aMid) * 910;
      const my = cy + Math.sin(aMid) * 910;
      ctx.strokeStyle = colIvory;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.quadraticCurveTo(mx, my, cx + Math.cos(aNext) * 895, cy + Math.sin(aNext) * 895);
      ctx.stroke();
    }

    // (B) Geometric 10-Pointed Decagonal Interlocking Border (Radius 850)
    drawCircle(850, 4.5, colIvory);
    drawCircle(815, 5.0, colIvory);

    // Maroon fill between 850 and 815
    ctx.save();
    ctx.strokeStyle = colDarkRed;
    ctx.lineWidth = 26;
    ctx.beginPath();
    ctx.arc(cx, cy, 832, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 20 Symmetrical Diamond Knots & Radial Inscription Spokes
    const spokeCount = 20;
    for (let i = 0; i < spokeCount; i++) {
      const a = (i * Math.PI * 2) / spokeCount;
      const x1 = cx + Math.cos(a) * 815;
      const y1 = cy + Math.sin(a) * 815;
      const x2 = cx + Math.cos(a) * 850;
      const y2 = cy + Math.sin(a) * 850;
      drawPowderLine(x1, y1, x2, y2, 3.5, colIvory);

      // Centered maroon diamond
      const mx = cx + Math.cos(a + Math.PI / spokeCount) * 832;
      const my = cy + Math.sin(a + Math.PI / spokeCount) * 832;
      ctx.fillStyle = colVermilion;
      ctx.beginPath();
      ctx.arc(mx, my, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Inner Border Ring at Radius 780
    drawCircle(780, 7, colIvory);

    // =========================================================================
    // 3. ENORMOUS FIVE-POINTED STAR (RADIUS = 760, INNER RADIUS = 295)
    // =========================================================================
    const starR = 760;
    const innerR = 295;

    // Calculate the 5 outer vertices and 5 inner vertices
    const outerPts: { x: number; y: number; a: number }[] = [];
    const innerPts: { x: number; y: number; a: number }[] = [];

    for (let i = 0; i < 5; i++) {
      const aOuter = -Math.PI / 2 + (i * Math.PI * 2) / 5;
      outerPts.push({
        x: cx + Math.cos(aOuter) * starR,
        y: cy + Math.sin(aOuter) * starR,
        a: aOuter,
      });

      const aInner = aOuter + Math.PI / 5;
      innerPts.push({
        x: cx + Math.cos(aInner) * innerR,
        y: cy + Math.sin(aInner) * innerR,
        a: aInner,
      });
    }

    // Fill star body with rich deep maroon (#7D1616)
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      if (i === 0) ctx.moveTo(outerPts[i].x, outerPts[i].y);
      else ctx.lineTo(outerPts[i].x, outerPts[i].y);
      ctx.lineTo(innerPts[i].x, innerPts[i].y);
    }
    ctx.closePath();
    ctx.fillStyle = colMaroon;
    ctx.fill();
    ctx.restore();

    // Secondary shading inside the star arms with darker crimson (#450F10)
    ctx.save();
    for (let i = 0; i < 5; i++) {
      const prevInner = innerPts[(i + 4) % 5];
      const curOuter = outerPts[i];

      // Left facet of arm: darker crimson
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(prevInner.x, prevInner.y);
      ctx.lineTo(curOuter.x, curOuter.y);
      ctx.closePath();
      ctx.fillStyle = colDarkRed;
      ctx.fill();

      // Arm spine centerline
      drawPowderLine(cx, cy, curOuter.x, curOuter.y, 4.0, colIvoryThin);
    }
    ctx.restore();

    // =========================================================================
    // 4. INTERLOCKING RITUAL RIBBON BANDS (AUTHENTIC MUGGU INTERWOVEN LINES)
    // =========================================================================
    const chordOrder = [0, 2, 4, 1, 3, 0];
    const bandWidth = 14;

    for (let k = 0; k < 5; k++) {
      const p1 = outerPts[chordOrder[k]];
      const p2 = outerPts[chordOrder[k + 1]];

      // Dark shadow under chord
      ctx.save();
      ctx.strokeStyle = colShadow;
      ctx.lineWidth = bandWidth + 8;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      ctx.restore();

      // Deep maroon ribbon core
      ctx.save();
      ctx.strokeStyle = colMaroon;
      ctx.lineWidth = bandWidth;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      ctx.restore();

      // Double outer ivory powder edges
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const nx = (-dy / len) * (bandWidth / 2);
      const ny = (dx / len) * (bandWidth / 2);

      drawPowderLine(p1.x + nx, p1.y + ny, p2.x + nx, p2.y + ny, 4.0, colIvory);
      drawPowderLine(p1.x - nx, p1.y - ny, p2.x - nx, p2.y - ny, 4.0, colIvory);
    }

    // Outer star boundary outline
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      if (i === 0) ctx.moveTo(outerPts[i].x, outerPts[i].y);
      else ctx.lineTo(outerPts[i].x, outerPts[i].y);
      ctx.lineTo(innerPts[i].x, innerPts[i].y);
    }
    ctx.closePath();
    ctx.strokeStyle = colIvory;
    ctx.lineWidth = 8;
    ctx.stroke();
    ctx.restore();

    // =========================================================================
    // 5. ORNAMENTAL RITUAL YANTRAS BETWEEN THE FIVE ARMS (OUTER VALLEYS)
    // =========================================================================
    for (let i = 0; i < 5; i++) {
      const inPt = innerPts[i];
      const a = inPt.a;

      // Radiating sacred lotus / flame loops in valley toward outer ring
      for (let s = 1; s <= 3; s++) {
        const loopR = innerR + s * 110;
        const lx = cx + Math.cos(a) * loopR;
        const ly = cy + Math.sin(a) * loopR;

        ctx.strokeStyle = s === 2 ? colVermilion : colIvory;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(lx, ly, 22 * s, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = colMaroon;
        ctx.beginPath();
        ctx.arc(lx, ly, 10 * s, 0, Math.PI * 2);
        ctx.fill();

        // Sacred ivory center dot
        ctx.fillStyle = colIvory;
        ctx.beginPath();
        ctx.arc(lx, ly, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Chevron accents in valleys
      const c1x = cx + Math.cos(a - 0.12) * 520;
      const c1y = cy + Math.sin(a - 0.12) * 520;
      const c2x = cx + Math.cos(a) * 620;
      const c2y = cy + Math.sin(a) * 620;
      const c3x = cx + Math.cos(a + 0.12) * 520;
      const c3y = cy + Math.sin(a + 0.12) * 520;

      ctx.strokeStyle = colIvory;
      ctx.lineWidth = 4.0;
      ctx.beginPath();
      ctx.moveTo(c1x, c1y);
      ctx.lineTo(c2x, c2y);
      ctx.lineTo(c3x, c3y);
      ctx.stroke();
    }

    // =========================================================================
    // 6. CONCENTRIC INVERTED INNER STAR & SACRED CENTRAL BINDU
    // =========================================================================
    // Inverted 5-pointed star inside the central pentagon (radius = 230, inner = 105)
    const innerStarR = 230;
    const innerStarSmallR = 105;
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const aOut = Math.PI / 2 + (i * Math.PI * 2) / 5; // Inverted orientation
      const aIn = aOut + Math.PI / 5;
      const ox = cx + Math.cos(aOut) * innerStarR;
      const oy = cy + Math.sin(aOut) * innerStarR;
      const ix = cx + Math.cos(aIn) * innerStarSmallR;
      const iy = cy + Math.sin(aIn) * innerStarSmallR;

      if (i === 0) ctx.moveTo(ox, oy);
      else ctx.lineTo(ox, oy);
      ctx.lineTo(ix, iy);
    }
    ctx.closePath();
    ctx.fillStyle = colDarkRed;
    ctx.fill();
    ctx.strokeStyle = colIvory;
    ctx.lineWidth = 5.0;
    ctx.stroke();
    ctx.restore();

    // Central Sacred Core (Bindu)
    drawCircle(135, 6, colIvory);
    drawCircle(95, 5, colVermilion);
    drawCircle(55, 6, colIvory);

    // Solid Central Bloodstone Medallion
    ctx.fillStyle = colMaroon;
    ctx.beginPath();
    ctx.arc(cx, cy, 52, 0, Math.PI * 2);
    ctx.fill();

    // Central Bindu Point
    ctx.fillStyle = colIvory;
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#100606';
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fill();

    // 10 Radial Spokes connecting Bindu
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI * 2) / 10;
      drawPowderLine(
        cx + Math.cos(a) * 55,
        cy + Math.sin(a) * 55,
        cx + Math.cos(a) * 95,
        cy + Math.sin(a) * 95,
        3.0,
        colIvory
      );
    }

    // =========================================================================
    // 7. AUTHENTIC POWDER GRAIN & AGED WEAR
    // =========================================================================
    for (let i = 0; i < 2400; i++) {
      const rad = Math.random() * 920;
      const ang = Math.random() * Math.PI * 2;
      const gx = cx + Math.cos(ang) * rad;
      const gy = cy + Math.sin(ang) * rad;

      ctx.fillStyle = Math.random() > 0.4
        ? 'rgba(238, 230, 215, 0.40)'
        : 'rgba(168, 34, 30, 0.35)';
      ctx.fillRect(gx, gy, Math.random() * 2.5 + 1.0, Math.random() * 2.5 + 1.0);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 16;
    this.cache.set('b_star_ritual_floor', texture);
    return texture;
  }
}

/**
 * Procedural Anatomical Human Skeleton Mesh Factory.
 * Builds realistic, non-cartoonish bone structures:
 * Cranium (vault, sockets, jaw), vertebral column, ribcage arches, pelvis, and limbs.
 */
export class HumanSkeletonFactory {
  private static boneMaterial = new THREE.MeshStandardMaterial({
    color: 0xd6cbb8, // Aged, yellowed brittle archaeological bone
    roughness: 0.88,
    metalness: 0.04,
  });

  private static darkBoneMaterial = new THREE.MeshStandardMaterial({
    color: 0x9a8f7e, // Decayed, mineral-stained dark bone
    roughness: 0.92,
    metalness: 0.02,
  });

  /**
   * Constructs an anatomically proportioned human skull.
   */
  public static createSkull(scale = 1.0, decayed = false): THREE.Group {
    const skull = new THREE.Group();
    skull.name = 'HumanSkull';
    const mat = decayed ? this.darkBoneMaterial : this.boneMaterial;

    // 1. Cranial Vault (stretched neurocranium)
    const craniumGeo = new THREE.SphereGeometry(0.115 * scale, 12, 10);
    craniumGeo.scale(1.0, 1.15, 1.25);
    const cranium = new THREE.Mesh(craniumGeo, mat);
    cranium.position.set(0, 0.04 * scale, -0.01 * scale);
    cranium.castShadow = true;
    skull.add(cranium);

    // 2. Facial Splanchnocranium & Zygomatic arches (cheekbones)
    const faceGeo = new THREE.BoxGeometry(0.15 * scale, 0.10 * scale, 0.11 * scale);
    const face = new THREE.Mesh(faceGeo, mat);
    face.position.set(0, -0.04 * scale, 0.06 * scale);
    skull.add(face);

    // 3. Left and Right Eye Orbits (recessed dark sockets)
    const orbitMat = new THREE.MeshStandardMaterial({ color: 0x0a0808, roughness: 0.95 });
    const orbitGeo = new THREE.CylinderGeometry(0.028 * scale, 0.024 * scale, 0.03 * scale, 8);
    orbitGeo.rotateX(Math.PI / 2);

    const orbitL = new THREE.Mesh(orbitGeo, orbitMat);
    orbitL.position.set(-0.042 * scale, -0.02 * scale, 0.11 * scale);
    skull.add(orbitL);

    const orbitR = new THREE.Mesh(orbitGeo, orbitMat);
    orbitR.position.set(0.042 * scale, -0.02 * scale, 0.11 * scale);
    skull.add(orbitR);

    // 4. Nasal Cavity (piriform aperture triangle)
    const nasalGeo = new THREE.BoxGeometry(0.02 * scale, 0.035 * scale, 0.03 * scale);
    const nasal = new THREE.Mesh(nasalGeo, orbitMat);
    nasal.position.set(0, -0.05 * scale, 0.11 * scale);
    skull.add(nasal);

    // 5. Maxilla and Upper Teeth
    const maxillaGeo = new THREE.BoxGeometry(0.08 * scale, 0.032 * scale, 0.05 * scale);
    const maxilla = new THREE.Mesh(maxillaGeo, mat);
    maxilla.position.set(0, -0.085 * scale, 0.07 * scale);
    skull.add(maxilla);

    // 6. Mandible (Lower Jaw)
    const jawGeo = new THREE.BoxGeometry(0.09 * scale, 0.04 * scale, 0.07 * scale);
    const jaw = new THREE.Mesh(jawGeo, mat);
    jaw.position.set(0, -0.12 * scale, 0.055 * scale);
    skull.add(jaw);

    return skull;
  }

  /**
   * Constructs an authentic complete human skeleton model in a natural pose.
   */
  public static createSkeleton(pose: 'SUPINE' | 'SLUMPED' | 'CHAINED' = 'SUPINE'): THREE.Group {
    const skeleton = new THREE.Group();
    skeleton.name = `HumanSkeleton_${pose}`;
    const mat = this.boneMaterial;

    // --- CRANIUM ---
    const skull = this.createSkull(1.0);
    skeleton.add(skull);

    // --- SPINE / VERTEBRAL COLUMN ---
    const spineGroup = new THREE.Group();
    const vertGeo = new THREE.CylinderGeometry(0.028, 0.032, 0.035, 7);
    for (let v = 0; v < 12; v++) {
      const vert = new THREE.Mesh(vertGeo, mat);
      vert.position.set(0, -v * 0.045, (v % 3 === 0) ? 0.005 : -0.005);
      spineGroup.add(vert);
    }
    skeleton.add(spineGroup);

    // --- RIBCAGE (10 paired curved rib arches + sternum) ---
    const ribcage = new THREE.Group();
    ribcage.position.set(0, -0.15, 0);

    // Sternum (breastbone)
    const sternumGeo = new THREE.BoxGeometry(0.035, 0.28, 0.02);
    const sternum = new THREE.Mesh(sternumGeo, mat);
    sternum.position.set(0, -0.14, 0.11);
    ribcage.add(sternum);

    // Bilateral curved rib arches
    for (let r = 0; r < 7; r++) {
      const ribW = 0.14 + Math.sin(r / 6 * Math.PI) * 0.09;
      const ribArchGeo = new THREE.TorusGeometry(ribW, 0.011, 6, 12, Math.PI * 0.85);
      ribArchGeo.rotateX(Math.PI / 2);
      ribArchGeo.rotateZ(-Math.PI * 0.425);

      const ribArch = new THREE.Mesh(ribArchGeo, mat);
      ribArch.position.set(0, -0.04 - r * 0.045, 0.02);
      ribcage.add(ribArch);
    }
    skeleton.add(ribcage);

    // --- PELVIS (Iliac crests, sacrum, ischium) ---
    const pelvis = new THREE.Group();
    pelvis.position.set(0, -0.58, 0);

    const iliumGeo = new THREE.BoxGeometry(0.08, 0.14, 0.11);
    const iliumL = new THREE.Mesh(iliumGeo, mat);
    iliumL.position.set(-0.11, 0, 0);
    iliumL.rotation.z = 0.22;
    pelvis.add(iliumL);

    const iliumR = new THREE.Mesh(iliumGeo, mat);
    iliumR.position.set(0.11, 0, 0);
    iliumR.rotation.z = -0.22;
    pelvis.add(iliumR);

    const sacrumGeo = new THREE.CylinderGeometry(0.04, 0.025, 0.12, 6);
    const sacrum = new THREE.Mesh(sacrumGeo, mat);
    sacrum.position.set(0, -0.02, -0.04);
    pelvis.add(sacrum);
    skeleton.add(pelvis);

    // Helper for limb long bones (Femur, Tibia, Humerus) with realistic epiphyses (swollen bone ends)
    const createLongBone = (len: number, rad: number) => {
      const bone = new THREE.Group();
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad * 0.95, len * 0.86, 8), mat);
      bone.add(shaft);

      const headGeo = new THREE.SphereGeometry(rad * 1.5, 7, 7);
      const headTop = new THREE.Mesh(headGeo, mat);
      headTop.position.set(0, len * 0.43, 0);
      bone.add(headTop);

      const headBot = new THREE.Mesh(headGeo, mat);
      headBot.position.set(0, -len * 0.43, 0);
      bone.add(headBot);
      return bone;
    };

    // --- ARMS & LEGS ACCORDING TO NATURAL POSE ---
    if (pose === 'SUPINE') {
      // Resting on back on stone slab or ground: limbs naturally relaxed
      skull.position.set(0, 0.06, 0);
      skull.rotation.set(-Math.PI * 0.42, 0.18, 0.12);

      // Left Leg (Femur + Tibia + Foot)
      const femurL = createLongBone(0.44, 0.024);
      femurL.position.set(-0.13, -0.80, 0.04);
      femurL.rotation.set(0.05, 0, 0.12);
      skeleton.add(femurL);

      const tibiaL = createLongBone(0.40, 0.020);
      tibiaL.position.set(-0.16, -1.22, 0.05);
      tibiaL.rotation.set(-0.04, 0, 0.15);
      skeleton.add(tibiaL);

      // Right Leg
      const femurR = createLongBone(0.44, 0.024);
      femurR.position.set(0.13, -0.80, 0.03);
      femurR.rotation.set(0.08, 0, -0.16);
      skeleton.add(femurR);

      const tibiaR = createLongBone(0.40, 0.020);
      tibiaR.position.set(0.18, -1.22, 0.04);
      tibiaR.rotation.set(0.02, 0, -0.20);
      skeleton.add(tibiaR);

      // Arms resting alongside body
      const armL = createLongBone(0.32, 0.019);
      armL.position.set(-0.25, -0.32, 0.02);
      armL.rotation.set(0, 0, 0.18);
      skeleton.add(armL);

      const forearmL = createLongBone(0.30, 0.016);
      forearmL.position.set(-0.29, -0.62, 0.04);
      forearmL.rotation.set(-0.1, 0, 0.22);
      skeleton.add(forearmL);

      const armR = createLongBone(0.32, 0.019);
      armR.position.set(0.24, -0.32, 0.02);
      armR.rotation.set(0, 0, -0.14);
      skeleton.add(armR);

      const forearmR = createLongBone(0.30, 0.016);
      forearmR.position.set(0.24, -0.62, 0.08);
      forearmR.rotation.set(-0.35, 0, -0.05); // Hand across abdomen
      skeleton.add(forearmR);
    } else if (pose === 'SLUMPED') {
      // Seated on ground, back slumped against stone wall / post
      skull.position.set(0, 0.02, 0.08);
      skull.rotation.set(0.35, -0.22, 0.15); // Slumped forward onto chest

      // Bent spine
      spineGroup.rotation.x = 0.28;
      ribcage.rotation.x = 0.28;

      // Legs bent and sprawled on floor
      const femurL = createLongBone(0.44, 0.024);
      femurL.position.set(-0.16, -0.68, 0.22);
      femurL.rotation.set(Math.PI * 0.44, 0, -0.25);
      skeleton.add(femurL);

      const tibiaL = createLongBone(0.40, 0.020);
      tibiaL.position.set(-0.24, -0.72, 0.58);
      tibiaL.rotation.set(0.12, 0, 0.35);
      skeleton.add(tibiaL);

      const femurR = createLongBone(0.44, 0.024);
      femurR.position.set(0.16, -0.68, 0.20);
      femurR.rotation.set(Math.PI * 0.40, 0, 0.30);
      skeleton.add(femurR);

      const tibiaR = createLongBone(0.40, 0.020);
      tibiaR.position.set(0.26, -0.72, 0.55);
      tibiaR.rotation.set(0.08, 0, -0.38);
      skeleton.add(tibiaR);

      // Arm reaching forward desperately
      const armR = createLongBone(0.32, 0.019);
      armR.position.set(0.24, -0.28, 0.18);
      armR.rotation.set(Math.PI * 0.35, 0, -0.20);
      skeleton.add(armR);

      const forearmR = createLongBone(0.30, 0.016);
      forearmR.position.set(0.28, -0.34, 0.48);
      forearmR.rotation.set(Math.PI * 0.45, 0, -0.15);
      skeleton.add(forearmR);
    } else if (pose === 'CHAINED') {
      // Wall shackle pose: arms raised upward, skull slumped down
      skull.position.set(0, 0.04, 0.06);
      skull.rotation.set(0.45, 0, 0);

      // Arms raised high towards wall shackles
      const armL = createLongBone(0.34, 0.019);
      armL.position.set(-0.25, 0.14, 0);
      armL.rotation.set(0, 0, Math.PI * 0.72);
      skeleton.add(armL);

      const forearmL = createLongBone(0.32, 0.016);
      forearmL.position.set(-0.48, 0.38, 0);
      forearmL.rotation.set(0, 0, Math.PI * 0.82);
      skeleton.add(forearmL);

      const armR = createLongBone(0.34, 0.019);
      armR.position.set(0.25, 0.14, 0);
      armR.rotation.set(0, 0, -Math.PI * 0.72);
      skeleton.add(armR);

      const forearmR = createLongBone(0.32, 0.016);
      forearmR.position.set(0.48, 0.38, 0);
      forearmR.rotation.set(0, 0, -Math.PI * 0.82);
      skeleton.add(forearmR);

      // Dangling buckled legs
      const femurL = createLongBone(0.44, 0.024);
      femurL.position.set(-0.12, -0.78, 0.04);
      femurL.rotation.set(0.25, 0, 0.08);
      skeleton.add(femurL);

      const tibiaL = createLongBone(0.40, 0.020);
      tibiaL.position.set(-0.13, -1.18, 0.12);
      tibiaL.rotation.set(0.45, 0, 0.05);
      skeleton.add(tibiaL);

      const femurR = createLongBone(0.44, 0.024);
      femurR.position.set(0.12, -0.78, 0.04);
      femurR.rotation.set(0.22, 0, -0.08);
      skeleton.add(femurR);

      const tibiaR = createLongBone(0.40, 0.020);
      tibiaR.position.set(0.13, -1.18, 0.10);
      tibiaR.rotation.set(0.40, 0, -0.05);
      skeleton.add(tibiaR);
    }

    return skeleton;
  }

  /**
   * Constructs an ossuary corner bone pile with skulls, femurs, and ribs.
   */
  public static createBonePile(scale = 1.0): THREE.Group {
    const pile = new THREE.Group();
    pile.name = 'OssuaryBonePile';
    const mat = this.darkBoneMaterial;

    // Base heap of long bones
    const boneGeo = new THREE.CylinderGeometry(0.022 * scale, 0.022 * scale, 0.44 * scale, 6);
    for (let i = 0; i < 18; i++) {
      const bone = new THREE.Mesh(boneGeo, mat);
      const angle = (i / 18) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
      const dist = Math.random() * 0.35 * scale;
      bone.position.set(Math.cos(angle) * dist, 0.05 * scale + Math.random() * 0.15 * scale, Math.sin(angle) * dist);
      bone.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      pile.add(bone);
    }

    // 3 skulls resting amidst the bones at different angles
    const skull1 = this.createSkull(0.85 * scale, true);
    skull1.position.set(0.08 * scale, 0.18 * scale, 0.06 * scale);
    skull1.rotation.set(0.4, 0.8, -0.2);
    pile.add(skull1);

    const skull2 = this.createSkull(0.92 * scale, false);
    skull2.position.set(-0.14 * scale, 0.14 * scale, -0.08 * scale);
    skull2.rotation.set(-0.6, -1.1, 0.4);
    pile.add(skull2);

    const skull3 = this.createSkull(0.80 * scale, true);
    skull3.position.set(0.02 * scale, 0.28 * scale, -0.04 * scale);
    skull3.rotation.set(0.2, -0.4, 0.1);
    pile.add(skull3);

    return pile;
  }
}

export interface BasementClue {
  id: string;
  name: string;
  room: string;
  position: THREE.Vector3;
  description: string;
  details?: string;
}

/**
 * BasementInterior class:
 * Implements the full underground level beneath the bungalow with 4 distinct rooms,
 * a central landing area under the trapdoor chute, solid collision, and horror atmosphere.
 */
export class BasementInterior {
  public group: THREE.Group = new THREE.Group();
  public colliders: THREE.Box3[] = [];
  public basementClues: BasementClue[] = [];
  public flickeringLamps: THREE.PointLight[] = [];

  // Elevation parameters
  public readonly floorY = -8.0;
  public readonly ceilY = -4.0;
  public readonly wallH = 4.0;

  // Exterior bounds: X in [-18.0, 18.0] (36m wide), Z in [-96.0, -69.0] (27m long)
  public readonly minX = -18.0;
  public readonly maxX = 18.0;
  public readonly minZ = -96.0;
  public readonly maxZ = -69.0;

  // Shared PBR Materials
  private stoneFloorMat!: THREE.MeshStandardMaterial;
  private stoneWallMat!: THREE.MeshStandardMaterial;
  private rafterCeilMat!: THREE.MeshStandardMaterial;
  private starFloorMat!: THREE.MeshStandardMaterial;
  private darkWoodMat!: THREE.MeshStandardMaterial;
  private ironMat!: THREE.MeshStandardMaterial;
  private brassMat!: THREE.MeshStandardMaterial;
  private redSandstoneMat!: THREE.MeshStandardMaterial;

  constructor(private scene: THREE.Scene) {
    this.group.name = 'BasementInteriorLevel';

    this.initMaterials();
    this.buildStructuralShell();
    this.setupCentralArrivalArea();
    this.setupRoom1_UpperLeft_SkeletonRoom();
    this.setupRoom2_UpperRight_SkeletonRoom();
    this.setupRoom3_LowerLeft_PujaRoom();
    this.setupRoom4_LowerRight_DiningRoom();
    this.setupRoom5_StarRitualRoom();
    this.setupBasementLighting();

    this.scene.add(this.group);
  }

  private initMaterials(): void {
    const floorTex = BasementTextureGenerator.createStoneFloorTexture();
    const wallTex = BasementTextureGenerator.createStoneWallTexture();
    const ceilTex = BasementTextureGenerator.createRafterCeilingTexture();
    const starFloorTex = BasementTextureGenerator.createStarRitualFloorTexture();

    this.stoneFloorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.82,
      metalness: 0.08,
    });

    this.starFloorMat = new THREE.MeshStandardMaterial({
      map: starFloorTex,
      roughness: 0.86,
      metalness: 0.08,
    });

    this.stoneWallMat = new THREE.MeshStandardMaterial({
      map: wallTex,
      roughness: 0.88,
      metalness: 0.05,
    });

    this.rafterCeilMat = new THREE.MeshStandardMaterial({
      map: ceilTex,
      roughness: 0.92,
      metalness: 0.02,
    });

    this.darkWoodMat = new THREE.MeshStandardMaterial({
      color: 0x1f1410, // Weathered ancient dark teak
      roughness: 0.78,
      metalness: 0.08,
    });

    this.ironMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1c, // Weathered rusted iron
      roughness: 0.65,
      metalness: 0.85,
    });

    this.brassMat = new THREE.MeshStandardMaterial({
      color: 0xc49a45, // Aged tarnished ceremonial brass
      roughness: 0.38,
      metalness: 0.75,
    });

    this.redSandstoneMat = new THREE.MeshStandardMaterial({
      color: 0x5a1816, // Sacred Indian red sandstone with aged vermilion patina
      roughness: 0.85,
      metalness: 0.06,
    });
  }

  /**
   * Helper to build a solid wall with optional Box3 collider.
   */
  private createWall(pos: THREE.Vector3, size: THREE.Vector3, mat = this.stoneWallMat, addCollider = true): THREE.Mesh {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), mat);
    wall.position.copy(pos);
    wall.receiveShadow = true;
    wall.castShadow = true;
    this.group.add(wall);

    if (addCollider) {
      const box = new THREE.Box3();
      box.setFromCenterAndSize(pos, size);
      this.colliders.push(box);
    }
    return wall;
  }

  /**
   * Builds the outer rectangular perimeter walls, floor slab, and ceiling slab.
   */
  private buildStructuralShell(): void {
    const totalW = this.maxX - this.minX; // 36.0m
    const totalD = this.maxZ - this.minZ; // 27.0m
    const centerX = (this.minX + this.maxX) / 2; // 0.0
    const centerZ = (this.minZ + this.maxZ) / 2; // -82.5
    const midY = (this.floorY + this.ceilY) / 2; // -6.0

    // 1. Continuous Walkable Floor (top surface flush at y = -8.0)
    const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(totalW, 0.20, totalD), this.stoneFloorMat);
    floorMesh.position.set(centerX, this.floorY - 0.10, centerZ);
    floorMesh.receiveShadow = true;
    this.group.add(floorMesh);

    // 2. Ceiling with vertical trapdoor opening at x = 0, z = -82.15 (leaves a 1.6m x 1.6m square opening)
    // Left ceiling slab
    const ceilWLeft = totalW / 2 - 0.9;
    const ceilLeft = new THREE.Mesh(new THREE.BoxGeometry(ceilWLeft, 0.20, totalD), this.rafterCeilMat);
    ceilLeft.position.set(this.minX + ceilWLeft / 2, this.ceilY + 0.10, centerZ);
    this.group.add(ceilLeft);

    // Right ceiling slab
    const ceilRight = new THREE.Mesh(new THREE.BoxGeometry(ceilWLeft, 0.20, totalD), this.rafterCeilMat);
    ceilRight.position.set(this.maxX - ceilWLeft / 2, this.ceilY + 0.10, centerZ);
    this.group.add(ceilRight);

    // Center North ceiling slab
    const centerCeilZNorth = ((-82.15 + 0.8) - this.minZ) / 2;
    const ceilCenterN = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.20, centerCeilZNorth * 2), this.rafterCeilMat);
    ceilCenterN.position.set(0, this.ceilY + 0.10, this.minZ + centerCeilZNorth);
    this.group.add(ceilCenterN);

    // Center South ceiling slab
    const centerCeilZSouth = (this.maxZ - (-82.15 - 0.8)) / 2;
    const ceilCenterS = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.20, centerCeilZSouth * 2), this.rafterCeilMat);
    ceilCenterS.position.set(0, this.ceilY + 0.10, this.maxZ - centerCeilZSouth);
    this.group.add(ceilCenterS);

    // Ceiling Collider to prevent walking/jumping through the ceiling
    const ceilBox = new THREE.Box3();
    ceilBox.setFromCenterAndSize(new THREE.Vector3(centerX, this.ceilY + 0.5, centerZ), new THREE.Vector3(totalW, 0.8, totalD));
    this.colliders.push(ceilBox);

    // 3. Exterior Perimeter Walls (Thickness 0.35m)
    // North Wall (Z = -96.0)
    this.createWall(new THREE.Vector3(centerX, midY, this.minZ), new THREE.Vector3(totalW, this.wallH, 0.35));
    // South Wall (Z = -69.0) with central 2m doorway to Room 5 (Star Ritual Room) at x in [-1.0, 1.0]
    // West segment: x in [-18.0, -1.0] (width 17.0m, center = -9.5)
    this.createWall(new THREE.Vector3(-9.5, midY, this.maxZ), new THREE.Vector3(17.0, this.wallH, 0.35));
    // East segment: x in [1.0, 18.0] (width 17.0m, center = 9.5)
    this.createWall(new THREE.Vector3(9.5, midY, this.maxZ), new THREE.Vector3(17.0, this.wallH, 0.35));
    // Doorway 5 header/lintel above doorway (z = -69.0, headroom 2.8m, lintel 1.2m)
    this.createWall(new THREE.Vector3(0.0, this.ceilY - 0.6, this.maxZ), new THREE.Vector3(2.0, 1.2, 0.35), this.stoneWallMat, false);
    // Doorway 5 arch casing trim
    this.buildSouthDoorwayArch(new THREE.Vector3(0.0, this.floorY, this.maxZ));
    // West Wall (X = -18.0)
    this.createWall(new THREE.Vector3(this.minX, midY, centerZ), new THREE.Vector3(0.35, this.wallH, totalD));
    // East Wall (X = +18.0)
    this.createWall(new THREE.Vector3(this.maxX, midY, centerZ), new THREE.Vector3(0.35, this.wallH, totalD));

    // 4. Internal Room Partition Walls (Follow sketch: Central Area + 4 Rooms)
    // Center corridor boundary walls:
    // Left corridor dividing wall (x = -3.5):
    // North segment (z in [-96.0, -89.0])
    this.createWall(new THREE.Vector3(-3.5, midY, -92.5), new THREE.Vector3(0.28, this.wallH, 7.0));
    // Doorway 1 header to Room 1 (z in [-89.0, -87.0], 2m wide opening, lintel above 2.8m headroom)
    this.createWall(new THREE.Vector3(-3.5, this.ceilY - 0.6, -88.0), new THREE.Vector3(0.28, 1.2, 2.0), this.stoneWallMat, false);
    // Center segment (z in [-87.0, -78.0])
    this.createWall(new THREE.Vector3(-3.5, midY, -82.5), new THREE.Vector3(0.28, this.wallH, 9.0));
    // Doorway 3 header to Room 3 (z in [-78.0, -76.0], 2m wide opening)
    this.createWall(new THREE.Vector3(-3.5, this.ceilY - 0.6, -77.0), new THREE.Vector3(0.28, 1.2, 2.0), this.stoneWallMat, false);
    // South segment (z in [-76.0, -69.0])
    this.createWall(new THREE.Vector3(-3.5, midY, -72.5), new THREE.Vector3(0.28, this.wallH, 7.0));

    // Right corridor dividing wall (x = +3.5):
    // North segment (z in [-96.0, -89.0])
    this.createWall(new THREE.Vector3(3.5, midY, -92.5), new THREE.Vector3(0.28, this.wallH, 7.0));
    // Doorway 2 header to Room 2 (z in [-89.0, -87.0], 2m wide opening)
    this.createWall(new THREE.Vector3(3.5, this.ceilY - 0.6, -88.0), new THREE.Vector3(0.28, 1.2, 2.0), this.stoneWallMat, false);
    // Center segment (z in [-87.0, -78.0])
    this.createWall(new THREE.Vector3(3.5, midY, -82.5), new THREE.Vector3(0.28, this.wallH, 9.0));
    // Doorway 4 header to Room 4 (z in [-78.0, -76.0], 2m wide opening)
    this.createWall(new THREE.Vector3(3.5, this.ceilY - 0.6, -77.0), new THREE.Vector3(0.28, 1.2, 2.0), this.stoneWallMat, false);
    // South segment (z in [-76.0, -69.0])
    this.createWall(new THREE.Vector3(3.5, midY, -72.5), new THREE.Vector3(0.28, this.wallH, 7.0));

    // Horizontal room dividing walls (separating upper rooms from lower rooms at z = -82.5):
    // Left divider (between Room 1 and Room 3: x in [-18.0, -3.5])
    this.createWall(new THREE.Vector3(-10.75, midY, -82.5), new THREE.Vector3(14.5, this.wallH, 0.28));
    // Right divider (between Room 2 and Room 4: x in [3.5, 18.0])
    this.createWall(new THREE.Vector3(10.75, midY, -82.5), new THREE.Vector3(14.5, this.wallH, 0.28));

    // Arched doorframe casing trims for the 4 doorways
    this.buildDoorwayArch(new THREE.Vector3(-3.5, this.floorY, -88.0));
    this.buildDoorwayArch(new THREE.Vector3(3.5, this.floorY, -88.0));
    this.buildDoorwayArch(new THREE.Vector3(-3.5, this.floorY, -77.0));
    this.buildDoorwayArch(new THREE.Vector3(3.5, this.floorY, -77.0));
  }

  private buildDoorwayArch(pos: THREE.Vector3): void {
    const postGeo = new THREE.BoxGeometry(0.36, 2.80, 0.16);
    const postL = new THREE.Mesh(postGeo, this.darkWoodMat);
    postL.position.set(pos.x, pos.y + 1.40, pos.z - 1.0);
    this.group.add(postL);

    const postR = new THREE.Mesh(postGeo, this.darkWoodMat);
    postR.position.set(pos.x, pos.y + 1.40, pos.z + 1.0);
    this.group.add(postR);

    const lintelGeo = new THREE.BoxGeometry(0.38, 0.18, 2.20);
    const lintel = new THREE.Mesh(lintelGeo, this.darkWoodMat);
    lintel.position.set(pos.x, pos.y + 2.80 - 0.09, pos.z);
    this.group.add(lintel);
  }

  private buildSouthDoorwayArch(pos: THREE.Vector3): void {
    const postGeo = new THREE.BoxGeometry(0.16, 2.80, 0.36);
    const postL = new THREE.Mesh(postGeo, this.darkWoodMat);
    postL.position.set(pos.x - 1.0, pos.y + 1.40, pos.z);
    this.group.add(postL);

    const postR = new THREE.Mesh(postGeo, this.darkWoodMat);
    postR.position.set(pos.x + 1.0, pos.y + 1.40, pos.z);
    this.group.add(postR);

    const lintelGeo = new THREE.BoxGeometry(2.20, 0.18, 0.38);
    const lintel = new THREE.Mesh(lintelGeo, this.darkWoodMat);
    lintel.position.set(pos.x, pos.y + 2.80 - 0.09, pos.z);
    this.group.add(lintel);
  }

  /**
   * CENTRAL ARRIVAL AREA:
   * Where the player lands beneath the trapdoor chute.
   * Clear landing circle, overhead vertical chute, connecting passages to all 4 rooms.
   */
  private setupCentralArrivalArea(): void {
    const landingX = 0;
    const landingZ = -82.15;

    // 1. Vertical Masonry Chute Shaft extending from ceiling (y = -4.0) up to upper passage (y = 0.79)
    // Shaft walls prevent horizontal clipping during fall
    const chuteHeight = 0.79 - (-4.0); // 4.79m
    const chuteMidY = (-4.0 + 0.79) / 2; // -1.60m
    const chuteSize = 1.6;

    // West chute wall
    this.createWall(new THREE.Vector3(-chuteSize / 2, chuteMidY, landingZ), new THREE.Vector3(0.18, chuteHeight, chuteSize));
    // East chute wall
    this.createWall(new THREE.Vector3(chuteSize / 2, chuteMidY, landingZ), new THREE.Vector3(0.18, chuteHeight, chuteSize));
    // North chute wall
    this.createWall(new THREE.Vector3(0, chuteMidY, landingZ - chuteSize / 2), new THREE.Vector3(chuteSize, chuteHeight, 0.18));
    // South chute wall
    this.createWall(new THREE.Vector3(0, chuteMidY, landingZ + chuteSize / 2), new THREE.Vector3(chuteSize, chuteHeight, 0.18));

    // Broken iron cross-timbers hanging overhead at the chute exit
    const beamGeo = new THREE.BoxGeometry(1.8, 0.12, 0.12);
    const brokenBeam = new THREE.Mesh(beamGeo, this.darkWoodMat);
    brokenBeam.position.set(0, this.ceilY + 0.05, landingZ);
    brokenBeam.rotation.y = 0.35;
    this.group.add(brokenBeam);

    // Weathered landing stone ring on floor
    const ringGeo = new THREE.TorusGeometry(1.4, 0.04, 6, 24);
    ringGeo.rotateX(Math.PI / 2);
    const ring = new THREE.Mesh(ringGeo, this.darkWoodMat);
    ring.position.set(landingX, this.floorY + 0.02, landingZ);
    this.group.add(ring);

    // Antique iron wall cage lantern casting subtle warm light on north corridor wall
    const lanternGroup = new THREE.Group();
    lanternGroup.position.set(0, this.floorY + 2.4, -85.2);

    const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.28, 0.32), this.ironMat);
    lanternGroup.add(bracket);

    const cage = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.36, 0.22), this.ironMat);
    cage.position.set(0, -0.12, 0.22);
    lanternGroup.add(cage);

    const lampLight = new THREE.PointLight(0xde8235, 1.10, 11.5, 1.7);
    lampLight.position.set(0, -0.12, 0.24);
    (lampLight as any).userData = { baseIntensity: 1.10 };
    lanternGroup.add(lampLight);
    this.flickeringLamps.push(lampLight);

    this.group.add(lanternGroup);
  }

  /**
   * ROOM 1 — UPPER-LEFT: Skeleton Room 1 (X in [-17.5, -3.5], Z in [-95.5, -85.5])
   * Disturbing room with mortuary slab skeleton, chained wall skeleton, broken crates,
   * dusty shelves, rusted iron shackles, and surveyor field journal clue.
   */
  private setupRoom1_UpperLeft_SkeletonRoom(): void {
    const rx = -10.5;
    const rz = -90.5;

    // 1. Central Stone Mortuary Slab with complete anatomically realistic skeleton
    const slabBaseGeo = new THREE.BoxGeometry(1.2, 0.65, 2.3);
    const slab = new THREE.Mesh(slabBaseGeo, this.stoneWallMat);
    slab.position.set(rx, this.floorY + 0.325, rz);
    slab.castShadow = true;
    slab.receiveShadow = true;
    this.group.add(slab);

    const box = new THREE.Box3();
    box.setFromCenterAndSize(slab.position, new THREE.Vector3(1.4, 0.85, 2.5));
    this.colliders.push(box);

    // Anatomical skeleton resting supine on the mortuary slab
    const slabSkeleton = HumanSkeletonFactory.createSkeleton('SUPINE');
    slabSkeleton.position.set(rx, this.floorY + 0.65 + 0.12, rz);
    slabSkeleton.rotation.y = Math.PI;
    this.group.add(slabSkeleton);

    // 2. Secondary Skeleton chained to North Wall by iron wrist shackles
    const chainedSkeleton = HumanSkeletonFactory.createSkeleton('CHAINED');
    chainedSkeleton.position.set(-13.5, this.floorY + 1.25, -95.6);
    this.group.add(chainedSkeleton);

    // Wall shackles on North Wall
    const shackleGeo = new THREE.TorusGeometry(0.06, 0.015, 8, 12);
    const shackleL = new THREE.Mesh(shackleGeo, this.ironMat);
    shackleL.position.set(-13.5 - 0.48, this.floorY + 1.65, -95.7);
    this.group.add(shackleL);

    const shackleR = new THREE.Mesh(shackleGeo, this.ironMat);
    shackleR.position.set(-13.5 + 0.48, this.floorY + 1.65, -95.7);
    this.group.add(shackleR);

    // 3. Corner Ossuary Bone Pile in northwest corner
    const bonePile = HumanSkeletonFactory.createBonePile(1.1);
    bonePile.position.set(-16.0, this.floorY, -93.8);
    this.group.add(bonePile);

    // 4. Broken Wooden Crates with rotting straw
    this.buildCrate(new THREE.Vector3(-15.5, this.floorY, -87.5), 0.85, 0.85, 0.85);
    this.buildCrate(new THREE.Vector3(-16.2, this.floorY, -87.0), 0.75, 0.75, 0.75);

    // 5. Dusty Antique Wooden Shelving against West Wall
    const shelfGroup = new THREE.Group();
    const shelfFrameGeo = new THREE.BoxGeometry(0.45, 2.4, 2.0);
    const shelf = new THREE.Mesh(shelfFrameGeo, this.darkWoodMat);
    shelf.position.set(-17.65, this.floorY + 1.2, rz);
    shelfGroup.add(shelf);

    // Specimen jars with dark fluids on shelves
    const jarMat = new THREE.MeshStandardMaterial({ color: 0x445544, roughness: 0.25, transparent: true, opacity: 0.65 });
    for (let j = 0; j < 3; j++) {
      const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.18, 8), jarMat);
      jar.position.set(-17.5, this.floorY + 0.8 + j * 0.5, rz - 0.5 + j * 0.45);
      shelfGroup.add(jar);
    }
    this.group.add(shelfGroup);

    const shelfBox = new THREE.Box3();
    shelfBox.setFromCenterAndSize(new THREE.Vector3(-17.65, this.floorY + 1.2, rz), new THREE.Vector3(0.65, 2.5, 2.2));
    this.colliders.push(shelfBox);

    // 6. Environmental Clue: Surveyor's Bloodstained Field Journal Note
    this.basementClues.push({
      id: 'CLUE_BASEMENT_SURVEYOR_NOTE',
      name: 'BLOODSTAINED EXPEDITION PAGE',
      room: 'Skeleton Chamber I',
      position: new THREE.Vector3(rx + 0.7, this.floorY + 0.7, rz),
      description: 'A tattered survey document dated November 1923: "We broke into the crypt beneath the stairs... The seal broke. The door above will not budge. Something is down here with us."',
    });

    // Atmospheric cool blue-grey light source in Room 1
    const room1Light = new THREE.PointLight(0x6a7d99, 0.85, 12.0, 1.8);
    room1Light.position.set(rx, this.floorY + 2.8, rz);
    (room1Light as any).userData = { baseIntensity: 0.85 };
    this.group.add(room1Light);
    this.flickeringLamps.push(room1Light);
  }

  /**
   * ROOM 2 — UPPER-RIGHT: Skeleton Room 2 (X in [3.5, 17.5], Z in [-95.5, -85.5])
   * A different, tragic sealed chamber: two skeletons slumped together against a central wooden post,
   * one skeleton crushed beneath a collapsed stone arch, rotted travel trunk, overturned wardrobe,
   * rusty iron cage, and carved tally marks.
   */
  private setupRoom2_UpperRight_SkeletonRoom(): void {
    const rx = 10.5;
    const rz = -90.5;

    // 1. Central Heavy Wooden Timber Pillar with two slumped skeletons
    const postGeo = new THREE.BoxGeometry(0.35, this.wallH, 0.35);
    const post = new THREE.Mesh(postGeo, this.darkWoodMat);
    post.position.set(rx, this.floorY + this.wallH / 2, rz);
    this.group.add(post);

    const postBox = new THREE.Box3();
    postBox.setFromCenterAndSize(post.position, new THREE.Vector3(0.55, this.wallH, 0.55));
    this.colliders.push(postBox);

    // Two slumped skeletons seated on the floor back-to-back against the post
    const slumped1 = HumanSkeletonFactory.createSkeleton('SLUMPED');
    slumped1.position.set(rx + 0.18, this.floorY, rz + 0.22);
    slumped1.rotation.y = 0.45;
    this.group.add(slumped1);

    const slumped2 = HumanSkeletonFactory.createSkeleton('SLUMPED');
    slumped2.position.set(rx - 0.22, this.floorY, rz - 0.18);
    slumped2.rotation.y = Math.PI * 0.95;
    this.group.add(slumped2);

    // 2. Third skeleton half-buried beneath collapsed stone blocks in northeast corner
    const crushedSkeleton = HumanSkeletonFactory.createSkeleton('SUPINE');
    crushedSkeleton.position.set(15.0, this.floorY, -93.5);
    crushedSkeleton.rotation.set(0.12, 0.45, 0);
    this.group.add(crushedSkeleton);

    // Fallen heavy stone blocks covering the lower skeleton
    const rubbleGeo = new THREE.BoxGeometry(0.75, 0.45, 0.65);
    const rubble1 = new THREE.Mesh(rubbleGeo, this.stoneWallMat);
    rubble1.position.set(15.1, this.floorY + 0.25, -93.8);
    rubble1.rotation.set(0.15, 0.25, -0.1);
    this.group.add(rubble1);

    const rubble2 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.35, 0.55), this.stoneWallMat);
    rubble2.position.set(14.7, this.floorY + 0.20, -93.2);
    this.group.add(rubble2);

    // 3. Rotted Leather Travel Trunk with brass latch in east alcove
    const trunkGeo = new THREE.BoxGeometry(0.95, 0.52, 0.60);
    const trunk = new THREE.Mesh(trunkGeo, new THREE.MeshStandardMaterial({ color: 0x241812, roughness: 0.85 }));
    trunk.position.set(16.5, this.floorY + 0.26, -88.5);
    this.group.add(trunk);

    const trunkBox = new THREE.Box3();
    trunkBox.setFromCenterAndSize(trunk.position, new THREE.Vector3(1.1, 0.7, 0.75));
    this.colliders.push(trunkBox);

    // 4. Overturned Vintage Mahogany Armoire
    const armoireGeo = new THREE.BoxGeometry(1.85, 0.65, 0.85);
    const armoire = new THREE.Mesh(armoireGeo, this.darkWoodMat);
    armoire.position.set(7.5, this.floorY + 0.325, -94.0);
    armoire.rotation.y = 0.22;
    this.group.add(armoire);

    const armoireBox = new THREE.Box3();
    armoireBox.setFromCenterAndSize(armoire.position, new THREE.Vector3(2.0, 0.8, 1.0));
    this.colliders.push(armoireBox);

    // 5. Heavy Rusted Iron Cage Structure in southeast corner
    const cageGeo = new THREE.BoxGeometry(1.6, 2.2, 1.4);
    const cageFrame = new THREE.Mesh(cageGeo, this.ironMat);
    cageFrame.position.set(16.0, this.floorY + 1.1, -94.2);
    this.group.add(cageFrame);

    const cageBox = new THREE.Box3();
    cageBox.setFromCenterAndSize(cageFrame.position, new THREE.Vector3(1.8, 2.4, 1.6));
    this.colliders.push(cageBox);

    // 6. Environmental Clues: Wall Tally Marks & Tarnished Silver Locket
    this.basementClues.push({
      id: 'CLUE_BASEMENT_WALL_TALLIES',
      name: 'CARVED WALL TALLY MARKS',
      room: 'Skeleton Chamber II',
      position: new THREE.Vector3(rx, this.floorY + 1.6, -95.7),
      description: 'Rough marks scratched into the granite: 41 tally groups. Beneath them, faintly chipped: "THEY LOCKED IT FROM THE OUTSIDE. OCTOBER 1923."',
    });

    this.basementClues.push({
      id: 'CLUE_BASEMENT_SILVER_LOCKET',
      name: 'TARNISHED SILVER LOCKET',
      room: 'Skeleton Chamber II',
      position: new THREE.Vector3(rx + 0.45, this.floorY + 0.25, rz + 0.4),
      description: 'A corroded silver locket held tightly in a skeleton\'s fingers. Inside is a faint miniature photograph of a young girl wearing a white dress.',
    });

    // Dim eerie amber lantern in Room 2
    const room2Light = new THREE.PointLight(0xc2712f, 0.85, 12.0, 1.8);
    room2Light.position.set(rx, this.floorY + 2.8, rz);
    (room2Light as any).userData = { baseIntensity: 0.85 };
    this.group.add(room2Light);
    this.flickeringLamps.push(room2Light);
  }

  /**
   * ROOM 3 — LOWER-LEFT: Indian Puja Room (X in [-17.5, -3.5], Z in [-79.5, -69.5])
   * Traditional colonial Indian puja sanctuary: carved red sandstone mandir altar,
   * tall brass Samai standing lamp, hanging diya, brass thalis with sindoor/haldi,
   * brass ghanti bell, shankha, sacred yantra wall markings, faded silk cloths.
   */
  private setupRoom3_LowerLeft_PujaRoom(): void {
    const rx = -10.5;
    const rz = -74.5;

    // 1. Traditional Indian Multi-Tier Red Sandstone Mandir Altar against West Wall
    const altarBaseW = 2.4;
    const altarBaseD = 1.4;
    const altarBaseH = 0.55;

    const altarDais = new THREE.Mesh(new THREE.BoxGeometry(altarBaseW, altarBaseH, altarBaseD), this.redSandstoneMat);
    altarDais.position.set(-16.4, this.floorY + altarBaseH / 2, rz);
    this.group.add(altarDais);

    const altarBox = new THREE.Box3();
    altarBox.setFromCenterAndSize(altarDais.position, new THREE.Vector3(altarBaseW + 0.2, 2.6, altarBaseD + 0.2));
    this.colliders.push(altarBox);

    // Carved upper shrine tier with arch canopy and dome
    const shrineTier = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 0.8), this.darkWoodMat);
    shrineTier.position.set(-16.6, this.floorY + altarBaseH + 0.55, rz);
    this.group.add(shrineTier);

    const canopyGeo = new THREE.CylinderGeometry(0.12, 0.75, 0.5, 8);
    const canopy = new THREE.Mesh(canopyGeo, this.redSandstoneMat);
    canopy.position.set(-16.6, this.floorY + altarBaseH + 1.1 + 0.25, rz);
    this.group.add(canopy);

    // 2. Ceremonial Tall Brass Samai Standing Lamp (Traditional 5-wick oil lamp)
    const samaiGroup = new THREE.Group();
    samaiGroup.position.set(-14.2, this.floorY, rz - 1.2);

    const samaiBase = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 0.12, 12), this.brassMat);
    samaiBase.position.set(0, 0.06, 0);
    samaiGroup.add(samaiBase);

    const samaiShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.1, 8), this.brassMat);
    samaiShaft.position.set(0, 0.65, 0);
    samaiGroup.add(samaiShaft);

    const samaiBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.14, 0.12, 12), this.brassMat);
    samaiBowl.position.set(0, 1.25, 0);
    samaiGroup.add(samaiBowl);

    const samaiFinial = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 8), this.brassMat);
    samaiFinial.position.set(0, 1.38, 0);
    samaiGroup.add(samaiFinial);
    this.group.add(samaiGroup);

    // 3. Hanging Brass Diya suspended from ceiling by brass chain
    const hangChain = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.8, 6), this.brassMat);
    hangChain.position.set(-16.0, this.ceilY - 0.9, rz);
    this.group.add(hangChain);

    const hangLamp = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.12, 0.15, 10), this.brassMat);
    hangLamp.position.set(-16.0, this.ceilY - 1.85, rz);
    this.group.add(hangLamp);

    // 4. Ritual Brass Puja Thalis (Plates) with Dried Sindoor (Vermilion) & Turmeric
    const thaliMat = new THREE.MeshStandardMaterial({ color: 0x860111, roughness: 0.65 });
    const thaliGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.02, 16);
    const thali = new THREE.Mesh(thaliGeo, this.brassMat);
    thali.position.set(-15.8, this.floorY + altarBaseH + 0.01, rz - 0.35);
    this.group.add(thali);

    const powderHeap = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.05, 8), thaliMat);
    powderHeap.position.set(-15.8, this.floorY + altarBaseH + 0.035, rz - 0.35);
    this.group.add(powderHeap);

    // Traditional brass Ghanti (puja bell) with crest handle
    const bellGeo = new THREE.CylinderGeometry(0.03, 0.07, 0.14, 8);
    const bell = new THREE.Mesh(bellGeo, this.brassMat);
    bell.position.set(-15.8, this.floorY + altarBaseH + 0.07, rz + 0.35);
    this.group.add(bell);

    // Sacred Shankha (conch shell replica on brass tortoise tripod)
    const conchMat = new THREE.MeshStandardMaterial({ color: 0xe8dfd2, roughness: 0.55 });
    const conch = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 8), conchMat);
    conch.rotation.z = Math.PI / 2;
    conch.position.set(-16.0, this.floorY + altarBaseH + 0.06, rz);
    this.group.add(conch);

    // 5. Environmental Clues: Ancient Puja Mandir & Copper Yantra Tablet
    this.basementClues.push({
      id: 'CLUE_BASEMENT_PUJA_ALTAR',
      name: 'DESECRATED RED SANDSTONE MANDIR',
      room: 'Underground Puja Sanctuary',
      position: new THREE.Vector3(-15.5, this.floorY + 1.2, rz),
      description: 'An ancient colonial Indian shrine carved from red sandstone. Dried sindoor, withered marigold petals, and black mustard oil tar coat the brass plates. Faded Sanskrit verses are scratched into the stone.',
    });

    this.basementClues.push({
      id: 'CLUE_BASEMENT_YANTRA_TABLET',
      name: 'SACRED COPPER YANTRA TABLET',
      room: 'Underground Puja Sanctuary',
      position: new THREE.Vector3(-15.8, this.floorY + 0.8, rz - 0.35),
      description: 'An engraved geometric Sri Yantra on aged green-patinated copper. Inscriptions plead for spiritual shielding against "the shadows beneath the foundation".',
    });

    // Warm sacred amber/red illumination in Puja Room
    const pujaLight = new THREE.PointLight(0xdb6826, 1.15, 13.0, 1.7);
    pujaLight.position.set(-15.5, this.floorY + 2.2, rz);
    (pujaLight as any).userData = { baseIntensity: 1.15 };
    this.group.add(pujaLight);
    this.flickeringLamps.push(pujaLight);
  }

  /**
   * ROOM 4 — LOWER-RIGHT: Large Dining Room (X in [3.5, 17.5], Z in [-79.5, -69.5])
   * Prominent massive dining table (7.2m x 1.85m), 10 vintage wooden high-back chairs,
   * dusty porcelain plates, pewter goblets, silver cutlery, soup tureen, candelabras,
   * mahogany sideboard credenza with framed family photograph and dinner invitation.
   */
  private setupRoom4_LowerRight_DiningRoom(): void {
    const rx = 10.5;
    const rz = -74.5;

    // 1. Prominent Long Banquet Dining Table (7.2m length, 1.85m width, 0.82m height)
    const tableTopGeo = new THREE.BoxGeometry(7.2, 0.09, 1.85);
    const tableTop = new THREE.Mesh(tableTopGeo, this.darkWoodMat);
    tableTop.position.set(rx, this.floorY + 0.82, rz);
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    this.group.add(tableTop);

    // 4 Heavy carved pedestal baluster legs
    const legGeo = new THREE.CylinderGeometry(0.14, 0.16, 0.78, 8);
    const legPositions: [number, number][] = [
      [rx - 2.8, rz - 0.65],
      [rx - 2.8, rz + 0.65],
      [rx + 2.8, rz - 0.65],
      [rx + 2.8, rz + 0.65],
    ];
    for (const [lx, lz] of legPositions) {
      const leg = new THREE.Mesh(legGeo, this.darkWoodMat);
      leg.position.set(lx, this.floorY + 0.39, lz);
      this.group.add(leg);
    }

    // Box collider for entire dining table (leaves comfortable ~3m clearance all around)
    const tableBox = new THREE.Box3();
    tableBox.setFromCenterAndSize(new THREE.Vector3(rx, this.floorY + 0.5, rz), new THREE.Vector3(7.4, 1.0, 2.05));
    this.colliders.push(tableBox);

    // 2. 10 Vintage Colonial High-Back Wooden Chairs
    const chairBackGeo = new THREE.BoxGeometry(0.06, 0.65, 0.45);
    const chairSeatGeo = new THREE.BoxGeometry(0.48, 0.05, 0.48);

    // 4 chairs on North side, 4 chairs on South side, 1 chair on West head, 1 chair on East head
    const chairOffsets: [number, number, number, boolean][] = [
      [-2.4, -1.25, 0, false],
      [-0.8, -1.25, 0, false],
      [0.8, -1.25, 0, false],
      [2.4, -1.35, -0.15, true], // Pushed back slightly
      [-2.4, 1.25, Math.PI, false],
      [-0.8, 1.25, Math.PI, false],
      [0.8, 1.35, Math.PI + 0.25, false],
      [2.4, 1.25, Math.PI, false],
      [-3.9, 0, Math.PI / 2, false], // West head
      [3.9, 0, -Math.PI / 2, false], // East head
    ];

    for (const [ox, oz, rotY, knockedOver] of chairOffsets) {
      const chairGroup = new THREE.Group();
      chairGroup.position.set(rx + ox, this.floorY, rz + oz);

      const seat = new THREE.Mesh(chairSeatGeo, this.darkWoodMat);
      seat.position.set(0, 0.48, 0);
      chairGroup.add(seat);

      const back = new THREE.Mesh(chairBackGeo, this.darkWoodMat);
      back.position.set(0, 0.80, -0.21);
      chairGroup.add(back);

      if (knockedOver) {
        chairGroup.rotation.z = Math.PI / 2;
        chairGroup.position.y += 0.22;
      } else {
        chairGroup.rotation.y = rotY;
      }
      this.group.add(chairGroup);
    }

    // 3. Dusty Porcelain Dinner Plates, Pewter Goblets, Silverware & Covered Platters
    const plateMat = new THREE.MeshStandardMaterial({ color: 0xcdc8bc, roughness: 0.55 });
    const gobletMat = new THREE.MeshStandardMaterial({ color: 0x4a4d52, roughness: 0.45, metalness: 0.85 });

    for (let p = -3; p <= 3; p++) {
      if (p === 0) continue; // Leave center for soup tureen
      const px = rx + p * 0.95;

      // North side plate & goblet
      const plateN = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.015, 12), plateMat);
      plateN.position.set(px, this.floorY + 0.865 + 0.008, rz - 0.55);
      this.group.add(plateN);

      const gobN = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.12, 8), gobletMat);
      gobN.position.set(px + 0.14, this.floorY + 0.865 + 0.06, rz - 0.70);
      this.group.add(gobN);

      // South side plate & goblet
      const plateS = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.015, 12), plateMat);
      plateS.position.set(px, this.floorY + 0.865 + 0.008, rz + 0.55);
      this.group.add(plateS);

      const gobS = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.12, 8), gobletMat);
      gobS.position.set(px + 0.14, this.floorY + 0.865 + 0.06, rz + 0.70);
      this.group.add(gobS);
    }

    // Centerpiece Ornate Pewter Soup Tureen with ladle
    const tureen = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.16, 0.22, 12), gobletMat);
    tureen.position.set(rx, this.floorY + 0.865 + 0.11, rz);
    this.group.add(tureen);

    // 5-Branch Candelabra with melted wax cascades
    const candelabra = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.12, 0.45, 8), gobletMat);
    candelabra.position.set(rx - 1.6, this.floorY + 0.865 + 0.225, rz);
    this.group.add(candelabra);

    // 4. Grand Colonial Mahogany Sideboard Credenza along East Wall
    const sideboardGeo = new THREE.BoxGeometry(0.75, 1.15, 3.2);
    const sideboard = new THREE.Mesh(sideboardGeo, this.darkWoodMat);
    sideboard.position.set(17.3, this.floorY + 0.575, rz);
    this.group.add(sideboard);

    const sbBox = new THREE.Box3();
    sbBox.setFromCenterAndSize(sideboard.position, new THREE.Vector3(0.95, 1.35, 3.4));
    this.colliders.push(sbBox);

    // Mirrored splashback on sideboard
    const splashback = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.95, 3.0), this.darkWoodMat);
    splashback.position.set(17.55, this.floorY + 1.15 + 0.475, rz);
    this.group.add(splashback);

    // 5. Environmental Clues: Abandoned Banquet & Colonial Family Photograph
    this.basementClues.push({
      id: 'CLUE_BASEMENT_DINING_TABLE',
      name: 'ABANDONED BANQUET TABLE',
      room: 'Underground Banquet Hall',
      position: new THREE.Vector3(rx, this.floorY + 1.1, rz),
      description: 'Ten place settings preserved under centuries of dust. Tarnished goblets, unwashed porcelain plates, and cold soup tureen. One chair was violently overturned as if someone fled in terror.',
    });

    this.basementClues.push({
      id: 'CLUE_BASEMENT_FAMILY_PHOTO',
      name: 'FRAMED COLONIAL PHOTOGRAPH',
      room: 'Underground Banquet Hall',
      position: new THREE.Vector3(17.2, this.floorY + 1.25, rz - 0.8),
      description: 'A silver-framed photograph showing a stern colonial family gathered around this exact subterranean banquet table, their faces darkened with ominous scowls.',
    });

    this.basementClues.push({
      id: 'CLUE_BASEMENT_DINNER_INVITATION',
      name: 'YELLOWED DINNER INVITATION',
      room: 'Underground Banquet Hall',
      position: new THREE.Vector3(17.2, this.floorY + 1.25, rz + 0.8),
      description: 'A handwritten letter on parchment: "You are cordially summoned to the final gathering in the cellar beneath the estate. Attendance is compulsory. October 24th, 1923."',
    });

    // Warm candelabra chandelier light in Dining Room
    const diningLight = new THREE.PointLight(0xdb7c34, 1.15, 14.0, 1.7);
    diningLight.position.set(rx, this.floorY + 2.8, rz);
    (diningLight as any).userData = { baseIntensity: 1.15 };
    this.group.add(diningLight);
    this.flickeringLamps.push(diningLight);
  }

  /**
   * ROOM 5 — SECRET STAR RITUAL ROOM (Z in [-69.0, -53.0], X in [-8.0, +8.0])
   * The fifth, locked room connected through the star-marked door at (0, -8.0, -69.0).
   * Features:
   * - Entire floor covered in the HUGE STAR-SHAPED RITUAL MUGGU (2048x2048 texture)
   * - Dark weathered stone ashlar walls, timber ceiling rafters
   * - Elevated central sacrificial dais / bindu altar with ceremonial katora & candles
   * - 5 Tall rusted iron standing braziers with burning embers at the 5 star points
   * - Dramatic ritual illumination casting atmospheric occult shadows
   * - Ancient Palm-leaf Grantham manuscript and bloodstone monolith stele
   */
  private setupRoom5_StarRitualRoom(): void {
    const rx = 0.0;
    const rz = -61.0; // Center Z between -69.0 and -53.0
    const roomW = 16.0;
    const roomD = 16.0;
    const midY = (this.floorY + this.ceilY) / 2;

    // 1. Walkable Floor Slab with the HUGE STAR-SHAPED RITUAL MUGGU
    // Top surface flush with basement floor level at y = -8.0
    const starFloorMesh = new THREE.Mesh(new THREE.BoxGeometry(roomW, 0.20, roomD), this.starFloorMat);
    starFloorMesh.position.set(rx, this.floorY - 0.10, rz);
    starFloorMesh.receiveShadow = true;
    this.group.add(starFloorMesh);



    // 2. Ceiling Slab
    const starCeilMesh = new THREE.Mesh(new THREE.BoxGeometry(roomW, 0.20, roomD), this.rafterCeilMat);
    starCeilMesh.position.set(rx, this.ceilY + 0.10, rz);
    this.group.add(starCeilMesh);

    // Ceiling collider
    const ceilBox = new THREE.Box3();
    ceilBox.setFromCenterAndSize(new THREE.Vector3(rx, this.ceilY + 0.5, rz), new THREE.Vector3(roomW, 0.8, roomD));
    this.colliders.push(ceilBox);

    // 3. Perimeter Enclosure Walls (Thickness 0.35m)
    // South Wall (Z = -53.0)
    this.createWall(new THREE.Vector3(rx, midY, -53.0), new THREE.Vector3(roomW, this.wallH, 0.35));
    // West Wall (X = -8.0)
    this.createWall(new THREE.Vector3(-8.0, midY, rz), new THREE.Vector3(0.35, this.wallH, roomD));
    // East Wall (X = +8.0)
    this.createWall(new THREE.Vector3(8.0, midY, rz), new THREE.Vector3(0.35, this.wallH, roomD));
    // Note: The North wall at Z = -69.0 flanking the 2m central doorway is built by the structural shell

    // 4. Central Sacrificial Altar Dais over the Muggu Sacred Bindu Core
    const daisGeo = new THREE.CylinderGeometry(1.25, 1.35, 0.28, 16);
    const dais = new THREE.Mesh(daisGeo, this.redSandstoneMat);
    dais.position.set(rx, this.floorY + 0.14, rz);
    dais.castShadow = true;
    dais.receiveShadow = true;
    this.group.add(dais);

    const daisBox = new THREE.Box3();
    daisBox.setFromCenterAndSize(dais.position, new THREE.Vector3(2.5, 0.5, 2.5));
    this.colliders.push(daisBox);

    // Sacrificial Brass Katora (Offering Chalice)
    const chaliceGeo = new THREE.CylinderGeometry(0.24, 0.12, 0.22, 12);
    const chalice = new THREE.Mesh(chaliceGeo, this.brassMat);
    chalice.position.set(rx, this.floorY + 0.28 + 0.11, rz);
    this.group.add(chalice);

    // Coagulated vermilion / dried offerings inside chalice
    const offeringMat = new THREE.MeshStandardMaterial({ color: 0x5a0b0d, roughness: 0.85 });
    const offering = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.20, 0.04, 12), offeringMat);
    offering.position.set(rx, this.floorY + 0.28 + 0.20, rz);
    this.group.add(offering);

    // Ritual Athame / Ceremonial Sacrificial Dagger on black silk
    const daggerGroup = new THREE.Group();
    daggerGroup.position.set(rx + 0.35, this.floorY + 0.28 + 0.02, rz - 0.25);
    daggerGroup.rotation.y = 0.45;
    const bladeGeo = new THREE.ConeGeometry(0.04, 0.32, 4);
    bladeGeo.rotateX(Math.PI / 2);
    const blade = new THREE.Mesh(bladeGeo, this.ironMat);
    daggerGroup.add(blade);
    const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.14, 8), this.brassMat);
    hilt.position.set(0, 0, 0.20);
    hilt.rotation.x = Math.PI / 2;
    daggerGroup.add(hilt);
    this.group.add(daggerGroup);

    // Ring of 8 Black Tallow Candles around the Dais perimeter
    const candleWaxMat = new THREE.MeshStandardMaterial({ color: 0x1f1b1c, roughness: 0.65 });
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffaa44 });
    for (let c = 0; c < 8; c++) {
      const cAngle = (c * Math.PI * 2) / 8;
      const candleR = 1.05;
      const cx = rx + Math.cos(cAngle) * candleR;
      const cz = rz + Math.sin(cAngle) * candleR;

      const candleStick = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.18, 8), candleWaxMat);
      candleStick.position.set(cx, this.floorY + 0.28 + 0.09, cz);
      this.group.add(candleStick);

      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.04, 6), flameMat);
      flame.position.set(cx, this.floorY + 0.28 + 0.18 + 0.02, cz);
      this.group.add(flame);
    }

    // 5. Five Iron Ceremonial Braziers at the Five Star Points of the Muggu
    // Star points extend ~6.2m from center (0, -61.0)
    const starR = 6.2;
    for (let i = 0; i < 5; i++) {
      const angle = -Math.PI / 2 + (i * Math.PI * 2) / 5;
      const bx = rx + Math.cos(angle) * starR;
      const bz = rz + Math.sin(angle) * starR;

      const brazierGroup = new THREE.Group();
      brazierGroup.position.set(bx, this.floorY, bz);

      // Tripod legs
      for (let leg = 0; leg < 3; leg++) {
        const lAngle = (leg * Math.PI * 2) / 3;
        const legMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.95, 6), this.ironMat);
        legMesh.position.set(Math.cos(lAngle) * 0.25, 0.45, Math.sin(lAngle) * 0.25);
        legMesh.rotation.z = 0.12 * Math.cos(lAngle);
        legMesh.rotation.x = -0.12 * Math.sin(lAngle);
        brazierGroup.add(legMesh);
      }

      // Brazier Basin
      const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.24, 0.25, 12), this.ironMat);
      basin.position.set(0, 0.90, 0);
      brazierGroup.add(basin);

      // Glowing hot coals
      const coalMat = new THREE.MeshStandardMaterial({
        color: 0x860111,
        emissive: 0x7d1616,
        emissiveIntensity: 0.65,
        roughness: 0.9,
      });
      const coals = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.06, 12), coalMat);
      coals.position.set(0, 0.98, 0);
      brazierGroup.add(coals);

      // Weathered skull resting beside brazier
      if (i % 2 === 0) {
        const skullMarker = HumanSkeletonFactory.createSkull(0.85, true);
        skullMarker.position.set(0.45, 0.08, 0.25);
        skullMarker.rotation.y = Math.random() * Math.PI * 2;
        brazierGroup.add(skullMarker);
      }

      this.group.add(brazierGroup);

      // Collider for brazier
      const bBox = new THREE.Box3();
      bBox.setFromCenterAndSize(new THREE.Vector3(bx, this.floorY + 0.5, bz), new THREE.Vector3(0.9, 1.1, 0.9));
      this.colliders.push(bBox);

      // Flickering amber-red light for brazier
      const bLight = new THREE.PointLight(0xd95a28, 0.85, 9.0, 1.8);
      bLight.position.set(bx, this.floorY + 1.25, bz);
      (bLight as any).userData = { baseIntensity: 0.85 };
      this.group.add(bLight);
      this.flickeringLamps.push(bLight);
    }

    // 6. Bloodstone Ritual Stele against South Wall
    const steleGeo = new THREE.BoxGeometry(1.4, 2.8, 0.35);
    const stele = new THREE.Mesh(steleGeo, this.redSandstoneMat);
    stele.position.set(rx, this.floorY + 1.4, -53.4);
    this.group.add(stele);

    const steleBox = new THREE.Box3();
    steleBox.setFromCenterAndSize(stele.position, new THREE.Vector3(1.6, 2.9, 0.5));
    this.colliders.push(steleBox);

    // Carved star glyph on stele
    const steleStar = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.03, 8, 20), this.brassMat);
    steleStar.position.set(rx, this.floorY + 2.0, -53.2);
    this.group.add(steleStar);

    // 7. Dramatic Chamber Illumination
    // Powerful overhead central ritual light highlighting the entire star muggu
    const mugguSpot = new THREE.PointLight(0xde5b2c, 1.6, 20.0, 1.5);
    mugguSpot.position.set(rx, this.floorY + 3.4, rz);
    (mugguSpot as any).userData = { baseIntensity: 1.6 };
    this.group.add(mugguSpot);
    this.flickeringLamps.push(mugguSpot);

    // Blood red deep atmospheric glow at rear of sanctum
    const deepSanctumGlow = new THREE.PointLight(0x860111, 1.3, 14.0, 1.8);
    deepSanctumGlow.position.set(rx, this.floorY + 2.2, -54.5);
    (deepSanctumGlow as any).userData = { baseIntensity: 1.3 };
    this.group.add(deepSanctumGlow);
    this.flickeringLamps.push(deepSanctumGlow);

    // 8. Environmental Clues in Room 5
    this.basementClues.push({
      id: 'CLUE_BASEMENT_STAR_RITUAL_GRANTHAM',
      name: "TANTRA GRANTHAM OF DEVIL'S SANCTUM",
      room: 'Star Ritual Sanctum',
      position: new THREE.Vector3(rx, this.floorY + 0.65, rz),
      description: 'An ancient binding grantham of black palm leaves and beaten copper sheets: "Beneath the soil of this estate lies the unholy bindu. The Five-Pointed Muggu binds the ancient curse into the granite cellar."',
    });

    this.basementClues.push({
      id: 'CLUE_BASEMENT_RITUAL_STELE',
      name: 'BLOODSTONE OCCULT STELE',
      room: 'Star Ritual Sanctum',
      position: new THREE.Vector3(rx, this.floorY + 1.4, -53.6),
      description: 'A towering slab of red sandstone engraved with deep ritual runes and the star emblem. The inscriptions recite the names of those sealed within these catacombs in October 1923.',
    });
  }

  /**
   * Helper to build a wooden cargo crate with Box3 collider.
   */
  private buildCrate(pos: THREE.Vector3, w: number, h: number, d: number): void {
    const crateGeo = new THREE.BoxGeometry(w, h, d);
    const crate = new THREE.Mesh(crateGeo, this.darkWoodMat);
    crate.position.set(pos.x, pos.y + h / 2, pos.z);
    crate.castShadow = true;
    crate.receiveShadow = true;
    this.group.add(crate);

    const box = new THREE.Box3();
    box.setFromCenterAndSize(crate.position, new THREE.Vector3(w + 0.15, h + 0.1, d + 0.15));
    this.colliders.push(box);
  }

  /**
   * Subtle ambient hemisphere fill for the basement.
   */
  private setupBasementLighting(): void {
    // Soft bounce fill: sky = dark maroon/violet #241d24, ground = black void #120d10
    const basementHemi = new THREE.HemisphereLight(0x241d24, 0x120d10, 0.70);
    this.group.add(basementHemi);
  }

  /**
   * Updates lamp flicker animations.
   */
  public update(delta: number): void {
    const time = performance.now() * 0.001;
    for (let i = 0; i < this.flickeringLamps.length; i++) {
      const lamp = this.flickeringLamps[i];
      const base = (lamp as any).userData?.baseIntensity || 1.0;
      const flicker =
        Math.sin(time * 7.5 + i * 2.1) * 0.05 +
        Math.sin(time * 19.3 + i * 3.7) * 0.035;
      lamp.intensity = Math.max(0.4, base + flicker);
    }
  }

  public dispose(): void {
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        if (obj.geometry) obj.geometry.dispose();
      }
    });
  }
}
