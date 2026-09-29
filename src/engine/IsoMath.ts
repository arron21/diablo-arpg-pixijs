/**
 * Isometric 2:1 Dimetric Projection Math
 * Standard Diablo projection where horizontal tile width is 2x vertical tile height.
 */

export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;
export const HALF_WIDTH = TILE_WIDTH / 2;   // 32
export const HALF_HEIGHT = TILE_HEIGHT / 2; // 16

export interface Point2D {
  x: number;
  y: number;
}

export interface GridCoord {
  gx: number;
  gy: number;
}

/**
 * Converts world grid coordinates (continuous float or discrete integer)
 * to screen isometric coordinates.
 */
export function gridToScreen(gx: number, gy: number, elevation: number = 0): Point2D {
  return {
    x: (gx - gy) * HALF_WIDTH,
    y: (gx + gy) * HALF_HEIGHT - elevation
  };
}

/**
 * Converts screen isometric coordinates back to world grid coordinates.
 */
export function screenToGrid(sx: number, sy: number): GridCoord {
  const gx = (sx / HALF_WIDTH + sy / HALF_HEIGHT) / 2;
  const gy = (sy / HALF_HEIGHT - sx / HALF_WIDTH) / 2;
  return {
    gx: Math.floor(gx),
    gy: Math.floor(gy)
  };
}

/**
 * Exact continuous grid position from screen coordinates (for high precision / raycasting).
 */
export function screenToGridFloat(sx: number, sy: number): { gx: number; gy: number } {
  const gx = (sx / HALF_WIDTH + sy / HALF_HEIGHT) / 2;
  const gy = (sy / HALF_HEIGHT - sx / HALF_WIDTH) / 2;
  return { gx, gy };
}

/**
 * Computes deterministic depth index (zIndex) for back-to-front isometric rendering.
 * Higher values render on top of lower values.
 */
export function calculateDepth(gx: number, gy: number, sublayer: number = 0): number {
  return Math.floor((gx + gy) * 100) + sublayer;
}

/**
 * Calculates Euclidean distance between two grid coordinates.
 */
export function gridDistance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates Chebyshev distance (grid distance including diagonals).
 */
export function chebyshevDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
}
