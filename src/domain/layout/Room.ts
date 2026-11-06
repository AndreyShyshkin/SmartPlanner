import { Point2D, RectBounds, RoomData } from '../types';
import { ISerializable } from '../interfaces/ISerializable';

export class Room implements ISerializable<RoomData> {
  public id: string;
  public name: string;
  public color: string;
  public tiles: Set<string>; // "x,y" keys
  public customTemperature?: number;

  constructor(
    id: string,
    name: string,
    color: string,
    tiles: Point2D[] = [],
    customTemperature?: number
  ) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.tiles = new Set(tiles.map((t) => `${t.x},${t.y}`));
    this.customTemperature = customTemperature;
  }

  public addTile(p: Point2D): void {
    this.tiles.add(`${p.x},${p.y}`);
  }

  public removeTile(p: Point2D): void {
    this.tiles.delete(`${p.x},${p.y}`);
  }

  public hasTile(x: number, y: number): boolean {
    return this.tiles.has(`${x},${y}`);
  }

  public getTilesList(): Point2D[] {
    return Array.from(this.tiles).map((key) => {
      const [x, y] = key.split(',').map(Number);
      return { x, y };
    });
  }

  public getBounds(): RectBounds {
    const list = this.getTilesList();
    if (list.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const t of list) {
      if (t.x < minX) minX = t.x;
      if (t.y < minY) minY = t.y;
      if (t.x > maxX) maxX = t.x;
      if (t.y > maxY) maxY = t.y;
    }
    return { minX, minY, maxX, maxY };
  }

  public getCenter(): Point2D {
    const bounds = this.getBounds();
    return {
      x: (bounds.minX + bounds.maxX + 1) / 2,
      y: (bounds.minY + bounds.maxY + 1) / 2,
    };
  }

  public getArea(): number {
    return this.tiles.size;
  }

  public moveBy(dx: number, dy: number): void {
    const nextTiles = new Set<string>();
    for (const key of Array.from(this.tiles)) {
      const [x, y] = key.split(',').map(Number);
      nextTiles.add(`${x + dx},${y + dy}`);
    }
    this.tiles = nextTiles;
  }

  public toJSON(): RoomData {
    return {
      id: this.id,
      name: this.name,
      color: this.color,
      tiles: this.getTilesList(),
      customTemperature: this.customTemperature,
    };
  }

  public static fromJSON(data: RoomData): Room {
    return new Room(data.id, data.name, data.color, data.tiles, data.customTemperature);
  }
}
