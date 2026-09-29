import * as THREE from 'three';
import { StoryPoster } from '../types';
import { STORY_POSTERS, generatePosterCanvasTexture } from './StoryPosters';

export class HorrorEnvironment {
  public scene: THREE.Scene;
  public colliders: THREE.Box3[] = [];
  public gatePosition = new THREE.Vector3(0, 0, -22);
  public gateInteractionDistance = 4.0;

  // 3-Lamp Ritual Positions & Elements (All OUTSIDE the main gate)
  public notePosition = new THREE.Vector3(-3.35, 1.65, -20.95);
  public lamp1Position = new THREE.Vector3(-12.5, 0.96, -14.5);
  public lamp2Position = new THREE.Vector3(12.2, 0.42, -14.2);
  public lamp3Position = new THREE.Vector3(-6.8, 0.88, -19.2);
  public keyPosition = new THREE.Vector3(-3.3, 0.68, -20.9);

  public noteMesh: THREE.Mesh | null = null;
  public lamp1Data!: {
    group: THREE.Group;
    flame: THREE.Mesh;
    smoke: THREE.Mesh;
    light: THREE.PointLight;
    isLit: boolean;
  };
  public lamp2Data!: {
    group: THREE.Group;
    flame: THREE.Mesh;
    smoke: THREE.Mesh;
    light: THREE.PointLight;
    isLit: boolean;
  };
  public lamp3Data!: {
    group: THREE.Group;
    flame: THREE.Mesh;
    smoke: THREE.Mesh;
    light: THREE.PointLight;
    isLit: boolean;
    fogVeil: THREE.Mesh;
    brambles: THREE.Group;
    isRevealed: boolean;
    revealProgress: number;
  };
  public keyCompartmentDoor: THREE.Mesh | null = null;
  public ironKeyMesh: THREE.Group | null = null;
  public isKeyRevealed = false;
  public isKeyCollected = false;

  // Bungalow Window Flicker (for Lamp 2)
  private bungalowFlickerWindow: THREE.Mesh | null = null;
  private bungalowWindowLight: THREE.PointLight | null = null;
  private windowFlickerTimer = -1;

  // Gate Opening Mechanics
  public isGateOpen = false;
  public gateOpenProgress = 0;
  public gateCollider: THREE.Box3 | null = null;

  // Post-Story Horror Scare Environmental Atmospheric Modifiers
  public isHorrorEnvironmentFrozen = false;
  public horrorFogDensityFactor = 1.0;
  public horrorLightingCooling = 0.0;

  // Dynamic elements
  public activeRainCount: number = 1200;
  public activeDustCount: number = 35;
  public currentQuality: 'high' | 'medium' | 'low' = 'high';
  private rainParticles!: THREE.Points;
  private rainPositions!: Float32Array;
  private dustParticles!: THREE.Points;
  private groundFogPlanes: THREE.Mesh[] = [];
  private trees: THREE.Group[] = [];
  private atticLight!: THREE.PointLight;
  private moonLight!: THREE.DirectionalLight;
  private lightningLight!: THREE.DirectionalLight;
  private ambientLight!: THREE.AmbientLight;
  private hemiLight!: THREE.HemisphereLight;
  private gateRimLight!: THREE.DirectionalLight;
  private gateFillLight!: THREE.PointLight;
  private gateGroup!: THREE.Group;
  private leftGateWing!: THREE.Group;
  private rightGateWing!: THREE.Group;
  private wrappedChainLinks: THREE.Mesh[] = [];
  private swingingChainGroup: THREE.Group | null = null;
  private pillarLanternLight: THREE.PointLight | null = null;
  private pillarLanternBulb: THREE.Mesh | null = null;
  private shadowFigure: THREE.Mesh | null = null;
  private gateThresholdFogPlanes: THREE.Mesh[] = [];

  // First Scare Sequence: Dynamic Chain, Padlock, and Distant Tree Movement
  public padlockGroup: THREE.Group | null = null;
  public chainScareMode: 'NORMAL' | 'MOVING_BY_ITSELF' | 'PADLOCK_SHAKING' | 'FROZEN_DEAD_STILL' = 'NORMAL';
  public chainScareTimer: number = 0;
  public padlockShakeIntensity: number = 0;
  public isChainsDropped: boolean = false;
  private chainDropY: number = 0;
  private chainDropVelocity: number = 0;
  private distantAmbiguousMistShape: THREE.Mesh | null = null;
  private ambiguousMistTimer: number = -1;

  // The Haunted Passage Elements
  public storyPosterMeshes: {
    id: string;
    type: string;
    mesh: THREE.Mesh;
    position: THREE.Vector3;
    normal: THREE.Vector3;
    poster: StoryPoster;
  }[] = [];
  public passageLanternLight: THREE.PointLight | null = null;
  public passageLanternBulb: THREE.Mesh | null = null;
  public passageLanternFlickerBurst = 0;
  public passageShadowFigure: THREE.Mesh | null = null;
  public passageShadowTimer = -1;
  public bungalowRevealWindow: THREE.Mesh | null = null;
  public bungalowRevealLight: THREE.PointLight | null = null;
  public bungalowRevealTimer = -1;
  public passagePaperMeshes: THREE.Mesh[] = [];

  // Bungalow Entrance Door & Physical World Hammer Objects
  public bungalowDoorMesh: THREE.Group | null = null;
  public bungalowDoorLeftWing: THREE.Mesh | null = null;
  public bungalowDoorRightWing: THREE.Mesh | null = null;
  public bungalowDoorOpenProgress: number = 0;
  public isBungalowDoorOpening: boolean = false;
  public bungalowDoorCollider: THREE.Box3 | null = null;
  public bungalowHammerMesh: THREE.Group | null = null;
  public isHammerCollected: boolean = false;
  public bungalowDoorDamageLevel: number = 0;
  public woodSplinterParticles: THREE.Points | null = null;

