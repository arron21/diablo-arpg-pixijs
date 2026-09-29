import { Container, Sprite } from 'pixi.js';
import { DungeonLevel, TileType, PropData, DoorData } from './DungeonGenerator';
import { AssetFactory } from '../graphics/AssetFactory';
import { gridToScreen, calculateDepth } from '../engine/IsoMath';
import { FogOfWar, VisibilityState } from '../fog/FogOfWar';

export class TilemapRenderer {
  private floorContainer: Container;
  private objectContainer: Container;

  private floorSprites: Sprite[][] = [];
  private propSprites: Map<string, Sprite> = new Map();
  private wallSprites: Sprite[] = [];

  constructor(floorContainer: Container, objectContainer: Container) {
    this.floorContainer = floorContainer;
    this.objectContainer = objectContainer;
  }

  public renderDungeon(dungeon: DungeonLevel): void {
    // Clear previous sprites
    this.floorContainer.removeChildren();
    this.objectContainer.removeChildren();
    this.floorSprites = [];
    this.propSprites.clear();
    this.wallSprites = [];

    // 1. Render floor tiles
    for (let y = 0; y < dungeon.height; y++) {
      const row: Sprite[] = [];
      for (let x = 0; x < dungeon.width; x++) {
        const tile = dungeon.tiles[y][x];
        const screenPos = gridToScreen(x, y);

        let textureKey = dungeon.floorVariants[y][x];
        if (tile === TileType.EMPTY) {
          textureKey = 'tile_floor_stone';
        }

        const spr = new Sprite(AssetFactory.getTexture(textureKey));
        spr.x = screenPos.x;
        spr.y = screenPos.y;
        spr.zIndex = calculateDepth(x, y, 0);
        spr.visible = false; // Hidden until explored

        this.floorContainer.addChild(spr);
        row.push(spr);

        // 2. Render walls and props on top of tile
        if (tile === TileType.WALL_NORTH) {
          const wallSpr = new Sprite(AssetFactory.getTexture('tile_wall_north'));
          wallSpr.x = screenPos.x;
          wallSpr.y = screenPos.y - 40; // Elevate wall sprite
          wallSpr.zIndex = calculateDepth(x, y, 15);
          wallSpr.visible = false;
          this.objectContainer.addChild(wallSpr);
          this.wallSprites.push(wallSpr);
          (wallSpr as any).tileX = x;
          (wallSpr as any).tileY = y;
        } else if (tile === TileType.WALL_WEST) {
          const wallSpr = new Sprite(AssetFactory.getTexture('tile_wall_west'));
          wallSpr.x = screenPos.x;
          wallSpr.y = screenPos.y - 40;
          wallSpr.zIndex = calculateDepth(x, y, 15);
          wallSpr.visible = false;
          this.objectContainer.addChild(wallSpr);
          this.wallSprites.push(wallSpr);
          (wallSpr as any).tileX = x;
          (wallSpr as any).tileY = y;
        } else if (tile === TileType.WALL_CORNER) {
          const wallNorth = new Sprite(AssetFactory.getTexture('tile_wall_north'));
          wallNorth.x = screenPos.x;
          wallNorth.y = screenPos.y - 40;
          wallNorth.zIndex = calculateDepth(x, y, 15);
          wallNorth.visible = false;
          this.objectContainer.addChild(wallNorth);
          this.wallSprites.push(wallNorth);
          (wallNorth as any).tileX = x;
          (wallNorth as any).tileY = y;

          const wallWest = new Sprite(AssetFactory.getTexture('tile_wall_west'));
          wallWest.x = screenPos.x;
          wallWest.y = screenPos.y - 40;
          wallWest.zIndex = calculateDepth(x, y, 16);
          wallWest.visible = false;
          this.objectContainer.addChild(wallWest);
          this.wallSprites.push(wallWest);
          (wallWest as any).tileX = x;
          (wallWest as any).tileY = y;
        } else if (tile === TileType.PILLAR) {
          const pillarSpr = new Sprite(AssetFactory.getTexture('tile_pillar'));
          pillarSpr.x = screenPos.x + 8;
          pillarSpr.y = screenPos.y - 40;
          pillarSpr.zIndex = calculateDepth(x, y, 20);
          pillarSpr.visible = false;
          this.objectContainer.addChild(pillarSpr);
          this.wallSprites.push(pillarSpr);
          (pillarSpr as any).tileX = x;
          (pillarSpr as any).tileY = y;
        } else if (tile === TileType.DOOR) {
          const doorSpr = new Sprite(AssetFactory.getTexture('prop_door_closed'));
          doorSpr.x = screenPos.x + 8;
          doorSpr.y = screenPos.y - 32;
          doorSpr.zIndex = calculateDepth(x, y, 18);
          doorSpr.visible = false;
          this.objectContainer.addChild(doorSpr);
          this.propSprites.set(`door_${x}_${y}`, doorSpr);
          (doorSpr as any).tileX = x;
          (doorSpr as any).tileY = y;
        } else if (tile === TileType.SARCOPHAGUS) {
          const sarcSpr = new Sprite(AssetFactory.getTexture('prop_sarcophagus'));
          sarcSpr.x = screenPos.x + 8;
          sarcSpr.y = screenPos.y - 10;
          sarcSpr.zIndex = calculateDepth(x, y, 10);
          sarcSpr.visible = false;
          this.objectContainer.addChild(sarcSpr);
          this.propSprites.set(`sarcophagus_${x}_${y}`, sarcSpr);
          (sarcSpr as any).tileX = x;
          (sarcSpr as any).tileY = y;
        } else if (tile === TileType.URN) {
          const urnSpr = new Sprite(AssetFactory.getTexture('prop_urn'));
          urnSpr.x = screenPos.x + 20;
          urnSpr.y = screenPos.y - 8;
          urnSpr.zIndex = calculateDepth(x, y, 10);
          urnSpr.visible = false;
          this.objectContainer.addChild(urnSpr);
          this.propSprites.set(`urn_${x}_${y}`, urnSpr);
          (urnSpr as any).tileX = x;
          (urnSpr as any).tileY = y;
        } else if (tile === TileType.STAIRS_DOWN) {
          const stairsSpr = new Sprite(AssetFactory.getTexture('prop_stairs_down'));
          stairsSpr.x = screenPos.x;
          stairsSpr.y = screenPos.y - 8;
          stairsSpr.zIndex = calculateDepth(x, y, 2);
          stairsSpr.visible = false;
          this.objectContainer.addChild(stairsSpr);
          this.propSprites.set(`stairs_${x}_${y}`, stairsSpr);
          (stairsSpr as any).tileX = x;
          (stairsSpr as any).tileY = y;
        }
      }
      this.floorSprites.push(row);
    }

    // Add wall torches
    for (const torch of dungeon.torches) {
      const screenPos = gridToScreen(torch.gx, torch.gy);
      const torchSpr = new Sprite(AssetFactory.getTexture('prop_torch'));
      torchSpr.x = screenPos.x + 20;
      torchSpr.y = screenPos.y - 28;
      torchSpr.zIndex = calculateDepth(torch.gx, torch.gy, 25);
      torchSpr.visible = false;
      this.objectContainer.addChild(torchSpr);
      this.wallSprites.push(torchSpr);
      (torchSpr as any).tileX = torch.gx;
      (torchSpr as any).tileY = torch.gy;
    }
  }

