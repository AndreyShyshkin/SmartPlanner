import { DoorData, DoorOrientation, Point2D } from '../types';
import { ISerializable } from '../interfaces/ISerializable';

export class Door implements ISerializable<DoorData> {
  public id: string;
  public x: number;
  public y: number;
  public orientation: DoorOrientation;
  public isOpen: boolean;
  public name?: string;
  public connectedRoomIds: string[];

  constructor(
    id: string,
    x: number,
    y: number,
    orientation: DoorOrientation = 'horizontal',
    isOpen: boolean = false,
    name?: string,
    connectedRoomIds: string[] = []
  ) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.orientation = orientation;
    this.isOpen = isOpen;
    this.name = name || 'Дверь';
    this.connectedRoomIds = connectedRoomIds;
  }

  public toggle(): void {
    this.isOpen = !this.isOpen;
  }

  public containsPoint(point: Point2D): boolean {
    const dx = Math.abs(point.x - (this.x + 0.5));
    const dy = Math.abs(point.y - (this.y + 0.5));
    return dx < 0.6 && dy < 0.6;
  }

  public toJSON(): DoorData {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      orientation: this.orientation,
      isOpen: this.isOpen,
      name: this.name,
      connectedRoomIds: this.connectedRoomIds,
    };
  }

  public static fromJSON(data: DoorData): Door {
    return new Door(
      data.id,
      data.x,
      data.y,
      data.orientation,
      data.isOpen,
      data.name,
      data.connectedRoomIds
    );
  }
}
