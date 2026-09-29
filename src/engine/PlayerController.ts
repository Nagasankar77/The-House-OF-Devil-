import * as THREE from 'three';
import { PlayerControls } from '../types';
import { horrorAudio } from '../audio/HorrorAudioManager';

export interface IntroStatus {
  isActive: boolean;
  blackOpacity: number;
  stage: number;
}

export class PlayerController {
  public mesh: THREE.Group; // Legacy mesh container (hidden in FPP)
  public camera: THREE.PerspectiveCamera;
  public position = new THREE.Vector3(0, 0, -5.0); // Spawn 13m outside the main gate (gate at z = -18.0)

  // Full 360-Degree First-Person Perspective:
  // Continuous horizontal rotation (0 to 360+ degrees with no clamping, player can turn completely around)
  // Natural vertical look up/down clamped to human anatomical range (-81.3° to +81.3°)
  public cameraYaw = 0;
  public targetCameraYaw = 0;
  public cameraPitch = -0.02; // Human eye-level neutral angle looking toward gate center
  public targetCameraPitch = -0.02;

  // FPS Camera Hierarchy: Player Yaw Object -> Camera Pitch Object -> PerspectiveCamera
  public yawObject!: THREE.Group;
  public pitchObject!: THREE.Group;

  // Real human eye height: 1.68m - 1.72m
  private eyeHeight = 1.70;

  // Realistic investigative movement
  private moveSpeed = 3.4;
  private runSpeed = 5.4;
  private isMoving = false;
  private wasMoving = false;
  private walkCycle = 0;
  private lastFootstepPhase = 0;
  private idleTimer = 0;

  // Head bobbing, breathing displacement & sudden stop inertia
  private headBobX = 0;
  private headBobY = 0;
  private headBobRoll = 0;
  private stopInertiaDip = 0;

  // Jump scare screen shake displacement & roll
  public scareShakeX = 0;
  public scareShakeY = 0;
  public scareShakeRoll = 0;

  // Viewmodel lag & inertia sway
  private viewmodelSwayX = 0;
  private viewmodelSwayY = 0;
  private targetSwayX = 0;
  private targetSwayY = 0;

  // Gate Inspection & Hand Interaction States
  public isInspecting = false;
  public isReadingNote = false;
  public isStoryModeActive = false;
  public isCameraInputLocked = false;
  public hasHammer = false;
  public interactionGesture: 'NONE' | 'LIGHT_LAMP' | 'PICKUP_KEY' | 'UNLOCK_GATE' | 'PICKUP_HAMMER' | 'HAMMER_SWING' = 'NONE';
  private gestureTimer = 0;
  private gestureDuration = 1.6;

  // 9-Step Cinematic FPP Starting Reveal
  public isIntroActive = false;
  public introTimer = 0;
  public introBlackOpacity = 1.0;
  private introLightningTriggered = false;
  private introThunderTriggered = false;
  private introChainTriggered = false;
  public onIntroLightning?: () => void;
  public onIntroFinished?: () => void;

  // Flashlight state & subtle organic flicker
  public isFlashlightOn = false;
  private baseFlashlightIntensity = 3.6;
  private flickerTimer = 0;
  private nextFlickerTime = 24.0 + Math.random() * 16.0;
  private flickerSequence: { time: number; intensity: number }[] = [];

  // Zero-allocation pre-cached math objects for smooth 60fps render loop
  private tempMoveDir = new THREE.Vector3();
  private tempForward = new THREE.Vector3();
  private tempRight = new THREE.Vector3();
  private tempWorldMove = new THREE.Vector3();
  private tempProposedPos = new THREE.Vector3();
  private tempTestPosX = new THREE.Vector3();
  private tempTestPosZ = new THREE.Vector3();
  private tempSphereX = new THREE.Sphere(new THREE.Vector3(), 0.42);
  private tempSphereZ = new THREE.Sphere(new THREE.Vector3(), 0.42);

  // First-Person Viewmodel (Attached directly to camera)
  public fpViewmodel!: THREE.Group;
  public fpRightArm!: THREE.Group;
  public fpLeftArm!: THREE.Group;
  private fpFlashlightMesh!: THREE.Group;
  private fpHandKeyMesh!: THREE.Group;
  private fpHammerMesh!: THREE.Group;
  private fpHandLighterMesh!: THREE.Group;
  private fpHandFlameMesh!: THREE.Mesh;
  public flashlight!: THREE.SpotLight;
  public flashlightSpill!: THREE.SpotLight;
  public flashlightBounce!: THREE.PointLight;
  public flashlightTarget!: THREE.Object3D;

