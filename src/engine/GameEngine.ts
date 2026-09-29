import * as THREE from 'three';
import { HorrorEnvironment } from './Environment';
import { PlayerController } from './PlayerController';
import { GameSettings, PlayerControls, InteractionPrompt, RitualState, PerformanceStats, StoryPoster } from '../types';
import { horrorAudio } from '../audio/HorrorAudioManager';
import { InGameStoryDirector, StorySubtitleData } from './cinematic/InGameStoryDirector';
import { PostStoryHorrorScareDirector } from './cinematic/PostStoryHorrorScareDirector';
import { BungalowHammerDirector } from './cinematic/BungalowHammerDirector';

export class GameEngine {
  public container: HTMLElement;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public environment: HorrorEnvironment;
  public player: PlayerController;
  public storyDirector: InGameStoryDirector;
  public postStoryScare: PostStoryHorrorScareDirector;
  public hammerDirector: BungalowHammerDirector;

  private isRunning = false;
  private animFrameId: number | null = null;
  private clock: THREE.Clock;

  public mode: 'MENU' | 'GAMEPLAY' = 'MENU';
  private menuCameraAngle = 0;
  private nextLightningTime = 22.0;
  private tempForwardVec = new THREE.Vector3();
  private tempCameraPos = new THREE.Vector3();

  // Adaptive Quality & Performance Monitoring
  public currentQuality: 'high' | 'medium' | 'low' = 'high';
  public autoQuality = true;
  private frameCount = 0;
  private fpsSampleTimer = 0;
  private currentFps = 60;
  private currentFrameTimeMs = 16.6;
  private lowFpsCounter = 0;
  private qualityCooldownTimer = 4.0;

  // Callbacks
  public onGateProximityChange?: (dist: number, canInspect: boolean) => void;
  public onLightningFlash?: () => void;
  public onIntroStatusChange?: (isIntroActive: boolean, blackOpacity: number) => void;
  public onGateScarePhaseChange?: (phase: string) => void;
  public onInteractionPromptChange?: (prompt: InteractionPrompt | null) => void;
  public onRitualStateChange?: (state: RitualState) => void;
  public onNoteModalOpenChange?: (isOpen: boolean) => void;
  public onStoryPosterInspect?: (poster: StoryPoster) => void;
  public onStoryPosterClose?: () => void;
  public onBungalowReveal?: () => void;
  public onStoryModeTransition?: (phase: 'TRANSITION_START' | 'CINEMATIC' | 'FADE_BACK' | 'INACTIVE', opacity: number) => void;
  public onStoryModeActive?: () => void;
  public onStoryModeEnd?: () => void;
  public onStorySubtitleChange?: (subtitle: StorySubtitleData | null) => void;
  public onQualityChange?: (quality: 'high' | 'medium' | 'low') => void;
  public onPerformanceStatsUpdate?: (stats: PerformanceStats) => void;

  // 3-Lamp Ritual State (All lamps outside main gate)
  public ritualState: RitualState = {
    noteRead: false,
    lamp1Lit: false,
    lamp2Lit: false,
    lamp3Revealed: false,
    lamp3Lit: false,
    keyRevealed: false,
    keyCollected: false,
    gateUnlocked: false,
    gateOpening: false,
    gateFullyOpen: false,
    hauntedPassageEntered: false,
    storyModeTriggered: false,
    storyModeActive: false,
    storyModeCompleted: false,
    bungalowRevealed: false,
    bungalowDoorInspected: false,
    hammerFound: false,
    hasHammer: false,
    bungalowDoorHits: 0,
    bungalowDoorOpen: false,
    currentObjective: 'EXPLORE ESTATE PERIMETER',
  };

  public currentPrompt: InteractionPrompt | null = null;
  public isNoteOpen = false;
  public inspectedPoster: StoryPoster | null = null;
  public storyModePhase: 'INACTIVE' | 'TRANSITION_START' | 'CINEMATIC' | 'FADE_BACK' = 'INACTIVE';
  private storyTransitionTimer = 0;
  private storyTransitionDuration = 1.8;
  private storyPlayerPosition = new THREE.Vector3();
  private storyPlayerYaw = 0;
  private storyPlayerPitch = 0;
  private gateOpenProgress = 0;
  private explorationAmbienceTimer = 0;
  private nextExplorationSoundTime = 25.0;
  private passageAmbienceTimer = 0;
  private nextPassageAmbienceTime = 18.0;
  private passageRareEventTimer = 0;
  private nextPassageRareEventTime = 42.0;

  // First Scare Sequence ("The Gate") State Machine
  public gateScarePhase:
    | 'IDLE'             // Player has not yet approached within ~5m
    | 'CHAIN_MOVING'     // Step 1: Chain begins moving slowly by itself with quiet metallic sound
    | 'PADLOCK_SHAKE'    // Step 2: Padlock shakes slightly with tiny metallic clink
    | 'SILENCE'          // Step 3: Uncomfortable psychological silence
    | 'AWAITING_INSPECT' // Step 4: [E] Inspect Gate prompt is active
    | 'INSPECTING_FOCUS' // Step 4b: Camera slightly focuses forward toward padlock & chain
    | 'CHAIN_STOPPED'    // Step 5: Chain suddenly stops dead, padlock stops shaking, metal sound ends
    | 'WHISPER'          // Step 6: Subtle human-like whisper directly behind player
    | 'FREE_LOOK_BEHIND' // Step 7: Camera focus released, player can immediately turn around, ambiguous distant movement
    | 'AFTER_TURN_WAIT'  // Step 8: Ambience restoration & distant natural sound
    | 'COMPLETED' = 'IDLE';

  private gateScareTimer = 0;

