import * as THREE from 'three';
import { HorrorEnvironment } from '../Environment';
import { PlayerController } from '../PlayerController';
import { horrorAudio } from '../../audio/HorrorAudioManager';
import { GhostEntityFactory, DistortedGhostRig } from '../../components/cinematic/GhostEntity';

/**
 * Stages and executes the post-cinematic psychological horror scare sequence:
 *
 * Sequence requirements:
 * 1. STORY MODE ENDS:
 *    - Return to exact gameplay position.
 *    - Player is Sankar.
 *    - Objective "FIND YAMINI" is updated.
 *
 * 2. SILENCE (0.0s - 2.0s):
 *    - Music silenced.
 *    - Environmental sounds reduced to near silence.
 *    - Footsteps suppressed.
 *    - UI suppressed.
 *    - Something is horribly wrong.
 *
 * 3. ENVIRONMENT CHANGE (2.0s - 4.5s):
 *    - Fog becomes denser.
 *    - Wind stops completely dead.
 *    - Nearby trees stop moving.
 *    - Lighting shifts colder.
 *    - Screen is NOT blacked out (environment remains clearly visible).
 *
 * 4. THE GHOST APPEARS (4.5s - 7.5s):
 *    - 15–20m away emerging partially shrouded in fog directly in front of the player.
 *    - Tall, pale, slightly distorted human-like figure with long thin arms reaching past knees.
 *    - Stands completely still for ~1.5s, then twitches slightly.
 *
 * 5. JUMP SCARE (7.5s - 8.6s):
 *    - Rapid forward rush towards the player.
 *    - Violent camera screen shake.
 *    - Sudden light flash revealing disturbing pale face & sunken eye sockets (not cartoonish/gory).
 *    - Powerful horror impact sound (~1 second duration).
 *
 * 6. DISAPPEARANCE (8.6s):
 *    - Dissolves cleanly into fog without cheesy particle bursts.
 *    - Restores camera orientation and unlocks player FPP controls.
 *
 * 7. AFTER-SCARE (8.6s - 15.0s):
 *    - 5–8 seconds of lingering tense silence.
 *    - Rapid heartbeat audible.
 *    - Spatialized "Yamini..." vocal whisper from behind/side.
 *    - Environment slowly recovers normal ambient state.
 */

export type ScarePhase =
  | 'IDLE'
  | 'SILENCE'
  | 'ENVIRONMENT_SHIFT'
  | 'GHOST_APPEAR'
  | 'GHOST_RUSH'
  | 'AFTER_SCARE'
  | 'COMPLETED';

export interface PostStoryScareCallbacks {
  onFlashlightFlash?: (intensity: number) => void;
  onObjectiveUpdate?: (title: string, subtitle: string) => void;
  onScareFinished?: () => void;
}

export class PostStoryHorrorScareDirector {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private environment: HorrorEnvironment;
  private player: PlayerController;
  private callbacks: PostStoryScareCallbacks;

  private phase: ScarePhase = 'IDLE';
  private timer = 0;

  private ghost: DistortedGhostRig | null = null;
  private ghostStartPos = new THREE.Vector3();
  private ghostTargetPos = new THREE.Vector3();
  private ghostForward = new THREE.Vector3();

