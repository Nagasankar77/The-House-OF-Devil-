import { useState, useEffect } from 'react';
import { PlayerControls } from '../../shared/types';

export function useKeyboardControls(): PlayerControls {
  const [controls, setControls] = useState<PlayerControls>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    run: false,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          setControls((c) => ({ ...c, forward: true }));
          break;
        case 'KeyS':
        case 'ArrowDown':
          setControls((c) => ({ ...c, backward: true }));
          break;
        case 'KeyA':
        case 'ArrowLeft':
          setControls((c) => ({ ...c, left: true }));
          break;
        case 'KeyD':
        case 'ArrowRight':
          setControls((c) => ({ ...c, right: true }));
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          setControls((c) => ({ ...c, run: true }));
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          setControls((c) => ({ ...c, forward: false }));
          break;
        case 'KeyS':
        case 'ArrowDown':
          setControls((c) => ({ ...c, backward: false }));
          break;
        case 'KeyA':
        case 'ArrowLeft':
          setControls((c) => ({ ...c, left: false }));
          break;
        case 'KeyD':
        case 'ArrowRight':
          setControls((c) => ({ ...c, right: false }));
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          setControls((c) => ({ ...c, run: false }));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return controls;
}
