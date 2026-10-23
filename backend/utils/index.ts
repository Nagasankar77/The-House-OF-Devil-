/**
 * Backend utility helpers
 */

export function isDev(): boolean {
  return process.env.NODE_ENV !== 'production';
}

export function getServerPort(): number {
  return Number(process.env.PORT) || 3000;
}
