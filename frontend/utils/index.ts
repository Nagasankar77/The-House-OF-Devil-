export * from '../../shared/utils';

/**
 * Checks if WebGL is supported by the user's browser.
 */
export function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch (_e) {
    return false;
  }
}

/**
 * Toggles fullscreen mode for the root document.
 */
export async function toggleFullscreen(): Promise<boolean> {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      return true;
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
      return false;
    }
  } catch (err) {
    console.warn('[Fullscreen] Request failed:', err);
    return Boolean(document.fullscreenElement);
  }
}
