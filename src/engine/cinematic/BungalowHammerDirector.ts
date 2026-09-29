import * as THREE from 'three';
import { HorrorEnvironment } from '../Environment';
import { PlayerController } from '../PlayerController';
import { horrorAudio } from '../../audio/HorrorAudioManager';
import { GhostEntityFactory, DistortedGhostRig } from '../../components/cinematic/GhostEntity';

/**
 * BungalowHammerDirector
 *
 * Orchestrates the interactive 3-hit hammer horror sequence at the haunted bungalow entrance:
 *
 * Sequence steps:
 * 1. INSPECT DOOR:
 *    - Reveals door is barricaded/locked.
 *    - Updates objective to find a heavy tool.
 *
 * 2. HAMMER PICKUP:
 *    - Player picks up heavy iron claw hammer from crate on veranda.
 *    - First-person viewmodel equips hammer in right hand.
 *    - Door interaction changes to "[E] BREAK DOOR".
 *
 * 3. HIT #1 (SIDE SCARE - LEFT):
 *    - Player strikes door with heavy swing. Wood splinter burst + deep heavy impact sound.
 *    - Door takes visual damage.
 *    - Player controller camera is NOT forcefully turned!
 *    - Ghost appears on LEFT (side angle, ~4-5m away on the veranda between colonial pillars).
 *    - Pale, elongated figure visible for 1.0 - 1.4 seconds.
 *    - Low unsettling violin scrape / sting + soft distant female breath.
 *    - Dissolves into mist.
 *
 * 4. HIT #2 (SIDE SCARE - RIGHT):
 *    - Player strikes door a second time. Louder crack, splintering wood chunks.
 *    - Player camera is NOT forcefully turned!
 *    - Ghost appears on RIGHT (side angle, closer, ~3.5m away near the right veranda balustrade).
 *    - Visible for 0.8 - 1.2 seconds.
 *    - Stretched jaw, gaunt sunken hollow eyes staring in profile.
 *    - Louder metallic horror scrape + spatialized whisper: "Don't...".
 *    - Dissolves cleanly into thin air.
 *
 * 5. HIT #3 (FINAL JUMP SCARE + DOOR BREACH):
 *    - Third strike violently smashes the locking bar / latch.
 *    - IMMEDIATE sudden horror sting & massive impact!
 *    - Controlled horror camera jolt / micro-zoom (NO spinning, zero disorientation).
 *    - Ghost appears DIRECTLY in front of player's face (extreme close-up ~0.85m).
 *    - Deep sunken eye sockets, stretched gaunt face, fluttering tatters.
 *    - Lasts 0.65 seconds, accompanied by clean high-impact horror audio (no speaker clipping).
 *    - Ghost vanishes instantly into fog.
 *    - Bungalow double doors slowly creak wide open into pitch-black interior.
 *    - Door collider removed; player can now cross the threshold into the haunted house.
 */

export type HammerEventPhase =
  | 'IDLE'
  | 'HIT1_REACTION'
  | 'HIT2_REACTION'
  | 'HIT3_JUMPSCARE'
  | 'DOOR_OPENING'
  | 'SEQUENCE_COMPLETED';

export class BungalowHammerDirector {
  private scene: THREE.Scene;
  private environment: HorrorEnvironment;
  private player: PlayerController;

  public phase: HammerEventPhase = 'IDLE';
  private timer = 0;
  private activeGhostRig: DistortedGhostRig | null = null;
  private ghostSpotlight: THREE.SpotLight | null = null;

  // Cinematic Camera Steering State
  private cameraStartYaw = 0;
  private cameraStartYawTarget = 0;
  private cameraStartPitch = 0;
  private cameraStartPitchTarget = 0;
  private cameraGoalYaw = 0;
  private cameraGoalPitch = 0;
  private cameraRotateDuration = 0.65;
  private isCameraTurning = false;

  // Callbacks
  public onPhaseChange?: (phase: HammerEventPhase) => void;
  public onHitCompleted?: (hitNumber: number) => void;
  public onSequenceCompleted?: () => void;

  constructor(scene: THREE.Scene, environment: HorrorEnvironment, player: PlayerController) {
    this.scene = scene;
    this.environment = environment;
    this.player = player;
  }

