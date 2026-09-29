import * as THREE from 'three';
import { CinematicMaterials } from './CinematicMaterials';

/**
 * Creates the disturbing, elongated, pale ghost entity for the
 * post-story horror scare sequence in "The House of Devil".
 *
 * Requirements:
 * - Tall, pale, slightly distorted human-like figure (2.3m - 2.5m tall).
 * - Long thin arms reaching downward past knees, elongated fingers.
 * - Torn, decaying shroud/garment with shredded tatters.
 * - Disturbing, unnerving face (sunken empty dark eye sockets, stretched pale jaw,
 *   veins, not comical or cartoonish, no cheap blood splashes).
 * - Slight translucent/ethereal presence with procedural subtle chest twitch/breathing.
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

export class GhostEntityFactory {
  public static createGhost(): DistortedGhostRig {
    const root = new THREE.Group();
    root.name = 'DistortedGhostFigure';

    const materials: THREE.Material[] = [];

    // 1. Ghostly Pale Ashen Flesh Material
    const fleshMat = new THREE.MeshStandardMaterial({
      color: 0xc8d2d8,
      roughness: 0.65,
      metalness: 0.08,
      transparent: true,
      opacity: 0.94,
      emissive: 0x141f26,
      emissiveIntensity: 0.22,
    });
    materials.push(fleshMat);

    // 2. Tattered Decaying Shroud Material
    const shroudMat = new THREE.MeshStandardMaterial({
      color: 0x48525b,
      roughness: 0.95,
      metalness: 0.05,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide,
    });
    materials.push(shroudMat);

    // 3. Hollow Eye Cavity Material (pitch abyss)
    const eyeSocketMat = new THREE.MeshBasicMaterial({
      color: 0x010204,
      transparent: true,
      opacity: 0.98,
    });
    materials.push(eyeSocketMat);

    // 4. Subtle Veins / Subdermal darkness
    const mouthVoidMat = new THREE.MeshBasicMaterial({
      color: 0x020305,
      transparent: true,
      opacity: 0.95,
    });
    materials.push(mouthVoidMat);

    // --- Height: 2.38m tall (distorted, unnatural human proportion) ---

    // Pelvis & Lower shrouded body
    const lowerBody = new THREE.Group();
    lowerBody.position.y = 0.9;
    root.add(lowerBody);

    // Elongated shrouded lower torso & legs
    const lowerShroudGeo = new THREE.CylinderGeometry(0.18, 0.42, 1.35, 12, 4);
    const lowerShroud = new THREE.Mesh(lowerShroudGeo, shroudMat);
    lowerShroud.position.y = -0.3;
    lowerBody.add(lowerShroud);

    // Shroud tatters / shredded hem strips
    const tatters: THREE.Mesh[] = [];
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2;
      const tatterGeo = new THREE.PlaneGeometry(0.12, 0.45);
      const tatter = new THREE.Mesh(tatterGeo, shroudMat);
      tatter.position.set(Math.cos(angle) * 0.38, -0.95, Math.sin(angle) * 0.38);
      tatter.rotation.y = -angle;
      lowerBody.add(tatter);
      tatters.push(tatter);
    }

    // Spine & Upper Torso (Elongated, hollow, gaunt ribcage)
    const chest = new THREE.Group();
    chest.position.y = 0.55;
    lowerBody.add(chest);

    const chestGeo = new THREE.CylinderGeometry(0.24, 0.16, 0.72, 10);
    const chestMesh = new THREE.Mesh(chestGeo, shroudMat);
    chestMesh.position.y = 0.36;
    chest.add(chestMesh);

    // Thin exposed pale collarbone/neck
    const neckGeo = new THREE.CylinderGeometry(0.08, 0.11, 0.32, 10);
    const neck = new THREE.Mesh(neckGeo, fleshMat);
    neck.position.y = 0.8;
    chest.add(neck);

    // Head Group
    const head = new THREE.Group();
    head.position.y = 0.98;
    chest.add(head);

    // Distorted, elongated skull
    const craniumGeo = new THREE.SphereGeometry(0.17, 16, 16);
    craniumGeo.scale(0.88, 1.25, 0.98); // Narrowed, vertically stretched
    const cranium = new THREE.Mesh(craniumGeo, fleshMat);
    cranium.position.set(0, 0.12, 0);
    head.add(cranium);

    // Hollow, sunken dark eye cavities (disturbing, void-like)
    const socketGeo = new THREE.SphereGeometry(0.042, 10, 10);
    socketGeo.scale(1.0, 1.35, 0.6);

    const leftSocket = new THREE.Mesh(socketGeo, eyeSocketMat);
    leftSocket.position.set(-0.065, 0.14, 0.135);
    head.add(leftSocket);

    const rightSocket = new THREE.Mesh(socketGeo, eyeSocketMat);
    rightSocket.position.set(0.065, 0.14, 0.135);
    head.add(rightSocket);

    // Pinpoint dead glint deep inside eye sockets
    const deadGlintGeo = new THREE.SphereGeometry(0.007, 6, 6);
    const glintMat = new THREE.MeshBasicMaterial({ color: 0x768f9e, transparent: true, opacity: 0.65 });
    materials.push(glintMat);

    const leftGlint = new THREE.Mesh(deadGlintGeo, glintMat);
    leftGlint.position.set(-0.065, 0.14, 0.145);
    head.add(leftGlint);

    const rightGlint = new THREE.Mesh(deadGlintGeo, glintMat);
    rightGlint.position.set(0.065, 0.14, 0.145);
    head.add(rightGlint);

    // Gaunt cheekbones
    const cheekGeo = new THREE.BoxGeometry(0.07, 0.05, 0.08);
    const lCheek = new THREE.Mesh(cheekGeo, fleshMat);
    lCheek.position.set(-0.11, 0.08, 0.08);
    lCheek.rotation.y = 0.35;
    head.add(lCheek);

    const rCheek = new THREE.Mesh(cheekGeo, fleshMat);
    rCheek.position.set(0.11, 0.08, 0.08);
    rCheek.rotation.y = -0.35;
    head.add(rCheek);

    // Stretched, unhinged lower jaw
    const jawGeo = new THREE.BoxGeometry(0.11, 0.18, 0.12);
    jawGeo.scale(1.0, 1.2, 0.9);
    const jaw = new THREE.Mesh(jawGeo, fleshMat);
    jaw.position.set(0, -0.05, 0.06);
    jaw.rotation.x = 0.28; // Slightly ajar
    head.add(jaw);

    // Dark oral cavity void inside open jaw
    const mouthVoidGeo = new THREE.PlaneGeometry(0.07, 0.12);
    const mouthVoid = new THREE.Mesh(mouthVoidGeo, mouthVoidMat);
    mouthVoid.position.set(0, 0.02, 0.138);
    head.add(mouthVoid);

    // Strands of wet, decaying stringy hair veiling parts of the face
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x090c0f,
      roughness: 0.9,
      transparent: true,
      opacity: 0.92,
    });
    materials.push(hairMat);

    for (let h = 0; h < 14; h++) {
      const hLength = 0.65 + (h % 4) * 0.12;
      const strandGeo = new THREE.CylinderGeometry(0.005, 0.012, hLength, 4);
      const strand = new THREE.Mesh(strandGeo, hairMat);
      const angle = (h / 14) * Math.PI * 1.6 + 0.25;
      strand.position.set(Math.cos(angle) * 0.15, 0.16 - hLength * 0.45, Math.sin(angle) * 0.14);
      strand.rotation.z = Math.cos(angle) * 0.12;
      strand.rotation.x = Math.sin(angle) * 0.15;
      head.add(strand);
    }

    // --- ARMS: Unnaturally long, thin, hanging past knees ---
    // Left Arm
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.32, 0.62, 0);
    chest.add(leftArm);

    const lUpperArmGeo = new THREE.CylinderGeometry(0.038, 0.032, 0.58, 8);
    const lUpperArm = new THREE.Mesh(lUpperArmGeo, fleshMat);
    lUpperArm.position.y = -0.29;
    leftArm.add(lUpperArm);

    const lForearm = new THREE.Group();
    lForearm.position.y = -0.58;
    leftArm.add(lForearm);

    const lForearmGeo = new THREE.CylinderGeometry(0.032, 0.026, 0.68, 8);
    const lForearmMesh = new THREE.Mesh(lForearmGeo, fleshMat);
    lForearmMesh.position.y = -0.34;
    lForearm.add(lForearmMesh);

    // Elongated clawed fingers
    const lHand = new THREE.Group();
    lHand.position.y = -0.68;
    lForearm.add(lHand);

    for (let f = 0; f < 5; f++) {
      const fingerGeo = new THREE.CylinderGeometry(0.007, 0.004, 0.22, 5);
      const finger = new THREE.Mesh(fingerGeo, fleshMat);
      finger.position.set(-0.03 + f * 0.015, -0.11, 0.01);
      finger.rotation.z = (f - 2) * 0.08;
      lHand.add(finger);
    }

    // Right Arm (Reaching slightly forward and down)
    const rightArm = new THREE.Group();
    rightArm.position.set(0.32, 0.62, 0);
    chest.add(rightArm);

    const rUpperArmGeo = new THREE.CylinderGeometry(0.038, 0.032, 0.58, 8);
    const rUpperArm = new THREE.Mesh(rUpperArmGeo, fleshMat);
    rUpperArm.position.y = -0.29;
    rightArm.add(rUpperArm);

    const rForearm = new THREE.Group();
    rForearm.position.y = -0.58;
    rightArm.add(rForearm);

    const rForearmGeo = new THREE.CylinderGeometry(0.032, 0.026, 0.68, 8);
    const rForearmMesh = new THREE.Mesh(rForearmGeo, fleshMat);
    rForearmMesh.position.y = -0.34;
    rForearm.add(rForearmMesh);

    const rHand = new THREE.Group();
    rHand.position.y = -0.68;
    rForearm.add(rHand);

    for (let f = 0; f < 5; f++) {
      const fingerGeo = new THREE.CylinderGeometry(0.007, 0.004, 0.22, 5);
      const finger = new THREE.Mesh(fingerGeo, fleshMat);
      finger.position.set(-0.03 + f * 0.015, -0.11, 0.01);
      finger.rotation.z = (f - 2) * 0.08;
      rHand.add(finger);
    }

    // Initial natural unnatural arm pose (bent slightly forward)
    leftArm.rotation.x = 0.15;
    leftArm.rotation.z = 0.08;
    rightArm.rotation.x = 0.22;
    rightArm.rotation.z = -0.08;

    // Dissolve opacity helper
    const setDissolveOpacity = (alpha: number) => {
      materials.forEach((mat) => {
        if ('opacity' in mat) {
          (mat as THREE.MeshStandardMaterial).opacity = Math.max(0, Math.min(1, alpha));
        }
      });
    };

    // Twitch / jitter animation helper
    const updateAnimation = (time: number, twitchIntensity: number) => {
      // Eerie slight head tilt
      head.rotation.z = Math.sin(time * 1.8) * 0.06 + Math.sin(time * 9.5) * 0.04 * twitchIntensity;
      head.rotation.x = -0.08 + Math.cos(time * 1.4) * 0.04 + (Math.sin(time * 24.0) > 0.85 ? 0.06 * twitchIntensity : 0);
      head.rotation.y = Math.sin(time * 0.9) * 0.08;

      // Jaw drops more when twitching
      jaw.rotation.x = 0.28 + (twitchIntensity > 0.4 ? 0.18 * Math.sin(time * 30.0) : 0);

      // Tatters flutter
      tatters.forEach((tatter, idx) => {
        tatter.rotation.x = Math.sin(time * 2.5 + idx * 0.8) * 0.18;
      });

      // Arms twitching and reaching
      leftArm.rotation.x = 0.15 + Math.sin(time * 2.2) * 0.05 + Math.sin(time * 18.0) * 0.03 * twitchIntensity;
      rightArm.rotation.x = 0.22 + Math.cos(time * 2.0) * 0.06 + Math.cos(time * 20.0) * 0.04 * twitchIntensity;
    };

    const dispose = () => {
      root.traverse((obj) => {
        if ((obj as THREE.Mesh).geometry) {
          (obj as THREE.Mesh).geometry.dispose();
        }
      });
      materials.forEach((m) => m.dispose());
    };

    return {
      root,
      head,
      jaw,
      bodyMesh: chestMesh,
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
