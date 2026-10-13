import * as THREE from 'three';
import { horrorAudio } from '../audio/HorrorAudioManager';

export interface BungalowInteriorClue {
  id: string;
  name: string;
  room: string;
  position: THREE.Vector3;
  description: string;
  subtext: string;
  image?: string;
  handwritten?: boolean;
}

/**
 * Procedural Texture Generator for Bungalow Interior
 * Generates realistic colonial wood parquet, cracked plaster, damask wallpaper,
 * ornate rugs, burmese teak, cobwebs, and period illustrations.
 */
export class BungalowTextureGenerator {
  private static cache = new Map<string, THREE.CanvasTexture>();

  public static createFloorTexture(): THREE.CanvasTexture {
    if (this.cache.has('floor')) return this.cache.get('floor')!;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#2c180e';
    ctx.fillRect(0, 0, 512, 512);

    const plankCount = 14;
    const plankHeight = 512 / plankCount;

    for (let i = 0; i < plankCount; i++) {
      const y = i * plankHeight;
      const shadeOffset = (Math.random() - 0.5) * 25;
      const r = Math.min(255, Math.max(0, 48 + shadeOffset));
      const g = Math.min(255, Math.max(0, 26 + shadeOffset * 0.7));
      const b = Math.min(255, Math.max(0, 16 + shadeOffset * 0.5));
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(0, y, 512, plankHeight - 2);

      ctx.strokeStyle = 'rgba(18, 10, 6, 0.4)';
      ctx.lineWidth = 1.0;
      for (let j = 0; j < 25; j++) {
        const grainY = y + Math.random() * plankHeight;
        ctx.beginPath();
        ctx.moveTo(0, grainY);
        ctx.bezierCurveTo(
          150, grainY + (Math.random() - 0.5) * 6,
          350, grainY + (Math.random() - 0.5) * 6,
          512, grainY + (Math.random() - 0.5) * 8
        );
        ctx.stroke();
      }

      ctx.fillStyle = '#100804';
      ctx.fillRect(0, y + plankHeight - 2, 512, 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    this.cache.set('floor', texture);
    return texture;
  }

  public static createWallPlasterTexture(): THREE.CanvasTexture {
    if (this.cache.has('wall_plaster')) return this.cache.get('wall_plaster')!;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#7a7062';
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const rad = 2 + Math.random() * 8;
      const alpha = 0.04 + Math.random() * 0.08;
      ctx.fillStyle = Math.random() > 0.4 ? `rgba(45,35,25,${alpha})` : `rgba(220,210,195,${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = 'rgba(25, 18, 12, 0.7)';
    ctx.lineWidth = 1.2;
    for (let c = 0; c < 8; c++) {
      let cx = Math.random() * 512;
      let cy = Math.random() * 512;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      for (let s = 0; s < 8; s++) {
        cx += (Math.random() - 0.5) * 40;
        cy += (Math.random() - 0.3) * 30;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 2);
    this.cache.set('wall_plaster', texture);
    return texture;
  }

  public static createDamaskWallpaperTexture(): THREE.CanvasTexture {
    if (this.cache.has('wallpaper')) return this.cache.get('wallpaper')!;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#421a1d';
    ctx.fillRect(0, 0, 512, 512);

    ctx.fillStyle = 'rgba(180, 140, 75, 0.35)';
    ctx.strokeStyle = 'rgba(120, 90, 45, 0.5)';
    ctx.lineWidth = 1.5;

    const drawMotif = (ox: number, oy: number) => {
      ctx.save();
      ctx.translate(ox, oy);
      ctx.beginPath();
      ctx.moveTo(0, -50);
      ctx.bezierCurveTo(35, -35, 45, 15, 0, 50);
      ctx.bezierCurveTo(-45, 15, -35, -35, 0, -50);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    };

    drawMotif(128, 128);
    drawMotif(384, 128);
    drawMotif(256, 384);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 3);
    this.cache.set('wallpaper', texture);
    return texture;
  }

  public static createCarpetTexture(): THREE.CanvasTexture {
    if (this.cache.has('carpet')) return this.cache.get('carpet')!;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 320;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#541517';
    ctx.fillRect(0, 0, 512, 320);

    const border = 30;
    ctx.fillStyle = '#14273e';
    ctx.fillRect(border, border, 512 - border * 2, 320 - border * 2);

    ctx.fillStyle = '#6b191c';
    ctx.fillRect(border + 15, border + 15, 512 - (border + 15) * 2, 320 - (border + 15) * 2);

    ctx.fillStyle = '#b8903b';
    ctx.beginPath();
    ctx.ellipse(256, 160, 80, 50, 0, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('carpet', texture);
    return texture;
  }

  public static createWoodTexture(): THREE.CanvasTexture {
    if (this.cache.has('wood')) return this.cache.get('wood')!;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#3a2012';
    ctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 80; i++) {
      const y = Math.random() * 256;
      ctx.strokeStyle = Math.random() > 0.5 ? 'rgba(25, 12, 6, 0.3)' : 'rgba(80, 50, 30, 0.2)';
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y + (Math.random() - 0.5) * 10);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.set('wood', texture);
    return texture;
  }

  public static createSankarYaminiPhotoTexture(): THREE.CanvasTexture {
    if (this.cache.has('photo_sy')) return this.cache.get('photo_sy')!;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Aged vintage sepia parchment background
    ctx.fillStyle = '#7a644f';
    ctx.fillRect(0, 0, 512, 512);

    // Vignette
    const grad = ctx.createRadialGradient(256, 256, 120, 256, 256, 260);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(20,12,6,0.7)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Frame border
    ctx.strokeStyle = '#3d2817';
    ctx.lineWidth = 16;
    ctx.strokeRect(12, 12, 488, 488);

    // Two vintage figures: Sankar & young Yamini smiling
    // Sankar (standing left)
    ctx.fillStyle = '#2d1f14';
    ctx.beginPath();
    ctx.arc(195, 175, 42, 0, Math.PI * 2); // head
    ctx.fill();
    ctx.fillRect(150, 220, 90, 200); // torso

    // Yamini (sitting/standing right with books)
    ctx.beginPath();
    ctx.arc(315, 195, 38, 0, Math.PI * 2); // head
    ctx.fill();
    ctx.fillRect(275, 235, 80, 185); // torso

    // Books in hands
    ctx.fillStyle = '#8a5c32';
    ctx.fillRect(290, 310, 55, 35);

    // Scratches & age spots
    ctx.strokeStyle = 'rgba(230, 215, 195, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(80, 120);
    ctx.lineTo(430, 390);
    ctx.moveTo(350, 80);
    ctx.lineTo(120, 420);
    ctx.stroke();

    // Handwritten caption at the bottom
    ctx.fillStyle = '#f5ecd8';
    ctx.font = 'italic 20px "Cinzel", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('Sankar & Yamini — Kakinada 1984', 256, 465);

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('photo_sy', texture);
    return texture;
  }

  public static createMirrorSilhouetteTexture(): THREE.CanvasTexture {
    if (this.cache.has('mirror_sil')) return this.cache.get('mirror_sil')!;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Murky dark glass base
    ctx.fillStyle = '#141e24';
    ctx.fillRect(0, 0, 512, 1024);

    // Ghostly apparition standing behind
    ctx.fillStyle = '#05070a';
    ctx.beginPath();
    // Head
    ctx.arc(256, 320, 60, 0, Math.PI * 2);
    ctx.fill();
    // Elongated body and drooping arms
    ctx.beginPath();
    ctx.moveTo(256, 380);
    ctx.bezierCurveTo(120, 480, 80, 720, 90, 950);
    ctx.lineTo(422, 950);
    ctx.bezierCurveTo(432, 720, 392, 480, 256, 380);
    ctx.fill();

    // Piercing dim hollow eyes
    ctx.fillStyle = '#8bc3ff';
    ctx.beginPath();
    ctx.arc(236, 315, 4, 0, Math.PI * 2);
    ctx.arc(276, 315, 4, 0, Math.PI * 2);
    ctx.fill();

    // Fractured glass cracks overlay
    ctx.strokeStyle = 'rgba(200, 220, 240, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(256, 512);
    ctx.lineTo(120, 200);
    ctx.lineTo(50, 600);
    ctx.moveTo(256, 512);
    ctx.lineTo(440, 280);
    ctx.moveTo(256, 512);
    ctx.lineTo(380, 820);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('mirror_sil', texture);
    return texture;
  }

  public static createPorcelainDollTexture(): THREE.CanvasTexture {
    if (this.cache.has('doll')) return this.cache.get('doll')!;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#e8ded2';
    ctx.fillRect(0, 0, 256, 256);

    // Bonnet
    ctx.fillStyle = '#4a2529';
    ctx.beginPath();
    ctx.arc(128, 128, 90, Math.PI * 0.8, Math.PI * 2.2);
    ctx.fill();

    // Doll face
    ctx.fillStyle = '#f7eedf';
    ctx.beginPath();
    ctx.arc(128, 135, 65, 0, Math.PI * 2);
    ctx.fill();

    // Glassy doll eyes
    ctx.fillStyle = '#1c344d';
    ctx.beginPath();
    ctx.arc(105, 125, 12, 0, Math.PI * 2);
    ctx.arc(151, 125, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(108, 122, 4, 0, Math.PI * 2);
    ctx.arc(154, 122, 4, 0, Math.PI * 2);
    ctx.fill();

    // Cracked cheek lines
    ctx.strokeStyle = '#4a3324';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(151, 140);
    ctx.lineTo(170, 165);
    ctx.lineTo(162, 180);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('doll', texture);
    return texture;
  }

  public static createBathroomTileTexture(): THREE.CanvasTexture {
    if (this.cache.has('bath_tile')) return this.cache.get('bath_tile')!;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Aged off-white/cream ceramic tile base with grout lines
    ctx.fillStyle = '#22282c';
    ctx.fillRect(0, 0, 512, 512);

    const tileSize = 64;
    for (let x = 0; x < 512; x += tileSize) {
      for (let y = 0; y < 512; y += tileSize) {
        // Individual tile color subtle variation
        const shade = Math.floor((Math.random() - 0.5) * 16);
        const r = Math.min(255, Math.max(0, 182 + shade));
        const g = Math.min(255, Math.max(0, 188 + shade));
        const b = Math.min(255, Math.max(0, 184 + shade));
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);

        // Water stains / damp patina on tiles
        if (Math.random() > 0.6) {
          ctx.fillStyle = 'rgba(60, 68, 55, 0.14)';
          ctx.beginPath();
          ctx.arc(x + tileSize * 0.5, y + tileSize * 0.5, tileSize * 0.35, 0, Math.PI * 2);
          ctx.fill();
        }
        // Hairline cracks
        if (Math.random() > 0.8) {
          ctx.strokeStyle = 'rgba(40, 45, 42, 0.45)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x + 4, y + 8);
          ctx.lineTo(x + 28, y + 36);
          ctx.lineTo(x + 50, y + 48);
          ctx.stroke();
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    this.cache.set('bath_tile', texture);
    return texture;
  }

  public static createAgedLinenBedsheetTexture(): THREE.CanvasTexture {
    if (this.cache.has('aged_linen')) return this.cache.get('aged_linen')!;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Aged antique linen/ecru cloth base
    ctx.fillStyle = '#cfc4b2';
    ctx.fillRect(0, 0, 512, 512);

    // Cross-weave texture
    ctx.fillStyle = 'rgba(165, 150, 130, 0.25)';
    for (let i = 0; i < 512; i += 4) {
      ctx.fillRect(0, i, 512, 1);
      ctx.fillRect(i, 0, 1, 512);
    }

    // Faint water/age staining & dust smudges
    for (let s = 0; s < 12; s++) {
      const sx = Math.random() * 512;
      const sy = Math.random() * 512;
      const rad = 25 + Math.random() * 60;
      const grad = ctx.createRadialGradient(sx, sy, 5, sx, sy, rad);
      grad.addColorStop(0, 'rgba(110, 85, 60, 0.22)');
      grad.addColorStop(0.7, 'rgba(125, 105, 80, 0.10)');
      grad.addColorStop(1, 'rgba(140, 120, 95, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(sx, sy, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // Subtle wrinkles / fold creases
    ctx.strokeStyle = 'rgba(75, 60, 45, 0.28)';
    ctx.lineWidth = 1.8;
    for (let f = 0; f < 8; f++) {
      let fx = Math.random() * 512;
      let fy = Math.random() * 512;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      for (let p = 0; p < 5; p++) {
        fx += (Math.random() - 0.4) * 80;
        fy += (Math.random() - 0.3) * 60;
        ctx.lineTo(fx, fy);
      }
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.set('aged_linen', texture);
    return texture;
  }

  public static createVintageQuiltTexture(): THREE.CanvasTexture {
    if (this.cache.has('vintage_quilt')) return this.cache.get('vintage_quilt')!;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Faded deep burgundy / vintage wine base
    ctx.fillStyle = '#421a1f';
    ctx.fillRect(0, 0, 512, 512);

    // Diamond quilting stitch pattern
    const step = 64;
    ctx.strokeStyle = 'rgba(195, 155, 95, 0.35)';
    ctx.lineWidth = 1.5;
    for (let i = -512; i < 1024; i += step) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 512, 512);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(i, 512);
      ctx.lineTo(i + 512, 0);
      ctx.stroke();
    }

    // Stitch dots at crossings
    ctx.fillStyle = '#caa362';
    for (let x = 0; x < 512; x += step) {
      for (let y = 0; y < 512; y += step) {
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Aging vignette & dust
    const grad = ctx.createRadialGradient(256, 256, 100, 256, 256, 260);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(15, 8, 10, 0.65)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.set('vintage_quilt', texture);
    return texture;
  }

  public static createAgedCurtainTexture(): THREE.CanvasTexture {
    if (this.cache.has('aged_curtain')) return this.cache.get('aged_curtain')!;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Heavy dusty colonial velvet folds (vertical gradient stripes)
    ctx.fillStyle = '#3a161b';
    ctx.fillRect(0, 0, 256, 512);

    for (let x = 0; x < 256; x += 32) {
      const foldGrad = ctx.createLinearGradient(x, 0, x + 32, 0);
      foldGrad.addColorStop(0, 'rgba(18, 6, 8, 0.7)');
      foldGrad.addColorStop(0.5, 'rgba(92, 38, 45, 0.55)');
      foldGrad.addColorStop(1, 'rgba(18, 6, 8, 0.7)');
      ctx.fillStyle = foldGrad;
      ctx.fillRect(x, 0, 32, 512);
    }

    // Bottom fringe trim
    ctx.fillStyle = '#8b6f3b';
    ctx.fillRect(0, 485, 256, 27);
    for (let f = 0; f < 256; f += 4) {
      ctx.strokeStyle = '#5a4622';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(f, 485);
      ctx.lineTo(f, 512);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('aged_curtain', texture);
    return texture;
  }

  public static createAntiqueMirrorTexture(): THREE.CanvasTexture {
    if (this.cache.has('antique_mirror')) return this.cache.get('antique_mirror')!;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Cloudy dark silver glass base
    ctx.fillStyle = '#1c252d';
    ctx.fillRect(0, 0, 512, 512);

    // Soft reflective silver gradient center
    const refl = ctx.createRadialGradient(256, 256, 40, 256, 256, 240);
    refl.addColorStop(0, 'rgba(180, 195, 210, 0.35)');
    refl.addColorStop(0.7, 'rgba(90, 110, 125, 0.20)');
    refl.addColorStop(1, 'rgba(30, 40, 48, 0.9)');
    ctx.fillStyle = refl;
    ctx.fillRect(0, 0, 512, 512);

    // Tarnished oxidization around edges (mercury degradation)
    for (let i = 0; i < 400; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 180 + Math.random() * 80;
      const x = 256 + Math.cos(angle) * dist;
      const y = 256 + Math.sin(angle) * dist;
      ctx.fillStyle = Math.random() > 0.4 ? 'rgba(25, 20, 16, 0.85)' : 'rgba(55, 45, 35, 0.7)';
      ctx.beginPath();
      ctx.arc(x, y, 4 + Math.random() * 14, 0, Math.PI * 2);
      ctx.fill();
    }

    // Hairline scratches
    ctx.strokeStyle = 'rgba(180, 195, 205, 0.4)';
    ctx.lineWidth = 1;
    for (let c = 0; c < 12; c++) {
      const sx = Math.random() * 512;
      const sy = Math.random() * 512;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + (Math.random() - 0.5) * 80, sy + (Math.random() - 0.5) * 80);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('antique_mirror', texture);
    return texture;
  }
}

/**
 * Two-Story Abandoned Indian Colonial Family Bungalow Interior
 */
export class BungalowInterior {
  public group: THREE.Group;
  public colliders: THREE.Box3[] = [];
  public interiorClues: BungalowInteriorClue[] = [];
  public flickeringLamps: THREE.PointLight[] = [];

  // Dynamic Horror Objects
  public clockPendulum: THREE.Mesh | null = null;
  public isClockStopped = false;
  public hauntedChair: THREE.Group | null = null;
  public isChairMoved = false;
  public storageMirrorMesh: THREE.Mesh | null = null;
  public mirrorNormalMat!: THREE.MeshStandardMaterial;
  public mirrorSilhouetteMat!: THREE.MeshBasicMaterial;
  public isMirrorApparitionTriggered = false;
  public isUpstairsFootstepsTriggered = false;
  public dustParticles: THREE.Points | null = null;

  private ambienceTimer = 0;
  private nextAmbienceSoundTime = 14.0;

  // Materials
  private woodFloorMat: THREE.MeshStandardMaterial;
  private upperWoodFloorMat: THREE.MeshStandardMaterial;
  private wallpaperMat: THREE.MeshStandardMaterial;
  private studyWallMat: THREE.MeshStandardMaterial;
  private diningWallMat: THREE.MeshStandardMaterial;
  private bedroomWallMat: THREE.MeshStandardMaterial;
  private ceilingMat: THREE.MeshStandardMaterial;
  private darkTeakMat: THREE.MeshStandardMaterial;
  private oldFabricMat: THREE.MeshStandardMaterial;
  private wornCarpetMat: THREE.MeshStandardMaterial;
  private brassMat: THREE.MeshStandardMaterial;
  private dustyGlassMat: THREE.MeshStandardMaterial;
  private paperMat: THREE.MeshStandardMaterial;
  private bathTileMat: THREE.MeshStandardMaterial;
  private castIronMat: THREE.MeshStandardMaterial;
  private porcelainMat: THREE.MeshStandardMaterial;
  private cardboardMat: THREE.MeshStandardMaterial;
  private rustedMat: THREE.MeshStandardMaterial;
  private ceramicPlateMat: THREE.MeshStandardMaterial;
  private burlapMat: THREE.MeshStandardMaterial;
  private copperMat: THREE.MeshStandardMaterial;
  private agedLinenMat: THREE.MeshStandardMaterial;
  private vintageQuiltMat: THREE.MeshStandardMaterial;
  private agedCurtainMat: THREE.MeshStandardMaterial;
  private antiqueMirrorMat: THREE.MeshStandardMaterial;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    this.group.position.set(0, 0, 0);

    // 1. Procedural materials with real canvas textures
    const floorTex = BungalowTextureGenerator.createFloorTexture();
    const plasterTex = BungalowTextureGenerator.createWallPlasterTexture();
    const wallpaperTex = BungalowTextureGenerator.createDamaskWallpaperTexture();
    const carpetTex = BungalowTextureGenerator.createCarpetTexture();
    const woodTex = BungalowTextureGenerator.createWoodTexture();
    const tileTex = BungalowTextureGenerator.createBathroomTileTexture();
    const linenTex = BungalowTextureGenerator.createAgedLinenBedsheetTexture();
    const quiltTex = BungalowTextureGenerator.createVintageQuiltTexture();
    const curtainTex = BungalowTextureGenerator.createAgedCurtainTexture();
    const mirrorTex = BungalowTextureGenerator.createAntiqueMirrorTexture();

    this.agedLinenMat = new THREE.MeshStandardMaterial({
      map: linenTex,
      roughness: 0.88,
      metalness: 0.02,
    });

    this.vintageQuiltMat = new THREE.MeshStandardMaterial({
      map: quiltTex,
      roughness: 0.84,
      metalness: 0.04,
    });

    this.agedCurtainMat = new THREE.MeshStandardMaterial({
      map: curtainTex,
      roughness: 0.88,
      metalness: 0.05,
    });

    this.antiqueMirrorMat = new THREE.MeshStandardMaterial({
      map: mirrorTex,
      roughness: 0.22,
      metalness: 0.72,
    });

    this.woodFloorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.65,
      metalness: 0.1,
    });

    this.upperWoodFloorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.7,
      metalness: 0.08,
    });

    this.wallpaperMat = new THREE.MeshStandardMaterial({
      map: wallpaperTex,
      roughness: 0.82,
      metalness: 0.08,
    });

    this.studyWallMat = new THREE.MeshStandardMaterial({
      map: plasterTex,
      roughness: 0.88,
      metalness: 0.04,
    });

    this.diningWallMat = new THREE.MeshStandardMaterial({
      map: wallpaperTex,
      roughness: 0.85,
      metalness: 0.06,
    });

    this.bedroomWallMat = new THREE.MeshStandardMaterial({
      map: wallpaperTex,
      roughness: 0.82,
      metalness: 0.08,
    });

    this.ceilingMat = new THREE.MeshStandardMaterial({
      color: 0x4a4338,
      roughness: 0.95,
      metalness: 0.0,
    });

    this.darkTeakMat = new THREE.MeshStandardMaterial({
      map: woodTex,
      color: 0x3d2417,
      roughness: 0.65,
      metalness: 0.12,
    });

    this.oldFabricMat = new THREE.MeshStandardMaterial({
      color: 0x4f1a1d,
      roughness: 0.92,
      metalness: 0.0,
    });

    this.wornCarpetMat = new THREE.MeshStandardMaterial({
      map: carpetTex,
      roughness: 0.92,
      metalness: 0.0,
    });

    this.brassMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.45,
      metalness: 0.75,
    });

    this.dustyGlassMat = new THREE.MeshStandardMaterial({
      color: 0x30363d,
      roughness: 0.35,
      metalness: 0.4,
      transparent: true,
      opacity: 0.3,
    });

    this.paperMat = new THREE.MeshStandardMaterial({
      color: 0xf5eedc,
      roughness: 0.9,
      metalness: 0.0,
    });

    this.bathTileMat = new THREE.MeshStandardMaterial({
      map: tileTex,
      roughness: 0.32,
      metalness: 0.15,
    });

    this.castIronMat = new THREE.MeshStandardMaterial({
      color: 0x1f2124,
      roughness: 0.78,
      metalness: 0.65,
    });

    this.porcelainMat = new THREE.MeshStandardMaterial({
      color: 0xededeb,
      roughness: 0.25,
      metalness: 0.1,
    });

    this.cardboardMat = new THREE.MeshStandardMaterial({
      color: 0x8a6f4e,
      roughness: 0.94,
      metalness: 0.0,
    });

    this.rustedMat = new THREE.MeshStandardMaterial({
      color: 0x543222,
      roughness: 0.92,
      metalness: 0.35,
    });

    this.ceramicPlateMat = new THREE.MeshStandardMaterial({
      color: 0xdcd8d0,
      roughness: 0.42,
      metalness: 0.05,
    });

    this.burlapMat = new THREE.MeshStandardMaterial({
      color: 0x6a5842,
      roughness: 0.96,
      metalness: 0.0,
    });

    this.copperMat = new THREE.MeshStandardMaterial({
      color: 0x9c5936,
      roughness: 0.52,
      metalness: 0.75,
    });

    this.mirrorNormalMat = new THREE.MeshStandardMaterial({
      color: 0x768088,
      metalness: 0.92,
      roughness: 0.14,
    });

    this.mirrorSilhouetteMat = new THREE.MeshBasicMaterial({
      map: BungalowTextureGenerator.createMirrorSilhouetteTexture(),
    });

    this.buildGroundFloor();
    this.buildGrandStaircase();
    this.buildSecondFloor();
    this.buildAtmosphericLighting();
    this.setupStoryClues();
    this.buildDustParticles();

    scene.add(this.group);
  }

  private buildGroundFloor(): void {
    const floorY = 1.45;
    const ceilY = 5.45;
    const wallH = ceilY - floorY;

    // 1. Ground floor parquet floor
    const floorGeo = new THREE.BoxGeometry(25.0, 0.2, 20.0);
    const floorMesh = new THREE.Mesh(floorGeo, this.woodFloorMat);
    floorMesh.position.set(0, floorY - 0.1, -68.5);
    floorMesh.receiveShadow = true;
    this.group.add(floorMesh);

    // Decorative runner carpet
    const runnerGeo = new THREE.BoxGeometry(2.4, 0.02, 12.0);
    const runner = new THREE.Mesh(runnerGeo, this.wornCarpetMat);
    runner.position.set(0, floorY + 0.01, -65.0);
    this.group.add(runner);

    // 2. Ceilings
    const ceilFront = new THREE.Mesh(new THREE.BoxGeometry(25.0, 0.2, 12.0), this.ceilingMat);
    ceilFront.position.set(0, ceilY + 0.1, -64.5);
    this.group.add(ceilFront);

    const ceilLeft = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.2, 8.0), this.ceilingMat);
    ceilLeft.position.set(-7.25, ceilY + 0.1, -74.5);
    this.group.add(ceilLeft);

    const ceilRight = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.2, 8.0), this.ceilingMat);
    ceilRight.position.set(7.25, ceilY + 0.1, -74.5);
    this.group.add(ceilRight);

    // 3. Perimeter walls
    this.createWall(new THREE.Vector3(0, (floorY + ceilY) / 2, -78.5), new THREE.Vector3(25.0, wallH, 0.3), this.wallpaperMat);
    this.createWall(new THREE.Vector3(-12.5, (floorY + ceilY) / 2, -68.5), new THREE.Vector3(0.3, wallH, 20.0), this.wallpaperMat);
    this.createWall(new THREE.Vector3(12.5, (floorY + ceilY) / 2, -68.5), new THREE.Vector3(0.3, wallH, 20.0), this.wallpaperMat);

    // Front facade interior wall with open center door (strictly behind exterior facade, 0 bleed-through)
    this.createWall(new THREE.Vector3(-7.0, (floorY + ceilY) / 2, -59.08), new THREE.Vector3(11.0, wallH, 0.20), this.wallpaperMat);
    this.createWall(new THREE.Vector3(7.0, (floorY + ceilY) / 2, -59.08), new THREE.Vector3(11.0, wallH, 0.20), this.wallpaperMat);
    // Interior doorway header above open doorway
    this.createWall(new THREE.Vector3(0, ceilY - 0.4, -59.08), new THREE.Vector3(3.0, 0.8, 0.20), this.wallpaperMat, false);

    // Clean architectural casing on inside face of entrance doorway (flanking at x = +-1.44, center 100% open)
    const entCasingH = wallH - 0.8;
    const entCasingGeo = new THREE.BoxGeometry(0.12, entCasingH, 0.06);
    const entCasingL = new THREE.Mesh(entCasingGeo, this.darkTeakMat);
    entCasingL.position.set(-1.44, floorY + entCasingH / 2, -58.98);
    this.group.add(entCasingL);

    const entCasingR = new THREE.Mesh(entCasingGeo, this.darkTeakMat);
    entCasingR.position.set(1.44, floorY + entCasingH / 2, -58.98);
    this.group.add(entCasingR);

    const entCasingTopGeo = new THREE.BoxGeometry(3.0, 0.12, 0.06);
    const entCasingTop = new THREE.Mesh(entCasingTopGeo, this.darkTeakMat);
    entCasingTop.position.set(0, floorY + entCasingH + 0.06, -58.98);
    this.group.add(entCasingTop);

    // 4. Hallway dividing walls with clear, wide 2.0m open doorways
    // Left hallway wall (x = -3.0):
    // Doorway 1 (Family Living Room): z in [-62.5, -64.5] (clear 2.0m opening)
    this.createWall(new THREE.Vector3(-3.0, (floorY + ceilY) / 2, -60.725), new THREE.Vector3(0.25, wallH, 3.55), this.wallpaperMat);
    this.createWall(new THREE.Vector3(-3.0, ceilY - 0.4, -63.5), new THREE.Vector3(0.25, 0.8, 2.0), this.wallpaperMat, false);
    this.createWall(new THREE.Vector3(-3.0, (floorY + ceilY) / 2, -66.25), new THREE.Vector3(0.25, wallH, 3.50), this.wallpaperMat);
    // Doorway 2 (Study / Library): z in [-71.0, -73.0] (clear 2.0m opening)
    this.createWall(new THREE.Vector3(-3.0, (floorY + ceilY) / 2, -69.50), new THREE.Vector3(0.25, wallH, 3.00), this.studyWallMat);
    this.createWall(new THREE.Vector3(-3.0, ceilY - 0.4, -72.0), new THREE.Vector3(0.25, 0.8, 2.0), this.studyWallMat, false);
    this.createWall(new THREE.Vector3(-3.0, (floorY + ceilY) / 2, -75.75), new THREE.Vector3(0.25, wallH, 5.50), this.studyWallMat);

    // Right hallway wall (x = 3.0):
    // Doorway 1 (Dining Room): z in [-62.5, -64.5] (clear 2.0m opening)
    this.createWall(new THREE.Vector3(3.0, (floorY + ceilY) / 2, -60.725), new THREE.Vector3(0.25, wallH, 3.55), this.wallpaperMat);
    this.createWall(new THREE.Vector3(3.0, ceilY - 0.4, -63.5), new THREE.Vector3(0.25, 0.8, 2.0), this.wallpaperMat, false);
    this.createWall(new THREE.Vector3(3.0, (floorY + ceilY) / 2, -66.25), new THREE.Vector3(0.25, wallH, 3.50), this.wallpaperMat);
    // Doorway 2 (Storage / Utility Room): z in [-71.0, -73.0] (clear 2.0m opening)
    this.createWall(new THREE.Vector3(3.0, (floorY + ceilY) / 2, -69.50), new THREE.Vector3(0.25, wallH, 3.00), this.diningWallMat);
    this.createWall(new THREE.Vector3(3.0, ceilY - 0.4, -72.0), new THREE.Vector3(0.25, 0.8, 2.0), this.diningWallMat, false);
    this.createWall(new THREE.Vector3(3.0, (floorY + ceilY) / 2, -75.75), new THREE.Vector3(0.25, wallH, 5.50), this.diningWallMat);

    // Architectural doorway casing trims
    this.createDoorwayFrame(new THREE.Vector3(-3.0, floorY, -63.5), 2.0, wallH - 0.8);
    this.createDoorwayFrame(new THREE.Vector3(-3.0, floorY, -72.0), 2.0, wallH - 0.8);
    this.createDoorwayFrame(new THREE.Vector3(3.0, floorY, -63.5), 2.0, wallH - 0.8);
    this.createDoorwayFrame(new THREE.Vector3(3.0, floorY, -72.0), 2.0, wallH - 0.8);

    // 5. Room dividers
    this.createWall(new THREE.Vector3(-7.75, (floorY + ceilY) / 2, -68.0), new THREE.Vector3(9.5, wallH, 0.25), this.studyWallMat);
    this.createWall(new THREE.Vector3(7.75, (floorY + ceilY) / 2, -68.0), new THREE.Vector3(9.5, wallH, 0.25), this.diningWallMat);

    // 6. Populate ground floor rooms
    this.populateLeftRoom1_LivingRoom(floorY);
    this.populateLeftRoom2_StorageWasteRoom(floorY);
    this.populateRightRoom1_KitchenDining(floorY);
    this.populateRightRoom2_Bathroom(floorY);
    this.populateCentralEntranceHall(floorY);
  }

  /**
   * LEFT ROOM 1: Family Living Room
   * Requirements:
   * - Old TV (Vintage CRT TV with antennas & dials)
   * - TV Stand (Wooden console against west wall)
   * - Sofa directly opposite TV (Facing west towards the TV)
   * - Small table between TV and sofa (With Framed Family Photo)
   * - Optional old chair if space permits
   */
  private populateLeftRoom1_LivingRoom(floorY: number): void {
    const rx = -7.5;
    const rz = -63.5;

    // Fireplace hearth along north portion of outer wall
    const fpMesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.2, 2.4), this.wallpaperMat);
    fpMesh.position.set(-12.1, floorY + 1.1, rz + 2.4);
    this.group.add(fpMesh);
    this.addBoxCollider(fpMesh.position, new THREE.Vector3(1.0, 2.5, 2.6));

    // 1. TV Stand - placed against west wall (x = -11.65, z = -63.5)
    const tvStandGeo = new THREE.BoxGeometry(0.7, 0.75, 1.8);
    const tvStand = new THREE.Mesh(tvStandGeo, this.darkTeakMat);
    tvStand.position.set(-11.65, floorY + 0.375, rz);
    this.group.add(tvStand);
    this.addBoxCollider(tvStand.position, new THREE.Vector3(0.85, 0.9, 1.95));

    // Lower shelf of TV stand with old cassette tapes
    const lowerShelfGeo = new THREE.BoxGeometry(0.55, 0.04, 1.6);
    const lowerShelf = new THREE.Mesh(lowerShelfGeo, this.darkTeakMat);
    lowerShelf.position.set(-11.65, floorY + 0.22, rz);
    this.group.add(lowerShelf);

    // 2. Old TV - vintage 1980s wood-cabinet CRT television on the stand
    const tvGroup = new THREE.Group();
    tvGroup.position.set(-11.6, floorY + 0.75, rz);

    // Main wooden cabinet
    const tvCabinetGeo = new THREE.BoxGeometry(0.65, 0.68, 1.1);
    const tvCabinet = new THREE.Mesh(tvCabinetGeo, this.darkTeakMat);
    tvCabinet.position.set(0, 0.34, 0);
    tvGroup.add(tvCabinet);

    // CRT Screen bezel and curved screen facing into the room (+X direction towards sofa)
    const crtScreenGeo = new THREE.BoxGeometry(0.05, 0.52, 0.72);
    const crtScreenMat = new THREE.MeshStandardMaterial({
      color: 0x181c20,
      roughness: 0.15,
      metalness: 0.85,
    });
    const crtScreen = new THREE.Mesh(crtScreenGeo, crtScreenMat);
    crtScreen.position.set(0.31, 0.34, -0.12);
    tvGroup.add(crtScreen);

    // Control panel to the right of the screen
    const dial1 = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.03, 10), this.brassMat);
    dial1.rotation.z = Math.PI / 2;
    dial1.position.set(0.32, 0.46, 0.34);
    tvGroup.add(dial1);

    const dial2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 10), this.brassMat);
    dial2.rotation.z = Math.PI / 2;
    dial2.position.set(0.32, 0.34, 0.34);
    tvGroup.add(dial2);

    // Speaker slats on TV front
    for (let s = 0; s < 4; s++) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.015, 0.22), this.castIronMat);
      slat.position.set(0.32, 0.14 + s * 0.035, 0.34);
      tvGroup.add(slat);
    }

    // Metallic rabbit-ear antennae on top of TV (V-shaped)
    const antL = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.55, 6), this.brassMat);
    antL.position.set(0, 0.68 + 0.25, -0.15);
    antL.rotation.z = -0.35;
    antL.rotation.x = -0.4;
    tvGroup.add(antL);

    const antR = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.55, 6), this.brassMat);
    antR.position.set(0, 0.68 + 0.25, 0.15);
    antR.rotation.z = -0.35;
    antR.rotation.x = 0.4;
    tvGroup.add(antR);

    this.group.add(tvGroup);

    // 3. Small Table between TV and sofa
    const smallTableGeo = new THREE.BoxGeometry(1.1, 0.45, 0.85);
    const smallTable = new THREE.Mesh(smallTableGeo, this.darkTeakMat);
    smallTable.position.set(-8.7, floorY + 0.225, rz);
    this.group.add(smallTable);
    this.addBoxCollider(smallTable.position, new THREE.Vector3(1.2, 0.6, 1.0));

    // Framed Family Photograph of Sankar & Yamini on the small table
    const frameGeo = new THREE.BoxGeometry(0.38, 0.38, 0.05);
    const frame = new THREE.Mesh(frameGeo, this.brassMat);
    frame.position.set(-8.7, floorY + 0.45 + 0.2, rz);
    frame.rotation.x = -0.2;
    this.group.add(frame);

    const photoMat = new THREE.MeshBasicMaterial({
      map: BungalowTextureGenerator.createSankarYaminiPhotoTexture(),
    });
    const photo = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.32), photoMat);
    photo.position.set(-8.7, floorY + 0.45 + 0.2, rz + 0.026);
    photo.rotation.x = -0.2;
    this.group.add(photo);

    // 4. Vintage Sofa - directly opposite the TV, oriented facing WEST towards the TV
    const sofaGroup = new THREE.Group();
    sofaGroup.position.set(-5.8, floorY, rz);

    // Sofa base and seat cushion
    const sofaSeat = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.42, 2.3), this.oldFabricMat);
    sofaSeat.position.set(0, 0.21, 0);
    sofaGroup.add(sofaSeat);

    // Sofa backrest (on east side, so seat faces west directly towards TV)
    const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.75, 2.3), this.oldFabricMat);
    sofaBack.position.set(0.42, 0.48, 0);
    sofaGroup.add(sofaBack);

    // Sofa left and right armrests
    const armGeo = new THREE.BoxGeometry(1.05, 0.32, 0.22);
    const armL = new THREE.Mesh(armGeo, this.oldFabricMat);
    armL.position.set(0, 0.42, -1.04);
    sofaGroup.add(armL);

    const armR = new THREE.Mesh(armGeo, this.oldFabricMat);
    armR.position.set(0, 0.42, 1.04);
    sofaGroup.add(armR);

    this.group.add(sofaGroup);
    this.addBoxCollider(new THREE.Vector3(-5.8, floorY + 0.45, rz), new THREE.Vector3(1.2, 0.9, 2.5));

    // 5. Optional Old Armchair placed to the side (north side of small table)
    const armChair = this.createChairGroup(new THREE.Vector3(-8.7, floorY, rz + 1.8), Math.PI);
    this.group.add(armChair);

    // Vintage worn floor runner under seating area
    const livingRugGeo = new THREE.BoxGeometry(5.2, 0.015, 3.4);
    const livingRug = new THREE.Mesh(livingRugGeo, this.wornCarpetMat);
    livingRug.position.set(-8.6, floorY + 0.01, rz);
    this.group.add(livingRug);
  }

  /**
   * LEFT ROOM 2: Old Storage / Waste Room
   * Requirements:
   * - Old storage/waste room
   * - Broken furniture (tilted broken wardrobe, overturned chair, broken table)
   * - Old boxes (stacked cardboard boxes, shipping crates)
   * - Waste items (dusty bottle crates, scrap pipes, broken crockery)
   * - Rusty containers (rusted metal oil drum / canister)
   * - Old tools (rusted hand saw, wrench, crowbar on crate)
   * - Torn cloth (draped burlap sheet)
   * - Damaged wooden pieces (splintered lumber planks leaning on wall)
   * - Old household objects (vintage bicycle wheel, rolled carpet, broken tube radio)
   */
  private populateLeftRoom2_StorageWasteRoom(floorY: number): void {
    const rx = -7.5;
    const rz = -73.0;

    // 1. Broken Furniture
    // Broken tall wardrobe leaning against west wall with door hanging askew
    const wardrobeGroup = new THREE.Group();
    wardrobeGroup.position.set(-11.7, floorY, rz - 2.8);
    wardrobeGroup.rotation.z = 0.06; // tilted drunkenly

    const wFrame = new THREE.Mesh(new THREE.BoxGeometry(0.85, 2.8, 1.6), this.darkTeakMat);
    wFrame.position.set(0, 1.4, 0);
    wardrobeGroup.add(wFrame);

    // Hanging broken door
    const doorGeo = new THREE.BoxGeometry(0.04, 2.5, 0.72);
    const wDoor = new THREE.Mesh(doorGeo, this.darkTeakMat);
    wDoor.position.set(0.44, 1.25, -0.38);
    wDoor.rotation.y = 0.45; // ajar
    wardrobeGroup.add(wDoor);

    this.group.add(wardrobeGroup);
    this.addBoxCollider(new THREE.Vector3(-11.7, floorY + 1.4, rz - 2.8), new THREE.Vector3(1.0, 2.9, 1.8));

    // Overturned dining chair tipped on its side with one broken leg detached
    const chairGroup = new THREE.Group();
    chairGroup.position.set(-7.2, floorY + 0.25, rz + 1.6);
    chairGroup.rotation.x = Math.PI / 2 + 0.15;
    chairGroup.rotation.z = 0.35;

    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.5), this.darkTeakMat);
    chairGroup.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.04), this.darkTeakMat);
    back.position.set(0, 0.28, -0.23);
    chairGroup.add(back);
    // 3 remaining legs
    const legGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.45);
    const l1 = new THREE.Mesh(legGeo, this.darkTeakMat);
    l1.position.set(-0.2, -0.23, -0.2);
    chairGroup.add(l1);
    const l2 = new THREE.Mesh(legGeo, this.darkTeakMat);
    l2.position.set(0.2, -0.23, -0.2);
    chairGroup.add(l2);
    const l3 = new THREE.Mesh(legGeo, this.darkTeakMat);
    l3.position.set(0.2, -0.23, 0.2);
    chairGroup.add(l3);
    this.group.add(chairGroup);

    // Broken wooden table with cracked top
    const brokenTable = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.65, 0.95), this.darkTeakMat);
    brokenTable.position.set(-9.8, floorY + 0.32, rz - 0.4);
    brokenTable.rotation.z = -0.07;
    this.group.add(brokenTable);
    this.addBoxCollider(brokenTable.position, new THREE.Vector3(1.7, 0.8, 1.1));

    // Torn cloth draped across the broken table
    const cloth = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.02, 0.65), this.burlapMat);
    cloth.position.set(-9.8, floorY + 0.65 + 0.01, rz - 0.4);
    cloth.rotation.y = 0.3;
    this.group.add(cloth);

    // 2. Old Boxes
    // Stack of weathered cardboard storage boxes tied with twine
    const box1 = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.65, 0.85), this.cardboardMat);
    box1.position.set(-11.5, floorY + 0.325, rz + 1.8);
    this.group.add(box1);

    const box2 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.55, 0.7), this.cardboardMat);
    box2.position.set(-11.5, floorY + 0.65 + 0.275, rz + 1.8);
    box2.rotation.y = 0.25;
    this.group.add(box2);
    this.addBoxCollider(new THREE.Vector3(-11.5, floorY + 0.6, rz + 1.8), new THREE.Vector3(1.0, 1.25, 1.0));

    // Heavy wooden shipping crates with stenciled slats
    const crate1 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.8, 0.9), this.darkTeakMat);
    crate1.position.set(-5.4, floorY + 0.4, rz - 3.2);
    this.group.add(crate1);
    this.addBoxCollider(crate1.position, new THREE.Vector3(1.2, 0.9, 1.0));

    // Old Tools resting on top of the shipping crate (hand saw, wrench, crowbar)
    const handSaw = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.03), this.rustedMat);
    handSaw.position.set(-5.4, floorY + 0.8 + 0.02, rz - 3.2);
    handSaw.rotation.y = 0.4;
    this.group.add(handSaw);

    const wrench = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.04, 0.03), this.castIronMat);
    wrench.position.set(-5.2, floorY + 0.8 + 0.02, rz - 3.0);
    wrench.rotation.y = -0.3;
    this.group.add(wrench);

    const crowbar = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.65, 6), this.rustedMat);
    crowbar.position.set(-5.5, floorY + 0.8 + 0.02, rz - 3.35);
    crowbar.rotation.z = Math.PI / 2;
    crowbar.rotation.y = 0.8;
    this.group.add(crowbar);

    // Overturned wooden crate holding Sankar's Torn Diary (story clue!)
    const diaryCrate = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.55, 0.7), this.darkTeakMat);
    diaryCrate.position.set(-7.5, floorY + 0.275, rz);
    diaryCrate.rotation.y = 0.18;
    this.group.add(diaryCrate);
    this.addBoxCollider(diaryCrate.position, new THREE.Vector3(0.9, 0.65, 0.8));

    // Sankar's Torn Diary on the crate
    const diary = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.04, 0.42), this.paperMat);
    diary.position.set(-7.5, floorY + 0.55 + 0.02, rz);
    diary.rotation.y = 0.28;
    this.group.add(diary);

    // 3. Waste Items & Rusty Containers
    // Rusty metal oil drum / canister in corner
    const oilDrum = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.85, 12), this.rustedMat);
    oilDrum.position.set(-11.2, floorY + 0.425, rz - 4.2);
    this.group.add(oilDrum);
    this.addBoxCollider(oilDrum.position, new THREE.Vector3(0.65, 0.9, 0.65));

    // Wooden crate of cobwebbed glass bottles
    const bottleCrate = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.35, 0.5), this.darkTeakMat);
    bottleCrate.position.set(-10.2, floorY + 0.175, rz + 3.2);
    this.group.add(bottleCrate);
    for (let b = 0; b < 6; b++) {
      const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.28, 8), this.dustyGlassMat);
      bottle.position.set(-10.35 + (b % 3) * 0.15, floorY + 0.26, rz + 3.1 + Math.floor(b / 3) * 0.16);
      this.group.add(bottle);
    }

    // Discarded rusty iron pipes leaning against corner
    for (let p = 0; p < 3; p++) {
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.2, 8), this.castIronMat);
      pipe.position.set(-12.1 + p * 0.15, floorY + 1.0, -78.1 + p * 0.12);
      pipe.rotation.x = 0.18 + p * 0.06;
      pipe.rotation.z = -0.15;
      this.group.add(pipe);
    }

    // Broken crockery / ceramic shards on floor
    for (let c = 0; c < 4; c++) {
      const shard = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.14), this.porcelainMat);
      shard.position.set(-6.5 + (c % 2) * 0.25, floorY + 0.01, rz + 0.8 + c * 0.15);
      shard.rotation.y = c * 0.7;
      this.group.add(shard);
    }

    // Damaged wooden pieces / lumber boards leaning against north wall
    for (let pl = 0; pl < 3; pl++) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.8, 0.22), this.darkTeakMat);
      plank.position.set(-9.2 + pl * 0.22, floorY + 0.85, -68.3);
      plank.rotation.x = -0.16;
      plank.rotation.z = 0.04 * pl;
      this.group.add(plank);
    }

    // 4. Old Household Objects
    // Vintage bicycle wheel with spokes leaning against partition wall
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(-3.4, floorY + 0.38, rz + 1.8);
    wheelGroup.rotation.y = Math.PI / 2;
    wheelGroup.rotation.x = 0.18; // leaning against wall

    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.025, 8, 20), this.castIronMat);
    wheelGroup.add(rim);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.08, 10), this.brassMat);
    hub.rotation.x = Math.PI / 2;
    wheelGroup.add(hub);
    this.group.add(wheelGroup);

    // Rolled-up dusty Persian carpet standing in corner
    const rolledCarpet = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 2.4, 12), this.wornCarpetMat);
    rolledCarpet.position.set(-3.4, floorY + 1.15, -78.1);
    rolledCarpet.rotation.x = -0.12;
    rolledCarpet.rotation.z = 0.08;
    this.group.add(rolledCarpet);

    // Vintage broken tube radio with tuning dial on top of small crate
    const radioCrate = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, 0.45), this.cardboardMat);
    radioCrate.position.set(-5.8, floorY + 0.225, rz - 1.6);
    this.group.add(radioCrate);

    const radioGeo = new THREE.BoxGeometry(0.24, 0.28, 0.42);
    const radio = new THREE.Mesh(radioGeo, this.darkTeakMat);
    radio.position.set(-5.8, floorY + 0.45 + 0.14, rz - 1.6);
    this.group.add(radio);

    const dial = new THREE.Mesh(new THREE.CircleGeometry(0.06, 12), this.brassMat);
    dial.position.set(-5.67, floorY + 0.45 + 0.18, rz - 1.6);
    dial.rotation.y = Math.PI / 2;
    this.group.add(dial);
  }

  /**
   * RIGHT ROOM 1: Old Kitchen & Dining Room
   * Requirements:
   * - Old kitchen
   * - Old wooden kitchen cabinets
   * - Old cooking stove
   * - Old sink
   * - Rusted taps
   * - Old metal vessels & cooking pots
   * - Old plates
   * - Old bottles and jars
   * - Aged shelves
   * - Old wooden dining table
   * - 4–6 old dining chairs
   * - A few old plates/cups on the dining table
   * - Dust, slight rust, subtle stains
   */
  private populateRightRoom1_KitchenDining(floorY: number): void {
    const rx = 6.8;
    const rz = -63.5;

    // ================= 1. KITCHEN SECTION (Along East Wall) =================
    // Old Cabinets: Base Counter Cabinets along east wall
    const counterGeo = new THREE.BoxGeometry(0.85, 0.88, 3.2);
    const counter = new THREE.Mesh(counterGeo, this.darkTeakMat);
    counter.position.set(11.8, floorY + 0.44, rz);
    this.group.add(counter);
    this.addBoxCollider(counter.position, new THREE.Vector3(1.0, 1.0, 3.4));

    // Cabinet doors detailing
    for (let d = 0; d < 3; d++) {
      const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.72, 0.85), this.darkTeakMat);
      doorPanel.position.set(11.36, floorY + 0.42, rz - 1.0 + d * 1.0);
      this.group.add(doorPanel);

      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), this.brassMat);
      knob.position.set(11.34, floorY + 0.58, rz - 1.0 + d * 1.0 + 0.32);
      this.group.add(knob);
    }

    // Wall-Mounted Upper Cabinets
    const upperCabGeo = new THREE.BoxGeometry(0.55, 0.95, 3.0);
    const upperCab = new THREE.Mesh(upperCabGeo, this.darkTeakMat);
    upperCab.position.set(11.95, floorY + 2.4, rz);
    this.group.add(upperCab);

    // Old Sink: Deep White Farmhouse Porcelain Sink set into counter
    const sinkGeo = new THREE.BoxGeometry(0.72, 0.42, 0.88);
    const sink = new THREE.Mesh(sinkGeo, this.porcelainMat);
    sink.position.set(11.75, floorY + 0.7, rz - 0.9);
    this.group.add(sink);

    // Rusted Taps & Gooseneck Spout
    const faucetPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.28, 8), this.rustedMat);
    faucetPipe.position.set(11.45, floorY + 1.05, rz - 0.9);
    this.group.add(faucetPipe);

    const spout = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.02, 6, 10, Math.PI * 0.7), this.rustedMat);
    spout.position.set(11.42, floorY + 1.18, rz - 0.9);
    spout.rotation.z = Math.PI / 2;
    this.group.add(spout);

    // Rusted tap cross-handles
    const tapH1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.02), this.rustedMat);
    tapH1.position.set(11.45, floorY + 0.98, rz - 0.78);
    this.group.add(tapH1);

    const tapH2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.02), this.rustedMat);
    tapH2.position.set(11.45, floorY + 0.98, rz - 1.02);
    this.group.add(tapH2);

    // Old Stove: Heavy Vintage Cast-Iron Cooking Stove
    const stoveGroup = new THREE.Group();
    stoveGroup.position.set(11.7, floorY, rz + 2.4);

    // Main cast-iron stove body
    const stoveBody = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.95, 1.15), this.castIronMat);
    stoveBody.position.set(0, 0.475, 0);
    stoveGroup.add(stoveBody);

    // 4 Raised Burner Rings on cooktop
    for (let br = 0; br < 4; br++) {
      const burner = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.02, 6, 12), this.castIronMat);
      burner.rotation.x = Math.PI / 2;
      burner.position.set(
        -0.18 + (br % 2) * 0.36,
        0.96,
        -0.28 + Math.floor(br / 2) * 0.56
      );
      stoveGroup.add(burner);
    }

    // Stove oven door with handle
    const ovenHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.45), this.rustedMat);
    ovenHandle.rotation.x = Math.PI / 2;
    ovenHandle.position.set(-0.44, 0.65, 0);
    stoveGroup.add(ovenHandle);

    // Stove vertical flue chimney pipe rising to ceiling
    const chimneyPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.2, 12), this.castIronMat);
    chimneyPipe.position.set(0.15, 2.5, 0.25);
    stoveGroup.add(chimneyPipe);

    this.group.add(stoveGroup);
    this.addBoxCollider(new THREE.Vector3(11.7, floorY + 0.6, rz + 2.4), new THREE.Vector3(1.0, 1.2, 1.3));

    // Old Utensils & Metal Vessels
    // Skillet on stove burner
    const skillet = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.06, 12), this.castIronMat);
    skillet.position.set(11.52, floorY + 0.99, rz + 2.12);
    this.group.add(skillet);

    const skilletHandle = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, 0.035), this.castIronMat);
    skilletHandle.position.set(11.36, floorY + 1.0, rz + 2.12);
    this.group.add(skilletHandle);

    // Copper cooking pot on counter
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.22, 12), this.copperMat);
    pot.position.set(11.7, floorY + 0.88 + 0.11, rz + 0.6);
    this.group.add(pot);

    // Vintage Tea Kettle on counter
    const kettle = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), this.castIronMat);
    kettle.position.set(11.65, floorY + 0.88 + 0.12, rz - 0.1);
    this.group.add(kettle);

    // Old Indian Brass Metal Vessel (Handi / Urli) on counter
    const vessel = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.18, 12), this.brassMat);
    vessel.position.set(11.65, floorY + 0.88 + 0.09, rz + 0.18);
    this.group.add(vessel);

    // Stack of 3 old ceramic plates on the kitchen counter
    for (let sp = 0; sp < 3; sp++) {
      const cPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.02, 12), this.ceramicPlateMat);
      cPlate.position.set(11.65, floorY + 0.88 + 0.01 + sp * 0.025, rz - 0.42);
      this.group.add(cPlate);
    }

    // Utensil hanging wall rack with ladle and spoon
    const rackBar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.85), this.darkTeakMat);
    rackBar.position.set(11.45, floorY + 1.7, rz + 1.2);
    this.group.add(rackBar);

    const ladle = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.32), this.brassMat);
    ladle.position.set(11.42, floorY + 1.5, rz + 1.05);
    this.group.add(ladle);

    // Aged Open Shelves on North Wall holding old bottles and jars
    const shelfGeo = new THREE.BoxGeometry(2.4, 0.04, 0.32);
    const shelf1 = new THREE.Mesh(shelfGeo, this.darkTeakMat);
    shelf1.position.set(7.5, floorY + 2.0, -59.2);
    this.group.add(shelf1);

    const shelf2 = new THREE.Mesh(shelfGeo, this.darkTeakMat);
    shelf2.position.set(7.5, floorY + 2.6, -59.2);
    this.group.add(shelf2);

    // Old Bottles and Jars on shelves
    for (let j = 0; j < 5; j++) {
      const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.18, 8), this.dustyGlassMat);
      jar.position.set(6.6 + j * 0.4, floorY + 2.1, -59.2);
      this.group.add(jar);

      const tin = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.16, 8), this.rustedMat);
      tin.position.set(6.8 + j * 0.35, floorY + 2.7, -59.2);
      this.group.add(tin);
    }

    // ================= 2. DINING SECTION (Center of Room) =================
    // Dining Table: Sturdy colonial dark teak dining table
    const tableGeo = new THREE.BoxGeometry(1.8, 0.85, 3.6);
    const table = new THREE.Mesh(tableGeo, this.darkTeakMat);
    table.position.set(rx, floorY + 0.425, rz);
    this.group.add(table);
    this.addBoxCollider(table.position, new THREE.Vector3(2.0, 1.0, 4.0));

    // A few old plates and cups on the dining table
    const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.02, 12), this.ceramicPlateMat);
    p1.position.set(rx - 0.45, floorY + 0.85 + 0.01, rz - 0.8);
    this.group.add(p1);

    const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.02, 12), this.ceramicPlateMat);
    p2.position.set(rx + 0.45, floorY + 0.85 + 0.01, rz + 0.6);
    this.group.add(p2);

    const cup1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.1, 8), this.ceramicPlateMat);
    cup1.position.set(rx - 0.52, floorY + 0.85 + 0.05, rz - 0.55);
    this.group.add(cup1);

    const cup2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.1, 8), this.rustedMat);
    cup2.position.set(rx + 0.52, floorY + 0.85 + 0.05, rz + 0.85);
    this.group.add(cup2);

    // 6 Old Dining Chairs around the table (3 on left, 3 on right, leaves clear walking aisles)
    for (let c = -1.1; c <= 1.1; c += 1.1) {
      const chairL = this.createChairGroup(new THREE.Vector3(rx - 1.25, floorY, rz + c), Math.PI / 2);
      this.group.add(chairL);

      const chairR = this.createChairGroup(new THREE.Vector3(rx + 1.25, floorY, rz + c), -Math.PI / 2);
      this.group.add(chairR);

      // Middle right chair as haunted chair that slides back
      if (Math.abs(c) < 0.2) {
        this.hauntedChair = chairR;
      }
    }

    // Antique Grandfather Clock in northeast corner
    const clockGroup = new THREE.Group();
    const clockBody = new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.6, 0.5), this.darkTeakMat);
    clockBody.position.set(0, 1.3, 0);
    clockGroup.add(clockBody);

    // Pendulum inside glass
    const pend = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 12), this.brassMat);
    pend.position.set(0, 0.95, 0.24);
    clockGroup.add(pend);
    this.clockPendulum = pend;

    // Clock face frozen at 3:17
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.2, 16), this.brassMat);
    face.position.set(0, 2.05, 0.26);
    clockGroup.add(face);

    clockGroup.position.set(12.0, floorY, -59.5);
    this.group.add(clockGroup);
    this.addBoxCollider(new THREE.Vector3(12.0, floorY + 1.3, -59.5), new THREE.Vector3(0.9, 2.7, 0.7));
  }

  /**
   * RIGHT ROOM 2: Complete Old Bathroom
   * Requirements:
   * - Complete old bathroom
   * - Toilet (vintage porcelain bowl, tank, wooden seat)
   * - Wash basin (pedestal porcelain sink with rusted taps)
   * - Mirror (wall-mounted mirror above basin with apparition trigger)
   * - Old shower (overhead vintage shower rose in bathing area)
   * - Old taps & Old pipes (exposed rusted copper and cast-iron water/waste pipes)
   * - Old bathroom fixtures & clawfoot bathtub
   * - Aged/cracked tiles (tiled floor plane & wall wainscot)
   * - Water stains, rust, dust, accessories
   */
  private populateRightRoom2_Bathroom(floorY: number): void {
    const rx = 7.5;
    const rz = -73.0;

    // 1. Aged Tiles
    // Dedicated bathroom floor tile plane spanning entire bathroom (x in [3.0, 12.5], z in [-68.0, -78.5])
    const bathFloorGeo = new THREE.PlaneGeometry(9.4, 10.4);
    const bathFloor = new THREE.Mesh(bathFloorGeo, this.bathTileMat);
    bathFloor.rotation.x = -Math.PI / 2;
    bathFloor.position.set(7.75, floorY + 0.005, -73.25);
    bathFloor.receiveShadow = true;
    this.group.add(bathFloor);

    // Ceramic tile wainscot strip along walls up to 1.8m height
    const wainscotEast = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.8, 10.2), this.bathTileMat);
    wainscotEast.position.set(12.32, floorY + 0.9, -73.25);
    this.group.add(wainscotEast);

    const wainscotSouth = new THREE.Mesh(new THREE.BoxGeometry(9.2, 1.8, 0.04), this.bathTileMat);
    wainscotSouth.position.set(7.75, floorY + 0.9, -78.32);
    this.group.add(wainscotSouth);

    // 2. Complete Vintage Porcelain Toilet (in south alcove at x = 5.4, z = -77.4)
    const toiletGroup = new THREE.Group();
    toiletGroup.position.set(5.4, floorY, -77.4);

    // Toilet base and bowl
    const bowlGeo = new THREE.BoxGeometry(0.48, 0.42, 0.65);
    const bowl = new THREE.Mesh(bowlGeo, this.porcelainMat);
    bowl.position.set(0, 0.21, 0);
    toiletGroup.add(bowl);

    // Wooden ring seat and lid
    const seatGeo = new THREE.BoxGeometry(0.46, 0.04, 0.58);
    const seat = new THREE.Mesh(seatGeo, this.darkTeakMat);
    seat.position.set(0, 0.44, 0.04);
    toiletGroup.add(seat);

    // High porcelain water cistern tank mounted behind on the wall
    const cisternGeo = new THREE.BoxGeometry(0.55, 0.45, 0.28);
    const cistern = new THREE.Mesh(cisternGeo, this.porcelainMat);
    cistern.position.set(0, 1.45, -0.22);
    toiletGroup.add(cistern);

    // Vertical flush pipe connecting cistern to bowl
    const flushPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.95, 8), this.rustedMat);
    flushPipe.position.set(0, 0.92, -0.22);
    toiletGroup.add(flushPipe);

    // Flush lever
    const flushLever = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.03), this.brassMat);
    flushLever.position.set(0.3, 1.55, -0.15);
    toiletGroup.add(flushLever);

    this.group.add(toiletGroup);
    this.addBoxCollider(new THREE.Vector3(5.4, floorY + 0.7, -77.4), new THREE.Vector3(0.7, 1.6, 0.85));

    // 3. Wash Basin: Vintage Porcelain Pedestal Sink (against east wall at x = 11.6, z = -73.0)
    const basinGroup = new THREE.Group();
    basinGroup.position.set(11.6, floorY, rz);

    // Fluted pedestal column
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.82, 12), this.porcelainMat);
    pedestal.position.set(0, 0.41, 0);
    basinGroup.add(pedestal);

    // Deep rectangular porcelain basin
    const basinTop = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.22, 0.95), this.porcelainMat);
    basinTop.position.set(0, 0.82, 0);
    basinGroup.add(basinTop);

    // Dual vintage turn taps (Hot & Cold) in rusted brass/iron
    const tapL = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.12, 8), this.rustedMat);
    tapL.position.set(0.18, 0.96, -0.22);
    basinGroup.add(tapL);

    const tapR = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.12, 8), this.rustedMat);
    tapR.position.set(0.18, 0.96, 0.22);
    basinGroup.add(tapR);

    // Curved rusted water spout
    const bSpout = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.14, 8), this.rustedMat);
    bSpout.rotation.z = -0.4;
    bSpout.position.set(0.08, 0.98, 0);
    basinGroup.add(bSpout);

    this.group.add(basinGroup);
    this.addBoxCollider(new THREE.Vector3(11.6, floorY + 0.5, rz), new THREE.Vector3(0.8, 1.1, 1.1));

    // 4. Mirror: Wall-Mounted Antique Bathroom Mirror directly above the wash basin
    const mirrorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.25, 0.95), this.darkTeakMat);
    mirrorFrame.position.set(12.18, floorY + 1.65, rz);
    this.group.add(mirrorFrame);

    const mirrorMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 1.05), this.mirrorNormalMat);
    mirrorMesh.rotation.y = -Math.PI / 2;
    mirrorMesh.position.set(12.1, floorY + 1.65, rz);
    this.group.add(mirrorMesh);
    this.storageMirrorMesh = mirrorMesh;

    // Tattered warning note pinned beside the bathroom mirror
    const note = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.35, 0.28), this.paperMat);
    note.position.set(12.15, floorY + 1.65, rz - 0.7);
    this.group.add(note);

    // Aged Medicine Cabinet on wall beside mirror
    const medCab = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.65, 0.45), this.darkTeakMat);
    medCab.position.set(12.18, floorY + 1.65, rz + 0.8);
    this.group.add(medCab);

    // 5. Old Bathtub: Vintage Roll-Top Clawfoot Bathtub along south wall
    const tubGroup = new THREE.Group();
    tubGroup.position.set(9.0, floorY, -76.8);

    const tubBody = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.55, 0.75), this.porcelainMat);
    tubBody.position.set(0, 0.38, 0);
    tubGroup.add(tubBody);

    // 4 Cast-iron claw feet
    const footGeo = new THREE.BoxGeometry(0.08, 0.12, 0.08);
    for (let fx of [-0.75, 0.75]) {
      for (let fz of [-0.32, 0.32]) {
        const foot = new THREE.Mesh(footGeo, this.castIronMat);
        foot.position.set(fx, 0.06, fz);
        tubGroup.add(foot);
      }
    }

    // Tub rusted taps
    const tubTap = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.22, 8), this.rustedMat);
    tubTap.position.set(0.85, 0.72, 0);
    tubGroup.add(tubTap);

    this.group.add(tubGroup);
    this.addBoxCollider(new THREE.Vector3(9.0, floorY + 0.4, -76.8), new THREE.Vector3(1.85, 0.8, 0.9));

    // 6. Old Bathroom Fixtures: Shower Area, Towel Rail & Soap Dish
    // Vintage brass towel rail on wall
    const towelRail = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.85), this.brassMat);
    towelRail.rotation.x = Math.PI / 2;
    towelRail.position.set(12.15, floorY + 1.25, rz + 1.4);
    this.group.add(towelRail);

    // Wall soap dish
    const soapDish = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.18), this.porcelainMat);
    soapDish.position.set(12.15, floorY + 1.15, rz + 0.65);
    this.group.add(soapDish);

    // Overhead Vintage Shower Rose in southeast corner
    const showerPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1.6, 8), this.brassMat);
    showerPipe.position.set(11.8, floorY + 2.2, -77.2);
    this.group.add(showerPipe);

    const showerRose = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.08, 12), this.brassMat);
    showerRose.rotation.x = Math.PI;
    showerRose.position.set(11.6, floorY + 2.9, -77.2);
    this.group.add(showerRose);

    // 7. Old Pipes: Exposed copper and rusted iron water & waste pipes running along the wall
    // Vertical water feed pipe
    const waterFeedPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 3.4, 8), this.castIronMat);
    waterFeedPipe.position.set(12.2, floorY + 1.7, -74.8);
    this.group.add(waterFeedPipe);

    // Horizontal distribution pipe along wainscot
    const horizPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 4.2, 8), this.rustedMat);
    horizPipe.rotation.x = Math.PI / 2;
    horizPipe.position.set(12.18, floorY + 0.35, -74.5);
    this.group.add(horizPipe);

    // Heavy soil drain stack pipe in the corner
    const soilPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 4.0, 10), this.castIronMat);
    soilPipe.position.set(12.2, floorY + 2.0, -78.1);
    this.group.add(soilPipe);
  }

  private populateCentralEntranceHall(floorY: number): void {
    // Grand console table - placed neatly against wall segment A, fully clear of doorway
    const table = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.85, 1.8), this.darkTeakMat);
    table.position.set(-2.75, floorY + 0.425, -60.4);
    this.group.add(table);
    this.addBoxCollider(table.position, new THREE.Vector3(0.45, 1.0, 1.6));

    // Vintage candelabra
    const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.1, 0.05, 12), this.brassMat);
    dish.position.set(-2.75, floorY + 0.88, -60.4);
    this.group.add(dish);
  }

  private buildGrandStaircase(): void {
    const startZ = -68.5;
    const endZ = -75.5;
    const startY = 1.45;
    const endY = 5.45;
    const stepCount = 20;
    const stepWidth = 2.6;
    const dz = (endZ - startZ) / stepCount;
    const dy = (endY - startY) / stepCount;

    const treadGeo = new THREE.BoxGeometry(stepWidth, 0.08, Math.abs(dz) * 1.15);
    const riserGeo = new THREE.BoxGeometry(stepWidth, dy * 1.05, 0.04);

    for (let s = 0; s < stepCount; s++) {
      const curY = startY + (s + 0.5) * dy;
      const curZ = startZ + (s + 0.5) * dz;

      const tread = new THREE.Mesh(treadGeo, this.darkTeakMat);
      tread.position.set(0, curY + dy * 0.5, curZ);
      tread.receiveShadow = true;
      this.group.add(tread);

      const riser = new THREE.Mesh(riserGeo, this.darkTeakMat);
      riser.position.set(0, curY, curZ + Math.abs(dz) * 0.5);
      this.group.add(riser);

      if (s % 2 === 0) {
        const spinGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.95);
        const spinL = new THREE.Mesh(spinGeo, this.darkTeakMat);
        spinL.position.set(-1.25, curY + dy * 0.5 + 0.48, curZ);
        this.group.add(spinL);

        const spinR = new THREE.Mesh(spinGeo, this.darkTeakMat);
        spinR.position.set(1.25, curY + dy * 0.5 + 0.48, curZ);
        this.group.add(spinR);
      }
    }

    const railLength = Math.sqrt(Math.pow(endZ - startZ, 2) + Math.pow(endY - startY, 2));
    const railAngle = Math.atan2(endY - startY, Math.abs(endZ - startZ));
    const railGeo = new THREE.BoxGeometry(0.08, 0.08, railLength);

    const railL = new THREE.Mesh(railGeo, this.darkTeakMat);
    railL.position.set(-1.25, (startY + endY) / 2 + 0.95, (startZ + endZ) / 2);
    railL.rotation.x = railAngle;
    this.group.add(railL);

    const railR = new THREE.Mesh(railGeo, this.darkTeakMat);
    railR.position.set(1.25, (startY + endY) / 2 + 0.95, (startZ + endZ) / 2);
    railR.rotation.x = railAngle;
    this.group.add(railR);

    // Colliders strictly along the balustrade sides to prevent falling off the staircase
    const colLength = Math.abs(endZ - startZ);
    this.addBoxCollider(new THREE.Vector3(-1.35, (startY + endY) / 2 + 0.5, (startZ + endZ) / 2), new THREE.Vector3(0.15, endY - startY + 1.2, colLength));
    this.addBoxCollider(new THREE.Vector3(1.35, (startY + endY) / 2 + 0.5, (startZ + endZ) / 2), new THREE.Vector3(0.15, endY - startY + 1.2, colLength));
  }

  private buildSecondFloor(): void {
    const floorY = 5.45;
    const ceilY = 9.25;
    const wallH = ceilY - floorY;

    // Second floor upper roof ceiling (covers entire upper footprint)
    const upperCeil = new THREE.Mesh(new THREE.BoxGeometry(25.0, 0.2, 20.0), this.ceilingMat);
    upperCeil.position.set(0, ceilY + 0.1, -68.5);
    this.group.add(upperCeil);

    // Central landing floors
    // 1. Front landing / gallery overlooking ground floor foyer (z in [-58.95, -68.5])
    const landing = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.2, 9.55), this.upperWoodFloorMat);
    landing.position.set(0, floorY - 0.1, -63.725);
    landing.receiveShadow = true;
    this.group.add(landing);

    // 2. Top landing / platform at the top of the grand staircase (z in [-75.5, -78.5])
    const topPlatform = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.2, 3.0), this.upperWoodFloorMat);
    topPlatform.position.set(0, floorY - 0.1, -77.0);
    topPlatform.receiveShadow = true;
    this.group.add(topPlatform);

    // 3. Side gallery walkways connecting top platform to front landing along both sides of stairwell
    const lGalleryFloor = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.2, 7.0), this.upperWoodFloorMat);
    lGalleryFloor.position.set(-2.15, floorY - 0.1, -72.0);
    lGalleryFloor.receiveShadow = true;
    this.group.add(lGalleryFloor);

    const rGalleryFloor = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.2, 7.0), this.upperWoodFloorMat);
    rGalleryFloor.position.set(2.15, floorY - 0.1, -72.0);
    rGalleryFloor.receiveShadow = true;
    this.group.add(rGalleryFloor);

    // Wing floors (Left & Right master bedrooms)
    const lFloor = new THREE.Mesh(new THREE.BoxGeometry(9.5, 0.2, 19.55), this.upperWoodFloorMat);
    lFloor.position.set(-7.75, floorY - 0.1, -68.725);
    lFloor.receiveShadow = true;
    this.group.add(lFloor);

    const rFloor = new THREE.Mesh(new THREE.BoxGeometry(9.5, 0.2, 19.55), this.upperWoodFloorMat);
    rFloor.position.set(7.75, floorY - 0.1, -68.725);
    rFloor.receiveShadow = true;
    this.group.add(rFloor);

    // Perimeter walls
    this.createWall(new THREE.Vector3(0, (floorY + ceilY) / 2, -78.5), new THREE.Vector3(25.0, wallH, 0.3), this.wallpaperMat);
    this.createWall(new THREE.Vector3(-12.5, (floorY + ceilY) / 2, -68.725), new THREE.Vector3(0.3, wallH, 19.55), this.bedroomWallMat);
    this.createWall(new THREE.Vector3(12.5, (floorY + ceilY) / 2, -68.725), new THREE.Vector3(0.3, wallH, 19.55), this.bedroomWallMat);
    this.createWall(new THREE.Vector3(0, (floorY + ceilY) / 2, -58.95), new THREE.Vector3(25.0, wallH, 0.3), this.wallpaperMat);

    // Dividing walls separating Central Landing from the two Master Bedrooms:
    // Left hallway wall (x = -3.0):
    // Continuous solid wall from front up to doorway entrance at z = -74.9
    this.createWall(new THREE.Vector3(-3.0, (floorY + ceilY) / 2, -66.925), new THREE.Vector3(0.25, wallH, 15.95), this.bedroomWallMat);
    // Wall lintel above the 1.8m doorway opening (z in [-74.9, -76.7], leaves clear 2.75m vertical opening)
    this.createWall(new THREE.Vector3(-3.0, ceilY - 0.525, -75.8), new THREE.Vector3(0.25, 1.05, 1.8), this.bedroomWallMat, false);
    // Wall segment behind doorway from z = -76.7 to back perimeter wall z = -78.5
    this.createWall(new THREE.Vector3(-3.0, (floorY + ceilY) / 2, -77.6), new THREE.Vector3(0.25, wallH, 1.8), this.bedroomWallMat);

    // Right hallway wall (x = +3.0):
    // Continuous solid wall from front up to doorway entrance at z = -74.9
    this.createWall(new THREE.Vector3(3.0, (floorY + ceilY) / 2, -66.925), new THREE.Vector3(0.25, wallH, 15.95), this.bedroomWallMat);
    // Wall lintel above the 1.8m doorway opening
    this.createWall(new THREE.Vector3(3.0, ceilY - 0.525, -75.8), new THREE.Vector3(0.25, 1.05, 1.8), this.bedroomWallMat, false);
    // Wall segment behind doorway from z = -76.7 to back perimeter wall z = -78.5
    this.createWall(new THREE.Vector3(3.0, (floorY + ceilY) / 2, -77.6), new THREE.Vector3(0.25, wallH, 1.8), this.bedroomWallMat);

    // Dedicated Entrance Doors for each Master Bedroom (one door each, properly aligned)
    this.createBedroomDoor(new THREE.Vector3(-3.0, floorY, -75.8), 'left');
    this.createBedroomDoor(new THREE.Vector3(3.0, floorY, -75.8), 'right');

    // Balustrades around the stairwell opening (open at top of stairs z = -75.5)
    this.createBalustrade(new THREE.Vector3(-1.3, floorY + 0.5, -68.5), new THREE.Vector3(1.3, floorY + 0.5, -68.5));
    this.createBalustrade(new THREE.Vector3(-1.3, floorY + 0.5, -68.5), new THREE.Vector3(-1.3, floorY + 0.5, -75.5));
    this.createBalustrade(new THREE.Vector3(1.3, floorY + 0.5, -68.5), new THREE.Vector3(1.3, floorY + 0.5, -75.5));

    // Central Landing atmosphere and architectural decor
    this.setupCentralLandingFeatures(floorY);

    // Populate Left & Right Master Bedrooms
    this.populateSecondFloorLeft_MasterBedroom(floorY);
    this.populateSecondFloorRight_MasterBedroom(floorY);
  }

  private createBedroomDoor(pos: THREE.Vector3, side: 'left' | 'right'): void {
    // Door posts on left and right sides of the 1.8m opening
    const postGeo = new THREE.BoxGeometry(0.28, 2.75, 0.12);
    const postL = new THREE.Mesh(postGeo, this.darkTeakMat);
    postL.position.set(pos.x, pos.y + 1.375, pos.z - 0.9);
    this.group.add(postL);

    const postR = new THREE.Mesh(postGeo, this.darkTeakMat);
    postR.position.set(pos.x, pos.y + 1.375, pos.z + 0.9);
    this.group.add(postR);

    // Top decorative header lintel
    const headerGeo = new THREE.BoxGeometry(0.30, 0.14, 2.04);
    const header = new THREE.Mesh(headerGeo, this.darkTeakMat);
    header.position.set(pos.x, pos.y + 2.75 - 0.07, pos.z);
    this.group.add(header);

    // Molded architrave crown trim
    const crownGeo = new THREE.BoxGeometry(0.34, 0.08, 2.14);
    const crown = new THREE.Mesh(crownGeo, this.darkTeakMat);
    crown.position.set(pos.x, pos.y + 2.79, pos.z);
    this.group.add(crown);

    // Vintage colonial 4-panel wooden door leaf swung open flat against the inside bedroom wall
    // Positioned inside the room resting flush along the dividing wall so doorway is 100% clear
    const doorLeafGeo = new THREE.BoxGeometry(0.06, 2.65, 0.88);
    const doorLeaf = new THREE.Mesh(doorLeafGeo, this.darkTeakMat);
    const doorX = side === 'left' ? pos.x - 0.16 : pos.x + 0.16;
    doorLeaf.position.set(doorX, pos.y + 1.325, pos.z - 0.44);
    this.group.add(doorLeaf);

    // 4 molded recessed door panels
    const panelGeo = new THREE.BoxGeometry(0.075, 0.52, 0.32);
    const offsetsZ = [-0.22, 0.22];
    const offsetsY = [pos.y + 0.75, pos.y + 1.75];
    for (const py of offsetsY) {
      for (const pz of offsetsZ) {
        const pMesh = new THREE.Mesh(panelGeo, this.darkTeakMat);
        pMesh.position.set(doorX, py, pos.z - 0.44 + pz);
        this.group.add(pMesh);
      }
    }

    // Antique brass doorknob & escutcheon plate
    const knobGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.09, 8);
    const knob = new THREE.Mesh(knobGeo, this.brassMat);
    knob.rotation.z = Math.PI / 2;
    knob.position.set(doorX, pos.y + 1.25, pos.z - 0.44 + 0.35);
    this.group.add(knob);
  }

  private setupCentralLandingFeatures(floorY: number): void {
    // Back wall feature: Antique stained-glass transom window letting in moonlight
    const windowFrame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 0.08), this.darkTeakMat);
    windowFrame.position.set(0, floorY + 2.5, -78.4);
    this.group.add(windowFrame);

    const windowGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(2.2, 1.2),
      new THREE.MeshStandardMaterial({
        color: 0x5a7088,
        roughness: 0.15,
        metalness: 0.85,
        transparent: true,
        opacity: 0.65,
      })
    );
    windowGlass.position.set(0, floorY + 2.5, -78.35);
    this.group.add(windowGlass);

    // Vintage hall settee / bench resting against the back landing wall
    const benchGroup = new THREE.Group();
    const benchSeat = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.48), this.darkTeakMat);
    benchSeat.position.set(0, 0.45, 0);
    benchGroup.add(benchSeat);

    const benchBack = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.55, 0.06), this.darkTeakMat);
    benchBack.position.set(0, 0.72, -0.21);
    benchGroup.add(benchBack);

    // Bench legs
    const legGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.45, 8);
    const bOffsets: [number, number][] = [[-0.82, -0.18], [0.82, -0.18], [-0.82, 0.18], [0.82, 0.18]];
    for (const [bx, bz] of bOffsets) {
      const leg = new THREE.Mesh(legGeo, this.darkTeakMat);
      leg.position.set(bx, 0.225, bz);
      benchGroup.add(leg);
    }
    benchGroup.position.set(0, floorY, -78.1);
    this.group.add(benchGroup);
    this.addBoxCollider(new THREE.Vector3(0, floorY + 0.45, -78.1), new THREE.Vector3(1.9, 0.9, 0.5));

    // Vintage wall sconce lantern on the back wall
    const sconceLamp = new THREE.PointLight(0xf5a242, 1.4, 9.0, 1.8);
    sconceLamp.position.set(0, floorY + 2.2, -78.1);
    this.group.add(sconceLamp);
    this.flickeringLamps.push(sconceLamp);

    // Front landing overlook: Antique carved console table with candelabra
    const consoleTable = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.78, 0.42), this.darkTeakMat);
    consoleTable.position.set(0, floorY + 0.39, -59.3);
    this.group.add(consoleTable);
    this.addBoxCollider(consoleTable.position, new THREE.Vector3(1.5, 0.85, 0.45));

    // Brass candelabra on console table
    const candelabra = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.1, 0.35, 8), this.brassMat);
    candelabra.position.set(0, floorY + 0.78 + 0.175, -59.3);
    this.group.add(candelabra);

    // Hanging pendant lantern above front landing
    const frontPendant = new THREE.PointLight(0xffbe6b, 1.5, 10.0, 1.8);
    frontPendant.position.set(0, floorY + 2.8, -63.5);
    this.group.add(frontPendant);
    this.flickeringLamps.push(frontPendant);
  }

  private createOldCurtains(pos: THREE.Vector3, width: number, height: number, facingX = false): void {
    const rodGeo = new THREE.CylinderGeometry(0.02, 0.02, width, 8);
    const rod = new THREE.Mesh(rodGeo, this.brassMat);
    rod.position.set(pos.x, pos.y + height / 2 + 0.05, pos.z);
    if (!facingX) rod.rotation.z = Math.PI / 2;
    else rod.rotation.x = Math.PI / 2;
    this.group.add(rod);

    // Left drape
    const drapeGeo = new THREE.BoxGeometry(facingX ? 0.08 : width * 0.32, height, facingX ? width * 0.32 : 0.08);
    const drapeL = new THREE.Mesh(drapeGeo, this.agedCurtainMat);
    drapeL.position.set(
      facingX ? pos.x : pos.x - width * 0.34,
      pos.y,
      facingX ? pos.z - width * 0.34 : pos.z
    );
    this.group.add(drapeL);

    // Right drape
    const drapeR = new THREE.Mesh(drapeGeo, this.agedCurtainMat);
    drapeR.position.set(
      facingX ? pos.x : pos.x + width * 0.34,
      pos.y,
      facingX ? pos.z + width * 0.34 : pos.z
    );
    this.group.add(drapeR);
  }

  private populateSecondFloorLeft_MasterBedroom(floorY: number): void {
    // =========================================================================
    // LEFT SIDE — LARGE MASTER BEDROOM
    // Dimensions: X in [-12.35, -3.0], Z in [-78.35, -58.95]
    // =========================================================================

    // -------------------------------------------------------------------------
    // FOCAL OBJECT: ONE LARGE BED
    // Large old wooden frame, thick old mattress, aged bedsheet, pillows
    // Headboard against the outer left wall (x = -11.4), centered at z = -68.0
    // -------------------------------------------------------------------------
    const bedGroup = new THREE.Group();
    bedGroup.position.set(0, floorY, 0);

    // 1. Turned wooden corner legs/posts
    const legGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.45, 10);
    const bedLegCoords: [number, number][] = [
      [-11.35, -66.95],
      [-11.35, -69.05],
      [-8.95, -66.95],
      [-8.95, -69.05],
    ];
    for (const [lx, lz] of bedLegCoords) {
      const leg = new THREE.Mesh(legGeo, this.darkTeakMat);
      leg.position.set(lx, 0.225, lz);
      bedGroup.add(leg);
    }

    // 2. Heavy Carved Wooden Headboard (against x = -11.4, facing room interior)
    const headboard = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.85, 2.26), this.darkTeakMat);
    headboard.position.set(-11.38, 0.925, -68.0);
    bedGroup.add(headboard);

    // Ornate carved headboard crest molding
    const hCrest = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 2.32), this.darkTeakMat);
    hCrest.position.set(-11.38, 1.88, -68.0);
    bedGroup.add(hCrest);

    // Headboard carved finials
    const finialGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.18, 8);
    const finialL = new THREE.Mesh(finialGeo, this.darkTeakMat);
    finialL.position.set(-11.38, 1.96, -66.95);
    bedGroup.add(finialL);
    const finialR = new THREE.Mesh(finialGeo, this.darkTeakMat);
    finialR.position.set(-11.38, 1.96, -69.05);
    bedGroup.add(finialR);

    // 3. Carved Footboard (at foot of bed x = -8.9)
    const footboard = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.82, 2.26), this.darkTeakMat);
    footboard.position.set(-8.92, 0.41, -68.0);
    bedGroup.add(footboard);

    const fCrest = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 2.30), this.darkTeakMat);
    fCrest.position.set(-8.92, 0.84, -68.0);
    bedGroup.add(fCrest);

    // 4. Sturdy Side Rails & Base Slats
    const railGeo = new THREE.BoxGeometry(2.36, 0.18, 0.08);
    const railNorth = new THREE.Mesh(railGeo, this.darkTeakMat);
    railNorth.position.set(-10.15, 0.38, -66.95);
    bedGroup.add(railNorth);

    const railSouth = new THREE.Mesh(railGeo, this.darkTeakMat);
    railSouth.position.set(-10.15, 0.38, -69.05);
    bedGroup.add(railSouth);

    // Mattress support base slats
    const slatBase = new THREE.Mesh(new THREE.BoxGeometry(2.32, 0.06, 2.02), this.darkTeakMat);
    slatBase.position.set(-10.15, 0.36, -68.0);
    bedGroup.add(slatBase);

    // 5. Thick Old Mattress (aged ticking fabric, realistic generous thickness)
    const mattress = new THREE.Mesh(new THREE.BoxGeometry(2.34, 0.30, 2.04), this.agedLinenMat);
    mattress.position.set(-10.15, 0.53, -68.0);
    mattress.receiveShadow = true;
    bedGroup.add(mattress);

    // 6. Aged Bedsheet & Draped Counterpane (aged linen with rumpled folds)
    const bedspread = new THREE.Mesh(new THREE.BoxGeometry(2.36, 0.08, 2.06), this.agedLinenMat);
    bedspread.position.set(-10.15, 0.69, -68.0);
    bedspread.receiveShadow = true;
    bedGroup.add(bedspread);

    // Draped counterpane overhang along the footboard
    const drapeFoot = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.22, 1.94), this.agedLinenMat);
    drapeFoot.position.set(-8.98, 0.56, -68.0);
    bedGroup.add(drapeFoot);

    // 7. Two Plush Pillows propped naturally against the headboard + Bolster
    const pillowGeo = new THREE.BoxGeometry(0.48, 0.18, 0.75);
    const pillowNorth = new THREE.Mesh(pillowGeo, this.agedLinenMat);
    pillowNorth.position.set(-11.0, 0.80, -67.45);
    pillowNorth.rotation.z = -0.22;
    bedGroup.add(pillowNorth);

    const pillowSouth = new THREE.Mesh(pillowGeo, this.agedLinenMat);
    pillowSouth.position.set(-11.0, 0.80, -68.55);
    pillowSouth.rotation.z = -0.22;
    bedGroup.add(pillowSouth);

    // Decorative antique bolster pillow
    const bolsterGeo = new THREE.CylinderGeometry(0.10, 0.10, 1.4, 12);
    const bolster = new THREE.Mesh(bolsterGeo, this.agedLinenMat);
    bolster.rotation.x = Math.PI / 2;
    bolster.position.set(-10.45, 0.74, -68.0);
    bedGroup.add(bolster);

    this.group.add(bedGroup);

    // Bed physical collider: tight, accurate bounds allowing comfortable walking space on all sides
    this.addBoxCollider(
      new THREE.Vector3(-10.15, floorY + 0.6, -68.0),
      new THREE.Vector3(2.5, 1.2, 2.3)
    );

    // -------------------------------------------------------------------------
    // BEDSIDE TABLES & OLD LAMPS
    // -------------------------------------------------------------------------
    // Bedside Table 1 (North of headboard: x = -11.1, z = -65.5)
    const stand1 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.64, 0.55), this.darkTeakMat);
    stand1.position.set(-11.1, floorY + 0.32, -65.5);
    this.group.add(stand1);
    this.addBoxCollider(stand1.position, new THREE.Vector3(0.65, 0.75, 0.65));

    // Vintage brass kerosene lamp on Table 1
    const lamp1Base = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.18, 8), this.brassMat);
    lamp1Base.position.set(-11.1, floorY + 0.64 + 0.09, -65.5);
    this.group.add(lamp1Base);

    const lamp1Glass = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.22, 8), this.dustyGlassMat);
    lamp1Glass.position.set(-11.1, floorY + 0.64 + 0.28, -65.5);
    this.group.add(lamp1Glass);

    const bedLampLight1 = new THREE.PointLight(0xeda358, 1.4, 8.5, 1.8);
    bedLampLight1.position.set(-11.1, floorY + 0.95, -65.5);
    this.group.add(bedLampLight1);
    this.flickeringLamps.push(bedLampLight1);

    // Bedside Table 2 (South of headboard: x = -11.1, z = -70.5)
    const stand2 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.64, 0.55), this.darkTeakMat);
    stand2.position.set(-11.1, floorY + 0.32, -70.5);
    this.group.add(stand2);
    this.addBoxCollider(stand2.position, new THREE.Vector3(0.65, 0.75, 0.65));

    // Pewter candlestick & candle on Table 2
    const candleBase = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.12, 8), this.brassMat);
    candleBase.position.set(-11.1, floorY + 0.64 + 0.06, -70.5);
    this.group.add(candleBase);

    const candleWax = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.02, 0.14, 8), this.paperMat);
    candleWax.position.set(-11.1, floorY + 0.64 + 0.18, -70.5);
    this.group.add(candleWax);

    // -------------------------------------------------------------------------
    // OLD WOODEN WARDROBE (ALMIRAH)
    // Placed against back wall at x = -7.5, z = -77.8
    // -------------------------------------------------------------------------
    const wardrobe = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.7, 0.72), this.darkTeakMat);
    wardrobe.position.set(-7.5, floorY + 1.35, -77.8);
    wardrobe.castShadow = true;
    this.group.add(wardrobe);
    this.addBoxCollider(wardrobe.position, new THREE.Vector3(2.25, 2.75, 0.75));

    // Wardrobe crown pediment
    const wCrest = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.12, 0.78), this.darkTeakMat);
    wCrest.position.set(-7.5, floorY + 2.72, -77.8);
    this.group.add(wCrest);

    // Wardrobe brass handles
    const wHandleGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.12, 8);
    const wHandleL = new THREE.Mesh(wHandleGeo, this.brassMat);
    wHandleL.position.set(-7.6, floorY + 1.35, -77.42);
    this.group.add(wHandleL);
    const wHandleR = new THREE.Mesh(wHandleGeo, this.brassMat);
    wHandleR.position.set(-7.4, floorY + 1.35, -77.42);
    this.group.add(wHandleR);

    // -------------------------------------------------------------------------
    // OLD DRESSING TABLE & OLD MIRROR
    // Placed against outer left wall at x = -11.5, z = -62.5
    // -------------------------------------------------------------------------
    const vanityTable = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.76, 1.5), this.darkTeakMat);
    vanityTable.position.set(-11.5, floorY + 0.38, -62.5);
    vanityTable.castShadow = true;
    this.group.add(vanityTable);
    this.addBoxCollider(vanityTable.position, new THREE.Vector3(0.75, 1.85, 1.6));

    // Vanity Mirror Frame (arched top)
    const vMirrorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.15, 0.95), this.darkTeakMat);
    vMirrorFrame.position.set(-11.75, floorY + 1.35, -62.5);
    this.group.add(vMirrorFrame);

    // Cloudy antique mirror glass pane
    const vMirrorGlass = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.05, 0.85), this.antiqueMirrorMat);
    vMirrorGlass.position.set(-11.71, floorY + 1.35, -62.5);
    this.group.add(vMirrorGlass);

    // Personal objects on dressing table: silver hairbrush, perfume bottle
    const hairbrush = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.22), this.brassMat);
    hairbrush.position.set(-11.45, floorY + 0.775, -62.25);
    hairbrush.rotation.y = 0.4;
    this.group.add(hairbrush);

    const perfumeBottle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.12, 8), this.dustyGlassMat);
    perfumeBottle.position.set(-11.45, floorY + 0.82, -62.7);
    this.group.add(perfumeBottle);

    // Story Clue document on vanity: Father's Estate Will & Sankar's Letter
    const willDoc = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.02, 0.32), this.paperMat);
    willDoc.position.set(-11.45, floorY + 0.77, -62.5);
    willDoc.rotation.y = -0.15;
    this.group.add(willDoc);

    // -------------------------------------------------------------------------
    // SMALL OLD CHAIR
    // Placed in front of dressing table at x = -10.4, z = -62.5
    // -------------------------------------------------------------------------
    const chairGroup = this.createChairGroup(new THREE.Vector3(-10.4, floorY, -62.5), Math.PI / 2 + 0.2);
    this.group.add(chairGroup);

    // -------------------------------------------------------------------------
    // OLD CURTAINS (Heavy velvet draperies on exterior windows)
    // -------------------------------------------------------------------------
    this.createOldCurtains(new THREE.Vector3(-12.35, floorY + 1.8, -63.5), 1.8, 2.2, true);
    this.createOldCurtains(new THREE.Vector3(-12.35, floorY + 1.8, -73.0), 1.8, 2.2, true);

    // -------------------------------------------------------------------------
    // ABANDONED PERSONAL OBJECTS & ROOM RUNNER
    // -------------------------------------------------------------------------
    // Old leather travel valise / trunk near wardrobe
    const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.45, 0.55), this.cardboardMat);
    trunk.position.set(-9.2, floorY + 0.225, -77.5);
    trunk.rotation.y = 0.15;
    this.group.add(trunk);
    this.addBoxCollider(trunk.position, new THREE.Vector3(0.9, 0.5, 0.6));

    // Worn patterned bedside rug
    const runner = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 3.6), this.wornCarpetMat);
    runner.rotation.x = -Math.PI / 2;
    runner.position.set(-8.5, floorY + 0.01, -68.0);
    this.group.add(runner);

    // Subtle warm ambient sconce in Left Bedroom
    const leftAmbSconce = new THREE.PointLight(0xe5a362, 1.3, 11.0, 1.8);
    leftAmbSconce.position.set(-7.5, floorY + 2.4, -68.0);
    this.group.add(leftAmbSconce);
    this.flickeringLamps.push(leftAmbSconce);
  }

  private populateSecondFloorRight_MasterBedroom(floorY: number): void {
    // =========================================================================
    // RIGHT SIDE — LARGE MASTER BEDROOM (Distinct Layout & Colonial Four-Poster Bed)
    // Dimensions: X in [+3.0, +12.35], Z in [-78.35, -58.95]
    // =========================================================================

    // -------------------------------------------------------------------------
    // FOCAL OBJECT: ONE LARGE BED (Colonial Four-Poster Canopy Bed)
    // Distinct design from Left Bedroom: 4 tall carved wooden pillars, canopy rails,
    // headboard against back wall at z = -77.6, centered at x = +8.2
    // -------------------------------------------------------------------------
    const bedGroup = new THREE.Group();
    bedGroup.position.set(0, floorY, 0);

    // 1. Four Tall Turned Teak Posts (Canopy Height: 2.80m)
    const postGeo = new THREE.CylinderGeometry(0.045, 0.055, 2.80, 10);
    const postCoords: [number, number][] = [
      [7.15, -77.55],
      [9.25, -77.55],
      [7.15, -75.15],
      [9.25, -75.15],
    ];
    for (const [px, pz] of postCoords) {
      const post = new THREE.Mesh(postGeo, this.darkTeakMat);
      post.position.set(px, 1.40, pz);
      bedGroup.add(post);

      // Post top finials
      const fGeo = new THREE.CylinderGeometry(0.02, 0.055, 0.16, 8);
      const finial = new THREE.Mesh(fGeo, this.darkTeakMat);
      finial.position.set(px, 2.88, pz);
      bedGroup.add(finial);
    }

    // 2. Top Canopy Rails connecting all 4 posts
    const canopyRailX = new THREE.Mesh(new THREE.BoxGeometry(2.14, 0.06, 0.06), this.darkTeakMat);
    canopyRailX.position.set(8.2, 2.77, -77.55);
    bedGroup.add(canopyRailX);
    const canopyRailXFront = new THREE.Mesh(new THREE.BoxGeometry(2.14, 0.06, 0.06), this.darkTeakMat);
    canopyRailXFront.position.set(8.2, 2.77, -75.15);
    bedGroup.add(canopyRailXFront);

    const canopyRailZLeft = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 2.44), this.darkTeakMat);
    canopyRailZLeft.position.set(7.15, 2.77, -76.35);
    bedGroup.add(canopyRailZLeft);
    const canopyRailZRight = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 2.44), this.darkTeakMat);
    canopyRailZRight.position.set(9.25, 2.77, -76.35);
    bedGroup.add(canopyRailZRight);

    // 3. Ornate Carved Wooden Headboard (between back posts)
    const headboard = new THREE.Mesh(new THREE.BoxGeometry(2.08, 1.55, 0.10), this.darkTeakMat);
    headboard.position.set(8.2, 0.85, -77.55);
    bedGroup.add(headboard);

    // Headboard floral crest
    const hCrest = new THREE.Mesh(new THREE.BoxGeometry(2.14, 0.12, 0.12), this.darkTeakMat);
    hCrest.position.set(8.2, 1.65, -77.55);
    bedGroup.add(hCrest);

    // 4. Turned Footboard Rail (between front posts)
    const footRail = new THREE.Mesh(new THREE.BoxGeometry(2.08, 0.14, 0.08), this.darkTeakMat);
    footRail.position.set(8.2, 0.82, -75.15);
    bedGroup.add(footRail);

    // 5. Heavy Side Rails & Base Slats
    const railZLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 2.38), this.darkTeakMat);
    railZLeft.position.set(7.15, 0.38, -76.35);
    bedGroup.add(railZLeft);

    const railZRight = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 2.38), this.darkTeakMat);
    railZRight.position.set(9.25, 0.38, -76.35);
    bedGroup.add(railZRight);

    const baseSlat = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.06, 2.36), this.darkTeakMat);
    baseSlat.position.set(8.2, 0.36, -76.35);
    bedGroup.add(baseSlat);

    // 6. Thick Old Mattress (realistic tufted mattress)
    const mattress = new THREE.Mesh(new THREE.BoxGeometry(2.04, 0.30, 2.36), this.vintageQuiltMat);
    mattress.position.set(8.2, 0.53, -76.35);
    mattress.receiveShadow = true;
    bedGroup.add(mattress);

    // 7. Aged Bedsheet & Faded Quilted Counterpane
    const bedspread = new THREE.Mesh(new THREE.BoxGeometry(2.06, 0.08, 2.38), this.vintageQuiltMat);
    bedspread.position.set(8.2, 0.69, -76.35);
    bedspread.receiveShadow = true;
    bedGroup.add(bedspread);

    // Draped quilt overhang at foot of bed
    const drapeFoot = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.22, 0.10), this.vintageQuiltMat);
    drapeFoot.position.set(8.2, 0.56, -75.12);
    bedGroup.add(drapeFoot);

    // 8. Three Plush Pillows (distinct arrangement from left room)
    const pillowGeo = new THREE.BoxGeometry(0.72, 0.18, 0.46);
    const pLeft = new THREE.Mesh(pillowGeo, this.agedLinenMat);
    pLeft.position.set(7.65, 0.80, -77.0);
    pLeft.rotation.x = 0.22;
    bedGroup.add(pLeft);

    const pRight = new THREE.Mesh(pillowGeo, this.agedLinenMat);
    pRight.position.set(8.75, 0.80, -77.0);
    pRight.rotation.x = 0.22;
    bedGroup.add(pRight);

    // Center decorative pillow
    const pCenter = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.16, 0.40), this.agedLinenMat);
    pCenter.position.set(8.2, 0.74, -76.45);
    pCenter.rotation.y = 0.15;
    bedGroup.add(pCenter);

    this.group.add(bedGroup);

    // Bed physical collider: tight, accurate bounds allowing complete walking space on all sides
    this.addBoxCollider(
      new THREE.Vector3(8.2, floorY + 0.6, -76.35),
      new THREE.Vector3(2.3, 1.2, 2.5)
    );

    // -------------------------------------------------------------------------
    // BEDSIDE TABLES & OLD LAMPS
    // -------------------------------------------------------------------------
    // Bedside Table 1 (Left of bed: x = 5.9, z = -77.4)
    const stand1 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.64, 0.55), this.darkTeakMat);
    stand1.position.set(5.9, floorY + 0.32, -77.4);
    this.group.add(stand1);
    this.addBoxCollider(stand1.position, new THREE.Vector3(0.65, 0.75, 0.65));

    // Vintage brass kerosene lamp on Table 1
    const lampGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.16, 8);
    const lampBase = new THREE.Mesh(lampGeo, this.brassMat);
    lampBase.position.set(5.9, floorY + 0.64 + 0.08, -77.4);
    this.group.add(lampBase);

    const bedLampLightR = new THREE.PointLight(0xf59a45, 1.5, 9.0, 1.8);
    bedLampLightR.position.set(5.9, floorY + 0.95, -77.4);
    this.group.add(bedLampLightR);
    this.flickeringLamps.push(bedLampLightR);

    // Bedside Table 2 (Right of bed: x = 10.5, z = -77.4)
    const stand2 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.64, 0.55), this.darkTeakMat);
    stand2.position.set(10.5, floorY + 0.32, -77.4);
    this.group.add(stand2);
    this.addBoxCollider(stand2.position, new THREE.Vector3(0.65, 0.75, 0.65));

    const candleBaseR = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.12, 8), this.brassMat);
    candleBaseR.position.set(10.5, floorY + 0.64 + 0.06, -77.4);
    this.group.add(candleBaseR);

    // Dedicated Nightstand with Yamini's Antique Music Box at (11.8, floorY, -72.0)
    const musicStand = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.65, 0.55), this.darkTeakMat);
    musicStand.position.set(11.8, floorY + 0.325, -72.0);
    this.group.add(musicStand);
    this.addBoxCollider(musicStand.position, new THREE.Vector3(0.7, 0.8, 0.7));

    // Antique Brass Music Box on nightstand (CLUE_UPPER_MUSIC_BOX)
    const mbox = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.18), this.brassMat);
    mbox.position.set(11.8, floorY + 0.72, -72.0);
    this.group.add(mbox);

    // -------------------------------------------------------------------------
    // LARGE OLD WARDROBE (Three-door armoire with cracked open door)
    // Placed against front wall at x = 8.0, z = -59.5
    // -------------------------------------------------------------------------
    const wardrobeR = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.75, 0.72), this.darkTeakMat);
    wardrobeR.position.set(8.0, floorY + 1.38, -59.5);
    wardrobeR.castShadow = true;
    this.group.add(wardrobeR);
    this.addBoxCollider(wardrobeR.position, new THREE.Vector3(2.45, 2.8, 0.75));

    // Wardrobe crown pediment
    const wCrestR = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.14, 0.78), this.darkTeakMat);
    wCrestR.position.set(8.0, floorY + 2.78, -59.5);
    this.group.add(wCrestR);

    // Center door slightly ajar
    const ajarDoor = new THREE.Mesh(new THREE.BoxGeometry(0.75, 2.45, 0.04), this.darkTeakMat);
    ajarDoor.position.set(8.0, floorY + 1.35, -59.84);
    ajarDoor.rotation.y = -0.18;
    this.group.add(ajarDoor);

    // -------------------------------------------------------------------------
    // OLD DRESSING TABLE & TRIPTYCH MIRROR
    // Placed at x = 11.4, z = -67.5 (preserves CLUE_UPPER_BEDROOM_DIARY location)
    // -------------------------------------------------------------------------
    const desk = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.76, 1.6), this.darkTeakMat);
    desk.position.set(11.4, floorY + 0.38, -67.5);
    desk.castShadow = true;
    this.group.add(desk);
    this.addBoxCollider(desk.position, new THREE.Vector3(1.0, 1.85, 1.7));

    // Three-panel folding vanity mirror (Triptych Mirror)
    // Center mirror against outer wall
    const tripCenter = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.0, 0.8), this.antiqueMirrorMat);
    tripCenter.position.set(11.75, floorY + 1.35, -67.5);
    this.group.add(tripCenter);

    // Left folding wing mirror
    const tripLeft = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.9, 0.36), this.antiqueMirrorMat);
    tripLeft.position.set(11.68, floorY + 1.35, -67.1);
    tripLeft.rotation.y = 0.35;
    this.group.add(tripLeft);

    // Right folding wing mirror
    const tripRight = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.9, 0.36), this.antiqueMirrorMat);
    tripRight.position.set(11.68, floorY + 1.35, -67.9);
    tripRight.rotation.y = -0.35;
    this.group.add(tripRight);

    // Yamini's Personal Journal on the dressing table (CLUE_UPPER_BEDROOM_DIARY)
    const diary = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.04, 0.45), this.paperMat);
    diary.position.set(11.4, floorY + 0.81, -67.5);
    diary.rotation.y = 0.2;
    this.group.add(diary);

    // Feather quill & inkwell
    const inkwell = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.07, 8), this.castIronMat);
    inkwell.position.set(11.4, floorY + 0.81, -67.15);
    this.group.add(inkwell);

    // -------------------------------------------------------------------------
    // OLD CHAIR & PORCELAIN DOLL
    // Vintage rocking chair at x = 6.8, z = -62.5 (preserves CLUE_UPPER_PORCELAIN_DOLL location)
    // -------------------------------------------------------------------------
    const chairGroup = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.06, 0.6), this.darkTeakMat);
    seat.position.set(0, 0.45, 0);
    chairGroup.add(seat);

    // Curved rocking runners
    const runnerGeo = new THREE.BoxGeometry(0.05, 0.06, 0.95);
    const runnerL = new THREE.Mesh(runnerGeo, this.darkTeakMat);
    runnerL.position.set(-0.28, 0.03, 0);
    runnerL.rotation.x = -0.05;
    chairGroup.add(runnerL);
    const runnerR = new THREE.Mesh(runnerGeo, this.darkTeakMat);
    runnerR.position.set(0.28, 0.03, 0);
    runnerR.rotation.x = -0.05;
    chairGroup.add(runnerR);

    // Spindle backrest
    const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.65, 0.05), this.darkTeakMat);
    backrest.position.set(0, 0.78, -0.26);
    chairGroup.add(backrest);

    chairGroup.position.set(6.8, floorY, -62.5);
    chairGroup.rotation.y = -0.45;
    this.group.add(chairGroup);
    this.addBoxCollider(new THREE.Vector3(6.8, floorY + 0.5, -62.5), new THREE.Vector3(1.0, 1.2, 1.0));

    // Antique Porcelain doll on chair (CLUE_UPPER_PORCELAIN_DOLL)
    const dollMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.35, 0.45),
      new THREE.MeshBasicMaterial({
        map: BungalowTextureGenerator.createPorcelainDollTexture(),
        transparent: true,
        opacity: 0.95,
      })
    );
    dollMesh.position.set(6.8, floorY + 0.72, -62.5);
    dollMesh.rotation.y = -0.45;
    this.group.add(dollMesh);

    // -------------------------------------------------------------------------
    // OLD CURTAINS (Heavy velvet draperies on exterior windows)
    // -------------------------------------------------------------------------
    this.createOldCurtains(new THREE.Vector3(12.35, floorY + 1.8, -68.5), 1.8, 2.2, true);
    this.createOldCurtains(new THREE.Vector3(12.35, floorY + 1.8, -74.0), 1.8, 2.2, true);

    // -------------------------------------------------------------------------
    // ABANDONED PERSONAL OBJECTS & ROOM RUNNER
    // -------------------------------------------------------------------------
    // Antique phonograph / gramophone with brass horn on round pedestal table
    const pedTable = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.72, 12), this.darkTeakMat);
    pedTable.position.set(11.6, floorY + 0.36, -75.5);
    this.group.add(pedTable);
    this.addBoxCollider(pedTable.position, new THREE.Vector3(0.75, 0.8, 0.75));

    const phonoBox = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.32), this.darkTeakMat);
    phonoBox.position.set(11.6, floorY + 0.79, -75.5);
    this.group.add(phonoBox);

    const phonoHorn = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.42, 12), this.brassMat);
    phonoHorn.position.set(11.5, floorY + 1.05, -75.5);
    phonoHorn.rotation.z = -Math.PI / 3;
    this.group.add(phonoHorn);

    // Overturned antique stool on floor
    const otStool = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.08), this.darkTeakMat);
    otStool.position.set(10.2, floorY + 0.22, -67.5);
    otStool.rotation.x = 1.1;
    otStool.rotation.y = 0.4;
    this.group.add(otStool);

    // Worn patterned floor carpet in front of the bed
    const carpetR = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 3.2), this.wornCarpetMat);
    carpetR.rotation.x = -Math.PI / 2;
    carpetR.position.set(8.2, floorY + 0.01, -72.0);
    this.group.add(carpetR);

    // Subtle warm ambient sconce in Right Bedroom
    const rightAmbSconce = new THREE.PointLight(0xf5a242, 1.4, 11.0, 1.8);
    rightAmbSconce.position.set(7.5, floorY + 2.4, -68.0);
    this.group.add(rightAmbSconce);
    this.flickeringLamps.push(rightAmbSconce);
  }

  private buildDustParticles(): void {
    const particleCount = 450;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 24;
      positions[i + 1] = 1.6 + Math.random() * 7.5;
      positions[i + 2] = -59 - Math.random() * 19;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0xffe2b8,
      size: 0.055,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    });

    this.dustParticles = new THREE.Points(geometry, material);
    this.group.add(this.dustParticles);
  }

  private buildAtmosphericLighting(): void {
    // Soft ambient fill light to eliminate dark mud
    const interiorAmbient = new THREE.AmbientLight(0x40362c, 0.65);
    this.group.add(interiorAmbient);

    // Central Entrance Hallway Chandelier (y = 4.4)
    const hallChandelier = new THREE.PointLight(0xffb866, 1.8, 14.0, 1.8);
    hallChandelier.position.set(0, 4.4, -63.0);
    this.group.add(hallChandelier);
    this.flickeringLamps.push(hallChandelier);

    // Staircase & Landing Illumination (y = 5.8)
    const stairLamp = new THREE.PointLight(0xf5a242, 1.6, 13.0, 1.8);
    stairLamp.position.set(0, 5.8, -72.0);
    this.group.add(stairLamp);
    this.flickeringLamps.push(stairLamp);

    // Ground floor room sconces
    const lr1Lamp = new THREE.PointLight(0xeda358, 1.5, 10.0, 2.0);
    lr1Lamp.position.set(-7.5, 3.4, -63.5);
    this.group.add(lr1Lamp);
    this.flickeringLamps.push(lr1Lamp);

    const lr2Lamp = new THREE.PointLight(0xe8994a, 1.5, 10.0, 2.0);
    lr2Lamp.position.set(-7.5, 3.4, -73.0);
    this.group.add(lr2Lamp);
    this.flickeringLamps.push(lr2Lamp);

    const rr1Lamp = new THREE.PointLight(0xeda358, 1.5, 10.0, 2.0);
    rr1Lamp.position.set(7.5, 3.4, -63.5);
    this.group.add(rr1Lamp);
    this.flickeringLamps.push(rr1Lamp);

    const rr2Lamp = new THREE.PointLight(0xd99043, 1.3, 9.0, 2.0);
    rr2Lamp.position.set(7.5, 3.4, -73.0);
    this.group.add(rr2Lamp);
    this.flickeringLamps.push(rr2Lamp);

    // Second floor rooms
    const ubLeftLamp = new THREE.PointLight(0xe0a568, 1.5, 12.0, 1.8);
    ubLeftLamp.position.set(-7.5, 7.2, -68.5);
    this.group.add(ubLeftLamp);

    const ubRightLamp = new THREE.PointLight(0xf59a45, 1.7, 12.0, 1.8);
    ubRightLamp.position.set(7.5, 7.2, -68.5);
    this.group.add(ubRightLamp);
    this.flickeringLamps.push(ubRightLamp);

    // Subtle natural pale moonbeams
    const moonLeft = new THREE.DirectionalLight(0x8898aa, 0.28);
    moonLeft.position.set(-16.0, 8.0, -68.5);
    this.group.add(moonLeft);

    const moonRight = new THREE.DirectionalLight(0x8898aa, 0.28);
    moonRight.position.set(16.0, 8.0, -68.5);
    this.group.add(moonRight);
  }

  private setupStoryClues(): void {
    this.interiorClues = [
      {
        id: 'CLUE_LIVING_ROOM_PORTRAIT',
        name: 'Photograph: Sankar & his sister Yamini (1984)',
        room: 'Ground Floor — Living Room',
        position: new THREE.Vector3(-8.7, 2.0, -63.5),
        description: '"To my dearest brother Sankar — May our family bungalow always be a sanctuary of peace."\n\nYamini looks radiant and full of laughter here, holding her college books. Sankar stood beside his younger sister with protective pride. But years later, she came back alone, and something in this house took hold of her.',
        subtext: 'A handwritten dedication on the back of the weathered frame: "Kakinada, 1984"',
      },
      {
        id: 'CLUE_STUDY_LETTER',
        name: 'Sankar’s Diary (October 14th)',
        room: 'Ground Floor — Storage & Waste Room',
        position: new THREE.Vector3(-7.5, 2.1, -73.0),
        description: '"October 14th — I heard someone upstairs again. The slow, dragging footsteps walking from the master bedroom toward Yamini\'s room. But Yamini swore she was asleep in bed.\n\nWhen I checked the landing, the air was ice cold. The floorboards were creaking beneath invisible weight. This bungalow has absorbed something evil. I must convince my sister to pack her things and leave before whatever is up there claims us."',
        subtext: 'Torn from a leather journal, resting on an overturned packing crate in the waste room.',
      },
      {
        id: 'CLUE_DINING_CLOCK',
        name: 'Antique Colonial Grandfather Clock',
        room: 'Ground Floor — Kitchen & Dining Room',
        position: new THREE.Vector3(12.0, 2.6, -59.5),
        description: 'An imposing pendulum clock crafted from dark Burmese teak. The pendulum was swinging steadily, but the moment you draw close, the brass clockwork mechanism halts abruptly. The hands are permanently frozen at 3:17 AM.',
        subtext: 'Deep gouges mar the brass dial from the inside.',
      },
      {
        id: 'CLUE_STORAGE_LOG',
        name: 'Scratched Warning Note',
        room: 'Ground Floor — Old Bathroom',
        position: new THREE.Vector3(12.15, 2.4, -73.7),
        description: '"THE HOUSE WAS NEVER EMPTY.\n\nEven when the lights are snuffed out, they stand right behind you in the glass. Do not look directly into the mirror."',
        subtext: 'Pinned to the wall beside the antique bathroom mirror.',
      },
      {
        id: 'CLUE_STORAGE_MIRROR',
        name: 'Antique Bathroom Mirror',
        room: 'Ground Floor — Old Bathroom',
        position: new THREE.Vector3(12.1, 2.4, -73.0),
        description: 'An antique framed mirror mounted above the pedestal wash basin, fractured with jagged hairline cracks.\n\nAs you stare into the clouded, murky glass, a tall gaunt apparition suddenly materializes directly behind your shoulder. A bone-chilling shiver courses through the room before the apparition vanishes back into the shadows.',
        subtext: 'The glass feels freezing to the touch. Do not gaze into it too long.',
      },
      {
        id: 'CLUE_MASTER_BEDROOM_PORTRAIT',
        name: 'Father’s Estate Will & Sankar’s Warning Letter (1983)',
        room: 'Second Floor — Left Master Bedroom',
        position: new THREE.Vector3(-11.5, 6.25, -62.5),
        description: '"To my son Sankar — This bungalow has belonged to our ancestors for three generations. But the ground upon which it rests holds ancient grief. Never sleep with the master bedroom doors unlatched when the monsoon rains arrive.\n\nThere are nights when the house remembers those who never left."',
        subtext: 'A yellowed family document under glass with an aged red wax seal.',
      },
      {
        id: 'CLUE_UPPER_BEDROOM_DIARY',
        name: 'Yamini’s Personal Journal',
        room: 'Second Floor — Right Master Bedroom',
        position: new THREE.Vector3(11.4, 6.2, -67.5),
        description: '"November 3rd — I shouldn\'t have come here.\n\nSankar begged me not to return to this house alone. But I wanted to feel closer to our childhood memories. Now every night, the walls breathe.\n\nLast night I woke up and my porcelain doll had been moved from the chair to the foot of my bed. The music box began winding itself in the dark.\n\nIf anyone finds this... please tell my brother Sankar that I tried to run. But the house won\'t let me leave."',
        subtext: 'A tear-stained page with frantic handwriting.',
      },
      {
        id: 'CLUE_UPPER_MUSIC_BOX',
        name: 'Yamini’s Antique Music Box',
        room: "Second Floor — Yamini's Bedroom",
        position: new THREE.Vector3(11.8, 6.1, -72.0),
        description: 'An exquisite brass-inlaid music box resting upon the nightstand. You gently turn the delicate key, and a chilling, melancholic music-box lullaby echoes through the empty bedroom.',
        subtext: 'Plays a slow, haunting lullaby from Yamini and Sankar\'s childhood.',
      },
      {
        id: 'CLUE_UPPER_PORCELAIN_DOLL',
        name: 'Yamini’s Childhood Porcelain Doll',
        room: "Second Floor — Yamini's Bedroom",
        position: new THREE.Vector3(6.8, 6.0, -62.5),
        description: 'A cracked porcelain doll with glassy eyes that seem to track your movement. A faint smell of dried marigolds and stagnant incense clings to its lace dress. Its head is slightly tilted toward the bedroom door.',
        subtext: 'Its hollow painted stare follows you wherever you step in the room.',
      },
    ];
  }

  public triggerMirrorSilhouette(): void {
    if (!this.storageMirrorMesh || this.isMirrorApparitionTriggered) return;
    this.isMirrorApparitionTriggered = true;

    horrorAudio.playMirrorSilhouetteStinger();
    this.storageMirrorMesh.material = this.mirrorSilhouetteMat;

    setTimeout(() => {
      if (this.storageMirrorMesh) {
        this.storageMirrorMesh.material = this.mirrorNormalMat;
      }
    }, 2400);
  }

  public setInteriorBrightness(factor: number): void {
    this.flickeringLamps.forEach((lamp) => {
      lamp.intensity = 1.5 * factor;
    });
  }

  public update(delta: number, playerPos: THREE.Vector3): void {
    // 1. Clock pendulum animation
    if (this.clockPendulum && !this.isClockStopped) {
      this.clockPendulum.rotation.z = Math.sin(Date.now() * 0.0035) * 0.25;
    }

    // 2. Dust floating
    if (this.dustParticles) {
      const pos = this.dustParticles.geometry.attributes.position.array as Float32Array;
      for (let i = 1; i < pos.length; i += 3) {
        pos[i] -= delta * 0.06;
        if (pos[i] < 1.45) pos[i] = 8.5;
      }
      this.dustParticles.geometry.attributes.position.needsUpdate = true;
    }

    // 3. Subtle lamp flickering
    for (let i = 0; i < this.flickeringLamps.length; i++) {
      if (Math.random() < 0.015) {
        this.flickeringLamps[i].intensity = THREE.MathUtils.lerp(
          this.flickeringLamps[i].intensity,
          0.9 + Math.random() * 1.2,
          0.4
        );
      }
    }

    // 4. Position-based triggers inside bungalow (z <= -58.5)
    if (playerPos.z <= -58.5) {
      // Approach Dining Room (x in [4.5, 11], z in [-67, -60], y < 3.0)
      if (playerPos.x > 4.5 && playerPos.z <= -60 && playerPos.z >= -67 && playerPos.y < 3.0) {
        if (!this.isClockStopped) {
          this.isClockStopped = true;
          horrorAudio.stopGrandfatherClock();
        }

        if (!this.isChairMoved && this.hauntedChair) {
          this.isChairMoved = true;
          horrorAudio.playChairSlide();
          const startX = this.hauntedChair.position.x;
          let prog = 0;
          const slide = setInterval(() => {
            prog += 0.04;
            if (this.hauntedChair) {
              this.hauntedChair.position.x = startX + prog * 0.45;
            }
            if (prog >= 1.0) clearInterval(slide);
          }, 30);
        }
      }

      // Approach Central Stairs in lower foyer: upstairs dragging footsteps
      if (Math.abs(playerPos.x) < 2.5 && playerPos.z <= -64.0 && playerPos.z >= -68.0 && playerPos.y < 3.0) {
        if (!this.isUpstairsFootstepsTriggered) {
          this.isUpstairsFootstepsTriggered = true;
          horrorAudio.playUpstairsFootsteps();
        }
      }

      // Psychological ambient house creaks
      this.ambienceTimer += delta;
      if (this.ambienceTimer >= this.nextAmbienceSoundTime) {
        this.ambienceTimer = 0;
        this.nextAmbienceSoundTime = 16.0 + Math.random() * 18.0;

        const pick = Math.random();
        if (pick < 0.35) {
          horrorAudio.playWallCreak(Math.random() > 0.5 ? 0.6 : -0.6);
        } else if (pick < 0.65) {
          horrorAudio.playPassageWindGust();
        } else {
          horrorAudio.playTreeBranchSnap(Math.random() > 0.5 ? 0.7 : -0.7);
        }
      }
    }
  }

  private createDoorwayFrame(pos: THREE.Vector3, width: number, height: number): void {
    const postGeo = new THREE.BoxGeometry(0.28, height, 0.12);
    const postL = new THREE.Mesh(postGeo, this.darkTeakMat);
    postL.position.set(pos.x, pos.y + height / 2, pos.z - width / 2);
    this.group.add(postL);

    const postR = new THREE.Mesh(postGeo, this.darkTeakMat);
    postR.position.set(pos.x, pos.y + height / 2, pos.z + width / 2);
    this.group.add(postR);

    const topGeo = new THREE.BoxGeometry(0.30, 0.12, width + 0.24);
    const topBeam = new THREE.Mesh(topGeo, this.darkTeakMat);
    topBeam.position.set(pos.x, pos.y + height, pos.z);
    this.group.add(topBeam);
  }

  private createWall(pos: THREE.Vector3, size: THREE.Vector3, mat: THREE.Material, addCollider = true): THREE.Mesh {
    const geo = new THREE.BoxGeometry(size.x, size.y, size.z);
    const wall = new THREE.Mesh(geo, mat);
    wall.position.copy(pos);
    wall.castShadow = true;
    wall.receiveShadow = true;
    this.group.add(wall);

    if (addCollider) {
      this.addBoxCollider(pos, size);
    }
    return wall;
  }

  private createBalustrade(p1: THREE.Vector3, p2: THREE.Vector3): void {
    const len = p1.distanceTo(p2);
    const dir = new THREE.Vector3().subVectors(p2, p1).normalize();
    const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);

    const railGeo = new THREE.BoxGeometry(0.08, 0.08, len);
    const rail = new THREE.Mesh(railGeo, this.darkTeakMat);
    rail.position.set(mid.x, mid.y + 0.45, mid.z);
    if (Math.abs(dir.x) > 0.5) rail.rotation.y = Math.PI / 2;
    this.group.add(rail);

    const bRail = new THREE.Mesh(railGeo, this.darkTeakMat);
    bRail.position.set(mid.x, mid.y - 0.45, mid.z);
    if (Math.abs(dir.x) > 0.5) bRail.rotation.y = Math.PI / 2;
    this.group.add(bRail);

    const spinCount = Math.floor(len / 0.35);
    const spinGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.88);
    for (let i = 0; i <= spinCount; i++) {
      const sp = new THREE.Mesh(spinGeo, this.darkTeakMat);
      const frac = spinCount > 0 ? i / spinCount : 0.5;
      sp.position.lerpVectors(p1, p2, frac);
      this.group.add(sp);
    }

    const colSize = Math.abs(dir.x) > 0.5 ? new THREE.Vector3(len, 1.1, 0.15) : new THREE.Vector3(0.15, 1.1, len);
    this.addBoxCollider(mid, colSize);
  }

  private createChairGroup(pos: THREE.Vector3, rotY: number): THREE.Group {
    const chair = new THREE.Group();
    chair.position.copy(pos);
    chair.rotation.y = rotY;

    const s = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.5), this.darkTeakMat);
    s.position.y = 0.45;
    chair.add(s);

    const b = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.04), this.darkTeakMat);
    b.position.set(0, 0.72, -0.23);
    chair.add(b);

    const lGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.45);
    const offsets: [number, number][] = [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]];
    for (const [lx, lz] of offsets) {
      const leg = new THREE.Mesh(lGeo, this.darkTeakMat);
      leg.position.set(lx, 0.225, lz);
      chair.add(leg);
    }

    // Chair has visual presence but no box collider so player walks freely around dining table
    return chair;
  }

  private createBookshelf(pos: THREE.Vector3, width: number, height: number, depth: number, facingX: boolean): void {
    const bsGeo = new THREE.BoxGeometry(facingX ? depth : width, height, facingX ? width : depth);
    const bs = new THREE.Mesh(bsGeo, this.darkTeakMat);
    bs.position.copy(pos);
    this.group.add(bs);

    const shelfCount = 4;
    for (let s = 0; s < shelfCount; s++) {
      const shelfY = pos.y - height / 2 + 0.4 + s * (height / shelfCount);
      const bGeo = new THREE.BoxGeometry(
        facingX ? depth * 0.7 : width * 0.85,
        height / shelfCount * 0.65,
        facingX ? width * 0.85 : depth * 0.7
      );
      const bMat = new THREE.MeshStandardMaterial({
        color: 0x4a2a16,
        roughness: 0.9,
      });
      const books = new THREE.Mesh(bGeo, bMat);
      books.position.set(pos.x, shelfY, pos.z);
      this.group.add(books);
    }

    this.addBoxCollider(pos, new THREE.Vector3(facingX ? depth + 0.2 : width + 0.2, height, facingX ? width + 0.2 : depth + 0.2));
  }

  private addBoxCollider(center: THREE.Vector3, size: THREE.Vector3): void {
    const box = new THREE.Box3();
    box.setFromCenterAndSize(center, size);
    this.colliders.push(box);
  }
}
