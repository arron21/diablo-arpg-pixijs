import { Graphics } from 'pixi.js';
import { DungeonLevel, DungeonGenerator } from '../world/DungeonGenerator';
import { gridToScreen, TILE_WIDTH, TILE_HEIGHT } from '../engine/IsoMath';

export enum VisibilityState {
  UNEXPLORED = 0,
  SHROUDED = 1,
  VISIBLE = 2,
}

export class FogOfWar {
  public width: number;
  public height: number;
  public visibility: VisibilityState[][];
  public lightIntensity: number[][]; // 0.0 to 1.0

  public readonly graphics: Graphics;
  private baseLightRadius: number = 8.5;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.visibility = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => VisibilityState.UNEXPLORED)
    );
    this.lightIntensity = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => 0.0)
    );
    this.graphics = new Graphics();
  }

  public setLightRadius(radius: number): void {
    this.baseLightRadius = radius;
  }

  public revealAll(): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.visibility[y][x] = VisibilityState.VISIBLE;
        this.lightIntensity[y][x] = 1.0;
      }
    }
    this.graphics.clear();
  }

  public update(
    dungeon: DungeonLevel,
    playerGx: number,
    playerGy: number,
    lightRadiusBonus: number = 0
  ): void {
    if (dungeon.levelNumber === 0) {
      this.revealAll();
      return;
    }
    const radius = this.baseLightRadius + lightRadiusBonus;

    // 1. Demote currently visible tiles to SHROUDED
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.visibility[y][x] === VisibilityState.VISIBLE) {
          this.visibility[y][x] = VisibilityState.SHROUDED;
        }
        this.lightIntensity[y][x] = 0;
      }
    }

    // 2. Cast rays in a circle to compute direct line-of-sight
    const raySteps = 180;
    const px = playerGx + 0.5;
    const py = playerGy + 0.5;

    for (let i = 0; i < raySteps; i++) {
      const angle = (i * 2 * Math.PI) / raySteps;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      // Ray march
      for (let dist = 0.5; dist <= radius; dist += 0.45) {
        const checkX = Math.floor(px + cosA * dist);
        const checkY = Math.floor(py + sinA * dist);

        if (checkX < 0 || checkX >= this.width || checkY < 0 || checkY >= this.height) {
          break;
        }

        const normDist = dist / radius;
        // Cosine light falloff
        const intensity = Math.max(0, Math.cos((normDist * Math.PI) / 2));

        this.visibility[checkY][checkX] = VisibilityState.VISIBLE;
        if (intensity > this.lightIntensity[checkY][checkX]) {
          this.lightIntensity[checkY][checkX] = intensity;
        }

        // Stop ray if blocked by wall, closed door, or pillar
        const tile = dungeon.tiles[checkY][checkX];
        if (DungeonGenerator.isOpaque(tile)) {
          break;
        }
      }
    }

    // 3. Wall Torches ambient light contribution
    for (const torch of dungeon.torches) {
      const distToPlayer = Math.hypot(torch.gx - playerGx, torch.gy - playerGy);
      // Torches only flare if within or near explored range
      if (distToPlayer < radius + 4) {
        const torchRadius = 3.5;
        for (let dy = -torchRadius; dy <= torchRadius; dy++) {
          for (let dx = -torchRadius; dx <= torchRadius; dx++) {
            const tx = Math.floor(torch.gx + dx);
            const ty = Math.floor(torch.gy + dy);
            if (tx >= 0 && tx < this.width && ty >= 0 && ty < this.height) {
              const d = Math.hypot(dx, dy);
              if (d <= torchRadius && this.visibility[ty][tx] !== VisibilityState.UNEXPLORED) {
                const torchIntensity = (1 - d / torchRadius) * 0.5;
                if (torchIntensity > this.lightIntensity[ty][tx]) {
                  this.lightIntensity[ty][tx] = torchIntensity;
                }
              }
            }
          }
        }
      }
    }

    // 4. Render dark fog overlay
    this.renderFogOverlay();
  }

  public isVisible(gx: number, gy: number): boolean {
    const x = Math.floor(gx);
    const y = Math.floor(gy);
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
    return this.visibility[y][x] === VisibilityState.VISIBLE;
  }

  public isExplored(gx: number, gy: number): boolean {
    const x = Math.floor(gx);
    const y = Math.floor(gy);
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
    return this.visibility[y][x] !== VisibilityState.UNEXPLORED;
  }

  private renderFogOverlay(): void {
    this.graphics.clear();

    const halfW = TILE_WIDTH / 2;
    const halfH = TILE_HEIGHT / 2;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const state = this.visibility[y][x];

        let darknessAlpha = 1.0;
        if (state === VisibilityState.UNEXPLORED) {
          darknessAlpha = 1.0; // pitch black
        } else if (state === VisibilityState.SHROUDED) {
          darknessAlpha = 0.78; // gloomy blue-grey shroud
        } else if (state === VisibilityState.VISIBLE) {
          const intensity = this.lightIntensity[y][x];
          darknessAlpha = Math.max(0, 0.95 - intensity * 0.95);
        }

        if (darknessAlpha > 0.02) {
          const pos = gridToScreen(x, y);

          // Draw isometric darkness rhombus
          this.graphics.poly([
            pos.x + halfW, pos.y,
            pos.x + TILE_WIDTH, pos.y + halfH,
            pos.x + halfW, pos.y + TILE_HEIGHT,
            pos.x, pos.y + halfH
          ]);
          this.graphics.fill({ color: 0x050407, alpha: darknessAlpha });
        }
      }
    }
  }
}
