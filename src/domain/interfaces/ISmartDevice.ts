import { DeviceType, Point2D } from '../types';
import { IGeometricItem } from './IGeometricItem';
import { ISerializable } from './ISerializable';

export interface BaseDeviceState {
  isOn: boolean;
  [key: string]: any;
}

export interface ISmartDevice<TState extends BaseDeviceState = BaseDeviceState>
  extends IGeometricItem,
    ISerializable<any> {
  readonly id: string;
  name: string;
  readonly type: DeviceType;
  roomId: string | null;
  groupId: string | null;
  isEnabled: boolean;

  getState(): TState;
  setState(patch: Partial<TState>): void;
  toggle(): void;
  getStatusSummary(): string;
  getIconName(): string;
  clone(): ISmartDevice<TState>;
}
