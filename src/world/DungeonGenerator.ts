export enum TileType {
  EMPTY = 0,
  FLOOR = 1,
  WALL_NORTH = 2,
  WALL_WEST = 3,
  WALL_CORNER = 4,
  PILLAR = 5,
  DOOR = 6,
  STAIRS_DOWN = 7,
  STAIRS_UP = 8,
  SARCOPHAGUS = 9,
  URN = 10,
  NPC_CAIN = 11,
  NPC_GRISWOLD = 12,
  NPC_PEPIN = 13,
  TOWN_FOUNTAIN = 14,
  CATHEDRAL_ENTRANCE = 15,
  TOWN_PORTAL = 16,
  TREE = 17,
}

export interface Room {
  x: number;
  y: number;
  w: number;
  h: number;
  centerX: number;
  centerY: number;
  isButcherRoom?: boolean;
}

export interface DoorData {
  gx: number;
  gy: number;
  isOpen: boolean;
}

export interface PropData {
  id: string;
  type: TileType;
  gx: number;
  gy: number;
  isOpenedOrBroken: boolean;
}

export interface TorchData {
  gx: number;
  gy: number;
  intensity: number;
  color: number;
}

export interface DungeonLevel {
  levelNumber: number;
  width: number;
  height: number;
  tiles: TileType[][];
  floorVariants: string[][];
  rooms: Room[];
  doors: Map<string, DoorData>;
  props: Map<string, PropData>;
  torches: TorchData[];
  playerSpawn: { gx: number; gy: number };
  stairsDown: { gx: number; gy: number };
}

