import { BaseDevice } from './BaseDevice';
import { IControllable, ITemperatureModifier } from '../interfaces/IControllable';
import { BaseDeviceState } from '../interfaces/ISmartDevice';

export interface ACState extends BaseDeviceState {
  isOn: boolean;
  targetTemp: number;
  fanSpeed: 'low' | 'medium' | 'high' | 'turbo';
  mode: 'cool' | 'heat' | 'dry' | 'fan';
}

export class ACDevice extends BaseDevice<ACState> implements IControllable, ITemperatureModifier {
  constructor(
    id: string,
    name: string,
    x: number,
    y: number,
    state: Partial<ACState> = {},
    roomId: string | null = null,
    groupId: string | null = null,
    isEnabled: boolean = true
  ) {
    const defaultState: ACState = {
      isOn: false,
      targetTemp: 21,
      fanSpeed: 'medium',
      mode: 'cool',
      ...state,
    };
    super(id, name, 'ac', x, y, defaultState, roomId, groupId, isEnabled);
  }

  public executeCommand(command: string, payload?: any): void {
    if (command === 'turnOn') this.setState({ isOn: true });
    else if (command === 'turnOff') this.setState({ isOn: false });
    else if (command === 'toggle') this.toggle();
    else if (command === 'setTargetTemp' && typeof payload === 'number') {
      this.setState({ targetTemp: Math.max(16, Math.min(30, payload)) });
    } else if (command === 'setFanSpeed') {
      this.setState({ fanSpeed: payload });
    } else if (command === 'setMode') {
      this.setState({ mode: payload });
    }
  }

  public getTemperatureContribution(): number {
    if (!this.isEnabled || !this.state.isOn) return 0;
    if (this.state.mode === 'cool') return -0.07;
    if (this.state.mode === 'heat') return 0.07;
    return 0;
  }

  public getStatusSummary(): string {
    if (!this.state.isOn) return 'Off';
    return `${this.state.mode.toUpperCase()} • ${this.state.targetTemp}°C`;
  }

  public getIconName(): string {
    return 'Wind';
  }

  public clone(): ACDevice {
    return new ACDevice(
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
