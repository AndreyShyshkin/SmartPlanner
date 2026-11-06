import { DeviceType, Point2D, RectBounds } from '../types';
import { BaseDeviceState, ISmartDevice } from '../interfaces/ISmartDevice';

export abstract class BaseDevice<TState extends BaseDeviceState = BaseDeviceState>
  implements ISmartDevice<TState> {
  public readonly id: string;
  public name: string;
  public readonly type: DeviceType;
  public roomId: string | null;
  public groupId: string | null;
  public isEnabled: boolean;
  public x: number;
  public y: number;
  protected state: TState;

  constructor(
    id: string,
    name: string,
    type: DeviceType,
    x: number,
    y: number,
    initialState: TState,
    roomId: string | null = null,
    groupId: string | null = null,
    isEnabled: boolean = true
  ) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.x = x;
    this.y = y;
    this.state = { ...initialState };
    this.roomId = roomId;
    this.groupId = groupId;
    this.isEnabled = isEnabled;
  }

  public getState(): TState {
    return { ...this.state };
  }

  public setState(patch: Partial<TState>): void {
    this.state = {
      ...this.state,
      ...patch,
    };
  }

  public toggle(): void {
    this.setState({ isOn: !this.state.isOn } as unknown as Partial<TState>);
  }

  public getBounds(): RectBounds {
    return {
      minX: this.x - 0.4,
      minY: this.y - 0.4,
      maxX: this.x + 0.4,
      maxY: this.y + 0.4,
    };
  }

  public containsPoint(point: Point2D): boolean {
    const dx = point.x - this.x;
    const dy = point.y - this.y;
    return dx * dx + dy * dy <= 0.25;
  }

  public distanceTo(point: Point2D): number {
    const dx = point.x - this.x;
    const dy = point.y - this.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  public abstract getStatusSummary(): string;
  public abstract getIconName(): string;
  public abstract clone(): ISmartDevice<TState>;

  public toJSON(): any {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      x: this.x,
      y: this.y,
      state: this.state,
      roomId: this.roomId,
      groupId: this.groupId,
      isEnabled: this.isEnabled,
    };
  }
}