  /**
   * Triggers the horror event for Hit 1 (Ghost on LEFT)
   * Automatically and smoothly rotates player's FPP camera to center the ghost on the LEFT.
   */
  public triggerHit1(): void {
    this.phase = 'HIT1_REACTION';
    this.timer = 0;
    this.onPhaseChange?.(this.phase);

    // 1. Audio: Heavy wood strike + wood splinters + low eerie side sting
    horrorAudio.playHammerHit1();

    // 2. Visual door damage on 3D mesh
    this.environment.damageBungalowDoor(1);

    // 3. Spawn Ghost on LEFT side angle
    // Veranda door is at (0, 1.45, -58.95). Player stands around (0, 1.45, -57.4).
    // Left side pillar / veranda corner: x: -3.8, y: 1.45, z: -57.8
    const ghostPos = new THREE.Vector3(-3.8, 1.45, -57.8);
    const lookTarget = new THREE.Vector3(this.player.position.x, 1.45, this.player.position.z);
    this.spawnGhostAt(ghostPos, lookTarget, 0.75);

    // 4. Subtle side rim light highlighting the figure without blowing out exposure
    this.setupGhostLighting(new THREE.Vector3(-4.5, 3.2, -56.5), new THREE.Vector3(-3.8, 2.2, -57.8), 0x7a92a6, 2.2);

    // 5. Automatic Cinematic Camera Steer toward Ghost Head/Torso on LEFT
    // Focus target at human head height (~1.65m above veranda floor)
    const ghostHeadFocus = new THREE.Vector3(ghostPos.x, ghostPos.y + 1.65, ghostPos.z);
    this.startCameraLookAt(ghostHeadFocus, 0.65);
  }

  /**
   * Triggers the horror event for Hit 2 (Ghost on RIGHT)
   * Automatically and smoothly rotates player's FPP camera to center the ghost on the RIGHT.
   */
  public triggerHit2(): void {
    this.phase = 'HIT2_REACTION';
    this.timer = 0;
    this.onPhaseChange?.(this.phase);

    // 1. Audio: Harder strike + deeper wood stress + louder eerie metallic scrape
    horrorAudio.playHammerHit2();

    // 2. Visual door damage on 3D mesh
    this.environment.damageBungalowDoor(2);

    // 3. Spawn Ghost on RIGHT side angle, closer (~3.2m away)
    // Right side veranda position: x: 3.2, y: 1.45, z: -57.5
    const ghostPos = new THREE.Vector3(3.2, 1.45, -57.5);
    const lookTarget = new THREE.Vector3(this.player.position.x, 1.45, this.player.position.z);
    this.spawnGhostAt(ghostPos, lookTarget, 0.85);

    // 4. Ghost rim light
    this.setupGhostLighting(new THREE.Vector3(4.2, 3.2, -56.2), new THREE.Vector3(3.2, 2.2, -57.5), 0x6e889c, 2.6);

    // 5. Automatic Cinematic Camera Steer toward Ghost Head/Torso on RIGHT
    const ghostHeadFocus = new THREE.Vector3(ghostPos.x, ghostPos.y + 1.65, ghostPos.z);
    this.startCameraLookAt(ghostHeadFocus, 0.65);
  }

  /**
   * Triggers the final horror event for Hit 3 (Face-to-Face extreme close-up jump scare)
   * Fast, direct controlled camera aim squarely at the ghost's face.
   */
  public triggerHit3(): void {
    this.phase = 'HIT3_JUMPSCARE';
    this.timer = 0;
    this.onPhaseChange?.(this.phase);

    // 1. Audio: Massive breaking wood & iron impact + terrifying sharp close scare sting
    horrorAudio.playHammerHit3();
    horrorAudio.playHit3FinalJumpscare();

    // 2. Visual door damage (full break)
    this.environment.damageBungalowDoor(3);

    // 3. Spawn Ghost directly in front of the player's face (extreme close-up ~0.88m)
    const camPos = this.player.camera.position.clone();
    const forward = new THREE.Vector3();
    this.player.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const scarePos = camPos.clone().addScaledVector(forward, 0.88);
    // Align ghost eyes with player camera height
    scarePos.y = this.player.position.y;

    this.spawnGhostAt(scarePos, camPos, 0.98);

    // Adjust ghost head / jaw for terrifying close-up
    if (this.activeGhostRig) {
      this.activeGhostRig.head.position.y = 1.62; // Eye level
      this.activeGhostRig.jaw.rotation.x = 0.52; // Wide stretched hollow mouth
    }

    // High contrast cold illumination on ghost's pale face
    this.setupGhostLighting(
      camPos.clone().add(new THREE.Vector3(0, 0.6, 0)),
      scarePos.clone().add(new THREE.Vector3(0, 1.6, 0)),
      0xc5dbe8,
      4.5
    );

    // Sudden cold atmospheric shift
    this.environment.setHorrorAtmosphere(true, 1.45, 0.65);

    // 4. Automatic Fast & Controlled Camera Aim directly at Ghost Face (Duration: 0.32s)
    // Extract actual world position of ghost head for 100% precision
    const ghostFaceTarget = new THREE.Vector3();
    if (this.activeGhostRig) {
      this.activeGhostRig.head.getWorldPosition(ghostFaceTarget);
    } else {
      ghostFaceTarget.set(scarePos.x, this.player.position.y + 1.70, scarePos.z);
    }
    this.startCameraLookAt(ghostFaceTarget, 0.32);
  }

