import React from 'react';
import { GameSettings } from '../types';
import { horrorAudio } from '../audio/HorrorAudioManager';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const toggleFullscreen = () => {
    horrorAudio.playMenuHover();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      onUpdateSettings({ fullscreen: true });
    } else {
      document.exitFullscreen().catch(() => {});
      onUpdateSettings({ fullscreen: false });
    }
  };

  return (
    <div
      id="settings-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 select-none"
    >
      <div
        id="settings-modal-card"
        className="w-full max-w-md bg-stone-950/90 border border-stone-800 p-7 relative shadow-[0_0_50px_rgba(0,0,0,0.95)]"
      >
        <div className="flex items-center justify-between pb-4 border-b border-stone-800/80 mb-6">
          <h3 className="font-horror-title text-xl font-bold tracking-[0.2em] text-stone-200">
            SETTINGS
          </h3>
          <button
            onClick={() => {
              horrorAudio.playMenuHover();
              onClose();
            }}
            className="text-stone-500 hover:text-stone-200 text-sm tracking-widest uppercase transition-colors cursor-pointer"
          >
            [ CLOSE ]
          </button>
        </div>

        <div className="space-y-6 text-sm font-mono tracking-wider">
          {/* Master Volume */}
          <div>
            <div className="flex justify-between text-stone-400 mb-2">
              <span className="uppercase">Master Volume</span>
              <span className="text-stone-200">{Math.round(settings.masterVolume * 100)}%</span>
            </div>
            <input
              id="slider-master-volume"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.masterVolume}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onUpdateSettings({ masterVolume: val });
                horrorAudio.setVolumes(val, settings.musicVolume, settings.sfxVolume);
              }}
              className="w-full h-1 bg-stone-800 rounded-none appearance-none cursor-pointer accent-red-800"
            />
          </div>

          {/* Ambience / Music Volume */}
          <div>
            <div className="flex justify-between text-stone-400 mb-2">
              <span className="uppercase">Ambience & Wind</span>
              <span className="text-stone-200">{Math.round(settings.musicVolume * 100)}%</span>
            </div>
            <input
              id="slider-music-volume"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.musicVolume}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onUpdateSettings({ musicVolume: val });
                horrorAudio.setVolumes(settings.masterVolume, val, settings.sfxVolume);
              }}
              className="w-full h-1 bg-stone-800 rounded-none appearance-none cursor-pointer accent-red-800"
            />
          </div>

          {/* SFX Volume */}
          <div>
            <div className="flex justify-between text-stone-400 mb-2">
              <span className="uppercase">Sound Effects</span>
              <span className="text-stone-200">{Math.round(settings.sfxVolume * 100)}%</span>
            </div>
            <input
              id="slider-sfx-volume"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.sfxVolume}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onUpdateSettings({ sfxVolume: val });
                horrorAudio.setVolumes(settings.masterVolume, settings.musicVolume, val);
              }}
              className="w-full h-1 bg-stone-800 rounded-none appearance-none cursor-pointer accent-red-800"
            />
          </div>

          {/* Graphics Quality */}
          <div className="pt-2">
            <div className="flex justify-between text-stone-400 mb-2">
              <span className="uppercase">Atmosphere & Shadows</span>
              <span className="text-stone-200 uppercase font-bold">{settings.graphicsQuality}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {(['low', 'medium', 'high'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    horrorAudio.playMenuHover();
                    onUpdateSettings({ graphicsQuality: q });
                  }}
                  className={`py-1.5 text-xs uppercase border transition-colors cursor-pointer ${
                    settings.graphicsQuality === q
                      ? 'border-red-800 bg-red-950/30 text-stone-200 font-semibold'
                      : 'border-stone-800 text-stone-500 hover:border-stone-600'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Auto Adaptive Quality Toggle */}
            <div className="flex items-center justify-between py-2 border-t border-stone-900">
              <div className="flex flex-col">
                <span className="uppercase text-stone-400 text-xs">Auto Quality (Mobile & Laptop)</span>
                <span className="text-[10px] text-stone-600">Smooth FPS with hysteresis</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  horrorAudio.playMenuHover();
                  onUpdateSettings({ autoQuality: settings.autoQuality === false ? true : false });
                }}
                className={`px-3 py-1 text-xs uppercase border tracking-wider transition-colors cursor-pointer ${
                  settings.autoQuality !== false
                    ? 'border-emerald-800 bg-emerald-950/30 text-emerald-300'
                    : 'border-stone-800 bg-stone-900 text-stone-500'
                }`}
              >
                {settings.autoQuality !== false ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Performance Monitor HUD Toggle */}
            <div className="flex items-center justify-between py-2 border-t border-stone-900">
              <div className="flex flex-col">
                <span className="uppercase text-stone-400 text-xs">Performance HUD</span>
                <span className="text-[10px] text-stone-600">Live FPS, Calls, Triangles [F3 / ~]</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  horrorAudio.playMenuHover();
                  onUpdateSettings({ showPerformanceHud: !settings.showPerformanceHud });
                }}
                className={`px-3 py-1 text-xs uppercase border tracking-wider transition-colors cursor-pointer ${
                  settings.showPerformanceHud
                    ? 'border-red-800 bg-red-950/40 text-stone-200'
                    : 'border-stone-800 bg-stone-900 text-stone-500'
                }`}
              >
                {settings.showPerformanceHud ? 'SHOWN' : 'HIDDEN'}
              </button>
            </div>
          </div>

          {/* Fullscreen toggle */}
          <div className="pt-3 border-t border-stone-900 flex items-center justify-between">
            <span className="uppercase text-stone-400">Display Mode</span>
            <button
              id="btn-toggle-fullscreen"
              onClick={toggleFullscreen}
              className="px-4 py-1.5 border border-stone-800 hover:border-stone-600 text-xs text-stone-300 uppercase tracking-widest transition-colors cursor-pointer"
            >
              Toggle Fullscreen
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            id="btn-settings-back"
            onClick={() => {
              horrorAudio.playMenuHover();
              onClose();
            }}
            className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 border border-stone-700/80 text-stone-300 hover:text-stone-100 uppercase tracking-[0.25em] text-xs font-mono transition-colors cursor-pointer"
          >
            Apply & Back
          </button>
        </div>
      </div>
    </div>
  );
};
