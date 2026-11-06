import { BaseDevice } from './BaseDevice';
import { IControllable, ITemperatureModifier } from '../interfaces/IControllable';
import { BaseDeviceState } from '../interfaces/ISmartDevice';

export interface HeaterState extends BaseDeviceState {
  isOn: boolean;
  powerLevel: number; // 0 - 100%
  targetRoomTemp?: number;
}

export class HeaterDevice
  extends BaseDevice<HeaterState>
  implements IControllable, ITemperatureModifier {
  constructor(
    id: string,
    name: string,
    x: number,
    y: number,
    state: Partial<HeaterState> = {},
    roomId: string | null = null,
    groupId: string | null = null,
    isEnabled: boolean = true
  ) {
    const defaultState: HeaterState = {
      isOn: false,
      powerLevel: 80,
      targetRoomTemp: 23,
      ...state,
    };
    super(id, name, 'heater', x, y, defaultState, roomId, groupId, isEnabled);
  }

  public executeCommand(command: string, payload?: any): void {
    if (command === 'turnOn') this.setState({ isOn: true });
    else if (command === 'turnOff') this.setState({ isOn: false });
    else if (command === 'toggle') this.toggle();
    else if (command === 'setPower' && typeof payload === 'number') {
      this.setState({ powerLevel: Math.max(0, Math.min(100, payload)), isOn: payload > 0 });
    }
  }

  public getTemperatureContribution(): number {
    if (!this.isEnabled || !this.state.isOn || this.state.powerLevel <= 0) return 0;
    // Positive heating contribution scaled by power level
    return (this.state.powerLevel / 100) * 0.08;
  }

  public getStatusSummary(): string {
    if (!this.state.isOn) return 'Off';
    return `${this.state.powerLevel}% Heat`;
  }

  public getIconName(): string {
    return 'Flame';
  }

  public clone(): HeaterDevice {
    return new HeaterDevice(
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
