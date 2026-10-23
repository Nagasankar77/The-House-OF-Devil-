import React from 'react';
import { horrorAudio } from '../../game/audio/HorrorAudioManager';

interface MainMenuProps {
  onPlay: () => void;
  onOpenSettings: () => void;
  onPlayStory?: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onPlay, onOpenSettings }) => {
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
          <span className="w-0 group-hover:w-4 h-[1px] bg-[#800b19] transition-all duration-300 opacity-0 group-hover:opacity-100" />
          <span className="group-hover:translate-x-2 transition-transform duration-300 group-hover:text-[#800b19] drop-shadow-[0_0_10px_rgba(134,1,17,0.6)]">
            PLAY
          </span>
        </button>

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
      <div className="pointer-events-auto flex items-center justify-end text-[11px] text-stone-600 tracking-widest font-mono">
        <span>Version 1.0.0</span>
      </div>
    </div>
  );
};
