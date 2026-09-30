import { Graphics, Container } from 'pixi.js';
import { DungeonLevel, TileType } from '../world/DungeonGenerator';
import { FogOfWar } from '../fog/FogOfWar';
import { gridToScreen, TILE_WIDTH, TILE_HEIGHT } from '../engine/IsoMath';

export class Automap {
  public isVisible: boolean = false;
  public readonly container: Container;
  private readonly linesGraphics: Graphics;

  constructor() {
    this.container = new Container();
    this.linesGraphics = new Graphics();
    this.container.addChild(this.linesGraphics);
    this.container.visible = false;
  }

  public toggle(): boolean {
    this.isVisible = !this.isVisible;
    this.container.visible = this.isVisible;
    return this.isVisible;
  }

  public update(
    dungeon: DungeonLevel,
    fog: FogOfWar,
    playerGx: number,
    playerGy: number,
    cameraOffsetX: number,
    cameraOffsetY: number
  ): void {
    if (!this.isVisible) return;

    this.linesGraphics.clear();

    // Automap matches the world's camera offset
    this.container.x = cameraOffsetX;
    this.container.y = cameraOffsetY;

    const halfW = TILE_WIDTH / 2;
    const halfH = TILE_HEIGHT / 2;

    let hasWalls = false;
    let hasDoors = false;

    // 1. Batch draw wall wireframes
    for (let y = 0; y < dungeon.height; y++) {
      for (let x = 0; x < dungeon.width; x++) {
        // Only draw visited/explored tiles
        if (!fog.isExplored(x, y)) continue;

        const tile = dungeon.tiles[y][x];
        const screenPos = gridToScreen(x, y);

        // Draw walls as wireframe lines
        if (
          tile === TileType.WALL_NORTH ||
          tile === TileType.WALL_WEST ||
          tile === TileType.WALL_CORNER ||
          tile === TileType.PILLAR
        ) {
          hasWalls = true;
          // North edge (slanted down-right)
          this.linesGraphics.moveTo(screenPos.x + halfW, screenPos.y);
          this.linesGraphics.lineTo(screenPos.x + TILE_WIDTH, screenPos.y + halfH);

          // West edge (slanted down-left)
          this.linesGraphics.moveTo(screenPos.x + halfW, screenPos.y);
          this.linesGraphics.lineTo(screenPos.x, screenPos.y + halfH);
        }
      }
    }

    if (hasWalls) {
      this.linesGraphics.stroke({ color: 0x59a2ff, width: 2, alpha: 0.9 });
    }

    // 2. Interactive Markers: Doors & Stairs
    for (let y = 0; y < dungeon.height; y++) {
      for (let x = 0; x < dungeon.width; x++) {
        if (!fog.isExplored(x, y)) continue;

        const tile = dungeon.tiles[y][x];
        const screenPos = gridToScreen(x, y);

        if (tile === TileType.DOOR) {
          hasDoors = true;
          this.linesGraphics.moveTo(screenPos.x + halfW, screenPos.y + 4);
          this.linesGraphics.lineTo(screenPos.x + halfW, screenPos.y + TILE_HEIGHT - 4);
        } else if (tile === TileType.STAIRS_DOWN) {
          // Stairs Down: Bright Red Descending Marker
          this.linesGraphics.rect(screenPos.x + halfW - 7, screenPos.y + halfH - 7, 14, 14);
          this.linesGraphics.fill({ color: 0xb80f0f, alpha: 0.85 });
          this.linesGraphics.stroke({ color: 0xff4d4d, width: 2 });
        } else if (tile === TileType.STAIRS_UP) {
          // Stairs Up: Blue Ascent Marker
          this.linesGraphics.rect(screenPos.x + halfW - 7, screenPos.y + halfH - 7, 14, 14);
          this.linesGraphics.fill({ color: 0x145cc4, alpha: 0.85 });
          this.linesGraphics.stroke({ color: 0x73b2ff, width: 2 });
        } else if (tile === TileType.CATHEDRAL_ENTRANCE) {
          // Cathedral Entrance: Crimson & Gold Gothic Marker
          this.linesGraphics.rect(screenPos.x + halfW - 8, screenPos.y + halfH - 8, 16, 16);
          this.linesGraphics.fill({ color: 0x7a1111, alpha: 0.9 });
          this.linesGraphics.stroke({ color: 0xd4af37, width: 2 });
        } else if (tile === TileType.TOWN_PORTAL) {
          // Town Portal: Glowing Mystic Cyan Oval
          this.linesGraphics.circle(screenPos.x + halfW, screenPos.y + halfH, 7);
          this.linesGraphics.fill({ color: 0x1f5c99, alpha: 0.9 });
          this.linesGraphics.stroke({ color: 0x66c2ff, width: 2 });
        } else if (tile === TileType.NPC_CAIN || tile === TileType.NPC_GRISWOLD || tile === TileType.NPC_PEPIN) {
          // Friendly NPC markers: Gold dots
          this.linesGraphics.circle(screenPos.x + halfW, screenPos.y + halfH, 4);
          this.linesGraphics.fill({ color: 0xd4af37 });
          this.linesGraphics.stroke({ color: 0xffffff, width: 1 });
        }
      }
    }

    if (hasDoors) {
      this.linesGraphics.stroke({ color: 0xd4af37, width: 2.5, alpha: 0.95 });
    }

    // 3. Player white & gold crosshair
    const playerScreen = gridToScreen(playerGx, playerGy);
    const px = playerScreen.x + halfW;
    const py = playerScreen.y + halfH;

    this.linesGraphics.moveTo(px - 7, py);
    this.linesGraphics.lineTo(px + 7, py);
    this.linesGraphics.moveTo(px, py - 7);
    this.linesGraphics.lineTo(px, py + 7);
    this.linesGraphics.stroke({ color: 0xffffff, width: 2.5, alpha: 1.0 });

    this.linesGraphics.circle(px, py, 2.5);
    this.linesGraphics.fill({ color: 0xff3b30 });
  }
}