export class DungeonGenerator {
  public static generate(levelNumber: number = 1, width: number = 48, height: number = 48): DungeonLevel {
    // Initialize empty grid
    const tiles: TileType[][] = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => TileType.EMPTY)
    );
    const floorVariants: string[][] = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => 'tile_floor_stone')
    );

    const rooms: Room[] = [];
    const minRoomSize = 6;
    const maxRoomSize = 10;
    const targetRoomCount = levelNumber === 2 ? 7 : 8;

    // 1. Carve rooms
    for (let attempts = 0; attempts < 60 && rooms.length < targetRoomCount; attempts++) {
      const rw = minRoomSize + Math.floor(Math.random() * (maxRoomSize - minRoomSize + 1));
      const rh = minRoomSize + Math.floor(Math.random() * (maxRoomSize - minRoomSize + 1));
      const rx = 3 + Math.floor(Math.random() * (width - rw - 6));
      const ry = 3 + Math.floor(Math.random() * (height - rh - 6));

      // Check overlap
      let overlaps = false;
      for (const room of rooms) {
        if (
          rx < room.x + room.w + 2 &&
          rx + rw + 2 > room.x &&
          ry < room.y + room.h + 2 &&
          ry + rh + 2 > room.y
        ) {
          overlaps = true;
          break;
        }
      }

      if (!overlaps) {
        const newRoom: Room = {
          x: rx,
          y: ry,
          w: rw,
          h: rh,
          centerX: Math.floor(rx + rw / 2),
          centerY: Math.floor(ry + rh / 2),
        };
        rooms.push(newRoom);

        // Carve floor
        for (let y = ry; y < ry + rh; y++) {
          for (let x = rx; x < rx + rw; x++) {
            tiles[y][x] = TileType.FLOOR;
            floorVariants[y][x] = Math.random() < 0.15 ? 'tile_floor_cracked' : 'tile_floor_stone';
          }
        }
      }
    }

    // Designate Butcher's room on Level 2
    if (levelNumber === 2 && rooms.length > 1) {
      const butcherRoom = rooms[rooms.length - 1];
      butcherRoom.isButcherRoom = true;
      for (let y = butcherRoom.y; y < butcherRoom.y + butcherRoom.h; y++) {
        for (let x = butcherRoom.x; x < butcherRoom.x + butcherRoom.w; x++) {
          floorVariants[y][x] = Math.random() < 0.65 ? 'tile_floor_blood' : 'tile_floor_cracked';
        }
      }
    }

    // 2. Connect rooms with corridors (always at least 3 squares wide)
    const carveCorridorTile = (x: number, y: number) => {
      if (x >= 2 && x < width - 2 && y >= 2 && y < height - 2) {
        tiles[y][x] = TileType.FLOOR;
        if (!floorVariants[y][x] || floorVariants[y][x] === 'tile_floor_stone') {
          floorVariants[y][x] = Math.random() < 0.12 ? 'tile_floor_cracked' : 'tile_floor_stone';
        }
      }
    };

    const connectRooms = (rA: Room, rB: Room) => {
      const minX = Math.min(rA.centerX, rB.centerX);
      const maxX = Math.max(rA.centerX, rB.centerX);
      const minY = Math.min(rA.centerY, rB.centerY);
      const maxY = Math.max(rA.centerY, rB.centerY);

      // Horizontal corridor (at least 3 squares wide vertically: cy-1, cy, cy+1)
      for (let x = minX; x <= maxX; x++) {
        carveCorridorTile(x, rA.centerY - 1);
        carveCorridorTile(x, rA.centerY);
        carveCorridorTile(x, rA.centerY + 1);
      }

      // Vertical corridor (at least 3 squares wide horizontally: cx-1, cx, cx+1)
      for (let y = minY; y <= maxY; y++) {
        carveCorridorTile(rB.centerX - 1, y);
        carveCorridorTile(rB.centerX, y);
        carveCorridorTile(rB.centerX + 1, y);
      }
    };

    for (let i = 0; i < rooms.length - 1; i++) {
      connectRooms(rooms[i], rooms[i + 1]);
    }

    // Optional loop connection to create sprawling gothic layouts
    if (rooms.length >= 4) {
      connectRooms(rooms[0], rooms[Math.floor(rooms.length / 2)]);
    }

    // 3. Wall autotiling & boundary walls
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (tiles[y][x] === TileType.EMPTY) {
          // If adjacent to a floor, place wall
          const hasFloorS = tiles[y + 1][x] === TileType.FLOOR;
          const hasFloorE = tiles[y][x + 1] === TileType.FLOOR;
          const hasFloorSE = tiles[y + 1][x + 1] === TileType.FLOOR;

          if (hasFloorS && hasFloorE) {
            tiles[y][x] = TileType.WALL_CORNER;
          } else if (hasFloorS) {
            tiles[y][x] = TileType.WALL_NORTH; // Faces south/east in isometric
          } else if (hasFloorE) {
            tiles[y][x] = TileType.WALL_WEST; // Faces south/west in isometric
          } else if (hasFloorSE) {
            tiles[y][x] = TileType.WALL_CORNER;
          }
        }
      }
    }

    // 4. Place Doors, Sarcophagi, Urns, and Pillars
    const doors = new Map<string, DoorData>();
    const props = new Map<string, PropData>();
    const torches: TorchData[] = [];

    // Doors at room entrances
    for (const room of rooms) {
      // Add pillars inside large rooms
      if (room.w >= 8 && room.h >= 8 && !room.isButcherRoom) {
        const px1 = room.x + 2;
        const py1 = room.y + 2;
        const px2 = room.x + room.w - 3;
        const py2 = room.y + room.h - 3;
        if (tiles[py1][px1] === TileType.FLOOR) tiles[py1][px1] = TileType.PILLAR;
        if (tiles[py2][px2] === TileType.FLOOR) tiles[py2][px2] = TileType.PILLAR;
      }

      // Add wall torches
      torches.push({
        gx: room.centerX,
        gy: room.y + 1,
        intensity: 0.8,
        color: 0xffaa44
      });

      // Place Sarcophagus in normal rooms
      if (!room.isButcherRoom && Math.random() < 0.6) {
        const sx = room.x + 2;
        const sy = room.y + 1;
        if (tiles[sy][sx] === TileType.FLOOR) {
          tiles[sy][sx] = TileType.SARCOPHAGUS;
          props.set(`${sx},${sy}`, {
            id: `sarcophagus_${sx}_${sy}`,
            type: TileType.SARCOPHAGUS,
            gx: sx,
            gy: sy,
            isOpenedOrBroken: false
          });
        }
      }

      // Place Clay Urns in corners
      const urnPositions = [
        { x: room.x + 1, y: room.y + 1 },
        { x: room.x + room.w - 2, y: room.y + 1 },
        { x: room.x + 1, y: room.y + room.h - 2 }
      ];
      for (const pos of urnPositions) {
        if (tiles[pos.y][pos.x] === TileType.FLOOR && Math.random() < 0.7) {
          tiles[pos.y][pos.x] = TileType.URN;
          props.set(`${pos.x},${pos.y}`, {
            id: `urn_${pos.x}_${pos.y}`,
            type: TileType.URN,
            gx: pos.x,
            gy: pos.y,
            isOpenedOrBroken: false
          });
        }
      }
    }

    // 5. Player Spawn (First Room) & Stairs Down (Last Room)
    const firstRoom = rooms[0];
    const lastRoom = rooms[rooms.length - 1];

    const playerSpawn = { gx: firstRoom.centerX, gy: firstRoom.centerY };
    tiles[playerSpawn.gy][playerSpawn.gx] = TileType.STAIRS_UP;

    const stairsDown = { gx: lastRoom.centerX, gy: lastRoom.centerY };
    tiles[stairsDown.gy][stairsDown.gx] = TileType.STAIRS_DOWN;

    return {
      levelNumber,
      width,
      height,
      tiles,
      floorVariants,
      rooms,
      doors,
      props,
      torches,
      playerSpawn,
      stairsDown
    };
  }

  public static createTristram(): DungeonLevel {
    const width = 28;
    const height = 28;

    const tiles: TileType[][] = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => TileType.FLOOR)
    );
    const floorVariants: string[][] = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => 'tile_floor_grass')
    );

    const props: Map<string, PropData> = new Map();
    const torches: TorchData[] = [];

    // Outer border boundary trees
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (x <= 1 || y <= 1 || x >= width - 2 || y >= height - 2) {
          tiles[y][x] = TileType.TREE;
        } else if (
          (x <= 3 && y <= 6) ||
          (x >= width - 4 && y >= height - 6) ||
          (x <= 5 && y >= height - 6) ||
          (x >= width - 6 && y <= 4)
        ) {
          tiles[y][x] = TileType.TREE;
        }
      }
    }

    // 1. Cobblestone Town Center Plaza (gx: 11..17, gy: 11..17)
    for (let y = 11; y <= 17; y++) {
      for (let x = 11; x <= 17; x++) {
        tiles[y][x] = TileType.FLOOR;
        floorVariants[y][x] = (x + y) % 5 === 0 ? 'tile_floor_cracked' : 'tile_floor_stone';
      }
    }

    // 2. Dirt paths connecting town sections
    // Path to Griswold (West)
    for (let x = 5; x <= 11; x++) {
      for (let y = 13; y <= 15; y++) {
        if (tiles[y][x] !== TileType.TREE) {
          tiles[y][x] = TileType.FLOOR;
          floorVariants[y][x] = 'tile_floor_dirt';
        }
      }
    }

    // Path to Pepin (South-East)
    for (let x = 14; x <= 21; x++) {
      for (let y = 16; y <= 19; y++) {
        if (tiles[y][x] !== TileType.TREE) {
          tiles[y][x] = TileType.FLOOR;
          floorVariants[y][x] = 'tile_floor_dirt';
        }
      }
    }

    // Winding path to Cathedral Entrance (North-East)
    for (let y = 5; y <= 11; y++) {
      for (let x = 17; x <= 22; x++) {
        if (tiles[y][x] !== TileType.TREE) {
          tiles[y][x] = TileType.FLOOR;
          floorVariants[y][x] = 'tile_floor_dirt';
        }
      }
    }
    for (let x = 14; x <= 17; x++) {
      tiles[10][x] = TileType.FLOOR;
      floorVariants[10][x] = 'tile_floor_dirt';
    }

    // 3. Central Fountain & Town Props
    const fountainGx = 14;
    const fountainGy = 13;
    tiles[fountainGy][fountainGx] = TileType.TOWN_FOUNTAIN;
    props.set(`fountain_${fountainGx}_${fountainGy}`, {
      id: `fountain_${fountainGx}_${fountainGy}`,
      type: TileType.TOWN_FOUNTAIN,
      gx: fountainGx,
      gy: fountainGy,
      isOpenedOrBroken: false
    });

    // 4. Deckard Cain (Standing near town square fountain)
    const cainGx = 16;
    const cainGy = 14;
    tiles[cainGy][cainGx] = TileType.NPC_CAIN;
    props.set(`cain_${cainGx}_${cainGy}`, {
      id: `cain_${cainGx}_${cainGy}`,
      type: TileType.NPC_CAIN,
      gx: cainGx,
      gy: cainGy,
      isOpenedOrBroken: false
    });

    // 5. Griswold the Blacksmith (Standing at his forge to the West)
    const griswoldGx = 6;
    const griswoldGy = 14;
    tiles[griswoldGy][griswoldGx] = TileType.NPC_GRISWOLD;
    props.set(`griswold_${griswoldGx}_${griswoldGy}`, {
      id: `griswold_${griswoldGx}_${griswoldGy}`,
      type: TileType.NPC_GRISWOLD,
      gx: griswoldGx,
      gy: griswoldGy,
      isOpenedOrBroken: false
    });
    torches.push({ gx: griswoldGx + 1, gy: griswoldGy - 1, intensity: 1.0, color: 0xff6622 });

    // 6. Pepin the Healer (Standing by apothecary tent to the South-East)
    const pepinGx = 20;
    const pepinGy = 18;
    tiles[pepinGy][pepinGx] = TileType.NPC_PEPIN;
    props.set(`pepin_${pepinGx}_${pepinGy}`, {
      id: `pepin_${pepinGx}_${pepinGy}`,
      type: TileType.NPC_PEPIN,
      gx: pepinGx,
      gy: pepinGy,
      isOpenedOrBroken: false
    });

    // 7. Cathedral Entrance (North-East hill leading down into Cathedral Level 1)
    const cathGx = 21;
    const cathGy = 6;
    tiles[cathGy][cathGx] = TileType.CATHEDRAL_ENTRANCE;
    props.set(`cathedral_${cathGx}_${cathGy}`, {
      id: `cathedral_${cathGx}_${cathGy}`,
      type: TileType.CATHEDRAL_ENTRANCE,
      gx: cathGx,
      gy: cathGy,
      isOpenedOrBroken: false
    });
    torches.push({ gx: cathGx - 1, gy: cathGy, intensity: 1.0, color: 0xffaa33 });
    torches.push({ gx: cathGx + 1, gy: cathGy, intensity: 1.0, color: 0xffaa33 });

    // 8. Town Portal Pad (Center Plaza)
    const portalGx = 13;
    const portalGy = 13;
    tiles[portalGy][portalGx] = TileType.TOWN_PORTAL;
    props.set(`portal_${portalGx}_${portalGy}`, {
      id: `portal_${portalGx}_${portalGy}`,
      type: TileType.TOWN_PORTAL,
      gx: portalGx,
      gy: portalGy,
      isOpenedOrBroken: false
    });

    // Town square torch
    torches.push({ gx: 14, gy: 11, intensity: 0.9, color: 0xffaa44 });

    const playerSpawn = { gx: 13, gy: 15 };
    const stairsDown = { gx: cathGx, gy: cathGy };

    return {
      levelNumber: 0,
      width,
      height,
      tiles,
      floorVariants,
      rooms: [{ x: 11, y: 11, w: 7, h: 7, centerX: 14, centerY: 14 }],
      doors: new Map(),
      props,
      torches,
      playerSpawn,
      stairsDown
    };
  }

  public static isWalkable(type: TileType): boolean {
    return (
      type === TileType.FLOOR ||
      type === TileType.STAIRS_DOWN ||
      type === TileType.STAIRS_UP ||
      type === TileType.CATHEDRAL_ENTRANCE ||
      type === TileType.TOWN_PORTAL
    );
  }

  public static isOpaque(type: TileType): boolean {
    return (
      type === TileType.WALL_NORTH ||
      type === TileType.WALL_WEST ||
      type === TileType.WALL_CORNER ||
      type === TileType.PILLAR ||
      type === TileType.TREE ||
      type === TileType.EMPTY
    );
  }
}