  public static isMobileDevice(): boolean {
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      ('ontouchstart' in window && window.innerWidth < 1024)
    );
  }

  public static getRecommendedQuality(): 'high' | 'medium' | 'low' {
    const isMobile = GameEngine.isMobileDevice();
    const cores = navigator.hardwareConcurrency || 4;
    if (isMobile) {
      if (cores <= 4 || window.innerWidth < 420) {
        return 'low';
      }
      return 'medium';
    }
    return 'high';
  }

  public getTargetPixelRatio(quality: 'high' | 'medium' | 'low'): number {
    const isMobile = GameEngine.isMobileDevice();
    const dpr = window.devicePixelRatio || 1;
    if (quality === 'high') {
      const maxPR = isMobile ? 1.5 : 2.0;
      return Math.min(dpr, maxPR);
    } else if (quality === 'medium') {
      const maxPR = isMobile ? 1.25 : 1.5;
      return Math.min(dpr, maxPR);
    } else {
      return Math.min(dpr, 1.0);
    }
  }

  public setQuality(quality: 'high' | 'medium' | 'low'): void {
    this.currentQuality = quality;
    if (this.renderer) {
      this.renderer.setPixelRatio(this.getTargetPixelRatio(quality));
      this.renderer.shadowMap.enabled = quality !== 'low';
    }
    if (this.environment) {
      this.environment.applyQuality(quality);
    }
  }

  constructor(container: HTMLElement, settings: GameSettings) {
    this.container = container;
    this.clock = new THREE.Clock();

    this.currentQuality = settings.graphicsQuality;
    this.autoQuality = settings.autoQuality !== false;

    // 1. Scene setup with cinematic layered atmospheric fog (preserves depth and readability)
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b1118);
    // Linear fog: crystal clear foreground (up to 16m), soft atmospheric gradient revealing gate and mansion (up to 92m)
    this.scene.fog = new THREE.Fog(0x0d1520, 16, 92);

    // 2. Camera
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(58, width / height, 0.1, 140);

    // 3. Renderer with progressive fallback for sandboxed/restricted environments
    this.renderer = GameEngine.createRenderer(container, settings, width, height);
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.getTargetPixelRatio(this.currentQuality));
    this.renderer.shadowMap.enabled = this.currentQuality !== 'low';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;
    this.container.appendChild(this.renderer.domElement);

    // 4. Build Environment
    this.environment = new HorrorEnvironment(this.scene);
    this.environment.applyQuality(this.currentQuality);

    // 5. Build Player
    this.player = new PlayerController(this.scene, this.camera);
    this.player.setFlashlight(settings.flashlightEnabled);

    // Wire intro lightning callback
    this.player.onIntroLightning = () => {
      this.environment.triggerLightning(() => {
        if (this.onLightningFlash) this.onLightningFlash();
      });
    };

    // Position menu camera initially
    this.player.setMenuMode(true);
    this.setMenuCamera();

    // 5b. Build In-Game Real-Time Story Director
    this.storyDirector = new InGameStoryDirector(this.scene, this.camera, this.environment, this.player);
    this.storyDirector.callbacks.onSubtitleChange = (sub) => {
      if (this.onStorySubtitleChange) {
        this.onStorySubtitleChange(sub);
      }
    };
    this.storyDirector.callbacks.onComplete = () => {
      this.completeStoryModeSequence();
    };

    // 5c. Build Post-Story Horror Scare Director (The House of Devil Jump Scare)
    this.postStoryScare = new PostStoryHorrorScareDirector(
      this.scene,
      this.camera,
      this.environment,
      this.player,
      {
        onObjectiveUpdate: (title, subtitle) => {
          this.ritualState.currentObjective = subtitle;
          if (this.onRitualStateChange) {
            this.onRitualStateChange(this.ritualState);
          }
        },
        onScareFinished: () => {
          // Player fully back in normal gameplay
        },
      }
    );

    // 5d. Build Bungalow Hammer Sequence Director (3-Hit Interactive Horror Event)
    this.hammerDirector = new BungalowHammerDirector(
      this.scene,
      this.environment,
      this.player
    );
    this.hammerDirector.onHitCompleted = (hitNumber) => {
      this.ritualState.bungalowDoorHits = hitNumber;
      if (hitNumber === 3) {
        this.ritualState.bungalowDoorOpen = true;
        this.ritualState.currentObjective = 'ENTER THE HAUNTED BUNGALOW';
      }
      if (this.onRitualStateChange) {
        this.onRitualStateChange(this.ritualState);
      }
    };
    this.hammerDirector.onSequenceCompleted = () => {
      this.ritualState.bungalowDoorOpen = true;
      this.ritualState.currentObjective = 'EXPLORE INSIDE THE BUNGALOW';
      if (this.onRitualStateChange) {
        this.onRitualStateChange(this.ritualState);
      }
    };

    // 6. Handle Window Resizing
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);

    // Start render loop
    this.start();
  }

  public setMode(mode: 'MENU' | 'GAMEPLAY'): void {
    this.mode = mode;
    if (mode === 'GAMEPLAY') {
      if (this.player.fpViewmodel) this.player.fpViewmodel.visible = true;
      this.player.setMenuMode(false);
      this.player.resetPosition();
    } else {
      // In menu, hide viewmodel and position camera for exterior overview
      if (this.player.fpViewmodel) this.player.fpViewmodel.visible = false;
      this.player.setMenuMode(true);
      this.setMenuCamera();
    }
  }

  private setMenuCamera(): void {
    // Cinematic wide camera overlooking gate and mansion through fog
    this.camera.position.set(0, 3.2, 14);
    this.camera.lookAt(0, 5.5, -22);
  }

  public handleResize(): void {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.getTargetPixelRatio(this.currentQuality));
  }

  public applySettings(settings: GameSettings): void {
    this.setQuality(settings.graphicsQuality);
    this.autoQuality = settings.autoQuality !== false;
    this.player.setFlashlight(settings.flashlightEnabled);
  }

  private start(): void {
    this.isRunning = true;
    this.clock.start();

    const loop = () => {
      if (!this.isRunning) return;
      this.animFrameId = requestAnimationFrame(loop);

      const delta = Math.min(this.clock.getDelta(), 0.1);
      const elapsedTime = this.clock.getElapsedTime();

      // Check lightning random timer (unpredictable intervals, not too frequent: 26-52 sec gap)
      if (elapsedTime > this.nextLightningTime) {
        this.triggerLightningEvent();
        this.nextLightningTime = elapsedTime + Math.random() * 26 + 26;
      }

      // Update environment animation (rain, trees, dust, fog)
      this.environment.update(delta, elapsedTime);

      if (this.mode === 'MENU') {
        // Slow cinematic camera drift in menu
        this.menuCameraAngle += delta * 0.04;
        const camX = Math.sin(this.menuCameraAngle) * 2.8;
        const camY = 3.2 + Math.cos(this.menuCameraAngle * 0.7) * 0.35;
        this.camera.position.set(camX, camY, 14 - Math.sin(this.menuCameraAngle * 0.5) * 1.5);
        this.camera.lookAt(0, 4.8, -22);

        // Keep listener updated in menu
        this.camera.getWorldDirection(this.tempForwardVec);
        horrorAudio.updateListener(this.camera.position, this.tempForwardVec, false);
      } else if (this.storyDirector.isActive) {
        this.storyDirector.update(delta);
        this.camera.getWorldDirection(this.tempForwardVec);
        horrorAudio.updateListener(this.camera.position, this.tempForwardVec, false);
      } else if (this.postStoryScare.isActive()) {
        this.postStoryScare.update(delta);
        this.camera.getWorldDirection(this.tempForwardVec);
        horrorAudio.updateListener(this.camera.position, this.tempForwardVec, false);
      } else if (this.hammerDirector.phase !== 'IDLE' && this.hammerDirector.phase !== 'SEQUENCE_COMPLETED') {
        this.hammerDirector.update(delta);
        this.camera.getWorldDirection(this.tempForwardVec);
        horrorAudio.updateListener(this.camera.position, this.tempForwardVec, false);
      }

      this.renderer.render(this.scene, this.camera);

      // --- Performance Profiler & Adaptive Quality with Hysteresis ---
      this.frameCount++;
      this.fpsSampleTimer += delta;
      if (this.qualityCooldownTimer > 0) {
        this.qualityCooldownTimer -= delta;
      }

      if (this.fpsSampleTimer >= 0.4) {
        this.currentFps = Math.round(this.frameCount / this.fpsSampleTimer);
        this.currentFrameTimeMs = Math.round((this.fpsSampleTimer / this.frameCount) * 10000) / 10;
        this.frameCount = 0;
        this.fpsSampleTimer = 0;

        // Auto Quality Downgrade with Hysteresis:
        // Requires sustained sub-42 FPS for over 3.2 seconds before degrading,
        // and enforces a 6-8 second cooldown between downgrades to prevent oscillation.
        if (this.autoQuality && this.qualityCooldownTimer <= 0) {
          if (this.currentFps < 42) {
            this.lowFpsCounter += 0.4;
            if (this.lowFpsCounter >= 3.2) {
              if (this.currentQuality === 'high') {
                console.info('[Adaptive Quality] Sustained low FPS detected (<42 FPS). Downgrading to MEDIUM.');
                this.setQuality('medium');
                this.qualityCooldownTimer = 6.0;
                this.lowFpsCounter = 0;
                if (this.onQualityChange) this.onQualityChange('medium');
              } else if (this.currentQuality === 'medium') {
                console.info('[Adaptive Quality] Sustained low FPS detected (<42 FPS). Downgrading to LOW.');
                this.setQuality('low');
                this.qualityCooldownTimer = 8.0;
                this.lowFpsCounter = 0;
                if (this.onQualityChange) this.onQualityChange('low');
              }
            }
          } else {
            this.lowFpsCounter = Math.max(0, this.lowFpsCounter - 0.4);
          }
        }

        // Emit real-time stats for the Performance HUD
        if (this.onPerformanceStatsUpdate) {
          this.onPerformanceStatsUpdate({
            fps: this.currentFps,
            frameTime: this.currentFrameTimeMs,
            drawCalls: this.renderer.info.render.calls,
            triangles: this.renderer.info.render.triangles,
            textures: this.renderer.info.memory.textures,
            quality: this.currentQuality,
          });
        }
      }
    };

    loop();
  }

  public updateGameplay(controls: PlayerControls, delta: number): void {
    if (this.mode !== 'GAMEPLAY') return;

    const { distanceToGate, isMoving } = this.player.update(
      delta,
      controls,
      this.environment.colliders,
      this.environment.gatePosition
    );

    // 3D positional audio: update real-time camera position, forward look vector, and movement
    this.camera.getWorldDirection(this.tempForwardVec);
    this.camera.getWorldPosition(this.tempCameraPos);
    horrorAudio.updateListener(
      this.tempCameraPos,
      this.tempForwardVec,
      isMoving
    );

    // In-game story mode cinematic, post-story scare, or hammer horror sequence active state handling
    const isHammerDirectorActive =
      this.hammerDirector.phase !== 'IDLE' && this.hammerDirector.phase !== 'SEQUENCE_COMPLETED';
    if (this.storyModePhase === 'CINEMATIC' || this.postStoryScare.isActive() || isHammerDirectorActive) {
      if (this.currentPrompt !== null) {
        this.currentPrompt = null;
        if (this.onInteractionPromptChange) this.onInteractionPromptChange(null);
      }
      return;
    }

    // Update environmental fog & tension based on gate proximity
    this.environment.updateGateProximity(distanceToGate);
    horrorAudio.updateGateProximity(distanceToGate);

    // Gate opening animation progression
    if (this.ritualState.gateOpening) {
      this.gateOpenProgress += delta * 0.28;
      this.environment.setGateOpenProgress(this.gateOpenProgress);
      if (this.gateOpenProgress >= 1.0) {
        this.ritualState.gateOpening = false;
        this.ritualState.gateFullyOpen = true;
        if (this.onRitualStateChange) this.onRitualStateChange(this.ritualState);
      }
    }

    // Interactive distance calculations for 3-lamp ritual & gate note
    const playerPos = this.player.position;
    const noteDist = playerPos.distanceTo(this.environment.notePosition);
    const lamp1Dist = playerPos.distanceTo(this.environment.lamp1Position);
    const lamp2Dist = playerPos.distanceTo(this.environment.lamp2Position);
    const lamp3Dist = playerPos.distanceTo(this.environment.lamp3Position);
    const keyDist = playerPos.distanceTo(this.environment.keyPosition);

    let nextPrompt: InteractionPrompt | null = null;
    let minCandidateDist = 999;

    // 1. Gate Note pinned on stone pillar (dist <= 3.2m)
    if (noteDist <= 3.2 && noteDist < minCandidateDist) {
      nextPrompt = {
        type: 'NOTE',
        promptText: '[E] Read Note',
        subText: 'Weathered Parchment',
        distance: noteDist,
      };
      minCandidateDist = noteDist;
    }

    // 2. Lamp 1: Broken Garden Shrine (dist <= 3.2m)
    if (lamp1Dist <= 3.2 && !this.ritualState.lamp1Lit && lamp1Dist < minCandidateDist) {
      nextPrompt = {
        type: 'LAMP_1',
        promptText: '[E] Light Lamp',
        subText: 'Broken Garden Shrine',
        distance: lamp1Dist,
      };
      minCandidateDist = lamp1Dist;
    }

    // 3. Lamp 2: Dead Tree Area (dist <= 3.2m)
    if (lamp2Dist <= 3.2 && !this.ritualState.lamp2Lit && lamp2Dist < minCandidateDist) {
      nextPrompt = {
        type: 'LAMP_2',
        promptText: '[E] Light Lamp',
        subText: 'Dead Tree Roots',
        distance: lamp2Dist,
      };
      minCandidateDist = lamp2Dist;
    }

    // 4. Lamp 3: Hidden Stone Alcove (dist <= 3.2m, only when revealed!)
    if (this.ritualState.lamp3Revealed && !this.ritualState.lamp3Lit && lamp3Dist <= 3.2 && lamp3Dist < minCandidateDist) {
      nextPrompt = {
        type: 'LAMP_3',
        promptText: '[E] Light Lamp',
        subText: 'Stone Crevice',
        distance: lamp3Dist,
      };
      minCandidateDist = lamp3Dist;
    }

    // 5. Old Iron Key (dist <= 3.0m, only when revealed and not collected)
    if (this.ritualState.keyRevealed && !this.ritualState.keyCollected && keyDist <= 3.0 && keyDist < minCandidateDist) {
      nextPrompt = {
        type: 'GATE_KEY',
        promptText: '[E] Take Old Iron Key',
        subText: 'Pillar Compartment',
        distance: keyDist,
      };
      minCandidateDist = keyDist;
    }

    // 6. Gate (dist <= 4.2m, when not fully open)
    if (distanceToGate <= this.environment.gateInteractionDistance && !this.ritualState.gateFullyOpen && distanceToGate < minCandidateDist) {
      if (this.ritualState.keyCollected && !this.ritualState.gateUnlocked) {
        nextPrompt = {
          type: 'GATE_CHAIN',
          promptText: '[E] Unlock Gate',
          subText: 'Use Old Iron Key',
          distance: distanceToGate,
        };
        minCandidateDist = distanceToGate;
      } else if (!this.ritualState.gateUnlocked && this.gateScarePhase !== 'INSPECTING_FOCUS') {
        nextPrompt = {
          type: 'GATE_CHAIN',
          promptText: '[E] Inspect Gate',
          subText: 'Chained Shut',
          distance: distanceToGate,
        };
        minCandidateDist = distanceToGate;
      }
    }

    // 7. Story Posters in the Haunted Passage (dist <= 2.2m)
    for (const posterMesh of this.environment.storyPosterMeshes) {
      const pDist = playerPos.distanceTo(posterMesh.position);
      if (pDist <= 2.2 && pDist < minCandidateDist) {
        nextPrompt = {
          type: posterMesh.poster.type,
          promptText: '[E] Inspect Clue',
          subText: posterMesh.poster.title,
          distance: pDist,
          posterId: posterMesh.id,
        };
        minCandidateDist = pDist;
      }
    }

    // 8. Physical World Hammer on Veranda Crate
    // World position: x: -2.8, y: 1.45 + 0.66, z: -57.2
    const hammerWorldPos = new THREE.Vector3(-2.8, 2.1, -57.2);
    const hammerDist = playerPos.distanceTo(hammerWorldPos);
    if (!this.ritualState.hasHammer && hammerDist <= 3.2 && hammerDist < minCandidateDist) {
      nextPrompt = {
        type: 'HAMMER_PICKUP',
        promptText: '[E] Take Heavy Iron Hammer',
        subText: 'Veranda Tool Crate',
        distance: hammerDist,
      };
      minCandidateDist = hammerDist;
    }

    // 9. Bungalow Main Double Entrance Doors
    // Door world position: x: 0, y: 1.45, z: -58.95
    const doorWorldPos = new THREE.Vector3(0, 1.45, -58.95);
    const doorDist = playerPos.distanceTo(doorWorldPos);
    if (doorDist <= 3.5 && !this.ritualState.bungalowDoorOpen && doorDist < minCandidateDist) {
      if (this.ritualState.hasHammer) {
        // Player has hammer: Ready to break the door
        const hitCount = this.ritualState.bungalowDoorHits || 0;
        let subMsg = 'Strike #1: Break Door Barricade';
        if (hitCount === 1) subMsg = 'Strike #2: Break Heavy Latch';
        else if (hitCount === 2) subMsg = 'Strike #3: Smash Door Lock';

        nextPrompt = {
          type: 'BUNGALOW_DOOR_HIT',
          promptText: '[E] Break Door',
          subText: subMsg,
          distance: doorDist,
        };
        minCandidateDist = doorDist;
      } else {
        // Player doesn't have hammer yet: Inspect the locked door
        nextPrompt = {
          type: 'BUNGALOW_DOOR_INSPECT',
          promptText: '[E] Inspect Door',
          subText: 'Heavily Barricaded',
          distance: doorDist,
        };
        minCandidateDist = doorDist;
      }
    }

    // Update prompt state and fire callback
    if (
      this.currentPrompt?.type !== nextPrompt?.type ||
      this.currentPrompt?.promptText !== nextPrompt?.promptText
    ) {
      this.currentPrompt = nextPrompt;
      if (this.onInteractionPromptChange) {
        this.onInteractionPromptChange(this.currentPrompt);
      }
    }

    // First Scare Sequence ("The Gate") state machine
    this.updateGateScareSequence(distanceToGate, delta);

    // Haunted Passage Progress & Atmospheric Sound
    if (playerPos.z < -22.5 && playerPos.z > -46.5) {
      if (!this.ritualState.hauntedPassageEntered) {
        this.ritualState.hauntedPassageEntered = true;
        horrorAudio.playPassageWindGust();
        if (this.onRitualStateChange) {
          this.onRitualStateChange(this.ritualState);
        }
      }

      // Subtle ambient sounds in the passage with long quiet periods
      if (!this.player.isIntroActive && !this.isNoteOpen && !this.inspectedPoster) {
        this.passageAmbienceTimer += delta;
        if (this.passageAmbienceTimer >= this.nextPassageAmbienceTime) {
          this.passageAmbienceTimer = 0;
          this.nextPassageAmbienceTime = 22.0 + Math.random() * 20.0;

          const soundPick = Math.random();
          if (soundPick < 0.35) {
            horrorAudio.playWaterDrop(Math.random() > 0.5 ? 0.7 : -0.7);
          } else if (soundPick < 0.65) {
            horrorAudio.playWallCreak(Math.random() > 0.5 ? 0.5 : -0.5);
          } else if (soundPick < 0.85) {
            horrorAudio.playPassageWindGust();
          } else {
            horrorAudio.playSpatialFootstep(playerPos.x, 0, playerPos.z + 2.5, 0.035);
          }
        }

        // Rare psychological events in the passage
        this.passageRareEventTimer += delta;
        if (this.passageRareEventTimer >= this.nextPassageRareEventTime) {
          this.passageRareEventTimer = 0;
          this.nextPassageRareEventTime = 40.0 + Math.random() * 30.0;

          const rarePick = Math.random();
          if (rarePick < 0.4) {
            this.environment.triggerPassageLanternFlicker();
            horrorAudio.playMenuHover();
          } else if (rarePick < 0.75 && playerPos.z < -34.0) {
            this.environment.triggerPassageShadowCross();
          } else {
            horrorAudio.playSubtleWhisper('BEHIND');
          }
        }
      }

      // Automatic STORY MODE Trigger in the Haunted Passage:
      // Activates seamlessly while Sankar is walking between the two walls after encountering the initial clue
      if (
        playerPos.z <= -28.2 &&
        playerPos.z >= -35.0 &&
        !this.ritualState.storyModeTriggered &&
        !this.isNoteOpen &&
        !this.inspectedPoster &&
        this.storyModePhase === 'INACTIVE'
      ) {
        this.triggerStoryModeSequence();
      }
    }

    // End of Passage / Courtyard Reveal of Haunted Bungalow
    if (playerPos.z <= -46.0 && !this.ritualState.bungalowRevealed) {
      this.ritualState.bungalowRevealed = true;
      this.environment.triggerBungalowRevealLight();
      horrorAudio.playCinematicThunder(300, false);
      horrorAudio.playPassageWindGust();
      if (this.onBungalowReveal) {
        this.onBungalowReveal();
      }
      if (this.onRitualStateChange) {
        this.onRitualStateChange(this.ritualState);
      }
    }

    // 360-Degree Exploration Tension: Occasional subtle spatial sound from deep behind or to the side
    if (!this.player.isIntroActive && !this.isNoteOpen) {
      this.explorationAmbienceTimer += delta;
      if (this.explorationAmbienceTimer >= this.nextExplorationSoundTime) {
        this.explorationAmbienceTimer = 0;
        this.nextExplorationSoundTime = 28.0 + Math.random() * 24.0;

        const camDir = new THREE.Vector3();
        this.player.camera.getWorldDirection(camDir);
        camDir.y = 0;
        camDir.normalize();

        const behindAngle = Math.PI + (Math.random() - 0.5) * 1.3;
        const soundDist = 8.0 + Math.random() * 6.0;

        const cosA = Math.cos(behindAngle);
        const sinA = Math.sin(behindAngle);
        const soundDirX = camDir.x * cosA - camDir.z * sinA;
        const soundDirZ = camDir.x * sinA + camDir.z * cosA;

        const soundX = this.player.position.x + soundDirX * soundDist;
        const soundZ = this.player.position.z + soundDirZ * soundDist;

        if (Math.random() < 0.5) {
          horrorAudio.playSpatialFootstep(soundX, 0, soundZ, 0.022);
        } else {
          horrorAudio.playTreeBranchSnap(soundDirX > 0 ? 0.65 : -0.65);
        }
      }
    }

    // Notify UI of intro cinematic progress
    if (this.onIntroStatusChange) {
      this.onIntroStatusChange(this.player.isIntroActive, this.player.introBlackOpacity);
    }

    // If close to gate or has prompt, notify UI
    const canInspect = this.currentPrompt !== null;
    if (this.onGateProximityChange) {
      this.onGateProximityChange(distanceToGate, canInspect);
    }
  }

  /**
   * First Scare Sequence ("The Gate") Logic:
   * 1. Proximity Trigger (< 5m): Chain slowly begins moving by itself. Quiet metallic chain sound.
   * 2. After ~1.8s: Padlock shakes very slightly with a tiny metallic clink. Gate remains locked.
   * 3. Silence: Environmental ambience ducks, 1.5s uncomfortable silence.
   * 4. [E] Inspect Gate prompt is active.
   * 5. On Inspect: Camera slightly focuses forward on chain/padlock. Chain suddenly freezes dead still.
   * 6. Whisper: After ~1.4s of silence, subtle human-like whisper directly behind player.
   * 7. Player Turns: Camera focus releases immediately; player can freely turn around 180° with mouse.
   *    Ambiguous movement drifts in distant fog/trees.
   * 8. Ambience returns smoothly after a few seconds with a distant natural environmental sound.
   */
  private updateGateScareSequence(distanceToGate: number, delta: number): void {
    if (this.player.isIntroActive) return;

    // Trigger Step 1 when within ~5 meters (gate is at z = -22, player at z >= -17)
    if (this.gateScarePhase === 'IDLE') {
      if (distanceToGate <= 5.2) {
        this.gateScarePhase = 'CHAIN_MOVING';
        this.gateScareTimer = 0;
        this.environment.chainScareMode = 'MOVING_BY_ITSELF';
        this.environment.chainScareTimer = 0;
        horrorAudio.playQuietChainShift();
        if (this.onGateScarePhaseChange) this.onGateScarePhaseChange(this.gateScarePhase);
      }
      return;
    }

    if (this.gateScarePhase === 'CHAIN_MOVING') {
      this.gateScareTimer += delta;
      // Step 2: After approximately 1.8 seconds, padlock shakes slightly with a tiny clink
      if (this.gateScareTimer >= 1.8) {
        this.gateScarePhase = 'PADLOCK_SHAKE';
        this.gateScareTimer = 0;
        this.environment.chainScareMode = 'PADLOCK_SHAKING';
        this.environment.padlockShakeIntensity = 1.0;
        horrorAudio.playSubtlePadlockClink();
        if (this.onGateScarePhaseChange) this.onGateScarePhaseChange(this.gateScarePhase);
      }
    } else if (this.gateScarePhase === 'PADLOCK_SHAKE') {
      this.gateScareTimer += delta;
      // Step 3: After approximately 1.0 second, transition into silence
      if (this.gateScareTimer >= 1.0) {
        this.gateScarePhase = 'SILENCE';
        this.gateScareTimer = 0;
        this.environment.chainScareMode = 'NORMAL';
        horrorAudio.setPsychologicalSilence(true, 1.2);
        if (this.onGateScarePhaseChange) this.onGateScarePhaseChange(this.gateScarePhase);
      }
    } else if (this.gateScarePhase === 'SILENCE') {
      this.gateScareTimer += delta;
      // Step 3 continued: 1.5 seconds of uncomfortable silence, then prompt [E] Inspect Gate is ready
      if (this.gateScareTimer >= 1.5) {
        this.gateScarePhase = 'AWAITING_INSPECT';
        this.gateScareTimer = 0;
        if (this.onGateScarePhaseChange) this.onGateScarePhaseChange(this.gateScarePhase);
      }
    } else if (this.gateScarePhase === 'INSPECTING_FOCUS') {
      this.gateScareTimer += delta;
      // In inspecting focus, chain suddenly stopped (Step 5)
      // After ~1.4 seconds of silence, trigger Step 6: Whisper directly behind player!
      if (this.gateScareTimer >= 1.4) {
        this.gateScarePhase = 'WHISPER';
        this.gateScareTimer = 0;

        // Step 6: Positional whisper directly behind player
        horrorAudio.playCloseWhisperBehind();

        // Step 7: Release camera focus so player can immediately turn around using mouse
        this.player.setInspecting(false);
        this.gateScarePhase = 'FREE_LOOK_BEHIND';
        if (this.onGateScarePhaseChange) this.onGateScarePhaseChange(this.gateScarePhase);

        // Ambiguous movement in distant fog/trees behind player
        this.environment.triggerDistantAmbiguousMovement();
      }
    } else if (this.gateScarePhase === 'FREE_LOOK_BEHIND') {
      this.gateScareTimer += delta;
      // Step 8: After the turn (wait ~4.5 seconds)
      if (this.gateScareTimer >= 4.5) {
        this.gateScarePhase = 'AFTER_TURN_WAIT';
        this.gateScareTimer = 0;
        // Distant environmental sound (distant wood snap)
        horrorAudio.playTreeBranchSnap(Math.random() > 0.5 ? 0.65 : -0.65);
        // Normal wind/rain ambience slowly returns
        horrorAudio.setPsychologicalSilence(false);
        if (this.onGateScarePhaseChange) this.onGateScarePhaseChange(this.gateScarePhase);
      }
    } else if (this.gateScarePhase === 'AFTER_TURN_WAIT') {
      this.gateScareTimer += delta;
      if (this.gateScareTimer >= 4.0) {
        this.gateScarePhase = 'COMPLETED';
        if (this.onGateScarePhaseChange) this.onGateScarePhaseChange(this.gateScarePhase);
      }
    }
  }

  /**
   * Universal interaction handler called when player presses [E] or clicks HUD interaction button.
   */
  public triggerPrimaryInteraction(): void {
    if (this.player.isIntroActive) return;

    if (this.isNoteOpen) {
      this.closeNoteModal();
      return;
    }

    if (!this.currentPrompt) {
      // Fallback: check gate inspect if in range
      const gateDist = this.player.position.distanceTo(this.environment.gatePosition);
      if (gateDist <= this.environment.gateInteractionDistance) {
        this.triggerGateInspectSequence();
      }
      return;
    }

    switch (this.currentPrompt.type) {
      case 'NOTE':
        this.isNoteOpen = true;
        this.ritualState.noteRead = true;
        this.player.setReadingNote(true);
        horrorAudio.playMenuHover();
        if (this.onNoteModalOpenChange) this.onNoteModalOpenChange(true);
        if (this.onRitualStateChange) this.onRitualStateChange(this.ritualState);
        break;

      case 'LAMP_1':
        this.interactLightLamp1();
        break;

      case 'LAMP_2':
        this.interactLightLamp2();
        break;

      case 'LAMP_3':
        this.interactLightLamp3();
        break;

      case 'GATE_KEY':
        this.interactCollectKey();
        break;

      case 'GATE_CHAIN':
        if (this.ritualState.keyCollected && !this.ritualState.gateUnlocked) {
          this.interactUnlockGate();
        } else {
          this.triggerGateInspectSequence();
        }
        break;

      case 'POSTER_1':
      case 'POSTER_2':
      case 'POSTER_3':
      case 'POSTER_4':
      case 'POSTER_5':
        if (this.currentPrompt.posterId) {
          this.inspectStoryPoster(this.currentPrompt.posterId);
        }
        break;

      case 'BUNGALOW_DOOR_INSPECT':
        this.interactInspectBungalowDoor();
        break;

      case 'HAMMER_PICKUP':
        this.interactCollectHammer();
        break;

      case 'BUNGALOW_DOOR_HIT':
        this.interactHitBungalowDoor();
        break;
    }
  }

  /**
   * Bungalow Door Inspection:
   * Reveals door is blocked/locked and updates objective to find a tool.
   */
  public interactInspectBungalowDoor(): void {
    this.ritualState.bungalowDoorInspected = true;
    this.ritualState.currentObjective = 'FIND A HEAVY TOOL TO BREAK THE BUNGALOW DOOR';
    horrorAudio.playMenuHover();
    if (this.onRitualStateChange) {
      this.onRitualStateChange(this.ritualState);
    }
  }

  /**
   * World Hammer Collection:
   * Collects hammer, equips it in player's first-person hand viewmodel, and updates objective.
   */
  public interactCollectHammer(): void {
    if (this.ritualState.hasHammer) return;

    this.ritualState.hammerFound = true;
    this.ritualState.hasHammer = true;
    this.ritualState.currentObjective = 'BREAK DOWN THE BUNGALOW ENTRANCE DOOR';

    // Play pickup sound and trigger first-person hand grab gesture
    horrorAudio.playHammerPickup();
    this.player.hasHammer = true;
    this.player.triggerHandGesture('PICKUP_HAMMER', 1.4);

    // Hide physical hammer from the crate
    this.environment.collectHammer();

    if (this.onRitualStateChange) {
      this.onRitualStateChange(this.ritualState);
    }
  }

  /**
   * Bungalow Door Strike:
   * Executes the 3-hit hammer sequence.
   * Hit 1: Left ghost appears.
   * Hit 2: Right ghost appears.
   * Hit 3: Final jump scare directly in player's face, then door swings wide open.
   */
  public interactHitBungalowDoor(): void {
    if (!this.ritualState.hasHammer) return;
    if (this.hammerDirector.phase !== 'IDLE') return;

    const currentHits = this.ritualState.bungalowDoorHits || 0;
    // Trigger first-person hammer swing animation
    this.player.triggerHandGesture('HAMMER_SWING', 1.2);

    if (currentHits === 0) {
      this.hammerDirector.triggerHit1();
    } else if (currentHits === 1) {
      this.hammerDirector.triggerHit2();
    } else if (currentHits === 2) {
      this.hammerDirector.triggerHit3();
    }
  }

  public inspectStoryPoster(posterId: string): void {
    const posterData = this.environment.storyPosterMeshes.find((p) => p.id === posterId)?.poster;
    if (!posterData) return;
    this.inspectedPoster = posterData;
    this.player.setReadingNote(true);
    horrorAudio.playPaperRustle();
    if (this.onStoryPosterInspect) {
      this.onStoryPosterInspect(posterData);
    }
  }

  public closeStoryPosterModal(): void {
    this.inspectedPoster = null;
    this.player.setReadingNote(false);
    horrorAudio.playPaperRustle();
    if (this.onStoryPosterClose) {
      this.onStoryPosterClose();
    }
  }

  public closeNoteModal(): void {
    this.isNoteOpen = false;
    this.player.setReadingNote(false);
    horrorAudio.playMenuSelect();
    if (this.onNoteModalOpenChange) this.onNoteModalOpenChange(false);
  }

  /**
   * LAMP 1: BROKEN GARDEN SHRINE (Outside gate, to the LEFT)
   * Small realistic flame, subtle smoke, warm local illumination, distant old bell sound.
   */
  public interactLightLamp1(): void {
    if (this.ritualState.lamp1Lit) return;

    this.player.triggerHandGesture('LIGHT_LAMP', 1.8);
    horrorAudio.playLampIgnition();
    this.environment.lightLamp('LAMP_1');
    this.ritualState.lamp1Lit = true;
    if (this.onRitualStateChange) this.onRitualStateChange(this.ritualState);

    // Very distant old bell sound echoes through the rainy night
    setTimeout(() => {
      horrorAudio.playDistantOldBell();
    }, 600);

    // Check if both Lamp 1 & 2 are lit -> reveal Lamp 3
    if (this.ritualState.lamp2Lit && !this.ritualState.lamp3Revealed) {
      setTimeout(() => {
        this.environment.revealLamp3();
        this.ritualState.lamp3Revealed = true;
        if (this.onRitualStateChange) this.onRitualStateChange(this.ritualState);
      }, 2200);
    }
  }

  /**
   * LAMP 2: DEAD TREE AREA (Outside gate, to the RIGHT)
   * Small realistic flame, subtle smoke, warm illumination, window in bungalow flickers, faint wooden creak.
   */
  public interactLightLamp2(): void {
    if (this.ritualState.lamp2Lit) return;

    this.player.triggerHandGesture('LIGHT_LAMP', 1.8);
    horrorAudio.playLampIgnition();
    this.environment.lightLamp('LAMP_2');
    this.environment.triggerBungalowWindowFlicker();
    this.ritualState.lamp2Lit = true;
    if (this.onRitualStateChange) this.onRitualStateChange(this.ritualState);

    // Faint wooden creak from the direction of the house
    setTimeout(() => {
      horrorAudio.playBungalowWindowCreak();
    }, 500);

    // Check if both Lamp 1 & 2 are lit -> reveal Lamp 3
    if (this.ritualState.lamp1Lit && !this.ritualState.lamp3Revealed) {
      setTimeout(() => {
        this.environment.revealLamp3();
        this.ritualState.lamp3Revealed = true;
        if (this.onRitualStateChange) this.onRitualStateChange(this.ritualState);
      }, 2200);
    }
  }

  /**
   * LAMP 3: HIDDEN STONE ALCOVE (Outside gate, revealed after Lamps 1 & 2)
   * Small realistic flame, subtle smoke, warm illumination, silence, metallic sound from gate,
   * padlock shakes, old iron key revealed in pillar compartment.
   */
  public interactLightLamp3(): void {
    if (this.ritualState.lamp3Lit || !this.ritualState.lamp3Revealed) return;

    this.player.triggerHandGesture('LIGHT_LAMP', 1.8);
    horrorAudio.playLampIgnition();
    this.environment.lightLamp('LAMP_3');
    this.ritualState.lamp3Lit = true;
    if (this.onRitualStateChange) this.onRitualStateChange(this.ritualState);

    // Silence descends
    horrorAudio.setPsychologicalSilence(true, 2.2);

    // Metallic sound from gate & padlock shake
    setTimeout(() => {
      horrorAudio.playRitualGateReaction();
      this.environment.chainScareMode = 'PADLOCK_SHAKING';
      this.environment.padlockShakeIntensity = 1.0;

      // Padlock settles, stone compartment clicks open revealing old iron key
      setTimeout(() => {
        this.environment.chainScareMode = 'NORMAL';
        this.environment.revealIronKey();
        this.ritualState.keyRevealed = true;
        horrorAudio.setPsychologicalSilence(false);
        if (this.onRitualStateChange) this.onRitualStateChange(this.ritualState);
      }, 1400);
    }, 1800);
  }

  /**
   * Takes the Old Iron Key from the pillar compartment.
   */
  public interactCollectKey(): void {
    if (this.ritualState.keyCollected || !this.ritualState.keyRevealed) return;

    this.player.triggerHandGesture('PICKUP_KEY', 1.6);
    this.environment.collectIronKey();
    horrorAudio.playKeyPickup();
    this.ritualState.keyCollected = true;
    if (this.onRitualStateChange) this.onRitualStateChange(this.ritualState);
  }

  /**
   * Unlocks the main gate with the Old Iron Key.
   */
  public interactUnlockGate(): void {
    if (this.ritualState.gateUnlocked || !this.ritualState.keyCollected) return;

    this.player.triggerHandGesture('UNLOCK_GATE', 2.0);
    this.environment.dropChains();
    horrorAudio.playGateUnlockAndOpen();
    this.ritualState.gateUnlocked = true;
    this.ritualState.gateOpening = true;
    this.gateOpenProgress = 0;
    if (this.onRitualStateChange) this.onRitualStateChange(this.ritualState);
  }

  /**
   * Called when player presses 'E' or clicks the inspect prompt near the gate.
   */
  public triggerGateInspectSequence(): void {
    if (this.player.isIntroActive) return;

    if (
      this.gateScarePhase === 'AWAITING_INSPECT' ||
      this.gateScarePhase === 'SILENCE' ||
      this.gateScarePhase === 'CHAIN_MOVING' ||
      this.gateScarePhase === 'PADLOCK_SHAKE'
    ) {
      // Step 4: Player enters inspection state, camera slightly focuses forward toward padlock & chain
      this.gateScarePhase = 'INSPECTING_FOCUS';
      this.gateScareTimer = 0;
      this.player.setInspecting(true);

      // Step 5: The chain that was moving suddenly stops dead still! Padlock stops shaking. Metal sound ends.
      this.environment.chainScareMode = 'FROZEN_DEAD_STILL';
      // Create short silence
      horrorAudio.setPsychologicalSilence(true, 0.4);
      if (this.onGateScarePhaseChange) this.onGateScarePhaseChange(this.gateScarePhase);
    } else if (this.gateScarePhase === 'COMPLETED' || this.gateScarePhase === 'IDLE') {
      // Re-inspecting after the scare sequence has already played: momentary focused look without repeated scare
      this.player.setInspecting(true);
      setTimeout(() => {
        this.player.setInspecting(false);
      }, 1600);
    }
  }

  private triggerLightningEvent(): void {
    // Dynamic delay between lightning flash and thunder:
    // Occasional closer thunder: 0.5 - 1.8s
    // Distant thunder: 1.5 - 4.0s
    const isCloser = Math.random() < 0.25;
    const delayMs = isCloser
      ? Math.floor(Math.random() * 1300 + 500)
      : Math.floor(Math.random() * 2500 + 1500);

    this.environment.triggerLightning(() => {
      if (this.onLightningFlash) this.onLightningFlash();
      horrorAudio.playCinematicThunder(delayMs, isCloser);
    });
  }

  public triggerManualGateCreak(): void {
    this.environment.updateGateProximity(2.0);
    horrorAudio.playGateCreak(0.9);
  }

  public setGateInspecting(inspecting: boolean): void {
    this.player.setInspecting(inspecting);
  }

  public triggerStoryModeSequence(): void {
    if (this.ritualState.storyModeTriggered || this.storyDirector.isActive) return;
    this.ritualState.storyModeTriggered = true;
    this.ritualState.storyModeActive = true;
    this.storyModePhase = 'CINEMATIC';

    // Start real-time 3D in-game cutscene director
    this.storyDirector.startCinematic();

    if (this.onStoryModeTransition) {
      this.onStoryModeTransition('CINEMATIC', 1.0);
    }
    if (this.onStoryModeActive) {
      this.onStoryModeActive();
    }
    if (this.onRitualStateChange) {
      this.onRitualStateChange(this.ritualState);
    }
  }

  public skipStoryMode(): void {
    if (this.storyDirector.isActive) {
      this.storyDirector.skipCinematic();
    }
  }

  public completeStoryModeSequence(): void {
    if (this.storyDirector.isActive) {
      this.storyDirector.completeCinematic();
    }
    this.storyModePhase = 'INACTIVE';
    this.ritualState.storyModeActive = false;
    this.ritualState.storyModeCompleted = true;
    this.ritualState.currentObjective = 'FIND YAMINI';

    // Restore gameplay controls
    this.player.setMenuMode(false);

    if (this.onStorySubtitleChange) {
      this.onStorySubtitleChange(null);
    }
    if (this.onStoryModeTransition) {
      this.onStoryModeTransition('INACTIVE', 0);
    }
    if (this.onStoryModeEnd) {
      this.onStoryModeEnd();
    }
    if (this.onRitualStateChange) {
      this.onRitualStateChange(this.ritualState);
    }

    // Immediately trigger Critical Horror Scare Sequence ("The House of Devil")
    this.postStoryScare.startScareSequence();
  }

  public static createRenderer(
    _container: HTMLElement,
    settings: GameSettings,
    _width: number,
    _height: number
  ): THREE.WebGLRenderer {
    try {
      return new THREE.WebGLRenderer({
        antialias: settings.graphicsQuality === 'high',
        powerPreference: 'high-performance',
        alpha: false,
      });
    } catch (e1) {
      console.warn('Standard WebGL initialization failed, attempting fallback context:', e1);
      try {
        return new THREE.WebGLRenderer({
          antialias: false,
          powerPreference: 'default',
          precision: 'mediump',
          failIfMajorPerformanceCaveat: false,
        });
      } catch (e2) {
        console.warn('Fallback WebGL initialization failed, attempting minimal context:', e2);
        return new THREE.WebGLRenderer({
          antialias: false,
          failIfMajorPerformanceCaveat: false,
        });
      }
    }
  }

  public destroy(): void {
    this.isRunning = false;
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    window.removeEventListener('resize', this.handleResize);

    this.storyDirector.destroy();

    if (this.renderer && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
      this.renderer.dispose();
    }
  }
}
