import { GameSettings, RitualState } from '../types';

export const GAME_TITLE = 'The House of Devil';
export const GAME_SUBTITLE = 'A Psychological Horror Experience';

export const DEFAULT_SETTINGS: GameSettings = {
  masterVolume: 0.85,
  musicVolume: 0.75,
  sfxVolume: 0.9,
  fullscreen: false,
  graphicsQuality: 'high',
  cameraSensitivity: 1.0,
  flashlightEnabled: true,
  showPerformanceHud: false,
  autoQuality: true,
};

export const INITIAL_RITUAL_STATE: RitualState = {
  gatePhase: 'GATE_CLOSED',
  gateHits: 0,
  noteRead: false,
  lamp1Lit: false,
  lamp2Lit: false,
  lamp3Revealed: false,
  lamp3Lit: false,
  ritualComplete: false,
  hammerRevealed: false,
  hammerCollected: false,
  keyRevealed: false,
  keyCollected: false,
  hasKey: false,
  hasBatteries: false,
  batteryCount: 0,
  batteriesCollected: false,
  gateUnlocked: false,
  gateOpening: false,
  gateFullyOpen: false,
  gateOpen: false,
  gateOpened: false,
  requiredHammerHits: 3,
  hauntedPassageEntered: false,
  storyModeTriggered: false,
  storyModeActive: false,
  storyModeCompleted: false,
  bungalowRevealed: false,
  bungalowDoorInspected: false,
  hammerFound: false,
  hasHammer: false,
  bungalowDoorHits: 0,
  bungalowDoorOpening: false,
  bungalowDoorOpen: false,
  currentObjective: 'Investigate the iron gate chain.',
};

export const HORROR_FALLBACK_WHISPERS: Record<string, string[]> = {
  gate: [
    'The chains remember whose hands fastened them in the winter of 1952.',
    'Two flames have burned down. The third sleeps in cold stone.',
    'Turn back before the hinges scream.',
  ],
  exterior: [
    'The mud will swallow the footsteps you leave behind.',
    'She was never allowed past the colonial balustrade.',
    'Look into the trees... something matches your stride.',
  ],
  bungalow: [
    'The clock stopped at 3:17 for a reason.',
    'Do not look directly into the vanity mirror upstairs.',
    'She waits at the top of the grand stairs.',
  ],
};