  /**
   * Initializes smooth cinematic camera steer toward a world coordinate target
   */
  private startCameraLookAt(targetWorldPos: THREE.Vector3, duration: number): void {
    // Temporarily lock manual mouse/touch input so user doesn't fight the cinematic direction
    this.player.setCameraInputLocked(true);
    this.isCameraTurning = true;
    this.cameraRotateDuration = Math.max(0.1, duration);

    // Store starting actual and target angles
    this.cameraStartPitch = this.player.cameraPitch;
    this.cameraStartPitchTarget = this.player.targetCameraPitch;
    this.cameraStartYaw = this.player.cameraYaw;
    this.cameraStartYawTarget = this.player.targetCameraYaw;

    // Calculate exact shortest angle deltas toward the ghost
    const { yaw: goalYaw, pitch: goalPitch } = this.player.getLookAnglesTo(targetWorldPos);
    this.cameraGoalYaw = goalYaw;
    this.cameraGoalPitch = goalPitch;
  }

  /**
   * Updates active scare animations and timings each frame
   */
  public update(delta: number): void {
    if (this.phase === 'IDLE' || this.phase === 'SEQUENCE_COMPLETED') return;

    this.timer += delta;

    // Animate active ghost rig if present
    if (this.activeGhostRig) {
      const twitchIntensity = this.phase === 'HIT3_JUMPSCARE' ? 1.0 : 0.35;
      this.activeGhostRig.updateAnimation(this.timer, twitchIntensity);
    }

    // =========================================================================
    // SMOOTH CINEMATIC CAMERA STEERING
    // =========================================================================
    if (this.isCameraTurning) {
      const turnProgress = Math.min(1.0, this.timer / this.cameraRotateDuration);

      // Smooth cinematic S-curve (cubic hermite smoothstep)
      const ease = turnProgress * turnProgress * (3 - 2 * turnProgress);

      const currentTargetYaw = THREE.MathUtils.lerp(this.cameraStartYawTarget, this.cameraGoalYaw, ease);
      const currentTargetPitch = THREE.MathUtils.lerp(this.cameraStartPitchTarget, this.cameraGoalPitch, ease);

      this.player.targetCameraYaw = currentTargetYaw;
      this.player.targetCameraPitch = currentTargetPitch;
      this.player.cameraYaw = THREE.MathUtils.lerp(this.cameraStartYaw, this.cameraGoalYaw, ease);
      this.player.cameraPitch = THREE.MathUtils.lerp(this.cameraStartPitch, this.cameraGoalPitch, ease);

      if (turnProgress >= 1.0) {
        this.isCameraTurning = false;
        // Keep target camera yaw aligned with current look angle
        this.player.targetCameraYaw = this.cameraGoalYaw;
        this.player.targetCameraPitch = this.cameraGoalPitch;
      }
    }

    // =========================================================================
    // HIT 1 HANDLING (Total Duration: 1.7s: 0.65s turn -> 1.0s hold view & fade -> restored)
    // =========================================================================
    if (this.phase === 'HIT1_REACTION') {
      // Hold view and fade ghost out into mist between 1.1s and 1.65s
      if (this.timer > 1.1 && this.activeGhostRig) {
        const fadeProgress = (this.timer - 1.1) / 0.55;
        this.activeGhostRig.setDissolveOpacity(Math.max(0, 1 - fadeProgress));
      }

      if (this.timer >= 1.65) {
        this.cleanupGhost();
        // Restore player mouse/touch camera control immediately
        this.player.setCameraInputLocked(false);
        this.phase = 'IDLE';
        this.onHitCompleted?.(1);
      }
    }

    // =========================================================================
    // HIT 2 HANDLING (Total Duration: 1.7s: 0.65s turn -> 1.0s hold view & fade -> restored)
    // =========================================================================
    else if (this.phase === 'HIT2_REACTION') {
      // Hold view and fade ghost out into mist between 1.05s and 1.65s
      if (this.timer > 1.05 && this.activeGhostRig) {
        const fadeProgress = (this.timer - 1.05) / 0.55;
        this.activeGhostRig.setDissolveOpacity(Math.max(0, 1 - fadeProgress));
      }

      if (this.timer >= 1.65) {
        this.cleanupGhost();
        // Restore player mouse/touch camera control immediately
        this.player.setCameraInputLocked(false);
        this.phase = 'IDLE';
        this.onHitCompleted?.(2);
      }
    }

    // =========================================================================
    // HIT 3 JUMP SCARE HANDLING (Duration: 0.85s face close-up, then door opens)
    // =========================================================================
    else if (this.phase === 'HIT3_JUMPSCARE') {
      // Controlled horror camera jolt & screen micro-shake
      const scareProgress = this.timer / 0.85;
      const shakeDecay = Math.max(0, 1 - scareProgress);
      this.player.scareShakeX = (Math.random() - 0.5) * 0.08 * shakeDecay;
      this.player.scareShakeY = (Math.random() - 0.5) * 0.06 * shakeDecay;
      this.player.scareShakeRoll = (Math.random() - 0.5) * 0.035 * shakeDecay;

      if (this.timer >= 0.85) {
        // Ghost vanishes instantly
        this.cleanupGhost();
        this.player.scareShakeX = 0;
        this.player.scareShakeY = 0;
        this.player.scareShakeRoll = 0;

        // Restore normal player FPP camera immediately
        this.player.setCameraInputLocked(false);

        // Transition to Bungalow Door Opening
        this.phase = 'DOOR_OPENING';
        this.timer = 0;
        this.onPhaseChange?.(this.phase);

        // Play deep echoing door creak
        horrorAudio.playBungalowDoorOpen();

        // Restore atmosphere
        this.environment.setHorrorAtmosphere(false, 1.0, 0.0);
      }
    }

    // BUNGALOW DOOR OPENING (Duration: 2.8s smooth heavy door swing)
    else if (this.phase === 'DOOR_OPENING') {
      const openDuration = 2.8;
      const p = Math.min(1, this.timer / openDuration);
      // Smooth cubic ease out
      const ease = 1 - Math.pow(1 - p, 3);
      this.environment.setBungalowDoorOpenProgress(ease);

      if (this.timer >= openDuration) {
        this.phase = 'SEQUENCE_COMPLETED';
        this.onPhaseChange?.(this.phase);
        this.onHitCompleted?.(3);
        this.onSequenceCompleted?.();
      }
    }
  }

