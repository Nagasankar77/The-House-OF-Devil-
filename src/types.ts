export type GameState = 'OPENING' | 'TRANSITION' | 'MAIN_MENU' | 'PLAYING' | 'SETTINGS';

export type SurfaceType = 'GRAVEL' | 'LEAVES' | 'WOOD' | 'STONE';

export interface GameSettings {
  masterVolume: number; // 0 to 1
  musicVolume: number;  // 0 to 1 (ambience)
  sfxVolume: number;    // 0 to 1
  fullscreen: boolean;
  graphicsQuality: 'high' | 'medium' | 'low';
  cameraSensitivity: number;
  flashlightEnabled: boolean;
  showPerformanceHud?: boolean;
  autoQuality?: boolean;
}

export interface PerformanceStats {
  fps: number;
  frameTime: number;
  drawCalls: number;
  triangles: number;
  textures: number;
  quality: 'high' | 'medium' | 'low';
}

export interface PlayerControls {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  run: boolean;
}

export interface GateState {
  distanceToGate: number;
  canInspect: boolean;
  isInspecting: boolean;
  creakIntensity: number;
  message?: string;
}

export type InteractionType =
  | 'NOTE'
  | 'GATE_NOTE'
  | 'LAMP_1'
  | 'LAMP_2'
  | 'LAMP_3'
  | 'GATE_KEY'
  | 'IRON_KEY'
  | 'GATE_CHAIN'
  | 'GATE_LOCK'
  | 'GATE_INSPECT'
  | 'POSTER_1'
  | 'POSTER_2'
  | 'POSTER_3'
  | 'POSTER_4'
  | 'POSTER_5'
  | 'BUNGALOW_DOOR_INSPECT'
  | 'HAMMER_PICKUP'
  | 'BUNGALOW_DOOR_HIT'
  | 'BUNGALOW_DOOR_ENTER'
  | null;

export interface StoryPoster {
  id: string;
  type: 'POSTER_1' | 'POSTER_2' | 'POSTER_3' | 'POSTER_4' | 'POSTER_5';
  title: string;
  subtitle?: string;
  date?: string;
  body: string[];
  handwrittenNote?: string;
  hasPhoto?: boolean;
  photoCaption?: string;
  discovered?: boolean;
}

export interface InteractionPrompt {
  type: InteractionType;
  promptText: string;
  label?: string;
  subText?: string;
  subtext?: string;
  distance: number;
  posterId?: string;
}

export type GatePhase =
  | 'GATE_CLOSED'
  | 'HIT_1'
  | 'HIT_2'
  | 'HIT_3'
  | 'GHOST_EVENT'
  | 'UNLOCKING'
  | 'OPENING'
  | 'GATE_OPEN';

export interface RitualState {
  gatePhase?: GatePhase;
  gateHits?: number;
  noteRead: boolean;
  lamp1Lit: boolean;
  lamp2Lit: boolean;
  lamp3Revealed: boolean;
  lamp3Lit: boolean;
  ritualComplete?: boolean;
  hammerRevealed?: boolean;
  hammerCollected?: boolean;
  keyRevealed?: boolean;
  keyCollected?: boolean;
  hasKey?: boolean;
  gateUnlocked: boolean;
  gateOpening: boolean;
  gateFullyOpen: boolean;
  gateOpen?: boolean;
  hauntedPassageEntered?: boolean;
  storyModeTriggered?: boolean;
  storyModeActive?: boolean;
  storyModeCompleted?: boolean;
  bungalowRevealed?: boolean;
  bungalowDoorInspected?: boolean;
  hammerFound?: boolean;
  hasHammer?: boolean;
  bungalowDoorHits?: number;
  bungalowDoorOpening?: boolean;
  bungalowDoorOpen?: boolean;
  currentObjective?: string;
}

export interface LightningEvent {
  intensity: number;
  duration: number;
}
