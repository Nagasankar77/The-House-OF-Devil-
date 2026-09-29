/**
 * THE HOUSE OF DEVIL — Unified Game Architecture
 * Single-file frontend orchestrator encapsulating complete 3D game logic,
 * Three.js scenes, FPP camera, audio, horror sequences, bungalow interior, and UI.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { horrorAudio } from '../audio/HorrorAudioManager';
import { HorrorEnvironment } from '../engine/Environment';
import { BungalowInterior, BungalowInteriorClue } from '../engine/BungalowInterior';
import { PlayerController } from '../engine/PlayerController';
import { InGameStoryDirector, StorySubtitleData } from '../engine/cinematic/InGameStoryDirector';
import { PostStoryHorrorScareDirector } from '../engine/cinematic/PostStoryHorrorScareDirector';
import { BungalowHammerDirector } from '../engine/cinematic/BungalowHammerDirector';
import { GameState, GameSettings, PlayerControls, InteractionPrompt, RitualState, PerformanceStats, StoryPoster } from '../types';
import { OpeningScreen } from '../components/OpeningScreen';
import { MainMenu } from '../components/MainMenu';
import { SettingsModal } from '../components/SettingsModal';
import { GameHUD } from '../components/GameHUD';
import { MobileControls } from '../components/MobileControls';
import { CinematicOverlay } from '../components/CinematicOverlay';
import { PerformanceHUD } from '../components/PerformanceHUD';
import { ClueInspectModal } from '../components/ClueInspectModal';
import { StoryCinematicHUD } from '../components/StoryCinematicHUD';

// ==================== GAME CONFIG ====================
export const GAME_CONFIG = {
  TITLE: 'THE HOUSE OF DEVIL',
  SUBTITLE: 'Act I — The Outer Gates & The Abandoned Bungalow',
  EYE_HEIGHT: 1.70,
  WALK_SPEED: 3.4,
  RUN_SPEED: 5.4,
  GATE_Z: -22.0,
  BUNGALOW_DOOR_Z: -58.95,
  GROUND_FLOOR_Y: 1.45,
  SECOND_FLOOR_Y: 5.45,
  FOV: 58,
  NEAR_PLANE: 0.1,
  FAR_PLANE: 140,
  DEFAULT_SENSITIVITY: 0.0024,
  MAX_PITCH_DEG: 65.0,
};

// ==================== GAME STATE ====================
export interface FullGameState {
  state: GameState;
  settings: GameSettings;
  ritual: RitualState;
  activePrompt: InteractionPrompt | null;
  inspectedPoster: StoryPoster | null;
  inspectedInteriorClue: BungalowInteriorClue | null;
  isNoteOpen: boolean;
  isInspectingGate: boolean;
  distanceToGate: number;
  storyModePhase: 'INACTIVE' | 'TRANSITION_START' | 'CINEMATIC' | 'FADE_BACK';
  storySubtitle: StorySubtitleData | null;
  objectiveBanner: { title: string; subtitle: string } | null;
  performanceStats: PerformanceStats | null;
  showPerfHud: boolean;
  isIntroActive: boolean;
  introOpacity: number;
  lightningFlash: boolean;
  isTransitionFading: boolean;
}

// ==================== THREE.JS SETUP ====================
export class HorrorSceneContext {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public environment: HorrorEnvironment;
  public bungalowInterior: BungalowInterior;
  public player: PlayerController;
  public storyDirector: InGameStoryDirector;
  public postStoryScare: PostStoryHorrorScareDirector;
  public hammerDirector: BungalowHammerDirector;

  constructor(container: HTMLElement, settings: GameSettings) {
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene with atmospheric fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b1118);
    this.scene.fog = new THREE.Fog(0x0d1520, 16, 92);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(GAME_CONFIG.FOV, width / height, GAME_CONFIG.NEAR_PLANE, GAME_CONFIG.FAR_PLANE);

    // 3. High-performance WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: settings.graphicsQuality === 'high',
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, settings.graphicsQuality === 'high' ? 2.0 : 1.5));
    this.renderer.shadowMap.enabled = settings.graphicsQuality !== 'low';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;
    container.appendChild(this.renderer.domElement);

    // 4. Exterior Environment
    this.environment = new HorrorEnvironment(this.scene);
    this.environment.applyQuality(settings.graphicsQuality);

    // 5. Complete Two-Story Bungalow Interior (Ground 4 rooms, grand stairs, 2nd floor 2 rooms)
    this.bungalowInterior = new BungalowInterior(this.scene);

    // Merge interior colliders into main collision system
    this.environment.colliders.push(...this.bungalowInterior.colliders);

    // 6. FPP Player Controller
    this.player = new PlayerController(this.scene, this.camera);
    this.player.setFlashlight(settings.flashlightEnabled);

    // 7. Story Directors
    this.storyDirector = new InGameStoryDirector(this.scene, this.camera, this.environment, this.player);
    this.postStoryScare = new PostStoryHorrorScareDirector(this.scene, this.camera, this.environment, this.player);
    this.hammerDirector = new BungalowHammerDirector(this.scene, this.environment, this.player);
  }

  public dispose(container?: HTMLElement | null): void {
    if (this.renderer && this.renderer.domElement) {
      try {
        if (container && typeof container.contains === 'function' && container.contains(this.renderer.domElement)) {
          container.removeChild(this.renderer.domElement);
        } else if (this.renderer.domElement.parentElement) {
          this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
        }
      } catch (err) {
        console.warn('[HorrorSceneContext] Detach cleanup ignored:', err);
      }
      this.renderer.dispose();
    }
  }
}

// ==================== GAME PROGRESSION & CLUES ====================
export const GROUND_FLOOR_CLUE_IDS = [
  'CLUE_LIVING_ROOM_PORTRAIT',
  'CLUE_STUDY_LETTER',
  'CLUE_DINING_CLOCK',
  'CLUE_STORAGE_LOG',
];

// ==================== PRIMARY REACT COMPONENT ====================
export default function Game() {
  const containerRef = useRef<HTMLDivElement>(null);
  const contextRef = useRef<HorrorSceneContext | null>(null);

  // ==================== GAME STATE ====================
  const [gameState, setGameState] = useState<GameState>('OPENING');
  const [settings, setSettings] = useState<GameSettings>(() => ({
    masterVolume: 0.8,
    musicVolume: 0.7,
    sfxVolume: 0.85,
    fullscreen: false,
    graphicsQuality: 'high',
    cameraSensitivity: GAME_CONFIG.DEFAULT_SENSITIVITY,
    flashlightEnabled: false,
    autoQuality: true,
    showPerformanceHud: false,
  }));

  const [ritualState, setRitualState] = useState<RitualState>({
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
  });

  const [activePrompt, setActivePrompt] = useState<InteractionPrompt | null>(null);
  const [distanceToGate, setDistanceToGate] = useState(30);
  const [canInspectGate, setCanInspectGate] = useState(false);
  const [isInspectingGate, setIsInspectingGate] = useState(false);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [inspectedPoster, setInspectedPoster] = useState<StoryPoster | null>(null);
  const [inspectedClue, setInspectedClue] = useState<BungalowInteriorClue | null>(null);

  // Cinematic & Story states
  const [isIntroActive, setIsIntroActive] = useState(false);
  const [introBlackOpacity, setIntroBlackOpacity] = useState(0);
  const [lightningActive, setLightningActive] = useState(false);
  const [isTransitionFading, setIsTransitionFading] = useState(false);
  const [storyModePhase, setStoryModePhase] = useState<'INACTIVE' | 'TRANSITION_START' | 'CINEMATIC' | 'FADE_BACK'>('INACTIVE');
  const [storySubtitle, setStorySubtitle] = useState<StorySubtitleData | null>(null);
  const [objectiveBanner, setObjectiveBanner] = useState<{ title: string; subtitle: string } | null>(null);

  // Performance Profiler stats
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats | null>(null);
  const [showPerformanceHud, setShowPerformanceHud] = useState(false);

  // Internal state tracking explored clues
  const exploredCluesRef = useRef<Set<string>>(new Set());

  // Controls input reference
  const controlsRef = useRef<PlayerControls>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    run: false,
  });
  const isMouseDownRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  // Refs for current states to keep gameLoop stable without re-initializing WebGL on state changes
  const gameStateRef = useRef<GameState>(gameState);
  gameStateRef.current = gameState;

  const ritualStateRef = useRef<RitualState>(ritualState);
  ritualStateRef.current = ritualState;

  const settingsRef = useRef<GameSettings>(settings);
  settingsRef.current = settings;

  // Gate scare state
  const gateScarePhaseRef = useRef<'IDLE' | 'CHAIN_MOVING' | 'PADLOCK_SHAKE' | 'SILENCE' | 'AWAITING_INSPECT' | 'INSPECTING_FOCUS' | 'FREE_LOOK' | 'COMPLETED'>('IDLE');
  const gateScareTimerRef = useRef(0);

  // ==================== THREE.JS SETUP & INITIALIZATION ====================
  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = new HorrorSceneContext(containerRef.current, settingsRef.current);
    contextRef.current = ctx;

    // Story director callbacks
    ctx.storyDirector.callbacks.onSubtitleChange = (sub) => setStorySubtitle(sub);
    ctx.storyDirector.callbacks.onComplete = () => {
      setStoryModePhase('INACTIVE');
      setRitualState((prev) => ({
        ...prev,
        storyModeActive: false,
        storyModeCompleted: true,
        currentObjective: 'FIND YAMINI',
      }));
      setObjectiveBanner({ title: 'OBJECTIVE UPDATED', subtitle: 'FIND YAMINI' });
      setTimeout(() => setObjectiveBanner(null), 5500);
      ctx.player.setMenuMode(false);
      ctx.postStoryScare.startScareSequence();
    };

    // Post-story jump scare callbacks
    ctx.postStoryScare = new PostStoryHorrorScareDirector(ctx.scene, ctx.camera, ctx.environment, ctx.player, {
      onObjectiveUpdate: (_title, subtitle) => {
        setRitualState((prev) => ({ ...prev, currentObjective: subtitle }));
      },
    });

    // Hammer 3-hit sequence callbacks
    ctx.hammerDirector.onHitCompleted = (hitNumber) => {
      setRitualState((prev) => {
        const next = { ...prev, bungalowDoorHits: hitNumber };
        if (hitNumber === 3) {
          next.bungalowDoorOpen = true;
          next.currentObjective = 'ENTER THE HOUSE';
        }
        return next;
      });
      if (hitNumber === 3) {
        setObjectiveBanner({ title: 'DOOR BREACHED', subtitle: 'ENTER THE HOUSE' });
        setTimeout(() => {
          setObjectiveBanner({ title: 'OBJECTIVE', subtitle: 'FIND CLUES ABOUT YAMINI' });
          setRitualState((prev) => ({ ...prev, currentObjective: 'FIND CLUES ABOUT YAMINI' }));
          setTimeout(() => setObjectiveBanner(null), 5000);
        }, 4500);
      }
    };

    // Intro lightning callback
    ctx.player.onIntroLightning = () => {
      ctx.environment.triggerLightning(() => {
        setLightningActive(true);
        setTimeout(() => setLightningActive(false), 120);
      });
    };

    // Position menu camera initially
    ctx.player.setMenuMode(true);
    ctx.camera.position.set(0, 3.2, 14);
    ctx.camera.lookAt(0, 5.5, -22);

    // Window resize handler
    const handleResize = () => {
      if (!containerRef.current || !ctx.renderer || !ctx.camera) return;
      const w = containerRef.current.clientWidth || window.innerWidth;
      const h = containerRef.current.clientHeight || window.innerHeight;
      ctx.camera.aspect = w / h;
      ctx.camera.updateProjectionMatrix();
      ctx.renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // ==================== GAME LOOP ====================
    let isRunning = true;
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsTimer = 0;
    let gateOpenProg = 0;
    let doorOpenProg = 0;

    const gameLoop = () => {
      if (!isRunning) return;
      requestAnimationFrame(gameLoop);

      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Update environment animation (rain, trees, dust)
      ctx.environment.update(dt, now / 1000);

      const curGameState = gameStateRef.current;
      const curRitual = ritualStateRef.current;

      // Mode: MENU camera slow drift
      if (curGameState !== 'PLAYING') {
        const angle = (now / 1000) * 0.04;
        const camX = Math.sin(angle) * 2.8;
        const camY = 3.2 + Math.cos(angle * 0.7) * 0.35;
        ctx.camera.position.set(camX, camY, 14 - Math.sin(angle * 0.5) * 1.5);
        ctx.camera.lookAt(0, 4.8, -22);
      }

      // Mode: PLAYING
      if (curGameState === 'PLAYING') {
        // 1. Cinematic sequences take precedence if active
        if (ctx.storyDirector.isActive) {
          ctx.storyDirector.update(dt);
        } else if (ctx.postStoryScare.isActive()) {
          ctx.postStoryScare.update(dt);
        } else if (ctx.hammerDirector.phase !== 'IDLE' && ctx.hammerDirector.phase !== 'SEQUENCE_COMPLETED') {
          ctx.hammerDirector.update(dt);
        } else {
          // ==================== PLAYER CONTROLLER & ELEVATION ====================
          const { distanceToGate: distToGate, isMoving } = ctx.player.update(
            dt,
            controlsRef.current,
            ctx.environment.colliders,
            ctx.environment.gatePosition
          );
          setDistanceToGate(distToGate);

          // Update Audio Listener Position & Forward Look Vector
          const camDir = new THREE.Vector3();
          const camPos = new THREE.Vector3();
          ctx.camera.getWorldDirection(camDir);
          ctx.camera.getWorldPosition(camPos);
          horrorAudio.updateListener(camPos, camDir, isMoving);

          // Gate proximity audio & fog update
          ctx.environment.updateGateProximity(distToGate);
          horrorAudio.updateGateProximity(distToGate);

          // ==================== STAIRCASE ELEVATION LOGIC ====================
          // Inside Bungalow Grand Staircase: z from -68.5 to -75.5, |x| <= 1.35
          // Ground floor floorY = 1.45, Second floor floorY = 5.45
          const playerPos = ctx.player.position;
          let targetElevation = playerPos.y;

          if (playerPos.z <= -58.5) {
            // Player is inside the bungalow
            if (playerPos.z <= -68.5 && playerPos.z >= -75.5 && Math.abs(playerPos.x) <= 1.35) {
              // Climbing Grand Staircase
              const stairProg = (-68.5 - playerPos.z) / 7.0; // 0 to 1
              targetElevation = GAME_CONFIG.GROUND_FLOOR_Y + stairProg * (GAME_CONFIG.SECOND_FLOOR_Y - GAME_CONFIG.GROUND_FLOOR_Y);
              if (isMoving && Math.random() < 0.08) {
                horrorAudio.playWallCreak(0.5);
              }
            } else if (playerPos.z < -75.5 || (playerPos.y > 3.5 && playerPos.z <= -58.5)) {
              // Second floor level
              targetElevation = GAME_CONFIG.SECOND_FLOOR_Y;
            } else {
              // Ground floor level
              targetElevation = GAME_CONFIG.GROUND_FLOOR_Y;
            }
          }
          ctx.player.position.y = THREE.MathUtils.lerp(ctx.player.position.y, targetElevation, Math.min(1, dt * 10.0));

          // Bungalow interior subtle horror audio update
          ctx.bungalowInterior.update(dt, playerPos);

          // Gate Opening Animation Progression
          if (curRitual.gateOpening && gateOpenProg < 1.0) {
            gateOpenProg += dt * 0.28;
            ctx.environment.setGateOpenProgress(gateOpenProg);
            if (gateOpenProg >= 1.0) {
              setRitualState((prev) => ({ ...prev, gateOpening: false, gateFullyOpen: true }));
            }
          }

          // Bungalow Door Opening Animation Progression
          if (curRitual.bungalowDoorOpen && doorOpenProg < 1.0) {
            doorOpenProg += dt * 0.35;
            ctx.environment.setBungalowDoorOpenProgress(doorOpenProg);
          }

          // ==================== INTERACTION SYSTEM ====================
          let nextPrompt: InteractionPrompt | null = null;
          let minCandidateDist = 999;

          // 1. Gate Note (dist <= 3.2m)
          const noteDist = playerPos.distanceTo(ctx.environment.notePosition);
          if (noteDist <= 3.2 && noteDist < minCandidateDist) {
            nextPrompt = { type: 'NOTE', promptText: '[E] Read Note', subText: 'Weathered Parchment', distance: noteDist };
            minCandidateDist = noteDist;
          }

          // 2. Lamp 1 (dist <= 3.2m)
          const lamp1Dist = playerPos.distanceTo(ctx.environment.lamp1Position);
          if (lamp1Dist <= 3.2 && !curRitual.lamp1Lit && lamp1Dist < minCandidateDist) {
            nextPrompt = { type: 'LAMP_1', promptText: '[E] Light Lamp', subText: 'Broken Garden Shrine', distance: lamp1Dist };
            minCandidateDist = lamp1Dist;
          }

          // 3. Lamp 2 (dist <= 3.2m)
          const lamp2Dist = playerPos.distanceTo(ctx.environment.lamp2Position);
          if (lamp2Dist <= 3.2 && !curRitual.lamp2Lit && lamp2Dist < minCandidateDist) {
            nextPrompt = { type: 'LAMP_2', promptText: '[E] Light Lamp', subText: 'Dead Tree Roots', distance: lamp2Dist };
            minCandidateDist = lamp2Dist;
          }

          // 4. Lamp 3 (dist <= 3.2m, only when revealed)
          const lamp3Dist = playerPos.distanceTo(ctx.environment.lamp3Position);
          if (curRitual.lamp3Revealed && !curRitual.lamp3Lit && lamp3Dist <= 3.2 && lamp3Dist < minCandidateDist) {
            nextPrompt = { type: 'LAMP_3', promptText: '[E] Light Lamp', subText: 'Stone Crevice', distance: lamp3Dist };
            minCandidateDist = lamp3Dist;
          }

          // 5. Old Iron Key (dist <= 3.0m)
          const keyDist = playerPos.distanceTo(ctx.environment.keyPosition);
          if (curRitual.keyRevealed && !curRitual.keyCollected && keyDist <= 3.0 && keyDist < minCandidateDist) {
            nextPrompt = { type: 'GATE_KEY', promptText: '[E] Take Old Iron Key', subText: 'Pillar Compartment', distance: keyDist };
            minCandidateDist = keyDist;
          }

          // 6. Main Gate (dist <= 4.2m)
          if (distToGate <= 4.2 && !curRitual.gateFullyOpen && distToGate < minCandidateDist) {
            if (curRitual.keyCollected && !curRitual.gateUnlocked) {
              nextPrompt = { type: 'GATE_CHAIN', promptText: '[E] Unlock Gate', subText: 'Use Old Iron Key', distance: distToGate };
              minCandidateDist = distToGate;
            } else if (!curRitual.gateUnlocked) {
              nextPrompt = { type: 'GATE_CHAIN', promptText: '[E] Inspect Gate', subText: 'Chained Shut', distance: distToGate };
              minCandidateDist = distToGate;
            }
          }

          // 7. Veranda Crate Heavy Hammer Pickup (x: -2.8, y: 2.1, z: -57.2)
          const hammerPos = new THREE.Vector3(-2.8, 2.1, -57.2);
          const hammerDist = playerPos.distanceTo(hammerPos);
          if (!curRitual.hasHammer && hammerDist <= 3.2 && hammerDist < minCandidateDist) {
            nextPrompt = { type: 'HAMMER_PICKUP', promptText: '[E] Take Heavy Iron Hammer', subText: 'Veranda Tool Crate', distance: hammerDist };
            minCandidateDist = hammerDist;
          }

          // 8. Bungalow Double Entrance Door (x: 0, y: 1.45, z: -58.95)
          const doorPos = new THREE.Vector3(0, 1.45, -58.95);
          const doorDist = playerPos.distanceTo(doorPos);
          if (doorDist <= 3.5 && !curRitual.bungalowDoorOpen && doorDist < minCandidateDist) {
            if (curRitual.hasHammer) {
              const hitCount = curRitual.bungalowDoorHits || 0;
              const subMsg = hitCount === 0 ? 'Strike #1: Break Door Barricade' : hitCount === 1 ? 'Strike #2: Break Heavy Latch' : 'Strike #3: Smash Door Lock';
              nextPrompt = { type: 'BUNGALOW_DOOR_HIT', promptText: '[E] Break Door', subText: subMsg, distance: doorDist };
              minCandidateDist = doorDist;
            } else {
              nextPrompt = { type: 'BUNGALOW_DOOR_INSPECT', promptText: '[E] Inspect Door', subText: 'Heavily Barricaded', distance: doorDist };
              minCandidateDist = doorDist;
            }
          }

          // 9. Bungalow Interior Story Clues (6 rich clue stations)
          if (playerPos.z <= -58.5) {
            for (const clue of ctx.bungalowInterior.interiorClues) {
              const cDist = playerPos.distanceTo(clue.position);
              if (cDist <= 2.8 && cDist < minCandidateDist) {
                nextPrompt = {
                  type: 'NOTE',
                  promptText: `[E] Examine ${clue.name}`,
                  subText: clue.room,
                  distance: cDist,
                };
                minCandidateDist = cDist;
                break;
              }
            }
          }

          setActivePrompt(nextPrompt);
          setCanInspectGate(nextPrompt !== null);

          // Check passage entry and automatic story mode trigger
          if (playerPos.z < -22.5 && playerPos.z > -46.5 && !curRitual.hauntedPassageEntered) {
            setRitualState((prev) => ({ ...prev, hauntedPassageEntered: true }));
            horrorAudio.playPassageWindGust();
          }

          if (playerPos.z <= -28.5 && playerPos.z >= -35.0 && !curRitual.storyModeTriggered && storyModePhase === 'INACTIVE') {
            setRitualState((prev) => ({ ...prev, storyModeTriggered: true, storyModeActive: true }));
            setStoryModePhase('CINEMATIC');
            ctx.storyDirector.startCinematic();
          }

          // Courtyard Reveal of Bungalow
          if (playerPos.z <= -46.0 && !curRitual.bungalowRevealed) {
            setRitualState((prev) => ({ ...prev, bungalowRevealed: true }));
            ctx.environment.triggerBungalowRevealLight();
            horrorAudio.playCinematicThunder(300, false);
            horrorAudio.playPassageWindGust();
          }

          // Check if player entered the second floor or Yamini's room
          if (playerPos.z <= -58.5 && playerPos.y > 4.5) {
            // Second floor reached
            if (playerPos.x > 3.0 && playerPos.z <= -62.0) {
              // Inside Yamini's room
              if (curRitual.currentObjective !== 'FIND OUT WHAT HAPPENED TO YAMINI') {
                setRitualState((prev) => ({ ...prev, currentObjective: 'FIND OUT WHAT HAPPENED TO YAMINI' }));
                setObjectiveBanner({ title: 'YAMINI\'S ROOM', subtitle: 'FIND OUT WHAT HAPPENED TO YAMINI' });
                setTimeout(() => setObjectiveBanner(null), 5000);
              }
            }
          }

          setIsIntroActive(ctx.player.isIntroActive);
          setIntroBlackOpacity(ctx.player.introBlackOpacity);
        }
      }

      ctx.renderer.render(ctx.scene, ctx.camera);

      // Performance Monitor
      frameCount++;
      fpsTimer += dt;
      if (fpsTimer >= 0.5) {
        const curFps = Math.round(frameCount / fpsTimer);
        const curFrameTime = Math.round((fpsTimer / frameCount) * 10000) / 10;
        frameCount = 0;
        fpsTimer = 0;
        setPerformanceStats({
          fps: curFps,
          frameTime: curFrameTime,
          drawCalls: ctx.renderer.info.render.calls,
          triangles: ctx.renderer.info.render.triangles,
          textures: ctx.renderer.info.memory.textures,
          quality: settingsRef.current.graphicsQuality,
        });
      }
    };

    requestAnimationFrame(gameLoop);

    // ==================== CLEANUP ====================
    return () => {
      isRunning = false;
      window.removeEventListener('resize', handleResize);
      ctx.dispose(containerRef.current);
      horrorAudio.dispose();
    };
  }, []);

  // Update graphics quality dynamically when settings change
  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.environment.applyQuality(settings.graphicsQuality);
    }
  }, [settings.graphicsQuality]);

  // ==================== INPUT SYSTEM & KEYBOARD HANDLERS ====================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'PLAYING') return;

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          controlsRef.current.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          controlsRef.current.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          controlsRef.current.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          controlsRef.current.right = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          controlsRef.current.run = true;
          break;
        case 'KeyE':
          handlePrimaryInteraction();
          break;
        case 'F3':
        case 'Backquote':
          e.preventDefault();
          setShowPerformanceHud((prev) => !prev);
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          controlsRef.current.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          controlsRef.current.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          controlsRef.current.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          controlsRef.current.right = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          controlsRef.current.run = false;
          break;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (gameState !== 'PLAYING' || !contextRef.current) return;
      if (document.pointerLockElement === containerRef.current) {
        contextRef.current.player.onMouseMove(e.movementX, e.movementY, settings.cameraSensitivity);
      } else if (isMouseDownRef.current) {
        const dx = e.clientX - lastMousePosRef.current.x;
        const dy = e.clientY - lastMousePosRef.current.y;
        contextRef.current.player.onMouseMove(dx, dy, settings.cameraSensitivity * 1.3);
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      isMouseDownRef.current = true;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      if (gameState === 'PLAYING' && containerRef.current && (e.target as HTMLElement).tagName === 'CANVAS') {
        containerRef.current.requestPointerLock?.();
      }
    };

    const handleMouseUp = () => {
      isMouseDownRef.current = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [gameState, settings.cameraSensitivity, activePrompt, ritualState]);

  // ==================== INTERACTION LOGIC ====================
  const handlePrimaryInteraction = useCallback(() => {
    const ctx = contextRef.current;
    if (!ctx || ctx.player.isIntroActive) return;

    if (isNoteOpen) {
      setIsNoteOpen(false);
      ctx.player.setReadingNote(false);
      return;
    }

    if (inspectedClue) {
      setInspectedClue(null);
      ctx.player.setReadingNote(false);
      return;
    }

    if (!activePrompt) {
      // Fallback gate inspect
      const gDist = ctx.player.position.distanceTo(ctx.environment.gatePosition);
      if (gDist <= 4.2) {
        setIsInspectingGate(true);
        ctx.player.setInspecting(true);
        setTimeout(() => {
          setIsInspectingGate(false);
          ctx.player.setInspecting(false);
        }, 2200);
      }
      return;
    }

    switch (activePrompt.type) {
      case 'NOTE': {
        // Check if inside bungalow for interior clue
        const pPos = ctx.player.position;
        if (pPos.z <= -58.5) {
          const found = ctx.bungalowInterior.interiorClues.find((c) => pPos.distanceTo(c.position) <= 3.0);
          if (found) {
            setInspectedClue(found);
            ctx.player.setReadingNote(true);
            horrorAudio.playPaperRustle();
            exploredCluesRef.current.add(found.id);

            // Check if all ground floor clues were explored
            const allGroundExplored = GROUND_FLOOR_CLUE_IDS.every((id) => exploredCluesRef.current.has(id));
            if (allGroundExplored && ritualState.currentObjective !== 'SEARCH THE SECOND FLOOR') {
              setRitualState((prev) => ({ ...prev, currentObjective: 'SEARCH THE SECOND FLOOR' }));
              setObjectiveBanner({ title: 'OBJECTIVE UPDATED', subtitle: 'SEARCH THE SECOND FLOOR' });
              setTimeout(() => setObjectiveBanner(null), 5000);
            }
            return;
          }
        }
        setIsNoteOpen(true);
        setRitualState((prev) => ({ ...prev, noteRead: true }));
        ctx.player.setReadingNote(true);
        horrorAudio.playMenuHover();
        break;
      }
      case 'LAMP_1': {
        ctx.player.triggerHandGesture('LIGHT_LAMP', 1.8);
        horrorAudio.playLampIgnition();
        ctx.environment.lightLamp('LAMP_1');
        setRitualState((prev) => {
          const next = { ...prev, lamp1Lit: true };
          if (next.lamp2Lit && !next.lamp3Revealed) {
            setTimeout(() => {
              ctx.environment.revealLamp3();
              setRitualState((p) => ({ ...p, lamp3Revealed: true }));
            }, 2200);
          }
          return next;
        });
        setTimeout(() => horrorAudio.playDistantOldBell(), 600);
        break;
      }
      case 'LAMP_2': {
        ctx.player.triggerHandGesture('LIGHT_LAMP', 1.8);
        horrorAudio.playLampIgnition();
        ctx.environment.lightLamp('LAMP_2');
        ctx.environment.triggerBungalowWindowFlicker();
        setRitualState((prev) => {
          const next = { ...prev, lamp2Lit: true };
          if (next.lamp1Lit && !next.lamp3Revealed) {
            setTimeout(() => {
              ctx.environment.revealLamp3();
              setRitualState((p) => ({ ...p, lamp3Revealed: true }));
            }, 2200);
          }
          return next;
        });
        setTimeout(() => horrorAudio.playBungalowWindowCreak(), 500);
        break;
      }
      case 'LAMP_3': {
        ctx.player.triggerHandGesture('LIGHT_LAMP', 1.8);
        horrorAudio.playLampIgnition();
        ctx.environment.lightLamp('LAMP_3');
        setRitualState((prev) => ({ ...prev, lamp3Lit: true }));
        horrorAudio.setPsychologicalSilence(true, 2.2);
        setTimeout(() => {
          horrorAudio.playRitualGateReaction();
          ctx.environment.revealIronKey();
          setRitualState((prev) => ({ ...prev, keyRevealed: true }));
          horrorAudio.setPsychologicalSilence(false);
        }, 2000);
        break;
      }
      case 'GATE_KEY': {
        ctx.player.triggerHandGesture('PICKUP_KEY', 1.6);
        ctx.environment.collectIronKey();
        horrorAudio.playKeyPickup();
        setRitualState((prev) => ({ ...prev, keyCollected: true }));
        break;
      }
      case 'GATE_CHAIN': {
        if (ritualState.keyCollected && !ritualState.gateUnlocked) {
          ctx.player.triggerHandGesture('UNLOCK_GATE', 2.0);
          ctx.environment.dropChains();
          horrorAudio.playGateUnlockAndOpen();
          setRitualState((prev) => ({ ...prev, gateUnlocked: true, gateOpening: true }));
        } else {
          setIsInspectingGate(true);
          ctx.player.setInspecting(true);
          setTimeout(() => {
            setIsInspectingGate(false);
            ctx.player.setInspecting(false);
          }, 2200);
        }
        break;
      }
      case 'HAMMER_PICKUP': {
        ctx.player.triggerHandGesture('PICKUP_HAMMER', 1.4);
        ctx.player.hasHammer = true;
        ctx.environment.collectHammer();
        horrorAudio.playHammerPickup();
        setRitualState((prev) => ({
          ...prev,
          hammerFound: true,
          hasHammer: true,
          currentObjective: 'BREAK DOWN THE BUNGALOW ENTRANCE DOOR',
        }));
        break;
      }
      case 'BUNGALOW_DOOR_INSPECT': {
        setRitualState((prev) => ({
          ...prev,
          bungalowDoorInspected: true,
          currentObjective: 'FIND A HEAVY TOOL TO BREAK THE BUNGALOW DOOR',
        }));
        horrorAudio.playMenuHover();
        break;
      }
      case 'BUNGALOW_DOOR_HIT': {
        if (!ritualState.hasHammer || ctx.hammerDirector.phase !== 'IDLE') return;
        const currentHits = ritualState.bungalowDoorHits || 0;
        ctx.player.triggerHandGesture('HAMMER_SWING', 1.2);
        if (currentHits === 0) ctx.hammerDirector.triggerHit1();
        else if (currentHits === 1) ctx.hammerDirector.triggerHit2();
        else if (currentHits === 2) ctx.hammerDirector.triggerHit3();
        break;
      }
    }
  }, [activePrompt, isNoteOpen, inspectedClue, ritualState]);

  // Flashlight toggle
  const toggleFlashlight = useCallback(() => {
    setSettings((prev) => {
      const next = !prev.flashlightEnabled;
      contextRef.current?.player.setFlashlight(next);
      return { ...prev, flashlightEnabled: next };
    });
  }, []);

  // State transitions
  const handleEnterExperience = useCallback(() => {
    setIsTransitionFading(true);
    horrorAudio.setMode('MENU');
    setTimeout(() => {
      setGameState('MAIN_MENU');
      setIsTransitionFading(false);
    }, 700);
  }, []);

  const handleStartGame = useCallback(() => {
    setIsTransitionFading(true);
    horrorAudio.playCinematicTransition();
    horrorAudio.setMode('GAMEPLAY');
    setSettings((prev) => ({ ...prev, flashlightEnabled: false }));

    setTimeout(() => {
      setGameState('PLAYING');
      if (contextRef.current) {
        contextRef.current.player.resetPosition();
        contextRef.current.player.setFlashlight(false);
        contextRef.current.player.setMenuMode(false);
      }
      setIsTransitionFading(false);
    }, 900);
  }, []);

  const handleReturnToMenu = useCallback(() => {
    setIsTransitionFading(true);
    horrorAudio.setMode('MENU');
    setTimeout(() => {
      setGameState('MAIN_MENU');
      contextRef.current?.player.setMenuMode(true);
      setIsTransitionFading(false);
    }, 500);
  }, []);

  // Mobile controls change
  const handleMobileControls = useCallback((patch: Partial<PlayerControls>) => {
    controlsRef.current = { ...controlsRef.current, ...patch };
  }, []);

  const handleMobileCameraRotate = useCallback((dx: number, dy: number) => {
    if (contextRef.current && gameState === 'PLAYING') {
      contextRef.current.player.onMouseMove(dx, dy, settings.cameraSensitivity * 1.5);
    }
  }, [gameState, settings.cameraSensitivity]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black font-serif text-stone-200">
      {/* 3D WebGL Canvas Viewport */}
      <div
        id="horror-canvas-container"
        ref={containerRef}
        className="absolute inset-0 w-full h-full cursor-crosshair z-0 touch-none select-none"
      />

      {/* Cinematic Fog, Grain, Vignette & Lightning Overlay */}
      <CinematicOverlay
        isFading={isTransitionFading}
        lightningActive={lightningActive}
        introBlackOpacity={introBlackOpacity}
        isIntroActive={isIntroActive}
      />

      {/* 1. Opening Landing Screen */}
      {gameState === 'OPENING' && <OpeningScreen onEnter={handleEnterExperience} />}

      {/* 2. Main Menu */}
      {gameState === 'MAIN_MENU' && (
        <MainMenu
          onPlay={handleStartGame}
          onOpenSettings={() => {
            horrorAudio.setDuckAmbience(true);
            setGameState('SETTINGS');
          }}
          onPlayStory={() => {
            handleStartGame();
            setTimeout(() => {
              contextRef.current?.storyDirector.startCinematic();
              setStoryModePhase('CINEMATIC');
            }, 400);
          }}
        />
      )}

      {/* 3. Settings Modal */}
      {gameState === 'SETTINGS' && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={(newVals) => setSettings((prev) => ({ ...prev, ...newVals }))}
          onClose={() => {
            horrorAudio.setDuckAmbience(false);
            setGameState('MAIN_MENU');
          }}
        />
      )}

      {/* 4. Story Poster / Ground Clue Inspection Modal */}
      {inspectedPoster && (
        <ClueInspectModal
          poster={inspectedPoster}
          onClose={() => {
            setInspectedPoster(null);
            contextRef.current?.player.setReadingNote(false);
          }}
        />
      )}

      {/* 4b. Interior Clue Inspect Modal */}
      {inspectedClue && (
        <div
          id="interior-clue-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-[3px] p-4 select-none animate-fade-in"
          onClick={() => {
            setInspectedClue(null);
            contextRef.current?.player.setReadingNote(false);
          }}
        >
          <div
            className="w-full max-w-lg bg-[#14120f] border-2 border-[#3d3126] shadow-[0_0_80px_rgba(0,0,0,0.98)] p-6 sm:p-8 text-stone-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center border-b border-[#30251c] pb-3 mb-4">
              <span className="text-[10px] font-mono tracking-[0.25em] text-amber-600 uppercase block mb-1">
                {inspectedClue.room}
              </span>
              <h2 className="text-lg sm:text-xl font-serif tracking-wider text-stone-100 uppercase font-semibold">
                {inspectedClue.name}
              </h2>
            </div>
            <p className="font-serif text-sm sm:text-base leading-relaxed text-stone-300 mb-4">
              {inspectedClue.description}
            </p>
            <p className="font-serif italic text-xs sm:text-sm text-amber-500/90 border-t border-[#30251c] pt-3">
              "{inspectedClue.subtext}"
            </p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setInspectedClue(null);
                  contextRef.current?.player.setReadingNote(false);
                }}
                className="px-4 py-1.5 bg-[#261f18] hover:bg-[#3d2f23] border border-[#4d3d2c] text-stone-200 text-xs font-mono uppercase tracking-widest cursor-pointer"
              >
                [E / ESC] Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. In-Game 3D Story Mode Cinematic HUD */}
      {storyModePhase === 'CINEMATIC' && (
        <StoryCinematicHUD
          subtitle={storySubtitle}
          onSkip={() => {
            contextRef.current?.storyDirector.skipCinematic();
          }}
        />
      )}

      {/* 6. Objective Notification Banner */}
      {objectiveBanner && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[8000] pointer-events-none flex flex-col items-center justify-center animate-in fade-in slide-in-from-top duration-700">
          <div className="px-6 py-3 bg-stone-950/90 border border-amber-500/60 rounded shadow-[0_0_24px_rgba(245,158,11,0.35)] flex flex-col items-center">
            <span className="text-[11px] font-mono tracking-[0.3em] uppercase text-amber-400 font-bold mb-1">
              {objectiveBanner.title}
            </span>
            <span className="text-lg md:text-xl font-mono tracking-[0.2em] uppercase text-stone-100 font-black">
              {objectiveBanner.subtitle}
            </span>
          </div>
        </div>
      )}

      {/* 7. Active Gameplay HUD & Mobile Controls */}
      {gameState === 'PLAYING' && (
        <div className={`transition-opacity duration-1000 ${isIntroActive || storyModePhase !== 'INACTIVE' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <GameHUD
            canInspectGate={canInspectGate}
            distanceToGate={distanceToGate}
            flashlightOn={settings.flashlightEnabled}
            onToggleFlashlight={toggleFlashlight}
            onReturnToMenu={handleReturnToMenu}
            onShakeGate={() => horrorAudio.playGateCreak(0.95)}
            isInspecting={isInspectingGate}
            activePrompt={activePrompt}
            ritualState={ritualState}
            isNoteOpen={isNoteOpen}
            onTriggerInteraction={handlePrimaryInteraction}
            onCloseNote={() => {
              setIsNoteOpen(false);
              contextRef.current?.player.setReadingNote(false);
            }}
          />

          {/* Mobile Joystick & Touch Controls */}
          <div className="block md:hidden">
            <MobileControls
              onControlsChange={handleMobileControls}
              onCameraRotate={handleMobileCameraRotate}
              flashlightOn={settings.flashlightEnabled}
              onToggleFlashlight={toggleFlashlight}
              canInspectGate={canInspectGate || !!activePrompt}
              onInspectGate={handlePrimaryInteraction}
              actionLabel={activePrompt ? activePrompt.promptText.replace(/^\[E\]\s*/i, '') : 'INTERACT'}
            />
          </div>
        </div>
      )}

      {/* 8. Performance HUD [F3 / ~] */}
      {(showPerformanceHud || settings.showPerformanceHud) && (
        <PerformanceHUD
          stats={performanceStats}
          onSetQuality={(q) => {
            setSettings((prev) => ({ ...prev, graphicsQuality: q }));
            contextRef.current?.environment.applyQuality(q);
          }}
          autoQuality={settings.autoQuality !== false}
          onToggleAutoQuality={() => setSettings((p) => ({ ...p, autoQuality: !p.autoQuality }))}
          onClose={() => setShowPerformanceHud(false)}
        />
      )}
    </main>
  );
}
