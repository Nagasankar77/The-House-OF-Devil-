import * as THREE from 'three';
import { CinematicMaterials } from './CinematicMaterials';

export interface CharacterAnimationState {
  isWalking?: boolean;
  isSitting?: boolean;
  isTalking?: boolean;
  isCrying?: boolean;
  isTerrified?: boolean;
  gesture?: 'NONE' | 'WAVE' | 'OFFER' | 'POINT' | 'HOLD_HEAD' | 'REACH' | 'CHALLENGE' | 'SHUSH';
  walkSpeed?: number;
  lookTarget?: THREE.Vector3;
}

export interface CinematicCharacterRig {
  root: THREE.Group;
  head: THREE.Group;
  jaw: THREE.Mesh;
  leftEyelid: THREE.Mesh;
  rightEyelid: THREE.Mesh;
  chest: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftForearm: THREE.Group;
  rightForearm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftCalf: THREE.Group;
  rightCalf: THREE.Group;
  update: (time: number, delta: number, state: CharacterAnimationState) => void;
}

export class CinematicCharacters {
  // Helper to build a humanoid rig
  private static buildRig(options: {
    height: number;
    headScale?: number;
    skinMat: THREE.Material;
    hairMat: THREE.Material;
    shirtMat: THREE.Material;
    pantsMat: THREE.Material;
    shoeMat?: THREE.Material;
    hairStyle?: 'SHORT' | 'LONG' | 'PONYTAIL' | 'MESSY';
    hasBeard?: boolean;
    isDress?: boolean;
  }): CinematicCharacterRig {
    const root = new THREE.Group();
    const scale = options.height / 1.75; // Normalize to 1.75m standard height
    root.scale.set(scale, scale, scale);

    const skinMat = options.skinMat;
    const shirtMat = options.shirtMat;
    const pantsMat = options.pantsMat;
    const shoeMat = options.shoeMat || CinematicMaterials.leatherJacket();

    // 1. Pelvis / Hips
    const pelvis = new THREE.Group();
    pelvis.position.y = 0.95;
    root.add(pelvis);

    const pelvisMesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.2, 0.22), pantsMat);
    pelvis.add(pelvisMesh);

    // 2. Chest & Torso
    const chest = new THREE.Group();
    chest.position.y = 0.15;
    pelvis.add(chest);

    const torsoGeo = new THREE.BoxGeometry(0.36, 0.42, 0.24);
    const torsoMesh = new THREE.Mesh(torsoGeo, shirtMat);
    torsoMesh.position.y = 0.2;
    chest.add(torsoMesh);

    // If dress, add skirt lower flare
    if (options.isDress) {
      const skirtGeo = new THREE.ConeGeometry(0.32, 0.45, 12, 1, true);
      skirtGeo.rotateX(Math.PI);
      const skirtMesh = new THREE.Mesh(skirtGeo, shirtMat);
      skirtMesh.position.y = 0.05;
      pelvis.add(skirtMesh);
    }

    // 3. Neck & Head
    const neck = new THREE.Group();
    neck.position.y = 0.43;
    chest.add(neck);

    const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.12, 10), skinMat);
    neckMesh.position.y = 0.06;
    neck.add(neckMesh);

    const head = new THREE.Group();
    head.position.y = 0.14;
    neck.add(head);

    // Head base (proportional cranium)
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 16), skinMat);
    headMesh.scale.set(0.95, 1.15, 1.05);
    head.add(headMesh);

    // Eyes
    const eyeWhiteGeo = new THREE.SphereGeometry(0.024, 8, 8);
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xf5f5f5 });
    const eyePupilGeo = new THREE.SphereGeometry(0.012, 8, 8);
    const eyePupilMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

    const leftEyeGroup = new THREE.Group();
    leftEyeGroup.position.set(0.046, 0.02, 0.115);
    const leftEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    const leftPupil = new THREE.Mesh(eyePupilGeo, eyePupilMat);
    leftPupil.position.z = 0.016;
    leftEyeGroup.add(leftEyeWhite, leftPupil);

    const rightEyeGroup = new THREE.Group();
    rightEyeGroup.position.set(-0.046, 0.02, 0.115);
    const rightEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    const rightPupil = new THREE.Mesh(eyePupilGeo, eyePupilMat);
    rightPupil.position.z = 0.016;
    rightEyeGroup.add(rightEyeWhite, rightPupil);

    // Eyelids (Blinking mechanism)
    const lidGeo = new THREE.SphereGeometry(0.026, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const leftEyelid = new THREE.Mesh(lidGeo, skinMat);
    leftEyelid.rotation.x = 0;
    leftEyeGroup.add(leftEyelid);

    const rightEyelid = new THREE.Mesh(lidGeo, skinMat);
    rightEyelid.rotation.x = 0;
    rightEyeGroup.add(rightEyelid);

    head.add(leftEyeGroup, rightEyeGroup);

    // Nose
    const noseGeo = new THREE.ConeGeometry(0.02, 0.05, 6);
    noseGeo.rotateX(Math.PI * 0.4);
    const nose = new THREE.Mesh(noseGeo, skinMat);
    nose.position.set(0, 0, 0.135);
    head.add(nose);

    // Animated Jaw / Mouth for talking
    const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.022, 0.035), skinMat);
    jaw.position.set(0, -0.055, 0.12);
    head.add(jaw);

    // Hair
    const hair = new THREE.Group();
    head.add(hair);

    if (options.hairStyle === 'LONG') {
      // Long flowing hair
      const hairCrown = new THREE.Mesh(new THREE.SphereGeometry(0.145, 12, 12), options.hairMat);
      hairCrown.position.set(0, 0.04, -0.02);
      hair.add(hairCrown);

      const hairSidesL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.35, 8), options.hairMat);
      hairSidesL.position.set(0.12, -0.08, 0.02);
      hairSidesL.rotation.z = -0.15;

      const hairSidesR = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.35, 8), options.hairMat);
      hairSidesR.position.set(-0.12, -0.08, 0.02);
      hairSidesR.rotation.z = 0.15;

      const hairBack = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.42, 0.08), options.hairMat);
      hairBack.position.set(0, -0.12, -0.1);

      hair.add(hairSidesL, hairSidesR, hairBack);
    } else if (options.hairStyle === 'PONYTAIL') {
      const hairCrown = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), options.hairMat);
      hairCrown.position.set(0, 0.04, -0.02);
      hair.add(hairCrown);

      // Pigtails / small ponytails
      const pigtailL = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.18, 6), options.hairMat);
      pigtailL.position.set(0.14, 0.05, -0.05);
      pigtailL.rotation.z = -0.6;

      const pigtailR = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.18, 6), options.hairMat);
      pigtailR.position.set(-0.14, 0.05, -0.05);
      pigtailR.rotation.z = 0.6;

      hair.add(pigtailL, pigtailR);
    } else {
      // Short / textured styled hair
      const hairCrown = new THREE.Mesh(new THREE.SphereGeometry(0.142, 12, 12), options.hairMat);
      hairCrown.position.set(0, 0.05, -0.01);
      hairCrown.scale.set(1.02, 1.05, 1.08);
      hair.add(hairCrown);
    }

    // Beard / Stubble for Sankar
    if (options.hasBeard) {
      const beardGeo = new THREE.BoxGeometry(0.14, 0.07, 0.06);
      const beardMat = new THREE.MeshStandardMaterial({ color: 0x1a120c, roughness: 0.95 });
      const beard = new THREE.Mesh(beardGeo, beardMat);
      beard.position.set(0, -0.07, 0.085);
      head.add(beard);
    }

    // 4. Arms & Forearms
    const armGeo = new THREE.CylinderGeometry(0.05, 0.045, 0.3, 8);
    const forearmGeo = new THREE.CylinderGeometry(0.045, 0.04, 0.28, 8);
    const handGeo = new THREE.BoxGeometry(0.05, 0.08, 0.03);

    // Left Arm
    const leftArm = new THREE.Group();
    leftArm.position.set(0.24, 0.35, 0);
    const leftUpperArmMesh = new THREE.Mesh(armGeo, shirtMat);
    leftUpperArmMesh.position.y = -0.15;
    leftArm.add(leftUpperArmMesh);

    const leftForearm = new THREE.Group();
    leftForearm.position.y = -0.3;
    leftArm.add(leftForearm);
    const leftForearmMesh = new THREE.Mesh(forearmGeo, skinMat);
    leftForearmMesh.position.y = -0.14;
    const leftHandMesh = new THREE.Mesh(handGeo, skinMat);
    leftHandMesh.position.y = -0.3;
    leftForearm.add(leftForearmMesh, leftHandMesh);

    // Right Arm
    const rightArm = new THREE.Group();
    rightArm.position.set(-0.24, 0.35, 0);
    const rightUpperArmMesh = new THREE.Mesh(armGeo, shirtMat);
    rightUpperArmMesh.position.y = -0.15;
    rightArm.add(rightUpperArmMesh);

    const rightForearm = new THREE.Group();
    rightForearm.position.y = -0.3;
    rightArm.add(rightForearm);
    const rightForearmMesh = new THREE.Mesh(forearmGeo, skinMat);
    rightForearmMesh.position.y = -0.14;
    const rightHandMesh = new THREE.Mesh(handGeo, skinMat);
    rightHandMesh.position.y = -0.3;
    rightForearm.add(rightForearmMesh, rightHandMesh);

    chest.add(leftArm, rightArm);

    // 5. Legs & Calves
    const thighGeo = new THREE.CylinderGeometry(0.075, 0.065, 0.44, 8);
    const calfGeo = new THREE.CylinderGeometry(0.065, 0.055, 0.42, 8);
    const shoeGeo = new THREE.BoxGeometry(0.09, 0.08, 0.2);

    // Left Leg
    const leftLeg = new THREE.Group();
    leftLeg.position.set(0.1, -0.05, 0);
    const leftThighMesh = new THREE.Mesh(thighGeo, pantsMat);
    leftThighMesh.position.y = -0.22;
    leftLeg.add(leftThighMesh);

    const leftCalf = new THREE.Group();
    leftCalf.position.y = -0.44;
    leftLeg.add(leftCalf);
    const leftCalfMesh = new THREE.Mesh(calfGeo, pantsMat);
    leftCalfMesh.position.y = -0.21;
    const leftShoeMesh = new THREE.Mesh(shoeGeo, shoeMat);
    leftShoeMesh.position.set(0, -0.42, 0.04);
    leftCalf.add(leftCalfMesh, leftShoeMesh);

    // Right Leg
    const rightLeg = new THREE.Group();
    rightLeg.position.set(-0.1, -0.05, 0);
    const rightThighMesh = new THREE.Mesh(thighGeo, pantsMat);
    rightThighMesh.position.y = -0.22;
    rightLeg.add(rightThighMesh);

    const rightCalf = new THREE.Group();
    rightCalf.position.y = -0.44;
    rightLeg.add(rightCalf);
    const rightCalfMesh = new THREE.Mesh(calfGeo, pantsMat);
    rightCalfMesh.position.y = -0.21;
    const rightShoeMesh = new THREE.Mesh(shoeGeo, shoeMat);
    rightShoeMesh.position.set(0, -0.42, 0.04);
    rightCalf.add(rightCalfMesh, rightShoeMesh);

    pelvis.add(leftLeg, rightLeg);

    // 6. Unified Animation Controller
    let blinkTimer = Math.random() * 3.0;
    let isBlinking = false;

    const update = (time: number, delta: number, state: CharacterAnimationState) => {
      // Breathing cycle
      const breathe = Math.sin(time * 2.8) * 0.03;
      chest.scale.set(1 + breathe * 0.5, 1 + breathe * 0.3, 1 + breathe);

      // Blinking
      blinkTimer -= delta;
      if (blinkTimer <= 0) {
        isBlinking = true;
        if (blinkTimer < -0.15) {
          isBlinking = false;
          blinkTimer = 2.5 + Math.random() * 3.0;
        }
      }
      const lidAngle = isBlinking ? Math.PI * 0.45 : 0;
      leftEyelid.rotation.x = lidAngle;
      rightEyelid.rotation.x = lidAngle;

      // Talking jaw articulation
      if (state.isTalking) {
        jaw.position.y = -0.055 - Math.abs(Math.sin(time * 12)) * 0.025;
        head.rotation.x = Math.sin(time * 6) * 0.05;
      } else {
        jaw.position.y = -0.055;
      }

      // Head tracking
      if (state.lookTarget) {
        const localLook = state.lookTarget.clone();
        head.lookAt(localLook);
        // Clamp rotation
        head.rotation.x = THREE.MathUtils.clamp(head.rotation.x, -0.3, 0.3);
        head.rotation.y = THREE.MathUtils.clamp(head.rotation.y, -0.6, 0.6);
      }

      // Sitting pose
      if (state.isSitting) {
        pelvis.position.y = 0.55;
        leftLeg.rotation.x = -Math.PI / 2 + 0.1;
        rightLeg.rotation.x = -Math.PI / 2 + 0.1;
        leftCalf.rotation.x = Math.PI / 2 - 0.1;
        rightCalf.rotation.x = Math.PI / 2 - 0.1;
        leftArm.rotation.x = -0.3;
        rightArm.rotation.x = -0.3;
        leftForearm.rotation.x = -0.5;
        rightForearm.rotation.x = -0.5;
        return;
      }

      // Walking pose
      if (state.isWalking) {
        const speed = state.walkSpeed || 5.0;
        const walkCycle = time * speed;
        const swing = Math.sin(walkCycle) * 0.65;

        // Legs
        leftLeg.rotation.x = swing;
        rightLeg.rotation.x = -swing;
        leftCalf.rotation.x = swing > 0 ? swing * 0.8 : 0;
        rightCalf.rotation.x = -swing > 0 ? -swing * 0.8 : 0;

        // Arms counter-swing
        leftArm.rotation.x = -swing * 0.7;
        rightArm.rotation.x = swing * 0.7;
        leftForearm.rotation.x = -0.2 - Math.abs(swing) * 0.3;
        rightForearm.rotation.x = -0.2 - Math.abs(swing) * 0.3;

        // Subtle vertical bounce
        pelvis.position.y = 0.95 + Math.abs(Math.sin(walkCycle * 2)) * 0.04;
        return;
      }

      // Standing / Idling pose with subtle weight shifts
      pelvis.position.y = 0.95 + Math.sin(time * 1.5) * 0.01;
      leftLeg.rotation.x = 0;
      rightLeg.rotation.x = 0;
      leftCalf.rotation.x = 0;
      rightCalf.rotation.x = 0;

      // Gestures
      if (state.gesture === 'CHALLENGE') {
        rightArm.rotation.x = -1.2;
        rightForearm.rotation.x = -0.6;
        leftArm.rotation.x = -0.3;
      } else if (state.gesture === 'HOLD_HEAD') {
        leftArm.rotation.x = -2.1;
        rightArm.rotation.x = -2.1;
        leftForearm.rotation.x = -1.4;
        rightForearm.rotation.x = -1.4;
        head.rotation.x = 0.35;
      } else if (state.gesture === 'SHUSH') {
        rightArm.rotation.x = -1.9;
        rightForearm.rotation.x = -0.8;
      } else if (state.gesture === 'POINT') {
        rightArm.rotation.x = -1.4;
        rightArm.rotation.y = -0.2;
        rightForearm.rotation.x = -0.2;
      } else {
        // Natural resting idle
        leftArm.rotation.x = Math.sin(time * 1.8) * 0.04;
        rightArm.rotation.x = -Math.sin(time * 1.8) * 0.04;
        leftForearm.rotation.x = -0.1;
        rightForearm.rotation.x = -0.1;
      }

      // Emotional head tilts
      if (state.isTerrified) {
        head.rotation.x = -0.2 + Math.sin(time * 14) * 0.03; // subtle shiver
      } else if (state.isCrying) {
        head.rotation.x = 0.4;
        head.rotation.z = Math.sin(time * 3) * 0.05;
      }
    };

    return {
      root,
      head,
      jaw,
      leftEyelid,
      rightEyelid,
      chest,
      leftArm,
      rightArm,
      leftForearm,
      rightForearm,
      leftLeg,
      rightLeg,
      leftCalf,
      rightCalf,
      update,
    };
  }

  // Sankar (Adult)
  public static createSankar(): CinematicCharacterRig {
    return this.buildRig({
      height: 1.8,
      skinMat: CinematicMaterials.skin(0xc88e68),
      hairMat: CinematicMaterials.hairDark(),
      shirtMat: CinematicMaterials.leatherJacket(),
      pantsMat: CinematicMaterials.denimJeans(),
      hasBeard: true,
      hairStyle: 'SHORT',
    });
  }

  // Yamini (Adult)
  public static createYamini(): CinematicCharacterRig {
    return this.buildRig({
      height: 1.65,
      skinMat: CinematicMaterials.skin(0xdfa585),
      hairMat: CinematicMaterials.hairDark(),
      shirtMat: CinematicMaterials.yaminiSweater(),
      pantsMat: CinematicMaterials.denimJeans(),
      hairStyle: 'LONG',
    });
  }

  // Young Sankar
  public static createYoungSankar(): CinematicCharacterRig {
    return this.buildRig({
      height: 1.25,
      skinMat: CinematicMaterials.skin(0xcda07d),
      hairMat: CinematicMaterials.hairDark(),
      shirtMat: CinematicMaterials.sankarChildShirt(),
      pantsMat: CinematicMaterials.wood(),
      hairStyle: 'SHORT',
    });
  }

  // Young Yamini
  public static createYoungYamini(): CinematicCharacterRig {
    return this.buildRig({
      height: 1.05,
      skinMat: CinematicMaterials.skin(0xdca889),
      hairMat: CinematicMaterials.hairDark(),
      shirtMat: CinematicMaterials.yaminiChildDress(),
      pantsMat: CinematicMaterials.yaminiChildDress(),
      hairStyle: 'PONYTAIL',
      isDress: true,
    });
  }

  // Vikram (College friend)
  public static createVikram(): CinematicCharacterRig {
    return this.buildRig({
      height: 1.76,
      skinMat: CinematicMaterials.skinDark(),
      hairMat: CinematicMaterials.hairDark(),
      shirtMat: CinematicMaterials.casualHoodie(),
      pantsMat: CinematicMaterials.denimJeans(),
      hairStyle: 'MESSY',
    });
  }

  // Meera (College friend)
  public static createMeera(): CinematicCharacterRig {
    return this.buildRig({
      height: 1.62,
      skinMat: CinematicMaterials.skin(0xd49b78),
      hairMat: CinematicMaterials.hairBrown(),
      shirtMat: CinematicMaterials.casualGreenJacket(),
      pantsMat: CinematicMaterials.denimJeans(),
      hairStyle: 'LONG',
    });
  }

  // Rahul (College friend)
  public static createRahul(): CinematicCharacterRig {
    return this.buildRig({
      height: 1.78,
      skinMat: CinematicMaterials.skin(0xce9572),
      hairMat: CinematicMaterials.hairDark(),
      shirtMat: CinematicMaterials.casualGreenJacket(),
      pantsMat: CinematicMaterials.denimJeans(),
      hairStyle: 'SHORT',
    });
  }
}
