import React, { useEffect } from 'react';
import { FiveItemPuzzleState } from '../../../shared/types';
import { PUZZLE_ITEMS_CONFIG } from '../../systems/puzzle/FiveItemPuzzleSystem';
import { horrorAudio } from '../../game/audio/HorrorAudioManager';

interface BlackboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  puzzleState: FiveItemPuzzleState;
}

export const BlackboardModal: React.FC<BlackboardModalProps> = ({
  isOpen,
  onClose,
  puzzleState,
}) => {
  useEffect(() => {
    if (isOpen) {
      horrorAudio.playMenuHover();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'e' || e.key === 'E' || e.key === 'Escape' || e.key === ' ') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      id="blackboard-reading-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-[4px] p-4 animate-fade-in select-none pointer-events-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#101314] border-4 border-[#2c1d13] shadow-[0_0_80px_rgba(0,0,0,0.98)] p-6 sm:p-8 text-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border border-stone-700/40 p-6 text-center">
          <h2 className="text-2xl font-serif tracking-[0.2em] uppercase text-stone-100 font-bold mb-6">
            FIND FIVE OBJECTS
          </h2>

          <div className="space-y-3 mb-6 text-left max-w-xs mx-auto font-mono text-sm sm:text-base">
            {PUZZLE_ITEMS_CONFIG.map((item, index) => {
              const isCollected = puzzleState.collectedItems.includes(item.type);
              const isPlaced = puzzleState.placedItems.includes(item.type);
              const isDone = isCollected || isPlaced;

              return (
                <div
                  key={item.id}
                  className={`flex items-center space-x-3 ${
                    isDone ? 'text-emerald-300 font-bold' : 'text-stone-300'
                  }`}
                >
                  <span className="w-6 text-center font-bold">
                    {isDone ? '[✓]' : '[ ]'}
                  </span>
                  <span>
                    {index + 1}. {item.name}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="font-serif italic text-xs sm:text-sm text-stone-300 max-w-xs mx-auto leading-relaxed border-t border-stone-800/80 pt-4">
            Find each object and place all five on the table to reveal the secret door.
          </p>

          {puzzleState.secretDoorUnlocked && (
            <p className="text-emerald-400 font-mono text-xs tracking-wider uppercase font-bold mt-3 animate-pulse">
              ✦ THE SECRET DOOR IS UNLOCKED ✦
            </p>
          )}

          <div className="mt-6 pt-3 border-t border-stone-800 text-xs font-mono text-stone-500">
            [E / ESC] Close
          </div>
        </div>
      </div>
    </div>
  );
};
