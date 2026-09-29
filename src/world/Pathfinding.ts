import { GridCoord } from '../engine/IsoMath';
import { DungeonLevel, DungeonGenerator } from './DungeonGenerator';

interface Node {
  gx: number;
  gy: number;
  g: number;
  h: number;
  f: number;
  parent: Node | null;
}

export class Pathfinding {
  public static findPath(
    dungeon: DungeonLevel,
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    maxSearchNodes: number = 1000
  ): GridCoord[] {
    if (startX === targetX && startY === targetY) {
      return [];
    }

    // If target itself is not walkable, search nearest adjacent walkable tile
    let endX = targetX;
    let endY = targetY;
    if (!this.isWalkableTile(dungeon, endX, endY)) {
      const neighbors = [
        { x: endX + 1, y: endY }, { x: endX - 1, y: endY },
        { x: endX, y: endY + 1 }, { x: endX, y: endY - 1 },
        { x: endX + 1, y: endY + 1 }, { x: endX - 1, y: endY - 1 },
        { x: endX + 1, y: endY - 1 }, { x: endX - 1, y: endY + 1 }
      ];
      let closest: { x: number; y: number } | null = null;
      let closestDist = Infinity;
      for (const n of neighbors) {
        if (this.isWalkableTile(dungeon, n.x, n.y)) {
          const d = Math.hypot(n.x - startX, n.y - startY);
          if (d < closestDist) {
            closestDist = d;
            closest = n;
          }
        }
      }
      if (closest) {
        endX = closest.x;
        endY = closest.y;
      } else {
        return [];
      }
    }

    const openList: Node[] = [];
    const closedSet: Set<string> = new Set();
    const openMap: Map<string, Node> = new Map();

    const startNode: Node = {
      gx: startX,
      gy: startY,
      g: 0,
      h: this.heuristic(startX, startY, endX, endY),
      f: this.heuristic(startX, startY, endX, endY),
      parent: null
    };

    openList.push(startNode);
    openMap.set(`${startX},${startY}`, startNode);

    let nodesSearched = 0;

    while (openList.length > 0 && nodesSearched < maxSearchNodes) {
      nodesSearched++;

      // Find node with lowest f
      let lowestIdx = 0;
      for (let i = 1; i < openList.length; i++) {
        if (openList[i].f < openList[lowestIdx].f) {
          lowestIdx = i;
        }
      }

      const current = openList.splice(lowestIdx, 1)[0];
      const currentKey = `${current.gx},${current.gy}`;
      openMap.delete(currentKey);
      closedSet.add(currentKey);

      // Reached destination?
      if (current.gx === endX && current.gy === endY) {
        const path: GridCoord[] = [];
        let curr: Node | null = current;
        while (curr && (curr.gx !== startX || curr.gy !== startY)) {
          path.unshift({ gx: curr.gx, gy: curr.gy });
          curr = curr.parent;
        }
        return path;
      }

      // Check 8 neighbors
      const directions = [
        { dx: 1, dy: 0, cost: 1.0 },
        { dx: -1, dy: 0, cost: 1.0 },
        { dx: 0, dy: 1, cost: 1.0 },
        { dx: 0, dy: -1, cost: 1.0 },
        { dx: 1, dy: 1, cost: 1.414 },
        { dx: 1, dy: -1, cost: 1.414 },
        { dx: -1, dy: 1, cost: 1.414 },
        { dx: -1, dy: -1, cost: 1.414 }
      ];

      for (const dir of directions) {
        const nx = current.gx + dir.dx;
        const ny = current.gy + dir.dy;
        const nKey = `${nx},${ny}`;

        if (closedSet.has(nKey)) continue;

        if (!this.isWalkableTile(dungeon, nx, ny)) continue;

        // Diagonal corner cutting check
        if (dir.dx !== 0 && dir.dy !== 0) {
          if (
            !this.isWalkableTile(dungeon, current.gx + dir.dx, current.gy) ||
            !this.isWalkableTile(dungeon, current.gx, current.gy + dir.dy)
          ) {
            continue; // Prevent cutting across wall corners
          }
        }

        const tentativeG = current.g + dir.cost;
        const existingNode = openMap.get(nKey);

        if (!existingNode) {
          const neighborNode: Node = {
            gx: nx,
            gy: ny,
            g: tentativeG,
            h: this.heuristic(nx, ny, endX, endY),
            f: tentativeG + this.heuristic(nx, ny, endX, endY),
            parent: current
          };
          openList.push(neighborNode);
          openMap.set(nKey, neighborNode);
        } else if (tentativeG < existingNode.g) {
          existingNode.g = tentativeG;
          existingNode.f = tentativeG + existingNode.h;
          existingNode.parent = current;
        }
      }
    }

    return []; // No path found
  }

  private static isWalkableTile(dungeon: DungeonLevel, gx: number, gy: number): boolean {
    if (gx < 0 || gx >= dungeon.width || gy < 0 || gy >= dungeon.height) {
      return false;
    }
    const tile = dungeon.tiles[gy][gx];
    return DungeonGenerator.isWalkable(tile);
  }

  private static heuristic(x1: number, y1: number, x2: number, y2: number): number {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    return (dx + dy) + (1.414 - 2) * Math.min(dx, dy);
  }
}
