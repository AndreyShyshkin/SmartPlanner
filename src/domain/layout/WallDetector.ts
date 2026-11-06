import { Point2D, WallSegment } from '../types';
import { Room } from './Room';
import { Door } from './Door';

export interface WallEdge {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  orientation: 'horizontal' | 'vertical';
  cellX: number;
  cellY: number;
  room1Id: string | null;
  room2Id: string | null;
}

export class WallDetector {
  /**
   * Scans rooms and returns all wall segments and edges.
   */
  public static extractWalls(rooms: Room[], doors: Door[] = []): WallSegment[] {
    const tileMap = new Map<string, string>(); // "x,y" => roomId
    for (const room of rooms) {
      for (const tile of room.getTilesList()) {
        tileMap.set(`${tile.x},${tile.y}`, room.id);
      }
    }

    const segments: WallSegment[] = [];

    // Helper to check if a door covers this segment
    const findDoorForEdge = (
      x1: number,
      y1: number,
      x2: number,
      y2: number
    ): Door | undefined => {
      return doors.find((d) => {
        if (d.orientation === 'horizontal') {
          // Horizontal door along y
          return (
            Math.abs(y1 - d.y) < 0.1 &&
            Math.abs(y2 - d.y) < 0.1 &&
            Math.min(x1, x2) <= d.x &&
            Math.max(x1, x2) >= d.x + 1
          );
        } else {
          // Vertical door along x
          return (
            Math.abs(x1 - d.x) < 0.1 &&
            Math.abs(x2 - d.x) < 0.1 &&
            Math.min(y1, y2) <= d.y &&
            Math.max(y1, y2) >= d.y + 1
          );
        }
      });
    };

    for (const [key, roomId] of Array.from(tileMap.entries())) {
      const [x, y] = key.split(',').map(Number);

      // Top edge (y)
      const topNeighbor = tileMap.get(`${x},${y - 1}`);
      if (!topNeighbor || topNeighbor !== roomId) {
        const door = findDoorForEdge(x, y, x + 1, y);
        segments.push({
          startX: x,
          startY: y,
          endX: x + 1,
          endY: y,
          isDoor: !!door && door.isOpen,
          doorId: door?.id,
        });
      }

      // Bottom edge (y + 1)
      const bottomNeighbor = tileMap.get(`${x},${y + 1}`);
      if (!bottomNeighbor || bottomNeighbor !== roomId) {
        const door = findDoorForEdge(x, y + 1, x + 1, y + 1);
        segments.push({
          startX: x,
          startY: y + 1,
          endX: x + 1,
          endY: y + 1,
          isDoor: !!door && door.isOpen,
          doorId: door?.id,
        });
      }

      // Left edge (x)
      const leftNeighbor = tileMap.get(`${x - 1},${y}`);
      if (!leftNeighbor || leftNeighbor !== roomId) {
        const door = findDoorForEdge(x, y, x, y + 1);
        segments.push({
          startX: x,
          startY: y,
          endX: x,
          endY: y + 1,
          isDoor: !!door && door.isOpen,
          doorId: door?.id,
        });
      }

      // Right edge (x + 1)
      const rightNeighbor = tileMap.get(`${x + 1},${y}`);
      if (!rightNeighbor || rightNeighbor !== roomId) {
        const door = findDoorForEdge(x + 1, y, x + 1, y + 1);
        segments.push({
          startX: x + 1,
          startY: y,
          endX: x + 1,
          endY: y + 1,
          isDoor: !!door && door.isOpen,
          doorId: door?.id,
        });
      }
    }

    return segments;
  }

  /**
   * Validates if a coordinate (x, y) with orientation is on a room wall.
   * Used when placing doors (Doors can ONLY be placed on walls).
   */
  public static isValidDoorPlacement(
    rooms: Room[],
    x: number,
    y: number,
    orientation: 'horizontal' | 'vertical'
  ): { isValid: boolean; connectedRooms: string[] } {
    const tileMap = new Map<string, string>();
    for (const room of rooms) {
      for (const tile of room.getTilesList()) {
        tileMap.set(`${tile.x},${tile.y}`, room.id);
      }
    }

    const connectedRooms = new Set<string>();

    if (orientation === 'horizontal') {
      // Wall runs along horizontal grid line y, between cell (x, y - 1) and (x, y)
      const top = tileMap.get(`${x},${y - 1}`);
      const bottom = tileMap.get(`${x},${y}`);

      if (top) connectedRooms.add(top);
      if (bottom) connectedRooms.add(bottom);

      // Must separate a room and exterior OR two different rooms
      const isValid = (!!top || !!bottom) && top !== bottom;
      return { isValid, connectedRooms: Array.from(connectedRooms) };
    } else {
      // Wall runs along vertical grid line x, between cell (x - 1, y) and (x, y)
      const left = tileMap.get(`${x - 1},${y}`);
      const right = tileMap.get(`${x},${y}`);

      if (left) connectedRooms.add(left);
      if (right) connectedRooms.add(right);

      const isValid = (!!left || !!right) && left !== right;
      return { isValid, connectedRooms: Array.from(connectedRooms) };
    }
  }

  /**
   * Finds which room contains the given point (x, y).
   */
  public static findRoomAtPoint(rooms: Room[], point: Point2D): Room | null {
    const cellX = Math.floor(point.x);
    const cellY = Math.floor(point.y);
    for (const room of rooms) {
      if (room.hasTile(cellX, cellY)) {
        return room;
      }
    }
    return null;
  }
}
