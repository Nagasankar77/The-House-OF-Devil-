import React, { useState } from 'react';
import { AlertTriangle, ExternalLink, RotateCcw, ChevronDown, ChevronUp, Eye, Monitor } from 'lucide-react';

interface WebGLFallbackModalProps {
  errorDetails?: string | null;
  onRetry: () => void;
  onContinue2D: () => void;
}

export const WebGLFallbackModal: React.FC<WebGLFallbackModalProps> = ({
  errorDetails,
  onRetry,
  onContinue2D,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const handleOpenNewTab = () => {
    window.open(window.location.href, '_blank', 'noopener,noreferrer');
  };

  if (isMinimized) {
    return (
      <aside
        aria-label="WebGL Warning Badge"
        className="fixed top-4 right-4 z-50 flex items-center space-x-2 bg-stone-900/90 border border-amber-800/80 px-3 py-1.5 rounded text-xs text-amber-300 shadow-xl backdrop-blur select-none cursor-pointer hover:bg-stone-800 transition-colors"
        onClick={() => setIsMinimized(false)}
      >
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        <span className="font-mono">2D Mode Active (WebGL Disabled)</span>
        <span className="text-[10px] text-stone-400 underline ml-1">Details</span>
      </aside>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="webgl-error-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none"
    >
      <div className="relative w-full max-w-lg bg-stone-950/95 border border-stone-800 shadow-[0_0_50px_rgba(0,0,0,0.9)] text-stone-200 p-6 sm:p-7 font-serif">
        {/* Top Header */}
        <div className="flex items-start space-x-3.5 mb-4">
          <div className="p-2 bg-amber-950/50 border border-amber-700/60 rounded-sm text-amber-400 shrink-0 mt-0.5">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 id="webgl-error-title" className="font-horror-title text-lg sm:text-xl font-bold tracking-wider text-amber-200">
              WebGL Hardware Acceleration Disabled
            </h2>
            <p className="text-xs font-mono text-stone-400 mt-1">
              GL_VENDOR = Disabled • Sandboxed Preview Environment
            </p>
          </div>
        </div>

        {/* Diagnostic Description */}
        <div className="text-sm text-stone-300/90 leading-relaxed mb-5 space-y-2">
          <p>
            Your browser or container iframe currently has WebGL hardware acceleration disabled, preventing the 3D graphics pipeline from initializing.
          </p>
          {errorDetails && (
            <div className="bg-black/60 border border-stone-800 p-2.5 rounded text-xs font-mono text-stone-400 overflow-x-auto">
              <span className="text-amber-500 font-bold">Diagnostics: </span>
              {errorDetails}
            </div>
          )}
        </div>

        {/* Primary Recommended Solutions */}
        <div className="space-y-3 mb-5">
          {/* 1. Open in Full Tab */}
          <button
            id="btn-webgl-new-tab"
            onClick={handleOpenNewTab}
            className="w-full flex items-center justify-center space-x-2.5 px-4 py-3 bg-red-950/70 hover:bg-red-900 border border-red-800/80 text-stone-100 text-sm tracking-wider uppercase transition-colors shadow-lg group cursor-pointer"
          >
            <ExternalLink className="w-4 h-4 text-red-300 group-hover:scale-110 transition-transform" />
            <span className="font-medium">Launch in Full Browser Tab (Recommended)</span>
          </button>

          {/* 2. Play in 2D Atmospheric Mode */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              id="btn-webgl-continue-2d"
              onClick={() => {
                onContinue2D();
                setIsMinimized(true);
              }}
              className="flex items-center justify-center space-x-2 px-3 py-2.5 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 text-xs tracking-wider uppercase transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-stone-400" />
              <span>Play in 2D Mode</span>
            </button>

            {/* 3. Retry WebGL */}
            <button
              id="btn-webgl-retry"
              onClick={onRetry}
              className="flex items-center justify-center space-x-2 px-3 py-2.5 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 text-xs tracking-wider uppercase transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
              <span>Retry 3D WebGL</span>
            </button>
          </div>
        </div>

        {/* Collapsible Browser Hardware Acceleration Instructions */}
        <div className="border-t border-stone-800/80 pt-3.5">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="w-full flex items-center justify-between text-xs text-stone-400 hover:text-stone-200 transition-colors py-1 cursor-pointer"
          >
            <span className="flex items-center space-x-1.5 font-sans">
              <Monitor className="w-3.5 h-3.5" />
              <span>How to enable Hardware Acceleration in Chrome / Edge</span>
            </span>
            {showGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showGuide && (
            <div className="mt-2.5 p-3 bg-black/40 border border-stone-800/80 text-xs font-sans text-stone-400 space-y-1.5">
              <p>1. Open <code className="text-amber-400 bg-stone-900 px-1 py-0.5 rounded">chrome://settings/system</code> in a new tab.</p>
              <p>2. Toggle <strong className="text-stone-200">"Use graphics acceleration when available"</strong> to <strong className="text-green-400">ON</strong>.</p>
              <p>3. Click <strong className="text-stone-200">Relaunch</strong>.</p>
              <p className="text-[11px] text-stone-500 pt-1">
                * Note: If running inside AI Studio preview, opening the app in a new tab bypasses iframe sandbox restrictions automatically.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
