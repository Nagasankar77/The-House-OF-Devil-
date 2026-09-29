import React, { useEffect } from 'react';
import { StoryPoster } from '../types';
import { horrorAudio } from '../audio/HorrorAudioManager';

interface ClueInspectModalProps {
  poster: StoryPoster;
  onClose: () => void;
}

export const ClueInspectModal: React.FC<ClueInspectModalProps> = ({ poster, onClose }) => {
  useEffect(() => {
    horrorAudio.playPaperRustle();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'e' || e.key === 'E' || e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      id="clue-inspection-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-[3px] p-4 animate-fade-in pointer-events-auto select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#14120f] border-2 border-[#3d3126] shadow-[0_0_80px_rgba(0,0,0,0.98)] p-6 sm:p-8 relative text-stone-300 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Rusted Pin / Nail mount icon */}
        <div className="flex items-center justify-center mb-4">
          <div className="w-3.5 h-3.5 rounded-full bg-[#3d2719] border border-[#694229] shadow-inner flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-[#1c120c]" />
          </div>
        </div>

        {/* Header / Subtitle */}
        <div className="text-center border-b border-[#30251c] pb-3 mb-4">
          {poster.subtitle && (
            <span className="text-[10px] font-mono tracking-[0.25em] text-amber-700 uppercase block mb-1">
              {poster.subtitle}
            </span>
          )}
          <h2 className="text-lg sm:text-xl font-serif tracking-wider text-stone-100 uppercase font-semibold">
            {poster.title}
          </h2>
          {poster.date && (
            <span className="text-xs font-mono text-stone-500 block mt-1">
              — {poster.date} —
            </span>
          )}
        </div>

        {/* Vintage Photograph Section (if applicable) */}
        {poster.hasPhoto && (
          <div className="mb-5 flex flex-col items-center">
            <div className="relative p-2.5 bg-[#211a14] border border-[#423325] shadow-lg max-w-xs">
              {poster.type === 'POSTER_2' ? (
                // Eleanor Vance Missing Notice Photo
                <div className="w-48 h-56 bg-[#73634e] relative overflow-hidden flex flex-col items-center justify-center border border-[#524434]">
                  {/* Portrait Silhouette */}
                  <div className="w-20 h-20 rounded-full bg-[#382d22] mb-1" />
                  <div className="w-36 h-24 rounded-t-full bg-[#382d22]" />
                  {/* Scratches & grain overlay */}
                  <div className="absolute inset-0 bg-[radial-gradient(#1c1611_1px,transparent_1px)] [background-size:8px_8px] opacity-25 pointer-events-none" />
                  <div className="absolute inset-x-0 top-1/3 h-0.5 bg-stone-300/40 rotate-12 pointer-events-none" />
                  <div className="absolute inset-x-0 top-1/2 h-0.5 bg-stone-300/30 -rotate-6 pointer-events-none" />
                </div>
              ) : (
                // 1952 Bungalow Family Portrait
                <div className="w-64 h-44 bg-[#6e604f] relative overflow-hidden flex flex-col justify-end items-center border border-[#524434] p-2">
                  {/* Distant bungalow roof in photo */}
                  <div className="absolute top-3 w-44 h-16 bg-[#3b3228]" />
                  {/* Colonial figures on veranda with scratched out faces */}
                  <div className="flex items-end space-x-3 z-10 mb-1">
                    <div className="w-5 h-20 bg-[#251f18] rounded-t-sm relative">
                      <div className="w-3.5 h-3.5 rounded-full bg-[#1b1510] -top-3 left-1 absolute" />
                    </div>
                    {/* Scratched Woman figure */}
                    <div className="w-6 h-18 bg-[#2b221a] rounded-t-sm relative">
                      <div className="w-4 h-4 rounded-full bg-[#1b1510] -top-3.5 left-1 absolute" />
                      {/* Deep blade scratches across head */}
                      <div className="absolute -top-5 -left-2 w-8 h-8 border-t-2 border-r-2 border-stone-200/85 rotate-45" />
                    </div>
                    {/* Child figure */}
                    <div className="w-4 h-11 bg-[#231d16] rounded-t-sm relative">
                      <div className="w-3 h-3 rounded-full bg-[#1b1510] -top-3 left-0.5 absolute" />
                      <div className="absolute -top-4 -left-1 w-6 h-6 border-b-2 border-l-2 border-stone-200/80 -rotate-45" />
                    </div>
                  </div>
                  {/* Photo vignette */}
                  <div className="absolute inset-0 shadow-[inset_0_0_30px_rgba(0,0,0,0.8)] pointer-events-none" />
                </div>
              )}
              {poster.photoCaption && (
                <p className="text-[11px] font-serif italic text-stone-400 text-center mt-2">
                  {poster.photoCaption}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Text Body */}
        <div className="space-y-3 font-serif text-sm sm:text-base leading-relaxed text-stone-200 text-left px-2 sm:px-4">
          {poster.body.map((paragraph, idx) => (
            <p key={idx} className={idx === 0 ? 'font-medium text-amber-200/90' : 'text-stone-300'}>
              {paragraph}
            </p>
          ))}
        </div>

        {/* Handwritten Note / Scratching */}
        {poster.handwrittenNote && (
          <div className="mt-5 pt-3 border-t border-[#30251c] px-2 sm:px-4 text-center">
            <span className="text-xs sm:text-sm font-serif italic text-amber-500/90 tracking-wide block">
              {poster.handwrittenNote}
            </span>
          </div>
        )}

        {/* Footer / Dismiss Button */}
        <div className="mt-6 pt-4 border-t border-[#30251c] flex items-center justify-between">
          <span className="text-[10px] font-mono text-stone-500 tracking-wider">
            [E] / [ESC] TO PUT AWAY
          </span>
          <button
            type="button"
            onClick={() => {
              horrorAudio.playPaperRustle();
              onClose();
            }}
            className="px-4 py-1.5 bg-[#261f18] hover:bg-[#3d2f23] border border-[#4d3d2c] hover:border-amber-700 text-stone-200 text-xs font-mono uppercase tracking-widest transition-colors cursor-pointer active:scale-95"
          >
            Put Away
          </button>
        </div>
      </div>
    </div>
  );
};