  // Textures and procedural maps
  private textures: { [key: string]: THREE.Texture } = {};

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initTextures();
    this.setupLighting();
    this.buildTerrain();
    this.buildGateAndFence();
    this.buildHauntedPassage();
    this.buildMansion();
    this.buildForest();
    this.buildDistantAmbiguousShape();
    this.buildRitualElements();
    this.buildWoodenWalkwaysAndThresholds();
    this.setupRainAndAtmosphere();
  }

  private initTextures(): void {
    // 1. Procedural ground soil, moss, and gravel texture
    const groundCanvas = document.createElement('canvas');
    groundCanvas.width = 512;
    groundCanvas.height = 512;
    const ctx = groundCanvas.getContext('2d')!;
    ctx.fillStyle = '#282c26';
    ctx.fillRect(0, 0, 512, 512);

    // Varied patches of damp earth, decaying moss, and dark gravel
    for (let i = 0; i < 400; i++) {
      const px = Math.random() * 512;
      const py = Math.random() * 512;
      const rad = Math.random() * 30 + 10;
      const tone = Math.random();
      ctx.fillStyle = tone > 0.6 ? 'rgba(38, 48, 32, 0.45)' : tone > 0.3 ? 'rgba(48, 52, 46, 0.35)' : 'rgba(28, 32, 28, 0.4)';
      ctx.beginPath();
      ctx.arc(px, py, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // High frequency pebble and dirt speckling
    for (let i = 0; i < 18000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const shade = Math.floor(Math.random() * 45 + 32);
      ctx.fillStyle = `rgb(${shade}, ${Math.floor(shade * 0.95)}, ${Math.floor(shade * 0.85)})`;
      ctx.fillRect(x, y, Math.random() * 2.5 + 1, Math.random() * 2.5 + 1);
    }
    const groundTex = new THREE.CanvasTexture(groundCanvas);
    groundTex.wrapS = THREE.RepeatWrapping;
    groundTex.wrapT = THREE.RepeatWrapping;
    groundTex.repeat.set(12, 12);
    this.textures.ground = groundTex;

    // 2. Procedural muddy pathway texture with wheel ruts and wet puddle sheen
    const pathCanvas = document.createElement('canvas');
    pathCanvas.width = 256;
    pathCanvas.height = 1024;
    const pctx = pathCanvas.getContext('2d')!;
    pctx.fillStyle = '#2a2e29';
    pctx.fillRect(0, 0, 256, 1024);

    // Left and right worn trail ruts
    pctx.fillStyle = 'rgba(24, 28, 24, 0.55)';
    pctx.fillRect(40, 0, 48, 1024);
    pctx.fillRect(168, 0, 48, 1024);

    // Wet puddle areas with soft sheen borders
    for (let i = 0; i < 16; i++) {
      const py = Math.random() * 950 + 20;
      const px = 60 + Math.random() * 130;
      const gradPuddle = pctx.createRadialGradient(px, py, 5, px, py, 35 + Math.random() * 25);
      gradPuddle.addColorStop(0, 'rgba(20, 24, 22, 0.85)');
      gradPuddle.addColorStop(0.7, 'rgba(32, 38, 34, 0.4)');
      gradPuddle.addColorStop(1, 'rgba(42, 46, 41, 0)');
      pctx.fillStyle = gradPuddle;
      pctx.beginPath();
      pctx.ellipse(px, py, 25 + Math.random() * 20, 40 + Math.random() * 30, 0, 0, Math.PI * 2);
      pctx.fill();
    }

    // Dirt pebbles on the pathway
    for (let i = 0; i < 6000; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 1024;
      const shade = Math.floor(Math.random() * 40 + 35);
      pctx.fillStyle = `rgb(${shade}, ${Math.floor(shade * 0.95)}, ${Math.floor(shade * 0.88)})`;
      pctx.fillRect(x, y, Math.random() * 2 + 1, Math.random() * 2 + 1);
    }
    const pathTex = new THREE.CanvasTexture(pathCanvas);
    pathTex.wrapS = THREE.RepeatWrapping;
    pathTex.wrapT = THREE.RepeatWrapping;
    pathTex.repeat.set(1, 6);
    this.textures.path = pathTex;

    // 3. Procedural fog puff texture
    const fogCanvas = document.createElement('canvas');
    fogCanvas.width = 256;
    fogCanvas.height = 256;
    const fctx = fogCanvas.getContext('2d')!;
    const grad = fctx.createRadialGradient(128, 128, 10, 128, 128, 120);
    grad.addColorStop(0, 'rgba(180, 200, 225, 0.38)');
    grad.addColorStop(0.5, 'rgba(120, 140, 165, 0.18)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    fctx.fillStyle = grad;
    fctx.fillRect(0, 0, 256, 256);
    const fogTex = new THREE.CanvasTexture(fogCanvas);
    this.textures.fog = fogTex;

    // 4. Procedural weathered estate plaque "THE HOUSE OF DEVIL"
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 512;
    signCanvas.height = 256;
    const sctx = signCanvas.getContext('2d')!;

    // Tarnished bronze / dark oxidized brass base
    sctx.fillStyle = '#221f19';
    sctx.fillRect(0, 0, 512, 256);

    // Verdigris and dark grime patches
    for (let i = 0; i < 280; i++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 256;
      const rad = Math.random() * 35 + 8;
      const vTone = Math.random();
      sctx.fillStyle =
        vTone > 0.65
          ? 'rgba(36, 62, 48, 0.45)'
          : vTone > 0.3
          ? 'rgba(24, 34, 28, 0.55)'
          : 'rgba(14, 12, 10, 0.7)';
      sctx.beginPath();
      sctx.arc(rx, ry, rad, 0, Math.PI * 2);
      sctx.fill();
    }

    // Heavy metallic bevel border frame
    sctx.strokeStyle = '#4a3c28';
    sctx.lineWidth = 14;
    sctx.strokeRect(10, 10, 492, 236);
    sctx.strokeStyle = '#181512';
    sctx.lineWidth = 4;
    sctx.strokeRect(18, 18, 476, 220);

    // Rusted screw rivets in four corners
    for (const [cx, cy] of [
      [24, 24],
      [488, 24],
      [24, 232],
      [488, 232],
    ]) {
      sctx.fillStyle = '#14110e';
      sctx.beginPath();
      sctx.arc(cx, cy, 7, 0, Math.PI * 2);
      sctx.fill();
      sctx.strokeStyle = '#483a28';
      sctx.lineWidth = 2;
      sctx.stroke();
    }

    // Text: THE HOUSE OF DEVIL
    sctx.textAlign = 'center';
    sctx.textBaseline = 'middle';

    // Embossed shadow
    sctx.font = 'bold 28px "Cinzel", "Cinzel Decorative", "Times New Roman", serif';
    sctx.fillStyle = 'rgba(8, 8, 8, 0.95)';
    sctx.fillText('THE HOUSE OF', 258, 92);
    sctx.font = '900 52px "Cinzel", "Cinzel Decorative", "Times New Roman", serif';
    sctx.fillText('DEVIL', 258, 155);

    // Faded, weathered gold/brass relief lettering
    sctx.font = 'bold 28px "Cinzel", "Cinzel Decorative", "Times New Roman", serif';
    sctx.fillStyle = '#947a4c';
    sctx.fillText('THE HOUSE OF', 256, 90);
    sctx.font = '900 52px "Cinzel", "Cinzel Decorative", "Times New Roman", serif';
    sctx.fillStyle = '#b59758';
    sctx.fillText('DEVIL', 256, 153);

    // Weathering scratches and diagonal fracture cut across "DEVIL"
    sctx.strokeStyle = 'rgba(20, 16, 12, 0.95)';
    sctx.lineWidth = 3.5;
    sctx.beginPath();
    sctx.moveTo(95, 60);
    sctx.lineTo(420, 205);
    sctx.stroke();

    sctx.lineWidth = 2;
    sctx.beginPath();
    sctx.moveTo(175, 185);
    sctx.lineTo(345, 115);
    sctx.stroke();

    const signTex = new THREE.CanvasTexture(signCanvas);
    this.textures.gateSign = signTex;

    // 5. Procedural Weathered Handwritten Gate Note
    // Weathered, aged yellow parchment with water damage, blood/tea stains, and faded ink
    const noteCanvas = document.createElement('canvas');
    noteCanvas.width = 512;
    noteCanvas.height = 512;
    const nctx = noteCanvas.getContext('2d')!;

    // Aged parchment base
    nctx.fillStyle = '#bda983';
    nctx.fillRect(0, 0, 512, 512);

    // Weathered water stains and grimy mottled patches
    for (let i = 0; i < 260; i++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 512;
      const rad = Math.random() * 50 + 8;
      nctx.fillStyle = Math.random() > 0.45 ? 'rgba(110, 88, 56, 0.16)' : 'rgba(65, 48, 30, 0.22)';
      nctx.beginPath();
      nctx.arc(rx, ry, rad, 0, Math.PI * 2);
      nctx.fill();
    }

    // Burnt, torn, ragged border edges
    nctx.fillStyle = '#3a2d1d';
    nctx.fillRect(0, 0, 512, 16);
    nctx.fillRect(0, 496, 512, 16);
    nctx.fillRect(0, 0, 16, 512);
    nctx.fillRect(496, 0, 16, 512);

    // Diagonal and vertical crease folds
    nctx.strokeStyle = 'rgba(50, 38, 22, 0.45)';
    nctx.lineWidth = 2.5;
    nctx.beginPath();
    nctx.moveTo(0, 248);
    nctx.lineTo(512, 256);
    nctx.moveTo(254, 0);
    nctx.lineTo(260, 512);
    nctx.stroke();

    // Rusted iron bent nail head at top center
    nctx.fillStyle = '#1c1611';
    nctx.beginPath();
    nctx.arc(256, 30, 12, 0, Math.PI * 2);
    nctx.fill();
    nctx.strokeStyle = '#5a4630';
    nctx.lineWidth = 3;
    nctx.stroke();

    // Main Text: "ARE YOU REALLY SURE / YOU WANT TO GO INSIDE?"
    nctx.fillStyle = '#1c1510';
    nctx.textAlign = 'center';
    nctx.font = 'bold 30px "Cinzel", "Times New Roman", serif, Georgia';
    nctx.fillText('ARE YOU REALLY SURE', 256, 145);
    nctx.fillText('YOU WANT TO GO INSIDE?', 256, 192);

    // Underneath, in smaller faded handwriting:
    // "TWO FLAMES BURN. / THE THIRD WAITS UNSEEN."
    nctx.fillStyle = 'rgba(46, 32, 20, 0.82)';
    nctx.font = 'italic 23px "Georgia", serif';
    nctx.fillText('TWO FLAMES BURN.', 256, 335);
    nctx.fillText('THE THIRD WAITS UNSEEN.', 256, 375);

    const noteTex = new THREE.CanvasTexture(noteCanvas);
    this.textures.gateNote = noteTex;
  }

  private setupLighting(): void {
    // 1. Two-tone Hemisphere light: cool midnight blue from the night sky, warm earthy charcoal bounce from ground
    // Prevents crushed pure-black shadows while preserving cinematic dark atmosphere
    this.hemiLight = new THREE.HemisphereLight(0x40526e, 0x242018, 0.95);
    this.scene.add(this.hemiLight);

    // 2. Dark ambient light for subtle environmental fill
    this.ambientLight = new THREE.AmbientLight(0x283446, 0.85);
    this.scene.add(this.ambientLight);

    // 3. Pale directional moonlight cutting through the mist at a forward-side angle
    // Glances across the ground creating puddle specular sheen and rimming trees and gate
    this.moonLight = new THREE.DirectionalLight(0x768dae, 1.45);
    this.moonLight.position.set(22, 38, -12);
    this.moonLight.target.position.set(0, 0, -15);
    this.scene.add(this.moonLight.target);
    this.moonLight.castShadow = true;
    this.moonLight.shadow.mapSize.width = 1024;
    this.moonLight.shadow.mapSize.height = 1024;
    this.moonLight.shadow.camera.near = 2;
    this.moonLight.shadow.camera.far = 120;
    this.moonLight.shadow.camera.left = -45;
    this.moonLight.shadow.camera.right = 45;
    this.moonLight.shadow.camera.top = 45;
    this.moonLight.shadow.camera.bottom = -45;
    this.moonLight.shadow.bias = -0.0004;
    this.scene.add(this.moonLight);

    // 4. Dramatic Gate Rim Backlight: moonlight from behind the gate outlines the massive iron silhouette, spikes, horns, and central emblem
    this.gateRimLight = new THREE.DirectionalLight(0x7090bb, 1.25);
    this.gateRimLight.position.set(-6, 14, -36);
    this.gateRimLight.target.position.set(0, 3.4, -22);
    this.scene.add(this.gateRimLight.target);
    this.scene.add(this.gateRimLight);

    // 5. Soft fill light at the gate: ensures rusty iron, carved stone, and the "THE HOUSE OF DEVIL" sign are clearly readable
    this.gateFillLight = new THREE.PointLight(0x526b8d, 0.95, 26, 2.0);
    this.gateFillLight.position.set(0, 3.2, -17.5);
    this.scene.add(this.gateFillLight);

    // 6. Flickering broken carriage lantern on the right pillar
    this.pillarLanternLight = new THREE.PointLight(0xff9944, 0.85, 14, 2.0);
    this.pillarLanternLight.position.set(3.8, 6.0, -21.0);
    this.scene.add(this.pillarLanternLight);

    // 7. Sudden lightning flash source
    this.lightningLight = new THREE.DirectionalLight(0xccd8f0, 0.0);
    this.lightningLight.position.set(-15, 60, -10);
    this.scene.add(this.lightningLight);

    // 8. Bungalow Facade Subtle Moonlit Fill: reveals roof silhouette, veranda pillars, and walls through the gate bars
    const bungalowMoonLight = new THREE.DirectionalLight(0x647e9e, 0.95);
    bungalowMoonLight.position.set(12, 28, -28);
    bungalowMoonLight.target.position.set(0, 6.0, -66);
    this.scene.add(bungalowMoonLight.target);
    this.scene.add(bungalowMoonLight);

    // 9. Bungalow attic eerie window light
    this.atticLight = new THREE.PointLight(0xff6622, 1.2, 32, 1.8);
    this.atticLight.position.set(0, 12.5, -59);
    this.scene.add(this.atticLight);
  }

  private buildTerrain(): void {
    // Main terrain plane
    const groundGeo = new THREE.PlaneGeometry(120, 120, 64, 64);
    // Slight undulation
    const pos = groundGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      // Keep center path flat, bumps on edges
      const distFromCenter = Math.abs(x);
      const bump = distFromCenter > 4 ? Math.sin(x * 0.15) * Math.cos(y * 0.15) * 0.4 : 0;
      pos.setZ(i, bump);
    }
    groundGeo.computeVertexNormals();

    // Dark earthy charcoal ground with visible dirt/moss texture under moonlight
    const groundMat = new THREE.MeshStandardMaterial({
      map: this.textures.ground,
      roughness: 0.82,
      metalness: 0.1,
      color: 0x363c36,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    this.scene.add(groundMesh);

    // Muddy path with wet puddle sheen and specular reflection
    const pathGeo = new THREE.PlaneGeometry(7.5, 90);
    const pathMat = new THREE.MeshStandardMaterial({
      map: this.textures.path,
      color: 0x383e38,
      roughness: 0.28, // wet puddles catch moonlight and flashlight
      metalness: 0.28,
    });
    const pathMesh = new THREE.Mesh(pathGeo, pathMat);
    pathMesh.rotation.x = -Math.PI / 2;
    pathMesh.position.set(0, 0.02, -10);
    pathMesh.receiveShadow = true;
    this.scene.add(pathMesh);

    // Scattered roadside stones and dead grass tufts along the path edge
    const stoneGeo = new THREE.DodecahedronGeometry(0.24, 0);
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x3a4248,
      roughness: 0.88,
      metalness: 0.15,
    });

    // Place natural rocks, overgrown weeds, and scattered autumn leaves along both path shoulders
    const weedGeo = new THREE.ConeGeometry(0.18, 0.45, 4);
    const weedMat = new THREE.MeshStandardMaterial({
      color: 0x2e3526,
      roughness: 0.9,
    });

    const leafGeo = new THREE.PlaneGeometry(0.18, 0.22);
    const leafMat1 = new THREE.MeshStandardMaterial({
      color: 0x583d25,
      roughness: 0.85,
      side: THREE.DoubleSide,
    });
    const leafMat2 = new THREE.MeshStandardMaterial({
      color: 0x422f1c,
      roughness: 0.88,
      side: THREE.DoubleSide,
    });

    const rockInstanced = new THREE.InstancedMesh(stoneGeo, stoneMat, 36);
    const weedInstanced = new THREE.InstancedMesh(weedGeo, weedMat, 36);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < 36; i++) {
      const isRight = i % 2 === 0;
      const rockX = (isRight ? 3.7 : -3.7) + (Math.random() * 1.8 - 0.2) * (isRight ? 1 : -1);
      const rockZ = 14 - (i / 36) * 34 + (Math.random() - 0.5) * 1.5;
      const s = 0.6 + Math.random() * 0.9;
      dummy.scale.set(s, s * 0.65, s);
      dummy.position.set(rockX, 0.08 * s, rockZ);
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      dummy.updateMatrix();
      rockInstanced.setMatrixAt(i, dummy.matrix);

      // Overgrown grass/weed tufts
      dummy.scale.set(1, 1, 1);
      dummy.position.set(rockX + (Math.random() - 0.5) * 0.8, 0.22, rockZ + (Math.random() - 0.5) * 0.8);
      dummy.rotation.set(0, Math.random() * Math.PI, (Math.random() - 0.5) * 0.3);
      dummy.updateMatrix();
      weedInstanced.setMatrixAt(i, dummy.matrix);
    }
    rockInstanced.instanceMatrix.needsUpdate = true;
    weedInstanced.instanceMatrix.needsUpdate = true;
    this.scene.add(rockInstanced);
    this.scene.add(weedInstanced);

    // Scattered dead leaves on path
    const leavesInstanced = new THREE.InstancedMesh(leafGeo, leafMat1, 45);
    for (let l = 0; l < 45; l++) {
      const lx = (Math.random() - 0.5) * 6.5;
      const lz = 15 - Math.random() * 65;
      dummy.scale.set(1, 1, 1);
      dummy.position.set(lx, 0.03, lz);
      dummy.rotation.set(-Math.PI / 2, 0, Math.random() * Math.PI);
      dummy.updateMatrix();
      leavesInstanced.setMatrixAt(l, dummy.matrix);
    }
    leavesInstanced.instanceMatrix.needsUpdate = true;
    this.scene.add(leavesInstanced);
  }

  private buildGateAndFence(): void {
    this.gateGroup = new THREE.Group();
    this.gateGroup.position.copy(this.gatePosition);

    // 1. Weathered Architectural Materials
    // Aged, damp, cracked colonial granite stone
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x363d43,
      roughness: 0.9,
      metalness: 0.06,
    });

    const stoneCarvedMat = new THREE.MeshStandardMaterial({
      color: 0x2b3136,
      roughness: 0.92,
      metalness: 0.04,
    });

    const stoneDarkFissureMat = new THREE.MeshStandardMaterial({
      color: 0x161a1d,
      roughness: 0.98,
      metalness: 0.02,
    });

    // Dark, heavily rusted Victorian wrought iron with specular sheen
    const ironMat = new THREE.MeshStandardMaterial({
      color: 0x272e34,
      roughness: 0.56,
      metalness: 0.74,
    });

    // Flaking burnt orange/brown oxidation rust
    const rustMat = new THREE.MeshStandardMaterial({
      color: 0x543621,
      roughness: 0.88,
      metalness: 0.32,
    });

    // Chipped scratched metal highlights
    const scratchedMat = new THREE.MeshStandardMaterial({
      color: 0x3d4349,
      roughness: 0.48,
      metalness: 0.82,
    });

    // Damp blackened moss and clinging vines
    const mossMat = new THREE.MeshStandardMaterial({
      color: 0x182419,
      roughness: 0.95,
    });

    const vineMat = new THREE.MeshStandardMaterial({
      color: 0x212d1e,
      roughness: 0.92,
    });

    // Dirty antique lantern glass
    const lanternGlassMat = new THREE.MeshStandardMaterial({
      color: 0x6e624b,
      roughness: 0.35,
      metalness: 0.1,
      transparent: true,
      opacity: 0.45,
    });

    // 2. Weathered Stone Gate Pillars (Scaled ~7.9m for natural proportion)
    const pillarPositions = [-3.8, 3.8];

    for (const px of pillarPositions) {
      const isLeft = px < 0;
      const pillarGroup = new THREE.Group();
      pillarGroup.position.set(px, 0, 0);

      // Monumental tiered plinth base (width 2.0m x 0.7m x 2.0m)
      const baseGeo = new THREE.BoxGeometry(2.0, 0.7, 2.0);
      const base = new THREE.Mesh(baseGeo, stoneMat);
      base.position.set(0, 0.35, 0);
      base.castShadow = true;
      base.receiveShadow = true;
      pillarGroup.add(base);

      // Main pillar shaft (1.7m x 5.8m x 1.7m)
      const shaftGeo = new THREE.BoxGeometry(1.7, 5.8, 1.7);
      const shaft = new THREE.Mesh(shaftGeo, stoneMat);
      shaft.position.set(0, 3.6, 0);
      shaft.castShadow = true;
      shaft.receiveShadow = true;
      pillarGroup.add(shaft);

      // Carved recessed architectural panels on front and sides
      for (const rotY of [0, Math.PI / 2, -Math.PI / 2]) {
        const panelGeo = new THREE.BoxGeometry(1.2, 5.0, 0.08);
        const panel = new THREE.Mesh(panelGeo, stoneCarvedMat);
        panel.position.set(0, 3.6, 0);
        panel.rotation.y = rotY;
        panel.translateZ(0.85);
        pillarGroup.add(panel);
      }

      // Damaged/chipped corner blocks (weather and impact gouges)
      const chipGeo1 = new THREE.BoxGeometry(0.28, 0.4, 0.28);
      const chip1 = new THREE.Mesh(chipGeo1, stoneDarkFissureMat);
      chip1.position.set(isLeft ? 0.76 : -0.76, 2.2, 0.76);
      pillarGroup.add(chip1);

      const chipGeo2 = new THREE.BoxGeometry(0.32, 0.5, 0.32);
      const chip2 = new THREE.Mesh(chipGeo2, stoneDarkFissureMat);
      chip2.position.set(isLeft ? -0.74 : 0.74, 4.8, 0.74);
      pillarGroup.add(chip2);

      // Deep fracture cracks running down the stone face
      const crackGeo = new THREE.BoxGeometry(0.035, 2.4, 0.035);
      const crack = new THREE.Mesh(crackGeo, stoneDarkFissureMat);
      crack.position.set(isLeft ? 0.35 : -0.35, 3.8, 0.88);
      crack.rotation.z = isLeft ? 0.2 : -0.16;
      pillarGroup.add(crack);

      // Carved tiered capital cornice (1.9m x 0.4m x 1.9m)
      const corniceGeo = new THREE.BoxGeometry(1.9, 0.4, 1.9);
      const cornice = new THREE.Mesh(corniceGeo, stoneMat);
      cornice.position.set(0, 6.7, 0);
      cornice.castShadow = true;
      pillarGroup.add(cornice);

      // Pyramidal finial cap reaching up to ~7.9m
      const capGeo = new THREE.ConeGeometry(1.2, 1.0, 4);
      const cap = new THREE.Mesh(capGeo, stoneMat);
      cap.position.set(0, 7.4, 0);
      cap.rotation.y = Math.PI / 4;
      cap.castShadow = true;
      pillarGroup.add(cap);

      // Dark moisture stains and black moss coating lower stone and seams
      for (let m = 0; m < 6; m++) {
        const mossTorus = new THREE.TorusGeometry(0.92 + (m % 2) * 0.04, 0.1, 6, 12);
        const moss = new THREE.Mesh(mossTorus, mossMat);
        moss.position.set(0, 0.6 + m * 0.85, 0);
        moss.rotation.x = Math.PI / 2 + (m * 0.25);
        moss.rotation.z = m * 0.7;
        pillarGroup.add(moss);
      }

      // Thick gnarled woody vines twisting up the stone pillars
      for (let v = 0; v < 5; v++) {
        const vineArmGeo = new THREE.CylinderGeometry(0.035, 0.05, 1.5, 5);
        const vineArm = new THREE.Mesh(vineArmGeo, vineMat);
        vineArm.position.set(
          (Math.sin(v * 1.3) * 0.65 + 0.25) * (isLeft ? 1 : -1),
          1.2 + v * 0.95,
          Math.cos(v * 1.3) * 0.65 + 0.25
        );
        vineArm.rotation.z = (Math.sin(v) * 0.3 + 0.1) * (isLeft ? 1 : -1);
        vineArm.rotation.y = v * 0.8;
        pillarGroup.add(vineArm);
      }

      // Small Broken Lanterns Mounted on Pillars
      if (isLeft) {
        // Left Pillar: Mounted Plaque "THE HOUSE OF DEVIL"
        const signMat = new THREE.MeshStandardMaterial({
          map: this.textures.gateSign,
          roughness: 0.5,
          metalness: 0.7,
        });
        const signGeo = new THREE.BoxGeometry(1.15, 0.58, 0.05);
        const signMesh = new THREE.Mesh(signGeo, signMat);
        signMesh.position.set(0, 2.9, 0.88);
        signMesh.castShadow = true;
        pillarGroup.add(signMesh);

        // Shattered vintage carriage lantern on iron scroll bracket
        const bracketGeo = new THREE.BoxGeometry(0.07, 0.5, 0.38);
        const bracket = new THREE.Mesh(bracketGeo, rustMat);
        bracket.position.set(0, 5.8, 1.0);
        pillarGroup.add(bracket);

        const cageGeo = new THREE.BoxGeometry(0.36, 0.55, 0.36);
        const cage = new THREE.Mesh(cageGeo, rustMat);
        cage.position.set(0, 5.5, 1.25);
        cage.rotation.z = 0.22; // dangling crooked
        cage.rotation.y = -0.28;
        pillarGroup.add(cage);
      } else {
        // Right Pillar: Vintage carriage lantern with dying flickering filament
        const bracketGeo = new THREE.BoxGeometry(0.07, 0.5, 0.38);
        const bracket = new THREE.Mesh(bracketGeo, rustMat);
        bracket.position.set(0, 5.8, 1.0);
        pillarGroup.add(bracket);

        const cageGeo = new THREE.BoxGeometry(0.38, 0.58, 0.38);
        const cage = new THREE.Mesh(cageGeo, ironMat);
        cage.position.set(0, 5.5, 1.25);
        cage.rotation.z = -0.1; // slightly askew
        cage.rotation.y = 0.14;
        pillarGroup.add(cage);

        const glassGeo = new THREE.BoxGeometry(0.32, 0.46, 0.32);
        const glass = new THREE.Mesh(glassGeo, lanternGlassMat);
        glass.position.set(0, 5.5, 1.25);
        glass.rotation.z = -0.1;
        pillarGroup.add(glass);

        // Dying filament bulb inside
        const bulbGeo = new THREE.SphereGeometry(0.07, 8, 8);
        const bulbMat = new THREE.MeshStandardMaterial({
          color: 0xffaa44,
          emissive: 0xff7722,
          emissiveIntensity: 1.2,
          roughness: 0.2,
        });
        this.pillarLanternBulb = new THREE.Mesh(bulbGeo, bulbMat);
        this.pillarLanternBulb.position.set(0, 5.5, 1.25);
        pillarGroup.add(this.pillarLanternBulb);
      }

      this.gateGroup.add(pillarGroup);
    }

    // 3. Victorian Wrought-Iron Double Doors (Total Span: ~7.0m, Height: ~6.65m with Spikes)
    this.leftGateWing = new THREE.Group();
    this.leftGateWing.position.set(-3.5, 0, 0);
    this.buildGateWing(this.leftGateWing, ironMat, rustMat, scratchedMat, mossMat, vineMat, true);
    this.gateGroup.add(this.leftGateWing);

    this.rightGateWing = new THREE.Group();
    this.rightGateWing.position.set(3.5, 0, 0);
    this.buildGateWing(this.rightGateWing, ironMat, rustMat, scratchedMat, mossMat, vineMat, false);
    this.gateGroup.add(this.rightGateWing);

    // 4. Chains, Padlock & The Swaying Wind Detail in the Center
    this.buildChainsAndPadlock(rustMat, scratchedMat, ironMat);

    // 5. Perimeter Iron Railing Fence extending left and right
    const fenceSpan = 42;
    this.buildFenceSection(-3.8, -fenceSpan, stoneMat, ironMat, vineMat);
    this.buildFenceSection(3.8, fenceSpan, stoneMat, ironMat, vineMat);

    this.scene.add(this.gateGroup);

    // 6. Precise Physical Colliders so Player Cannot Walk Through Gate or Fence
    this.gateCollider = new THREE.Box3();
    this.gateCollider.setFromCenterAndSize(
      new THREE.Vector3(0, 3.5, this.gatePosition.z),
      new THREE.Vector3(7.6, 7.0, 2.0)
    );
    this.colliders.push(this.gateCollider);

    const leftFenceCollider = new THREE.Box3();
    leftFenceCollider.setFromCenterAndSize(
      new THREE.Vector3(-24, 3.0, this.gatePosition.z),
      new THREE.Vector3(40, 6.0, 2.0)
    );
    this.colliders.push(leftFenceCollider);

    const rightFenceCollider = new THREE.Box3();
    rightFenceCollider.setFromCenterAndSize(
      new THREE.Vector3(24, 3.0, this.gatePosition.z),
      new THREE.Vector3(40, 6.0, 2.0)
    );
    this.colliders.push(rightFenceCollider);

    const backBoundary = new THREE.Box3();
    backBoundary.setFromCenterAndSize(new THREE.Vector3(0, 4.0, 8), new THREE.Vector3(85, 8.0, 2.5));
    this.colliders.push(backBoundary);
  }

  /**
   * Constructs one of the massive Victorian wrought-iron gate doors:
   * Features uneven bent bars, sharp spikes, twisted demonic face/horn scrollwork,
   * thick vines, flaking rust, and half of the central dark circular devil emblem.
   */
  private buildGateWing(
    parent: THREE.Group,
    ironMat: THREE.Material,
    rustMat: THREE.Material,
    scratchedMat: THREE.Material,
    mossMat: THREE.Material,
    vineMat: THREE.Material,
    isLeft: boolean
  ): void {
    const dir = isLeft ? 1 : -1;
    const width = 3.5;

    // 1. Heavy Outer Hinge Post & Forged Hinges
    const hingePostGeo = new THREE.BoxGeometry(0.20, 6.4, 0.20);
    const hingePost = new THREE.Mesh(hingePostGeo, ironMat);
    hingePost.position.set(0, 3.2, 0);
    hingePost.castShadow = true;
    parent.add(hingePost);

    for (const hy of [1.0, 3.2, 5.4]) {
      const hingeBracketGeo = new THREE.BoxGeometry(0.28, 0.18, 0.24);
      const hingeBracket = new THREE.Mesh(hingeBracketGeo, rustMat);
      hingeBracket.position.set(-dir * 0.1, hy, 0);
      parent.add(hingeBracket);
    }

    // Heavy Inner Meeting Post (where the two doors meet in the center)
    const meetPostGeo = new THREE.BoxGeometry(0.18, 6.2, 0.18);
    const meetPost = new THREE.Mesh(meetPostGeo, ironMat);
    meetPost.position.set(dir * width, 3.1, 0);
    meetPost.castShadow = true;
    parent.add(meetPost);

    // 2. Four Horizontal Heavy Iron Rails
    // Bottom heavy sill rail
    const bRailGeo = new THREE.BoxGeometry(width, 0.18, 0.14);
    const bRail = new THREE.Mesh(bRailGeo, rustMat);
    bRail.position.set(dir * (width / 2), 0.5, 0);
    bRail.castShadow = true;
    parent.add(bRail);

    // Damp moss on bottom rail
    const mossStripGeo = new THREE.BoxGeometry(width * 0.95, 0.06, 0.18);
    const mossStrip = new THREE.Mesh(mossStripGeo, mossMat);
    mossStrip.position.set(dir * (width / 2), 0.6, 0);
    parent.add(mossStrip);

    // Low lattice rail
    const lowRailGeo = new THREE.BoxGeometry(width, 0.12, 0.12);
    const lowRail = new THREE.Mesh(lowRailGeo, ironMat);
    lowRail.position.set(dir * (width / 2), 1.7, 0);
    lowRail.castShadow = true;
    parent.add(lowRail);

    // Mid structural rail
    const midRailGeo = new THREE.BoxGeometry(width, 0.14, 0.14);
    const midRail = new THREE.Mesh(midRailGeo, ironMat);
    midRail.position.set(dir * (width / 2), 3.3, 0);
    midRail.castShadow = true;
    parent.add(midRail);

    // Top Arched Structural Crest Rail (curves upward toward the center seam)
    const topArcSegs = 8;
    for (let s = 0; s < topArcSegs; s++) {
      const segX = dir * ((s + 0.5) * (width / topArcSegs));
      const prog = (s + 0.5) / topArcSegs;
      // Parabolic arch: y rises from 5.4 at hinge to 6.1 at center
      const archY = 5.4 + Math.sin(prog * (Math.PI / 2)) * 0.7;
      const segGeo = new THREE.BoxGeometry(width / topArcSegs + 0.03, 0.13, 0.12);
      const seg = new THREE.Mesh(segGeo, ironMat);
      seg.position.set(segX, archY, 0);
      seg.rotation.z = dir * 0.15 * (1 - prog);
      seg.castShadow = true;
      parent.add(seg);
    }

    // 3. Lower Gothic Criss-Cross Iron Diamond Lattice (y = 0.5 to 1.7)
    const latCount = 6;
    for (let l = 0; l < latCount; l++) {
      const lx = dir * ((l + 0.5) * (width / latCount));
      const diagGeo = new THREE.BoxGeometry(0.045, 1.7, 0.045);

      const d1 = new THREE.Mesh(diagGeo, ironMat);
      d1.position.set(lx, 1.1, 0.02);
      d1.rotation.z = 0.65;
      parent.add(d1);

      const d2 = new THREE.Mesh(diagGeo, ironMat);
      d2.position.set(lx, 1.1, -0.02);
      d2.rotation.z = -0.65;
      parent.add(d2);
    }

    // 4. Vertical Spiked Bars (12 bars per door) with Bent, Broken, and Damaged Elements
    // Spaced well so the old haunted bungalow remains clearly recognizable through the bars
    const barCount = 12;
    const spikeHeadGeo = new THREE.ConeGeometry(0.08, 0.55, 4);
    const spikeBarbGeo = new THREE.BoxGeometry(0.15, 0.1, 0.035);

    for (let i = 1; i < barCount; i++) {
      const prog = i / barCount;
      const xPos = dir * (prog * width);
      // Height conforms to top arch
      const barTopY = 5.4 + Math.sin(prog * (Math.PI / 2)) * 0.7;
      const barHeight = barTopY - 0.5;
      const barGeo = new THREE.CylinderGeometry(0.042, 0.042, barHeight, 6);

      const bar = new THREE.Mesh(barGeo, i % 3 === 0 ? rustMat : ironMat);
      bar.position.set(xPos, 0.5 + barHeight / 2, 0);

      // Irregular, bent, and broken bar damage
      if (i === 5) {
        // Snapped/rusted-through bar! Broken off mid-height
        bar.scale.y = 0.5;
        bar.position.y = 0.5 + (barHeight * 0.5) / 2;
        bar.rotation.z = dir * 0.08;
      } else if (i === 8) {
        // Warped/bent bar
        bar.rotation.z = -dir * 0.1;
      } else if (i === 3) {
        bar.rotation.x = 0.05;
      } else {
        bar.rotation.z = (Math.sin(i * 3.7) * 0.02);
      }

      bar.castShadow = true;
      parent.add(bar);

      // Menacing Sharp Spikes along the top (omit if bar is broken)
      if (i !== 5) {
        const spikeGroup = new THREE.Group();
        spikeGroup.position.set(xPos, barTopY + 0.28, 0);

        const spike = new THREE.Mesh(spikeHeadGeo, scratchedMat);
        spike.rotation.y = Math.PI / 4;
        spikeGroup.add(spike);

        const barb = new THREE.Mesh(spikeBarbGeo, rustMat);
        barb.position.set(0, -0.16, 0);
        spikeGroup.add(barb);

        if (i === 8) {
          spikeGroup.rotation.z = -dir * 0.28; // bent spike
        }

        spikeGroup.castShadow = true;
        parent.add(spikeGroup);
      }
    }

    // 5. Twisted Demonic & Horned Scrollwork (Victorian Craftsmanship with Sinister Pareidolia)
    // Upper Crest: Sweeping Ram/Devil Horn Arches
    const hornArcGeo = new THREE.TorusGeometry(1.15, 0.065, 8, 22, Math.PI * 0.68);
    const hornArc = new THREE.Mesh(hornArcGeo, ironMat);
    hornArc.position.set(dir * (width * 0.62), 4.9, 0);
    hornArc.rotation.z = isLeft ? 0.35 : Math.PI - 0.35;
    hornArc.scale.set(1.1, 1.3, 1.0);
    hornArc.castShadow = true;
    parent.add(hornArc);

    const innerHornGeo = new THREE.TorusGeometry(0.65, 0.05, 6, 16, Math.PI * 0.6);
    const innerHorn = new THREE.Mesh(innerHornGeo, rustMat);
    innerHorn.position.set(dir * (width * 0.72), 5.15, 0.02);
    innerHorn.rotation.z = isLeft ? 0.45 : Math.PI - 0.45;
    parent.add(innerHorn);

    // Mid-tier Distorted Visage Features (Sunken Eye Sockets & Brow Keystone)
    const eyeSocketGeo = new THREE.TorusGeometry(0.28, 0.045, 8, 14);
    const eyeSocket = new THREE.Mesh(eyeSocketGeo, ironMat);
    eyeSocket.position.set(dir * (width * 0.82), 4.1, 0);
    parent.add(eyeSocket);

    const browKeystoneGeo = new THREE.BoxGeometry(0.15, 0.5, 0.1);
    const browKeystone = new THREE.Mesh(browKeystoneGeo, rustMat);
    browKeystone.position.set(dir * (width * 0.94), 3.95, 0.04);
    browKeystone.rotation.z = dir * 0.14;
    parent.add(browKeystone);

    // Lower Ribcage / Gaping Maw Ribs
    for (let r = 0; r < 3; r++) {
      const ribGeo = new THREE.TorusGeometry(0.42 + r * 0.18, 0.038, 6, 12, Math.PI * 0.5);
      const rib = new THREE.Mesh(ribGeo, rustMat);
      rib.position.set(dir * (width * 0.65), 2.4 + r * 0.28, 0);
      rib.rotation.z = isLeft ? -0.4 : Math.PI + 0.4;
      parent.add(rib);
    }

    // 6. Central Dark Circular Iron Emblem (Half attached to each door wing)
    // Centered at meeting seam (x = dir * width), y = 2.9m
    this.buildHalfEmblem(parent, dir, width, ironMat, rustMat, scratchedMat);

    // 7. Gnarled Creeping Vines growing through the bars
    for (let v = 0; v < 4; v++) {
      const vineRingGeo = new THREE.TorusGeometry(0.24 + (v % 2) * 0.08, 0.045, 6, 12);
      const vineRing = new THREE.Mesh(vineRingGeo, vineMat);
      vineRing.position.set(dir * (0.9 + v * 0.6), 1.0 + v * 0.55, (v % 2 ? 0.05 : -0.05));
      vineRing.rotation.x = Math.PI / 2 + (v * 0.3);
      vineRing.rotation.z = v * 0.75;
      parent.add(vineRing);
    }
  }

  /**
   * Builds one half of the dark circular iron devil emblem onto a gate door wing.
   * When both wings are shut, the two halves unite into an intimidating 1.84m diameter horned emblem.
   */
  private buildHalfEmblem(
    parent: THREE.Group,
    dir: number,
    width: number,
    ironMat: THREE.Material,
    rustMat: THREE.Material,
    scratchedMat: THREE.Material
  ): void {
    const emblemCenter = new THREE.Vector3(dir * width, 2.9, 0);
    const radius = 0.92;

    // Outer Heavy Rim Arc (Semi-circle Torus)
    const rimGeo = new THREE.TorusGeometry(radius, 0.065, 10, 22, Math.PI);
    const rim = new THREE.Mesh(rimGeo, ironMat);
    rim.position.copy(emblemCenter);
    // Face toward center seam
    rim.rotation.z = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    rim.castShadow = true;
    parent.add(rim);

    // Hammered Iron Rivet Studs along perimeter
    for (let st = 0; st < 5; st++) {
      const angle = (st / 4) * Math.PI - Math.PI / 2;
      const studGeo = new THREE.SphereGeometry(0.04, 6, 6);
      const stud = new THREE.Mesh(studGeo, scratchedMat);
      stud.position.set(
        emblemCenter.x - dir * Math.cos(angle) * radius,
        emblemCenter.y + Math.sin(angle) * radius,
        0.05
      );
      parent.add(stud);
    }

    // Inner Devil-Inspired Silhouette Motifs:
    // Sweeping Horn Arc curling inward from the top rim
    const hornGeo = new THREE.TorusGeometry(0.52, 0.055, 8, 16, Math.PI * 0.75);
    const horn = new THREE.Mesh(hornGeo, rustMat);
    horn.position.set(emblemCenter.x - dir * 0.32, emblemCenter.y + 0.18, 0.02);
    horn.rotation.z = dir > 0 ? -0.4 : Math.PI + 0.4;
    horn.castShadow = true;
    parent.add(horn);

    // Angular Inverted Crest / Ram-Skull Wedge
    const wedgeGeo = new THREE.BoxGeometry(0.26, 0.55, 0.06);
    const wedge = new THREE.Mesh(wedgeGeo, ironMat);
    wedge.position.set(emblemCenter.x - dir * 0.15, emblemCenter.y - 0.12, 0.02);
    wedge.rotation.z = dir * 0.35;
    parent.add(wedge);

    // Barbed Radial Spokes connecting center to perimeter
    for (let sp = 0; sp < 3; sp++) {
      const spokeGeo = new THREE.BoxGeometry(radius * 0.8, 0.04, 0.04);
      const spoke = new THREE.Mesh(spokeGeo, ironMat);
      spoke.position.set(emblemCenter.x - dir * (radius * 0.4), emblemCenter.y, 0);
      spoke.rotation.z = dir * (0.45 + sp * 0.45);
      parent.add(spoke);
    }
  }

  /**
   * Builds the massive rusty chains and padlock binding the gate doors shut.
   * Includes swinging chain link group that responds dynamically to the cold night wind.
   */
  private buildChainsAndPadlock(
    rustMat: THREE.Material,
    scratchedMat: THREE.Material,
    ironMat: THREE.Material
  ): void {
    // 1. Heavy Forged Chain wrapped repeatedly around the center bars and emblem
    const chainTorusGeo = new THREE.TorusGeometry(0.28, 0.065, 8, 14);
    this.wrappedChainLinks = [];

    for (let c = 0; c < 7; c++) {
      const chainLink = new THREE.Mesh(chainTorusGeo, rustMat);
      chainLink.position.set(
        Math.sin(c * 1.1) * 0.14,
        2.6 + (c - 3) * 0.13,
        0.07 + (c % 2) * 0.07
      );
      chainLink.rotation.x = c * 0.75;
      chainLink.rotation.y = c * 0.45;
      chainLink.rotation.z = (c % 2 ? 0.3 : -0.3);
      chainLink.castShadow = true;
      this.gateGroup.add(chainLink);
      this.wrappedChainLinks.push(chainLink);
    }

    // 2. Rusted Vintage Padlock
    this.padlockGroup = new THREE.Group();
    this.padlockGroup.position.set(0, 2.45, 0.18);

    const lockBodyGeo = new THREE.BoxGeometry(0.42, 0.42, 0.18);
    const lockBody = new THREE.Mesh(lockBodyGeo, rustMat);
    lockBody.position.set(0, 0, 0);
    lockBody.castShadow = true;
    this.padlockGroup.add(lockBody);

    // Tarnished brass keyhole escutcheon plate
    const escutcheonGeo = new THREE.BoxGeometry(0.16, 0.22, 0.03);
    const escutcheonMat = new THREE.MeshStandardMaterial({
      color: 0x5a482b,
      roughness: 0.55,
      metalness: 0.75,
    });
    const escutcheon = new THREE.Mesh(escutcheonGeo, escutcheonMat);
    escutcheon.position.set(0, -0.02, 0.1);
    this.padlockGroup.add(escutcheon);

    // Keyhole slot
    const keyholeGeo = new THREE.BoxGeometry(0.035, 0.11, 0.02);
    const keyholeMat = new THREE.MeshBasicMaterial({ color: 0x0a0806 });
    const keyhole = new THREE.Mesh(keyholeGeo, keyholeMat);
    keyhole.position.set(0, -0.02, 0.12);
    this.padlockGroup.add(keyhole);

    // Heavy iron padlock shackle loop
    const shackleGeo = new THREE.TorusGeometry(0.18, 0.055, 8, 14, Math.PI);
    const shackle = new THREE.Mesh(shackleGeo, scratchedMat);
    shackle.position.set(0, 0.22, 0);
    shackle.rotation.z = Math.PI;
    this.padlockGroup.add(shackle);

    this.gateGroup.add(this.padlockGroup);

    // 3. Dynamic Swinging Chain: hangs loosely below the padlock and sways in the wind
    this.swingingChainGroup = new THREE.Group();
    this.swingingChainGroup.position.set(0, 2.2, 0.18);

    const looseLinkGeo = new THREE.TorusGeometry(0.14, 0.04, 8, 12);
    for (let l = 0; l < 4; l++) {
      const link = new THREE.Mesh(looseLinkGeo, rustMat);
      link.position.set(0, -l * 0.2, 0);
      link.rotation.y = (l % 2) * (Math.PI / 2);
      link.castShadow = true;
      this.swingingChainGroup.add(link);
    }
    this.gateGroup.add(this.swingingChainGroup);
  }

  private buildFenceSection(
    startX: number,
    endX: number,
    stoneMat: THREE.Material,
    ironMat: THREE.Material,
    vineMat: THREE.Material
  ): void {
    const dist = Math.abs(endX - startX);
    const step = 6.0;
    const dir = endX > startX ? 1 : -1;
    const count = Math.floor(dist / step);

    const pillarGeo = new THREE.BoxGeometry(0.9, 4.0, 0.9);
    const railGeo = new THREE.BoxGeometry(step, 0.08, 0.08);
    const barGeo = new THREE.CylinderGeometry(0.035, 0.035, 3.4);
    const vineTorus = new THREE.TorusGeometry(0.5, 0.07, 5, 8);

    const barsInSec = 8;
    const totalBars = count * barsInSec;
    const pillarsInstanced = new THREE.InstancedMesh(pillarGeo, stoneMat, count);
    const barsInstanced = new THREE.InstancedMesh(barGeo, ironMat, totalBars);
    const dummy = new THREE.Object3D();
    let barIdx = 0;

    for (let i = 0; i < count; i++) {
      const currentX = startX + dir * (i * step);
      const nextX = currentX + dir * step;

      // Stone pillar instance
      dummy.scale.set(1, 1, 1);
      dummy.rotation.set(0, 0, 0);
      dummy.position.set(nextX, 2.0, this.gatePosition.z);
      dummy.updateMatrix();
      pillarsInstanced.setMatrixAt(i, dummy.matrix);

      // Creeping vines on fence pillars
      if (i % 2 === 0) {
        const v = new THREE.Mesh(vineTorus, vineMat);
        v.position.set(nextX, 1.4, this.gatePosition.z);
        v.rotation.x = Math.PI / 2;
        v.rotation.z = i * 0.6;
        this.scene.add(v);
      }

      // Rails between pillars
      const midX = (currentX + nextX) / 2;
      const bRail = new THREE.Mesh(railGeo, ironMat);
      bRail.position.set(midX, 0.5, this.gatePosition.z);
      this.scene.add(bRail);

      const tRail = new THREE.Mesh(railGeo, ironMat);
      tRail.position.set(midX, 3.2, this.gatePosition.z);
      this.scene.add(tRail);

      // Bars with damaged / broken sections
      for (let b = 0; b < barsInSec; b++) {
        const bx = currentX + dir * ((b + 0.5) * (step / barsInSec));
        dummy.scale.set(1, 1, 1);
        dummy.rotation.set(0, 0, 0);
        dummy.position.set(bx, 1.8, this.gatePosition.z);

        // Broken fence section where bars are rusted through or bent
        if (i === 1 && b === 4) {
          dummy.scale.y = 0.35; // broken snapped bar
          dummy.position.set(bx, 0.8, this.gatePosition.z);
        } else if (i === 2 && b === 2) {
          dummy.rotation.z = 0.32; // bent rusted bar
        }

        dummy.updateMatrix();
        barsInstanced.setMatrixAt(barIdx++, dummy.matrix);
      }
    }

    pillarsInstanced.instanceMatrix.needsUpdate = true;
    barsInstanced.instanceMatrix.needsUpdate = true;
    this.scene.add(pillarsInstanced);
    this.scene.add(barsInstanced);
  }

  /**
   * THE HAUNTED PASSAGE:
   * A 24-meter claustrophobic corridor between two towering old stone walls (z = -22.5 to -46.5).
   * Left wall and right wall are 4.0m tall, width 2.9m.
   * Houses the 5 environmental story clues (posters) with readable handwritten notes and photos.
   * Features broken lantern brackets, dying flicker lantern, climbing vines, and physical Box3 colliders.
   * Flared courtyard wings at the end lead into the reveal of the Haunted Bungalow.
   */
  private buildHauntedPassage(): void {
    const passageGroup = new THREE.Group();

    // 1. Materials for walls, coping, mortar, bricks, and ground
    const leftWallMat = new THREE.MeshStandardMaterial({
      color: 0x48453f,
      roughness: 0.9,
      metalness: 0.05,
    });

    const rightWallMat = new THREE.MeshStandardMaterial({
      color: 0x4a423a,
      roughness: 0.88,
      metalness: 0.06,
    });

    const stoneCopingMat = new THREE.MeshStandardMaterial({
      color: 0x2c2b29,
      roughness: 0.92,
      metalness: 0.04,
    });

    const exposedBrickMat = new THREE.MeshStandardMaterial({
      color: 0x5a3428,
      roughness: 0.84,
      metalness: 0.08,
    });

    const timberBoardMat = new THREE.MeshStandardMaterial({
      color: 0x2b2219,
      roughness: 0.94,
      metalness: 0.04,
    });

    const rustedIronMat = new THREE.MeshStandardMaterial({
      color: 0x221b16,
      roughness: 0.72,
      metalness: 0.6,
    });

    const vineMat = new THREE.MeshStandardMaterial({
      color: 0x1d2919,
      roughness: 0.9,
      metalness: 0.02,
    });

    const waterPuddleMat = new THREE.MeshStandardMaterial({
      color: 0x181e22,
      roughness: 0.12,
      metalness: 0.82,
    });

    // 2. Main Corridor Walls (Length: 23m, from z = -23.0 to z = -46.0)
    // Left Wall: inner face at x = -1.45, center at x = -1.65, thickness 0.4
    const leftWallGeo = new THREE.BoxGeometry(0.4, 4.0, 23.0);
    const leftWall = new THREE.Mesh(leftWallGeo, leftWallMat);
    leftWall.position.set(-1.65, 2.0, -34.5);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    passageGroup.add(leftWall);

    // Left wall top coping
    const leftCopingGeo = new THREE.BoxGeometry(0.52, 0.2, 23.0);
    const leftCoping = new THREE.Mesh(leftCopingGeo, stoneCopingMat);
    leftCoping.position.set(-1.65, 4.1, -34.5);
    leftCoping.castShadow = true;
    passageGroup.add(leftCoping);

    // Right Wall: inner face at x = 1.45, center at x = 1.65, thickness 0.4
    const rightWallGeo = new THREE.BoxGeometry(0.4, 4.0, 23.0);
    const rightWall = new THREE.Mesh(rightWallGeo, rightWallMat);
    rightWall.position.set(1.65, 2.0, -34.5);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    passageGroup.add(rightWall);

    // Right wall top coping
    const rightCoping = new THREE.Mesh(leftCopingGeo, stoneCopingMat);
    rightCoping.position.set(1.65, 4.1, -34.5);
    rightCoping.castShadow = true;
    passageGroup.add(rightCoping);

    // 3. Entrance Funnel Wing Walls (connecting from main gate pillars at x = ±3.5, z = -22.0 to passage walls at x = ±1.65, z = -23.0)
    // Left entrance wing
    const leftWingGeo = new THREE.BoxGeometry(0.4, 4.0, 2.2);
    const leftEntranceWing = new THREE.Mesh(leftWingGeo, leftWallMat);
    leftEntranceWing.position.set(-2.55, 2.0, -22.4);
    leftEntranceWing.rotation.y = 0.98;
    leftEntranceWing.castShadow = true;
    passageGroup.add(leftEntranceWing);

    // Right entrance wing
    const rightEntranceWing = new THREE.Mesh(leftWingGeo, rightWallMat);
    rightEntranceWing.position.set(2.55, 2.0, -22.4);
    rightEntranceWing.rotation.y = -0.98;
    rightEntranceWing.castShadow = true;
    passageGroup.add(rightEntranceWing);

    // 4. Courtyard Exit Flared Wing Walls (connecting from passage walls at z = -46.0 to courtyard boundary at z = -49.0, x = ±8.0)
    const exitWingGeo = new THREE.BoxGeometry(0.4, 4.0, 7.5);
    const leftExitWing = new THREE.Mesh(exitWingGeo, leftWallMat);
    leftExitWing.position.set(-4.8, 2.0, -47.8);
    leftExitWing.rotation.y = -0.96;
    leftExitWing.castShadow = true;
    passageGroup.add(leftExitWing);

    const rightExitWing = new THREE.Mesh(exitWingGeo, rightWallMat);
    rightExitWing.position.set(4.8, 2.0, -47.8);
    rightExitWing.rotation.y = 0.96;
    rightExitWing.castShadow = true;
    passageGroup.add(rightExitWing);

    // 5. Exposed Brick & Distressed Detail Patches on Walls
    const brickPatchGeo = new THREE.BoxGeometry(0.04, 1.2, 2.6);
    // Patch on Left Wall
    const lPatch = new THREE.Mesh(brickPatchGeo, exposedBrickMat);
    lPatch.position.set(-1.43, 1.8, -30.5);
    passageGroup.add(lPatch);

    // Patch on Right Wall
    const rPatch = new THREE.Mesh(brickPatchGeo, exposedBrickMat);
    rPatch.position.set(1.43, 1.5, -34.8);
    passageGroup.add(rPatch);

    // 6. Old Decaying Timber Planks nailed over wall fissure at z = -29.0 on right wall
    const boardGeo = new THREE.BoxGeometry(0.04, 0.22, 1.8);
    for (let b = 0; b < 4; b++) {
      const plank = new THREE.Mesh(boardGeo, timberBoardMat);
      plank.position.set(1.43, 1.2 + b * 0.28, -29.0 + (b % 2 ? 0.08 : -0.06));
      plank.rotation.x = (b - 1.5) * 0.04;
      plank.rotation.z = (Math.random() - 0.5) * 0.05;
      passageGroup.add(plank);
    }

    // 7. Broken Wrought Iron Bracket on Left Wall (z = -33.5, y = 2.4)
    const bracketGroup = new THREE.Group();
    bracketGroup.position.set(-1.44, 2.4, -33.5);
    const bracketArm = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.45, 6), rustedIronMat);
    bracketArm.rotation.z = Math.PI / 2;
    bracketArm.position.set(0.22, 0, 0);
    bracketGroup.add(bracketArm);
    const bentEnd = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.015, 6, 8, Math.PI * 0.8), rustedIronMat);
    bentEnd.position.set(0.42, -0.04, 0);
    bracketGroup.add(bentEnd);
    passageGroup.add(bracketGroup);

    // 8. Corroded Wall Lantern on Right Wall (z = -38.5, y = 2.3)
    const lanternGroup = new THREE.Group();
    lanternGroup.position.set(1.44, 2.3, -38.5);

    const lBracket = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 6), rustedIronMat);
    lBracket.rotation.z = -Math.PI / 2;
    lBracket.position.set(-0.16, 0, 0);
    lanternGroup.add(lBracket);

    const lHousing = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.36, 0.24), rustedIronMat);
    lHousing.position.set(-0.35, -0.1, 0);
    lanternGroup.add(lHousing);

    // Weak amber filament bulb
    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0xffaa44,
      emissive: 0xff8822,
      emissiveIntensity: 1.2,
      roughness: 0.2,
    });
    this.passageLanternBulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), bulbMat);
    this.passageLanternBulb.position.set(-0.35, -0.1, 0);
    lanternGroup.add(this.passageLanternBulb);

    this.passageLanternLight = new THREE.PointLight(0xff9933, 0.55, 7.0, 2.0);
    this.passageLanternLight.position.set(1.1, 2.2, -38.5);
    this.scene.add(this.passageLanternLight);

    passageGroup.add(lanternGroup);

    // 9. Creeping Ivy & Vines hanging from the top coping
    const ivyTorusGeo = new THREE.TorusGeometry(0.4, 0.06, 6, 12);
    const ivyZPositions = [-25.0, -28.5, -35.0, -39.0, -43.5];
    ivyZPositions.forEach((iz, idx) => {
      const ivy = new THREE.Mesh(ivyTorusGeo, vineMat);
      const isLeft = idx % 2 === 0;
      ivy.position.set(isLeft ? -1.45 : 1.45, 3.8 - (idx % 3) * 0.4, iz);
      ivy.rotation.y = isLeft ? Math.PI / 2 : -Math.PI / 2;
      ivy.rotation.z = idx * 0.4;
      passageGroup.add(ivy);
    });

    // 10. Flagstone Pathway with Wet Puddle Reflections
    // Pathway pavers plane
    const pathGeo = new THREE.PlaneGeometry(2.86, 23.5);
    const pathMat = new THREE.MeshStandardMaterial({
      map: this.textures.ground,
      roughness: 0.86,
      metalness: 0.08,
    });
    const path = new THREE.Mesh(pathGeo, pathMat);
    path.rotation.x = -Math.PI / 2;
    path.position.set(0, 0.02, -34.75);
    path.receiveShadow = true;
    passageGroup.add(path);

    // Wet puddles with specular sheen
    const puddleGeo1 = new THREE.CircleGeometry(0.75, 16);
    const puddle1 = new THREE.Mesh(puddleGeo1, waterPuddleMat);
    puddle1.rotation.x = -Math.PI / 2;
    puddle1.position.set(-0.25, 0.03, -28.0);
    puddle1.scale.set(1.4, 0.9, 1.0);
    passageGroup.add(puddle1);

    const puddleGeo2 = new THREE.CircleGeometry(0.65, 16);
    const puddle2 = new THREE.Mesh(puddleGeo2, waterPuddleMat);
    puddle2.rotation.x = -Math.PI / 2;
    puddle2.position.set(0.35, 0.03, -37.5);
    puddle2.scale.set(1.2, 0.8, 1.0);
    passageGroup.add(puddle2);

    // 11. STORY POSTERS & CLUES: Placing the 5 Environmental Clues
    // Poster 1 (Arrival): Left Wall at z = -26.5
    // Poster 2 (Missing Person): Right Wall at z = -31.0
    // Poster 3 (Warning): Left Wall at z = -36.2
    // Poster 4 (Old Photograph): Right Wall at z = -40.8
    // Poster 5 (Character Connection): Left Wall at z = -44.5
    const posterPositions: { [key: string]: { x: number; y: number; z: number; isLeft: boolean; tilt: number } } = {
      poster_1: { x: -1.44, y: 1.65, z: -26.5, isLeft: true, tilt: 0.03 },
      poster_2: { x: 1.44, y: 1.65, z: -31.0, isLeft: false, tilt: -0.025 },
      poster_3: { x: -1.44, y: 1.62, z: -36.2, isLeft: true, tilt: -0.02 },
      poster_4: { x: 1.44, y: 1.68, z: -40.8, isLeft: false, tilt: 0.015 },
      poster_5: { x: -1.44, y: 1.65, z: -44.5, isLeft: true, tilt: 0.035 },
    };

    STORY_POSTERS.forEach((poster) => {
      const pos = posterPositions[poster.id];
      if (!pos) return;

      const pGroup = new THREE.Group();
      pGroup.position.set(pos.x, pos.y, pos.z);
      pGroup.rotation.y = pos.isLeft ? Math.PI / 2 : -Math.PI / 2;
      pGroup.rotation.z = pos.tilt;

      // Dark backing mount / torn cardboard
      const w = poster.type === 'POSTER_4' ? 0.66 : 0.58;
      const h = poster.type === 'POSTER_4' ? 0.54 : 0.78;
      const backGeo = new THREE.PlaneGeometry(w + 0.03, h + 0.03);
      const backMat = new THREE.MeshBasicMaterial({ color: 0x14100c, side: THREE.DoubleSide });
      const backing = new THREE.Mesh(backGeo, backMat);
      backing.position.z = -0.003;
      pGroup.add(backing);

      // Story Poster Canvas Mesh
      const texture = generatePosterCanvasTexture(poster);
      const paperGeo = new THREE.PlaneGeometry(w, h);
      const paperMat = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.88,
        metalness: 0.04,
        side: THREE.DoubleSide,
      });
      const paperMesh = new THREE.Mesh(paperGeo, paperMat);
      pGroup.add(paperMesh);
      this.passagePaperMeshes.push(paperMesh);

      // Pinned rusty nail / tack at top
      const nailHeadGeo = new THREE.CylinderGeometry(0.014, 0.01, 0.018, 8);
      const nail = new THREE.Mesh(nailHeadGeo, rustedIronMat);
      nail.rotation.x = Math.PI / 2;
      nail.position.set(0, h * 0.47, 0.01);
      pGroup.add(nail);

      passageGroup.add(pGroup);

      // Register story poster interaction data
      this.storyPosterMeshes.push({
        id: poster.id,
        type: poster.type,
        mesh: paperMesh,
        position: new THREE.Vector3(pos.x, pos.y, pos.z),
        normal: new THREE.Vector3(pos.isLeft ? 1 : -1, 0, 0),
        poster,
      });
    });

    // 12. Ambiguous Shadow Figure at Passage Courtyard Exit (z = -46.5)
    const shadowGeo = new THREE.PlaneGeometry(1.2, 2.3);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x050608,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    this.passageShadowFigure = new THREE.Mesh(shadowGeo, shadowMat);
    this.passageShadowFigure.position.set(-10, 1.35, -46.5);
    this.passageShadowFigure.visible = false;
    passageGroup.add(this.passageShadowFigure);

    this.scene.add(passageGroup);

    // 13. Physical Box3 Colliders bounding the player within the Haunted Passage
    // Left wall solid barrier (inner face at x = -1.45)
    const leftCollider = new THREE.Box3();
    leftCollider.min.set(-2.4, -1.0, -46.5);
    leftCollider.max.set(-1.45, 6.0, -22.5);
    this.colliders.push(leftCollider);

    // Right wall solid barrier (inner face at x = 1.45)
    const rightCollider = new THREE.Box3();
    rightCollider.min.set(1.45, -1.0, -46.5);
    rightCollider.max.set(2.4, 6.0, -22.5);
    this.colliders.push(rightCollider);

    // Left entrance funnel collider
    const lEntCol = new THREE.Box3();
    lEntCol.setFromCenterAndSize(new THREE.Vector3(-2.6, 2.5, -22.4), new THREE.Vector3(2.4, 6.0, 1.5));
    this.colliders.push(lEntCol);

    // Right entrance funnel collider
    const rEntCol = new THREE.Box3();
    rEntCol.setFromCenterAndSize(new THREE.Vector3(2.6, 2.5, -22.4), new THREE.Vector3(2.4, 6.0, 1.5));
    this.colliders.push(rEntCol);

    // Left courtyard exit wing collider
    const lExitCol = new THREE.Box3();
    lExitCol.setFromCenterAndSize(new THREE.Vector3(-4.8, 2.5, -47.8), new THREE.Vector3(6.5, 6.0, 3.8));
    this.colliders.push(lExitCol);

    // Right courtyard exit wing collider
    const rExitCol = new THREE.Box3();
    rExitCol.setFromCenterAndSize(new THREE.Vector3(4.8, 2.5, -47.8), new THREE.Vector3(6.5, 6.0, 3.8));
    this.colliders.push(rExitCol);
  }

  private buildMansion(): void {
    const bungalowGroup = new THREE.Group();
    bungalowGroup.position.set(0, 0, -66);

    // Weathered colonial lime plaster with subtle damp stains - tuned for moonlit readability
    const plasterMat = new THREE.MeshStandardMaterial({
      color: 0x5a5852,
      roughness: 0.88,
      metalness: 0.06,
    });

    // Dark burnt clay brick showing through peeling plaster
    const exposedBrickMat = new THREE.MeshStandardMaterial({
      color: 0x623a30,
      roughness: 0.85,
      metalness: 0.1,
    });

    // Dark weathered colonial teak wood for veranda pillars, beams, and railings
    const teakMat = new THREE.MeshStandardMaterial({
      color: 0x332a21,
      roughness: 0.82,
      metalness: 0.12,
    });

    // Aged terracotta Mangalore roof tiles with subtle sheen
    const roofTileMat = new THREE.MeshStandardMaterial({
      color: 0x48352f,
      roughness: 0.75,
      metalness: 0.18,
    });

    // Old weathered stone plinth
    const plinthMat = new THREE.MeshStandardMaterial({
      color: 0x3e4042,
      roughness: 0.9,
      metalness: 0.08,
    });

    // Old dirty reflective window glass
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x182230,
      roughness: 0.18,
      metalness: 0.8,
    });

    // Eerie glowing candlelight from the attic window
    const candleGlowMat = new THREE.MeshStandardMaterial({
      color: 0xff6622,
      emissive: 0xff5511,
      emissiveIntensity: 2.3,
      roughness: 0.3,
    });

    // Clinging dark ivy and vines
    const vineMat = new THREE.MeshStandardMaterial({
      color: 0x253522,
      roughness: 0.88,
    });

    // 1. Raised Stone Plinth / Foundation (Classic colonial bungalow requirement)
    const plinthGeo = new THREE.BoxGeometry(38, 1.4, 26);
    const plinth = new THREE.Mesh(plinthGeo, plinthMat);
    plinth.position.set(0, 0.7, 0);
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    bungalowGroup.add(plinth);

    // Broad Front Stone Stairs descending to the garden path
    const stairStepCount = 5;
    for (let s = 0; s < stairStepCount; s++) {
      const stepWidth = 8.5;
      const stepDepth = 0.85;
      const stepHeight = 1.4 / stairStepCount;
      const stepGeo = new THREE.BoxGeometry(stepWidth, stepHeight, stepDepth * (stairStepCount - s));
      const step = new THREE.Mesh(stepGeo, plinthMat);
      step.position.set(0, (s + 0.5) * stepHeight, 13.0 + (s * stepDepth * 0.5));
      step.castShadow = true;
      step.receiveShadow = true;
      bungalowGroup.add(step);
    }

    // 2. Large Front Veranda (Verandah) spanning the entire facade
    const verandaFloorGeo = new THREE.BoxGeometry(36, 0.2, 5.8);
    const verandaFloor = new THREE.Mesh(verandaFloorGeo, teakMat);
    verandaFloor.position.set(0, 1.45, 9.8);
    verandaFloor.receiveShadow = true;
    bungalowGroup.add(verandaFloor);

    // 8 Classical Colonial Pillars / Columns along the veranda
    const colXPositions = [-15, -10.5, -6.5, -2.5, 2.5, 6.5, 10.5, 15];
    const pillarBaseGeo = new THREE.BoxGeometry(0.85, 0.45, 0.85);
    const pillarShaftGeo = new THREE.CylinderGeometry(0.28, 0.34, 4.2, 14);
    const pillarCapitalGeo = new THREE.BoxGeometry(0.85, 0.25, 0.85);

    for (let i = 0; i < colXPositions.length; i++) {
      const px = colXPositions[i];
      const colGroup = new THREE.Group();
      colGroup.position.set(px, 1.45, 12.3);

      // Base
      const base = new THREE.Mesh(pillarBaseGeo, plinthMat);
      base.position.y = 0.225;
      base.castShadow = true;
      colGroup.add(base);

      // Cylindrical Shaft
      const shaft = new THREE.Mesh(pillarShaftGeo, plasterMat);
      shaft.position.y = 0.45 + 2.1;
      shaft.castShadow = true;
      colGroup.add(shaft);

      // Carved Capital
      const cap = new THREE.Mesh(pillarCapitalGeo, teakMat);
      cap.position.y = 0.45 + 4.2 + 0.125;
      cap.castShadow = true;
      colGroup.add(cap);

      bungalowGroup.add(colGroup);
    }

    // Distressed wooden balustrade along front veranda edge
    for (let i = 0; i < colXPositions.length - 1; i++) {
      if (i === 3) continue; // Leave center entrance gap open for stairs
      const x1 = colXPositions[i] + 0.5;
      const x2 = colXPositions[i + 1] - 0.5;
      const segWidth = x2 - x1;
      const balustradeRailGeo = new THREE.BoxGeometry(segWidth, 0.1, 0.12);
      
      const bRail = new THREE.Mesh(balustradeRailGeo, teakMat);
      bRail.position.set((x1 + x2) / 2, 2.45, 12.3);
      bRail.castShadow = true;
      bungalowGroup.add(bRail);

      // Vertical spindles
      const spindleCount = 6;
      const spinGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.85);
      for (let sp = 0; sp <= spindleCount; sp++) {
        const spin = new THREE.Mesh(spinGeo, teakMat);
        spin.position.set(x1 + (sp / spindleCount) * segWidth, 2.0, 12.3);
        bungalowGroup.add(spin);
      }
    }

    // Veranda Sloped Tiled Awning Roof with timber fascia
    const verandaRoofGeo = new THREE.BoxGeometry(37, 0.35, 6.2);
    const verandaRoof = new THREE.Mesh(verandaRoofGeo, roofTileMat);
    verandaRoof.position.set(0, 6.1, 9.8);
    verandaRoof.rotation.x = 0.18; // Downward sloping monsoon roof
    verandaRoof.castShadow = true;
    bungalowGroup.add(verandaRoof);

    // Weathered timber fascia & brackets under veranda roof
    const fasciaGeo = new THREE.BoxGeometry(37, 0.3, 0.15);
    const fascia = new THREE.Mesh(fasciaGeo, teakMat);
    fascia.position.set(0, 5.5, 12.7);
    bungalowGroup.add(fascia);

    // Hanging broken vintage carriage lamps under veranda roof
    const lampGeo = new THREE.BoxGeometry(0.35, 0.55, 0.35);
    const ironLampMat = new THREE.MeshStandardMaterial({ color: 0x22262a, roughness: 0.6 });
    const lamp1 = new THREE.Mesh(lampGeo, ironLampMat);
    lamp1.position.set(-6.5, 5.1, 12.0);
    lamp1.rotation.z = 0.14; // Hanging crooked
    bungalowGroup.add(lamp1);

    const lamp2 = new THREE.Mesh(lampGeo, ironLampMat);
    lamp2.position.set(6.5, 5.1, 12.0);
    lamp2.rotation.z = -0.08;
    bungalowGroup.add(lamp2);

    // 3. Central Bungalow Main Body
    const mainBodyGeo = new THREE.BoxGeometry(24, 6.2, 16);
    const mainBody = new THREE.Mesh(mainBodyGeo, plasterMat);
    mainBody.position.set(0, 4.5, -1.0);
    mainBody.castShadow = true;
    mainBody.receiveShadow = true;
    bungalowGroup.add(mainBody);

    // Left and Right Projecting Colonial Wings
    const wingGeo = new THREE.BoxGeometry(7, 5.6, 18);
    const leftWing = new THREE.Mesh(wingGeo, plasterMat);
    leftWing.position.set(-15.5, 4.2, 0);
    leftWing.castShadow = true;
    bungalowGroup.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeo, plasterMat);
    rightWing.position.set(15.5, 4.2, 0);
    rightWing.castShadow = true;
    bungalowGroup.add(rightWing);

    // Exposed burnt brick patches showing through peeled plaster
    const brickPatch1Geo = new THREE.BoxGeometry(3.5, 2.2, 0.1);
    const brickPatch1 = new THREE.Mesh(brickPatch1Geo, exposedBrickMat);
    brickPatch1.position.set(-7, 3.2, 7.05);
    bungalowGroup.add(brickPatch1);

    const brickPatch2Geo = new THREE.BoxGeometry(2.8, 1.8, 0.1);
    const brickPatch2 = new THREE.Mesh(brickPatch2Geo, exposedBrickMat);
    brickPatch2.position.set(14.5, 4.5, 9.05);
    bungalowGroup.add(brickPatch2);

    // 4. Large Sloped Indian / Colonial Hip Roof with Terracotta Tiles
    const mainHipRoofGeo = new THREE.ConeGeometry(19, 7.8, 4);
    const mainHipRoof = new THREE.Mesh(mainHipRoofGeo, roofTileMat);
    mainHipRoof.position.set(0, 11.2, -1.0);
    mainHipRoof.rotation.y = Math.PI / 4;
    mainHipRoof.scale.set(1.5, 1.0, 1.25);
    mainHipRoof.castShadow = true;
    bungalowGroup.add(mainHipRoof);

    // Wing Hip Roofs
    const wingRoofGeo = new THREE.ConeGeometry(8.5, 5.5, 4);
    const leftWingRoof = new THREE.Mesh(wingRoofGeo, roofTileMat);
    leftWingRoof.position.set(-15.5, 9.6, 0);
    leftWingRoof.rotation.y = Math.PI / 4;
    leftWingRoof.scale.set(1.1, 1.0, 1.4);
    leftWingRoof.castShadow = true;
    bungalowGroup.add(leftWingRoof);

    const rightWingRoof = new THREE.Mesh(wingRoofGeo, roofTileMat);
    rightWingRoof.position.set(15.5, 9.6, 0);
    rightWingRoof.rotation.y = Math.PI / 4;
    rightWingRoof.scale.set(1.1, 1.0, 1.4);
    rightWingRoof.castShadow = true;
    bungalowGroup.add(rightWingRoof);

    // 5. Central Double Teak Entrance Doors with Arched Transom Fanlight (Interactive Horror Entrance)
    const doorFrameGroup = new THREE.Group();
    doorFrameGroup.position.set(0, 3.3, 7.05);

    // Weathered, rotted colonial teak material with grain & cracks
    const weatheredDoorMat = new THREE.MeshStandardMaterial({
      color: 0x221a14,
      roughness: 0.88,
      metalness: 0.12,
    });

    const ironBoltMat = new THREE.MeshStandardMaterial({
      color: 0x1f2022,
      roughness: 0.76,
      metalness: 0.72,
    });

    // Outer heavy wooden door frame
    const frameLGeo = new THREE.BoxGeometry(0.18, 3.8, 0.26);
    const frameL = new THREE.Mesh(frameLGeo, teakMat);
    frameL.position.set(-1.46, 0, 0);
    doorFrameGroup.add(frameL);

    const frameR = new THREE.Mesh(frameLGeo, teakMat);
    frameR.position.set(1.46, 0, 0);
    doorFrameGroup.add(frameR);

    const frameTopGeo = new THREE.BoxGeometry(3.1, 0.22, 0.26);
    const frameTop = new THREE.Mesh(frameTopGeo, teakMat);
    frameTop.position.set(0, 1.9, 0);
    doorFrameGroup.add(frameTop);

    // Left Door Wing (Pivot at x = -1.35)
    const doorWingGeo = new THREE.BoxGeometry(1.36, 3.65, 0.14);
    const leftDoorPivot = new THREE.Group();
    leftDoorPivot.position.set(-1.36, 0, 0);

    const leftDoorMesh = new THREE.Mesh(doorWingGeo, weatheredDoorMat);
    leftDoorMesh.position.set(0.68, 0, 0); // Center relative to hinge pivot
    leftDoorMesh.castShadow = true;
    leftDoorMesh.receiveShadow = true;
    leftDoorPivot.add(leftDoorMesh);

    // Panels and wooden cross-braces on left wing
    for (let p = 0; p < 3; p++) {
      const pGeo = new THREE.BoxGeometry(1.15, 0.95, 0.04);
      const panel = new THREE.Mesh(pGeo, weatheredDoorMat);
      panel.position.set(0.68, -1.1 + p * 1.15, 0.08);
      leftDoorPivot.add(panel);
    }
    // Rusted iron hinge straps on left wing
    for (let h = 0; h < 3; h++) {
      const hGeo = new THREE.BoxGeometry(0.55, 0.08, 0.02);
      const hinge = new THREE.Mesh(hGeo, ironBoltMat);
      hinge.position.set(0.28, -1.2 + h * 1.25, 0.085);
      leftDoorPivot.add(hinge);
    }

    doorFrameGroup.add(leftDoorPivot);
    this.bungalowDoorLeftWing = leftDoorPivot as any;

    // Right Door Wing (Pivot at x = 1.35)
    const rightDoorPivot = new THREE.Group();
    rightDoorPivot.position.set(1.36, 0, 0);

    const rightDoorMesh = new THREE.Mesh(doorWingGeo, weatheredDoorMat);
    rightDoorMesh.position.set(-0.68, 0, 0); // Center relative to hinge pivot
    rightDoorMesh.castShadow = true;
    rightDoorMesh.receiveShadow = true;
    rightDoorPivot.add(rightDoorMesh);

    // Panels on right wing
    for (let p = 0; p < 3; p++) {
      const pGeo = new THREE.BoxGeometry(1.15, 0.95, 0.04);
      const panel = new THREE.Mesh(pGeo, weatheredDoorMat);
      panel.position.set(-0.68, -1.1 + p * 1.15, 0.08);
      rightDoorPivot.add(panel);
    }
    // Rusted iron hinge straps on right wing
    for (let h = 0; h < 3; h++) {
      const hGeo = new THREE.BoxGeometry(0.55, 0.08, 0.02);
      const hinge = new THREE.Mesh(hGeo, ironBoltMat);
      hinge.position.set(-0.28, -1.2 + h * 1.25, 0.085);
      rightDoorPivot.add(hinge);
    }

    // Heavy rusted iron locking bar / hasp across center seam
    const lockBarGeo = new THREE.BoxGeometry(0.42, 0.14, 0.08);
    const lockBar = new THREE.Mesh(lockBarGeo, ironBoltMat);
    lockBar.position.set(0, 0, 0.12);
    doorFrameGroup.add(lockBar);

    doorFrameGroup.add(rightDoorPivot);
    this.bungalowDoorRightWing = rightDoorPivot as any;
    this.bungalowDoorMesh = doorFrameGroup;
    bungalowGroup.add(doorFrameGroup);

    // Fanlight above door
    const fanlightGeo = new THREE.BoxGeometry(2.8, 1.2, 0.15);
    const fanlight = new THREE.Mesh(fanlightGeo, glassMat);
    fanlight.position.set(0, 5.8, 7.05);
    bungalowGroup.add(fanlight);

    // =========================================================================
    // PHYSICAL WORLD HAMMER OBJECT
    // Situated on the bungalow veranda near the front entrance on an overturned crate.
    // Real 3D physical object with handle, iron head, scratches, and subtle glint.
    // =========================================================================
    const crateMat = new THREE.MeshStandardMaterial({
      color: 0x3d3025,
      roughness: 0.92,
      metalness: 0.05,
    });
    // Old weathered tool crate on veranda floor (veranda floor local y = 1.45, z = 9.8)
    // Placed to the left of the stone entrance stairs / door (x = -3.2, y = 1.45, z = 8.6)
    // World coordinates: x = -3.2, y = 1.45, z = -66 + 8.6 = -57.4
    const toolCrateGeo = new THREE.BoxGeometry(0.9, 0.65, 0.7);
    const toolCrate = new THREE.Mesh(toolCrateGeo, crateMat);
    toolCrate.position.set(-2.8, 1.45 + 0.325, 8.8);
    toolCrate.rotation.y = 0.22;
    toolCrate.castShadow = true;
    toolCrate.receiveShadow = true;
    bungalowGroup.add(toolCrate);

    // Physical hammer resting on top of the crate
    const worldHammer = new THREE.Group();
    worldHammer.position.set(-2.8, 1.45 + 0.66, 8.8);
    worldHammer.rotation.set(0.08, 0.45, -0.05);

    // Hammer handle (weathered ash wood)
    const wHandleMat = new THREE.MeshStandardMaterial({
      color: 0x4e3626,
      roughness: 0.86,
      metalness: 0.08,
    });
    const wHandleGeo = new THREE.CylinderGeometry(0.016, 0.019, 0.42, 8);
    wHandleGeo.rotateZ(Math.PI / 2);
    const wHandle = new THREE.Mesh(wHandleGeo, wHandleMat);
    wHandle.castShadow = true;
    worldHammer.add(wHandle);

    // Hammer head (heavy forged rusted iron with slight glint from moonlight)
    const wHeadMat = new THREE.MeshStandardMaterial({
      color: 0x222225,
      roughness: 0.62,
      metalness: 0.82,
    });
    const wHeadBlock = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.046, 0.042), wHeadMat);
    wHeadBlock.position.set(0.19, 0, 0);
    wHeadBlock.castShadow = true;
    worldHammer.add(wHeadBlock);

    // Striking face
    const wFaceGeo = new THREE.CylinderGeometry(0.022, 0.020, 0.035, 8);
    wFaceGeo.rotateZ(Math.PI / 2);
    const wFace = new THREE.Mesh(wFaceGeo, wHeadMat);
    wFace.position.set(0.26, 0, 0);
    worldHammer.add(wFace);

    // Curved rear claw
    const wClawGeo = new THREE.BoxGeometry(0.05, 0.022, 0.032);
    wClawGeo.rotateY(0.35);
    const wClaw = new THREE.Mesh(wClawGeo, wHeadMat);
    wClaw.position.set(0.12, 0, -0.02);
    worldHammer.add(wClaw);

    // Subtle glint / soft localized point light highlighting the hammer in darkness
    const hammerGlint = new THREE.PointLight(0x7896aa, 0.6, 2.2, 2.0);
    hammerGlint.position.set(0.15, 0.18, 0);
    worldHammer.add(hammerGlint);

    bungalowGroup.add(worldHammer);
    this.bungalowHammerMesh = worldHammer;

    // 6. Tall Colonial French Windows with Dark Louvered Wooden Shutters
    const winGeo = new THREE.BoxGeometry(1.6, 2.6, 0.1);
    const shutterGeo = new THREE.BoxGeometry(0.85, 2.6, 0.08);

    const windowSpots: [number, number, number][] = [
      [-6.5, 3.8, 7.05],
      [6.5, 3.8, 7.05],
      [-15.5, 3.8, 9.05],
      [15.5, 3.8, 9.05],
      [-19.05, 3.8, 0],
      [19.05, 3.8, 0],
    ];

    for (let i = 0; i < windowSpots.length; i++) {
      const [wx, wy, wz] = windowSpots[i];
      const win = new THREE.Mesh(winGeo, glassMat);
      win.position.set(wx, wy, wz);
      if (Math.abs(wx) > 18) win.rotation.y = Math.PI / 2;
      bungalowGroup.add(win);

      // Louvered shutters flanking windows
      if (Math.abs(wx) < 18) {
        const lShutter = new THREE.Mesh(shutterGeo, teakMat);
        lShutter.position.set(wx - 1.15, wy, wz + 0.04);
        lShutter.rotation.y = 0.35 + (i % 2) * 0.15; // slightly askew
        bungalowGroup.add(lShutter);

        const rShutter = new THREE.Mesh(shutterGeo, teakMat);
        rShutter.position.set(wx + 1.15, wy, wz + 0.04);
        rShutter.rotation.y = -0.38 - (i % 2) * 0.1;
        bungalowGroup.add(rShutter);
      }
    }

    // 7. Upper Pediment Dormer Gable & The Creepy Attic Window
    const atticDormerGeo = new THREE.BoxGeometry(6.5, 4.5, 5.5);
    const atticDormer = new THREE.Mesh(atticDormerGeo, plasterMat);
    atticDormer.position.set(0, 11.5, 4.0);
    atticDormer.castShadow = true;
    bungalowGroup.add(atticDormer);

    const atticRoofGeo = new THREE.ConeGeometry(5.2, 3.5, 4);
    const atticRoof = new THREE.Mesh(atticRoofGeo, roofTileMat);
    atticRoof.position.set(0, 15.0, 4.0);
    atticRoof.rotation.y = Math.PI / 4;
    atticRoof.scale.set(1.4, 1.0, 1.1);
    atticRoof.castShadow = true;
    bungalowGroup.add(atticRoof);

    // The Famous Eerie Glowing Attic Window
    const atticWinGeo = new THREE.BoxGeometry(2.2, 2.6, 0.1);
    const atticWin = new THREE.Mesh(atticWinGeo, candleGlowMat);
    atticWin.position.set(0, 12.4, 6.8);
    bungalowGroup.add(atticWin);
    this.bungalowRevealWindow = atticWin;
    this.bungalowRevealLight = this.atticLight;

    // Wooden cross mullions
    const frameH = new THREE.BoxGeometry(2.2, 0.1, 0.15);
    const f1 = new THREE.Mesh(frameH, teakMat);
    f1.position.set(0, 12.4, 6.88);
    bungalowGroup.add(f1);

    const frameV = new THREE.BoxGeometry(0.1, 2.6, 0.15);
    const f2 = new THREE.Mesh(frameV, teakMat);
    f2.position.set(0, 12.4, 6.88);
    bungalowGroup.add(f2);

    // Distorted silhouette figure in the attic window
    const figureGeo = new THREE.BoxGeometry(0.65, 1.5, 0.05);
    const figureMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const figure = new THREE.Mesh(figureGeo, figureMat);
    figure.position.set(0.1, 12.1, 6.75);
    bungalowGroup.add(figure);

    // 8. Old Crooked Masonry Chimney
    const chimGeo = new THREE.BoxGeometry(1.6, 5.5, 1.6);
    const chim = new THREE.Mesh(chimGeo, exposedBrickMat);
    chim.position.set(-8, 14.5, -2);
    chim.rotation.z = 0.06; // tilted with age
    bungalowGroup.add(chim);

    // 9. Clinging Ivy & Creepers climbing pillars and veranda
    const vineTorusGeo = new THREE.TorusGeometry(0.38, 0.07, 6, 12);
    for (let v = 0; v < 8; v++) {
      const vine = new THREE.Mesh(vineTorusGeo, vineMat);
      const colX = colXPositions[v % colXPositions.length];
      vine.position.set(colX + (v % 2 ? 0.05 : -0.05), 2.2 + v * 0.45, 12.3);
      vine.rotation.x = Math.PI / 2 + (v * 0.3);
      vine.rotation.z = v * 0.7;
      bungalowGroup.add(vine);
    }

    this.scene.add(bungalowGroup);

    // Bungalow Main Body Wall Colliders (Behind the veranda, stopping at z = -58.95)
    // 1. Left facade wall collider
    const houseLeftCollider = new THREE.Box3();
    houseLeftCollider.setFromCenterAndSize(
      new THREE.Vector3(-11, 8, -66),
      new THREE.Vector3(18, 20, 16)
    );
    this.colliders.push(houseLeftCollider);

    // 2. Right facade wall collider
    const houseRightCollider = new THREE.Box3();
    houseRightCollider.setFromCenterAndSize(
      new THREE.Vector3(11, 8, -66),
      new THREE.Vector3(18, 20, 16)
    );
    this.colliders.push(houseRightCollider);

    // 3. Central entrance door collider (blocks walking through the closed door at z = -58.95)
    this.bungalowDoorCollider = new THREE.Box3();
    this.bungalowDoorCollider.setFromCenterAndSize(
      new THREE.Vector3(0, 3.3, -58.95),
      new THREE.Vector3(3.4, 5.0, 0.8)
    );
    this.colliders.push(this.bungalowDoorCollider);

    // 4. Veranda perimeter side railings (prevent falling off the sides of the high plinth)
    const verandaLeftCollider = new THREE.Box3();
    verandaLeftCollider.setFromCenterAndSize(
      new THREE.Vector3(-18.5, 2.5, -57.0),
      new THREE.Vector3(1.2, 4.0, 7.0)
    );
    this.colliders.push(verandaLeftCollider);

    const verandaRightCollider = new THREE.Box3();
    verandaRightCollider.setFromCenterAndSize(
      new THREE.Vector3(18.5, 2.5, -57.0),
      new THREE.Vector3(1.2, 4.0, 7.0)
    );
    this.colliders.push(verandaRightCollider);
  }

  private buildForest(): void {
    // Generate gnarled bare dead trees along the pathway and perimeter
    const treePositions: [number, number][] = [
      [-9, 12], [-14, 5], [-11, -3], [-15, -12], [-10, -18],
      [9, 10], [13, 3], [12, -4], [14, -13], [11, -19],
      [-22, 16], [-26, 0], [-24, -16], [22, 15], [25, 2], [24, -15],
      [-18, -32], [-28, -38], [19, -31], [27, -39],
    ];

    // Gnarled dead tree wood with visible contour under moonlight
    const barkMat = new THREE.MeshStandardMaterial({
      color: 0x2e2925,
      roughness: 0.88,
      metalness: 0.06,
    });

    for (let i = 0; i < treePositions.length; i++) {
      const [x, z] = treePositions[i];
      const isDistant = i >= 10;
      const tree = this.createSpookyDeadTree(barkMat, isDistant);
      tree.position.set(x, 0, z);
      tree.rotation.y = (i * 1.37) % (Math.PI * 2);
      const s = 0.8 + (i % 5) * 0.12;
      tree.scale.set(s, s, s);
      this.scene.add(tree);
      this.trees.push(tree);

      // Trunk collider
      const treeCol = new THREE.Box3();
      treeCol.setFromCenterAndSize(
        new THREE.Vector3(x, 3, z),
        new THREE.Vector3(1.6 * s, 6, 1.6 * s)
      );
      this.colliders.push(treeCol);
    }
  }

  private createSpookyDeadTree(material: THREE.Material, isDistant = false): THREE.Group {
    const treeGroup = new THREE.Group();

    // Main twisted trunk - primary silhouette shadow caster
    const trunkHeight = 7.5;
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.7, trunkHeight, 7);
    const trunk = new THREE.Mesh(trunkGeo, material);
    trunk.position.y = trunkHeight / 2;
    trunk.rotation.z = (Math.random() - 0.5) * 0.18;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // Gnarled primary branches
    const branchCount = isDistant ? 3 : 4 + Math.floor(Math.random() * 2);
    for (let b = 0; b < branchCount; b++) {
      const bHeight = 3.5 + Math.random() * 2.5;
      const bAngle = (b / branchCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const bLen = 2.8 + Math.random() * 1.5;

      const branchGeo = new THREE.CylinderGeometry(0.08, 0.22, bLen, 5);
      const branch = new THREE.Mesh(branchGeo, material);
      branch.position.set(
        Math.cos(bAngle) * 0.4,
        bHeight,
        Math.sin(bAngle) * 0.4
      );

      branch.rotation.y = bAngle;
      branch.rotation.z = 0.65 + Math.random() * 0.35;
      treeGroup.add(branch);

      // Sub-twigs (only for closer trees near pathway)
      if (!isDistant) {
        const twigGeo = new THREE.CylinderGeometry(0.02, 0.07, 1.6, 4);
        const twig = new THREE.Mesh(twigGeo, material);
        twig.position.set(
          Math.cos(bAngle) * (0.4 + bLen * 0.6),
          bHeight + bLen * 0.5,
          Math.sin(bAngle) * (0.4 + bLen * 0.6)
        );
        twig.rotation.y = bAngle + 0.5;
        twig.rotation.z = 0.9;
        treeGroup.add(twig);
      }
    }

    return treeGroup;
  }

  private setupRainAndAtmosphere(): void {
    // 1. Rain streaks (adaptive buffer: max 1400)
    const rainMaxBuffer = 1400;
    const rainGeo = new THREE.BufferGeometry();
    this.rainPositions = new Float32Array(rainMaxBuffer * 3);

    for (let i = 0; i < rainMaxBuffer; i++) {
      this.rainPositions[i * 3] = (Math.random() - 0.5) * 70;
      this.rainPositions[i * 3 + 1] = Math.random() * 35;
      this.rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 70;
    }

    rainGeo.setAttribute('position', new THREE.BufferAttribute(this.rainPositions, 3));
    rainGeo.setDrawRange(0, this.activeRainCount);

    const rainMat = new THREE.PointsMaterial({
      color: 0x778899,
      size: 0.18,
      transparent: true,
      opacity: 0.38,
      blending: THREE.AdditiveBlending,
    });

    this.rainParticles = new THREE.Points(rainGeo, rainMat);
    this.scene.add(this.rainParticles);

    // 2. Floating dust / atmospheric motes (capped buffer: 60)
    const dustMaxBuffer = 60;
    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustMaxBuffer * 3);
    for (let i = 0; i < dustMaxBuffer; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 45;
      dustPositions[i * 3 + 1] = Math.random() * 9 + 0.2;
      dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 45;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    dustGeo.setDrawRange(0, this.activeDustCount);

    const dustMat = new THREE.PointsMaterial({
      color: 0x99aacc,
      size: 0.08,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    });
    this.dustParticles = new THREE.Points(dustGeo, dustMat);
    this.scene.add(this.dustParticles);

    // 3. Ground fog billboard planes (shared material to reduce draw calls and alpha-overdraw)
    const fogPlaneGeo = new THREE.PlaneGeometry(24, 8);
    const sharedFogMat = new THREE.MeshBasicMaterial({
      map: this.textures.fog,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    const fogOffsets = [
      [0, 1.4, -7],
      [-7, 1.6, -17],
      [6, 1.7, -27],
    ];

    for (let [fx, fy, fz] of fogOffsets) {
      const plane = new THREE.Mesh(fogPlaneGeo, sharedFogMat);
      plane.position.set(fx, fy, fz);
      plane.rotation.x = -0.15;
      this.scene.add(plane);
      this.groundFogPlanes.push(plane);
    }

    // 4. Low dense ground fog drifting directly through the gate bars
    const gateFogGeo = new THREE.PlaneGeometry(12, 4.5);
    const gateFogPositions = [
      [-2.0, 1.2, -19.5],
      [2.0, 1.3, -17.4],
    ];

    for (let [gx, gy, gz] of gateFogPositions) {
      const gPlane = new THREE.Mesh(gateFogGeo, sharedFogMat);
      gPlane.position.set(gx, gy, gz);
      gPlane.rotation.x = -0.12;
      this.scene.add(gPlane);
      this.gateThresholdFogPlanes.push(gPlane);
    }

    // 5. Subtle distant shadowy silhouette movement far behind the gate (z = -38)
    const shadowGeo = new THREE.PlaneGeometry(0.85, 2.4);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x050709,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
    });
    this.shadowFigure = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowFigure.position.set(-5.0, 1.5, -36.0);
    this.scene.add(this.shadowFigure);
  }

  /**
   * Adaptive Quality Profiling Hook: dynamically adapts particle limits,
   * shadow map resolutions, and transparent plane overdraw.
   */
  public applyQuality(quality: 'high' | 'medium' | 'low'): void {
    this.currentQuality = quality;

    if (quality === 'high') {
      this.activeRainCount = 1200;
      this.activeDustCount = 35;
      if (this.moonLight) {
        this.moonLight.castShadow = true;
        this.moonLight.shadow.mapSize.set(1024, 1024);
      }
      this.groundFogPlanes.forEach((p) => (p.visible = true));
      this.gateThresholdFogPlanes.forEach((p) => (p.visible = true));
    } else if (quality === 'medium') {
      this.activeRainCount = 650;
      this.activeDustCount = 18;
      if (this.moonLight) {
        this.moonLight.castShadow = true;
        this.moonLight.shadow.mapSize.set(512, 512);
      }
      this.groundFogPlanes.forEach((p) => (p.visible = true));
      this.gateThresholdFogPlanes.forEach((p) => (p.visible = true));
    } else {
      // LOW quality: disable dynamic shadows & transparent billboard planes, keep scene.fog
      this.activeRainCount = 220;
      this.activeDustCount = 0;
      if (this.moonLight) {
        this.moonLight.castShadow = false;
      }
      this.groundFogPlanes.forEach((p) => (p.visible = false));
      this.gateThresholdFogPlanes.forEach((p) => (p.visible = false));
    }

    if (this.rainParticles && this.rainParticles.geometry) {
      this.rainParticles.geometry.setDrawRange(0, this.activeRainCount);
    }
    if (this.dustParticles && this.dustParticles.geometry) {
      this.dustParticles.geometry.setDrawRange(0, this.activeDustCount);
      this.dustParticles.visible = this.activeDustCount > 0;
    }
  }

  /**
   * Trigger intense realistic lightning flash.
   * Momentarily illuminates ambient light, hemisphere light, and lightning light while extending fog reach
   * so the entire estate, trees, mansion silhouette, and gate become clearly visible for a brief flash,
   * then immediately plunges back into darkness.
   */
  public triggerLightning(onFlash?: () => void): void {
    const baseAmb = 0.85;
    const baseHemi = 0.95;
    const isLinearFog = this.scene.fog && this.scene.fog instanceof THREE.Fog;
    const baseFogFar = isLinearFog ? 92 : 0.024;

    const flashes = [
      { t: 0, int: 3.8, amb: 2.2, hemi: 2.4, fogParam: isLinearFog ? 140 : 0.006 },
      { t: 65, int: 0.2, amb: baseAmb, hemi: baseHemi, fogParam: baseFogFar },
      { t: 130, int: 5.2, amb: 3.0, hemi: 3.2, fogParam: isLinearFog ? 160 : 0.004 },
      { t: 240, int: 0.8, amb: 1.3, hemi: 1.5, fogParam: isLinearFog ? 120 : 0.012 },
      { t: 330, int: 2.4, amb: 1.6, hemi: 1.8, fogParam: isLinearFog ? 110 : 0.014 },
      { t: 430, int: 0.0, amb: baseAmb, hemi: baseHemi, fogParam: baseFogFar },
    ];

    flashes.forEach(({ t, int, amb, hemi, fogParam }) => {
      setTimeout(() => {
        if (this.lightningLight) {
          this.lightningLight.intensity = int;
        }
        if (this.ambientLight) {
          this.ambientLight.intensity = amb;
        }
        if (this.hemiLight) {
          this.hemiLight.intensity = hemi;
        }
        if (this.scene.fog && this.scene.fog instanceof THREE.Fog) {
          this.scene.fog.far = fogParam;
        } else if (this.scene.fog && this.scene.fog instanceof THREE.FogExp2) {
          this.scene.fog.density = fogParam;
        }
        if (int > 2.5 && onFlash) {
          onFlash();
        }
      }, t);
    });
  }

  /**
   * Adjust fog density based on distance to the ominous gate
   */
  public updateGateProximity(distanceToGate: number): void {
    const factor = Math.max(0, Math.min(1, 1 - distanceToGate / 28));

    if (this.scene.fog && this.scene.fog instanceof THREE.Fog) {
      // Linear fog: base near = 16, far = 92. Approaching gate creates gentle mist without solid wall
      this.scene.fog.near = 16 - factor * 4;
      this.scene.fog.far = 92 - factor * 14;
    } else if (this.scene.fog && this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.density = 0.016 + factor * 0.010;
    }

    // Adjust ground fog opacities subtly
    this.groundFogPlanes.forEach((plane) => {
      const mat = plane.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.22 + factor * 0.16;
    });

    // Slightly creak/wiggle the left gate wing when close (only while gate is locked)
    if (this.leftGateWing && distanceToGate < 8 && !this.isGateOpen) {
      const creakSway = Math.sin(Date.now() * 0.003) * 0.018 * (1 - distanceToGate / 8);
      this.leftGateWing.rotation.y = creakSway;
    }
  }

  public update(delta: number, elapsedTime: number): void {
    // 1. Rain falling (only simulate active particle count)
    if (this.rainParticles && this.activeRainCount > 0) {
      const positions = this.rainParticles.geometry.attributes.position.array as Float32Array;
      const count = Math.min(this.activeRainCount, positions.length / 3);
      for (let i = 0; i < count; i++) {
        positions[i * 3 + 1] -= delta * 24;
        positions[i * 3] += delta * 3.5;
        if (positions[i * 3 + 1] < 0) {
          positions[i * 3 + 1] = 35;
          positions[i * 3] = (Math.random() - 0.5) * 70;
        }
      }
      this.rainParticles.geometry.attributes.position.needsUpdate = true;
    }

    // 2. Atmospheric dust floating (only when enabled in MEDIUM/HIGH)
    if (this.dustParticles && this.activeDustCount > 0) {
      const dpos = this.dustParticles.geometry.attributes.position.array as Float32Array;
      const dcount = Math.min(this.activeDustCount, dpos.length / 3);
      for (let i = 0; i < dcount; i++) {
        dpos[i * 3] += Math.sin(elapsedTime * 0.5 + i) * delta * 0.25;
        dpos[i * 3 + 1] += Math.cos(elapsedTime * 0.4 + i) * delta * 0.15;
        if (dpos[i * 3 + 1] > 9.5) dpos[i * 3 + 1] = 0.5;
        if (dpos[i * 3 + 1] < 0.2) dpos[i * 3 + 1] = 9.2;
      }
      this.dustParticles.geometry.attributes.position.needsUpdate = true;
    }

    // 3. Tree sway in the wind (freezes completely dead still when horror freeze is active)
    const baseWind = this.isHorrorEnvironmentFrozen ? 0 : (Math.sin(elapsedTime * 0.85) * 0.022 + Math.sin(elapsedTime * 1.8) * 0.01);
    for (let idx = 0; idx < this.trees.length; idx++) {
      if (this.isHorrorEnvironmentFrozen) {
        this.trees[idx].rotation.z = THREE.MathUtils.lerp(this.trees[idx].rotation.z, 0, delta * 3.5);
      } else {
        this.trees[idx].rotation.z = baseWind * (1 + (idx % 3) * 0.2);
      }
    }

    // 4. Ground fog slow drift (skip if hidden in LOW quality)
    if (this.currentQuality !== 'low') {
      for (let idx = 0; idx < this.groundFogPlanes.length; idx++) {
        const plane = this.groundFogPlanes[idx];
        plane.position.x += delta * (0.25 + (idx % 2) * 0.15);
        if (plane.position.x > 18) plane.position.x = -18;
      }

      // 5. Gate Threshold Fog passing through the bars
      for (let idx = 0; idx < this.gateThresholdFogPlanes.length; idx++) {
        const plane = this.gateThresholdFogPlanes[idx];
        plane.position.z += delta * (0.32 + (idx % 2) * 0.18);
        plane.position.x += Math.sin(elapsedTime * 0.35 + idx) * delta * 0.12;
        if (plane.position.z > -18.5) {
          plane.position.z = -24.5;
        }
      }
    }

    // 6. Chain & Padlock Horror Motion
    if (this.swingingChainGroup) {
      if (this.isChainsDropped) {
        // Physical chain drop animation: falls quickly to the wet cobblestones and rests
        this.chainDropVelocity += delta * 15.0;
        this.chainDropY -= this.chainDropVelocity * delta;

        const groundRestY = 0.12;
        const padlockY = Math.max(groundRestY, 3.15 + this.chainDropY);
        const chainY = Math.max(groundRestY, 2.85 + this.chainDropY);

        if (this.padlockGroup) {
          this.padlockGroup.position.y = padlockY;
          this.padlockGroup.rotation.x = Math.min(Math.PI / 2.2, -this.chainDropY * 0.45);
          this.padlockGroup.position.z = 0.22 + Math.min(0.4, -this.chainDropY * 0.08);
        }

        this.swingingChainGroup.position.y = chainY;
        this.swingingChainGroup.rotation.x = Math.min(Math.PI / 2.2, -this.chainDropY * 0.4);
        this.swingingChainGroup.position.z = 0.22 + Math.min(0.4, -this.chainDropY * 0.08);
      } else if (this.chainScareMode === 'MOVING_BY_ITSELF') {
        this.chainScareTimer += delta;
        // Slow, subtle, eerie compound pendulum motion moving by itself
        const swayZ = Math.sin(this.chainScareTimer * 1.5) * 0.11 + Math.sin(this.chainScareTimer * 0.65) * 0.04;
        const swayX = Math.cos(this.chainScareTimer * 1.2) * 0.055;
        this.swingingChainGroup.rotation.z = swayZ;
        this.swingingChainGroup.rotation.x = swayX;

        // Progressive articulation of chain links for realistic physics
        this.swingingChainGroup.children.forEach((child, idx) => {
          child.rotation.z = Math.sin(this.chainScareTimer * 1.5 - idx * 0.3) * 0.035;
          child.rotation.x = Math.cos(this.chainScareTimer * 1.2 - idx * 0.3) * 0.02;
        });
      } else if (this.chainScareMode === 'PADLOCK_SHAKING') {
        this.chainScareTimer += delta;
        // Subtle continued chain swing
        const swayZ = Math.sin(this.chainScareTimer * 1.5) * 0.09;
        this.swingingChainGroup.rotation.z = swayZ;

        // Rusty Padlock micro-shake
        if (this.padlockGroup) {
          const jitter = Math.sin(this.chainScareTimer * 38.0) * (0.022 * this.padlockShakeIntensity);
          this.padlockGroup.rotation.z = jitter;
          this.padlockGroup.position.x = Math.cos(this.chainScareTimer * 32.0) * (0.0025 * this.padlockShakeIntensity);
        }
      } else if (this.chainScareMode === 'FROZEN_DEAD_STILL') {
        // Sudden complete freeze dead still
        this.swingingChainGroup.rotation.set(0, 0, 0);
        this.swingingChainGroup.children.forEach((child) => {
          child.rotation.z = 0;
          child.rotation.x = 0;
        });
        if (this.padlockGroup) {
          this.padlockGroup.rotation.set(0, 0, 0);
          this.padlockGroup.position.set(0, 3.15, 0.22);
        }
      } else {
        // Normal gentle wind sway
        const swayZ = Math.sin(elapsedTime * 1.6) * 0.045 + Math.sin(elapsedTime * 0.65) * 0.02;
        const swayX = Math.cos(elapsedTime * 1.2) * 0.025;
        this.swingingChainGroup.rotation.z = swayZ;
        this.swingingChainGroup.rotation.x = swayX;
        if (this.padlockGroup) {
          this.padlockGroup.rotation.set(0, 0, 0);
          this.padlockGroup.position.set(0, 3.15, 0.22);
        }
      }
    }

    // 6b. Ambiguous Distant Forest Movement (Dissolves behind pine trees behind player)
    if (this.ambiguousMistTimer >= 0) {
      this.ambiguousMistTimer += delta;
      if (this.distantAmbiguousMistShape) {
        const t = this.ambiguousMistTimer / 2.2; // 2.2 second subtle drift
        if (t <= 1.0) {
          // Fades in to faint translucent silhouette, then dissolves
          const alpha = Math.sin(t * Math.PI) * 0.16;
          (this.distantAmbiguousMistShape.material as THREE.MeshBasicMaterial).opacity = alpha;
          // Glides gently behind pine tree trunk deeper into the forest fog
          this.distantAmbiguousMistShape.position.x = -7.8 - t * 1.4;
          this.distantAmbiguousMistShape.position.z = 14.5 + t * 1.6;
        } else {
          this.distantAmbiguousMistShape.visible = false;
          (this.distantAmbiguousMistShape.material as THREE.MeshBasicMaterial).opacity = 0;
          this.ambiguousMistTimer = -1;
        }
      }
    }

    // 7. Subtle gate vibration and tiny metal movement
    if (this.gateGroup) {
      const windGust = Math.sin(elapsedTime * 0.95);
      if (windGust > 0.72) {
        const microJitter = (Math.sin(elapsedTime * 32.0) * 0.0015);
        this.leftGateWing.position.z = microJitter;
        this.rightGateWing.position.z = -microJitter;
      } else {
        this.leftGateWing.position.z = 0;
        this.rightGateWing.position.z = 0;
      }
    }

    // 8. Broken carriage lantern on right pillar with intermittent dying filament flicker
    if (this.pillarLanternLight && this.pillarLanternBulb) {
      const cycle = elapsedTime % 16.0;
      let lanternInt = 0.55;
      if (cycle > 9.5 && cycle < 12.5) {
        // Unsettling jitter burst
        const jitter = Math.sin(elapsedTime * 35.0) * Math.cos(elapsedTime * 52.0);
        lanternInt = jitter > 0.15 ? 1.4 : jitter < -0.2 ? 0.05 : 0.7;
      } else {
        lanternInt = 0.5 + Math.sin(elapsedTime * 1.2) * 0.12;
      }
      this.pillarLanternLight.intensity = lanternInt;
      const bMat = this.pillarLanternBulb.material as THREE.MeshStandardMaterial;
      bMat.emissiveIntensity = lanternInt * 1.5;
    }

    // 9. Very subtle distant shadow movement far behind the gate (between trees at z = -42)
    if (this.shadowFigure) {
      const shadowCycle = elapsedTime % 48.0;
      const sMat = this.shadowFigure.material as THREE.MeshBasicMaterial;
      if (shadowCycle >= 18.0 && shadowCycle <= 32.0) {
        const progress = (shadowCycle - 18.0) / 14.0;
        const alpha = Math.sin(progress * Math.PI) * 0.18; // faint, ghostly translucent
        sMat.opacity = alpha;
        this.shadowFigure.position.x = -6.5 + progress * 9.0;
        this.shadowFigure.visible = true;
      } else {
        sMat.opacity = 0;
        this.shadowFigure.visible = false;
      }
    }

    // 10. Attic candle flicker in bungalow dormer
    if (this.atticLight) {
      const flicker = Math.sin(elapsedTime * 7.2) * 0.15 + (Math.random() - 0.5) * 0.2;
      this.atticLight.intensity = Math.max(0.4, 0.9 + flicker);
    }

    // 11. Oil Lamp Flame Flickers & Rising Smoke
    const lamps = [this.lamp1Data, this.lamp2Data, this.lamp3Data];
    lamps.forEach((lamp, idx) => {
      if (lamp && lamp.isLit) {
        const fPulse = Math.sin(elapsedTime * 22.0 + idx * 2.3) * 0.08 + Math.cos(elapsedTime * 34.0 + idx) * 0.04;
        lamp.flame.scale.set(1 + fPulse, 1 + fPulse * 1.5, 1 + fPulse);
        lamp.light.intensity = 1.9 + fPulse * 1.8;

        // Gentle rising smoke wisps
        lamp.smoke.position.y += delta * 0.16;
        if (lamp.smoke.position.y > 0.88) {
          lamp.smoke.position.y = 0.68;
        }
      }
    });

    // 12. Lamp 3 Environmental Shift Reveal (Fog dissipates, brambles part)
    if (this.lamp3Data && this.lamp3Data.isRevealed && this.lamp3Data.revealProgress < 1) {
      this.lamp3Data.revealProgress = Math.min(1, this.lamp3Data.revealProgress + delta * 0.35);
      const fogMat = this.lamp3Data.fogVeil.material as THREE.MeshBasicMaterial;
      fogMat.opacity = Math.max(0, 0.94 * (1 - this.lamp3Data.revealProgress));
      if (fogMat.opacity <= 0.02) {
        this.lamp3Data.fogVeil.visible = false;
      }
      this.lamp3Data.brambles.position.y = -this.lamp3Data.revealProgress * 0.45;
      this.lamp3Data.brambles.rotation.z = this.lamp3Data.revealProgress * 0.4;
    }

    // 13. Bungalow Window Flicker (Triggered by Lamp 2)
    if (this.windowFlickerTimer >= 0 && this.bungalowFlickerWindow && this.bungalowWindowLight) {
      this.windowFlickerTimer += delta;
      const winMat = this.bungalowFlickerWindow.material as THREE.MeshStandardMaterial;

      if (this.windowFlickerTimer < 0.75) {
        // Unsettling rapid jitter glow
        const flicker = Math.sin(this.windowFlickerTimer * 45.0) > 0 ? 1.0 : 0.35;
        const intensity = 2.4 * flicker;
        this.bungalowWindowLight.intensity = intensity;
        winMat.emissive.setHex(0xffaa44);
        winMat.emissiveIntensity = intensity * 1.6;
      } else {
        // Snaps immediately OFF to black
        this.bungalowWindowLight.intensity = 0;
        winMat.emissive.setHex(0x000000);
        winMat.emissiveIntensity = 0;
        this.windowFlickerTimer = -1;
      }
    }

    // 14. Haunted Passage Wall Lantern Dynamic Filament
    if (this.passageLanternLight && this.passageLanternBulb) {
      const bMat = this.passageLanternBulb.material as THREE.MeshStandardMaterial;
      if (this.passageLanternFlickerBurst > 0) {
        this.passageLanternFlickerBurst -= delta;
        const sputter = Math.sin(elapsedTime * 65.0) > 0 ? 1.6 : 0.05;
        this.passageLanternLight.intensity = sputter;
        bMat.emissiveIntensity = sputter * 2.0;
      } else {
        const subtleFlicker = 0.45 + Math.sin(elapsedTime * 1.8) * 0.08 + (Math.sin(elapsedTime * 14.2) > 0.8 ? -0.18 : 0.04);
        this.passageLanternLight.intensity = Math.max(0.12, subtleFlicker);
        bMat.emissiveIntensity = subtleFlicker * 1.5;
      }
    }

    // 15. Ambiguous Shadow Figure crossing the passage courtyard exit
    if (this.passageShadowFigure && this.passageShadowTimer >= 0) {
      this.passageShadowTimer -= delta;
      const sMat = this.passageShadowFigure.material as THREE.MeshBasicMaterial;
      const duration = 2.0;
      const progress = 1.0 - (this.passageShadowTimer / duration);
      if (progress >= 0 && progress <= 1.0) {
        this.passageShadowFigure.visible = true;
        // Glides across courtyard opening from x = -4.5 to x = 4.5
        this.passageShadowFigure.position.x = -4.5 + progress * 9.0;
        // Fades in then out
        sMat.opacity = Math.sin(progress * Math.PI) * 0.32;
      } else {
        this.passageShadowFigure.visible = false;
        sMat.opacity = 0;
        this.passageShadowTimer = -1;
      }
    }

    // 16. Cinematic Bungalow Reveal (Upper-floor attic window lights up then goes pitch dark)
    if (this.bungalowRevealTimer >= 0 && this.bungalowRevealWindow && this.bungalowRevealLight) {
      this.bungalowRevealTimer -= delta;
      const winMat = this.bungalowRevealWindow.material as THREE.MeshStandardMaterial;
      if (this.bungalowRevealTimer > 0) {
        // Flickering warm candle flare
        const candleFlicker = Math.sin(elapsedTime * 18.0) * 0.35 + Math.cos(elapsedTime * 27.0) * 0.25;
        const currentInt = Math.max(0.6, 2.2 + candleFlicker);
        this.bungalowRevealLight.intensity = currentInt;
        winMat.emissive.setHex(0xff7722);
        winMat.emissiveIntensity = currentInt * 1.8;
      } else {
        // SNAPS completely dark
        this.bungalowRevealLight.intensity = 0;
        winMat.emissive.setHex(0x000000);
        winMat.emissiveIntensity = 0;
        this.bungalowRevealTimer = -1;
      }
    }

    // 17. Subtle wind flutter on story posters in the passage
    if (this.passagePaperMeshes.length > 2) {
      const gust = Math.sin(elapsedTime * 3.5) * Math.cos(elapsedTime * 1.7);
      if (gust > 0.68) {
        const microFlutter = (gust - 0.68) * 0.04;
        this.passagePaperMeshes[0].rotation.y = microFlutter;
        this.passagePaperMeshes[2].rotation.y = -microFlutter;
      } else {
        this.passagePaperMeshes[0].rotation.y = 0;
        this.passagePaperMeshes[2].rotation.y = 0;
      }
    }
  }

  public triggerPassageLanternFlicker(): void {
    this.passageLanternFlickerBurst = 2.4;
  }

  public triggerPassageShadowCross(): void {
    this.passageShadowTimer = 2.0;
  }

  public triggerBungalowRevealLight(): void {
    this.bungalowRevealTimer = 3.2;
  }

  /**
   * Ambiguous silhouette in the distant woods along the driveway path.
   * Soft, translucent shape placed among pine trunks (X: -7.8, Z: 14.5).
   */
  private buildDistantAmbiguousShape(): void {
    const mistGeo = new THREE.CylinderGeometry(0.25, 0.48, 2.4, 10);
    const mistMat = new THREE.MeshBasicMaterial({
      color: 0x070b10,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    this.distantAmbiguousMistShape = new THREE.Mesh(mistGeo, mistMat);
    this.distantAmbiguousMistShape.position.set(-7.8, 2.2, 14.5);
    this.distantAmbiguousMistShape.visible = false;
    this.scene.add(this.distantAmbiguousMistShape);
  }

  /**
   * Triggers the subtle ambiguous movement in the distant fog/tree area.
   * The shape drifts behind a pine tree trunk and fades away smoothly.
   */
  public triggerDistantAmbiguousMovement(): void {
    this.ambiguousMistTimer = 0;
    if (this.distantAmbiguousMistShape) {
      this.distantAmbiguousMistShape.position.set(-7.8, 2.2, 14.5);
      this.distantAmbiguousMistShape.visible = true;
      (this.distantAmbiguousMistShape.material as THREE.MeshBasicMaterial).opacity = 0;
    }
  }

  // =========================================================================
  // 3-LAMP RITUAL SYSTEM (ALL THREE LAMPS LOCATED OUTSIDE THE MAIN GATE)
  // =========================================================================

  private buildRitualElements(): void {
    // 1. GATE NOTE: Weathered handwritten note pinned to the left stone gate pillar
    const noteBoardGeo = new THREE.BoxGeometry(0.72, 0.72, 0.04);
    const noteBoardMat = new THREE.MeshStandardMaterial({
      color: 0x2e261e,
      roughness: 0.88,
      metalness: 0.12,
    });
    const noteBoard = new THREE.Mesh(noteBoardGeo, noteBoardMat);
    noteBoard.position.copy(this.notePosition);
    noteBoard.rotation.y = 0.15;
    this.scene.add(noteBoard);

    const noteGeo = new THREE.PlaneGeometry(0.58, 0.58);
    const noteMat = new THREE.MeshStandardMaterial({
      map: this.textures.gateNote,
      roughness: 0.82,
      metalness: 0.08,
    });
    this.noteMesh = new THREE.Mesh(noteGeo, noteMat);
    this.noteMesh.position.set(this.notePosition.x, this.notePosition.y, this.notePosition.z + 0.024);
    this.noteMesh.rotation.y = 0.15;
    this.scene.add(this.noteMesh);

    // 2. LAMP 1: BROKEN GARDEN SHRINE (Outside gate, to the LEFT)
    this.buildBrokenGardenShrine();

    // 3. LAMP 2: DEAD TREE AREA (Outside gate, to the RIGHT)
    this.buildDeadTreeArea();

    // 4. LAMP 3: HIDDEN STONE ALCOVE (Outside gate, concealed initially)
    this.buildHiddenAlcoveArea();

    // 5. HIDDEN KEY COMPARTMENT & OLD IRON KEY (Outside gate, left pillar base)
    this.buildKeyCompartmentAndKey();

    // 6. BUNGALOW FLICKER WINDOW (Mounted on the distant mansion facade)
    this.buildBungalowFlickerWindow();
  }

  /**
   * LAMP 1: BROKEN GARDEN SHRINE (Outside Main Gate, to the LEFT)
   * Broken stone shrine, old abandoned garden area, trees around it, light fog, partially hidden.
   */
  private buildBrokenGardenShrine(): void {
    const shrineGroup = new THREE.Group();
    shrineGroup.position.set(-13.2, 0, -14.2);

    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x363b38,
      roughness: 0.88,
      metalness: 0.12,
    });
    const mossStoneMat = new THREE.MeshStandardMaterial({
      color: 0x2a3328,
      roughness: 0.92,
      metalness: 0.08,
    });

    // Tier 1: Lower weathered plinth
    const plinth1 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.38, 2.0), stoneMat);
    plinth1.position.set(0, 0.19, 0);
    plinth1.receiveShadow = true;
    shrineGroup.add(plinth1);

    // Tier 2: Stepped upper plinth
    const plinth2 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.32, 1.5), mossStoneMat);
    plinth2.position.set(0, 0.54, 0);
    plinth2.receiveShadow = true;
    shrineGroup.add(plinth2);

    // Broken fluted stone column stump
    const colStump = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 1.25, 12), stoneMat);
    colStump.position.set(-0.55, 1.15, -0.2);
    colStump.rotation.z = 0.08;
    shrineGroup.add(colStump);

    // Fallen column fragment lying fractured on the ground
    const colFrag = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.85, 10), stoneMat);
    colFrag.position.set(0.7, 0.32, 0.6);
    colFrag.rotation.z = Math.PI / 2 + 0.2;
    colFrag.rotation.y = 0.4;
    shrineGroup.add(colFrag);

    // Cracked stone altar slab resting on the plinth
    const altarSlab = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.18, 0.8), mossStoneMat);
    altarSlab.position.set(0.1, 0.79, -0.05);
    altarSlab.castShadow = true;
    shrineGroup.add(altarSlab);

    // Overgrown dead brambles / thorny vines around the shrine base
    const brambleMat = new THREE.MeshStandardMaterial({
      color: 0x1f1b16,
      roughness: 0.95,
      metalness: 0.05,
    });
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const bRad = 1.0 + (i % 2) * 0.35;
      const vineArc = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.05, 5, 10, Math.PI * 1.2), brambleMat);
      vineArc.position.set(Math.cos(angle) * bRad, 0.35, Math.sin(angle) * bRad);
      vineArc.rotation.set(Math.PI / 2 + (i * 0.2), i * 0.5, 0);
      shrineGroup.add(vineArc);
    }

    // Local light ground fog hovering over shrine
    const shrineFogMat = new THREE.MeshBasicMaterial({
      map: this.textures.fog,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
    });
    const shrineFog = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6), shrineFogMat);
    shrineFog.position.set(0, 0.45, 0);
    shrineFog.rotation.x = -Math.PI / 2;
    shrineGroup.add(shrineFog);

    this.scene.add(shrineGroup);

    // Add physical collider for stone shrine so player doesn't walk inside it
    const shrineCollider = new THREE.Box3();
    shrineCollider.setFromCenterAndSize(
      new THREE.Vector3(-13.2, 0.75, -14.2),
      new THREE.Vector3(2.6, 1.5, 2.2)
    );
    this.colliders.push(shrineCollider);

    // Build the vintage oil lamp sitting on the altar slab (y = 0.96)
    this.lamp1Data = this.createOilLampMesh('LAMP_1', this.lamp1Position);
  }

  /**
   * LAMP 2: DEAD TREE AREA (Outside Main Gate, to the RIGHT)
   * Large dead tree, exposed roots, dark soil, fog, lamp partially hidden between the roots.
   */
  private buildDeadTreeArea(): void {
    const treeAreaGroup = new THREE.Group();
    treeAreaGroup.position.set(13.6, 0, -13.8);

    const darkBarkMat = new THREE.MeshStandardMaterial({
      color: 0x1c1916,
      roughness: 0.94,
      metalness: 0.06,
    });
    const darkSoilMat = new THREE.MeshStandardMaterial({
      color: 0x181512,
      roughness: 0.98,
      metalness: 0.02,
    });

    // Dark soil mound
    const soilMound = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.4, 0.45, 14), darkSoilMat);
    soilMound.position.set(0, 0.22, 0);
    soilMound.receiveShadow = true;
    treeAreaGroup.add(soilMound);

    // Massive twisted dead tree trunk
    const trunkGeo = new THREE.CylinderGeometry(0.7, 1.15, 9.5, 12);
    const trunk = new THREE.Mesh(trunkGeo, darkBarkMat);
    trunk.position.set(0, 4.75, 0);
    trunk.rotation.z = -0.06;
    trunk.rotation.x = 0.04;
    trunk.castShadow = true;
    treeAreaGroup.add(trunk);

    // Heavy bare crooked dead branches reaching into mist
    const branchAngles = [0.4, 1.8, 3.2, 4.7];
    branchAngles.forEach((ang, idx) => {
      const bGeo = new THREE.CylinderGeometry(0.18, 0.35, 4.2, 8);
      const branch = new THREE.Mesh(bGeo, darkBarkMat);
      branch.position.set(Math.cos(ang) * 1.3, 7.5 + idx * 0.4, Math.sin(ang) * 1.3);
      branch.rotation.z = Math.cos(ang) * 0.85;
      branch.rotation.x = Math.sin(ang) * 0.75;
      treeAreaGroup.add(branch);
    });

    // 6 Large thick exposed roots arching out into dark soil
    for (let r = 0; r < 6; r++) {
      const rAng = (r / 6) * Math.PI * 2;
      const rootLength = 1.8 + (r % 2) * 0.6;
      const rootGeo = new THREE.CylinderGeometry(0.14, 0.28, rootLength, 8);
      const root = new THREE.Mesh(rootGeo, darkBarkMat);
      root.position.set(Math.cos(rAng) * (rootLength * 0.55), 0.32, Math.sin(rAng) * (rootLength * 0.55));
      root.rotation.z = Math.PI / 2 + Math.cos(rAng) * 0.35;
      root.rotation.y = rAng;
      treeAreaGroup.add(root);
    }

    // Local ground fog plane weaving around roots
    const treeFogMat = new THREE.MeshBasicMaterial({
      map: this.textures.fog,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    const treeFog = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.2), treeFogMat);
    treeFog.position.set(0, 0.35, 0);
    treeFog.rotation.x = -Math.PI / 2;
    treeAreaGroup.add(treeFog);

    this.scene.add(treeAreaGroup);

    // Physical collider for dead tree trunk
    const treeCollider = new THREE.Box3();
    treeCollider.setFromCenterAndSize(
      new THREE.Vector3(13.6, 3.5, -13.8),
      new THREE.Vector3(2.4, 7.0, 2.4)
    );
    this.colliders.push(treeCollider);

    // Build the vintage oil lamp nestled low between exposed roots (y = 0.42)
    this.lamp2Data = this.createOilLampMesh('LAMP_2', this.lamp2Position);
  }

  /**
   * LAMP 3: HIDDEN ALCOVE (Outside Main Gate, along outer perimeter wall)
   * Obscured at game start by dense dark fog veil and tangled dead brambles.
   * Only revealed once Lamp 1 AND Lamp 2 are both lit!
   */
  private buildHiddenAlcoveArea(): void {
    const alcoveGroup = new THREE.Group();
    alcoveGroup.position.set(this.lamp3Position.x, 0, this.lamp3Position.z);

    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x2e302c,
      roughness: 0.9,
      metalness: 0.1,
    });

    // Outer stone wall buttress forming an alcove nook
    const wallButtress = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.4, 1.2), stoneMat);
    wallButtress.position.set(0.6, 1.2, -0.4);
    alcoveGroup.add(wallButtress);

    // Angled collapsed granite slab creating a sheltered crevice
    const angledSlab = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 0.22), stoneMat);
    angledSlab.position.set(-0.4, 0.9, 0.3);
    angledSlab.rotation.y = 0.45;
    angledSlab.rotation.z = -0.25;
    alcoveGroup.add(angledSlab);

    // Recessed shelf inside the crevice where Lamp 3 rests
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.16, 0.6), stoneMat);
    shelf.position.set(0, 0.76, 0);
    alcoveGroup.add(shelf);

    // Dense Tangled Brambles covering the alcove opening
    const bramblesGroup = new THREE.Group();
    const vineMat = new THREE.MeshStandardMaterial({
      color: 0x1a1612,
      roughness: 0.95,
      metalness: 0.05,
    });
    for (let b = 0; b < 7; b++) {
      const bramble = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.045, 6, 12, Math.PI * 1.3), vineMat);
      bramble.position.set(-0.35 + b * 0.12, 0.8 + (b % 3) * 0.25, 0.35);
      bramble.rotation.set(0.4, b * 0.6, 0.3);
      bramblesGroup.add(bramble);
    }
    alcoveGroup.add(bramblesGroup);

    // Dense Murky Dark Fog Veil Plane concealing the crevice at game start
    const fogVeilMat = new THREE.MeshBasicMaterial({
      color: 0x090e14,
      transparent: true,
      opacity: 0.94,
      depthWrite: false,
    });
    const fogVeil = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.2), fogVeilMat);
    fogVeil.position.set(0, 1.1, 0.45);
    alcoveGroup.add(fogVeil);

    this.scene.add(alcoveGroup);

    // Build the vintage oil lamp sitting on the recessed shelf
    const lampMesh = this.createOilLampMesh('LAMP_3', this.lamp3Position);

    this.lamp3Data = {
      ...lampMesh,
      fogVeil,
      brambles: bramblesGroup,
      isRevealed: false,
      revealProgress: 0,
    };
  }

  /**
   * HIDDEN KEY COMPARTMENT & OLD IRON KEY (Outside Main Gate, on left pillar base)
   * Compartment clicks open and reveals the key after the 3-lamp ritual is complete.
   */
  private buildKeyCompartmentAndKey(): void {
    const compGroup = new THREE.Group();
    compGroup.position.copy(this.keyPosition);

    // Carved stone compartment box
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0x242220,
      roughness: 0.85,
      metalness: 0.15,
    });
    const compBox = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.42, 0.28), boxMat);
    compBox.position.set(0, 0, 0);
    compGroup.add(compBox);

    // Compartment door plate
    const ironDoorMat = new THREE.MeshStandardMaterial({
      color: 0x2e2924,
      roughness: 0.72,
      metalness: 0.65,
    });
    this.keyCompartmentDoor = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.36, 0.04), ironDoorMat);
    this.keyCompartmentDoor.position.set(0, 0, 0.15);
    compGroup.add(this.keyCompartmentDoor);

    // 3D Old Gothic Iron Key
    this.ironKeyMesh = new THREE.Group();
    this.ironKeyMesh.position.set(0, -0.02, 0.06);
    this.ironKeyMesh.rotation.z = Math.PI / 4;
    this.ironKeyMesh.visible = false; // Hidden until revealed

    const keyMat = new THREE.MeshStandardMaterial({
      color: 0x3a3d42,
      roughness: 0.45,
      metalness: 0.85,
    });

    // Key bow (trefoil / gothic circular loop)
    const bow = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.016, 8, 16), keyMat);
    bow.position.set(0, 0.12, 0);
    this.ironKeyMesh.add(bow);

    // Key stem
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.24, 8), keyMat);
    stem.position.set(0, 0, 0);
    this.ironKeyMesh.add(stem);

    // Key bit wards (notched teeth)
    const bit1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 0.014), keyMat);
    bit1.position.set(0.03, -0.07, 0);
    this.ironKeyMesh.add(bit1);

    const bit2 = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.018, 0.014), keyMat);
    bit2.position.set(0.024, -0.10, 0);
    this.ironKeyMesh.add(bit2);

    compGroup.add(this.ironKeyMesh);
    this.scene.add(compGroup);
  }

  /**
   * BUNGALOW FLICKER WINDOW: Ground floor/veranda window that flickers when Lamp 2 is lit.
   */
  private buildBungalowFlickerWindow(): void {
    const winMat = new THREE.MeshStandardMaterial({
      color: 0x111316,
      emissive: 0x000000,
      emissiveIntensity: 0,
      roughness: 0.3,
    });
    // Placed on the bungalow front facade (world Z approx -59)
    this.bungalowFlickerWindow = new THREE.Mesh(new THREE.BoxGeometry(1.9, 2.8, 0.12), winMat);
    this.bungalowFlickerWindow.position.set(6.5, 3.8, -58.95);
    this.scene.add(this.bungalowFlickerWindow);

    this.bungalowWindowLight = new THREE.PointLight(0xffaa44, 0, 22, 1.8);
    this.bungalowWindowLight.position.set(6.5, 3.8, -58.2);
    this.scene.add(this.bungalowWindowLight);
  }

  /**
   * Environmental surface structures:
   * 1. Rustic Timber Footbridge across muddy ditch towards Garden Shrine (WOOD audio)
   * 2. Timber Woodcutter Staging Planks near Dead Tree (WOOD audio)
   * 3. Granite Threshold Flagstones in front of Main Gate (STONE audio)
   */
  private buildWoodenWalkwaysAndThresholds(): void {
    const walkwayGroup = new THREE.Group();

    // Dark weathered colonial oak / teak wood material for planks
    const timberMat = new THREE.MeshStandardMaterial({
      color: 0x2e251c,
      roughness: 0.85,
      metalness: 0.08,
    });
    const beamMat = new THREE.MeshStandardMaterial({
      color: 0x241d16,
      roughness: 0.92,
      metalness: 0.05,
    });
    const stoneFlagMat = new THREE.MeshStandardMaterial({
      color: 0x3a4042,
      roughness: 0.86,
      metalness: 0.14,
    });

    // 1. Weathered Timber Footbridge across muddy ditch leading to Garden Shrine
    // Spanning from x = -6.0 to x = -10.6, centered along z = -14.3
    const beam1 = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.14, 0.22), beamMat);
    beam1.position.set(-8.3, 0.06, -15.1);
    beam1.receiveShadow = true;
    walkwayGroup.add(beam1);

    const beam2 = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.14, 0.22), beamMat);
    beam2.position.set(-8.3, 0.06, -13.5);
    beam2.receiveShadow = true;
    walkwayGroup.add(beam2);

    // Transverse wooden deck planks
    const plankGeo = new THREE.BoxGeometry(0.24, 0.06, 1.85);
    const plankCount = 18;
    for (let p = 0; p < plankCount; p++) {
      const px = -6.1 - (p / (plankCount - 1)) * 4.4;
      const plank = new THREE.Mesh(plankGeo, timberMat);
      const tilt = Math.sin(p * 1.7) * 0.02;
      const yOffset = 0.11 + Math.cos(p * 2.3) * 0.01;
      plank.position.set(px, yOffset, -14.3 + Math.sin(p * 0.8) * 0.03);
      plank.rotation.y = tilt;
      plank.rotation.z = (Math.random() - 0.5) * 0.015;
      plank.castShadow = true;
      plank.receiveShadow = true;
      walkwayGroup.add(plank);
    }

    // Wooden edge stakes driven into the muddy banks
    const stakeGeo = new THREE.CylinderGeometry(0.045, 0.055, 0.6, 6);
    const stakePositions = [
      [-6.1, -15.2], [-6.1, -13.4],
      [-8.3, -15.25], [-8.3, -13.35],
      [-10.5, -15.2], [-10.5, -13.4],
    ];
    stakePositions.forEach(([sx, sz]) => {
      const stake = new THREE.Mesh(stakeGeo, beamMat);
      stake.position.set(sx, 0.22, sz);
      stake.rotation.z = (Math.random() - 0.5) * 0.1;
      stake.castShadow = true;
      walkwayGroup.add(stake);
    });

    // 2. Timber Staging Planks near the Dead Tree (x in [8.8, 11.6], z around -13.8)
    const treePlankGeo = new THREE.BoxGeometry(0.28, 0.05, 1.6);
    for (let tp = 0; tp < 10; tp++) {
      const tpx = 8.8 + (tp / 9) * 2.8;
      const tPlank = new THREE.Mesh(treePlankGeo, timberMat);
      tPlank.position.set(tpx, 0.08 + (tp % 2) * 0.01, -13.8 + (Math.random() - 0.5) * 0.08);
      tPlank.rotation.y = tp % 2 === 0 ? 0.03 : -0.02;
      tPlank.castShadow = true;
      tPlank.receiveShadow = true;
      walkwayGroup.add(tPlank);
    }

    // 3. Granite Stone Threshold Flagstones in front of Main Gate (z around -22, x in [-3.6, 3.6])
    const flagGeo = new THREE.BoxGeometry(1.15, 0.08, 1.35);
    for (let f = 0; f < 6; f++) {
      const fx = -2.85 + f * 1.14;
      const flag = new THREE.Mesh(flagGeo, stoneFlagMat);
      flag.position.set(fx, 0.04, -22.05 + (f % 2) * 0.03);
      flag.receiveShadow = true;
      walkwayGroup.add(flag);
    }

    this.scene.add(walkwayGroup);
  }

  /**
   * Generates a detailed 3D antique brass/iron oil lamp with dirty glass chimney and wick flame.
   */
  private createOilLampMesh(id: string, worldPos: THREE.Vector3) {
    const group = new THREE.Group();
    group.position.copy(worldPos);

    const ironMat = new THREE.MeshStandardMaterial({
      color: 0x221f1c,
      roughness: 0.65,
      metalness: 0.72,
    });
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0x5a4b2c,
      roughness: 0.45,
      metalness: 0.82,
    });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xa8b6be,
      roughness: 0.18,
      metalness: 0.25,
      transparent: true,
      opacity: 0.52,
    });

    // 1. Lamp heavy base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.08, 14), ironMat);
    base.position.set(0, 0.04, 0);
    group.add(base);

    // 2. Oil reservoir font
    const font = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.17, 0.16, 14), ironMat);
    font.position.set(0, 0.16, 0);
    group.add(font);

    // 3. Brass burner collar & wick knob
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.06, 12), brassMat);
    collar.position.set(0, 0.27, 0);
    group.add(collar);

    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.06, 8), brassMat);
    knob.position.set(0.13, 0.27, 0);
    knob.rotation.z = Math.PI / 2;
    group.add(knob);

    // 4. Dirty glass chimney
    const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.11, 0.38, 12), glassMat);
    chimney.position.set(0, 0.48, 0);
    group.add(chimney);

    // 5. Wire bail handle
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.012, 6, 14, Math.PI), ironMat);
    handle.position.set(0, 0.52, 0);
    group.add(handle);

    // 6. Flame Mesh (Initially unlit / scaled to 0)
    const flameGeo = new THREE.SphereGeometry(0.038, 8, 8);
    flameGeo.scale(1, 2.2, 1);
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0xffbb44,
    });
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.set(0, 0.36, 0);
    flame.scale.set(0, 0, 0); // hidden until lit
    flame.visible = false;
    group.add(flame);

    // 7. Subtle smoke wisps quad (rises above chimney)
    const smokeMat = new THREE.MeshBasicMaterial({
      map: this.textures.fog,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const smoke = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.32), smokeMat);
    smoke.position.set(0, 0.72, 0);
    group.add(smoke);

    // 8. Warm local illumination PointLight (Initially intensity = 0)
    const light = new THREE.PointLight(0xff9933, 0, 7.5, 1.6);
    light.position.set(0, 0.42, 0);
    group.add(light);

    this.scene.add(group);

    return {
      group,
      flame,
      smoke,
      light,
      isLit: false,
    };
  }

  /**
   * Lights an oil lamp with realistic flame, smoke, and warm illumination.
   */
  public lightLamp(lampId: 'LAMP_1' | 'LAMP_2' | 'LAMP_3'): void {
    let lamp: { flame: THREE.Mesh; smoke: THREE.Mesh; light: THREE.PointLight; isLit: boolean };
    if (lampId === 'LAMP_1') lamp = this.lamp1Data;
    else if (lampId === 'LAMP_2') lamp = this.lamp2Data;
    else lamp = this.lamp3Data;

    lamp.isLit = true;
    lamp.flame.visible = true;
    lamp.flame.scale.set(1, 1, 1);
    lamp.light.intensity = 1.9;
    (lamp.smoke.material as THREE.MeshBasicMaterial).opacity = 0.26;
  }

  /**
   * Environmental shift that reveals Lamp 3 outside the gate.
   * Fog veil slowly dissipates and tangled brambles sink down into the moss.
   */
  public revealLamp3(): void {
    if (!this.lamp3Data) return;
    this.lamp3Data.isRevealed = true;
  }

  /**
   * Triggers the bungalow window to flicker ON briefly and immediately turn OFF.
   */
  public triggerBungalowWindowFlicker(): void {
    this.windowFlickerTimer = 0;
  }

  /**
   * Reveals the Old Iron Key outside the gate in the pillar compartment.
   */
  public revealIronKey(): void {
    this.isKeyRevealed = true;
    if (this.keyCompartmentDoor) {
      this.keyCompartmentDoor.position.x = 0.22; // slide open
    }
    if (this.ironKeyMesh) {
      this.ironKeyMesh.visible = true;
    }
  }

  /**
   * Collects the Old Iron Key into investigator inventory.
   */
  public collectIronKey(): void {
    this.isKeyCollected = true;
    if (this.ironKeyMesh) {
      this.ironKeyMesh.visible = false;
    }
  }

  /**
   * Drops the heavy iron chain and padlock to the ground during unlocking.
   */
  public dropChains(): void {
    this.isChainsDropped = true;
    this.chainDropY = 0;
    this.chainDropVelocity = 0;

    // Immediately hide any static wrapped chain links so they do not float in the air
    if (this.wrappedChainLinks && this.wrappedChainLinks.length > 0) {
      for (const link of this.wrappedChainLinks) {
        link.visible = false;
      }
    }
  }

  /**
   * Animates unlocking and opening the massive Victorian gate wings.
   */
  public setGateOpenProgress(progress: number): void {
    this.gateOpenProgress = Math.min(1, Math.max(0, progress));
    this.isGateOpen = this.gateOpenProgress > 0.05;

    // Swing gate wings outward
    if (this.leftGateWing && this.rightGateWing) {
      this.leftGateWing.rotation.y = -this.gateOpenProgress * 1.32;
      this.rightGateWing.rotation.y = this.gateOpenProgress * 1.32;
    }

    // Hide padlock and chains once unlocking begins
    if (this.padlockGroup) {
      this.padlockGroup.visible = this.gateOpenProgress < 0.15;
    }
    if (this.swingingChainGroup) {
      this.swingingChainGroup.visible = this.gateOpenProgress < 0.15;
    }
    if (this.wrappedChainLinks && this.wrappedChainLinks.length > 0) {
      const showWrapped = this.gateOpenProgress < 0.05 && !this.isChainsDropped;
      for (const link of this.wrappedChainLinks) {
        link.visible = showWrapped;
      }
    }

    // Move physical gate collider out of player path once open
    if (this.gateCollider && this.gateOpenProgress >= 0.25) {
      this.gateCollider.min.y = 999;
      this.gateCollider.max.y = 999;
    }
  }

  /**
   * Sets horror scare environment modifiers:
   * - freezing wind/trees
   * - making fog denser (without solid black wall)
   * - cooling lighting (shifting color slightly colder blue-gray)
   */
  public setHorrorAtmosphere(frozen: boolean, fogDensityRatio: number, coldShiftRatio: number): void {
    this.isHorrorEnvironmentFrozen = frozen;
    this.horrorFogDensityFactor = fogDensityRatio;
    this.horrorLightingCooling = coldShiftRatio;

    // Linear fog adjustment
    if (this.scene.fog && this.scene.fog instanceof THREE.Fog) {
      // Base is near: 16, far: 92. Increase density smoothly by pulling far fog closer (e.g. 52m)
      this.scene.fog.near = 16 - (fogDensityRatio - 1.0) * 8;
      this.scene.fog.far = 92 - (fogDensityRatio - 1.0) * 44;
      // Shift fog color slightly colder (0x0d1520 -> 0x091422)
      const baseFogColor = new THREE.Color(0x0d1520);
      const coldFogColor = new THREE.Color(0x07111b);
      this.scene.fog.color.lerpColors(baseFogColor, coldFogColor, coldShiftRatio);
    }

    // Cooling lighting adjustment
    if (this.hemiLight) {
      const baseSky = new THREE.Color(0x40526e);
      const coldSky = new THREE.Color(0x283e58);
      this.hemiLight.color.lerpColors(baseSky, coldSky, coldShiftRatio);
    }
    if (this.moonLight) {
      const baseMoon = new THREE.Color(0x768dae);
      const coldMoon = new THREE.Color(0x607d9e);
      this.moonLight.color.lerpColors(baseMoon, coldMoon, coldShiftRatio);
    }
  }

  /**
   * Collects the physical world hammer from the veranda crate.
   */
  public collectHammer(): void {
    this.isHammerCollected = true;
    if (this.bungalowHammerMesh) {
      this.bungalowHammerMesh.visible = false;
    }
  }

  /**
   * Visually damages the bungalow door with splinters, cracks, and wood impacts.
   */
  public damageBungalowDoor(hitCount: number): void {
    this.bungalowDoorDamageLevel = hitCount;
    if (!this.bungalowDoorMesh) return;

    // Add physical 3D splinter gouges on the door seam
    const splinterMat = new THREE.MeshStandardMaterial({
      color: 0x5a4430,
      roughness: 0.9,
    });

    const splinterGeo = new THREE.BoxGeometry(0.12, 0.35 + hitCount * 0.15, 0.05);
    const splinter = new THREE.Mesh(splinterGeo, splinterMat);
    splinter.position.set(
      (Math.random() - 0.5) * 0.4,
      -0.2 + (hitCount - 1) * 0.25,
      0.14
    );
    splinter.rotation.z = (Math.random() - 0.5) * 0.6;
    this.bungalowDoorMesh.add(splinter);

    // Particle burst of wood splinters flying outward from the point of impact
    const particleCount = 28;
    const pGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 0.8;
      positions[i * 3 + 1] = -0.1 + (Math.random() - 0.5) * 0.8;
      positions[i * 3 + 2] = 0.2 + Math.random() * 0.8;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x6e5238,
      size: 0.035,
      transparent: true,
      opacity: 0.9,
    });
    const splinters = new THREE.Points(pGeo, pMat);
    this.bungalowDoorMesh.add(splinters);
    setTimeout(() => {
      this.bungalowDoorMesh?.remove(splinters);
      pGeo.dispose();
      pMat.dispose();
    }, 1200);
  }

  /**
   * Sets the opening angle and creak animation for the bungalow double doors.
   */
  public setBungalowDoorOpenProgress(progress: number): void {
    this.bungalowDoorOpenProgress = Math.min(1, Math.max(0, progress));
    this.isBungalowDoorOpening = this.bungalowDoorOpenProgress > 0.01;

    // Both heavy wooden wings creak inward into the pitch-dark interior
    if (this.bungalowDoorLeftWing && this.bungalowDoorRightWing) {
      // Rotate around vertical hinge axis inward (negative Z direction)
      this.bungalowDoorLeftWing.rotation.y = this.bungalowDoorOpenProgress * 1.55;
      this.bungalowDoorRightWing.rotation.y = -this.bungalowDoorOpenProgress * 1.55;
    }

    // Move door collider away once door swings open
    if (this.bungalowDoorCollider && this.bungalowDoorOpenProgress >= 0.3) {
      this.bungalowDoorCollider.min.y = 999;
      this.bungalowDoorCollider.max.y = 999;
    }
  }
}

