import { BaseDevice } from './BaseDevice';
import { IControllable } from '../interfaces/IControllable';
import { BaseDeviceState } from '../interfaces/ISmartDevice';

export interface SocketState extends BaseDeviceState {
  isOn: boolean;
  powerWatts: number;
}

export class SocketDevice extends BaseDevice<SocketState> implements IControllable {
  constructor(
    id: string,
    name: string,
    x: number,
    y: number,
    state: Partial<SocketState> = {},
    roomId: string | null = null,
    groupId: string | null = null,
    isEnabled: boolean = true
  ) {
    const defaultState: SocketState = {
      isOn: false,
      powerWatts: 0,
      ...state,
    };
    super(id, name, 'socket', x, y, defaultState, roomId, groupId, isEnabled);
  }

  public executeCommand(command: string, payload?: any): void {
    if (command === 'turnOn') this.setState({ isOn: true, powerWatts: 45 });
    else if (command === 'turnOff') this.setState({ isOn: false, powerWatts: 0 });
    else if (command === 'toggle') {
      const next = !this.state.isOn;
      this.setState({ isOn: next, powerWatts: next ? 45 : 0 });
    }
  }

  public getStatusSummary(): string {
    if (!this.state.isOn) return 'Off';
    return `${this.state.powerWatts} W`;
  }

  public getIconName(): string {
    return 'Zap';
  }

  public clone(): SocketDevice {
    return new SocketDevice(
      this.id,
      this.name,
      this.x,
      this.y,
      { ...this.state },
      this.roomId,
      this.groupId,
      this.isEnabled
    );
  }
}
