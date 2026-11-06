import { DeviceType } from '../types';
import { ISmartDevice } from '../interfaces/ISmartDevice';
import { LightDevice } from './LightDevice';
import { MotionSensorDevice } from './MotionSensorDevice';
import { DoorSensorDevice } from './DoorSensorDevice';
import { ThermostatDevice } from './ThermostatDevice';
import { HeaterDevice } from './HeaterDevice';
import { CurtainDevice } from './CurtainDevice';
import { ACDevice } from './ACDevice';
import { SocketDevice } from './SocketDevice';

export type DeviceConstructor = new (
  id: string,
  name: string,
  x: number,
  y: number,
  state?: any,
  roomId?: string | null,
  groupId?: string | null,
  isEnabled?: boolean
) => ISmartDevice<any>;

export class DeviceFactory {
  private static registry = new Map<DeviceType, DeviceConstructor>([
    ['light', LightDevice as unknown as DeviceConstructor],
    ['motion', MotionSensorDevice as unknown as DeviceConstructor],
    ['door_sensor', DoorSensorDevice as unknown as DeviceConstructor],
    ['thermostat', ThermostatDevice as unknown as DeviceConstructor],
    ['heater', HeaterDevice as unknown as DeviceConstructor],
    ['curtains', CurtainDevice as unknown as DeviceConstructor],
    ['ac', ACDevice as unknown as DeviceConstructor],
    ['socket', SocketDevice as unknown as DeviceConstructor],
  ]);

  public static registerDevice(type: DeviceType, ctor: DeviceConstructor): void {
    DeviceFactory.registry.set(type, ctor);
  }

  public static createDevice(
    type: DeviceType,
    params: {
      id?: string;
      name?: string;
      x: number;
      y: number;
      state?: any;
      roomId?: string | null;
      groupId?: string | null;
      isEnabled?: boolean;
    }
  ): ISmartDevice<any> {
    const ctor = DeviceFactory.registry.get(type);
    if (!ctor) {
      throw new Error(`Device type "${type}" is not registered in DeviceFactory`);
    }

    const id = params.id || `dev_${type}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const name = params.name || DeviceFactory.getDefaultName(type);
    const isEnabled = params.isEnabled !== undefined ? params.isEnabled : true;

    return new ctor(
      id,
      name,
      params.x,
      params.y,
      params.state || {},
      params.roomId || null,
      params.groupId || null,
      isEnabled
    );
  }

  public static fromJSON(data: any): ISmartDevice<any> {
    return DeviceFactory.createDevice(data.type, {
      id: data.id,
      name: data.name,
      x: data.x,
      y: data.y,
      state: data.state,
      roomId: data.roomId,
      groupId: data.groupId,
      isEnabled: data.isEnabled,
    });
  }

  public static getDefaultName(type: DeviceType): string {
    const names: Record<DeviceType, string> = {
      light: 'Лампа',
      motion: 'Датчик движения',
      door_sensor: 'Датчик открытия',
      thermostat: 'Термостат',
      heater: 'Умная батарея',
      curtains: 'Умные шторы',
      ac: 'Кондиционер',
      socket: 'Умная розетка',
    };
    return names[type] || 'Устройство';
  }

  public static getSupportedTypes(): DeviceType[] {
    return Array.from(DeviceFactory.registry.keys());
  }
}