  private flashLight: THREE.PointLight | null = null;
  private scareFlashTimer = 0;

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    environment: HorrorEnvironment,
    player: PlayerController,
    callbacks: PostStoryScareCallbacks = {}
  ) {
    this.scene = scene;
    this.camera = camera;
    this.environment = environment;
    this.player = player;
    this.callbacks = callbacks;
  }

  public isActive(): boolean {
    return this.phase !== 'IDLE' && this.phase !== 'COMPLETED';
  }

  public getPhase(): ScarePhase {
    return this.phase;
  }

  /**
   * Starts the horror sequence immediately when Story Mode cinematic ends.
   */
  public startScareSequence(): void {
    this.phase = 'SILENCE';
    this.timer = 0;

    // 1. STORY MODE ENDS: Objective "FIND YAMINI"
    if (this.callbacks.onObjectiveUpdate) {
      this.callbacks.onObjectiveUpdate('OBJECTIVE UPDATED', 'FIND YAMINI');
    }

    // 2. SILENCE: Complete audio ducking / near-silence for 2 seconds
    horrorAudio.stopStoryModeScore();
    horrorAudio.setPsychologicalSilence(true, 0.4);
    horrorAudio.setHeartbeatDirect(0.0, 50);

    // Suppress player control temporarily during the scripted shock moment
    this.player.isInspecting = true;
  }

  public update(delta: number): void {
    if (!this.isActive()) return;

    this.timer += delta;

    switch (this.phase) {
      // -------------------------------------------------------------
      // 2. SILENCE (0.0s - 2.0s)
      // -------------------------------------------------------------
      case 'SILENCE': {
        // Near-absolute silence. No UI animation, no footsteps.
        if (this.timer >= 2.0) {
          this.phase = 'ENVIRONMENT_SHIFT';
          this.timer = 0;
        }
        break;
      }

      // -------------------------------------------------------------
      // 3. ENVIRONMENT CHANGE (2.0s - 4.5s)
      // -------------------------------------------------------------
      case 'ENVIRONMENT_SHIFT': {
        const p = Math.min(1.0, this.timer / 2.5);
        // Fog becomes denser (density ratio: 1.0 -> 1.7), wind stops completely dead, lighting colder
        this.environment.setHorrorAtmosphere(true, 1.0 + p * 0.7, p);

        // Flashlight micro-jitter to build psychological dread
        if (this.timer > 1.4 && this.timer < 1.6) {
          this.player.triggerFlashlightGlitch();
        }

        if (this.timer >= 2.5) {
          this.spawnGhostEntity();
          this.phase = 'GHOST_APPEAR';
          this.timer = 0;
        }
        break;
      }

      // -------------------------------------------------------------
      // 4. THE GHOST APPEARS (4.5s - 7.5s, 3.0s total)
      // -------------------------------------------------------------
      case 'GHOST_APPEAR': {
        if (this.ghost) {
          // Standing still for first 1.5s, then twitching unnervingly
          const twitchIntensity = this.timer > 1.5 ? Math.min(1.0, (this.timer - 1.5) / 1.5) : 0;
          this.ghost.updateAnimation(this.timer, twitchIntensity);

          // Subtle dissolve in (0 -> 1 over 0.8s)
          if (this.timer < 0.8) {
            this.ghost.setDissolveOpacity(this.timer / 0.8);
          } else {
            this.ghost.setDissolveOpacity(0.95);
          }

          // Camera locks tension subtly onto the figure
          const lookDir = this.ghost.root.position.clone().add(new THREE.Vector3(0, 1.6, 0)).sub(this.camera.position);
          const targetYaw = Math.atan2(-lookDir.x, -lookDir.z);
          this.player.cameraYaw = THREE.MathUtils.lerp(this.player.cameraYaw, targetYaw, delta * 3.5);
        }

        // Transition to rush jump scare at t = 3.0s
        if (this.timer >= 3.0) {
          this.triggerGhostRushJumpScare();
          this.phase = 'GHOST_RUSH';
          this.timer = 0;
        }
        break;
      }

      // -------------------------------------------------------------
      // 5. JUMP SCARE RUSH (7.5s - 8.6s, 1.1s total)
      // -------------------------------------------------------------
      case 'GHOST_RUSH': {
        const rushDuration = 1.05;
        const p = Math.min(1.0, this.timer / rushDuration);

        if (this.ghost) {
          // Exponential fast forward acceleration directly into player camera
          // Reaches 1.6m directly in front of the player's face
          const rushEase = Math.pow(p, 2.2);
          this.ghost.root.position.lerpVectors(this.ghostStartPos, this.ghostTargetPos, rushEase);
          this.ghost.updateAnimation(this.timer, 1.8);

          // Sudden cold strobe flash revealing the disturbing face and hollow eyes
          if (this.flashLight) {
            const flashCurve = Math.sin(Math.min(Math.PI, p * Math.PI * 1.5));
            this.flashLight.intensity = flashCurve * 4.5;
            this.flashLight.position.copy(this.ghost.root.position).add(new THREE.Vector3(0, 1.8, 0.4));
          }
        }

        // Violent screen shake
        const shakeDecay = 1.0 - p * 0.6;
        this.player.scareShakeX = (Math.random() - 0.5) * 0.085 * shakeDecay;
        this.player.scareShakeY = (Math.random() - 0.5) * 0.075 * shakeDecay;
        this.player.scareShakeRoll = (Math.random() - 0.5) * 0.065 * shakeDecay;

        if (this.timer >= rushDuration) {
          this.cleanUpGhost();
          this.phase = 'AFTER_SCARE';
          this.timer = 0;
        }
        break;
      }

      // -------------------------------------------------------------
      // 7. AFTER-SCARE (8.6s - 15.0s, 6.4s total)
      // -------------------------------------------------------------
      case 'AFTER_SCARE': {
        // Reset shake
        this.player.scareShakeX = THREE.MathUtils.lerp(this.player.scareShakeX, 0, delta * 8.0);
        this.player.scareShakeY = THREE.MathUtils.lerp(this.player.scareShakeY, 0, delta * 8.0);
        this.player.scareShakeRoll = THREE.MathUtils.lerp(this.player.scareShakeRoll, 0, delta * 8.0);

        // Player regained FPP movement & mouse look
        if (this.player.isInspecting) {
          this.player.isInspecting = false;
        }

        // 5-8 seconds of silence with pounding heartbeat (accelerated to 88 BPM)
        if (this.timer < 3.5) {
          horrorAudio.setHeartbeatDirect(0.045, 88);
        } else if (this.timer < 6.0) {
          horrorAudio.setHeartbeatDirect(0.025, 76);
        } else {
          horrorAudio.setHeartbeatDirect(0.0, 60);
        }

        // At t = 2.4s: Spatialized "Yamini..." whisper from behind
        if (this.timer >= 2.4 && this.timer - delta < 2.4) {
          horrorAudio.playYaminiWhisper('BEHIND');
        }

        // Slowly ease environment back to normal state
        const restoreProg = Math.min(1.0, this.timer / 6.4);
        const fogFactor = THREE.MathUtils.lerp(1.7, 1.0, restoreProg);
        const coldShift = THREE.MathUtils.lerp(1.0, 0.0, restoreProg);
        this.environment.setHorrorAtmosphere(restoreProg < 0.6, fogFactor, coldShift);

        if (this.timer >= 6.4) {
          this.completeScare();
        }
        break;
      }

      case 'COMPLETED':
      default:
        break;
    }
  }

  private spawnGhostEntity(): void {
    if (this.ghost) {
      this.cleanUpGhost();
    }

    this.ghost = GhostEntityFactory.createGhost();

    // Calculate position 18m directly in front of the player along their forward view angle
    const playerPos = this.player.position.clone();
    const yaw = this.player.cameraYaw;
    this.ghostForward.set(-Math.sin(yaw), 0, -Math.cos(yaw)).normalize();

    // 17 meters away in the fog
    this.ghostStartPos.copy(playerPos).add(this.ghostForward.clone().multiplyScalar(17.0));
    this.ghostStartPos.y = 0;

    // Target rush position: 1.45m in front of player eye height
    this.ghostTargetPos.copy(playerPos).add(this.ghostForward.clone().multiplyScalar(1.45));
    this.ghostTargetPos.y = 0;

    this.ghost.root.position.copy(this.ghostStartPos);
    // Face directly towards the player
    this.ghost.root.lookAt(playerPos.x, this.ghost.root.position.y, playerPos.z);

    this.scene.add(this.ghost.root);
  }

  private triggerGhostRushJumpScare(): void {
    // 1. Play jarring horror impact sting
    horrorAudio.playPostStoryJumpScare();

    // 2. Add dramatic cold strobe light
    if (!this.flashLight) {
      this.flashLight = new THREE.PointLight(0xd4e4f8, 0, 12, 1.5);
      this.scene.add(this.flashLight);
    }
    if (this.ghost) {
      this.flashLight.position.copy(this.ghost.root.position).add(new THREE.Vector3(0, 1.8, 0.4));
    }
  }

  private cleanUpGhost(): void {
    if (this.ghost) {
      this.scene.remove(this.ghost.root);
      this.ghost.dispose();
      this.ghost = null;
    }
    if (this.flashLight) {
      this.scene.remove(this.flashLight);
      this.flashLight.dispose();
      this.flashLight = null;
    }
  }

  private completeScare(): void {
    this.cleanUpGhost();
    this.phase = 'COMPLETED';
    this.player.isInspecting = false;
    this.player.scareShakeX = 0;
    this.player.scareShakeY = 0;
    this.player.scareShakeRoll = 0;

    // Return environmental audio to normal
    horrorAudio.setPsychologicalSilence(false, 2.5);

    if (this.callbacks.onScareFinished) {
      this.callbacks.onScareFinished();
    }
  }

  public dispose(): void {
    this.cleanUpGhost();
    this.phase = 'IDLE';
  }
}
