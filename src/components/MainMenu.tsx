import React from 'react';
import { horrorAudio } from '../audio/HorrorAudioManager';

interface MainMenuProps {
  onPlay: () => void;
  onOpenSettings: () => void;
  onPlayStory?: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onPlay, onOpenSettings, onPlayStory }) => {
  return (
    <div
      id="main-menu-overlay"
      className="fixed inset-0 z-40 flex flex-col justify-between p-8 sm:p-14 select-none pointer-events-none"
    >
      {/* Top Left Title Branding */}
      <div className="pointer-events-auto max-w-lg">
        <h2 className="font-horror-title text-2xl sm:text-3xl font-bold tracking-[0.2em] text-stone-200 drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
          THE HOUSE OF DEVIL
        </h2>
        <p className="font-creepy text-xs sm:text-sm text-stone-500 tracking-widest mt-1">
          Act I — The Outer Gates
        </p>
      </div>

      {/* Side Menu Navigation */}
      <div className="pointer-events-auto flex flex-col items-start space-y-5 my-auto max-w-xs pl-2">
        <button
          id="btn-menu-play"
          onClick={() => {
            horrorAudio.playMenuSelect();
            onPlay();
          }}
          onMouseEnter={() => horrorAudio.playMenuHover()}
          className="group relative text-left text-xl sm:text-2xl font-horror-title tracking-[0.25em] text-stone-300 hover:text-stone-100 transition-all duration-300 cursor-pointer flex items-center space-x-3"
        >
          <span className="w-0 group-hover:w-4 h-[1px] bg-red-800 transition-all duration-300 opacity-0 group-hover:opacity-100" />
          <span className="group-hover:translate-x-2 transition-transform duration-300 group-hover:text-red-500/90 drop-shadow-[0_0_8px_rgba(185,28,28,0.5)]">
            PLAY
          </span>
        </button>

        {onPlayStory && (
          <button
            id="btn-menu-story"
            onClick={() => {
              horrorAudio.playMenuSelect();
              onPlayStory();
            }}
            onMouseEnter={() => horrorAudio.playMenuHover()}
            className="group relative text-left text-base sm:text-lg font-horror-title tracking-[0.25em] text-amber-500/80 hover:text-amber-300 transition-all duration-300 cursor-pointer flex items-center space-x-3"
          >
            <span className="w-0 group-hover:w-3 h-[1px] bg-amber-500 transition-all duration-300 opacity-0 group-hover:opacity-100" />
            <span className="group-hover:translate-x-1 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]">
              STORY CINEMATIC
            </span>
          </button>
        )}

        <button
          id="btn-menu-root"
          onClick={() => {
            horrorAudio.playMenuSelect();
          }}
          onMouseEnter={() => horrorAudio.playMenuHover()}
          className="group relative text-left text-base sm:text-lg font-horror-title tracking-[0.25em] text-stone-500 hover:text-stone-300 transition-all duration-300 cursor-pointer flex items-center space-x-3"
        >
          <span className="w-0 group-hover:w-3 h-[1px] bg-stone-500 transition-all duration-300 opacity-0 group-hover:opacity-100" />
          <span className="group-hover:translate-x-1 transition-transform duration-300">
            MAIN MENU
          </span>
        </button>

        <button
          id="btn-menu-settings"
          onClick={() => {
            horrorAudio.playMenuSelect();
            onOpenSettings();
          }}
          onMouseEnter={() => horrorAudio.playMenuHover()}
          className="group relative text-left text-base sm:text-lg font-horror-title tracking-[0.25em] text-stone-500 hover:text-stone-300 transition-all duration-300 cursor-pointer flex items-center space-x-3"
        >
          <span className="w-0 group-hover:w-3 h-[1px] bg-stone-500 transition-all duration-300 opacity-0 group-hover:opacity-100" />
          <span className="group-hover:translate-x-1 transition-transform duration-300">
            SETTINGS
          </span>
        </button>
      </div>

      {/* Minimal Footer Info */}
      <div className="pointer-events-auto flex items-center justify-between text-[11px] text-stone-600 tracking-widest font-mono">
        <span>Estate Grounds: 41°27'N 73°49'W</span>
        <span>Version 1.0.0</span>
      </div>
    </div>
  );
};
