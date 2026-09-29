import React from 'react';
import { PerformanceStats } from '../types';

interface PerformanceHUDProps {
  stats: PerformanceStats | null;
  onSetQuality: (quality: 'high' | 'medium' | 'low') => void;
  autoQuality: boolean;
  onToggleAutoQuality: () => void;
  onClose: () => void;
}

export const PerformanceHUD: React.FC<PerformanceHUDProps> = ({
  stats,
  onSetQuality,
  autoQuality,
  onToggleAutoQuality,
  onClose,
}) => {
  if (!stats) return null;

  const fps = stats.fps;
  const fpsColor =
    fps >= 52 ? 'text-emerald-400' : fps >= 38 ? 'text-amber-400' : 'text-rose-500';

  return (
    <div
      id="performance-hud-panel"
      className="fixed top-3 left-3 z-50 bg-stone-950/90 border border-stone-800/90 backdrop-blur-md p-3 text-[11px] font-mono select-none shadow-[0_4px_24px_rgba(0,0,0,0.85)] max-w-xs transition-all pointer-events-auto"
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-800 text-stone-400">
        <div className="flex items-center gap-1.5 font-bold tracking-widest text-stone-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>PERF MONITOR</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-stone-500">[F3 / ~]</span>
          <button
            onClick={onClose}
            className="text-stone-500 hover:text-stone-200 cursor-pointer px-1"
            title="Hide HUD"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-2.5">
        <div className="flex items-center justify-between">
          <span className="text-stone-500">FPS:</span>
          <span className={`font-bold text-xs ${fpsColor}`}>{stats.fps}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-stone-500">Frame:</span>
          <span className="text-stone-300">{stats.frameTime.toFixed(1)} ms</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-stone-500">Draw Calls:</span>
          <span className="text-stone-300 font-semibold">{stats.drawCalls}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-stone-500">Triangles:</span>
          <span className="text-stone-300">{(stats.triangles / 1000).toFixed(1)}k</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-stone-500">Textures:</span>
          <span className="text-stone-300">{stats.textures}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-stone-500">Profile:</span>
          <span className="text-red-400 font-bold uppercase">{stats.quality}</span>
        </div>
      </div>

      {/* Manual Quality Switcher & Auto Quality Toggle */}
      <div className="pt-2 border-t border-stone-800/80 flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-stone-400 text-[10px] uppercase">Auto-Adapt:</span>
          <button
            onClick={onToggleAutoQuality}
            className={`px-1.5 py-0.5 text-[9px] border rounded-xs transition-colors cursor-pointer ${
              autoQuality
                ? 'border-emerald-800 bg-emerald-950/40 text-emerald-300'
                : 'border-stone-800 bg-stone-900 text-stone-500'
            }`}
          >
            {autoQuality ? 'ENABLED (HYSTERESIS)' : 'OFF (FIXED)'}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1 pt-1">
          {(['low', 'medium', 'high'] as const).map((q) => (
            <button
              key={q}
              onClick={() => onSetQuality(q)}
              className={`py-1 text-[10px] uppercase tracking-wider border transition-colors cursor-pointer ${
                stats.quality === q
                  ? 'border-red-700 bg-red-950/50 text-stone-100 font-bold'
                  : 'border-stone-800 text-stone-500 hover:text-stone-300 hover:border-stone-700'
              }`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