  public updateVisibility(dungeon: DungeonLevel, fog: FogOfWar): void {
    // Update floor visibility
    for (let y = 0; y < dungeon.height; y++) {
      for (let x = 0; x < dungeon.width; x++) {
        const spr = this.floorSprites[y]?.[x];
        if (spr) {
          const state = fog.visibility[y][x];
          spr.visible = state !== VisibilityState.UNEXPLORED;
        }
      }
    }

    // Update wall visibility
    for (const spr of this.wallSprites) {
      const tx = (spr as any).tileX;
      const ty = (spr as any).tileY;
      if (tx !== undefined && ty !== undefined) {
        spr.visible = fog.isExplored(tx, ty);
      }
    }

    // Update prop visibility
    for (const [, spr] of this.propSprites) {
      const tx = (spr as any).tileX;
      const ty = (spr as any).tileY;
      if (tx !== undefined && ty !== undefined) {
        spr.visible = fog.isExplored(tx, ty);
      }
    }
  }

  public updateDoor(door: DoorData): void {
    const key = `door_${door.gx}_${door.gy}`;
    const spr = this.propSprites.get(key);
    if (spr) {
      spr.texture = AssetFactory.getTexture(
        door.isOpen ? 'prop_door_open' : 'prop_door_closed'
      );
    }
  }

  public updatePropBroken(prop: PropData): void {
    const key = `${prop.type === TileType.SARCOPHAGUS ? 'sarcophagus' : 'urn'}_${prop.gx}_${prop.gy}`;
    const spr = this.propSprites.get(key);
    if (spr) {
      spr.alpha = 0.5; // Visual feedback that it's broken / looted
    }
  }
}
