import { BaseDevice } from './BaseDevice';
import { IControllable } from '../interfaces/IControllable';
import { BaseDeviceState } from '../interfaces/ISmartDevice';

export interface CurtainState extends BaseDeviceState {
  isOn: boolean;
  openPercentage: number; // 0 = Closed, 100 = Fully open
}

export class CurtainDevice extends BaseDevice<CurtainState> implements IControllable {
  constructor(
    id: string,
    name: string,
    x: number,
    y: number,
    state: Partial<CurtainState> = {},
    roomId: string | null = null,
    groupId: string | null = null,
    isEnabled: boolean = true
  ) {
    const defaultState: CurtainState = {
      isOn: true,
      openPercentage: 100, // Open by default
      ...state,
    };
    super(id, name, 'curtains', x, y, defaultState, roomId, groupId, isEnabled);
  }

  public executeCommand(command: string, payload?: any): void {
    if (command === 'open') {
      this.setState({ openPercentage: 100, isOn: true });
    } else if (command === 'close') {
      this.setState({ openPercentage: 0, isOn: false });
    } else if (command === 'toggle') {
      const next = this.state.openPercentage > 0 ? 0 : 100;
      this.setState({ openPercentage: next, isOn: next > 0 });
    } else if (command === 'setPosition' && typeof payload === 'number') {
      const pos = Math.max(0, Math.min(100, payload));
      this.setState({ openPercentage: pos, isOn: pos > 0 });
    }
  }

  public getStatusSummary(): string {
    if (this.state.openPercentage === 0) return 'Зачинено';
    if (this.state.openPercentage === 100) return 'Відчинено';
    return `${this.state.openPercentage}% Відчинено`;
  }

  public getIconName(): string {
    return 'Blinds';
  }

  public clone(): CurtainDevice {
    return new CurtainDevice(
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