  // Third-person character body (hidden in FPP to prevent camera clipping)
  private torso!: THREE.Group;

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.position);
    this.mesh.visible = false; // Hide 3rd-person character body in FPP
    scene.add(this.mesh);

    // Standard FPS Camera Architecture:
    // Scene -> Player Yaw Object (Horizontal Yaw only)
    //            └── Camera Pitch Object (Vertical Pitch only)
    //                   └── PerspectiveCamera (Zero roll, centered at head origin)
    this.yawObject = new THREE.Group();
    this.yawObject.name = 'PlayerYawObject';
    this.pitchObject = new THREE.Group();
    this.pitchObject.name = 'CameraPitchObject';

    this.yawObject.add(this.pitchObject);
    this.pitchObject.add(this.camera);
    scene.add(this.yawObject);

    // Camera sits at local origin of pitchObject with zero rotation (roll = 0 strictly)
    this.camera.position.set(0, 0, 0);
    this.camera.rotation.set(0, 0, 0, 'YXZ');

    // Build the First-Person Viewmodel attached to the camera
    this.buildFirstPersonViewmodel();

    // Initial position & orientation at human eye level (13m from gate)
    this.yawObject.position.set(0, this.eyeHeight, -5.0);
    this.yawObject.rotation.set(0, 0, 0, 'YXZ');
    this.pitchObject.rotation.set(-0.02, 0, 0, 'YXZ');
  }

  /**
   * Sets menu mode camera state so menu overview camera can position properly.
   */
  public setMenuMode(isMenu: boolean): void {
    if (isMenu) {
      this.yawObject.position.set(0, 0, 0);
      this.yawObject.rotation.set(0, 0, 0, 'YXZ');
      this.pitchObject.position.set(0, 0, 0);
      this.pitchObject.rotation.set(0, 0, 0, 'YXZ');
    } else {
      this.camera.position.set(0, 0, 0);
      this.camera.rotation.set(0, 0, 0, 'YXZ');
      this.pitchObject.position.set(0, 0, 0);
    }
  }

  /**
   * Constructs realistic First-Person viewmodel hands, sleeves, and flashlight.
   * Attached directly to the camera viewport so lighting and perspective stay accurate.
   */
  private buildFirstPersonViewmodel(): void {
    this.fpViewmodel = new THREE.Group();
    this.camera.add(this.fpViewmodel);

    // Realistic detective trenchcoat dark wool material
    const coatSleeveMat = new THREE.MeshStandardMaterial({
      color: 0x30363d,
      roughness: 0.85,
      metalness: 0.08,
    });

    // Dark investigator leather gloves
    const gloveMat = new THREE.MeshStandardMaterial({
      color: 0x24282c,
      roughness: 0.58,
      metalness: 0.22,
    });

    // Flashlight casing material: worn, knurled black anodized aluminum
    const flashBodyMat = new THREE.MeshStandardMaterial({
      color: 0x22262a,
      roughness: 0.42,
      metalness: 0.88,
    });

    // Flashlight bezel: weathered brass/machined metal rim
    const flashBezelMat = new THREE.MeshStandardMaterial({
      color: 0x4a525a,
      roughness: 0.35,
      metalness: 0.92,
    });

    // Flashlight lens glass
    const lensMat = new THREE.MeshStandardMaterial({
      color: 0x9cb0c5,
      roughness: 0.15,
      metalness: 0.2,
      transparent: true,
      opacity: 0.65,
    });

    // =========================================================================
    // 1. RIGHT ARM & FLASHLIGHT
    // =========================================================================
    this.fpRightArm = new THREE.Group();
    // Default lowered rest position (when flashlight is OFF)
    this.fpRightArm.position.set(0.28, -0.52, -0.38);
    this.fpRightArm.rotation.set(-0.35, 0.05, 0.02);

    // Forearm sleeve (angled from bottom right toward center)
    const rArmGeo = new THREE.CylinderGeometry(0.065, 0.075, 0.46, 10);
    const rForearm = new THREE.Mesh(rArmGeo, coatSleeveMat);
    rForearm.position.set(0, -0.16, 0.12);
    rForearm.rotation.x = 0.55;
    this.fpRightArm.add(rForearm);

    // Coat cuff rim
    const cuffGeo = new THREE.TorusGeometry(0.07, 0.015, 8, 16);
    const rCuff = new THREE.Mesh(cuffGeo, coatSleeveMat);
    rCuff.position.set(0, -0.04, 0.02);
    rCuff.rotation.x = Math.PI / 2 + 0.35;
    this.fpRightArm.add(rCuff);

    // Gloved hand grasping the flashlight cylinder
    const rHandGroup = new THREE.Group();
    rHandGroup.position.set(0, 0.01, -0.05);

    // Palm & wrist
    const palmGeo = new THREE.BoxGeometry(0.075, 0.09, 0.055);
    const rPalm = new THREE.Mesh(palmGeo, gloveMat);
    rHandGroup.add(rPalm);

    // Curled fingers wrapped around the tube
    for (let f = 0; f < 4; f++) {
      const fingerGeo = new THREE.CylinderGeometry(0.014, 0.013, 0.06, 6);
      const finger = new THREE.Mesh(fingerGeo, gloveMat);
      finger.position.set(-0.038, 0.03 - f * 0.022, -0.025);
      finger.rotation.z = Math.PI / 2;
      finger.rotation.x = -0.45;
      rHandGroup.add(finger);
    }

    // Thumb pressing against side
    const thumbGeo = new THREE.CylinderGeometry(0.016, 0.014, 0.05, 6);
    const thumb = new THREE.Mesh(thumbGeo, gloveMat);
    thumb.position.set(0.035, 0.015, -0.015);
    thumb.rotation.z = -0.6;
    thumb.rotation.x = 0.4;
    rHandGroup.add(thumb);

    this.fpRightArm.add(rHandGroup);

    // Detailed vintage flashlight model
    this.fpFlashlightMesh = new THREE.Group();
    this.fpFlashlightMesh.position.set(0, 0.01, -0.06);

    // Main barrel tube
    const tubeGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.24, 12);
    const tube = new THREE.Mesh(tubeGeo, flashBodyMat);
    tube.rotation.x = Math.PI / 2;
    this.fpFlashlightMesh.add(tube);

    // Knurled grip rings
    const ringGeo = new THREE.TorusGeometry(0.033, 0.004, 6, 16);
    for (let r = -2; r <= 2; r++) {
      const ring = new THREE.Mesh(ringGeo, flashBodyMat);
      ring.position.z = r * 0.035;
      this.fpFlashlightMesh.add(ring);
    }

    // Flared head / reflector housing
    const headGeo = new THREE.CylinderGeometry(0.048, 0.034, 0.07, 14);
    const fHead = new THREE.Mesh(headGeo, flashBezelMat);
    fHead.position.z = -0.14;
    fHead.rotation.x = -Math.PI / 2;
    this.fpFlashlightMesh.add(fHead);

    // Beveled front rim
    const rimGeo = new THREE.TorusGeometry(0.046, 0.006, 8, 16);
    const fRim = new THREE.Mesh(rimGeo, flashBezelMat);
    fRim.position.z = -0.175;
    this.fpFlashlightMesh.add(fRim);

    // Recessed front lens
    const lensGeo = new THREE.CircleGeometry(0.042, 16);
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.position.z = -0.172;
    this.fpFlashlightMesh.add(lens);

    // Power switch slide button
    const switchGeo = new THREE.BoxGeometry(0.018, 0.014, 0.04);
    const fSwitch = new THREE.Mesh(switchGeo, flashBezelMat);
    fSwitch.position.set(0, 0.035, -0.02);
    this.fpFlashlightMesh.add(fSwitch);

    this.fpRightArm.add(this.fpFlashlightMesh);

    // =========================================================================
    // INTERACTIVE HAND PROPS: Antique Key & Brass Oil Lighter
    // =========================================================================
    const rustIronMat = new THREE.MeshStandardMaterial({
      color: 0x363028,
      roughness: 0.85,
      metalness: 0.65,
    });
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xbfa15f,
      roughness: 0.45,
      metalness: 0.8,
    });

    // 1. Heavy Victorian Iron Key held between gloved fingers
    this.fpHandKeyMesh = new THREE.Group();
    this.fpHandKeyMesh.position.set(0.015, 0.02, -0.06);
    this.fpHandKeyMesh.rotation.set(-0.2, 0.15, 0.1);
    this.fpHandKeyMesh.visible = false;

    // Key bow (circular grip)
    const keyBowGeo = new THREE.TorusGeometry(0.022, 0.004, 6, 16);
    const keyBow = new THREE.Mesh(keyBowGeo, rustIronMat);
    keyBow.position.z = 0.04;
    this.fpHandKeyMesh.add(keyBow);

    // Key shaft
    const keyShaftGeo = new THREE.CylinderGeometry(0.0045, 0.0045, 0.09, 8);
    const keyShaft = new THREE.Mesh(keyShaftGeo, rustIronMat);
    keyShaft.rotation.x = Math.PI / 2;
    this.fpHandKeyMesh.add(keyShaft);

    // Key bit (teeth)
    const keyBitGeo = new THREE.BoxGeometry(0.016, 0.018, 0.005);
    const keyBit = new THREE.Mesh(keyBitGeo, rustIronMat);
    keyBit.position.set(0.009, 0, -0.035);
    this.fpHandKeyMesh.add(keyBit);

    this.fpRightArm.add(this.fpHandKeyMesh);

    // 1b. Heavy Old Iron Claw Hammer
    this.fpHammerMesh = new THREE.Group();
    this.fpHammerMesh.position.set(0.02, 0.02, -0.06);
    this.fpHammerMesh.rotation.set(-0.25, 0.1, -0.15);
    this.fpHammerMesh.visible = false;

    // Wooden handle (weathered ash wood)
    const hammerHandleMat = new THREE.MeshStandardMaterial({
      color: 0x4a3424,
      roughness: 0.85,
      metalness: 0.08,
    });
    const handleGeo = new THREE.CylinderGeometry(0.016, 0.019, 0.38, 8);
    const hammerHandle = new THREE.Mesh(handleGeo, hammerHandleMat);
    hammerHandle.position.set(0, 0.08, 0);
    this.fpHammerMesh.add(hammerHandle);

    // Grip wrapping
    const gripGeo = new THREE.CylinderGeometry(0.020, 0.020, 0.14, 8);
    const gripMat = new THREE.MeshStandardMaterial({
      color: 0x22201d,
      roughness: 0.95,
      metalness: 0.02,
    });
    const grip = new THREE.Mesh(gripGeo, gripMat);
    grip.position.set(0, -0.03, 0);
    this.fpHammerMesh.add(grip);

    // Heavy forged rusted iron head
    const hammerHeadMat = new THREE.MeshStandardMaterial({
      color: 0x242426,
      roughness: 0.72,
      metalness: 0.78,
    });
    const headBlockGeo = new THREE.BoxGeometry(0.042, 0.046, 0.12);
    const headBlock = new THREE.Mesh(headBlockGeo, hammerHeadMat);
    headBlock.position.set(0, 0.25, 0.01);
    this.fpHammerMesh.add(headBlock);

    // Striking face (front)
    const strikingFaceGeo = new THREE.CylinderGeometry(0.022, 0.020, 0.032, 8);
    strikingFaceGeo.rotateX(Math.PI / 2);
    const strikingFace = new THREE.Mesh(strikingFaceGeo, hammerHeadMat);
    strikingFace.position.set(0, 0.25, 0.075);
    this.fpHammerMesh.add(strikingFace);

    // Curved rear claw
    const clawGeo = new THREE.BoxGeometry(0.032, 0.022, 0.05);
    clawGeo.rotateX(-0.35);
    const claw = new THREE.Mesh(clawGeo, hammerHeadMat);
    claw.position.set(0, 0.245, -0.065);
    this.fpHammerMesh.add(claw);

    this.fpRightArm.add(this.fpHammerMesh);

    // 2. Vintage Trench Lighter with small flicking flame
    this.fpHandLighterMesh = new THREE.Group();
    this.fpHandLighterMesh.position.set(0.015, 0.03, -0.045);
    this.fpHandLighterMesh.visible = false;

    // Lighter body
    const lighterBodyGeo = new THREE.BoxGeometry(0.032, 0.052, 0.018);
    const lighterBody = new THREE.Mesh(lighterBodyGeo, brassMat);
    this.fpHandLighterMesh.add(lighterBody);

    // Chimney / windscreen
    const chimneyGeo = new THREE.CylinderGeometry(0.010, 0.010, 0.016, 8);
    const chimney = new THREE.Mesh(chimneyGeo, brassMat);
    chimney.position.y = 0.032;
    this.fpHandLighterMesh.add(chimney);

    // Flame mesh
    const flameGeo = new THREE.SphereGeometry(0.010, 6, 6);
    flameGeo.scale(0.8, 2.2, 0.8);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffb84d });
    this.fpHandFlameMesh = new THREE.Mesh(flameGeo, flameMat);
    this.fpHandFlameMesh.position.set(0, 0.048, 0);
    this.fpHandLighterMesh.add(this.fpHandFlameMesh);

    // Subtle warm lighter flame light
    const lighterLight = new THREE.PointLight(0xffa834, 1.2, 2.5, 2);
    lighterLight.position.set(0, 0.05, 0);
    this.fpHandLighterMesh.add(lighterLight);

    this.fpRightArm.add(this.fpHandLighterMesh);

    // =========================================================================
    // FLASHLIGHT LIGHT SOURCES (Dual-stage realistic beam + soft spill)
    // =========================================================================
    this.flashlightTarget = new THREE.Object3D();
    this.flashlightTarget.position.set(0, 0, -22);
    this.camera.add(this.flashlightTarget);

    // 1. Primary core beam: warm realistic beam with soft edge falloff
    this.flashlight = new THREE.SpotLight(0xfffaed, 0, 28, Math.PI / 8.5, 0.70, 1.8);
    this.flashlight.position.set(0, 0, -0.18);
    this.flashlight.target = this.flashlightTarget;
    this.flashlight.castShadow = false; // Flashlight uses direct and spill lighting; directional moonlight handles cinematic shadows
    this.fpFlashlightMesh.add(this.flashlight);

    // 2. Wide soft spill: illuminates ground and mist without harsh edges
    this.flashlightSpill = new THREE.SpotLight(0xdce7f4, 0, 16, Math.PI / 5.2, 0.88, 2.0);
    this.flashlightSpill.position.set(0, 0, -0.18);
    this.flashlightSpill.target = this.flashlightTarget;
    this.fpFlashlightMesh.add(this.flashlightSpill);

    // 3. Ambient lens glow: gentle ambient bounce around hand and nearby surfaces
    this.flashlightBounce = new THREE.PointLight(0xffeedd, 0, 2.2, 2.0);
    this.flashlightBounce.position.set(0, 0, -0.10);
    this.fpFlashlightMesh.add(this.flashlightBounce);

    this.fpViewmodel.add(this.fpRightArm);

    // =========================================================================
    // 2. LEFT ARM (Subtle investigator arm on lower-left)
    // =========================================================================
    this.fpLeftArm = new THREE.Group();
    this.fpLeftArm.position.set(-0.28, -0.52, -0.38);
    this.fpLeftArm.rotation.set(-0.35, -0.05, -0.02);

    const lArmGeo = new THREE.CylinderGeometry(0.065, 0.075, 0.44, 10);
    const lForearm = new THREE.Mesh(lArmGeo, coatSleeveMat);
    lForearm.position.set(0, -0.16, 0.12);
    lForearm.rotation.x = 0.55;
    this.fpLeftArm.add(lForearm);

    const lCuff = new THREE.Mesh(cuffGeo, coatSleeveMat);
    lCuff.position.set(0, -0.04, 0.02);
    lCuff.rotation.x = Math.PI / 2 + 0.35;
    this.fpLeftArm.add(lCuff);

    const lHandGroup = new THREE.Group();
    lHandGroup.position.set(0, 0.01, -0.05);

    const lPalm = new THREE.Mesh(palmGeo, gloveMat);
    lHandGroup.add(lPalm);

    // Relaxed, slightly open fingers
    for (let f = 0; f < 4; f++) {
      const fingerGeo = new THREE.CylinderGeometry(0.013, 0.012, 0.065, 6);
      const finger = new THREE.Mesh(fingerGeo, gloveMat);
      finger.position.set(0.035, 0.03 - f * 0.022, -0.02);
      finger.rotation.z = -Math.PI / 2;
      finger.rotation.x = -0.25;
      lHandGroup.add(finger);
    }
    this.fpLeftArm.add(lHandGroup);

    this.fpViewmodel.add(this.fpLeftArm);
  }

  public update(
    delta: number,
    controls: PlayerControls,
    colliders: THREE.Box3[],
    gatePos: THREE.Vector3
  ): { distanceToGate: number; isMoving: boolean } {
    // Update subtle organic flashlight flickering
    this.updateFlashlightFlicker(delta);

    // Calculate distance to the locked gate
    const distToGate = this.position.distanceTo(gatePos);

    // =========================================================================
    // 9-STEP CINEMATIC FPP STARTING REVEAL
    // =========================================================================
    if (this.isIntroActive) {
      this.updateIntroSequence(delta);
      this.updateCamera(delta);
      this.updateViewmodel(delta);
      return {
        distanceToGate: distToGate,
        isMoving: false,
      };
    }

    // When inspecting gate, freeze player movement and animate camera focus
    if (this.isInspecting || this.isStoryModeActive) {
      this.isMoving = false;
      this.updateCamera(delta);
      this.updateViewmodel(delta);
      return {
        distanceToGate: distToGate,
        isMoving: false,
      };
    }

    // =========================================================================
    // FIRST-PERSON PLAYER MOVEMENT (WASD + SHIFT)
    // =========================================================================
    this.tempMoveDir.set(0, 0, 0);

    if (controls.forward) this.tempMoveDir.z -= 1;
    if (controls.backward) this.tempMoveDir.z += 1;
    if (controls.left) this.tempMoveDir.x -= 1;
    if (controls.right) this.tempMoveDir.x += 1;

    this.isMoving = this.tempMoveDir.lengthSq() > 0.01;

    if (this.isMoving) {
      this.tempMoveDir.normalize();

      // Forward direction facing negative Z (toward gate), modulated by cameraYaw
      this.tempForward.set(-Math.sin(this.cameraYaw), 0, -Math.cos(this.cameraYaw)).normalize();
      this.tempRight.set(Math.cos(this.cameraYaw), 0, -Math.sin(this.cameraYaw)).normalize();

      this.tempWorldMove
        .set(0, 0, 0)
        .addScaledVector(this.tempForward, -this.tempMoveDir.z)
        .addScaledVector(this.tempRight, this.tempMoveDir.x)
        .normalize();

      const speed = (controls.run ? this.runSpeed : this.moveSpeed) * delta;
      this.tempProposedPos.copy(this.position).addScaledVector(this.tempWorldMove, speed);

      // Collision Detection: Player sphere vs environment colliders
      const playerRadius = 0.42;
      let canMoveX = true;
      let canMoveZ = true;

      // Test X movement independently
      this.tempTestPosX.set(this.tempProposedPos.x, 1.0, this.position.z);
      this.tempSphereX.center.copy(this.tempTestPosX);
      this.tempSphereX.radius = playerRadius;

      // Test Z movement independently
      this.tempTestPosZ.set(this.position.x, 1.0, this.tempProposedPos.z);
      this.tempSphereZ.center.copy(this.tempTestPosZ);
      this.tempSphereZ.radius = playerRadius;

      for (const box of colliders) {
        if (box.intersectsSphere(this.tempSphereX)) {
          canMoveX = false;
        }
        if (box.intersectsSphere(this.tempSphereZ)) {
          canMoveZ = false;
        }
      }

      if (canMoveX) this.position.x = this.tempProposedPos.x;
      if (canMoveZ) this.position.z = this.tempProposedPos.z;

      // Realistic elevation adjustment: ascending bungalow stairs onto the raised veranda
      // Bungalow entrance stairs: z from -51.5 to -55.5; veranda floor: z <= -55.5 at y = 1.45
      let targetElevation = 0;
      if (this.position.z <= -51.5 && Math.abs(this.position.x) <= 4.2) {
        if (this.position.z <= -55.5) {
          targetElevation = 1.45;
        } else {
          // Smooth climb on the 5 stone stairs
          const stairProgress = (-51.5 - this.position.z) / 4.0;
          targetElevation = stairProgress * 1.45;
        }
      }
      this.position.y = THREE.MathUtils.lerp(this.position.y, targetElevation, Math.min(1, delta * 10.0));

      // Advance walk cycle
      const cycleRate = controls.run ? 14.5 : 9.8;
      this.walkCycle += delta * cycleRate;

      // Natural footstep audio sync
      const phase = Math.sin(this.walkCycle);
      if ((phase > 0.85 && this.lastFootstepPhase <= 0.85) || (phase < -0.85 && this.lastFootstepPhase >= -0.85)) {
        horrorAudio.playFootstep(false, controls.run, 0, this.position);
      }
      this.lastFootstepPhase = phase;
    } else {
      this.idleTimer += delta;
    }

    // Keep hidden character mesh synchronized
    this.mesh.position.copy(this.position);

    // Update FPP Camera & Viewmodel
    this.updateCamera(delta);
    this.updateViewmodel(delta);

    return {
      distanceToGate: distToGate,
      isMoving: this.isMoving,
    };
  }

  /**
   * Triggers a first-person hand interaction gesture.
   */
  public triggerHandGesture(
    gesture: 'LIGHT_LAMP' | 'PICKUP_KEY' | 'UNLOCK_GATE' | 'PICKUP_HAMMER' | 'HAMMER_SWING',
    duration = 1.6
  ): void {
    this.interactionGesture = gesture;
    this.gestureTimer = 0;
    this.gestureDuration = duration;
  }

  /**
   * Sets whether the player is currently examining a note or clue.
   */
  public setReadingNote(reading: boolean): void {
    this.isReadingNote = reading;
  }

  /**
   * Sets whether manual camera rotation is temporarily locked (e.g. during cinematic scare reactions).
   */
  public setCameraInputLocked(locked: boolean): void {
    this.isCameraInputLocked = locked;
  }

  /**
   * Calculates shortest delta yaw and pitch to look directly at a target world coordinate.
   */
  public getLookAnglesTo(targetPos: THREE.Vector3): { yaw: number; pitch: number } {
    // Current camera position in world space
    const eyePos = new THREE.Vector3();
    this.camera.getWorldPosition(eyePos);

    const dir = new THREE.Vector3().subVectors(targetPos, eyePos);
    const horizDist = Math.sqrt(dir.x * dir.x + dir.z * dir.z);

    // Target yaw in radians: in standard three.js coords forward is -Z, right is +X
    // dir.x = -sin(yaw) * horizDist, dir.z = -cos(yaw) * horizDist
    // atan2(-dir.x, -dir.z) yields the exact yaw
    const desiredYaw = Math.atan2(-dir.x, -dir.z);

    // Pitch: upward angle looking up at target
    const desiredPitch = horizDist > 0.001 ? Math.atan2(dir.y, horizDist) : 0;

    // Shortest angular distance from current targetCameraYaw to desiredYaw (prevents spinning 360)
    const currentYaw = this.targetCameraYaw;
    let diffYaw = (desiredYaw - currentYaw) % (Math.PI * 2);
    if (diffYaw > Math.PI) diffYaw -= Math.PI * 2;
    if (diffYaw < -Math.PI) diffYaw += Math.PI * 2;

    const finalTargetYaw = currentYaw + diffYaw;
    const clampedPitch = Math.max(-1.13446, Math.min(1.13446, desiredPitch));

    return {
      yaw: finalTargetYaw,
      pitch: clampedPitch,
    };
  }

  /**
   * Updates First-Person Camera position and rotation using standard FPS architecture:
   * PLAYER / YAW OBJECT (horizontal yaw, full 360°, continuous)
   *   └── CAMERA / PITCH OBJECT (vertical pitch clamped to -65° to +65°)
   *       └── CAMERA (zero roll, centered on player's head)
   */
  private updateCamera(delta: number): void {
    // Responsive, silky smooth dampening to target yaw and pitch
    const smoothFactor = Math.min(1.0, delta * 28.0);
    this.cameraYaw = THREE.MathUtils.lerp(this.cameraYaw, this.targetCameraYaw, smoothFactor);
    this.cameraPitch = THREE.MathUtils.lerp(this.cameraPitch, this.targetCameraPitch, smoothFactor);

    // Natural Head Movement (Walking Bob vs Idle Breathing & Sudden Stop Inertia)
    if (this.isMoving) {
      // Very subtle natural head movement while walking (pure vertical & slight lateral, 0 roll)
      this.headBobY = Math.sin(this.walkCycle * 2) * 0.012; // 1.2cm subtle vertical bob
      this.headBobX = Math.cos(this.walkCycle) * 0.005;     // 0.5cm lateral sway
      this.wasMoving = true;
    } else {
      // Natural camera movement when stopping suddenly
      if (this.wasMoving) {
        this.stopInertiaDip = 0.006; // 6mm downward head inertia dip
        this.wasMoving = false;
      }
      this.stopInertiaDip = THREE.MathUtils.lerp(this.stopInertiaDip, 0, Math.min(1, delta * 6.0));

      // Extremely subtle breathing movement while standing (14 breaths/min, 0.23 Hz)
      this.headBobY = Math.sin(this.idleTimer * 1.35) * 0.0022 - this.stopInertiaDip;
      this.headBobX = 0;
    }

    // 1. Position Yaw Object centered on player's head at eye height (1.70m) + subtle bob + scare shake
    this.yawObject.position.set(
      this.position.x + this.headBobX + this.scareShakeX,
      this.position.y + this.eyeHeight + this.headBobY + this.scareShakeY,
      this.position.z
    );

    // 2. Rotate Yaw Object around Y axis only (zero pitch, zero roll)
    this.yawObject.rotation.set(0, this.cameraYaw, 0, 'YXZ');

    // 3. Rotate Pitch Object around X axis only (zero yaw, zero roll)
    const effectivePitch = this.cameraPitch - this.stopInertiaDip * 0.25;
    this.pitchObject.position.set(0, 0, 0);
    this.pitchObject.rotation.set(effectivePitch, 0, 0, 'YXZ');

    // 4. Camera stays centered at local origin with roll applied from scare shake
    this.camera.position.set(0, 0, 0);
    this.camera.rotation.set(0, 0, this.scareShakeRoll, 'YXZ');
  }

  /**
   * Updates First-Person hands, flashlight positioning, interactive gestures, and breathing.
   */
  private updateViewmodel(delta: number): void {
    if (!this.fpRightArm || !this.fpLeftArm) return;

    // Viewmodel sway recovery (smooth dampening)
    this.viewmodelSwayX = THREE.MathUtils.lerp(this.viewmodelSwayX, this.targetSwayX, Math.min(1, delta * 10.0));
    this.viewmodelSwayY = THREE.MathUtils.lerp(this.viewmodelSwayY, this.targetSwayY, Math.min(1, delta * 10.0));
    this.targetSwayX = THREE.MathUtils.lerp(this.targetSwayX, 0, Math.min(1, delta * 8.0));
    this.targetSwayY = THREE.MathUtils.lerp(this.targetSwayY, 0, Math.min(1, delta * 8.0));

    // Arm movement bob (subtle counter-phase with head bob)
    let armBobX = 0;
    let armBobY = 0;
    let armBreathY = 0;

    if (this.isMoving) {
      armBobY = Math.sin(this.walkCycle * 2) * 0.007;
      armBobX = Math.cos(this.walkCycle) * 0.005;
    } else {
      armBreathY = Math.sin(this.idleTimer * 1.35) * 0.0025;
    }

    // Hand interaction gesture progression
    if (this.interactionGesture !== 'NONE') {
      this.gestureTimer += delta;
      if (this.gestureTimer >= this.gestureDuration) {
        this.interactionGesture = 'NONE';
        this.gestureTimer = 0;
      }
    }

    const gestureProgress = this.interactionGesture !== 'NONE'
      ? Math.min(1, this.gestureTimer / this.gestureDuration)
      : 0;

    // =========================================================================
    // RIGHT ARM: Flashlight / Key / Lighter / Gestures
    // =========================================================================
    let targetRightPosX = 0.25;
    let targetRightPosY = -0.22;
    let targetRightPosZ = -0.42;

    let targetRightRotX = -0.14;
    let targetRightRotY = -0.06;
    let targetRightRotZ = 0.04;

    // Visibility defaults
    let showFlashlight = this.isFlashlightOn;
    let showKey = false;
    let showLighter = false;
    let showHammer = this.hasHammer;

    if (this.interactionGesture === 'LIGHT_LAMP') {
      // Reaches forward with brass lighter toward lamp wick
      showFlashlight = false;
      showKey = false;
      showLighter = true;
      showHammer = false;

      const lift = Math.sin(gestureProgress * Math.PI);
      targetRightPosX = 0.18 - lift * 0.05;
      targetRightPosY = -0.28 + lift * 0.15;
      targetRightPosZ = -0.38 - lift * 0.12;
      targetRightRotX = -0.1 + lift * 0.35;
      targetRightRotY = -0.12;
      targetRightRotZ = 0.15;

      // Flame flicker
      if (this.fpHandFlameMesh) {
        const flicker = 1.0 + Math.sin(this.gestureTimer * 38.0) * 0.15;
        this.fpHandFlameMesh.scale.set(0.8 * flicker, 2.2 * flicker, 0.8 * flicker);
      }
    } else if (this.interactionGesture === 'PICKUP_KEY') {
      // Hand reaches forward into compartment, grasps key, retracts
      showFlashlight = false;
      showLighter = false;
      showHammer = false;
      showKey = gestureProgress > 0.35;

      const reach = Math.sin(gestureProgress * Math.PI);
      targetRightPosX = 0.16;
      targetRightPosY = -0.32 + reach * 0.16;
      targetRightPosZ = -0.36 - reach * 0.14;
      targetRightRotX = -0.05 + reach * 0.25;
      targetRightRotZ = 0.1;
    } else if (this.interactionGesture === 'UNLOCK_GATE') {
      // Key extends to padlock, turns clockwise, hand lowers as chain drops
      showFlashlight = false;
      showLighter = false;
      showHammer = false;
      showKey = gestureProgress < 0.75;

      const reach = Math.sin(Math.min(1, gestureProgress * 1.3) * Math.PI);
      targetRightPosX = 0.14;
      targetRightPosY = -0.25 + reach * 0.14;
      targetRightPosZ = -0.36 - reach * 0.15;
      targetRightRotX = reach * 0.2;
      // Key turn wrist rotation between 0.35 and 0.65 progress
      if (gestureProgress > 0.35 && gestureProgress < 0.65) {
        const turnPhase = (gestureProgress - 0.35) / 0.3;
        targetRightRotZ = Math.sin(turnPhase * Math.PI) * 0.55;
      }
    } else if (this.interactionGesture === 'PICKUP_HAMMER') {
      // Hand sweeps down and lifts heavy iron hammer up into view
      showFlashlight = false;
      showKey = false;
      showLighter = false;
      showHammer = gestureProgress > 0.3;

      const downReach = Math.sin(gestureProgress * Math.PI);
      targetRightPosX = 0.22;
      targetRightPosY = -0.48 + (1 - downReach) * 0.2;
      targetRightPosZ = -0.38 - downReach * 0.12;
      targetRightRotX = -0.45 + downReach * 0.6;
      targetRightRotY = 0.1;
      targetRightRotZ = 0.15;
    } else if (this.interactionGesture === 'HAMMER_SWING') {
      // 2-phase swing: Windup (pull back & raise) -> violent forward strike -> recovery
      showFlashlight = false;
      showKey = false;
      showLighter = false;
      showHammer = true;

      if (gestureProgress < 0.35) {
        // Windup: pull back and up
        const wProgress = gestureProgress / 0.35;
        targetRightPosX = 0.28 + wProgress * 0.08;
        targetRightPosY = -0.15 + wProgress * 0.25;
        targetRightPosZ = -0.32 + wProgress * 0.12;
        targetRightRotX = 0.3 + wProgress * 0.7;
        targetRightRotY = -0.15;
        targetRightRotZ = -0.25 * wProgress;
      } else if (gestureProgress < 0.65) {
        // Violent downward strike
        const sProgress = (gestureProgress - 0.35) / 0.30;
        const strikeCurve = Math.pow(sProgress, 2);
        targetRightPosX = 0.36 - strikeCurve * 0.22;
        targetRightPosY = 0.10 - strikeCurve * 0.40;
        targetRightPosZ = -0.20 - strikeCurve * 0.32;
        targetRightRotX = 1.0 - strikeCurve * 1.5;
        targetRightRotY = -0.15 + strikeCurve * 0.2;
        targetRightRotZ = -0.25 + strikeCurve * 0.45;
      } else {
        // Impact rebound and natural recovery
        const rProgress = (gestureProgress - 0.65) / 0.35;
        targetRightPosX = 0.14 + rProgress * 0.10;
        targetRightPosY = -0.30 + rProgress * 0.08;
        targetRightPosZ = -0.52 + rProgress * 0.10;
        targetRightRotX = -0.5 + rProgress * 0.35;
        targetRightRotY = 0.05 - rProgress * 0.1;
        targetRightRotZ = 0.2 - rProgress * 0.15;
      }
    } else if (this.isReadingNote) {
      // Both hands raised gently in lower screen corners holding the old parchment
      showFlashlight = false;
      showKey = false;
      showLighter = false;
      showHammer = false;

      targetRightPosX = 0.30;
      targetRightPosY = -0.30;
      targetRightPosZ = -0.38;
      targetRightRotX = 0.12;
      targetRightRotY = -0.15;
      targetRightRotZ = 0.05;
    } else if (this.hasHammer) {
      // Resting position holding the heavy iron hammer ready
      targetRightPosX = 0.24;
      targetRightPosY = -0.26;
      targetRightPosZ = -0.42;

      targetRightRotX = -0.15;
      targetRightRotY = -0.08;
      targetRightRotZ = 0.06;
    } else if (!this.isFlashlightOn) {
      // Flashlight OFF: Hand naturally resting at lower-right periphery in coat pocket area
      targetRightPosX = 0.28;
      targetRightPosY = -0.50;
      targetRightPosZ = -0.38;

      targetRightRotX = -0.35;
      targetRightRotY = 0.05;
      targetRightRotZ = 0.02;
    }

    if (this.fpFlashlightMesh) this.fpFlashlightMesh.visible = showFlashlight;
    if (this.fpHandKeyMesh) this.fpHandKeyMesh.visible = showKey;
    if (this.fpHandLighterMesh) this.fpHandLighterMesh.visible = showLighter;
    if (this.fpHammerMesh) this.fpHammerMesh.visible = showHammer;

    this.fpRightArm.position.x = THREE.MathUtils.lerp(
      this.fpRightArm.position.x,
      targetRightPosX + this.viewmodelSwayX + armBobX,
      Math.min(1, delta * 8.5)
    );
    this.fpRightArm.position.y = THREE.MathUtils.lerp(
      this.fpRightArm.position.y,
      targetRightPosY + this.viewmodelSwayY + armBobY + armBreathY,
      Math.min(1, delta * 8.5)
    );
    this.fpRightArm.position.z = THREE.MathUtils.lerp(
      this.fpRightArm.position.z,
      targetRightPosZ,
      Math.min(1, delta * 8.5)
    );

    this.fpRightArm.rotation.x = THREE.MathUtils.lerp(this.fpRightArm.rotation.x, targetRightRotX, Math.min(1, delta * 8.5));
    this.fpRightArm.rotation.y = THREE.MathUtils.lerp(this.fpRightArm.rotation.y, targetRightRotY, Math.min(1, delta * 8.5));
    this.fpRightArm.rotation.z = THREE.MathUtils.lerp(this.fpRightArm.rotation.z, targetRightRotZ, Math.min(1, delta * 8.5));

    // =========================================================================
    // LEFT ARM: Cautious Support / Holding Note Corner
    // =========================================================================
    let targetLeftPosX = -0.28;
    let targetLeftPosY = -0.52;
    let targetLeftPosZ = -0.38;

    let targetLeftRotX = -0.35;
    let targetLeftRotY = -0.05;
    let targetLeftRotZ = -0.02;

    if (this.isReadingNote) {
      targetLeftPosX = -0.30;
      targetLeftPosY = -0.30;
      targetLeftPosZ = -0.38;
      targetLeftRotX = 0.12;
      targetLeftRotY = 0.15;
      targetLeftRotZ = -0.05;
    }

    this.fpLeftArm.position.x = THREE.MathUtils.lerp(
      this.fpLeftArm.position.x,
      targetLeftPosX + this.viewmodelSwayX * 0.7 - armBobX,
      Math.min(1, delta * 7.5)
    );
    this.fpLeftArm.position.y = THREE.MathUtils.lerp(
      this.fpLeftArm.position.y,
      targetLeftPosY + this.viewmodelSwayY * 0.7 + armBobY + armBreathY,
      Math.min(1, delta * 7.5)
    );
    this.fpLeftArm.position.z = THREE.MathUtils.lerp(
      this.fpLeftArm.position.z,
      targetLeftPosZ,
      Math.min(1, delta * 7.5)
    );

    this.fpLeftArm.rotation.x = THREE.MathUtils.lerp(this.fpLeftArm.rotation.x, targetLeftRotX, Math.min(1, delta * 7.5));
    this.fpLeftArm.rotation.y = THREE.MathUtils.lerp(this.fpLeftArm.rotation.y, targetLeftRotY, Math.min(1, delta * 7.5));
    this.fpLeftArm.rotation.z = THREE.MathUtils.lerp(this.fpLeftArm.rotation.z, targetLeftRotZ, Math.min(1, delta * 7.5));
  }

  /**
   * Mouse and Touch look using standard FPS Camera Architecture:
   * - Horizontal mouse movement: Modifies PLAYER YAW only (full 360° continuous rotation, no clamping).
   * - Vertical mouse movement: Modifies CAMERA PITCH only (clamped to approx -65° to +65°).
   * - Zero camera roll (roll = 0 strictly at all times).
   * - No orbit, no spherical rotation.
   */
  public onMouseMove(deltaX: number, deltaY: number, sensitivity: number = 0.0022): void {
    if (this.isIntroActive || this.isCameraInputLocked) return;

    // Prevent sudden huge jumps when entering pointer lock or re-focusing
    const maxDelta = 80;
    const clampedDeltaX = Math.max(-maxDelta, Math.min(maxDelta, deltaX));
    const clampedDeltaY = Math.max(-maxDelta, Math.min(maxDelta, deltaY));

    // Horizontal look: unrestricted 360-degree rotation (FRONT -> RIGHT -> BACK -> LEFT -> FRONT)
    this.targetCameraYaw -= clampedDeltaX * sensitivity;

    // Vertical look: clamped strictly to -65° to +65° (-1.13446 rad to +1.13446 rad)
    // Upward mouse look tilts camera up (max +65°); downward mouse look tilts camera down (min -65°)
    this.targetCameraPitch -= clampedDeltaY * sensitivity;
    const maxPitch = 65.0 * (Math.PI / 180); // ~1.13446 radians (65 degrees)
    this.targetCameraPitch = Math.max(-maxPitch, Math.min(maxPitch, this.targetCameraPitch));

    // Viewmodel inertial sway
    this.targetSwayX -= clampedDeltaX * 0.00025;
    this.targetSwayY -= clampedDeltaY * 0.00025;
    this.targetSwayX = Math.max(-0.025, Math.min(0.025, this.targetSwayX));
    this.targetSwayY = Math.max(-0.018, Math.min(0.018, this.targetSwayY));
  }

  /**
   * Starts the 9-Step Cinematic FPP Starting Reveal
   */
  public startIntro(): void {
    this.isIntroActive = true;
    this.introTimer = 0;
    this.introBlackOpacity = 1.0;
    this.introLightningTriggered = false;
    this.introThunderTriggered = false;
    this.introChainTriggered = false;

    this.position.set(0, 0, -5.0); // Spawn 13m in front of the gate facing negative Z
    this.targetCameraYaw = 0;
    this.targetCameraPitch = -0.02;
    this.cameraYaw = 0;
    this.cameraPitch = -0.02;

    this.yawObject.position.set(0, this.eyeHeight, -5.0);
    this.yawObject.rotation.set(0, 0, 0, 'YXZ');
    this.pitchObject.position.set(0, 0, 0);
    this.pitchObject.rotation.set(-0.02, 0, 0, 'YXZ');
    this.camera.position.set(0, 0, 0);
    this.camera.rotation.set(0, 0, 0, 'YXZ');
  }

  /**
   * Executes the exact user-specified 9-step cinematic reveal:
   * 1. Black screen.
   * 2. Very faint wind.
   * 3. Fade into the player's first-person view.
   * 4. Player sees the huge haunted gate.
   * 5. Lightning briefly reveals the bungalow behind it.
   * 6. Thunder arrives slightly later.
   * 7. Silence.
   * 8. A faint metallic chain sound comes from the gate.
   * 9. Player gets full control.
   */
  private updateIntroSequence(delta: number): void {
    this.introTimer += delta;

    // Step 1: Black screen (0.0s - 1.2s)
    if (this.introTimer < 1.2) {
      this.introBlackOpacity = 1.0;
      // Step 2: Faint wind in background
      return;
    }

    // Step 3 & 4: Fade into player's first-person view, revealing the huge haunted gate (1.2s - 2.6s)
    if (this.introTimer >= 1.2 && this.introTimer < 2.6) {
      const progress = (this.introTimer - 1.2) / 1.4;
      this.introBlackOpacity = Math.max(0, 1.0 - progress);
    } else {
      this.introBlackOpacity = 0.0;
    }

    // Step 5: Lightning briefly reveals the bungalow behind the gate (t = 2.8s)
    if (this.introTimer >= 2.8 && !this.introLightningTriggered) {
      this.introLightningTriggered = true;
      if (this.onIntroLightning) {
        this.onIntroLightning();
      }
    }

    // Step 6: Thunder arrives slightly later (t = 3.9s, ~1.1s propagation delay)
    if (this.introTimer >= 3.9 && !this.introThunderTriggered) {
      this.introThunderTriggered = true;
      horrorAudio.playCinematicThunder(0, true);
    }

    // Step 7: Tense silence (4.8s - 5.6s)

    // Step 8: Faint metallic chain sound from the gate (t = 5.7s)
    if (this.introTimer >= 5.7 && !this.introChainTriggered) {
      this.introChainTriggered = true;
      horrorAudio.playMetallicChainClink(0.5);
    }

    // Step 9: Player gets full control (t = 6.6s)
    if (this.introTimer >= 6.6) {
      this.isIntroActive = false;
      this.introBlackOpacity = 0;
      if (this.onIntroFinished) {
        this.onIntroFinished();
      }
    }
  }

  public setFlashlight(enabled: boolean): void {
    this.isFlashlightOn = enabled;
    if (this.flashlight) {
      this.flashlight.intensity = enabled ? this.baseFlashlightIntensity : 0;
    }
    if (this.flashlightSpill) {
      this.flashlightSpill.intensity = enabled ? 1.2 : 0;
    }
    if (this.flashlightBounce) {
      this.flashlightBounce.intensity = enabled ? 0.25 : 0;
    }
  }

  public setInspecting(inspecting: boolean): void {
    this.isInspecting = inspecting;
  }

  private updateFlashlightFlicker(delta: number): void {
    if (!this.isFlashlightOn || !this.flashlight) return;

    this.flickerTimer += delta;

    // Process active micro-flicker sequence
    if (this.flickerSequence.length > 0) {
      const step = this.flickerSequence[0];
      step.time -= delta;
      const ratio = step.intensity / this.baseFlashlightIntensity;
      this.flashlight.intensity = step.intensity;
      if (this.flashlightSpill) this.flashlightSpill.intensity = 1.2 * ratio;
      if (this.flashlightBounce) this.flashlightBounce.intensity = 0.25 * ratio;

      if (step.time <= 0) {
        this.flickerSequence.shift();
        if (this.flickerSequence.length === 0) {
          this.flashlight.intensity = this.baseFlashlightIntensity;
          if (this.flashlightSpill) this.flashlightSpill.intensity = 1.2;
          if (this.flashlightBounce) this.flashlightBounce.intensity = 0.25;
        }
      }
      return;
    }

    // Trigger occasional subtle flicker (every 24-42s)
    if (this.flickerTimer > this.nextFlickerTime) {
      this.flickerTimer = 0;
      this.nextFlickerTime = 24.0 + Math.random() * 18.0;
      this.flickerSequence = [
        { time: 0.05, intensity: 1.0 },
        { time: 0.04, intensity: 3.6 },
        { time: 0.06, intensity: 0.3 },
        { time: 0.04, intensity: 3.2 },
        { time: 0.03, intensity: 1.4 },
        { time: 0.04, intensity: 3.6 },
      ];
    }
  }

  public triggerFlashlightGlitch(): void {
    if (!this.isFlashlightOn) return;
    this.flickerSequence = [
      { time: 0.08, intensity: 0.4 },
      { time: 0.04, intensity: 2.8 },
      { time: 0.12, intensity: 0.1 },
      { time: 0.05, intensity: 3.6 },
    ];
  }

  public resetPosition(): void {
    this.isInspecting = false;
    this.position.set(0, 0, -5.0);
    this.cameraYaw = 0;
    this.targetCameraYaw = 0;
    this.cameraPitch = -0.02;
    this.targetCameraPitch = -0.02;
    this.yawObject.position.set(0, this.eyeHeight, -5.0);
    this.yawObject.rotation.set(0, 0, 0, 'YXZ');
    this.pitchObject.position.set(0, 0, 0);
    this.pitchObject.rotation.set(-0.02, 0, 0, 'YXZ');
    this.camera.position.set(0, 0, 0);
    this.camera.rotation.set(0, 0, 0, 'YXZ');
    this.mesh.position.copy(this.position);
    this.startIntro();
  }
}