  /**
   * Spawns the Distorted Ghost entity at a specific world coordinate facing a target position
   */
  private spawnGhostAt(pos: THREE.Vector3, lookAtTarget: THREE.Vector3, opacity = 1.0): void {
    this.cleanupGhost();

    this.activeGhostRig = GhostEntityFactory.createGhost();
    this.activeGhostRig.root.position.copy(pos);

    // Look horizontally toward the target
    const target = lookAtTarget.clone();
    target.y = pos.y;
    this.activeGhostRig.root.lookAt(target);

    this.activeGhostRig.setDissolveOpacity(opacity);
    this.scene.add(this.activeGhostRig.root);
  }

  /**
   * Configures a focused spotlight illuminating the ghost
   */
  private setupGhostLighting(lightPos: THREE.Vector3, targetPos: THREE.Vector3, color = 0x768dae, intensity = 2.0): void {
    if (this.ghostSpotlight) {
      this.scene.remove(this.ghostSpotlight);
      this.ghostSpotlight.dispose();
      this.ghostSpotlight = null;
    }

    this.ghostSpotlight = new THREE.SpotLight(color, intensity, 12, Math.PI / 4, 0.65, 1.8);
    this.ghostSpotlight.position.copy(lightPos);
    this.ghostSpotlight.target.position.copy(targetPos);
    this.scene.add(this.ghostSpotlight);
    this.scene.add(this.ghostSpotlight.target);
  }

  /**
   * Disposes of the active ghost mesh and lighting
   */
  public cleanupGhost(): void {
    if (this.activeGhostRig) {
      this.scene.remove(this.activeGhostRig.root);
      this.activeGhostRig.dispose();
      this.activeGhostRig = null;
    }

    if (this.ghostSpotlight) {
      this.scene.remove(this.ghostSpotlight.target);
      this.scene.remove(this.ghostSpotlight);
      this.ghostSpotlight.dispose();
      this.ghostSpotlight = null;
    }
  }
}
