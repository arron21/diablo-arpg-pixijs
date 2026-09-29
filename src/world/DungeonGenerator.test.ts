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
});
