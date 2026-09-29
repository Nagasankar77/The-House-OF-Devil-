import React from 'react';

interface CinematicOverlayProps {
  isFading: boolean;
  lightningActive: boolean;
  introBlackOpacity?: number;
  isIntroActive?: boolean;
}

export const CinematicOverlay: React.FC<CinematicOverlayProps> = ({
  isFading,
  lightningActive,
  introBlackOpacity = 0,
  isIntroActive = false,
}) => {
  const effectiveBlack = Math.max(isFading ? 1 : 0, introBlackOpacity);

  return (
    <div id="cinematic-overlay" className="fixed inset-0 pointer-events-none z-20">
      {/* Subtle cinematic horror vignette - gentle edge darkening without crushed blacks */}
      <div className="absolute inset-0 bg-radial from-transparent via-black/10 to-black/45" />

      {/* Very subtle organic film grain texture */}
      <div className="absolute inset-0 horror-film-grain opacity-25" />

      {/* Lightning Flash Overlay */}
      <div
        className={`absolute inset-0 bg-blue-100/25 transition-opacity duration-75 ${
          lightningActive ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Cinematic Intro Widescreen Bars */}
      <div
        className={`absolute top-0 inset-x-0 bg-black transition-all duration-1000 ease-out z-10 ${
          isIntroActive ? 'h-8 sm:h-12' : 'h-0'
        }`}
      />
      <div
        className={`absolute bottom-0 inset-x-0 bg-black transition-all duration-1000 ease-out z-10 ${
          isIntroActive ? 'h-8 sm:h-12' : 'h-0'
        }`}
      />

      {/* Black Screen Fade Transitions */}
      <div
        className="absolute inset-0 bg-black pointer-events-none transition-opacity duration-150 ease-linear"
        style={{ opacity: effectiveBlack }}
      />
    </div>
  );
};
