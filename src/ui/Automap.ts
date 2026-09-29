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

    for (let y = 0; y < dungeon.height; y++) {
      for (let x = 0; x < dungeon.width; x++) {
        // Only draw visited/explored tiles
        if (!fog.isExplored(x, y)) continue;

        const tile = dungeon.tiles[y][x];
        const screenPos = gridToScreen(x, y);

        // Draw walls as wireframe lines
        if (tile === TileType.WALL_NORTH || tile === TileType.WALL_WEST || tile === TileType.WALL_CORNER || tile === TileType.PILLAR) {
          // North edge (slanted down-right)
          this.linesGraphics.moveTo(screenPos.x + halfW, screenPos.y);
          this.linesGraphics.lineTo(screenPos.x + TILE_WIDTH, screenPos.y + halfH);
          this.linesGraphics.stroke({ color: 0x4a7a9e, width: 1.5, alpha: 0.8 });

          // West edge (slanted down-left)
          this.linesGraphics.moveTo(screenPos.x + halfW, screenPos.y);
          this.linesGraphics.lineTo(screenPos.x, screenPos.y + halfH);
          this.linesGraphics.stroke({ color: 0x4a7a9e, width: 1.5, alpha: 0.8 });
        } else if (tile === TileType.DOOR) {
          // Door: Golden marker
          this.linesGraphics.moveTo(screenPos.x + halfW, screenPos.y + 4);
          this.linesGraphics.lineTo(screenPos.x + halfW, screenPos.y + TILE_HEIGHT - 4);
          this.linesGraphics.stroke({ color: 0xd4af37, width: 2, alpha: 0.9 });
        } else if (tile === TileType.STAIRS_DOWN) {
          // Stairs Down: Red Descending Marker
          this.linesGraphics.rect(screenPos.x + halfW - 6, screenPos.y + halfH - 6, 12, 12);
          this.linesGraphics.fill({ color: 0xc41414, alpha: 0.8 });
          this.linesGraphics.stroke({ color: 0xff4747, width: 1.5 });
        } else if (tile === TileType.STAIRS_UP) {
          // Stairs Up: Blue Ascent Marker
          this.linesGraphics.rect(screenPos.x + halfW - 6, screenPos.y + halfH - 6, 12, 12);
          this.linesGraphics.fill({ color: 0x145cc4, alpha: 0.8 });
          this.linesGraphics.stroke({ color: 0x6bb0ff, width: 1.5 });
        }
      }
    }

    // Player white crosshair
    const playerScreen = gridToScreen(playerGx, playerGy);
    const px = playerScreen.x + halfW;
    const py = playerScreen.y + halfH;

    this.linesGraphics.moveTo(px - 5, py);
    this.linesGraphics.lineTo(px + 5, py);
    this.linesGraphics.moveTo(px, py - 5);
    this.linesGraphics.lineTo(px, py + 5);
    this.linesGraphics.stroke({ color: 0xffffff, width: 2, alpha: 1.0 });
  }
}
