import React, { useEffect } from 'react';
import { InventoryItem } from '../../../shared/types';
import { horrorAudio } from '../../game/audio/HorrorAudioManager';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  batteryCount?: number;
  flashlightOn?: boolean;
  onToggleFlashlight?: () => void;
  placedCount?: number;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  onClose,
  items,
  placedCount = 0,
}) => {
  useEffect(() => {
    if (isOpen) {
      horrorAudio.playInventoryToggle(true);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' || e.key === 'Escape' || e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        e.stopPropagation();
        horrorAudio.playInventoryToggle(false);
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Carried items: only items currently in player's inventory (not placed on table)
  const carriedItems = items.filter((item) => item && item.id && !item.placedOnTable);
  const carriedPuzzleCount = carriedItems.filter((i) =>
    ['diary', 'watch', 'flower', 'bag', 'spectacles'].includes(i.iconType)
  ).length;

  return (
    <div
      id="inventory-overlay-modal"
      className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/85 backdrop-blur-[5px] p-4 animate-fade-in select-none pointer-events-auto"
      onClick={() => {
        horrorAudio.playInventoryToggle(false);
        onClose();
      }}
    >
      <div
        className="w-full max-w-xl bg-[#12100d] border border-[#3d3227] shadow-[0_0_80px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden text-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#181410] border-b border-[#30261c] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 text-amber-500 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zm-9-1a2 2 0 0 1 4 0v1h-4V6zm10 14H4V9h16v11z" />
                <path d="M10 12h4v2h-4z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-mono tracking-[0.25em] uppercase font-bold text-amber-200">
                INVENTORY SATCHEL
              </h2>
              <span className="text-[10px] font-mono tracking-widest text-stone-400 uppercase font-semibold">
                CARRIED BELONGINGS: {carriedPuzzleCount}/5 {carriedPuzzleCount === 0 && '(EMPTY)'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              horrorAudio.playInventoryToggle(false);
              onClose();
            }}
            className="px-3 py-1 border border-stone-700 hover:border-amber-600 bg-stone-900/60 hover:bg-stone-800 text-stone-400 hover:text-stone-100 text-xs font-mono transition-colors cursor-pointer"
          >
            [TAB / ESC] CLOSE
          </button>
        </div>

        {/* Carried Items List */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {carriedItems.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-[#2d241b] text-stone-500 font-mono text-xs tracking-wider">
              YOUR SATCHEL IS EMPTY.
              {placedCount > 0 && (
                <span className="block mt-2 text-stone-400 text-[11px] font-serif italic">
                  All {placedCount} belonging{placedCount > 1 ? 's' : ''} have been placed resting on the central table.
                </span>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {carriedItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-[#181410] border border-[#382b1f] hover:border-amber-600/60 flex flex-col items-center justify-between rounded text-center transition-colors min-h-[110px]"
                >
                  <div className="my-auto py-1">
                    {renderItemIcon(item.iconType)}
                  </div>
                  <div className="w-full mt-2">
                    <span className="font-mono text-xs font-semibold text-stone-200 block truncate">
                      {item.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-2.5 bg-[#0e0c0a] border-t border-[#261d15] flex items-center justify-between text-[10px] font-mono text-stone-500">
          <span>
            Carried items: {carriedItems.length}
            {placedCount > 0 ? ` • Restored to table: ${placedCount}/5` : ''}
          </span>
          <span className="text-stone-400">Press [TAB] or [ESC] to return</span>
        </div>
      </div>
    </div>
  );
};

// Clean vector icons for collected items
function renderItemIcon(type: InventoryItem['iconType']) {
  switch (type) {
    case 'diary':
      return (
        <svg className="w-10 h-10 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
          <path d="M6 6h10" />
          <path d="M6 10h10" />
          <path d="M6 14h6" />
        </svg>
      );
    case 'watch':
      return (
        <svg className="w-10 h-10 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="7" />
          <polyline points="12 9 12 12 14.5 13.5" />
          <path d="M9 5l1.5-3h3L15 5" />
          <path d="M9 19l1.5 3h3L15 19" />
        </svg>
      );
    case 'flower':
      return (
        <svg className="w-10 h-10 text-pink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 21a9 9 0 0 0 0-11" />
          <path d="M12 10a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
          <path d="M12 2a4 4 0 0 1 4 4 4 4 0 0 1-4 4" />
          <path d="M9 16c1.5-.5 3-2 3-4" />
        </svg>
      );
    case 'bag':
      return (
        <svg className="w-10 h-10 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
          <rect x="3" y="7" width="18" height="14" rx="2" />
          <path d="M3 12h18" />
          <path d="M10 12v3a2 2 0 0 0 4 0v-3" />
        </svg>
      );
    case 'spectacles':
      return (
        <svg className="w-10 h-10 text-amber-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="14" r="4" />
          <circle cx="18" cy="14" r="4" />
          <path d="M10 14a3 3 0 0 1 4 0" />
          <path d="M2 14l2-6" />
          <path d="M22 14l-2-6" />
        </svg>
      );
    case 'key':
      return (
        <svg className="w-10 h-10 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="7.5" cy="15.5" r="4.5" />
          <path d="m11 12 8-8" />
          <path d="m16 4 2 2" />
          <path d="m18 6 2 2" />
        </svg>
      );
    case 'hammer':
      return (
        <svg className="w-10 h-10 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 12-8.5 8.5a2.12 2.12 0 1 1-3-3L12 9" />
          <path d="M17.64 15 22 10.64" />
          <path d="m20.91 3.09-6.4 6.4" />
          <path d="M9 3h7v5H9z" />
        </svg>
      );
    case 'battery':
      return (
        <svg className="w-10 h-10 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="7" width="12" height="14" rx="2" />
          <path d="M10 3h4v4h-4z" />
          <path d="M12 11v6" />
        </svg>
      );
    case 'puja_jug':
      return (
        <svg className="w-10 h-10 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 4h8" />
          <path d="M9 4v3c0 1-1.5 2-2 3-1.5 3-1 6.5 1 8.5s5 2 7.5 1 4.5-4 3.5-7.5c-.5-1.5-2-2-2-3V4" />
          <path d="M10 20h4" />
          <path d="M7 10c-2.5 0-4 1.5-4 4 0 2 1.5 3.5 3.5 3.5" />
        </svg>
      );
    case 'broken_bone':
      return (
        <svg className="w-10 h-10 text-stone-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 3a2.5 2.5 0 0 1 2.5 2.5c0 1.2-.8 2.2-2 2.5l-4.5 4.5" />
          <path d="M21 7.5a2.5 2.5 0 0 1-2.5 2.5" />
          <path d="M12.5 13 8 17.5" />
          <path d="M6 19.5a2 2 0 1 1-3-3l3-3" />
          <path d="M13 12.5 14 14l-2 1.5 1.5 1.5-1.5 1.5" />
        </svg>
      );
    case 'skull_bone':
      return (
        <svg className="w-10 h-10 text-stone-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a8 8 0 0 0-8 8c0 3.5 2 6 4 7v3h8v-3c2-1 4-3.5 4-7a8 8 0 0 0-8-8Z" />
          <circle cx="9" cy="11" r="1.5" fill="currentColor" />
          <circle cx="15" cy="11" r="1.5" fill="currentColor" />
          <path d="M12 14v2" />
          <path d="M10 20v2" />
          <path d="M14 20v2" />
        </svg>
      );
    case 'star_key':
      return (
        <svg className="w-10 h-10 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l1.8 3.6 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4-2.9-2.8 4-.6z" />
          <path d="M12 15v7" />
          <path d="M12 18h4" />
          <path d="M12 21h3" />
        </svg>
      );
    default:
      return (
        <svg className="w-10 h-10 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      );
  }
}
