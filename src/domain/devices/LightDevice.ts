import { BaseDevice } from './BaseDevice';
import { IControllable } from '../interfaces/IControllable';
import { BaseDeviceState } from '../interfaces/ISmartDevice';

export interface LightState extends BaseDeviceState {
  isOn: boolean;
  brightness: number; // 0 - 100%
  color: string;      // hex format
}

export class LightDevice extends BaseDevice<LightState> implements IControllable {
  constructor(
    id: string,
    name: string,
    x: number,
    y: number,
    state: Partial<LightState> = {},
    roomId: string | null = null,
    groupId: string | null = null,
    isEnabled: boolean = true
  ) {
    const defaultState: LightState = {
      isOn: false,
      brightness: 80,
      color: '#FFD60A', // Warm Apple yellow
      ...state,
    };
    super(id, name, 'light', x, y, defaultState, roomId, groupId, isEnabled);
  }

  public executeCommand(command: string, payload?: any): void {
    if (command === 'turnOn') this.setState({ isOn: true });
    else if (command === 'turnOff') this.setState({ isOn: false });
    else if (command === 'toggle') this.toggle();
    else if (command === 'setBrightness' && typeof payload === 'number') {
      this.setState({ brightness: Math.max(0, Math.min(100, payload)), isOn: payload > 0 });
    } else if (command === 'setColor' && typeof payload === 'string') {
      this.setState({ color: payload });
    }
  }

  public getStatusSummary(): string {
    if (!this.state.isOn) return 'Off';
    return `${this.state.brightness}% • ${this.state.color}`;
  }

  public getIconName(): string {
    return 'Lightbulb';
  }

  public clone(): LightDevice {
    return new LightDevice(
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
