import { BaseDevice } from './BaseDevice';
import { IControllable, ITemperatureModifier } from '../interfaces/IControllable';
import { BaseDeviceState } from '../interfaces/ISmartDevice';

export interface ThermostatState extends BaseDeviceState {
  isOn: boolean;
  targetTemperature: number;  // in Celsius, e.g. 21.5
  currentTemperature: number; // in Celsius, e.g. 20.0
  mode: 'off' | 'heat' | 'cool' | 'auto';
  ecoMode: boolean;
  autoManageClimate: boolean;
  linkedDeviceIds?: string[];
  climateActionState?: 'idle' | 'heating' | 'cooling';
}

export class ThermostatDevice
  extends BaseDevice<ThermostatState>
  implements IControllable, ITemperatureModifier {
  constructor(
    id: string,
    name: string,
    x: number,
    y: number,
    state: Partial<ThermostatState> = {},
    roomId: string | null = null,
    groupId: string | null = null,
    isEnabled: boolean = true
  ) {
    const defaultState: ThermostatState = {
      isOn: true,
      targetTemperature: 22.0,
      currentTemperature: 21.0,
      mode: 'auto',
      ecoMode: false,
      autoManageClimate: true,
      linkedDeviceIds: [],
      climateActionState: 'idle',
      ...state,
    };
    super(id, name, 'thermostat', x, y, defaultState, roomId, groupId, isEnabled);
  }

  public executeCommand(command: string, payload?: any): void {
    if (command === 'turnOn') this.setState({ isOn: true });
    else if (command === 'turnOff') this.setState({ isOn: false, mode: 'off', climateActionState: 'idle' });
    else if (command === 'toggle') this.toggle();
    else if (command === 'setTargetTemperature' && typeof payload === 'number') {
      this.setState({ targetTemperature: Math.max(10, Math.min(32, payload)) });
    } else if (command === 'setMode' && ['off', 'heat', 'cool', 'auto'].includes(payload)) {
      this.setState({ mode: payload, isOn: payload !== 'off' });
    }
  }

  public getTemperatureContribution(): number {
    if (!this.isEnabled || !this.state.isOn || this.state.mode === 'off') return 0;
    const diff = this.state.targetTemperature - this.state.currentTemperature;
    if (Math.abs(diff) < 0.2) return 0;
    // Pushes temperature towards target
    return diff > 0 ? 0.05 : -0.05;
  }

  public getStatusSummary(): string {
    if (!this.state.isOn || this.state.mode === 'off') return 'Выкл';
    const actionBadge =
      this.state.climateActionState === 'heating'
        ? '🔥 Греет'
        : this.state.climateActionState === 'cooling'
        ? '❄️ Охлаждает'
        : '✨ Комфорт';
    return `${this.state.currentTemperature.toFixed(1)}°C → ${this.state.targetTemperature.toFixed(1)}°C (${actionBadge})`;
  }

  public getIconName(): string {
    return 'Thermometer';
  }

  public clone(): ThermostatDevice {
    return new ThermostatDevice(
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
