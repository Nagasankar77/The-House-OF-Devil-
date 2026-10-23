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
  | 'RUSTY_KEY_PICKUP'
  | 'BATTERY_PICKUP'
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
  | 'PUZZLE_ITEM_PICKUP'
  | 'PUZZLE_TABLE_PLACE'
  | 'PUZZLE_BLACKBOARD_READ'
  | 'SECRET_DOOR_ENTER'
  | 'SECRET_DOOR_LOCKED'
  | 'BASEMENT_PUJA_JUG_PICKUP'
  | 'BASEMENT_BROKEN_BONE_PICKUP'
  | 'BASEMENT_SKULL_BONE_PICKUP'
  | 'BASEMENT_STATION_PLACE'
  | 'BASEMENT_KEY_PICKUP'
  | 'BASEMENT_STAR_DOOR_UNLOCK'
  | null;

export type PuzzleItemType = 'DIARY' | 'WATCH' | 'PINK_FLOWER' | 'BAG' | 'SPECTACLES';

export type BasementItemType = 'PUJA_JUG' | 'HALF_BROKEN_BONE' | 'SKULL_BONE';

export interface BasementPuzzleState {
  pujaJugCollected: boolean;
  brokenBoneCollected: boolean;
  skullBoneCollected: boolean;
  pujaJugPlaced: boolean;
  brokenBonePlaced: boolean;
  skullBonePlaced: boolean;
  basementKeySpawned: boolean;
  hasBasementRoomKey: boolean;
  starDoorUnlocked: boolean;
  starDoorOpening: boolean;
  starDoorOpened: boolean;
}

export interface FiveItemPuzzleState {
  currentObjectiveItem: PuzzleItemType | null; // null when all collected
  collectedItems: PuzzleItemType[]; // Total items ever collected (progression tracking)
  placedItems: PuzzleItemType[]; // Items successfully placed on the central table
  carriedItems: PuzzleItemType[]; // Items currently held in player's carried inventory
  secretDoorUnlocked: boolean;
  secretDoorOpenProgress: number; // 0 to 1
  secretDoorOpened: boolean;
}

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
  puzzleItemId?: PuzzleItemType;
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

export interface InventoryItem {
  id: string;
  name: string;
  category: 'KEY' | 'SUPPLY' | 'TOOL' | 'DOCUMENT' | 'RELIC';
  description: string;
  details?: string;
  iconType: 'key' | 'battery' | 'hammer' | 'note' | 'lighter' | 'diary' | 'watch' | 'flower' | 'bag' | 'spectacles' | 'puja_jug' | 'broken_bone' | 'skull_bone' | 'star_key';
  quantity?: number;
  acquiredAt?: string;
  placedOnTable?: boolean;
}

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
  hasBatteries?: boolean;
  batteryCount?: number;
  batteriesCollected?: boolean;
  gateUnlocked: boolean;
  gateOpening: boolean;
  gateFullyOpen: boolean;
  gateOpen?: boolean;
  gateOpened?: boolean;
  requiredHammerHits?: number;
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
  fiveItemPuzzleState?: FiveItemPuzzleState;
}

export interface LightningEvent {
  intensity: number;
  duration: number;
}

export interface HorrorLoreRequest {
  context?: 'exterior' | 'gate' | 'bungalow' | string;
}

export interface HorrorLoreResponse {
  whisper: string;
  source: 'ai' | 'procedural';
  error?: string;
}

export interface HealthResponse {
  status: 'ok' | 'error';
  game: string;
  timestamp: string;
  uptime: number;
  hasAiSupport: boolean;
}
