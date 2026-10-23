import React from 'react';

interface CinematicOverlayProps {
  isFading: boolean;
  lightningActive: boolean;
  introBlackOpacity?: number;
  isIntroActive?: boolean;
  houseProximityFactor?: number; // 0 (far outside gate) to 1 (at door / inside haunted bungalow)
}

export const CinematicOverlay: React.FC<CinematicOverlayProps> = ({
  isFading,
  lightningActive,
  introBlackOpacity = 0,
  isIntroActive = false,
  houseProximityFactor = 0,
}) => {
  const effectiveBlack = Math.max(isFading ? 1 : 0, introBlackOpacity);

  // Smooth clamp 0 to 1
  const proximity = Math.min(1, Math.max(0, houseProximityFactor));

  // Base peripheral darkness tightens and darkens as player nears the house
  // Inner transparent radius shrinks from 65% down to 28%
  const innerStop = (65 - proximity * 37).toFixed(1);
  const midStop = (82 - proximity * 24).toFixed(1);

  // Black opacity values scale with proximity
  const edgeOpacity = (0.45 + proximity * 0.46).toFixed(2); // 0.45 -> 0.91
  const midOpacity = (0.10 + proximity * 0.45).toFixed(2);  // 0.10 -> 0.55

  // Subtle crimson paranoia rim at high proximity (feeling of being watched)
  const redParanoiaOpacity = (proximity * 0.38).toFixed(2);

  return (
    <div id="cinematic-overlay" className="fixed inset-0 pointer-events-none z-20 overflow-hidden">
      {/* 1. Base cinematic horror vignette - dynamically scales with proximity to house */}
      <div
        className="absolute inset-0 transition-[background] duration-500 ease-out"
        style={{
          background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 0%, rgba(0,0,0,0) ${innerStop}%, rgba(3,2,2,${midOpacity}) ${midStop}%, rgba(0,0,0,${edgeOpacity}) 100%)`,
        }}
      />

      {/* 2. Creeping Paranoia Tunnel: Deep claustrophobic crimson edge tint that intensifies near the bungalow */}
      {proximity > 0.05 && (
        <div
          className={`absolute inset-0 transition-opacity duration-700 ease-out ${proximity > 0.5 ? 'animate-watched-breath' : ''}`}
          style={{
            opacity: redParanoiaOpacity,
            background: `radial-gradient(ellipse 90% 85% at 50% 50%, rgba(0,0,0,0) ${Math.max(15, 60 - proximity * 35)}%, rgba(45, 6, 6, 0.45) 80%, rgba(35, 2, 2, 0.88) 100%)`,
          }}
        />
      )}

      {/* 3. Deep corner shadows ("Watching eyes in periphery") */}
      {proximity > 0.3 && (
        <div
          className="absolute inset-0 transition-opacity duration-700 ease-out pointer-events-none"
          style={{
            opacity: Math.min(1, (proximity - 0.3) * 1.4),
            boxShadow: `inset 0 0 ${Math.round(80 + proximity * 100)}px ${Math.round(20 + proximity * 40)}px rgba(0, 0, 0, 0.92)`,
          }}
        />
      )}

      {/* 4. Very subtle organic film grain texture */}
      <div className="absolute inset-0 horror-film-grain opacity-25" />

      {/* 5. Lightning Flash Overlay */}
      <div
        className={`absolute inset-0 bg-blue-100/25 transition-opacity duration-75 ${
          lightningActive ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* 6. Cinematic Intro Widescreen Bars */}
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

      {/* 7. Black Screen Fade Transitions */}
      <div
        className="absolute inset-0 bg-black pointer-events-none transition-opacity duration-150 ease-linear"
        style={{ opacity: effectiveBlack }}
      />
    </div>
  );
};
