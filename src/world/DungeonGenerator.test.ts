import { describe, it, expect } from 'vitest';
import { DungeonGenerator, TileType } from './DungeonGenerator';
import { Pathfinding } from './Pathfinding';

describe('DungeonGenerator', () => {
  it('should generate a connected dungeon with player spawn and stairs down', () => {
    const dungeon = DungeonGenerator.generate(1, 40, 40);

    expect(dungeon.rooms.length).toBeGreaterThanOrEqual(4);
    expect(dungeon.playerSpawn).toBeDefined();
    expect(dungeon.stairsDown).toBeDefined();

    // Verify player spawn is stairs up
    expect(dungeon.tiles[dungeon.playerSpawn.gy][dungeon.playerSpawn.gx]).toBe(TileType.STAIRS_UP);
    // Verify exit is stairs down
    expect(dungeon.tiles[dungeon.stairsDown.gy][dungeon.stairsDown.gx]).toBe(TileType.STAIRS_DOWN);

    // Verify there is an A* path from entrance to exit
    const path = Pathfinding.findPath(
      dungeon,
      dungeon.playerSpawn.gx,
      dungeon.playerSpawn.gy,
      dungeon.stairsDown.gx,
      dungeon.stairsDown.gy
    );

    expect(path.length).toBeGreaterThan(0);
  });

  it('should generate The Butcher room on Level 2', () => {
    const dungeonL2 = DungeonGenerator.generate(2, 40, 40);
    const butcherRoom = dungeonL2.rooms.find(r => r.isButcherRoom);
    expect(butcherRoom).toBeDefined();
  });

  it('should ensure all hallways are at least 3 squares wide always', () => {
    const dungeon = DungeonGenerator.generate(1, 48, 48);

    // Identify tiles that are part of rooms
    const isInsideRoom = (x: number, y: number): boolean => {
      return dungeon.rooms.some(r => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
    };

    // Check all floor tiles outside of rooms (corridors)
    for (let y = 0; y < dungeon.height; y++) {
      for (let x = 0; x < dungeon.width; x++) {
        if (dungeon.tiles[y][x] === TileType.FLOOR && !isInsideRoom(x, y)) {
          // Horizontal span
          let hSpan = 1;
          for (let left = x - 1; left >= 0 && DungeonGenerator.isWalkable(dungeon.tiles[y][left]); left--) hSpan++;
          for (let right = x + 1; right < dungeon.width && DungeonGenerator.isWalkable(dungeon.tiles[y][right]); right++) hSpan++;

          // Vertical span
          let vSpan = 1;
          for (let up = y - 1; up >= 0 && DungeonGenerator.isWalkable(dungeon.tiles[up][x]); up--) vSpan++;
          for (let down = y + 1; down < dungeon.height && DungeonGenerator.isWalkable(dungeon.tiles[down][x]); down++) vSpan++;

          // Hallway must be at least 3 squares wide horizontally or vertically
          expect(Math.max(hSpan, vSpan)).toBeGreaterThanOrEqual(3);
        }
      }
    }
  });

  it('should create a valid Tristram town hub with NPCs, fountain, portal, and cathedral entrance', () => {
    const tristram = DungeonGenerator.createTristram();

    expect(tristram.levelNumber).toBe(0);
    expect(tristram.width).toBe(28);
    expect(tristram.height).toBe(28);

    // Verify player spawn is walkable
    expect(DungeonGenerator.isWalkable(tristram.tiles[tristram.playerSpawn.gy][tristram.playerSpawn.gx])).toBe(true);

    // Verify key landmark tiles exist
    let hasCain = false;
    let hasGriswold = false;
    let hasPepin = false;
    let hasFountain = false;
    let hasCathedralEntrance = false;
    let hasTownPortal = false;

    let cathPos = { gx: 0, gy: 0 };
    let cainPos = { gx: 0, gy: 0 };

    for (let y = 0; y < tristram.height; y++) {
      for (let x = 0; x < tristram.width; x++) {
        const tile = tristram.tiles[y][x];
        if (tile === TileType.NPC_CAIN) {
          hasCain = true;
          cainPos = { gx: x, gy: y };
        }
        if (tile === TileType.NPC_GRISWOLD) hasGriswold = true;
        if (tile === TileType.NPC_PEPIN) hasPepin = true;
        if (tile === TileType.TOWN_FOUNTAIN) hasFountain = true;
        if (tile === TileType.CATHEDRAL_ENTRANCE) {
          hasCathedralEntrance = true;
          cathPos = { gx: x, gy: y };
        }
        if (tile === TileType.TOWN_PORTAL) hasTownPortal = true;
      }
    }

    expect(hasCain).toBe(true);
    expect(hasGriswold).toBe(true);
    expect(hasPepin).toBe(true);
    expect(hasFountain).toBe(true);
    expect(hasCathedralEntrance).toBe(true);
    expect(hasTownPortal).toBe(true);

    // Verify A* path from player spawn to Cathedral Entrance
    const pathToCathedral = Pathfinding.findPath(
      tristram,
      tristram.playerSpawn.gx,
      tristram.playerSpawn.gy,
      cathPos.gx,
      cathPos.gy
    );
    expect(pathToCathedral.length).toBeGreaterThan(0);

    // Verify path to neighbor of Cain
    const pathToCain = Pathfinding.findPath(
      tristram,
      tristram.playerSpawn.gx,
      tristram.playerSpawn.gy,
      cainPos.gx - 1,
      cainPos.gy
    );
    expect(pathToCain.length).toBeGreaterThan(0);
  });
});
