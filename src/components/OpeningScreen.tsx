import React, { useState } from 'react';
import { horrorAudio } from '../audio/HorrorAudioManager';

interface OpeningScreenProps {
  onEnter: () => void;
}

export const OpeningScreen: React.FC<OpeningScreenProps> = ({ onEnter }) => {
  const [isEntering, setIsEntering] = useState(false);

  const handleEnterClick = async () => {
    if (isEntering) return;
    setIsEntering(true);

    // Initialize Web Audio API on user gesture
    await horrorAudio.init();
    horrorAudio.playCinematicTransition();

    // Trigger transition callback after fade
    setTimeout(() => {
      onEnter();
    }, 1100);
  };

  return (
    <div
      id="opening-screen"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center select-none transition-opacity duration-1000 ${
        isEntering ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background vignette & atmospheric dust overlay */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black via-black/80 to-black/90" />
      <div className="absolute inset-0 pointer-events-none horror-film-grain" />

      {/* Creepy ambient fog overlay pulses */}
      <div className="absolute inset-0 pointer-events-none bg-radial from-stone-900/30 via-black/60 to-black animate-fog-pulse" />

      {/* Center Title Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-4xl mx-auto">
        <p className="text-xs uppercase tracking-[0.45em] text-stone-500 mb-4 opacity-75 font-mono">
          A Psychological 3D Horror Experience
        </p>

        <h1
          id="opening-game-title"
          className="font-horror-title text-4xl sm:text-6xl md:text-7xl font-bold tracking-[0.25em] text-stone-200 animate-horror-glitch drop-shadow-[0_4px_25px_rgba(0,0,0,0.9)]"
        >
          THE HOUSE OF DEVIL
        </h1>

        <div className="w-48 h-[1px] bg-gradient-to-r from-transparent via-red-900/60 to-transparent my-6" />

        <p className="font-creepy text-sm sm:text-base text-stone-400 tracking-wider max-w-md mx-auto mb-14 opacity-80 leading-relaxed">
          "Some gates were forged never to be reopened... yet their hinges still weep in the dark."
        </p>

        {/* ENTER Button */}
        <button
          id="btn-enter-experience"
          onClick={handleEnterClick}
          onMouseEnter={() => horrorAudio.playMenuHover()}
          className="group relative px-10 py-3.5 bg-black/60 border border-stone-800/80 hover:border-red-900/80 rounded-none text-stone-300 hover:text-stone-100 tracking-[0.35em] text-sm uppercase transition-all duration-500 shadow-[0_0_15px_rgba(0,0,0,0.8)] hover:shadow-[0_0_25px_rgba(185,28,28,0.35)] cursor-pointer overflow-hidden active:scale-95"
        >
          {/* Subtle red eerie glow pulse behind button */}
          <span className="absolute inset-0 bg-red-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <span className="relative z-10 font-medium">[ ENTER ]</span>
        </button>

        <span className="mt-8 text-[11px] text-stone-600 tracking-widest font-mono uppercase">
          Headphones Recommended • Hardware Acceleration Required
        </span>
      </div>
    </div>
  );
};
