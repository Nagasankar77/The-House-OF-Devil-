import React, { useState, useEffect } from 'react';
import { horrorAudio } from '../audio/HorrorAudioManager';
import { InteractionPrompt, RitualState } from '../types';

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
}

export const GameHUD: React.FC<GameHUDProps> = ({
  canInspectGate,
  distanceToGate,
  flashlightOn,
  onToggleFlashlight,
  onReturnToMenu,
  onShakeGate,
  isInspecting,
  onOpenInspect,
  onCloseInspect,
  activePrompt,
  ritualState,
  isNoteOpen = false,
  onTriggerInteraction,
  onCloseNote,
}) => {
  const [internalInspectOpen, setInternalInspectOpen] = useState(false);
  const [showControlsHint, setShowControlsHint] = useState(true);

  const inspectModalOpen = isInspecting !== undefined ? isInspecting : internalInspectOpen;

  // Fade out control hint after 14 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowControlsHint(false);
    }, 14000);
    return () => clearTimeout(timer);
  }, []);

  const openInspection = () => {
    if (onOpenInspect) {
      onOpenInspect();
    } else {
      setInternalInspectOpen(true);
      horrorAudio.playGateCreak(0.85);
    }
  };

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
    } else if (canInspectGate) {
      openInspection();
    }
  };

  // Listen for 'E', 'F', 'Escape' keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'e' || e.key === 'E') {
        if (isNoteOpen && onCloseNote) {
          onCloseNote();
        } else if (inspectModalOpen) {
          closeInspection();
        } else if (onTriggerInteraction) {
          onTriggerInteraction();
        } else if (canInspectGate) {
          openInspection();
        }
      }
      if (e.key === 'f' || e.key === 'F') {
        onToggleFlashlight();
        horrorAudio.playMenuHover();
      }
      if (e.key === 'Escape') {
        if (isNoteOpen && onCloseNote) {
          onCloseNote();
        } else if (inspectModalOpen) {
          closeInspection();
        } else {
          onReturnToMenu();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canInspectGate, inspectModalOpen, isNoteOpen, onToggleFlashlight, onReturnToMenu, onTriggerInteraction, onCloseNote]);

  // Compute number of lit lamps
  const litCount = (ritualState?.lamp1Lit ? 1 : 0) + (ritualState?.lamp2Lit ? 1 : 0) + (ritualState?.lamp3Lit ? 1 : 0);

  return (
    <div
      id="game-hud"
      className="fixed inset-0 z-30 pointer-events-none select-none flex flex-col justify-between p-4 sm:p-6"
    >
      {/* Top HUD Bar: minimal, cinematic, horror-themed */}
      <div className="flex flex-wrap items-center justify-between gap-3 pointer-events-auto bg-black/50 backdrop-blur-[2px] border-b border-stone-900/80 px-4 py-2.5 max-w-4xl mx-auto w-full">
        <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-stone-400 text-xs font-mono tracking-widest">
          <span className="flex items-center space-x-1.5 text-stone-200 font-medium">
            <span className={`inline-block w-2 h-2 rounded-full ${ritualState?.bungalowRevealed ? 'bg-amber-500' : ritualState?.hauntedPassageEntered ? 'bg-amber-600' : 'bg-red-700'} animate-pulse`} />
            <span>
              {ritualState?.bungalowRevealed
                ? '● BUNGALOW APPROACH'
                : ritualState?.hauntedPassageEntered
                ? '● THE HAUNTED PASSAGE'
                : '● OUTER GROUNDS'}
            </span>
          </span>

          <span className="text-stone-400 font-mono">
            GATE: {Math.max(0, Math.round(distanceToGate))}m
          </span>

          {/* 3-Lamp Ritual Progress Indicator */}
          <div className="flex items-center space-x-2 text-[11px] font-mono border-l border-stone-800/80 pl-3">
            <span className="text-stone-400">RITUAL:</span>
            <div className="flex items-center space-x-1.5">
              {/* Lamp 1 */}
              <span
                title="Broken Garden Shrine Lamp"
                className={`inline-block w-2.5 h-2.5 rounded-full border transition-all ${
                  ritualState?.lamp1Lit
                    ? 'bg-amber-500 border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                    : 'bg-stone-950 border-stone-700'
                }`}
              />
              {/* Lamp 2 */}
              <span
                title="Dead Tree Area Lamp"
                className={`inline-block w-2.5 h-2.5 rounded-full border transition-all ${
                  ritualState?.lamp2Lit
                    ? 'bg-amber-500 border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                    : 'bg-stone-950 border-stone-700'
                }`}
              />
              {/* Lamp 3 */}
              <span
                title="Hidden Stone Alcove Lamp"
                className={`inline-block w-2.5 h-2.5 rounded-full border transition-all ${
                  ritualState?.lamp3Lit
                    ? 'bg-amber-500 border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                    : ritualState?.lamp3Revealed
                    ? 'bg-amber-950 border-amber-600 animate-pulse'
                    : 'bg-stone-950 border-stone-800 opacity-40'
                }`}
              />
            </div>
            <span className={`text-[10px] ${litCount === 3 ? 'text-amber-400 font-bold' : 'text-stone-500'}`}>
              {litCount}/3
            </span>

            {/* Key Status */}
            {ritualState?.keyCollected && !ritualState?.gateUnlocked && (
              <span className="text-[10px] text-amber-300 font-bold border-l border-stone-800 pl-2 animate-pulse">
                [KEY READY]
              </span>
            )}

            {ritualState?.bungalowDoorOpen ? (
              <span className="text-[10px] text-red-500 font-bold border-l border-stone-800 pl-2 animate-pulse">
                [DOOR BREACHED]
              </span>
            ) : ritualState?.hasHammer ? (
              <span className="text-[10px] text-amber-300 font-bold border-l border-stone-800 pl-2">
                [HAMMER EQUIPPED - {ritualState.bungalowDoorHits || 0}/3 HITS]
              </span>
            ) : ritualState?.bungalowRevealed ? (
              <span className="text-[10px] text-amber-400 font-bold border-l border-stone-800 pl-2 animate-pulse">
                [BUNGALOW LOCATED]
              </span>
            ) : ritualState?.storyModeCompleted ? (
              <span className="text-[10px] text-amber-300 font-bold border-l border-stone-800 pl-2 animate-pulse">
                [FIND YAMINI]
              </span>
            ) : ritualState?.hauntedPassageEntered ? (
              <span className="text-[10px] text-stone-300 font-bold border-l border-stone-800 pl-2">
                [INVESTIGATE PASSAGE]
              </span>
            ) : ritualState?.gateUnlocked ? (
              <span className="text-[10px] text-emerald-400 font-bold border-l border-stone-800 pl-2">
                [GATE UNLOCKED]
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            id="btn-hud-flashlight"
            type="button"
            onClick={() => {
              onToggleFlashlight();
              horrorAudio.playMenuHover();
            }}
            className={`px-3 py-1.5 text-xs font-mono tracking-wider uppercase border transition-all cursor-pointer ${
              flashlightOn
                ? 'border-amber-600/70 bg-amber-950/30 text-amber-200 shadow-[0_0_10px_rgba(217,119,6,0.2)]'
                : 'border-stone-800 bg-stone-950/60 text-stone-500 hover:text-stone-300 hover:border-stone-700'
            }`}
          >
            ● [F] FLASHLIGHT
          </button>

          <button
            id="btn-hud-menu"
            type="button"
            onClick={() => {
              horrorAudio.playMenuSelect();
              onReturnToMenu();
            }}
            className="px-3 py-1.5 text-xs font-mono tracking-wider uppercase border border-stone-800 bg-stone-950/60 text-stone-400 hover:text-stone-200 hover:border-stone-600 transition-colors cursor-pointer"
          >
            ● [ESC] MENU
          </button>
        </div>
      </div>

      {/* Center Subtle Reticle */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-1.5 h-1.5 rounded-full bg-stone-400/35" />
      </div>

      {/* Primary Interaction Prompt (Contextual: Note, Lamp 1, Lamp 2, Lamp 3, Key, Gate) */}
      {activePrompt && !inspectModalOpen && !isNoteOpen && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-12 pointer-events-auto text-center animate-fade-in">
          <button
            id="btn-context-interaction"
            type="button"
            onClick={handleInteractionTrigger}
            className="px-6 py-2.5 bg-black/90 border border-stone-700 hover:border-amber-600 text-stone-100 text-xs tracking-[0.22em] font-mono uppercase shadow-[0_0_30px_rgba(0,0,0,0.95)] transition-all cursor-pointer hover:shadow-[0_0_20px_rgba(217,119,6,0.3)] active:scale-95 flex flex-col items-center justify-center space-y-1 group"
          >
            <div className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${activePrompt.type?.startsWith('LAMP') ? 'bg-amber-500' : 'bg-red-700'} animate-pulse`} />
              <span className="font-semibold text-stone-100 group-hover:text-amber-300 transition-colors">
                {activePrompt.promptText}
              </span>
            </div>
            {activePrompt.subText && (
              <span className="text-[10px] tracking-widest text-stone-400 group-hover:text-stone-300 lowercase font-serif italic">
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
          className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-[4px] p-4 animate-fade-in"
        >
          <div className="w-full max-w-md bg-[#181512] border-2 border-[#423326] p-8 sm:p-10 shadow-[0_0_90px_rgba(0,0,0,0.98)] relative text-center">
            {/* Wax / Pin Mark */}
            <div className="w-4 h-4 rounded-full bg-red-950 border border-red-800 mx-auto mb-4 shadow-inner" />

            <div className="text-[10px] font-mono tracking-[0.25em] text-[#8c7866] uppercase mb-6">
              Weathered Parchment
            </div>

            <div className="space-y-6 font-serif text-[#d6c7b2] tracking-wider leading-relaxed py-2">
              <p className="text-base sm:text-lg italic font-medium text-stone-200">
                &ldquo;ARE YOU REALLY SURE YOU WANT TO GO INSIDE?&rdquo;
              </p>

              <div className="w-16 h-[1px] bg-[#544131] mx-auto" />

              <p className="text-sm sm:text-base tracking-widest uppercase text-amber-200/90 font-mono">
                &ldquo;TWO FLAMES BURN.<br />THE THIRD WAITS UNSEEN.&rdquo;
              </p>
            </div>

            <div className="mt-8 pt-4 border-t border-[#33261c] flex justify-center">
              <button
                id="btn-close-note"
                type="button"
                onClick={onCloseNote}
                className="px-6 py-2 border border-[#544131] hover:border-amber-700/80 bg-[#241c16] text-stone-300 hover:text-stone-100 text-xs font-mono uppercase tracking-widest transition-colors cursor-pointer active:scale-95"
              >
                [E / ESC] Fold Note Away
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gate Inspection Cinematic Modal */}
      {inspectModalOpen && (
        <div
          id="inspect-gate-modal"
          className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-[3px] p-4"
        >
          <div className="w-full max-w-lg bg-stone-950/95 border border-stone-800/90 p-7 sm:p-8 shadow-[0_0_70px_rgba(0,0,0,0.98)] animate-fade-in relative">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-horror-title text-lg sm:text-xl font-bold tracking-[0.2em] text-stone-200">
                THE MAIN ENTRANCE GATE
              </h3>
              <span className="text-[10px] font-mono tracking-widest text-red-700/80 uppercase">
                {ritualState?.gateUnlocked ? 'Unlocked' : 'Locked'}
              </span>
            </div>
            <div className="w-24 h-[1px] bg-red-900/60 mb-5" />

            <div className="font-creepy text-sm sm:text-base text-stone-300 space-y-4 tracking-wider leading-relaxed">
              <p>
                The towering wrought-iron gate looms cold and impassable in the rain.
                Rusted industrial chains coil tightly through the spiked bars, bound fast by an antique brass padlock.
              </p>
              <p className="text-stone-400 italic text-xs sm:text-sm">
                Beyond the iron lattice, the overgrown gravel driveway vanishes into thick weeping fog. 
                Distant through the trees, a dim orange candle glimmers in the highest attic dormer of the House of Devil.
              </p>
              {!ritualState?.gateUnlocked && (
                <p className="text-amber-400/90 text-xs font-mono tracking-wider pt-2">
                  ● Ancient ritual required: Three oil lamps outside the gate must be awakened to reveal the key.
                </p>
              )}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-stone-900">
              <button
                id="btn-shake-gate"
                type="button"
                onClick={() => {
                  onShakeGate();
                  horrorAudio.playGateCreak(0.95);
                }}
                className="w-full sm:w-auto px-4 py-2 border border-red-900/60 bg-red-950/25 hover:bg-red-950/50 text-stone-200 text-xs font-mono uppercase tracking-widest transition-colors cursor-pointer active:scale-95"
              >
                Rattle The Chains
              </button>

              <button
                id="btn-close-inspect"
                type="button"
                onClick={closeInspection}
                className="w-full sm:w-auto px-4 py-2 border border-stone-800 hover:border-stone-600 text-stone-400 hover:text-stone-200 text-xs font-mono uppercase tracking-widest transition-colors cursor-pointer active:scale-95"
              >
                [ESC] Step Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Controls Bar & Story Label */}
      <div className="flex items-end justify-between pointer-events-auto">
        {/* Desktop Controls Panel (Hidden on small mobile screens to keep view clean) */}
        <div
          className={`hidden md:block transition-opacity duration-700 text-[11px] font-mono tracking-widest text-stone-400/85 bg-black/70 p-3.5 border border-stone-800/80 backdrop-blur-xs max-w-xs ${
            showControlsHint ? 'opacity-100' : 'opacity-40 hover:opacity-100'
          }`}
        >
          <div className="text-stone-300 mb-1.5 uppercase font-semibold tracking-[0.2em] border-b border-stone-800/80 pb-1 flex justify-between items-center">
            <span>Controls</span>
            <span className="text-[9px] text-stone-600">Cinematic FPP</span>
          </div>
          <div className="space-y-1 text-stone-400">
            <div><span className="text-stone-200 font-bold">W A S D</span> — Walk Around Grounds</div>
            <div><span className="text-stone-200 font-bold">SHIFT</span> — Fast Walk</div>
            <div><span className="text-stone-200 font-bold">MOUSE</span> — 180° Look / Turn</div>
            <div><span className="text-stone-200 font-bold">E</span> — Light Lamp / Interact</div>
            <div><span className="text-stone-200 font-bold">F</span> — Flashlight</div>
            <div><span className="text-stone-200 font-bold">ESC</span> — Menu</div>
          </div>
        </div>

        {/* Story Label: Partially faded into the environment */}
        <div className="text-right font-mono tracking-[0.22em] text-stone-400/40 hover:text-stone-400/75 transition-opacity select-none leading-relaxed pl-4">
          <div className="text-xs sm:text-sm font-semibold">THE HOUSE OF DEVIL •</div>
          <div className="text-[10px] sm:text-xs">THE THREE LAMPS RITUAL</div>
        </div>
      </div>
    </div>
  );
};


