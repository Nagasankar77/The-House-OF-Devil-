/**
 * THE HOUSE OF DEVIL — Unified Game Architecture
 * Single-file frontend orchestrator encapsulating complete 3D game logic,
 * Three.js scenes, FPP camera, audio, horror sequences, bungalow interior, and UI.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { horrorAudio } from '../../game/audio/HorrorAudioManager';
import { HorrorEnvironment } from '../../game/environment/Environment';
import { BungalowInterior, BungalowInteriorClue } from '../../game/world/BungalowInterior';
import { BasementInterior, BasementClue } from '../../game/world/BasementInterior';
import { PlayerController } from '../../game/player/PlayerController';
import { InGameStoryDirector, StorySubtitleData } from '../../systems/story/InGameStoryDirector';
import { PostStoryHorrorScareDirector } from '../../systems/ghost/PostStoryHorrorScareDirector';
import { BungalowHammerDirector } from '../../systems/hammer/BungalowHammerDirector';
import { BatSwarm } from '../../game/effects/BatSwarm';
import { GhostEntityFactory, DistortedGhostRig } from '../../game/effects/GhostEntity';
import { GameState, GameSettings, PlayerControls, InteractionPrompt, RitualState, PerformanceStats, StoryPoster, InventoryItem, FiveItemPuzzleState, BasementPuzzleState } from '../../../shared/types';
import { FiveItemPuzzleSystem, PUZZLE_ITEMS_CONFIG } from '../../systems/puzzle/FiveItemPuzzleSystem';
import { BasementPuzzleSystem } from '../../systems/puzzle/BasementPuzzleSystem';
import { InteractionManager } from '../../game/interaction/InteractionManager';
import { OpeningScreen } from '../OpeningScreen/OpeningScreen';
import { MainMenu } from '../MainMenu/MainMenu';
import { SettingsModal } from '../Settings/SettingsModal';
import { GameHUD } from '../../components/hud/GameHUD';
import { MobileControls } from '../../components/hud/MobileControls';
import { CinematicOverlay } from '../../components/ui/CinematicOverlay';
import { PerformanceHUD } from '../../components/hud/PerformanceHUD';
import { ClueInspectModal } from '../../components/inventory/ClueInspectModal';
import { StoryCinematicHUD } from '../../components/hud/StoryCinematicHUD';
import { InventoryModal } from '../../components/inventory/InventoryModal';
import { BlackboardModal } from '../../components/hud/BlackboardModal';

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
  inspectedInteriorClue: BungalowInteriorClue | BasementClue | null;
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
  public basementInterior: BasementInterior;
  public player: PlayerController;
  public storyDirector: InGameStoryDirector;
  public postStoryScare: PostStoryHorrorScareDirector;
  public hammerDirector: BungalowHammerDirector;
  public interactionManager: InteractionManager;
  public puzzleSystem: FiveItemPuzzleSystem;
  public basementPuzzle: BasementPuzzleSystem;

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
    this.renderer.toneMappingExposure = 1.25;
    container.appendChild(this.renderer.domElement);

    // 4. Exterior Environment
    this.environment = new HorrorEnvironment(this.scene);
    this.environment.applyQuality(settings.graphicsQuality);

    // 5. Complete Two-Story Bungalow Interior (Ground 4 rooms, grand stairs, 2nd floor 2 rooms)
    this.bungalowInterior = new BungalowInterior(this.scene);

    // Merge interior colliders into main collision system
    this.environment.colliders.push(...this.bungalowInterior.colliders);

    // 5b. Complete Underground Basement Level (Central landing + 4 rooms per layout sketch)
    this.basementInterior = new BasementInterior(this.scene);
    this.environment.colliders.push(...this.basementInterior.colliders);

    // 6. FPP Player Controller
    this.player = new PlayerController(this.scene, this.camera);
    this.player.setFlashlight(settings.flashlightEnabled);

    // 7. Story Directors
    this.storyDirector = new InGameStoryDirector(this.scene, this.camera, this.environment, this.player);
    this.postStoryScare = new PostStoryHorrorScareDirector(this.scene, this.camera, this.environment, this.player);
    this.hammerDirector = new BungalowHammerDirector(this.scene, this.environment, this.player);

    // 8. Interaction Manager & Five-Item Puzzle System
    this.interactionManager = new InteractionManager();
    this.puzzleSystem = new FiveItemPuzzleSystem(this.scene, this.bungalowInterior, this.interactionManager);
    this.puzzleSystem.setBungalowInterior(this.bungalowInterior);
    this.puzzleSystem.setInteractionManager(this.interactionManager);
    this.environment.colliders.push(this.puzzleSystem.tableCollider);
    this.environment.colliders.push(this.puzzleSystem.secretDoorCollider);
    this.environment.colliders.push(...this.puzzleSystem.chamberColliders);

    // 8b. Basement Three-Item Star-Door Puzzle System
    this.basementPuzzle = new BasementPuzzleSystem(this.scene, this.interactionManager);
    this.environment.colliders.push(this.basementPuzzle.starDoorCollider);
    this.environment.colliders.push(this.basementPuzzle.stationCollider);

    // Register interior clues into interaction system with lower priority (10)
    for (const clue of this.bungalowInterior.interiorClues) {
      const isDiaryClue = clue.id === 'CLUE_UPPER_BEDROOM_DIARY';
      this.interactionManager.register({
        id: clue.id,
        name: clue.name,
        type: 'NOTE',
        position: clue.position,
        radius: 2.6,
        priority: 10, // Clues have lower priority than puzzle items (100)
        promptText: `[E] EXAMINE ${clue.name.toUpperCase()}`,
        subText: clue.room,
        isUnlocked: () => {
          // For the Master Bedroom Old Notebook, disable ordinary examine interaction
          // so the Diary puzzle pickup interaction takes strict priority!
          if (isDiaryClue) {
            return false;
          }
          return true;
        },
      });
    }

    // Register underground basement clues
    for (const clue of this.basementInterior.basementClues) {
      this.interactionManager.register({
        id: clue.id,
        name: clue.name,
        type: 'NOTE',
        position: clue.position,
        radius: 2.8,
        priority: 10,
        promptText: `[E] EXAMINE ${clue.name.toUpperCase()}`,
        subText: clue.room,
        isUnlocked: () => true,
      });
    }
  }

  public dispose(container?: HTMLElement | null): void {
    if (this.basementInterior) {
      this.basementInterior.dispose();
    }
    if (this.bungalowInterior && typeof (this.bungalowInterior as any).dispose === 'function') {
      (this.bungalowInterior as any).dispose();
    }
    if (this.postStoryScare) {
      this.postStoryScare.dispose();
    }
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

// Module-level reusable scratch vectors (eliminates millions of per-frame heap allocations)
const _doorPos = new THREE.Vector3(0, 1.45, -58.95);
const _camPos = new THREE.Vector3();
const _camDir = new THREE.Vector3();
const _tableCenterPos = new THREE.Vector3(2.50, 1.45 + 0.85, -66.25);
const _toTable = new THREE.Vector3();
const _blackboardPos = new THREE.Vector3(2.85, 2.30, -66.25);
const _toBoard = new THREE.Vector3();
const _secretDoorPos = new THREE.Vector3(0, 1.45 + 1.2, -78.48);
const _altarPos = new THREE.Vector3(0, 1.45 + 0.85, -85.78);
const _camDirection = new THREE.Vector3();
const _flatForward = new THREE.Vector3();

// ==================== GAME PROGRESSION & CLUES ====================
export const GROUND_FLOOR_CLUE_IDS = [
  'CLUE_LIVING_ROOM_PORTRAIT',
  'CLUE_STUDY_LETTER',
  'CLUE_DINING_CLOCK',
  'CLUE_STORAGE_LOG',
  'CLUE_STORAGE_MIRROR',
];

// ==================== SETTINGS PERSISTENCE ====================
const SETTINGS_STORAGE_KEY = 'the_house_of_devil_settings';

const loadSavedSettings = (): Partial<GameSettings> => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    }
  } catch (e) {
    console.warn('Failed to load saved settings:', e);
  }
  return {};
};

const saveSettingsToStorage = (newSettings: GameSettings): void => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    }
  } catch (e) {
    console.warn('Failed to save settings:', e);
  }
};

// ==================== PRIMARY REACT COMPONENT ====================
export default function Game() {
  const containerRef = useRef<HTMLDivElement>(null);
  const contextRef = useRef<HorrorSceneContext | null>(null);

  // ==================== GAME STATE ====================
  const [gameState, setGameState] = useState<GameState>('OPENING');
  const [settings, setSettings] = useState<GameSettings>(() => {
    const saved = loadSavedSettings();
    const musicVol = typeof saved.musicVolume === 'number' ? saved.musicVolume : 0.75;
    const sfxVol = typeof saved.sfxVolume === 'number' ? saved.sfxVolume : 0.85;
    const initial: GameSettings = {
      masterVolume: typeof saved.masterVolume === 'number' ? saved.masterVolume : 1.0,
      musicVolume: musicVol,
      sfxVolume: sfxVol,
      fullscreen: Boolean(saved.fullscreen),
      graphicsQuality: saved.graphicsQuality || 'high',
      cameraSensitivity: typeof saved.cameraSensitivity === 'number' ? saved.cameraSensitivity : GAME_CONFIG.DEFAULT_SENSITIVITY,
      flashlightEnabled: false,
      autoQuality: saved.autoQuality !== undefined ? saved.autoQuality : true,
      showPerformanceHud: Boolean(saved.showPerformanceHud),
    };
    horrorAudio.setVolumes(initial.masterVolume, initial.musicVolume, initial.sfxVolume);
    return initial;
  });

  const [ritualState, setRitualState] = useState<RitualState>({
    noteRead: false,
    lamp1Lit: false,
    lamp2Lit: false,
    lamp3Revealed: false,
    lamp3Lit: false,
    keyRevealed: false,
    keyCollected: false,
    gateOpened: false,
    gateUnlocked: false,
    gateOpening: false,
    gateFullyOpen: false,
    gateHits: 0,
    requiredHammerHits: 1,
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
  const [inspectedClue, setInspectedClue] = useState<BungalowInteriorClue | BasementClue | null>(null);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const isInventoryOpenRef = useRef(false);
  const [batteryCount, setBatteryCount] = useState(1);
  const [collectedItems, setCollectedItems] = useState<InventoryItem[]>([]);
  const collectedItemsRef = useRef<InventoryItem[]>([]);

  // Cinematic & Story states
  const [isIntroActive, setIsIntroActive] = useState(false);
  const [introBlackOpacity, setIntroBlackOpacity] = useState(0);
  const [lightningActive, setLightningActive] = useState(false);
  const [isTransitionFading, setIsTransitionFading] = useState(false);
  const [storyModePhase, setStoryModePhase] = useState<'INACTIVE' | 'TRANSITION_START' | 'CINEMATIC' | 'FADE_BACK'>('INACTIVE');
  const [storySubtitle, setStorySubtitle] = useState<StorySubtitleData | null>(null);
  const [objectiveBanner, setObjectiveBanner] = useState<{ title: string; subtitle: string } | null>(null);
  const [houseProximity, setHouseProximity] = useState<number>(0);

  // Five-Item Puzzle State (Sequential Progression: Diary -> Watch -> Flower -> Bag -> Spectacles)
  const [puzzleState, setPuzzleState] = useState<FiveItemPuzzleState>({
    currentObjectiveItem: 'DIARY',
    collectedItems: [],
    placedItems: [],
    carriedItems: [],
    secretDoorUnlocked: false,
    secretDoorOpenProgress: 0,
    secretDoorOpened: false,
  });
  const [isBlackboardOpen, setIsBlackboardOpen] = useState(false);
  const isBlackboardOpenRef = useRef(false);

  // Basement Three-Item Ritual Puzzle State (Puja Jug, Broken Bone, Skull Bone -> Star Key -> Star Door)
  const [basementPuzzleState, setBasementPuzzleState] = useState<BasementPuzzleState>({
    pujaJugCollected: false,
    brokenBoneCollected: false,
    skullBoneCollected: false,
    pujaJugPlaced: false,
    brokenBonePlaced: false,
    skullBonePlaced: false,
    basementKeySpawned: false,
    hasBasementRoomKey: false,
    starDoorUnlocked: false,
    starDoorOpening: false,
    starDoorOpened: false,
  });
  const [isBasementActive, setIsBasementActive] = useState<boolean>(false);

  // Performance Profiler stats
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats | null>(null);
  const [showPerformanceHud, setShowPerformanceHud] = useState(false);

  // Internal state tracking explored clues and house events
  const exploredCluesRef = useRef<Set<string>>(new Set());
  const enteredHouseRef = useRef(false);
  const staircaseCreakTriggeredRef = useRef(false);
  const lastPointerLockExitRef = useRef<number>(0);
  const isPlacingItemRef = useRef(false);

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

  collectedItemsRef.current = collectedItems;

  const ritualStateRef = useRef<RitualState>(ritualState);
  ritualStateRef.current = ritualState;

  const settingsRef = useRef<GameSettings>(settings);
  settingsRef.current = settings;

  const isNoteOpenRef = useRef(isNoteOpen);
  isNoteOpenRef.current = isNoteOpen;

  const inspectedClueRef = useRef<BungalowInteriorClue | BasementClue | null>(inspectedClue);
  inspectedClueRef.current = inspectedClue;

  const activePromptRef = useRef<InteractionPrompt | null>(null);
  const currentPromptTypeRef = useRef<string | null>(null);
  const currentPromptSubRef = useRef<string | null>(null);
  const currentPromptTextRef = useRef<string | null>(null);
  const canInspectGateRef = useRef(false);

  // Gate hit & cinematic bat swarm state
  const gateHitBusyRef = useRef(false);
  const batSwarmRef = useRef<BatSwarm | null>(null);
  const activeHauntedWomanRef = useRef<DistortedGhostRig | null>(null);
  const hauntedWomanTimerRef = useRef(0);
  const hasTriggeredHauntedWomanScareRef = useRef(false);
  const hasTriggeredGateToBungalowSoundRef = useRef(false);

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
        currentObjective: 'INSPECT THE MAIN GATE',
      }));
      setObjectiveBanner({ title: 'MAIN GATE AHEAD', subtitle: 'INSPECT THE MAIN ENTRANCE GATE' });
      setTimeout(() => setObjectiveBanner(null), 5000);

      // Re-enable all controls immediately: WASD, mouse look, mobile virtual joystick & touch
      ctx.player.setMenuMode(false);
      ctx.player.isInspecting = false;
      ctx.player.setCameraInputLocked(false);
      ctx.player.isStoryModeActive = false;
      ctx.player.resetMovement();
    };

    // Post-story jump scare callbacks
    ctx.postStoryScare = new PostStoryHorrorScareDirector(ctx.scene, ctx.camera, ctx.environment, ctx.player, {
      onObjectiveUpdate: (_title, subtitle) => {
        setRitualState((prev) => ({ ...prev, currentObjective: subtitle }));
      },
    });

    // Hammer sequence callback
    ctx.hammerDirector.onHitCompleted = (_hitNumber) => {
      setRitualState((prev) => ({
        ...prev,
        gateOpened: true,
        bungalowDoorOpen: true,
        bungalowDoorHits: 1,
        currentObjective: 'ENTER THE HOUSE',
      }));
    };

    // Five-Item Puzzle callbacks
    ctx.puzzleSystem.onStateChange = (newPState) => {
      setPuzzleState({ ...newPState });
      setRitualState((prev) => ({
        ...prev,
        fiveItemPuzzleState: { ...newPState },
        currentObjective:
          newPState.placedItems.length === 5
            ? 'ALL 5 BELONGINGS RESTORED — ENTER THE OCCULT CHAMBER'
            : newPState.placedItems.length > 0
            ? `RESTORE REMAINING BELONGINGS TO THE TABLE (${newPState.placedItems.length}/5 PLACED)`
            : prev.currentObjective,
      }));
    };
    ctx.puzzleSystem.onObjectiveBanner = (title, subtitle) => {
      setObjectiveBanner({ title, subtitle });
      setTimeout(() => setObjectiveBanner(null), 5200);
    };

    // Basement Three-Item Ritual Puzzle Callbacks
    ctx.basementPuzzle.onStateChange = (newBState) => {
      setBasementPuzzleState({ ...newBState });
      if (newBState.starDoorUnlocked) {
        setRitualState((prev) => ({
          ...prev,
          currentObjective: 'ENTER THE STAR-MARKED CHAMBER',
        }));
      } else if (newBState.hasBasementRoomKey) {
        setRitualState((prev) => ({
          ...prev,
          currentObjective: 'UNLOCK THE SEALED STAR-MARKED DOOR',
        }));
      } else if (newBState.basementKeySpawned) {
        setRitualState((prev) => ({
          ...prev,
          currentObjective: 'COLLECT THE REVEALED STAR KEY FROM THE PEDESTAL',
        }));
      } else {
        const placed =
          (newBState.pujaJugPlaced ? 1 : 0) +
          (newBState.brokenBonePlaced ? 1 : 0) +
          (newBState.skullBonePlaced ? 1 : 0);
        if (placed > 0) {
          setRitualState((prev) => ({
            ...prev,
            currentObjective: `PLACE REMAINING RELICS ON THE PEDESTAL (${placed}/3 PLACED)`,
          }));
        }
      }
    };
    ctx.basementPuzzle.onBanner = (title, subtitle) => {
      setObjectiveBanner({ title, subtitle });
      setTimeout(() => setObjectiveBanner(null), 5000);
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

    let animFrameId = 0;
    const gameLoop = () => {
      if (!isRunning) return;
      animFrameId = requestAnimationFrame(gameLoop);

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

          // Update Audio Listener Position & Forward Look Vector
          const camDir = new THREE.Vector3();
          const camPos = new THREE.Vector3();
          ctx.camera.getWorldDirection(camDir);
          ctx.camera.getWorldPosition(camPos);
          horrorAudio.updateListener(camPos, camDir, isMoving);

          const playerPos = ctx.player.position;

          // Calculate dynamic house proximity (0 far outside gate, 1 when at front porch / inside bungalow)
          // Bungalow front door is at z = -58.95; outer gate is at z = -22.0
          // As player moves deeper into the estate (-20 down to -59), proximity increases
          const rawProximity = Math.max(0, Math.min(1, (-playerPos.z - 15) / 44));
          // If player is inside the bungalow (z <= -59), proximity reaches maximum 1.0 (feeling of being trapped inside)
          const currentHouseProximity = playerPos.z <= -58.5 ? 1.0 : rawProximity;
          setHouseProximity((prev) => {
            // Smooth lerp to avoid frame-to-frame jitter
            if (Math.abs(prev - currentHouseProximity) > 0.015) {
              return prev + (currentHouseProximity - prev) * 0.12;
            }
            return prev;
          });

          // Track whether player is currently in the underground basement
          const inBasement = ctx.player.currentFloorZone === 'BASEMENT' || playerPos.y < -3.0;
          setIsBasementActive((prev) => (prev !== inBasement ? inBasement : prev));

          // Gate proximity audio & fog update (transitions to indoor atmospheric fog when entering house)
          ctx.environment.updateGateProximity(distToGate, playerPos.z);
          horrorAudio.updateGateProximity(distToGate);

          // Subtle wooden creaks while ascending/descending Grand Staircase
          if (
            playerPos.z <= -68.5 &&
            playerPos.z >= -75.5 &&
            Math.abs(playerPos.x) <= 1.35 &&
            isMoving &&
            Math.random() < 0.05
          ) {
            horrorAudio.playWallCreak(0.4);
          }

          // Bungalow interior subtle horror audio update
          ctx.bungalowInterior.update(dt, playerPos);

          // Underground basement level update (lamp flicker & atmosphere)
          if (ctx.basementInterior) {
            ctx.basementInterior.update(dt);
          }

          // Basement three-item ritual puzzle update (star door swing)
          if (ctx.basementPuzzle) {
            ctx.basementPuzzle.update(dt);
          }

          // Five-item sequential puzzle update (breathing glow, secret door, & floor trap detection)
          ctx.puzzleSystem.update(dt, ctx.player, (title, sub) =>
            setObjectiveBanner({ title, subtitle: sub })
          );

          // Animate and manage Haunted Woman scare lifetime (strictly 3.0 seconds)
          if (activeHauntedWomanRef.current) {
            hauntedWomanTimerRef.current += dt;
            const timer = hauntedWomanTimerRef.current;
            activeHauntedWomanRef.current.updateAnimation(timer, 0.25);
            // Visible for exactly 3 seconds; smoothly fade out during the final 0.35s
            if (timer >= 2.65 && timer < 3.0) {
              const fade = Math.max(0, (3.0 - timer) / 0.35);
              activeHauntedWomanRef.current.setDissolveOpacity(fade);
            }
            if (timer >= 3.0) {
              ctx.scene.remove(activeHauntedWomanRef.current.root);
              activeHauntedWomanRef.current.dispose();
              activeHauntedWomanRef.current = null;
            }
          }

          // Gate Opening Animation Progression
          if ((curRitual.gateOpening || curRitual.gateOpened) && gateOpenProg < 1.0) {
            gateOpenProg += dt * 0.105; // Smooth realistic swing matching ~10s uploaded audio
            ctx.environment.setGateOpenProgress(gateOpenProg);
            if (gateOpenProg >= 1.0) {
              setRitualState((prev) => ({
                ...prev,
                gateOpening: false,
                gateOpened: true,
                gateFullyOpen: true,
                gatePhase: 'GATE_OPEN',
                currentObjective: 'PASS THROUGH THE MAIN GATE',
              }));
            }
          } else if (curRitual.gateOpened || curRitual.gateFullyOpen) {
            // Keep gate 100% open permanently (e.g. if player walks away and comes back)
            if (gateOpenProg < 1.0) {
              gateOpenProg = 1.0;
            }
            ctx.environment.setGateOpenProgress(1.0);
          }

          // Update active bat swarm flight
          if (batSwarmRef.current) {
            batSwarmRef.current.update(dt);
          }

          // Bungalow Door Opening Animation Progression
          if ((curRitual.bungalowDoorOpen || curRitual.bungalowDoorOpening) && doorOpenProg < 1.0) {
            doorOpenProg += dt * 0.28;
            ctx.environment.setBungalowDoorOpenProgress(doorOpenProg);
            if (doorOpenProg >= 1.0) {
              setRitualState((prev) => ({ ...prev, bungalowDoorOpening: false, bungalowDoorOpen: true }));
            }
          }

          // Smooth interior atmospheric adaptation for fog and ambient clarity
          if (ctx.scene.fog instanceof THREE.Fog) {
            if (playerPos.z <= -58.5) {
              ctx.scene.fog.color.lerp(new THREE.Color(0x13151c), dt * 1.5);
              ctx.scene.fog.near = THREE.MathUtils.lerp(ctx.scene.fog.near, 24, dt * 1.5);
            } else {
              ctx.scene.fog.color.lerp(new THREE.Color(0x0d1520), dt * 1.5);
              ctx.scene.fog.near = THREE.MathUtils.lerp(ctx.scene.fog.near, 16, dt * 1.5);
            }
          }

          // Check if player entered the bungalow interior (z <= -59.5)
          if (playerPos.z <= -59.5 && !enteredHouseRef.current) {
            enteredHouseRef.current = true;
            setObjectiveBanner({ title: 'THE ABANDONED BUNGALOW', subtitle: 'ENTER THE HOUSE' });
            setRitualState((prev) => ({ ...prev, currentObjective: 'ENTER THE HOUSE' }));
            setTimeout(() => {
              setObjectiveBanner({ title: 'OBJECTIVE UPDATED', subtitle: 'FIND CLUES ABOUT THE DISAPPEARANCE' });
              setRitualState((prev) => ({ ...prev, currentObjective: 'FIND CLUES ABOUT THE DISAPPEARANCE' }));
              setTimeout(() => setObjectiveBanner(null), 5000);
            }, 4200);
          }

          // Check if player approaches the staircase foyer on ground floor
          if (
            playerPos.z <= -66.5 &&
            playerPos.z >= -69.5 &&
            Math.abs(playerPos.x) <= 2.2 &&
            playerPos.y < 3.0 &&
            !staircaseCreakTriggeredRef.current
          ) {
            staircaseCreakTriggeredRef.current = true;
            horrorAudio.playWallCreak(0.5);
            setTimeout(() => {
              horrorAudio.playSubtleWhisper('BEHIND');
            }, 800);
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

          // 4. Lamp 3 (dist <= 3.2m, only when spawned beside main gate)
          const lamp3Dist = playerPos.distanceTo(ctx.environment.lamp3Position);
          if (curRitual.lamp3Revealed && !curRitual.lamp3Lit && lamp3Dist <= 3.2 && lamp3Dist < minCandidateDist) {
            nextPrompt = { type: 'LAMP_3', promptText: '[E] ACTIVATE LAMP', subText: 'Beside Main Gate', distance: lamp3Dist };
            minCandidateDist = lamp3Dist;
          }

          // 5. Main Gate Interaction Zone
          // Gate is at z = -22.0. Allow player to stand naturally in front of it (z in [-22.2, -16.5], |x| <= 3.5)
          const inGateZone = playerPos.z >= -22.2 && playerPos.z <= -16.5 && Math.abs(playerPos.x) <= 3.5;
          const isGateLocked = !curRitual.gateOpened && !curRitual.gateUnlocked && !curRitual.gateOpening && !curRitual.gateFullyOpen && !curRitual.bungalowDoorOpen;
          if ((inGateZone || distToGate <= 4.8) && isGateLocked && distToGate < minCandidateDist) {
            if (!curRitual.hasHammer) {
              nextPrompt = {
                type: 'GATE_CHAIN',
                promptText: '[E] INSPECT GATE',
                subText: 'Chained Shut: Heavy Iron Padlock',
                distance: distToGate,
              };
            } else {
              nextPrompt = {
                type: 'GATE_CHAIN',
                promptText: '[E] BREAK LOCK',
                subText: 'Strike Lock with Hammer',
                distance: distToGate,
              };
            }
            minCandidateDist = distToGate;
          }

          // 6. Bungalow Double Entrance Door (x: 0, y: 1.45, z: -58.95)
          const doorDist = playerPos.distanceTo(_doorPos);
          if (doorDist <= 3.8 && !curRitual.bungalowDoorOpen && !curRitual.bungalowDoorOpening && !curRitual.gateOpened && doorDist < minCandidateDist) {
            if (curRitual.hasHammer) {
              nextPrompt = {
                type: 'BUNGALOW_DOOR_HIT',
                promptText: '[E] BREAK LOCK',
                subText: 'Strike Lock with Hammer',
                distance: doorDist,
              };
              minCandidateDist = doorDist;
            } else {
              nextPrompt = {
                type: 'BUNGALOW_DOOR_ENTER',
                promptText: '[E] ENTER BUNGALOW',
                subText: 'Old Wooden Front Door',
                distance: doorDist,
              };
              minCandidateDist = doorDist;
            }
          }

          // 9. Bungalow Interior & Basement Interactions (Strict Prioritization)
          if (playerPos.z <= -58.5 || ctx.player.currentFloorZone === 'BASEMENT' || playerPos.y <= -4.0) {
            const camPos = _camPos;
            ctx.camera.getWorldPosition(camPos);
            const camDir = _camDir;
            ctx.camera.getWorldDirection(camDir);

            // Continuously synchronize key state between inventory and basement puzzle
            ctx.basementPuzzle.syncKeyFromInventory(collectedItemsRef.current);

            // A. Update dedicated InteractionManager (Raycasting, range & line-of-sight against all registered items)
            const detected = ctx.interactionManager.update(ctx.camera, playerPos, ctx.environment.colliders);

            if (
              detected &&
              (detected.type === 'PUZZLE_ITEM_PICKUP' ||
                detected.type === 'BASEMENT_PUJA_JUG_PICKUP' ||
                detected.type === 'BASEMENT_BROKEN_BONE_PICKUP' ||
                detected.type === 'BASEMENT_SKULL_BONE_PICKUP' ||
                detected.type === 'BASEMENT_KEY_PICKUP' ||
                detected.type === 'BASEMENT_STATION_PLACE' ||
                detected.type === 'BASEMENT_STAR_DOOR_UNLOCK')
            ) {
              // HIGHEST PRIORITY: Objective item pickup and basement puzzle interaction
              const imPrompt = ctx.interactionManager.getPrompt();
              if (imPrompt) {
                nextPrompt = imPrompt;
                minCandidateDist = imPrompt.distance;
              }
            } else {
              // B. Central Puzzle Table (x: 2.50, z: -66.25)
              const tableDist = camPos.distanceTo(_tableCenterPos);
              const toTable = _toTable.subVectors(_tableCenterPos, camPos).normalize();
              const tableDot = camDir.dot(toTable);

              if (tableDist <= 2.8 && (tableDot > 0.1 || tableDist <= 1.8) && tableDist < minCandidateDist) {
                // Check if player has any collected items in their satchel waiting to be placed
                const unplacedItemType = ctx.puzzleSystem.state.collectedItems.find(
                  (type) => !ctx.puzzleSystem.state.placedItems.includes(type)
                );
                if (unplacedItemType) {
                  const unplacedCfg = PUZZLE_ITEMS_CONFIG.find((c) => c.type === unplacedItemType);
                  nextPrompt = {
                    type: 'PUZZLE_TABLE_PLACE',
                    promptText: '[E] PLACE ITEM',
                    subText: `${unplacedCfg?.name || 'Belonging'} • Restored: ${ctx.puzzleSystem.state.placedItems.length}/5`,
                    distance: tableDist,
                    puzzleItemId: unplacedItemType,
                  };
                  minCandidateDist = tableDist;
                } else if (ctx.puzzleSystem.state.secretDoorUnlocked) {
                  nextPrompt = {
                    type: 'PUZZLE_TABLE_PLACE',
                    promptText: 'Concealed Passage Unsealed',
                    subText: 'The Secret Chamber is Open',
                    distance: tableDist,
                  };
                  minCandidateDist = tableDist;
                } else {
                  nextPrompt = {
                    type: 'PUZZLE_TABLE_PLACE',
                    promptText: 'Central Puzzle Table',
                    subText: `Restored: ${ctx.puzzleSystem.state.placedItems.length}/5 Objects`,
                    distance: tableDist,
                  };
                  minCandidateDist = tableDist;
                }
              }

              // C. Blackboard (x: 2.85, z: -66.25)
              const boardDist = camPos.distanceTo(_blackboardPos);
              const toBoard = _toBoard.subVectors(_blackboardPos, camPos).normalize();
              const boardDot = camDir.dot(toBoard);

              if (boardDist <= 2.9 && (boardDot > 0.1 || boardDist <= 1.8) && boardDist < minCandidateDist) {
                nextPrompt = {
                  type: 'PUZZLE_BLACKBOARD_READ',
                  promptText: '[E] READ BLACKBOARD',
                  subText: 'Mission: Five Lost Belongings',
                  distance: boardDist,
                };
                minCandidateDist = boardDist;
              }

              // D. Secret Passage Beneath the Staircase (x: 0, z: -78.48)
              if (ctx.puzzleSystem.state.secretDoorUnlocked) {
                const doorDist = camPos.distanceTo(_secretDoorPos);
                const altarDist = camPos.distanceTo(_altarPos);

                if (camPos.z <= -79.0 && altarDist <= 2.8 && altarDist < minCandidateDist) {
                  // Inside secret chamber examining the ancient altar
                  nextPrompt = {
                    type: 'SECRET_DOOR_ENTER',
                    promptText: 'ANCIENT OCCULT ALTAR',
                    subText: 'The Devil Candle Burns With Blood-Red Flame',
                    distance: altarDist,
                  };
                  minCandidateDist = altarDist;
                } else if (doorDist <= 3.4 && doorDist < minCandidateDist) {
                  // In front of the concealed door beneath the grand staircase
                  if (!ctx.puzzleSystem.state.secretDoorOpened) {
                    nextPrompt = {
                      type: 'SECRET_DOOR_ENTER',
                      promptText: '[E] OPEN CONCEALED DOOR',
                      subText: 'Beneath Staircase • Five Items Restored',
                      distance: doorDist,
                    };
                  } else {
                    nextPrompt = {
                      type: 'SECRET_DOOR_ENTER',
                      promptText: 'CONCEALED PASSAGE OPEN',
                      subText: 'Subterranean Sanctum Revealed',
                      distance: doorDist,
                    };
                  }
                }
              } else {
                const doorDist = camPos.distanceTo(_secretDoorPos);
                if (doorDist <= 3.2 && doorDist < minCandidateDist) {
                  nextPrompt = {
                    type: 'SECRET_DOOR_LOCKED',
                    promptText: '[E] CONCEALED WOODEN WALL',
                    subText: 'Faint cold draft behind panel • Locked until 5 belongings restored',
                    distance: doorDist,
                  };
                  minCandidateDist = doorDist;
                }
              }

              // E. Generic Bungalow Interior Story Clues (Lower Priority — NEVER blocks collectible items)
              const activeItemCfg = ctx.puzzleSystem.state.currentObjectiveItem
                ? PUZZLE_ITEMS_CONFIG.find((c) => c.type === ctx.puzzleSystem.state.currentObjectiveItem)
                : null;
              const nearActiveItem = activeItemCfg && playerPos.distanceTo(activeItemCfg.position) <= 3.8;

              if (!nextPrompt && !nearActiveItem && detected) {
                const imPrompt = ctx.interactionManager.getPrompt();
                if (imPrompt) {
                  nextPrompt = imPrompt;
                  minCandidateDist = imPrompt.distance;
                }
              }
            }
          }

          const nextType = nextPrompt?.type ?? null;
          const nextSub = nextPrompt?.subText ?? null;
          const nextTxt = nextPrompt?.promptText ?? null;
          if (
            nextType !== currentPromptTypeRef.current ||
            nextSub !== currentPromptSubRef.current ||
            nextTxt !== currentPromptTextRef.current
          ) {
            currentPromptTypeRef.current = nextType;
            currentPromptSubRef.current = nextSub;
            currentPromptTextRef.current = nextTxt;
            activePromptRef.current = nextPrompt;
            setActivePrompt(nextPrompt);
            const canInspect = nextPrompt !== null;
            if (canInspect !== canInspectGateRef.current) {
              canInspectGateRef.current = canInspect;
              setCanInspectGate(canInspect);
            }
          } else if (activePromptRef.current && nextPrompt) {
            activePromptRef.current.distance = nextPrompt.distance;
          }

          // Check passage entry atmospheric sound
          if (playerPos.z < -22.5 && playerPos.z > -46.5 && !curRitual.hauntedPassageEntered) {
            setRitualState((prev) => ({ ...prev, hauntedPassageEntered: true }));
            horrorAudio.playPassageWindGust();
          }

          // Outdoor area trigger between Iron Gate (z = -22.0) and Bungalow (z = -52.0)
          // Plays between iron gate and bunglow.mpeg once when player crosses from gate into outdoor garden/path
          if (
            !hasTriggeredGateToBungalowSoundRef.current &&
            playerPos.z < -22.8 &&
            playerPos.z > -52.0 &&
            Math.abs(playerPos.x) <= 12.0 &&
            playerPos.y >= -1.0 &&
            playerPos.y < 3.0 &&
            ctx.player.currentFloorZone === 'GROUND'
          ) {
            hasTriggeredGateToBungalowSoundRef.current = true;
            horrorAudio.playGateToBungalowHorrorSound();
          }

          // Exact Haunted Woman Scare Trigger:
          // The haunted woman appears only after:
          // 1. Player activates all 3 outdoor lamps.
          // 2. Player successfully opens the main Iron Gate.
          // 3. Player walks into the outdoor area between the Iron Gate and the Bungalow.
          const allLampsActivated = curRitual.lamp1Lit && curRitual.lamp2Lit && curRitual.lamp3Lit;
          const ironGateOpened = curRitual.gateOpened || curRitual.gateFullyOpen || curRitual.gateOpening || curRitual.gateUnlocked;
          const inOutdoorAreaBetweenGateAndHouse =
            playerPos.z < -23.0 &&
            playerPos.z > -50.0 &&
            Math.abs(playerPos.x) <= 12.0 &&
            playerPos.y >= -1.0 &&
            playerPos.y < 3.0 &&
            ctx.player.currentFloorZone === 'GROUND';

          if (!hasTriggeredHauntedWomanScareRef.current && allLampsActivated && ironGateOpened && inOutdoorAreaBetweenGateAndHouse) {
            triggerHauntedWomanScare(ctx);
          }

          // Automatic story mode trigger after gate opening has been removed so player can walk freely inside

          // Courtyard Reveal of Bungalow
          if (playerPos.z <= -46.0 && !curRitual.bungalowRevealed) {
            setRitualState((prev) => ({ ...prev, bungalowRevealed: true }));
            ctx.environment.triggerBungalowRevealLight();
            horrorAudio.playCinematicThunder(300, false);
            horrorAudio.playPassageWindGust();
          }

          // Check if player entered the second floor or upper bedroom
          if (playerPos.z <= -58.5 && playerPos.y > 4.5) {
            // Second floor reached
            if (playerPos.x > 3.0 && playerPos.z <= -62.0) {
              // Inside upper bedroom
              if (curRitual.currentObjective !== 'FIND OUT WHAT HAPPENED HERE') {
                setRitualState((prev) => ({ ...prev, currentObjective: 'FIND OUT WHAT HAPPENED HERE' }));
                setObjectiveBanner({ title: 'MASTER BEDROOM', subtitle: 'FIND OUT WHAT HAPPENED HERE' });
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

    animFrameId = requestAnimationFrame(gameLoop);

    // ==================== CLEANUP ====================
    return () => {
      isRunning = false;
      if (animFrameId) {
        cancelAnimationFrame(animFrameId);
      }
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

  // Flashlight toggle with realistic audio click and player controller synchronization
  const toggleFlashlight = useCallback(() => {
    setSettings((prev) => {
      const next = !prev.flashlightEnabled;
      contextRef.current?.player.setFlashlight(next);
      horrorAudio.playFlashlightClick(next);
      return { ...prev, flashlightEnabled: next };
    });
  }, []);

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
          if (e.repeat) break;
          contextRef.current?.interactionManager.recordKeyEvent('KeyE down');
          handlePrimaryInteraction();
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFlashlight();
          break;
        case 'Tab':
        case 'KeyI':
          e.preventDefault();
          if (isNoteOpenRef.current || isBlackboardOpenRef.current || inspectedClueRef.current) {
            setIsNoteOpen(false);
            isNoteOpenRef.current = false;
            setIsBlackboardOpen(false);
            isBlackboardOpenRef.current = false;
            setInspectedClue(null);
            inspectedClueRef.current = null;
            contextRef.current?.player.setReadingNote(false);
            break;
          }
          setIsInventoryOpen((prev) => {
            const next = !prev;
            isInventoryOpenRef.current = next;
            contextRef.current?.player.setReadingNote(next);
            if (next) {
              controlsRef.current.forward = false;
              controlsRef.current.backward = false;
              controlsRef.current.left = false;
              controlsRef.current.right = false;
              controlsRef.current.run = false;
              contextRef.current?.player.resetMovement();
            }
            return next;
          });
          break;
        case 'Escape':
          if (isInventoryOpenRef.current) {
            e.preventDefault();
            setIsInventoryOpen(false);
            isInventoryOpenRef.current = false;
            contextRef.current?.player.setReadingNote(false);
          } else if (isBlackboardOpenRef.current) {
            e.preventDefault();
            setIsBlackboardOpen(false);
            isBlackboardOpenRef.current = false;
            contextRef.current?.player.setReadingNote(false);
          } else if (inspectedClueRef.current) {
            e.preventDefault();
            setInspectedClue(null);
            inspectedClueRef.current = null;
            contextRef.current?.player.setReadingNote(false);
          } else if (inspectedPoster) {
            e.preventDefault();
            setInspectedPoster(null);
            contextRef.current?.player.setReadingNote(false);
          } else if (isNoteOpenRef.current) {
            e.preventDefault();
            setIsNoteOpen(false);
            isNoteOpenRef.current = false;
            contextRef.current?.player.setReadingNote(false);
          } else if (isInspectingGate) {
            e.preventDefault();
            setIsInspectingGate(false);
          }
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
      if (
        gameState === 'PLAYING' &&
        containerRef.current &&
        document.pointerLockElement !== containerRef.current &&
        performance.now() - lastPointerLockExitRef.current > 1300 &&
        (e.target as HTMLElement).tagName === 'CANVAS'
      ) {
        try {
          const res = containerRef.current.requestPointerLock?.();
          if (res && typeof (res as unknown as Promise<void>).catch === 'function') {
            (res as unknown as Promise<void>).catch(() => {
              // Silently ignore browser cooldown rejection
            });
          }
        } catch {
          // Silently ignore synchronous pointer lock exceptions
        }
      }
    };

    const handleMouseUp = () => {
      isMouseDownRef.current = false;
    };

    const handlePointerLockChange = () => {
      if (document.pointerLockElement === null) {
        lastPointerLockExitRef.current = performance.now();
      }
    };

    const handlePointerLockError = () => {
      lastPointerLockExitRef.current = performance.now();
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (
        event?.reason?.message?.includes?.('Pointer lock') ||
        event?.reason?.name === 'SecurityError' ||
        event?.reason?.name === 'NotAllowedError'
      ) {
        event.preventDefault();
      }
    };

    const handleBlur = () => {
      controlsRef.current = { forward: false, backward: false, left: false, right: false, run: false };
      isMouseDownRef.current = false;
      contextRef.current?.player.resetMovement();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('pointerlockerror', handlePointerLockError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('pointerlockerror', handlePointerLockError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [gameState, settings.cameraSensitivity, toggleFlashlight]);

  // ==================== HAUNTED WOMAN OUTDOOR SCARE ====================
  const cleanupHauntedWoman = useCallback(() => {
    if (activeHauntedWomanRef.current && contextRef.current) {
      contextRef.current.scene.remove(activeHauntedWomanRef.current.root);
      activeHauntedWomanRef.current.dispose();
      activeHauntedWomanRef.current = null;
    }
    hauntedWomanTimerRef.current = 0;
  }, []);

  const triggerHauntedWomanScare = useCallback((ctx: HorrorSceneContext) => {
    // Strictly spawn ONCE per game session; prevent duplicate copies
    if (hasTriggeredHauntedWomanScareRef.current || activeHauntedWomanRef.current) return;
    hasTriggeredHauntedWomanScareRef.current = true;

    // 1. Calculate player's forward view direction from first-person camera
    const camDir = _camDirection;
    ctx.camera.getWorldDirection(camDir);
    const flatForward = _flatForward.set(camDir.x, 0, camDir.z).normalize();
    if (flatForward.lengthSq() < 0.001) {
      flatForward.set(0, 0, -1);
    }

    // 2. Place her directly in the player's forward path, centered in camera view
    // Believable distance (~4.8m) so her full body is clearly visible from head to toe
    const playerPos = ctx.player.position;
    const spawnDist = 4.8;
    const spawnX = playerPos.x + flatForward.x * spawnDist;
    const spawnZ = playerPos.z + flatForward.z * spawnDist;
    // Grounded flush on the outdoor terrain (y = 0.0)
    const spawnY = 0.0;

    // 3. Instantiate the Haunted Woman entity (matching Haunted Mansion Apparition.png)
    const hauntedWoman = GhostEntityFactory.createGhost();
    hauntedWoman.root.position.set(spawnX, spawnY, spawnZ);

    // 4. Naturally face the player
    hauntedWoman.root.lookAt(playerPos.x, spawnY, playerPos.z);

    // 5. Add to scene suddenly for the scare
    ctx.scene.add(hauntedWoman.root);
    activeHauntedWomanRef.current = hauntedWoman;
    hauntedWomanTimerRef.current = 0;
  }, []);

  // ==================== ONE-HIT MAIN GATE & ENTRANCE HAMMER SEQUENCE ====================
  const executeGateStrike = useCallback((ctx: HorrorSceneContext) => {
    // Exactly ONE hit required: prevent duplicate execution
    if (gateHitBusyRef.current) return;
    const cur = ritualStateRef.current;
    if (cur.gateOpened || cur.bungalowDoorOpen) return;

    gateHitBusyRef.current = true;

    // 1. Play first-person hammer swing animation (exactly ONE hit)
    ctx.player.hasHammer = true;
    ctx.player.triggerHandGesture('HAMMER_SWING', 0.85);

    // 2. Immediate hammer strike on lock & chain
    setTimeout(() => {
      // Audio: loud metallic chain-break sound & heavy hammer impact
      horrorAudio.playHammerHit3();
      horrorAudio.playMetallicChainClink(1.3);

      // Play OFFICIAL uploaded main iron gate opening sound effect:
      // Smoothly fades out background music, suppresses old gate sound, plays uploaded 10s audio
      horrorAudio.playMainGateOpeningAudio();

      // Physical reaction: chain and padlock break and drop immediately
      ctx.environment.strikeGate(3);
      ctx.environment.dropChains();
      ctx.environment.damageBungalowDoor(3);
      ctx.environment.setBungalowDoorOpenProgress(1.0);

      // Atmospheric thunder
      horrorAudio.triggerLightningThunder(true);

      // Bats flying out immediately from the bungalow entrance
      setTimeout(() => {
        if (!batSwarmRef.current && contextRef.current) {
          const bSwarm = new BatSwarm(contextRef.current.scene);
          batSwarmRef.current = bSwarm;
          bSwarm.trigger();
          bSwarm.onCompleted = () => {
            batSwarmRef.current = null;
          };
        }
      }, 250);

      // 3. Set entrance states: gateOpening begins smoothly synchronized with the 10s audio
      ritualStateRef.current = {
        ...ritualStateRef.current,
        gateHits: 1,
        gateOpening: true,
        gateOpened: false,
        gateUnlocked: true,
        gateFullyOpen: false,
        gatePhase: 'OPENING',
        bungalowDoorOpen: true,
        bungalowDoorOpening: true,
        bungalowDoorHits: 1,
        currentObjective: 'ENTER THE HOUSE',
      };
      setRitualState((prev) => ({
        ...prev,
        gateHits: 1,
        gateOpening: true,
        gateOpened: false,
        gateUnlocked: true,
        gateFullyOpen: false,
        gatePhase: 'OPENING',
        bungalowDoorOpen: true,
        bungalowDoorOpening: true,
        bungalowDoorHits: 1,
        currentObjective: 'ENTER THE HOUSE',
      }));

      gateHitBusyRef.current = false;
    }, 240);
  }, []);

  // ==================== INTERACTION LOGIC ====================
  const handlePrimaryInteraction = useCallback(() => {
    const ctx = contextRef.current;
    if (!ctx || ctx.player.isIntroActive) return;

    if (isInventoryOpenRef.current) {
      setIsInventoryOpen(false);
      isInventoryOpenRef.current = false;
      ctx.player.setReadingNote(false);
      return;
    }

    if (isNoteOpenRef.current) {
      setIsNoteOpen(false);
      isNoteOpenRef.current = false;
      ctx.player.setReadingNote(false);
      return;
    }

    if (isBlackboardOpenRef.current) {
      setIsBlackboardOpen(false);
      isBlackboardOpenRef.current = false;
      ctx.player.setReadingNote(false);
      return;
    }

    if (inspectedClueRef.current) {
      setInspectedClue(null);
      inspectedClueRef.current = null;
      ctx.player.setReadingNote(false);
      return;
    }

    const curPrompt = activePromptRef.current;
    const detectedTarget = ctx.interactionManager.getCurrentTarget();

    // 1. HIGHEST PRIORITY: Collect active puzzle objective item immediately!
    // Never open any clue or description popup when an item is targeted.
    if (curPrompt?.type === 'PUZZLE_ITEM_PICKUP' || detectedTarget?.type === 'PUZZLE_ITEM_PICKUP') {
      const collectedItem = ctx.puzzleSystem.collectCurrentItem();
      if (collectedItem) {
        ctx.player.triggerHandGesture('PICKUP_ITEM', 0.85);
        setCollectedItems((prev) => {
          if (prev.some((item) => item.id === collectedItem.id)) return prev;
          return [...prev, collectedItem];
        });
        setPuzzleState({ ...ctx.puzzleSystem.state });
        activePromptRef.current = null;
        currentPromptTypeRef.current = null;
        currentPromptSubRef.current = null;
        currentPromptTextRef.current = null;
        setActivePrompt(null);
      }
      return;
    }

    // 1b. HIGHEST PRIORITY: Collect basement ritual items immediately when targeted
    if (
      curPrompt?.type === 'BASEMENT_PUJA_JUG_PICKUP' || detectedTarget?.type === 'BASEMENT_PUJA_JUG_PICKUP' ||
      curPrompt?.type === 'BASEMENT_BROKEN_BONE_PICKUP' || detectedTarget?.type === 'BASEMENT_BROKEN_BONE_PICKUP' ||
      curPrompt?.type === 'BASEMENT_SKULL_BONE_PICKUP' || detectedTarget?.type === 'BASEMENT_SKULL_BONE_PICKUP' ||
      curPrompt?.type === 'BASEMENT_KEY_PICKUP' || detectedTarget?.type === 'BASEMENT_KEY_PICKUP'
    ) {
      const targetType = (curPrompt?.type || detectedTarget?.type) as string;
      let collectedItem: InventoryItem | null = null;
      if (targetType === 'BASEMENT_PUJA_JUG_PICKUP') {
        collectedItem = ctx.basementPuzzle.collectPujaJug();
      } else if (targetType === 'BASEMENT_BROKEN_BONE_PICKUP') {
        collectedItem = ctx.basementPuzzle.collectBrokenBone();
      } else if (targetType === 'BASEMENT_SKULL_BONE_PICKUP') {
        collectedItem = ctx.basementPuzzle.collectSkullBone();
      } else if (targetType === 'BASEMENT_KEY_PICKUP') {
        collectedItem = ctx.basementPuzzle.collectStarKey();
      }

      if (collectedItem) {
        ctx.player.triggerHandGesture('PICKUP_ITEM', 0.85);
        setCollectedItems((prev) => {
          if (prev.some((item) => item.id === collectedItem!.id)) return prev;
          return [...prev, collectedItem!];
        });
        setBasementPuzzleState({ ...ctx.basementPuzzle.state });
        activePromptRef.current = null;
        currentPromptTypeRef.current = null;
        currentPromptSubRef.current = null;
        currentPromptTextRef.current = null;
        setActivePrompt(null);
      }
      return;
    }

    // 1c. Star-marked locked door interaction
    if (curPrompt?.type === 'BASEMENT_STAR_DOOR_UNLOCK' || detectedTarget?.type === 'BASEMENT_STAR_DOOR_UNLOCK') {
      // Ensure key state is fully synced before checking
      ctx.basementPuzzle.syncKeyFromInventory(collectedItemsRef.current);
      const unlocked = ctx.basementPuzzle.unlockStarDoor();
      if (unlocked) {
        ctx.player.triggerHandGesture('PICKUP_ITEM', 0.6);
        setBasementPuzzleState({ ...ctx.basementPuzzle.state });
        activePromptRef.current = null;
        currentPromptTypeRef.current = null;
        currentPromptSubRef.current = null;
        currentPromptTextRef.current = null;
        setActivePrompt(null);
      } else {
        // Player tried to unlock without key: keep locked and show short prompt/banner
        setObjectiveBanner({
          title: 'LOCKED',
          subtitle: 'FIND THE KEY',
        });
        setTimeout(() => setObjectiveBanner(null), 3500);
      }
      return;
    }

    // 1d. Placement station interaction
    if (curPrompt?.type === 'BASEMENT_STATION_PLACE' || detectedTarget?.type === 'BASEMENT_STATION_PLACE') {
      const itemToPlace = ctx.basementPuzzle.getNextItemToPlace();
      if (itemToPlace) {
        ctx.player.triggerHandGesture('PLACE_ITEM', 0.85);
        ctx.basementPuzzle.placeItemOnStation(itemToPlace);
        const itemIdMap: Record<string, string> = {
          PUJA_JUG: 'BASEMENT_ITEM_PUJA_JUG',
          HALF_BROKEN_BONE: 'BASEMENT_ITEM_BROKEN_BONE',
          SKULL_BONE: 'BASEMENT_ITEM_SKULL_BONE',
        };
        const targetId = itemIdMap[itemToPlace];
        setCollectedItems((prev) => prev.filter((item) => item.id !== targetId));
        setBasementPuzzleState({ ...ctx.basementPuzzle.state });
        activePromptRef.current = null;
        currentPromptTypeRef.current = null;
        currentPromptSubRef.current = null;
        currentPromptTextRef.current = null;
        setActivePrompt(null);
      }
      return;
    }

    const curRitual = ritualStateRef.current;
    const gDist = ctx.player.position.distanceTo(ctx.environment.gatePosition);

    if (!curPrompt) {
      // Natural interaction when standing in front of the gate with hammer
      if (
        gDist <= 4.8 &&
        curRitual.hasHammer &&
        !curRitual.gateOpened &&
        !curRitual.gateUnlocked &&
        !curRitual.gateOpening &&
        !curRitual.gateFullyOpen
      ) {
        executeGateStrike(ctx);
      }
      return;
    }

    switch (curPrompt.type) {
      case 'NOTE': {
        // Check if inside basement or bungalow for interior clue
        const pPos = ctx.player.position;
        if (pPos.y < -3.0 || ctx.player.currentFloorZone === 'BASEMENT') {
          const found = ctx.basementInterior.basementClues.find(
            (c) => pPos.distanceTo(c.position) <= 3.5
          );
          if (found) {
            setInspectedClue(found);
            inspectedClueRef.current = found;
            ctx.player.setReadingNote(true);
            horrorAudio.playPaperRustle();
            exploredCluesRef.current.add(found.id);
            return;
          }
        }

        if (pPos.z <= -58.5) {
          const found = ctx.bungalowInterior.interiorClues.find(
            (c) => c.id !== 'CLUE_UPPER_BEDROOM_DIARY' && pPos.distanceTo(c.position) <= 3.2
          );
          if (found) {
            setInspectedClue(found);
            inspectedClueRef.current = found;
            ctx.player.setReadingNote(true);
            horrorAudio.playPaperRustle();
            exploredCluesRef.current.add(found.id);

            // Special horror triggers for specific clues
            if (found.id === 'CLUE_STORAGE_MIRROR') {
              ctx.bungalowInterior.triggerMirrorSilhouette();
            } else if (found.id === 'CLUE_UPPER_MUSIC_BOX') {
              horrorAudio.playMusicBox();
            } else if (found.id === 'CLUE_DINING_CLOCK') {
              ctx.bungalowInterior.isClockStopped = true;
              horrorAudio.stopGrandfatherClock();
            } else if (found.id === 'CLUE_UPPER_PORCELAIN_DOLL') {
              horrorAudio.playSubtleWhisper('BEHIND');
            }

            // Check if required ground floor clues were explored
            const groundExploredCount = GROUND_FLOOR_CLUE_IDS.filter((id) => exploredCluesRef.current.has(id)).length;
            if (
              groundExploredCount >= 3 &&
              curRitual.currentObjective !== 'SEARCH THE SECOND FLOOR' &&
              curRitual.currentObjective !== 'FIND OUT WHAT HAPPENED HERE'
            ) {
              setRitualState((prev) => ({ ...prev, currentObjective: 'SEARCH THE SECOND FLOOR' }));
              setObjectiveBanner({ title: 'OBJECTIVE UPDATED', subtitle: 'SEARCH THE SECOND FLOOR' });
              setTimeout(() => setObjectiveBanner(null), 5000);
            }
            return;
          }
        }
        setIsNoteOpen(true);
        isNoteOpenRef.current = true;
        setRitualState((prev) => ({ ...prev, noteRead: true }));
        ctx.player.setReadingNote(true);
        horrorAudio.playMenuHover();
        break;
      }
      case 'LAMP_1': {
        const cur = ritualStateRef.current;
        if (cur.lamp1Lit) return; // Strict guard: single activation only

        // Immediately update ref so even synchronous back-to-back events are ignored
        ritualStateRef.current = { ...cur, lamp1Lit: true };
        currentPromptTypeRef.current = null;
        activePromptRef.current = null;
        setActivePrompt(null);
        canInspectGateRef.current = false;
        setCanInspectGate(false);

        ctx.player.triggerHandGesture('LIGHT_LAMP', 1.8);
        horrorAudio.playLampSfx();
        horrorAudio.playLampIgnition();
        ctx.environment.lightLamp('LAMP_1');

        const willRevealLamp3 = cur.lamp2Lit && !cur.lamp3Revealed;
        setRitualState((prev) => ({ ...prev, lamp1Lit: true }));

        if (willRevealLamp3) {
          setTimeout(() => {
            ctx.environment.spawnLamp3();
            horrorAudio.playLampSpawn();
            ritualStateRef.current = {
              ...ritualStateRef.current,
              lamp3Revealed: true,
              currentObjective: 'ACTIVATE THE THIRD LAMP BESIDE THE MAIN GATE',
            };
            setRitualState((p) => ({
              ...p,
              lamp3Revealed: true,
              currentObjective: 'ACTIVATE THE THIRD LAMP BESIDE THE MAIN GATE',
            }));
            setObjectiveBanner({
              title: 'A THIRD LAMP HAS APPEARED',
              subtitle: 'LOCATED BESIDE THE MAIN BUNGALOW GATE',
            });
            setTimeout(() => setObjectiveBanner(null), 5000);
          }, 1000);
        } else if (!cur.lamp2Lit) {
          setObjectiveBanner({
            title: 'FIRST LAMP LIT (1/3)',
            subtitle: 'FIND THE SECOND LAMP AT THE DEAD TREE AREA',
          });
          setTimeout(() => setObjectiveBanner(null), 4000);
        }

        setTimeout(() => horrorAudio.playDistantOldBell(), 600);
        break;
      }
      case 'LAMP_2': {
        const cur = ritualStateRef.current;
        if (cur.lamp2Lit) return; // Strict guard: single activation only

        ritualStateRef.current = { ...cur, lamp2Lit: true };
        currentPromptTypeRef.current = null;
        activePromptRef.current = null;
        setActivePrompt(null);
        canInspectGateRef.current = false;
        setCanInspectGate(false);

        ctx.player.triggerHandGesture('LIGHT_LAMP', 1.8);
        horrorAudio.playLampSfx();
        horrorAudio.playLampIgnition();
        ctx.environment.lightLamp('LAMP_2');
        ctx.environment.triggerBungalowWindowFlicker();

        const willRevealLamp3 = cur.lamp1Lit && !cur.lamp3Revealed;
        setRitualState((prev) => ({ ...prev, lamp2Lit: true }));

        if (willRevealLamp3) {
          setTimeout(() => {
            ctx.environment.spawnLamp3();
            horrorAudio.playLampSpawn();
            ritualStateRef.current = {
              ...ritualStateRef.current,
              lamp3Revealed: true,
              currentObjective: 'ACTIVATE THE THIRD LAMP BESIDE THE MAIN GATE',
            };
            setRitualState((p) => ({
              ...p,
              lamp3Revealed: true,
              currentObjective: 'ACTIVATE THE THIRD LAMP BESIDE THE MAIN GATE',
            }));
            setObjectiveBanner({
              title: 'A THIRD LAMP HAS APPEARED',
              subtitle: 'LOCATED BESIDE THE MAIN BUNGALOW GATE',
            });
            setTimeout(() => setObjectiveBanner(null), 5000);
          }, 1000);
        } else if (!cur.lamp1Lit) {
          setObjectiveBanner({
            title: 'SECOND LAMP LIT (1/3)',
            subtitle: 'FIND THE OTHER LAMP AT THE BROKEN GARDEN SHRINE',
          });
          setTimeout(() => setObjectiveBanner(null), 4000);
        }

        setTimeout(() => horrorAudio.playBungalowWindowCreak(), 500);
        break;
      }
      case 'LAMP_3': {
        const cur = ritualStateRef.current;
        if (cur.lamp3Lit) return; // Strict guard: single activation only

        ritualStateRef.current = { ...cur, lamp3Lit: true };
        currentPromptTypeRef.current = null;
        activePromptRef.current = null;
        setActivePrompt(null);
        canInspectGateRef.current = false;
        setCanInspectGate(false);

        ctx.player.triggerHandGesture('LIGHT_LAMP', 1.8);
        horrorAudio.playLampSfx();
        horrorAudio.playLampIgnition();
        ctx.environment.lightLamp('LAMP_3');
        setRitualState((prev) => ({ ...prev, lamp3Lit: true }));
        horrorAudio.setPsychologicalSilence(true, 1.4);
        setTimeout(() => {
          horrorAudio.playRitualGateReaction();
          horrorAudio.playHammerPickup();
          ctx.player.hasHammer = true;
          ctx.player.triggerHandGesture('PICKUP_HAMMER', 1.4);
          ritualStateRef.current = {
            ...ritualStateRef.current,
            hasHammer: true,
            hammerFound: true,
            hammerCollected: true,
            currentObjective: 'PROCEED TO THE MAIN GATE & BREAK THE CHAINS WITH THE HAMMER',
          };
          setRitualState((prev) => ({
            ...prev,
            hasHammer: true,
            hammerFound: true,
            hammerCollected: true,
            currentObjective: 'PROCEED TO THE MAIN GATE & BREAK THE CHAINS WITH THE HAMMER',
          }));
          setObjectiveBanner({
            title: 'HAMMER OBTAINED',
            subtitle: 'TAKE THE HAMMER TO THE MAIN GATE',
          });
          setTimeout(() => setObjectiveBanner(null), 5000);
          horrorAudio.setPsychologicalSilence(false);
        }, 1400);
        break;
      }
      case 'GATE_KEY':
      case 'HAMMER_PICKUP': {
        ctx.player.triggerHandGesture('PICKUP_HAMMER', 1.4);
        ctx.player.hasHammer = true;
        ctx.environment.collectHammer();
        horrorAudio.playHammerPickup();
        setRitualState((prev) => ({
          ...prev,
          hammerFound: true,
          hasHammer: true,
          hammerCollected: true,
          currentObjective: 'PROCEED TO THE MAIN GATE & BREAK THE CHAINS WITH THE HAMMER',
        }));
        setCollectedItems((prev) => {
          if (prev.some((item) => item.id === 'ITEM_IRON_HAMMER')) return prev;
          return [
            ...prev,
            {
              id: 'ITEM_IRON_HAMMER',
              name: 'Heavy Forged Hammer',
              category: 'TOOL',
              description: 'A massive antique iron hammer found resting beside the ritual gate shrine. Its scarred head bears signs of heavy strikes.',
              details: 'Used to smash the padlocked chains of the main gate and breach the barred entrance doors.',
              iconType: 'hammer',
              quantity: 1,
              acquiredAt: 'Main Entrance Shrine',
            },
          ];
        });
        setObjectiveBanner({
          title: 'HAMMER OBTAINED',
          subtitle: 'TAKE THE HAMMER TO THE MAIN GATE',
        });
        setTimeout(() => setObjectiveBanner(null), 5000);
        break;
      }
      case 'GATE_CHAIN':
      case 'BUNGALOW_DOOR_HIT': {
        const cur = ritualStateRef.current;
        if (cur.gateOpened || cur.gateUnlocked || cur.gateOpening || cur.gateFullyOpen || cur.bungalowDoorOpen) {
          return;
        }
        if (!cur.hasHammer) {
          horrorAudio.playGateChainRattle(0.7);
          const lampsCount = (cur.lamp1Lit ? 1 : 0) + (cur.lamp2Lit ? 1 : 0) + (cur.lamp3Lit ? 1 : 0);
          setObjectiveBanner({
            title: 'ENTRANCE IS CHAINED SHUT',
            subtitle: `LOCKED WITH A HEAVY PADLOCK (${lampsCount}/3 LAMPS LIT). COMPLETE THE 3-LAMP PUZZLE TO OBTAIN A TOOL.`,
          });
          setTimeout(() => setObjectiveBanner(null), 4000);
          return;
        }
        executeGateStrike(ctx);
        break;
      }
      case 'BUNGALOW_DOOR_ENTER': {
        const cur = ritualStateRef.current;
        if (cur.gateOpened || cur.bungalowDoorOpen) return;
        if (cur.hasHammer) {
          executeGateStrike(ctx);
        } else {
          horrorAudio.playWallCreak(0.6);
          setObjectiveBanner({
            title: 'DOOR IS LOCKED',
            subtitle: 'FIND THE HEAVY HAMMER TO BREAK THE LOCK',
          });
          setTimeout(() => setObjectiveBanner(null), 3500);
        }
        break;
      }
      case 'BUNGALOW_DOOR_INSPECT': {
        setRitualState((prev) => ({
          ...prev,
          bungalowDoorInspected: true,
          currentObjective: 'FIND THE HAMMER TO BREAK THE LOCK',
        }));
        horrorAudio.playMenuHover();
        break;
      }
      case 'PUZZLE_TABLE_PLACE': {
        const curPuzzleState = ctx.puzzleSystem.state;
        const unplaced = curPuzzleState.collectedItems.find(
          (type) => !curPuzzleState.placedItems.includes(type)
        );
        if (unplaced) {
          if (isPlacingItemRef.current) return;
          isPlacingItemRef.current = true;

          // 1. Natural first-person hand placement animation (0.85s duration)
          // Hand moves forward toward table holding the item, lowers it onto table surface, and retracts
          // NO lamp lighter / flame / glow animation!
          ctx.player.triggerHandGesture('PLACE_ITEM', 0.85, unplaced);

          // 2. Clear prompt during placement animation
          currentPromptTypeRef.current = null;
          activePromptRef.current = null;
          setActivePrompt(null);

          // 3. Transfer item from carried inventory to table's placed-items state immediately!
          // Defer mesh visibility until 470ms when hand contacts tabletop
          ctx.puzzleSystem.placeItemOnTable(unplaced, true);

          // 4. Remove item from player's carried inventory immediately so HUD count updates immediately!
          setCollectedItems((prev) => prev.filter((item) => item.id !== `PUZZLE_ITEM_${unplaced}`));
          setPuzzleState({ ...ctx.puzzleSystem.state });

          // 5. At 470ms (~55% into gesture), the hand lowers the item onto the tabletop:
          // The 3D item becomes visible resting on the table surface and released from hand
          setTimeout(() => {
            ctx.puzzleSystem.revealPlacedItemMesh(unplaced);
          }, 470);

          setTimeout(() => {
            isPlacingItemRef.current = false;
          }, 880);
        } else if (ctx.puzzleSystem.state.secretDoorUnlocked) {
          horrorAudio.playMenuHover();
          setObjectiveBanner({
            title: 'CONCEALED PASSAGE UNSEALED',
            subtitle: 'THE WALL HAS SHIFTED — ENTER THE OCCULT CHAMBER',
          });
          setTimeout(() => setObjectiveBanner(null), 4000);
        } else {
          horrorAudio.playMenuHover();
          const nextType = ctx.puzzleSystem.state.currentObjectiveItem;
          const nextCfg = PUZZLE_ITEMS_CONFIG.find((c) => c.type === nextType);
          setObjectiveBanner({
            title: 'MORE BELONGINGS REQUIRED',
            subtitle: nextCfg
              ? `SEARCH ${nextCfg.roomName.toUpperCase()} FOR THE ${nextCfg.name.toUpperCase()}`
              : 'SEARCH THE BUNGALOW FOR REMAINING BELONGINGS',
          });
          setTimeout(() => setObjectiveBanner(null), 4500);
        }
        break;
      }
      case 'PUZZLE_BLACKBOARD_READ': {
        setIsBlackboardOpen(true);
        isBlackboardOpenRef.current = true;
        ctx.player.setReadingNote(true);
        horrorAudio.playPaperRustle();
        break;
      }
      case 'SECRET_DOOR_LOCKED': {
        horrorAudio.playSubtleWhisper('DISTANT');
        setObjectiveBanner({
          title: 'CONCEALED WALL MECHANISM',
          subtitle: 'A HEAVY WOODEN PANEL BENEATH THE STAIRCASE — TIED TO THE 5 BELONGINGS ON THE BLACKBOARD',
        });
        setTimeout(() => setObjectiveBanner(null), 4500);
        break;
      }
      case 'SECRET_DOOR_ENTER': {
        if (!ctx.puzzleSystem.state.secretDoorOpened) {
          ctx.puzzleSystem.openSecretDoor();
        } else {
          horrorAudio.playSubtleWhisper('BEHIND');
          setObjectiveBanner({
            title: 'OCCULT SECRET PASSAGE',
            subtitle: 'EXPLORE THE SUBTERRANEAN PASSAGE BENEATH THE STAIRCASE',
          });
          setTimeout(() => setObjectiveBanner(null), 4000);
        }
        break;
      }
    }
  }, [executeGateStrike]);

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
    horrorAudio.resetAllRoomSounds();
    horrorAudio.playCinematicTransition();
    horrorAudio.playStartingHorrorSound();
    horrorAudio.startMainBgm();
    horrorAudio.setMode('GAMEPLAY');
    setSettings((prev) => ({ ...prev, flashlightEnabled: false }));

    hasTriggeredGateToBungalowSoundRef.current = false;
    hasTriggeredHauntedWomanScareRef.current = false;
    cleanupHauntedWoman();

    setTimeout(() => {
      setGameState('PLAYING');
      if (contextRef.current) {
        contextRef.current.player.resetPosition();
        contextRef.current.player.setFlashlight(false);
        contextRef.current.player.setMenuMode(false);
        contextRef.current.bungalowInterior.resetKitchenState();
        contextRef.current.bungalowInterior.resetBathroomState();
        contextRef.current.bungalowInterior.resetStoreRoomState();
        contextRef.current.bungalowInterior.resetTvRoomState();
        contextRef.current.bungalowInterior.resetHallState();
      }
      setIsTransitionFading(false);
    }, 900);
  }, [cleanupHauntedWoman]);

  const handleReturnToMenu = useCallback(() => {
    setIsTransitionFading(true);
    hasTriggeredGateToBungalowSoundRef.current = false;
    hasTriggeredHauntedWomanScareRef.current = false;
    cleanupHauntedWoman();
    horrorAudio.resetAllRoomSounds();
    horrorAudio.stopMainBgm();
    horrorAudio.setMode('MENU');
    setTimeout(() => {
      setGameState('MAIN_MENU');
      if (contextRef.current) {
        contextRef.current.player.setMenuMode(true);
        contextRef.current.bungalowInterior.resetKitchenState();
        contextRef.current.bungalowInterior.resetBathroomState();
        contextRef.current.bungalowInterior.resetStoreRoomState();
        contextRef.current.bungalowInterior.resetTvRoomState();
        contextRef.current.bungalowInterior.resetHallState();
      }
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

  const handleUpdateSettings = useCallback((newVals: Partial<GameSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newVals };
      saveSettingsToStorage(updated);
      if (newVals.musicVolume !== undefined) {
        horrorAudio.setMusicVolume(newVals.musicVolume);
      }
      if (newVals.sfxVolume !== undefined) {
        horrorAudio.setSfxVolume(newVals.sfxVolume);
      }
      return updated;
    });
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black font-serif text-stone-200">
      {/* 3D WebGL Canvas Viewport */}
      <div
        id="horror-canvas-container"
        ref={containerRef}
        className="absolute inset-0 w-full h-full cursor-default z-0 touch-none select-none"
      />

      {/* Cinematic Fog, Grain, Vignette & Lightning Overlay */}
      <CinematicOverlay
        isFading={isTransitionFading}
        lightningActive={lightningActive}
        introBlackOpacity={introBlackOpacity}
        isIntroActive={isIntroActive}
        houseProximityFactor={houseProximity}
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
          onUpdateSettings={handleUpdateSettings}
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

      {/* 4b. Interior Object Inspect Modal (Minimal layout, max 10 words) */}
      {inspectedClue && (
        <div
          id="interior-clue-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-[3px] p-4 select-none animate-fade-in pointer-events-auto"
          onClick={() => {
            setInspectedClue(null);
            inspectedClueRef.current = null;
            contextRef.current?.player.setReadingNote(false);
          }}
        >
          <div
            className="w-full max-w-sm bg-[#12100d] border border-[#4a3928] shadow-[0_0_50px_rgba(0,0,0,0.95)] p-6 text-center text-stone-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-mono tracking-[0.2em] text-amber-200 uppercase font-bold mb-3">
              {inspectedClue.name}
            </h2>
            <p className="font-serif text-sm leading-relaxed text-stone-300 mb-6">
              {inspectedClue.description}
            </p>
            <div className="text-[11px] font-mono tracking-widest text-stone-500 uppercase">
              [E / ESC] CLOSE
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
            onOpenInventory={() => {
              setIsInventoryOpen((prev) => {
                const next = !prev;
                isInventoryOpenRef.current = next;
                return next;
              });
            }}
            carriedItemsCount={
              puzzleState.carriedItems
                ? puzzleState.carriedItems.length
                : puzzleState.collectedItems.filter((t) => !puzzleState.placedItems.includes(t)).length
            }
            puzzleCollectedCount={
              puzzleState.carriedItems
                ? puzzleState.carriedItems.length
                : puzzleState.collectedItems.filter((t) => !puzzleState.placedItems.includes(t)).length
            }
            basementPuzzleState={basementPuzzleState}
            isBasementActive={isBasementActive}
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
              onOpenInventory={() => {
                setIsInventoryOpen((prev) => {
                  const next = !prev;
                  isInventoryOpenRef.current = next;
                  return next;
                });
              }}
            />
          </div>

          {/* 7b. Satchel / Inventory Overlay Modal */}
          <InventoryModal
            isOpen={isInventoryOpen}
            onClose={() => {
              setIsInventoryOpen(false);
              isInventoryOpenRef.current = false;
            }}
            items={collectedItems}
            placedCount={puzzleState.placedItems.length}
            batteryCount={batteryCount}
            flashlightOn={settings.flashlightEnabled}
            onToggleFlashlight={toggleFlashlight}
          />

          {/* 7c. Five Lost Belongings Blackboard Modal */}
          <BlackboardModal
            isOpen={isBlackboardOpen}
            onClose={() => {
              setIsBlackboardOpen(false);
              isBlackboardOpenRef.current = false;
              if (contextRef.current) {
                contextRef.current.player.setReadingNote(false);
              }
            }}
            puzzleState={puzzleState}
          />
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
          interactionDebug={contextRef.current?.interactionManager.debugInfo}
        />
      )}
    </main>
  );
}
