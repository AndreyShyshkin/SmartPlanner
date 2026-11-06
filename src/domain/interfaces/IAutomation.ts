import { ISmartDevice } from './ISmartDevice';
import { SimulationContext } from './ISensor';

export interface IAutomationTrigger {
  readonly type: 'sensor_motion' | 'door_state' | 'temperature' | 'time' | 'person_presence';
  evaluate(context: SimulationContext, devices: Map<string, ISmartDevice>): boolean;
  getDescription(): string;
  toJSON(): any;
}

export interface IAutomationAction {
  readonly type: 'set_device_state' | 'toggle_device' | 'trigger_scene' | 'set_group_state';
  execute(context: {
    devices: Map<string, ISmartDevice>;
    triggerScene: (sceneId: string) => void;
  }): void;
  getDescription(): string;
  toJSON(): any;
}
