import React, { useEffect } from 'react';
import { SkipForward, Volume2 } from 'lucide-react';
import { StorySubtitleData } from '../engine/cinematic/InGameStoryDirector';

interface StoryCinematicHUDProps {
  subtitle: StorySubtitleData | null;
  onSkip: () => void;
}

export const StoryCinematicHUD: React.FC<StoryCinematicHUDProps> = ({
  subtitle,
  onSkip,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Escape') {
        e.preventDefault();
        onSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSkip]);

  return (
    <div
      id="story-cinematic-hud"
      className="fixed inset-0 pointer-events-none z-[8000] flex flex-col justify-between select-none"
    >
      {/* Top 2.39:1 Letterbox Cinema Bar */}
      <div className="w-full h-[12vh] bg-gradient-to-b from-black via-black/95 to-transparent flex items-center justify-between px-6 md:px-12 pointer-events-auto">
        <div className="flex items-center space-x-3">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse shadow-[0_0_12px_rgba(220,38,38,0.9)]" />
          <span className="text-xs md:text-sm font-mono tracking-[0.25em] uppercase text-stone-200 font-semibold">
            {subtitle ? subtitle.sceneTitle : 'REAL-TIME 3D STORY // PROLOGUE'}
          </span>
          {subtitle && (
            <span className="hidden sm:inline-block text-[11px] font-mono text-stone-500 tracking-widest">
              [{subtitle.sceneIndex} / {subtitle.totalScenes}]
            </span>
          )}
        </div>

        {/* Skip Button */}
        <button
          type="button"
          onClick={onSkip}
          className="px-3.5 py-1.5 bg-stone-900/90 hover:bg-stone-800 border border-stone-700 hover:border-red-600/80 text-stone-300 hover:text-white text-xs font-mono tracking-widest uppercase rounded transition-all cursor-pointer shadow-lg active:scale-95 flex items-center space-x-2"
          title="Skip Story Cinematic [Space / Esc]"
        >
          <span>SKIP [SPACE]</span>
          <SkipForward className="w-3.5 h-3.5 ml-1 text-stone-400" />
        </button>
      </div>

      {/* Subtitles & Dialogue Container */}
      <div className="w-full pb-8 px-6 flex flex-col items-center justify-center text-center">
        {subtitle && (
          <div className="max-w-3xl w-full bg-black/60 backdrop-blur-sm border border-stone-800/80 px-6 py-4 rounded-lg shadow-2xl transition-all duration-300 animate-fadeIn">
            <div className="flex items-center justify-center space-x-2 mb-1.5">
              <Volume2 className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span className="text-xs font-mono tracking-widest uppercase font-bold text-amber-500">
                {subtitle.speaker}
              </span>
            </div>
            <p className="text-base md:text-lg text-stone-100 font-serif leading-relaxed tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
              "{subtitle.text}"
            </p>
          </div>
        )}
      </div>

      {/* Bottom 2.39:1 Letterbox Cinema Bar */}
      <div className="w-full h-[12vh] bg-gradient-to-t from-black via-black/95 to-transparent flex items-center justify-center pb-3">
        <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-stone-500">
          HOUSE OF DEVIL // IN-ENGINE 3D CHRONICLE
        </span>
      </div>
    </div>
  );
};
