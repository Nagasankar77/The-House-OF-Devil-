import * as THREE from 'three';

/**
 * Creates the high-fidelity Haunted Woman apparition for "The House of Devil".
 *
 * Visually crafted to precisely match the primary reference image
 * "Haunted Mansion Apparition.png":
 * - Long, messy, wet-looking black hair covering much of the face and body
 * - Pale grey/ashen skin
 * - Extremely dark, unsettling eyes with piercing dead glints
 * - Thin, frightening female appearance with realistic human proportions
 * - Old, dirty, worn white/off-white Victorian long dress with tattered lace cuffs and subtle stains
 * - Subtle ground mist at the base
 * - Psychological horror aesthetic (no cartoon, anime, low-poly, or monster design)
 */
export interface DistortedGhostRig {
  root: THREE.Group;
  head: THREE.Group;
  jaw: THREE.Mesh;
  bodyMesh: THREE.Mesh;
  tatters: THREE.Mesh[];
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  materials: THREE.Material[];
  setDissolveOpacity: (opacity: number) => void;
  updateAnimation: (time: number, twitchIntensity: number) => void;
  dispose: () => void;
}

export type HauntedWomanRig = DistortedGhostRig;

// Shared texture singleton for instant reuse without network lag or duplicate memory
let cachedWomanTexture: THREE.Texture | null = null;

function getHauntedWomanTexture(): THREE.Texture {
  if (!cachedWomanTexture) {
    const loader = new THREE.TextureLoader();
    // Primary cleaned cutout with transparent background, fallback gracefully handled
    cachedWomanTexture = loader.load(
      '/assets/aistudio/haunted_woman_clean.png',
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.needsUpdate = true;
      },
      undefined,
      () => {
        // Fallback to original image if clean PNG is unavailable
        if (cachedWomanTexture) {
          loader.load('/assets/aistudio/Haunted_Mansion_Apparition_ca0f4eb9.png', (fallbackTex) => {
            fallbackTex.colorSpace = THREE.SRGBColorSpace;
            cachedWomanTexture!.image = fallbackTex.image;
            cachedWomanTexture!.needsUpdate = true;
          });
        }
      }
    );
    cachedWomanTexture.colorSpace = THREE.SRGBColorSpace;
    cachedWomanTexture.minFilter = THREE.LinearMipmapLinearFilter;
    cachedWomanTexture.magFilter = THREE.LinearFilter;
  }
  return cachedWomanTexture;
}

export class GhostEntityFactory {
  /**
   * Creates the authentic Haunted Woman entity matching the reference image.
   * Grounded at y = 0 with height 1.76m (realistic female human proportions).
   */
  public static createGhost(): DistortedGhostRig {
    const root = new THREE.Group();
    root.name = 'HauntedWomanApparition';

    const materials: THREE.Material[] = [];
    const womanTexture = getHauntedWomanTexture();

    // 1. Primary High-Resolution Apparition Material
    // Textured with the exact Victorian haunted woman image from the reference
    const apparitionMat = new THREE.MeshStandardMaterial({
      map: womanTexture,
      transparent: true,
      alphaTest: 0.005,
      depthWrite: false,
      roughness: 0.86,
      metalness: 0.03,
      emissive: new THREE.Color(0x182026),
      emissiveIntensity: 0.22,
      emissiveMap: womanTexture,
      side: THREE.DoubleSide,
    });
    materials.push(apparitionMat);

    // 2. Primary Curved Planar Geometry (1.46m width x 1.76m height)
    // Curvature wraps light and perspective naturally around the woman's silhouette
    const width = 1.46;
    const height = 1.76;
    const apparitionGeo = new THREE.PlaneGeometry(width, height, 20, 20);

    // Offset geometry pivot so the bottom base sits flush at y = 0.0 (ground level)
    apparitionGeo.translate(0, height / 2, 0);

    // Apply subtle organic cylindrical curvature so edges bend away from viewer
    const posAttr = apparitionGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const px = posAttr.getX(i);
      const py = posAttr.getY(i);
      // Subtle curvature towards the sides
      const curveZ = -Math.pow(px / (width / 2), 2) * 0.08;
      // Slight forward hunch in the shoulders/head
      const hunchZ = py > 1.2 ? Math.sin(((py - 1.2) / 0.56) * Math.PI) * 0.03 : 0;
      posAttr.setZ(i, curveZ + hunchZ);
    }
    apparitionGeo.computeVertexNormals();

    const bodyMesh = new THREE.Mesh(apparitionGeo, apparitionMat);
    bodyMesh.castShadow = false;
    bodyMesh.receiveShadow = false;
    root.add(bodyMesh);

