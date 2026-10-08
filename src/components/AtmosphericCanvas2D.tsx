import React, { useEffect, useRef } from 'react';
import { GameState } from '../types';
import { horrorAudio } from '../audio/HorrorAudioManager';

interface AtmosphericCanvas2DProps {
  gameState: GameState;
  flashlightOn: boolean;
  lightningActive: boolean;
  isInspecting: boolean;
  distanceToGate: number;
  onInspectGate: () => void;
  onShakeGate: () => void;
  interactive?: boolean;
}

interface Raindrop {
  x: number;
  y: number;
  speed: number;
  length: number;
  opacity: number;
}

export const AtmosphericCanvas2D: React.FC<AtmosphericCanvas2DProps> = ({
  gameState,
  flashlightOn,
  lightningActive,
  isInspecting,
  distanceToGate,
  onInspectGate,
  onShakeGate,
  interactive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePosRef = useRef({ x: 0.5, y: 0.5 });
  const isHoveringGateRef = useRef(false);
  const animFrameRef = useRef<number | null>(null);

  // Raindrop particles
  const raindropsRef = useRef<Raindrop[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    // Initialize raindrops
    const count = 140;
    raindropsRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      speed: 12 + Math.random() * 10,
      length: 15 + Math.random() * 20,
      opacity: 0.15 + Math.random() * 0.35,
    }));

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        width = canvas.width = entry.contentRect.width;
        height = canvas.height = entry.contentRect.height;
      }
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    let fogOffset = 0;
    let padlockShake = 0;

    const render = () => {
      fogOffset += 0.25;
      if (padlockShake > 0) padlockShake = Math.max(0, padlockShake - 0.05);

      // 1. Dark stormy background
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#04070a');
      skyGrad.addColorStop(0.5, '#091017');
      skyGrad.addColorStop(1, '#05080c');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Veiled Moon behind clouds
      const moonX = width * 0.72;
      const moonY = height * 0.22;
      const moonGrad = ctx.createRadialGradient(moonX, moonY, 10, moonX, moonY, 140);
      moonGrad.addColorStop(0, 'rgba(215, 230, 255, 0.3)');
      moonGrad.addColorStop(0.3, 'rgba(160, 185, 220, 0.12)');
      moonGrad.addColorStop(1, 'rgba(10, 16, 24, 0)');
      ctx.fillStyle = moonGrad;
      ctx.fillRect(moonX - 140, moonY - 140, 280, 280);

      ctx.beginPath();
      ctx.arc(moonX, moonY, 24, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(230, 240, 255, 0.45)';
      ctx.fill();

      // 3. Moving Atmospheric Mist Bands
      ctx.save();
      for (let i = 0; i < 3; i++) {
        const mistY = height * (0.35 + i * 0.18);
        const mistGrad = ctx.createLinearGradient(0, mistY - 60, 0, mistY + 60);
        mistGrad.addColorStop(0, 'rgba(15, 25, 35, 0)');
        mistGrad.addColorStop(0.5, `rgba(25, 38, 50, ${0.12 - i * 0.02})`);
        mistGrad.addColorStop(1, 'rgba(15, 25, 35, 0)');
        ctx.fillStyle = mistGrad;

        const offsetX = (fogOffset * (0.8 + i * 0.4)) % width;
        ctx.fillRect(-width + offsetX, mistY - 60, width * 3, 120);
      }
      ctx.restore();

      // 4. Distant Mansion Silhouette
      const mansionW = Math.min(width * 0.45, 420);
      const mansionH = mansionW * 0.55;
      const mansionX = width * 0.5 - mansionW * 0.5;
      const mansionY = height * 0.52 - mansionH;

      ctx.fillStyle = '#06090d';
      ctx.beginPath();
      // Main central hall
      ctx.rect(mansionX + mansionW * 0.25, mansionY + mansionH * 0.3, mansionW * 0.5, mansionH * 0.7);
      // Left tower
      ctx.rect(mansionX, mansionY + mansionH * 0.2, mansionW * 0.25, mansionH * 0.8);
      // Right tower
      ctx.rect(mansionX + mansionW * 0.75, mansionY + mansionH * 0.2, mansionW * 0.25, mansionH * 0.8);
      ctx.fill();

      // Roof gables & chimneys
      ctx.beginPath();
      // Left tower roof
      ctx.moveTo(mansionX - 10, mansionY + mansionH * 0.2);
      ctx.lineTo(mansionX + mansionW * 0.125, mansionY);
      ctx.lineTo(mansionX + mansionW * 0.25 + 10, mansionY + mansionH * 0.2);
      // Center roof
      ctx.moveTo(mansionX + mansionW * 0.22, mansionY + mansionH * 0.3);
      ctx.lineTo(mansionX + mansionW * 0.5, mansionY + mansionH * 0.08);
      ctx.lineTo(mansionX + mansionW * 0.78, mansionY + mansionH * 0.3);
      // Right tower roof
      ctx.moveTo(mansionX + mansionW * 0.75 - 10, mansionY + mansionH * 0.2);
      ctx.lineTo(mansionX + mansionW * 0.875, mansionY);
      ctx.lineTo(mansionX + mansionW + 10, mansionY + mansionH * 0.2);
      // Chimneys
      ctx.rect(mansionX + mansionW * 0.35, mansionY + mansionH * 0.05, 12, 35);
      ctx.rect(mansionX + mansionW * 0.62, mansionY + mansionH * 0.05, 12, 35);
      ctx.fill();

      // Eerie flickering attic window candle
      const candleFlicker = Math.sin(Date.now() * 0.008) * 0.2 + 0.5;
      ctx.fillStyle = `rgba(245, 158, 11, ${0.45 * candleFlicker})`;
      ctx.fillRect(mansionX + mansionW * 0.48, mansionY + mansionH * 0.22, 14, 20);

      // 5. Twisted Dead Trees on flanks
      ctx.fillStyle = '#05070a';
      // Left tree
      ctx.beginPath();
      ctx.moveTo(0, height * 0.8);
      ctx.lineTo(width * 0.18, height * 0.45);
      ctx.lineTo(width * 0.12, height * 0.2);
      ctx.lineTo(width * 0.08, height * 0.15);
      ctx.lineTo(width * 0.02, height * 0.1);
      ctx.stroke();
      // Tree trunk base
      ctx.beginPath();
      ctx.moveTo(0, height * 0.95);
      ctx.lineTo(width * 0.14, height * 0.65);
      ctx.lineTo(width * 0.1, height * 0.4);
      ctx.lineTo(width * 0.04, height * 0.25);
      ctx.lineWidth = 18;
      ctx.strokeStyle = '#040608';
      ctx.stroke();

      // Right tree base
      ctx.beginPath();
      ctx.moveTo(width, height * 0.95);
      ctx.lineTo(width * 0.86, height * 0.65);
      ctx.lineTo(width * 0.9, height * 0.4);
      ctx.lineTo(width * 0.96, height * 0.25);
      ctx.lineWidth = 18;
      ctx.stroke();

      // 6. Ground & Stone Road
      const groundGrad = ctx.createLinearGradient(0, height * 0.55, 0, height);
      groundGrad.addColorStop(0, '#060a0f');
      groundGrad.addColorStop(0.4, '#0a0f15');
      groundGrad.addColorStop(1, '#030507');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, height * 0.55, width, height * 0.45);

      // Muddy path perspective
      ctx.fillStyle = 'rgba(18, 22, 28, 0.6)';
      ctx.beginPath();
      ctx.moveTo(width * 0.42, height * 0.55);
      ctx.lineTo(width * 0.58, height * 0.55);
      ctx.lineTo(width * 0.82, height);
      ctx.lineTo(width * 0.18, height);
      ctx.closePath();
      ctx.fill();

      // 7. Victorian Wrought Iron Gate
      const gateCenter = width * 0.5;
      const gateWidth = Math.min(width * 0.65, 680);
      const gateLeft = gateCenter - gateWidth * 0.5;
      const gateRight = gateCenter + gateWidth * 0.5;
      const gateTop = height * 0.38 - (isInspecting ? 50 : 0);
      const gateBottom = height * 0.78;

      // Stone Pillars on Left & Right
      const pillarW = 48;
      ctx.fillStyle = '#0f141b';
      // Left pillar
      ctx.fillRect(gateLeft - pillarW, gateTop - 25, pillarW, gateBottom - gateTop + 35);
      // Right pillar
      ctx.fillRect(gateRight, gateTop - 25, pillarW, gateBottom - gateTop + 35);

      // Pillar caps
      ctx.fillStyle = '#161e27';
      ctx.fillRect(gateLeft - pillarW - 8, gateTop - 36, pillarW + 16, 14);
      ctx.fillRect(gateRight - 8, gateTop - 36, pillarW + 16, 14);

      // Gate Frame & Vertical Iron Bars
      ctx.strokeStyle = '#182029';
      ctx.lineWidth = 4.5;
      ctx.fillStyle = '#0d1217';

      // Left gate door
      ctx.strokeRect(gateLeft, gateTop, gateWidth * 0.5, gateBottom - gateTop);
      // Right gate door
      ctx.strokeRect(gateCenter, gateTop, gateWidth * 0.5, gateBottom - gateTop);

      // Vertical Iron Spikes
      const barCount = 18;
      const barSpacing = (gateWidth * 0.5) / barCount;
      ctx.lineWidth = 3;

      for (let i = 1; i < barCount; i++) {
        // Left door bars
        const bx1 = gateLeft + i * barSpacing;
        ctx.beginPath();
        ctx.moveTo(bx1, gateBottom);
        ctx.lineTo(bx1, gateTop - 15);
        // Spiked spear tip
        ctx.lineTo(bx1 - 3, gateTop - 8);
        ctx.lineTo(bx1, gateTop - 24);
        ctx.lineTo(bx1 + 3, gateTop - 8);
        ctx.lineTo(bx1, gateTop - 15);
        ctx.stroke();

        // Right door bars
        const bx2 = gateCenter + i * barSpacing;
        ctx.beginPath();
        ctx.moveTo(bx2, gateBottom);
        ctx.lineTo(bx2, gateTop - 15);
        ctx.lineTo(bx2 - 3, gateTop - 8);
        ctx.lineTo(bx2, gateTop - 24);
        ctx.lineTo(bx2 + 3, gateTop - 8);
        ctx.lineTo(bx2, gateTop - 15);
        ctx.stroke();
      }

      // Horizontal Crossbeams
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#131a22';
      ctx.beginPath();
      ctx.moveTo(gateLeft, gateTop + (gateBottom - gateTop) * 0.3);
      ctx.lineTo(gateRight, gateTop + (gateBottom - gateTop) * 0.3);
      ctx.moveTo(gateLeft, gateTop + (gateBottom - gateTop) * 0.7);
      ctx.lineTo(gateRight, gateTop + (gateBottom - gateTop) * 0.7);
      ctx.stroke();

      // 8. Heavy Iron Chain & Padlock in center
      const chainY = gateTop + (gateBottom - gateTop) * 0.52;
      const shakeOffset = Math.sin(Date.now() * 0.05) * padlockShake * 6;

      ctx.save();
      ctx.translate(gateCenter + shakeOffset, chainY);

      // Wrapped Chain loops
      ctx.strokeStyle = '#2b323c';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.ellipse(-18, 0, 22, 12, Math.PI / 6, 0, Math.PI * 2);
      ctx.ellipse(18, 0, 22, 12, -Math.PI / 6, 0, Math.PI * 2);
      ctx.stroke();

      // Padlock Shackle
      ctx.strokeStyle = '#5a626d';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, -10, 14, Math.PI, 0);
      ctx.stroke();

      // Brass Padlock Body
      ctx.fillStyle = isHoveringGateRef.current ? '#b45309' : '#78350f';
      ctx.fillRect(-16, -2, 32, 28);
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-16, -2, 32, 28);

      // Keyhole
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.arc(0, 8, 3.5, 0, Math.PI * 2);
      ctx.rect(-1.5, 8, 3, 7);
      ctx.fill();

      ctx.restore();

      // 9. Interactive Flashlight Cone
      if (flashlightOn) {
        const mouseX = mousePosRef.current.x * width;
        const mouseY = mousePosRef.current.y * height;

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        // Flashlight hot spot
        const flashGrad = ctx.createRadialGradient(mouseX, mouseY, 15, mouseX, mouseY, Math.min(width, height) * 0.45);
        flashGrad.addColorStop(0, 'rgba(255, 245, 215, 0.42)');
        flashGrad.addColorStop(0.35, 'rgba(235, 215, 175, 0.18)');
        flashGrad.addColorStop(0.7, 'rgba(180, 160, 120, 0.05)');
        flashGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = flashGrad;
        ctx.fillRect(0, 0, width, height);

        // Flashlight beam shaft from bottom corner
        ctx.beginPath();
        ctx.moveTo(width * 0.65, height);
        ctx.lineTo(mouseX - 120, mouseY);
        ctx.lineTo(mouseX + 120, mouseY);
        ctx.closePath();
        const beamGrad = ctx.createLinearGradient(width * 0.65, height, mouseX, mouseY);
        beamGrad.addColorStop(0, 'rgba(255, 240, 200, 0.09)');
        beamGrad.addColorStop(1, 'rgba(255, 240, 200, 0.01)');
        ctx.fillStyle = beamGrad;
        ctx.fill();

        ctx.restore();
      } else {
        // Darkness overlay when flashlight is OFF
        ctx.save();
        ctx.fillStyle = 'rgba(2, 4, 7, 0.58)';
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }

      // 10. Lightning Flash
      if (lightningActive) {
        ctx.save();
        ctx.fillStyle = 'rgba(215, 235, 255, 0.78)';
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }

      // 11. Raindrop Animation
      ctx.save();
      ctx.strokeStyle = 'rgba(180, 205, 230, 0.4)';
      ctx.lineWidth = 1.2;

      for (const drop of raindropsRef.current) {
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - 3, drop.y + drop.length);
        ctx.stroke();

        drop.y += drop.speed;
        drop.x -= 1.8;

        if (drop.y > height) {
          drop.y = -drop.length;
          drop.x = Math.random() * (width + 100);

          // Splash ring on ground
          if (Math.random() < 0.2) {
            ctx.beginPath();
            ctx.ellipse(drop.x, height * (0.65 + Math.random() * 0.3), 4, 1.5, 0, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(180, 205, 230, 0.2)';
            ctx.stroke();
          }
        }
      }
      ctx.restore();

      // Loop
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    // Mouse movement inside canvas
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      mousePosRef.current = { x, y };

      // Check if hovering near padlock
      const isNearPadlock = Math.abs(x - 0.5) < 0.12 && Math.abs(y - 0.52) < 0.12;
      isHoveringGateRef.current = isNearPadlock;
      if (isNearPadlock && padlockShake === 0) {
        padlockShake = 1.0;
      }
    };

    const handleClick = () => {
      if (!interactive) return;
      horrorAudio.playGateChainRattle(0.7);
      padlockShake = 1.5;
      onShakeGate();
      if (isHoveringGateRef.current || isInspecting) {
        onInspectGate();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, [flashlightOn, lightningActive, isInspecting, interactive, onInspectGate, onShakeGate]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        id="atmospheric-2d-canvas"
        className="w-full h-full block cursor-default"
      />
    </div>
  );
};
