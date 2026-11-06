import { BaseDevice } from './BaseDevice';
import { ISensor, SimulationContext } from '../interfaces/ISensor';
import { BaseDeviceState } from '../interfaces/ISmartDevice';

export interface DoorSensorState extends BaseDeviceState {
  isOn: boolean;
  isOpen: boolean;
  doorId: string;
  autoDetectPassing: boolean;
}

export class DoorSensorDevice extends BaseDevice<DoorSensorState> implements ISensor {
  public isTriggered: boolean = false;

  constructor(
    id: string,
    name: string,
    x: number,
    y: number,
    state: Partial<DoorSensorState> = {},
    roomId: string | null = null,
    groupId: string | null = null,
    isEnabled: boolean = true
  ) {
    const defaultState: DoorSensorState = {
      isOn: true,
      isOpen: false,
      doorId: '',
      autoDetectPassing: true,
      ...state,
    };
    super(id, name, 'door_sensor', x, y, defaultState, roomId, groupId, isEnabled);
    this.isTriggered = this.state.isOpen;
  }

  public evaluate(context: SimulationContext): boolean {
    if (!this.isEnabled || !this.state.isOn) {
      this.isTriggered = false;
      return false;
    }

    // If attached door is marked active/open in simulation or person is stepping right on the door tile
    const isDoorActive = this.state.doorId ? context.activeDoors.has(this.state.doorId) : false;
    let isPersonPassing = false;

    if (context.personPosition && this.state.autoDetectPassing) {
      const dist = this.distanceTo(context.personPosition);
      // If person is directly on or very close to the door (<= 0.8 tiles)
      if (dist <= 0.85) {
        isPersonPassing = true;
      }
    }

    const triggered = isDoorActive || isPersonPassing || this.state.isOpen;
    this.isTriggered = triggered;

    if (this.state.isOpen !== triggered) {
      this.setState({ isOpen: triggered });
    }

    return triggered;
  }

  public resetTrigger(): void {
    this.isTriggered = false;
    this.setState({ isOpen: false });
  }

  public getStatusSummary(): string {
    if (!this.state.isOn) return 'Off';
    return this.state.isOpen ? 'Open' : 'Closed';
  }

  public getIconName(): string {
    return 'DoorOpen';
  }

  public clone(): DoorSensorDevice {
    return new DoorSensorDevice(
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