    // 3. Piercing Dead Eye Glints
    // Dead pale glints deep inside eye sockets matching the unsettling stare
    const eyeGlintGeo = new THREE.SphereGeometry(0.008, 8, 8);
    const eyeGlintMat = new THREE.MeshBasicMaterial({
      color: 0xbed6e8,
      transparent: true,
      opacity: 0.85,
    });
    materials.push(eyeGlintMat);

    const head = new THREE.Group();
    head.position.set(0, 1.48, 0.02);
    root.add(head);

    const leftEye = new THREE.Mesh(eyeGlintGeo, eyeGlintMat);
    leftEye.position.set(-0.032, 0.0, 0.02);
    head.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGlintGeo, eyeGlintMat);
    rightEye.position.set(0.032, 0.0, 0.02);
    head.add(rightEye);

    // 4. Subtle Ground Mist Hovering at Her Feet
    const mistCanvas = document.createElement('canvas');
    mistCanvas.width = 256;
    mistCanvas.height = 256;
    const mCtx = mistCanvas.getContext('2d');
    if (mCtx) {
      const grad = mCtx.createRadialGradient(128, 128, 10, 128, 128, 128);
      grad.addColorStop(0, 'rgba(165, 185, 205, 0.45)');
      grad.addColorStop(0.5, 'rgba(120, 140, 160, 0.22)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      mCtx.fillStyle = grad;
      mCtx.fillRect(0, 0, 256, 256);
    }
    const mistTex = new THREE.CanvasTexture(mistCanvas);
    const mistMat = new THREE.MeshBasicMaterial({
      map: mistTex,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    materials.push(mistMat);

    const mistGeo = new THREE.PlaneGeometry(1.8, 1.8);
    const mistPlane = new THREE.Mesh(mistGeo, mistMat);
    mistPlane.rotation.x = -Math.PI / 2;
    mistPlane.position.set(0, 0.02, 0);
    root.add(mistPlane);

    // 5. Dedicated Eerie Cold Apparition Fill Light
    // Softly illuminates the wet black hair and pale face in the dark outdoor environment
    const ghostLight = new THREE.PointLight(0x8faec7, 0.65, 4.5, 1.6);
    ghostLight.position.set(0, 1.35, 0.45);
    root.add(ghostLight);

    // 6. Compatible Joint Anchors (for interface compatibility)
    const jawGeo = new THREE.BoxGeometry(0.01, 0.01, 0.01);
    const jawMat = new THREE.MeshBasicMaterial({ visible: false });
    materials.push(jawMat);
    const jaw = new THREE.Mesh(jawGeo, jawMat);
    head.add(jaw);

    const leftArm = new THREE.Group();
    leftArm.position.set(-0.35, 1.15, 0);
    root.add(leftArm);

    const rightArm = new THREE.Group();
    rightArm.position.set(0.35, 1.15, 0);
    root.add(rightArm);

    const tatters: THREE.Mesh[] = [];

    // Helper to control dissolve/fade opacity smoothly
    const setDissolveOpacity = (alpha: number) => {
      const clamped = Math.max(0, Math.min(1, alpha));
      apparitionMat.opacity = clamped;
      eyeGlintMat.opacity = clamped * 0.85;
      mistMat.opacity = clamped * 0.55;
      ghostLight.intensity = clamped * 0.65;
    };

    // Update eerie apparition kinematics: breathing, floating, eye glint pulse
    const updateAnimation = (time: number, twitchIntensity: number) => {
      // Subtle float / eerie ground drift
      const floatOffset = Math.sin(time * 2.2) * 0.012;
      bodyMesh.position.y = floatOffset;
      head.position.y = 1.48 + floatOffset;

      // Uncanny micro-twitch in the head tilt
      const jitter = twitchIntensity > 0.3 ? (Math.random() - 0.5) * 0.018 * twitchIntensity : 0;
      head.rotation.z = Math.sin(time * 1.6) * 0.025 + jitter;
      head.rotation.x = Math.sin(time * 1.1) * 0.015;

      // Subtle pulse in the dead stare glint
      eyeGlintMat.opacity = apparitionMat.opacity * (0.75 + Math.sin(time * 4.5) * 0.15);

      // Slow drift in the ground fog
      mistPlane.rotation.z = time * 0.08;
      mistPlane.scale.setScalar(1.0 + Math.sin(time * 1.8) * 0.04);
    };

    const dispose = () => {
      root.traverse((obj) => {
        if ((obj as THREE.Mesh).geometry) {
          (obj as THREE.Mesh).geometry.dispose();
        }
      });
      materials.forEach((m) => m.dispose());
      mistTex.dispose();
      ghostLight.dispose();
    };

    return {
      root,
      head,
      jaw,
      bodyMesh,
      tatters,
      leftArm,
      rightArm,
      materials,
      setDissolveOpacity,
      updateAnimation,
      dispose,
    };
  }
}
