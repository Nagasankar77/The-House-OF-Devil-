import React, { useRef, useState, useEffect, useCallback } from 'react';
import { PlayerControls } from '../types';

interface MobileControlsProps {
  onControlsChange: (controls: Partial<PlayerControls>) => void;
  onCameraRotate: (deltaX: number, deltaY: number) => void;
  flashlightOn: boolean;
  onToggleFlashlight: () => void;
  canInspectGate: boolean;
  onInspectGate: () => void;
  actionLabel?: string;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onControlsChange,
  onCameraRotate,
  flashlightOn,
  onToggleFlashlight,
  canInspectGate,
  onInspectGate,
  actionLabel = 'INTERACT',
}) => {
  // Joystick internal state
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const [stickPos, setStickPos] = useState({ x: 0, y: 0 });
  const [isJoystickActive, setIsJoystickActive] = useState(false);
  const joystickTouchIdRef = useRef<number | null>(null);
  const joystickCenterRef = useRef({ x: 0, y: 0 });

  // Swipe look internal state
  const swipeTouchIdRef = useRef<number | null>(null);
  const lastSwipePosRef = useRef({ x: 0, y: 0 });

  // Fast-walk toggle for mobile convenience
  const [sprintLocked, setSprintLocked] = useState(false);

  const maxRadius = 45; // Max joystick thumb travel in pixels

  // 1. Joystick Touch Handlers
  const handleJoystickTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (joystickTouchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    joystickTouchIdRef.current = touch.identifier;

    if (joystickBaseRef.current) {
      const rect = joystickBaseRef.current.getBoundingClientRect();
      joystickCenterRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }

    setIsJoystickActive(true);
    updateJoystickFromTouch(touch.clientX, touch.clientY);
  };

  const updateJoystickFromTouch = useCallback(
    (clientX: number, clientY: number) => {
      const dx = clientX - joystickCenterRef.current.x;
      const dy = clientY - joystickCenterRef.current.y;
      const dist = Math.hypot(dx, dy);

      const clampedDist = Math.min(dist, maxRadius);
      const angle = Math.atan2(dy, dx);
      const clampedX = Math.cos(angle) * clampedDist;
      const clampedY = Math.sin(angle) * clampedDist;

      setStickPos({ x: clampedX, y: clampedY });

      // Normalized coordinates (-1 to 1)
      const normX = clampedX / maxRadius;
      const normY = clampedY / maxRadius;

      // Thresholds for 8-way responsive navigation
      const threshold = 0.22;
      const forward = normY < -threshold;
      const backward = normY > threshold;
      const left = normX < -threshold;
      const right = normX > threshold;
      const isSprinting = sprintLocked || dist / maxRadius > 0.88;

      onControlsChange({
        forward,
        backward,
        left,
        right,
        run: isSprinting,
      });
    },
    [sprintLocked, onControlsChange]
  );

  // 2. Global Touch Move & End Handlers
  useEffect(() => {
    const handleWindowTouchMove = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];

        // Process joystick movement
        if (touch.identifier === joystickTouchIdRef.current) {
          updateJoystickFromTouch(touch.clientX, touch.clientY);
        }

        // Process swipe camera rotation
        if (touch.identifier === swipeTouchIdRef.current) {
          const dx = touch.clientX - lastSwipePosRef.current.x;
          const dy = touch.clientY - lastSwipePosRef.current.y;
          onCameraRotate(dx, dy);
          lastSwipePosRef.current = { x: touch.clientX, y: touch.clientY };
        }
      }
    };

    const handleWindowTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];

        // End joystick
        if (touch.identifier === joystickTouchIdRef.current) {
          joystickTouchIdRef.current = null;
          setIsJoystickActive(false);
          setStickPos({ x: 0, y: 0 });
          onControlsChange({
            forward: false,
            backward: false,
            left: false,
            right: false,
            run: false,
          });
        }

        // End swipe camera
        if (touch.identifier === swipeTouchIdRef.current) {
          swipeTouchIdRef.current = null;
        }
      }
    };

    window.addEventListener('touchmove', handleWindowTouchMove, { passive: false });
    window.addEventListener('touchend', handleWindowTouchEnd);
    window.addEventListener('touchcancel', handleWindowTouchEnd);

    return () => {
      window.removeEventListener('touchmove', handleWindowTouchMove);
      window.removeEventListener('touchend', handleWindowTouchEnd);
      window.removeEventListener('touchcancel', handleWindowTouchEnd);
    };
  }, [updateJoystickFromTouch, onCameraRotate, onControlsChange]);

  // 3. Swipe Area Touch Start
  const handleSwipeAreaTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (swipeTouchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    swipeTouchIdRef.current = touch.identifier;
    lastSwipePosRef.current = { x: touch.clientX, y: touch.clientY };
  };

  return (
    <div
      id="mobile-touch-interface"
      className="fixed inset-0 z-20 pointer-events-none select-none touch-none"
    >
      {/* Right-Screen Camera Rotation Swipe Field */}
      <div
        id="touch-camera-swipe-zone"
        onTouchStart={handleSwipeAreaTouchStart}
        className="absolute top-16 right-0 bottom-24 w-7/12 pointer-events-auto"
      />

      {/* Bottom Left: Virtual Joystick */}
      <div className="absolute bottom-6 left-6 pointer-events-auto flex flex-col items-center">
        {/* Sprint / Fast Walk Toggle */}
        <button
          id="btn-touch-sprint"
          type="button"
          onClick={() => {
            const next = !sprintLocked;
            setSprintLocked(next);
            onControlsChange({ run: next });
          }}
          className={`mb-2 px-3 py-1 rounded text-[10px] font-mono tracking-widest uppercase border transition-colors shadow-lg active:scale-95 ${
            sprintLocked
              ? 'border-red-800 bg-red-950/60 text-red-200'
              : 'border-stone-800 bg-black/60 text-stone-500'
          }`}
        >
          {sprintLocked ? 'RUN: ON' : 'WALK FAST'}
        </button>

        {/* Joystick Base */}
        <div
          ref={joystickBaseRef}
          id="virtual-joystick-base"
          onTouchStart={handleJoystickTouchStart}
          className={`relative w-28 h-28 rounded-full border border-stone-800/80 bg-black/50 backdrop-blur-[2px] flex items-center justify-center transition-all ${
            isJoystickActive ? 'border-red-900/60 shadow-[0_0_16px_rgba(185,28,28,0.25)]' : ''
          }`}
        >
          {/* Subtle directional markings */}
          <span className="absolute top-1.5 w-1 h-1 rounded-full bg-stone-700/60" />
          <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-stone-700/60" />
          <span className="absolute left-1.5 w-1 h-1 rounded-full bg-stone-700/60" />
          <span className="absolute right-1.5 w-1 h-1 rounded-full bg-stone-700/60" />

          {/* Inner Thumbstick */}
          <div
            id="virtual-joystick-thumb"
            className="w-12 h-12 rounded-full border border-stone-600/80 bg-stone-900/80 shadow-[0_0_10px_rgba(0,0,0,0.8)] pointer-events-none flex items-center justify-center transition-transform"
            style={{
              transform: `translate(${stickPos.x}px, ${stickPos.y}px)`,
            }}
          >
            <div className="w-3.5 h-3.5 rounded-full bg-stone-500/70" />
          </div>
        </div>
      </div>

      {/* Bottom Right: Quick Action Buttons */}
      <div className="absolute bottom-6 right-6 pointer-events-auto flex flex-col items-end space-y-3">
        {/* Inspect Gate / Ritual Action Button (Pulsing when in range) */}
        {canInspectGate && (
          <button
            id="btn-touch-inspect-gate"
            type="button"
            onClick={onInspectGate}
            className="px-4 py-2.5 bg-black/85 border border-amber-800/90 text-stone-200 text-xs font-mono tracking-widest uppercase shadow-[0_0_20px_rgba(217,119,6,0.4)] animate-pulse active:scale-95 cursor-pointer flex items-center space-x-2"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>[ E ] {actionLabel}</span>
          </button>
        )}

        {/* Flashlight Toggle Button */}
        <button
          id="btn-touch-flashlight"
          type="button"
          onClick={onToggleFlashlight}
          className={`px-4 py-2 text-xs font-mono tracking-wider uppercase border active:scale-95 cursor-pointer transition-all shadow-lg flex items-center space-x-2 ${
            flashlightOn
              ? 'border-amber-600/80 bg-amber-950/40 text-amber-200 shadow-[0_0_12px_rgba(217,119,6,0.25)]'
              : 'border-stone-800 bg-black/70 text-stone-400'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              flashlightOn ? 'bg-amber-400 animate-pulse' : 'bg-stone-600'
            }`}
          />
          <span>[ F ] LIGHT {flashlightOn ? 'ON' : 'OFF'}</span>
        </button>
      </div>
    </div>
  );
};
