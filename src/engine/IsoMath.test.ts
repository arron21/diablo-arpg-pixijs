import { describe, it, expect } from 'vitest';
import { gridToScreen, screenToGrid, calculateDepth } from './IsoMath';

describe('IsoMath', () => {
  it('should accurately convert grid to screen and back to grid', () => {
    const testCases = [
      { gx: 0, gy: 0 },
      { gx: 5, gy: 5 },
      { gx: 12, gy: 3 },
      { gx: -4, gy: 8 },
      { gx: 20, gy: 35 },
    ];

    for (const { gx, gy } of testCases) {
      // Center of tile is (gx + 0.5, gy + 0.5)
      const screenPos = gridToScreen(gx + 0.5, gy + 0.5);
      const recovered = screenToGrid(screenPos.x, screenPos.y);
      expect(recovered.gx).toBe(gx);
      expect(recovered.gy).toBe(gy);
    }
  });

  it('should calculate higher depth for tiles further south-east', () => {
    const depthNear = calculateDepth(2, 2, 0);
    const depthFar = calculateDepth(5, 5, 0);
    expect(depthFar).toBeGreaterThan(depthNear);

    // Sublayer should properly offset depth on the same tile
    const floorDepth = calculateDepth(2, 2, 0);
    const monsterDepth = calculateDepth(2, 2, 20);
    expect(monsterDepth).toBeGreaterThan(floorDepth);
  });
});
