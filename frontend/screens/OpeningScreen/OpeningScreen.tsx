import React, { useState, useEffect, useRef } from 'react';
import { horrorAudio } from '../../game/audio/HorrorAudioManager';
import { createPhotographicMoonCanvas } from '../../game/environment/MoonTexture';

interface OpeningScreenProps {
  onEnter: () => void;
}

/**
 * 16:9 Cinematic Psychological-Horror Title Screen for "THE HOUSE OF DEVIL"
 *
 * Color Palette:
 * - #05050A — Dominant Authentic Black
 * - #450F10 — Deep Maroon
 * - #6B1310 — Dark Maroon
 * - #7D1616 — Dark Crimson
 * - #860111 — Blood-Red Accents
 * - #800B19 — Deep Devil Red
 * - #0D2118 — Extremely subtle dark green
 * - #153832 — Extremely subtle green-black
 * - #D8D0C8 — Pale aged ivory/off-white typography
 */


export const OpeningScreen: React.FC<OpeningScreenProps> = ({ onEnter }) => {
  const [isEntering, setIsEntering] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const moonCanvasRef = useRef<HTMLCanvasElement | null>(null);

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const startTime = performance.now();

    // Lightning State Management:
    // Triggers approximately every 2 seconds with small random variation (~1.8s - 2.2s)
    let nextFlashTime = startTime + 1800 + Math.random() * 400;
    let activeFlash: {
      startTime: number;
      duration: number; // 0.08 - 0.15 seconds (80 - 150ms)
      peakIntensity: number; // 0.35 - 0.45 (subtle, soft illumination)
      originX: number;
      originY: number;
      branches: { x1: number; y1: number; x2: number; y2: number }[];
    } | null = null;

    // Base virtual resolution: 1920 x 1080 (16:9 aspect ratio)
    const V_WIDTH = 1920;
    const V_HEIGHT = 1080;

    // Pre-generate static atmospheric elements for performance & realism
    const stars: { x: number; y: number; r: number; alpha: number }[] = [];
    for (let i = 0; i < 90; i++) {
      stars.push({
        x: Math.random() * V_WIDTH,
        y: Math.random() * (V_HEIGHT * 0.45),
        r: 0.5 + Math.random() * 1.0,
        alpha: 0.1 + Math.random() * 0.35,
      });
    }

    // Ground fog particles
    const fogWisps: { x: number; y: number; vx: number; radius: number; alpha: number }[] = [];
    for (let i = 0; i < 35; i++) {
      fogWisps.push({
        x: Math.random() * V_WIDTH,
        y: V_HEIGHT * 0.62 + Math.random() * (V_HEIGHT * 0.36),
        vx: 0.15 + Math.random() * 0.25,
        radius: 120 + Math.random() * 220,
        alpha: 0.04 + Math.random() * 0.08,
      });
    }

    const render = (now: number) => {
      const elapsed = (now - startTime) * 0.001;

      // 0. Update Lightning State: Triggers approximately every 2 seconds with subtle variation
      if (!activeFlash && now >= nextFlashTime) {
        const duration = 85 + Math.random() * 60; // 0.085s - 0.145s brief pulse
        const peakIntensity = 0.36 + Math.random() * 0.10; // subtle, realistic illumination
        const originX = 420 + Math.random() * 660; // distant sky origin
        const originY = 70 + Math.random() * 80;

        // Realistic delicate branching lightning segments
        const branches: { x1: number; y1: number; x2: number; y2: number }[] = [];
        let currX = originX;
        let currY = originY;
        const segCount = 4 + Math.floor(Math.random() * 3);
        for (let s = 0; s < segCount; s++) {
          const nextX = currX + (Math.random() - 0.48) * 42;
          const nextY = currY + 22 + Math.random() * 24;
          branches.push({ x1: currX, y1: currY, x2: nextX, y2: nextY });

          // Occasional subtle sub-fork
          if (s === 2 && Math.random() < 0.6) {
            branches.push({
              x1: currX,
              y1: currY,
              x2: currX + (Math.random() < 0.5 ? -32 : 32),
              y2: currY + 16 + Math.random() * 18,
            });
          }
          currX = nextX;
          currY = nextY;
        }

        activeFlash = {
          startTime: now,
          duration,
          peakIntensity,
          originX,
          originY,
          branches,
        };

        // Distant subtle thunder: random delay of 0.2 - 0.8s on ~45% of flashes (not every flash)
        if (Math.random() < 0.45) {
          const thunderDelay = 200 + Math.random() * 600; // 0.2s - 0.8s
          horrorAudio.playDistantThunder(thunderDelay);
        }

        // Next flash scheduled approximately 2 seconds later (1.8s - 2.2s variation)
        nextFlashTime = now + duration + 1850 + (Math.random() - 0.5) * 400;
      }

      // Calculate instantaneous lightning flash intensity with double-micro pulse envelope
      let flashIntensity = 0;
      if (activeFlash) {
        const elapsedFlash = now - activeFlash.startTime;
        if (elapsedFlash >= activeFlash.duration) {
          activeFlash = null;
          flashIntensity = 0;
        } else {
          const p = elapsedFlash / activeFlash.duration; // 0 to 1
          let envelope = 0;
          if (p < 0.22) {
            envelope = p / 0.22; // rapid spike
          } else if (p < 0.36) {
            envelope = 1.0 - ((p - 0.22) / 0.14) * 0.45; // micro dip
          } else if (p < 0.50) {
            envelope = 0.55 + ((p - 0.36) / 0.14) * 0.45; // secondary strike
          } else {
            const decay = (p - 0.50) / 0.50;
            envelope = Math.max(0, Math.exp(-decay * 4.2)); // swift decay
          }
          flashIntensity = envelope * activeFlash.peakIntensity;
        }
      }

      // 1. Clear with #05050A Authentic Black
      ctx.fillStyle = '#05050a';
      ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

      // 2. Sky Gradient: Realistic deep blue-black night sky with subtle atmospheric depth
      const skyGrad = ctx.createLinearGradient(0, 0, 0, V_HEIGHT * 0.72);
      skyGrad.addColorStop(0, '#03060c');      // Deepest cosmic indigo-black at zenith
      skyGrad.addColorStop(0.28, '#060a14');   // Midnight blue-black
      skyGrad.addColorStop(0.60, '#09101d');   // Deep night sky with subtle atmospheric depth
      skyGrad.addColorStop(0.85, '#0d1422');   // Low atmospheric night horizon haze
      skyGrad.addColorStop(0.96, '#0f0a12');   // Subtle earthy horizon transition
      skyGrad.addColorStop(1.0, '#05050a');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT * 0.75);

      // 4. Authentic Photographic Full Moon in upper-right background sky
      const moonX = 1520;
      const moonY = 215;
      const moonRadius = 92; // Natural, photographic apparent celestial size

      // 3. Faint Cold Stars in the clear sky gaps (subtle, natural, fading near moon's atmospheric glow)
      ctx.save();
      for (const st of stars) {
        const dx = st.x - moonX;
        const dy = st.y - moonY;
        const distToMoon = Math.sqrt(dx * dx + dy * dy);
        // Dim stars near the moon due to natural atmospheric moonlight wash-out
        const moonWashout = Math.min(1.0, Math.max(0.0, (distToMoon - moonRadius * 1.1) / (moonRadius * 1.8)));
        const starAlpha = st.alpha * (0.75 + Math.sin(elapsed * 1.5 + st.x) * 0.25) * moonWashout;

        if (starAlpha > 0.02) {
          ctx.fillStyle = `rgba(205, 218, 235, ${starAlpha * 0.55})`;
          ctx.beginPath();
          ctx.arc(st.x, st.y, st.r * 0.85, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // 4a. Moon subtle atmospheric halo (gentle cool-white Rayleigh scattering, no neon glow, pure zero boundary)
      const moonHalo = ctx.createRadialGradient(moonX, moonY, moonRadius * 0.65, moonX, moonY, moonRadius * 2.6);
      moonHalo.addColorStop(0, 'rgba(210, 225, 245, 0.15)');
      moonHalo.addColorStop(0.30, 'rgba(170, 195, 230, 0.075)');
      moonHalo.addColorStop(0.65, 'rgba(110, 140, 185, 0.022)');
      moonHalo.addColorStop(0.90, 'rgba(50, 75, 115, 0.005)');
      moonHalo.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = moonHalo;
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonRadius * 2.6, 0, Math.PI * 2);
      ctx.fill();

      // 4b. Draw pre-rendered ultra-realistic astronomical full-moon disc
      if (!moonCanvasRef.current) {
        moonCanvasRef.current = createPhotographicMoonCanvas(1024);
      }
      ctx.drawImage(
        moonCanvasRef.current,
        moonX - moonRadius,
        moonY - moonRadius,
        moonRadius * 2,
        moonRadius * 2
      );

      // 5. Very Thin High-Altitude Cirrus Mist Drifting (Partially passing in front, DO NOT hide moon)
      ctx.save();
      for (let c = 0; c < 3; c++) {
        const cloudX = ((moonX - 220 + c * 220 + elapsed * 7 * (c % 2 === 0 ? 1 : 1.25)) % (V_WIDTH + 400)) - 200;
        const cloudY = moonY - 30 + c * 30;
        const cGrad = ctx.createRadialGradient(cloudX, cloudY, 15, cloudX, cloudY, 200);
        cGrad.addColorStop(0, 'rgba(10, 16, 26, 0.28)');
        cGrad.addColorStop(0.5, 'rgba(12, 18, 28, 0.10)');
        cGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = cGrad;
        ctx.beginPath();
        ctx.ellipse(cloudX, cloudY, 240, 45, -0.04, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 5b. Cinematic Distant Lightning Flash in the Sky (Cold pale-white / subtle blue-white bloom)
      if (activeFlash && flashIntensity > 0.01) {
        ctx.save();

        // Soft atmospheric radial bloom around distant lightning epicenter in sky
        const skyGlow = ctx.createRadialGradient(
          activeFlash.originX,
          activeFlash.originY,
          10,
          activeFlash.originX,
          activeFlash.originY,
          580
        );
        skyGlow.addColorStop(0, `rgba(235, 245, 255, ${flashIntensity * 0.70})`);
        skyGlow.addColorStop(0.28, `rgba(205, 225, 252, ${flashIntensity * 0.42})`);
        skyGlow.addColorStop(0.65, `rgba(165, 195, 240, ${flashIntensity * 0.15})`);
        skyGlow.addColorStop(1, 'rgba(5, 5, 10, 0)');
        ctx.fillStyle = skyGlow;
        ctx.beginPath();
        ctx.arc(activeFlash.originX, activeFlash.originY, 580, 0, Math.PI * 2);
        ctx.fill();

        // Cold pale-white delicate distant branching lightning bolt
        if (flashIntensity > 0.10) {
          ctx.strokeStyle = `rgba(240, 248, 255, ${flashIntensity * 0.88})`;
          ctx.shadowColor = 'rgba(215, 235, 255, 0.8)';
          ctx.shadowBlur = 8;
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          for (const b of activeFlash.branches) {
            ctx.moveTo(b.x1, b.y1);
            ctx.lineTo(b.x2, b.y2);
          }
          ctx.stroke();
        }

        ctx.restore();
      }

      // 6. Distant Forest Treeline & Dark Canopy Silhouettes
      ctx.fillStyle = '#05050a';
      ctx.beginPath();
      ctx.moveTo(0, V_HEIGHT * 0.65);
      for (let x = 0; x <= V_WIDTH; x += 60) {
        const treeH = Math.sin(x * 0.012) * 45 + Math.cos(x * 0.024) * 30 + (x < 600 || x > 1320 ? 90 : 35);
        ctx.lineTo(x, V_HEIGHT * 0.58 - treeH);
      }
      ctx.lineTo(V_WIDTH, V_HEIGHT * 0.65);
      ctx.lineTo(0, V_HEIGHT * 0.65);
      ctx.fill();

      // 7. Ground / Terrain Foundation (#05050A foundation, #0D2118 subtle dark green decay)
      const groundGrad = ctx.createLinearGradient(0, V_HEIGHT * 0.58, 0, V_HEIGHT);
      groundGrad.addColorStop(0, '#05050a');
      groundGrad.addColorStop(0.2, '#0d2118'); // extremely subtle Aztec green decay
      groundGrad.addColorStop(0.5, '#070908');
      groundGrad.addColorStop(0.85, '#05050a');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, V_HEIGHT * 0.58, V_WIDTH, V_HEIGHT * 0.42);

      // 8. THE ABANDONED INDIAN / COLONIAL BUNGALOW (Centered in Background, z ~ 0.55)
      // Base coordinates: centered horizontally, width ~ 720, height ~ 340
      const bW = 740;
      const bH = 340;
      const bX = (V_WIDTH - bW) / 2;
      const bY = V_HEIGHT * 0.58 - bH + 20;

      // 8a. Bungalow Main Body: Weathered dark plaster with deep maroon tones (#450F10, #6B1310)
      const wallGrad = ctx.createLinearGradient(bX, bY, bX, bY + bH);
      wallGrad.addColorStop(0, '#2e0a0d');
      wallGrad.addColorStop(0.4, '#450f10');
      wallGrad.addColorStop(0.7, '#6b1310');
      wallGrad.addColorStop(1, '#05050a');
      ctx.fillStyle = wallGrad;
      ctx.fillRect(bX + 70, bY + 110, bW - 140, bH - 110);

      // Left wing extension (Colonial two-story bungalow layout)
      ctx.fillStyle = '#1c0709';
      ctx.fillRect(bX, bY + 140, 110, bH - 140);
      // Right wing extension
      ctx.fillRect(bX + bW - 110, bY + 140, 110, bH - 140);

      // 8b. Mangalore Tile Sloping Roofs & Gables (Aged dark maroon tiles #450F10 & authentic black)
      ctx.fillStyle = '#0a0507';
      ctx.beginPath();
      // Main central high hip-roof
      ctx.moveTo(bX + 50, bY + 115);
      ctx.lineTo(bX + bW * 0.5, bY + 18);
      ctx.lineTo(bX + bW - 50, bY + 115);
      ctx.closePath();
      ctx.fill();

      // Ridge crest tile detail
      ctx.strokeStyle = '#450f10';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(bX + bW * 0.4, bY + 18);
      ctx.lineTo(bX + bW * 0.6, bY + 18);
      ctx.stroke();

      // Left wing gable roof
      ctx.fillStyle = '#070406';
      ctx.beginPath();
      ctx.moveTo(bX - 10, bY + 145);
      ctx.lineTo(bX + 55, bY + 85);
      ctx.lineTo(bX + 115, bY + 145);
      ctx.closePath();
      ctx.fill();

      // Right wing gable roof
      ctx.beginPath();
      ctx.moveTo(bX + bW - 115, bY + 145);
      ctx.lineTo(bX + bW - 55, bY + 85);
      ctx.lineTo(bX + bW + 10, bY + 145);
      ctx.closePath();
      ctx.fill();

      // Weathered cornices, moldings & shadow under eaves
      ctx.fillStyle = '#05050a';
      ctx.fillRect(bX + 40, bY + 115, bW - 80, 12);
      ctx.fillRect(bX - 10, bY + 145, 125, 10);
      ctx.fillRect(bX + bW - 115, bY + 145, 125, 10);

      // 8c. Colonial Verandah Colonnade & Dark Teak Pillars
      const pillarCount = 6;
      const verandaLeft = bX + 120;
      const verandaRight = bX + bW - 120;
      const pillarSpacing = (verandaRight - verandaLeft) / (pillarCount - 1);
      ctx.fillStyle = '#140e0d'; // Dark weathered teak wood
      for (let p = 0; p < pillarCount; p++) {
        const px = verandaLeft + p * pillarSpacing;
        ctx.fillRect(px - 6, bY + 225, 12, bH - 225);
        // Pillar capitals and bases
        ctx.fillStyle = '#05050a';
        ctx.fillRect(px - 10, bY + 220, 20, 8);
        ctx.fillRect(px - 10, bY + bH - 12, 20, 12);
        ctx.fillStyle = '#140e0d';
      }

      // 8d. Large Dark Windows with broken shutters
      const winY_upper = bY + 140;
      const winY_lower = bY + 235;
      const winPositionsUpper = [bX + 160, bX + 270, bX + bW - 290, bX + bW - 180];

      for (let i = 0; i < winPositionsUpper.length; i++) {
        const wx = winPositionsUpper[i];
        // Deep black window recess
        ctx.fillStyle = '#05050a';
        ctx.fillRect(wx - 24, winY_upper, 48, 65);

        // A few windows have very subtle supernatural red glow (#860111 / #800B19)
        if (i === 1 || i === 2) {
          const redGlow = Math.sin(elapsed * 1.8 + i) * 0.15 + 0.65;
          ctx.fillStyle = `rgba(134, 1, 17, ${0.45 * redGlow})`;
          ctx.fillRect(wx - 20, winY_upper + 4, 40, 57);

          // Subtle supernatural window aura spilling outward
          const winAura = ctx.createRadialGradient(wx, winY_upper + 30, 5, wx, winY_upper + 30, 48);
          winAura.addColorStop(0, 'rgba(128, 11, 25, 0.45)');
          winAura.addColorStop(1, 'rgba(5, 5, 10, 0)');
          ctx.fillStyle = winAura;
          ctx.beginPath();
          ctx.arc(wx, winY_upper + 30, 48, 0, Math.PI * 2);
          ctx.fill();
        }

        // Wooden mullions
        ctx.strokeStyle = '#05050a';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(wx - 24, winY_upper, 48, 65);
        ctx.beginPath();
        ctx.moveTo(wx, winY_upper);
        ctx.lineTo(wx, winY_upper + 65);
        ctx.moveTo(wx - 24, winY_upper + 32);
        ctx.lineTo(wx + 24, winY_upper + 32);
        ctx.stroke();

        // Broken/crooked colonial shutters
        ctx.fillStyle = '#18100e';
        ctx.fillRect(wx - 42, winY_upper - 2, 16, 68);
        ctx.fillRect(wx + 26, winY_upper - 2, 16, 68);
      }

      // 8e. Central Colonial Entrance Doorway (Double Teak Doors with weak warm/red glow)
      const doorX = V_WIDTH * 0.5;
      const doorY = bY + 225;
      const doorW = 76;
      const doorH = 115;

      // Deep door recess
      ctx.fillStyle = '#05050a';
      ctx.fillRect(doorX - doorW * 0.5, doorY, doorW, doorH);

      // Weak warm/red light leaking through door crack & transom (#800B19 & warm amber)
      const doorGlow = Math.sin(elapsed * 2.2) * 0.12 + 0.55;
      const porchLantern = ctx.createRadialGradient(doorX, doorY + 15, 2, doorX, doorY + 30, 110);
      porchLantern.addColorStop(0, `rgba(217, 110, 50, ${0.45 * doorGlow})`);
      porchLantern.addColorStop(0.35, `rgba(128, 11, 25, ${0.40 * doorGlow})`);
      porchLantern.addColorStop(0.85, 'rgba(69, 15, 16, 0.12)');
      porchLantern.addColorStop(1, 'rgba(5, 5, 10, 0)');
      ctx.fillStyle = porchLantern;
      ctx.beginPath();
      ctx.arc(doorX, doorY + 30, 110, 0, Math.PI * 2);
      ctx.fill();

      // Weathered wooden door panels
      ctx.fillStyle = '#160e0a';
      ctx.fillRect(doorX - doorW * 0.5 + 4, doorY + 12, doorW * 0.5 - 6, doorH - 12);
      ctx.fillRect(doorX + 2, doorY + 12, doorW * 0.5 - 6, doorH - 12);

      // Central sinister vertical crack of devil red light
      ctx.fillStyle = `rgba(134, 1, 17, ${0.75 * doorGlow})`;
      ctx.fillRect(doorX - 1.5, doorY + 15, 3, doorH - 15);

      // 8f. Decaying wall plaster cracks & damp stains (#450F10 & #0D2118)
      ctx.strokeStyle = '#05050a';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      // Wall cracks
      ctx.moveTo(bX + 190, bY + 130);
      ctx.lineTo(bX + 215, bY + 175);
      ctx.lineTo(bX + 205, bY + 210);
      ctx.moveTo(bX + bW - 220, bY + 140);
      ctx.lineTo(bX + bW - 200, bY + 185);
      ctx.lineTo(bX + bW - 215, bY + 230);
      ctx.stroke();

      // 9. Abandoned Wet Pathway Leading Toward Entrance
      // Perspective triangle from bottom center tapering to bungalow entrance
      const pathTopX = V_WIDTH * 0.5;
      const pathTopY = bY + bH;
      const pathTopW = 90;
      const pathBottomW = 760;
      const pathBottomY = V_HEIGHT;

      // Pathway surface: cracked mud, gravel, wet stone (#450F10 undertone, #05050A foundation)
      const pathGrad = ctx.createLinearGradient(0, pathTopY, 0, pathBottomY);
      pathGrad.addColorStop(0, '#120709');
      pathGrad.addColorStop(0.35, '#220b0e');
      pathGrad.addColorStop(0.7, '#140a0b');
      pathGrad.addColorStop(1, '#05050a');
      ctx.fillStyle = pathGrad;
      ctx.beginPath();
      ctx.moveTo(pathTopX - pathTopW * 0.5, pathTopY);
      ctx.lineTo(pathTopX + pathTopW * 0.5, pathTopY);
      ctx.lineTo(V_WIDTH * 0.5 + pathBottomW * 0.5, pathBottomY);
      ctx.lineTo(V_WIDTH * 0.5 - pathBottomW * 0.5, pathBottomY);
      ctx.closePath();
      ctx.fill();

      // Subtle crimson & pale moonlight reflections on wet puddles along the pathway
      ctx.save();
      const puddles: [number, number, number, number, boolean][] = [
        [V_WIDTH * 0.48, V_HEIGHT * 0.65, 45, 12, true],
        [V_WIDTH * 0.53, V_HEIGHT * 0.72, 75, 16, true],
        [V_WIDTH * 0.44, V_HEIGHT * 0.82, 110, 22, false],
        [V_WIDTH * 0.56, V_HEIGHT * 0.88, 140, 26, true],
      ];
      for (const [px, py, prx, pry, isCrimson] of puddles) {
        const pGrad = ctx.createRadialGradient(px, py, 2, px, py, prx);
        if (isCrimson) {
          pGrad.addColorStop(0, 'rgba(128, 11, 25, 0.35)');
          pGrad.addColorStop(0.45, 'rgba(107, 19, 16, 0.18)');
          pGrad.addColorStop(1, 'rgba(5, 5, 10, 0)');
        } else {
          pGrad.addColorStop(0, 'rgba(216, 208, 200, 0.28)');
          pGrad.addColorStop(0.5, 'rgba(21, 56, 50, 0.12)');
          pGrad.addColorStop(1, 'rgba(5, 5, 10, 0)');
        }
        ctx.fillStyle = pGrad;
        ctx.beginPath();
        ctx.ellipse(px, py, prx, pry, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 10. Gnarled, Leafless Trees Surrounding the House (Silhouettes against sky and moon)
      ctx.strokeStyle = '#05050a';
      ctx.fillStyle = '#05050a';

      // Left massive dead banyan tree
      const drawBranch = (x: number, y: number, length: number, angle: number, depth: number) => {
        if (depth === 0) return;
        const x2 = x + Math.cos(angle) * length;
        const y2 = y + Math.sin(angle) * length;
        ctx.lineWidth = depth * 3.5;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        drawBranch(x2, y2, length * 0.72, angle - 0.38, depth - 1);
        drawBranch(x2, y2, length * 0.68, angle + 0.42, depth - 1);
      };

      // Left foreground tree trunk & canopy
      ctx.lineWidth = 38;
      ctx.beginPath();
      ctx.moveTo(120, V_HEIGHT);
      ctx.quadraticCurveTo(180, V_HEIGHT * 0.65, 240, V_HEIGHT * 0.35);
      ctx.stroke();
      drawBranch(240, V_HEIGHT * 0.35, 140, -Math.PI / 2.2, 5);

      // Right tree framing the moon
      ctx.lineWidth = 32;
      ctx.beginPath();
      ctx.moveTo(V_WIDTH - 140, V_HEIGHT);
      ctx.quadraticCurveTo(V_WIDTH - 220, V_HEIGHT * 0.62, V_WIDTH - 280, V_HEIGHT * 0.38);
      ctx.stroke();
      drawBranch(V_WIDTH - 280, V_HEIGHT * 0.38, 130, -Math.PI / 1.85, 5);

      // Thin twisted branches cutting right across the full moon
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(moonX + 160, moonY - 90);
      ctx.lineTo(moonX - 40, moonY - 20);
      ctx.lineTo(moonX - 90, moonY + 45);
      ctx.stroke();

      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(moonX - 40, moonY - 20);
      ctx.lineTo(moonX - 60, moonY - 60);
      ctx.stroke();

      // 11. Old Iron Entrance Gates on Both Sides & Stone/Brick Pillars
      const pillarW = 85;
      const pillarH = 360;
      const pillarY = V_HEIGHT * 0.58;
      const leftPillarX = V_WIDTH * 0.22;
      const rightPillarX = V_WIDTH * 0.78 - pillarW;

      // Stone Pillars (Weathered dark stone with deep maroon fissure cracks)
      const pillarGrad = ctx.createLinearGradient(0, pillarY, 0, pillarY + pillarH);
      pillarGrad.addColorStop(0, '#1a1013');
      pillarGrad.addColorStop(0.5, '#450f10');
      pillarGrad.addColorStop(1, '#05050a');

      // Left Pillar
      ctx.fillStyle = pillarGrad;
      ctx.fillRect(leftPillarX, pillarY, pillarW, pillarH);
      // Pyramid cap
      ctx.fillStyle = '#05050a';
      ctx.beginPath();
      ctx.moveTo(leftPillarX - 8, pillarY);
      ctx.lineTo(leftPillarX + pillarW * 0.5, pillarY - 32);
      ctx.lineTo(leftPillarX + pillarW + 8, pillarY);
      ctx.closePath();
      ctx.fill();

      // Right Pillar
      ctx.fillStyle = pillarGrad;
      ctx.fillRect(rightPillarX, pillarY, pillarW, pillarH);
      // Pyramid cap
      ctx.beginPath();
      ctx.moveTo(rightPillarX - 8, pillarY);
      ctx.lineTo(rightPillarX + pillarW * 0.5, pillarY - 32);
      ctx.lineTo(rightPillarX + pillarW + 8, pillarY);
      ctx.closePath();
      ctx.fill();

      // Wrought Iron Spiked Gate Panels (Ajar, receding outward)
      const drawGatePanel = (startX: number, endX: number, isLeft: boolean) => {
        ctx.strokeStyle = '#0e0b0d';
        ctx.lineWidth = 6;
        ctx.strokeRect(Math.min(startX, endX), pillarY + 40, Math.abs(endX - startX), pillarH - 60);

        // Vertical bars
        const bars = 10;
        const bStep = (endX - startX) / bars;
        ctx.lineWidth = 3.5;
        for (let b = 1; b < bars; b++) {
          const bx = startX + b * bStep;
          ctx.beginPath();
          ctx.moveTo(bx, pillarY + pillarH - 20);
          ctx.lineTo(bx, pillarY + 20);
          // Spear tip
          ctx.lineTo(bx - 3, pillarY + 28);
          ctx.lineTo(bx, pillarY + 12);
          ctx.lineTo(bx + 3, pillarY + 28);
          ctx.lineTo(bx, pillarY + 20);
          ctx.stroke();
        }

        // Horizontal crossbars
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(startX, pillarY + 100);
        ctx.lineTo(endX, pillarY + 100);
        ctx.moveTo(startX, pillarY + 260);
        ctx.lineTo(endX, pillarY + 260);
        ctx.stroke();
      };

      drawGatePanel(leftPillarX, leftPillarX - 180, true);
      drawGatePanel(rightPillarX + pillarW, rightPillarX + pillarW + 180, false);

      // Overgrown creeping vines on pillars (#0D2118 / #153832 Aztec Green decay)
      ctx.strokeStyle = '#0d2118';
      ctx.lineWidth = 2.5;
      for (const px of [leftPillarX + 25, rightPillarX + 50]) {
        ctx.beginPath();
        ctx.moveTo(px, pillarY + pillarH);
        for (let v = 0; v < 8; v++) {
          ctx.lineTo(px + Math.sin(v * 1.5) * 14, pillarY + pillarH - v * 40);
        }
        ctx.stroke();
      }

      // 12. Animated Volumetric Fog & Mist Drifting Across Ground
      ctx.save();
      for (const wisp of fogWisps) {
        wisp.x += wisp.vx;
        if (wisp.x - wisp.radius > V_WIDTH) {
          wisp.x = -wisp.radius;
        }

        const fogGrad = ctx.createRadialGradient(wisp.x, wisp.y, 10, wisp.x, wisp.y, wisp.radius);
        fogGrad.addColorStop(0, `rgba(69, 15, 16, ${wisp.alpha * 1.2})`);
        fogGrad.addColorStop(0.45, `rgba(13, 33, 24, ${wisp.alpha * 0.8})`);
        fogGrad.addColorStop(1, 'rgba(5, 5, 10, 0)');
        ctx.fillStyle = fogGrad;
        ctx.beginPath();
        ctx.arc(wisp.x, wisp.y, wisp.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 12b. Cinematic Environmental Lightning Illumination
      // Momentarily illuminates bungalow silhouette, trees, windows, gates, and pathway during flash.
      // Immediately returns to dark horror lighting after flash (duration 0.08 - 0.15s).
      if (flashIntensity > 0.005) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        // Soft cold pale-white / subtle blue-white atmospheric wash across environment
        const envWash = ctx.createLinearGradient(0, 0, 0, V_HEIGHT);
        envWash.addColorStop(0, `rgba(220, 235, 255, ${flashIntensity * 0.40})`);
        envWash.addColorStop(0.48, `rgba(195, 220, 250, ${flashIntensity * 0.32})`);
        envWash.addColorStop(0.82, `rgba(170, 200, 235, ${flashIntensity * 0.18})`);
        envWash.addColorStop(1, `rgba(145, 175, 215, ${flashIntensity * 0.09})`);
        ctx.fillStyle = envWash;
        ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

        // Soft bloom centered around the bungalow and midground trees
        const sceneBloom = ctx.createRadialGradient(
          bX + bW * 0.5,
          bY + bH * 0.45,
          60,
          bX + bW * 0.5,
          bY + bH * 0.45,
          620
        );
        sceneBloom.addColorStop(0, `rgba(215, 232, 255, ${flashIntensity * 0.28})`);
        sceneBloom.addColorStop(0.55, `rgba(180, 210, 245, ${flashIntensity * 0.12})`);
        sceneBloom.addColorStop(1, 'rgba(5, 5, 10, 0)');
        ctx.fillStyle = sceneBloom;
        ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

        ctx.restore();
      }

      // 13. Deep Vignette & Atmospheric Film Grain Shadows (#05050A)
      const vignette = ctx.createRadialGradient(
        V_WIDTH * 0.5,
        V_HEIGHT * 0.5,
        V_WIDTH * 0.28,
        V_WIDTH * 0.5,
        V_HEIGHT * 0.5,
        V_WIDTH * 0.72
      );
      vignette.addColorStop(0, 'rgba(5, 5, 10, 0)');
      vignette.addColorStop(0.65, 'rgba(5, 5, 10, 0.55)');
      vignette.addColorStop(1, 'rgba(5, 5, 10, 0.95)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

      // Loop
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      id="opening-screen"
      className={`fixed inset-0 z-50 flex items-center justify-center select-none bg-[#05050a] transition-opacity duration-1000 ${
        isEntering ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* 16:9 Aspect Ratio Frame Container */}
      <div className="relative w-full h-full max-w-[177.78vh] max-h-[56.25vw] aspect-video flex items-center justify-center overflow-hidden shadow-2xl">
        {/* Rendered 16:9 Cinematic Psychological-Horror Background Canvas */}
        <canvas
          ref={canvasRef}
          width={1920}
          height={1080}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        {/* Film grain subtle overlay */}
        <div className="absolute inset-0 pointer-events-none horror-film-grain" />

        {/* Subtle crimson horror aura behind title */}
        <div className="absolute inset-0 pointer-events-none bg-radial from-[#800b19]/15 via-transparent to-transparent animate-pulse" />

        {/* Center Title & Enter Button Content */}
        <div className="relative z-20 flex flex-col items-center text-center px-4 max-w-5xl mx-auto -translate-y-4">
          {/* Subtle scratches/glow element behind title */}
          <div className="relative mb-8 sm:mb-12 flex flex-col items-center">
            {/* Eerie dark crimson glow backdrop */}
            <div className="absolute -inset-10 bg-radial from-[#800b19]/30 via-[#450f10]/15 to-transparent blur-2xl pointer-events-none" />

            {/* Line 1: THE HOUSE */}
            <h1
              className="relative text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-[0.24em] uppercase text-[#D8D0C8] drop-shadow-[0_4px_18px_rgba(5,5,10,0.98)] font-horror-title select-none leading-none mb-1 sm:mb-2 transition-transform duration-700"
              style={{
                textShadow:
                  '0 0 12px rgba(125, 22, 22, 0.45), 0 4px 10px rgba(5, 5, 10, 0.95), -1px -1px 0 #450f10',
              }}
            >
              THE HOUSE
            </h1>

            {/* Line 2: OF DEVIL (More threatening, sharper, deeper crimson glow aura) */}
            <h1
              className="relative text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-[0.28em] uppercase text-[#D8D0C8] drop-shadow-[0_6px_24px_rgba(134,1,17,0.75)] font-horror-title select-none leading-none animate-horror-glitch"
              style={{
                textShadow:
                  '0 0 16px rgba(134, 1, 17, 0.75), 0 0 32px rgba(128, 11, 25, 0.55), 0 5px 14px rgba(5, 5, 10, 0.98), -1px 1px 0 #6b1310',
              }}
            >
              OF DEVIL
            </h1>

            {/* Tiny distressed decorative underline with blood-red accents (#800B19) */}
            <div className="flex items-center justify-center space-x-3 mt-4 sm:mt-5 opacity-85">
              <span className="w-12 sm:w-24 h-[1px] bg-gradient-to-r from-transparent via-[#800b19] to-transparent" />
              <span className="w-1.5 h-1.5 rotate-45 bg-[#800b19] shadow-[0_0_8px_rgba(134,1,17,0.9)]" />
              <span className="w-12 sm:w-24 h-[1px] bg-gradient-to-l from-transparent via-[#800b19] to-transparent" />
            </div>
          </div>

          {/* Rectangular [ ENTER ] Button */}
          <button
            id="btn-enter-experience"
            onClick={handleEnterClick}
            onMouseEnter={() => horrorAudio.playMenuHover()}
            className="group relative px-12 py-3.5 sm:px-14 sm:py-4 bg-[#05050a]/85 hover:bg-[#05050a]/95 border border-[#6b1310] hover:border-[#800b19] rounded-none text-[#D8D0C8] hover:text-white tracking-[0.38em] text-sm sm:text-base font-serif uppercase transition-all duration-500 shadow-[0_0_25px_rgba(5,5,10,0.95)] hover:shadow-[0_0_35px_rgba(128,11,25,0.65)] cursor-pointer overflow-hidden active:scale-95"
          >
            {/* Subtle red glow pulse on hover (#800B19) */}
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-[#800b19]/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <span className="relative z-10 font-medium drop-shadow-[0_2px_4px_rgba(5,5,10,0.9)]">
              [ ENTER ]
            </span>
          </button>
        </div>

        {/* 16:9 Letterbox Bars for Ultrawide displays if needed */}
        <div className="absolute top-0 inset-x-0 h-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 h-4 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
      </div>
    </div>
  );
};
