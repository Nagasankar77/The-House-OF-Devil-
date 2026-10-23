import React, { useState, useEffect } from 'react';
import { horrorAudio } from '../../game/audio/HorrorAudioManager';
import { InteractionPrompt, RitualState, BasementPuzzleState } from '../../../shared/types';

interface GameHUDProps {
  canInspectGate: boolean;
  distanceToGate: number;
  flashlightOn: boolean;
  onToggleFlashlight: () => void;
  onReturnToMenu: () => void;
  onShakeGate: () => void;
  isInspecting?: boolean;
  onOpenInspect?: () => void;
  onCloseInspect?: () => void;
  activePrompt?: InteractionPrompt | null;
  ritualState?: RitualState;
  isNoteOpen?: boolean;
  onTriggerInteraction?: () => void;
  onCloseNote?: () => void;
  onOpenInventory?: () => void;
  puzzleCollectedCount?: number;
  inventoryCount?: number;
  carriedItemsCount?: number;
  basementPuzzleState?: BasementPuzzleState;
  isBasementActive?: boolean;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  flashlightOn,
  onToggleFlashlight,
  onShakeGate,
  isInspecting,
  onOpenInspect,
  onCloseInspect,
  activePrompt,
  ritualState,
  isNoteOpen = false,
  onTriggerInteraction,
  onCloseNote,
  onOpenInventory,
  puzzleCollectedCount,
  inventoryCount,
  carriedItemsCount,
  basementPuzzleState,
  isBasementActive = false,
}) => {
  const displayCount =
    carriedItemsCount !== undefined
      ? carriedItemsCount
      : puzzleCollectedCount !== undefined
      ? puzzleCollectedCount
      : (inventoryCount ?? 0);
  const [internalInspectOpen, setInternalInspectOpen] = useState(false);

  const inspectModalOpen = isInspecting !== undefined ? isInspecting : internalInspectOpen;

  const closeInspection = () => {
    if (onCloseInspect) {
      onCloseInspect();
    } else {
      setInternalInspectOpen(false);
    }
  };

  const handleInteractionTrigger = () => {
    if (isNoteOpen && onCloseNote) {
      onCloseNote();
      return;
    }
    if (inspectModalOpen) {
      closeInspection();
      return;
    }
    if (onTriggerInteraction) {
      onTriggerInteraction();
    }
  };

  // Listen only for modal dismissals to avoid duplicate execution of 'E'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isNoteOpen && onCloseNote) {
          e.preventDefault();
          e.stopPropagation();
          onCloseNote();
        } else if (inspectModalOpen) {
          e.preventDefault();
          e.stopPropagation();
          closeInspection();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inspectModalOpen, isNoteOpen, onCloseNote]);

  return (
    <div
      id="game-hud"
      className="fixed inset-0 z-30 pointer-events-none select-none flex flex-col justify-between p-4 sm:p-6"
    >
      {/* Top Left: Basement Ritual Indicator when in Basement */}
      {isBasementActive && basementPuzzleState && (
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-40 pointer-events-auto">
          <div className="flex items-center space-x-2.5 px-3.5 py-2 bg-black/90 border border-[#6b1310] rounded shadow-[0_0_24px_rgba(5,5,10,0.95)] text-stone-200">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                basementPuzzleState.starDoorUnlocked
                  ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
                  : basementPuzzleState.pujaJugPlaced && basementPuzzleState.brokenBonePlaced && basementPuzzleState.skullBonePlaced
                  ? 'bg-amber-500 shadow-[0_0_8px_#d97706] animate-pulse'
                  : 'bg-[#860111] animate-pulse'
              }`}
            />
            <div className="flex flex-col">
              <span className="font-mono text-xs tracking-wider uppercase font-bold text-stone-100">
                {basementPuzzleState.starDoorUnlocked
                  ? 'STAR DOOR UNLOCKED'
                  : basementPuzzleState.pujaJugPlaced && basementPuzzleState.brokenBonePlaced && basementPuzzleState.skullBonePlaced
                  ? 'RITUAL COMPLETE — KEY REVEALED'
                  : `BASEMENT RITUAL: ${(basementPuzzleState.pujaJugPlaced ? 1 : 0) + (basementPuzzleState.brokenBonePlaced ? 1 : 0) + (basementPuzzleState.skullBonePlaced ? 1 : 0)}/3`}
              </span>
              {!basementPuzzleState.starDoorUnlocked && !(basementPuzzleState.pujaJugPlaced && basementPuzzleState.brokenBonePlaced && basementPuzzleState.skullBonePlaced) && (
                <span className="text-[10px] font-mono text-stone-400 tracking-wide">
                  Place 3 relics on the pedestal
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top Right: Persistent Visible Inventory Icon */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-40 pointer-events-auto">
        <button
          type="button"
          onClick={() => {
            if (onOpenInventory) onOpenInventory();
          }}
          className="flex items-center space-x-2.5 px-3.5 py-2 bg-black/85 hover:bg-[#1a1410] border border-amber-900/60 hover:border-amber-500/80 rounded shadow-[0_0_20px_rgba(0,0,0,0.85)] text-stone-200 hover:text-amber-200 transition-all cursor-pointer group active:scale-95"
          title="Open Inventory [TAB]"
        >
          {/* Bag Icon */}
          <div className="w-5 h-5 flex items-center justify-center text-amber-500 group-hover:text-amber-400">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
              <path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zm-9-1a2 2 0 0 1 4 0v1h-4V6zm10 14H4V9h16v11z" />
              <path d="M10 12h4v2h-4z" />
            </svg>
          </div>

          <div className="flex items-center space-x-2 font-mono">
            <span className="text-xs tracking-[0.2em] uppercase font-bold text-stone-200 group-hover:text-amber-100">
              INVENTORY
            </span>
            <span
              className={`px-2 py-0.5 border font-bold text-xs rounded transition-colors flex items-center space-x-1 ${
                displayCount === 0
                  ? 'bg-stone-900/85 border-stone-600/60 text-stone-400'
                  : 'bg-amber-950/70 border-amber-600/60 text-amber-300'
              }`}
            >
              <span>{displayCount}/5</span>
              {displayCount === 0 && (
                <span className="text-[10px] text-amber-400 font-semibold tracking-wider uppercase ml-0.5">
                  EMPTY
                </span>
              )}
            </span>
          </div>
        </button>
      </div>

      {/* Bottom Right: Compact Flashlight Indicator ([FLASHLIGHT ICON] F) */}
      <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 pointer-events-auto select-none">
        <button
          id="btn-hud-flashlight"
          type="button"
          onClick={() => {
            if (onToggleFlashlight) onToggleFlashlight();
          }}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded transition-all cursor-pointer backdrop-blur-[3px] border ${
            flashlightOn
              ? 'bg-black/85 border-amber-600/70 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.25)] hover:border-amber-400 active:scale-95'
              : 'bg-black/75 border-stone-800/80 text-stone-400 hover:border-stone-600 hover:text-stone-300 shadow-[0_0_10px_rgba(0,0,0,0.7)] active:scale-95'
          }`}
          title="Toggle Flashlight [F]"
          aria-label="Toggle Flashlight [F]"
        >
          {/* Flashlight Icon with active beam indicator */}
          <div className="relative w-4 h-4 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`w-3.5 h-3.5 transition-colors ${
                flashlightOn
                  ? 'text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.85)]'
                  : 'text-stone-500'
              }`}
            >
              <path d="M18 6l-3.5 3.5M6 18l3.5-3.5M2 22l4-4M15.5 8.5l-7 7M9.5 2.5l12 12-3.5 3.5-12-12z" />
            </svg>
            {flashlightOn && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b] animate-pulse" />
            )}
          </div>

          {/* Tiny F Key Label */}
          <span
            className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded border transition-colors ${
              flashlightOn
                ? 'bg-amber-950/70 border-amber-600/70 text-amber-300'
                : 'bg-stone-900/80 border-stone-700/60 text-stone-400'
            }`}
          >
            F
          </span>
        </button>
      </div>

      {/* Primary Interaction Prompt (Near center-bottom of screen with readable text & subtle dark background) */}
      {activePrompt && !inspectModalOpen && !isNoteOpen && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 pointer-events-auto text-center z-40 animate-fade-in select-none">
          <button
            id="btn-context-interaction"
            type="button"
            onClick={handleInteractionTrigger}
            className="px-6 py-2.5 bg-black/85 hover:bg-black/95 border border-stone-600/80 hover:border-amber-500/80 text-stone-100 text-sm tracking-[0.18em] font-mono uppercase rounded shadow-[0_4px_24px_rgba(0,0,0,0.85)] transition-all cursor-pointer hover:shadow-[0_0_20px_rgba(217,119,6,0.35)] active:scale-95 flex flex-col items-center justify-center group backdrop-blur-sm"
          >
            <div className="flex items-center space-x-2.5">
              <span className={`w-2 h-2 rounded-full ${activePrompt.type?.startsWith('LAMP') ? 'bg-amber-500' : 'bg-[#a31525]'} animate-pulse`} />
              <span className="font-semibold text-stone-100 group-hover:text-amber-200 transition-colors">
                {activePrompt.promptText}
              </span>
            </div>
            {activePrompt.subText && (
              <span className="text-[10px] tracking-widest text-stone-400 group-hover:text-stone-300 font-serif italic mt-0.5">
                — {activePrompt.subText} —
              </span>
            )}
          </button>
        </div>
      )}

      {/* Handwritten Gate Note Modal */}
      {isNoteOpen && (
        <div
          id="note-reading-modal"
          className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-[#05050a]/85 backdrop-blur-[4px] p-4 animate-fade-in"
        >
          <div className="w-full max-w-sm bg-[#0e080a] border-2 border-[#450f10] p-6 shadow-[0_0_90px_rgba(5,5,10,0.98)] relative text-center">
            <h3 className="text-xs font-mono tracking-[0.25em] text-[#7d1616] uppercase mb-4">
              Weathered Note
            </h3>

            <p className="font-serif text-sm sm:text-base italic text-stone-200 mb-6">
              &ldquo;Two flames burn. The third waits unseen.&rdquo;
            </p>

            <button
              id="btn-close-note"
              type="button"
              onClick={onCloseNote}
              className="px-5 py-1.5 border border-[#450f10] hover:border-[#800b19] bg-[#160a0d] text-stone-300 hover:text-stone-100 text-xs font-mono uppercase tracking-widest transition-colors cursor-pointer"
            >
              [E / ESC] Close
            </button>
          </div>
        </div>
      )}

      {/* Gate Inspection Modal */}
      {inspectModalOpen && (
        <div
          id="inspect-gate-modal"
          className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-[#05050a]/80 backdrop-blur-[3px] p-4"
        >
          <div className="w-full max-w-md bg-[#05050a]/95 border border-[#450f10]/80 p-6 shadow-[0_0_70px_rgba(5,5,10,0.98)] animate-fade-in relative text-center">
            <h3 className="font-serif text-base font-bold tracking-[0.2em] text-stone-200 uppercase mb-2">
              MAIN ENTRANCE GATE
            </h3>
            <p className="text-xs font-mono text-stone-400 mb-6">
              Chained shut with heavy rusted iron.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                id="btn-shake-gate"
                type="button"
                onClick={() => {
                  onShakeGate();
                  horrorAudio.playGateCreak(0.95);
                }}
                className="px-4 py-1.5 border border-[#800b19]/60 bg-[#800b19]/20 hover:bg-[#800b19]/40 text-stone-200 text-xs font-mono uppercase tracking-widest transition-colors cursor-pointer"
              >
                Rattle Chains
              </button>

              <button
                id="btn-close-inspect"
                type="button"
                onClick={closeInspection}
                className="px-4 py-1.5 border border-stone-800 hover:border-stone-600 text-stone-400 hover:text-stone-200 text-xs font-mono uppercase tracking-widest transition-colors cursor-pointer"
              >
                [ESC] Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
