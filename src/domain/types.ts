export interface Point2D {
  x: number;
  y: number;
}

export interface GridSize {
  width: number;
  height: number;
}

export interface RectBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export type DeviceType =
  | 'light'
  | 'motion'
  | 'door_sensor'
  | 'thermostat'
  | 'heater'
  | 'curtains'
  | 'ac'
  | 'socket';

export interface RoomData {
  id: string;
  name: string;
  color: string;
  tiles: Point2D[];
  customTemperature?: number;
}

export type DoorOrientation = 'horizontal' | 'vertical';

export interface DoorData {
  id: string;
  x: number;
  y: number;
  orientation: DoorOrientation;
  isOpen: boolean;
  name?: string;
  connectedRoomIds: string[];
}

export interface DeviceGroup {
  id: string;
  name: string;
  roomIds: string[];
  deviceIds: string[];
  color?: string;
}

export interface WallSegment {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  isDoor?: boolean;
  doorId?: string;
  isDoorOpen?: boolean;
}
