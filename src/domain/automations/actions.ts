import { IAutomationAction } from '../interfaces/IAutomation';
import { ISmartDevice } from '../interfaces/ISmartDevice';

export interface SetDeviceStateActionData {
  type: 'set_device_state';
  deviceId: string;
  statePatch: Record<string, any>;
}

export class SetDeviceStateAction implements IAutomationAction {
  public readonly type = 'set_device_state';
  public deviceId: string;
  public statePatch: Record<string, any>;

  constructor(deviceId: string, statePatch: Record<string, any>) {
    this.deviceId = deviceId;
    this.statePatch = statePatch;
  }

  public execute(context: {
    devices: Map<string, ISmartDevice>;
    triggerScene: (sceneId: string) => void;
  }): void {
    const dev = context.devices.get(this.deviceId);
    if (dev) {
      dev.setState(this.statePatch);
    }
  }

  public getDescription(): string {
    const keys = Object.entries(this.statePatch)
      .map(([k, v]) => `${k}=${v}`)
      .join(', ');
    return `Встановити стан пристрою: ${keys}`;
  }

  public toJSON(): SetDeviceStateActionData {
    return {
      type: this.type,
      deviceId: this.deviceId,
      statePatch: this.statePatch,
    };
  }
}

export interface SetGroupStateActionData {
  type: 'set_group_state';
  groupId: string;
  statePatch: Record<string, any>;
}

export class SetGroupStateAction implements IAutomationAction {
  public readonly type = 'set_group_state';
  public groupId: string;
  public statePatch: Record<string, any>;

  constructor(groupId: string, statePatch: Record<string, any>) {
    this.groupId = groupId;
    this.statePatch = statePatch;
  }

  public execute(context: {
    devices: Map<string, ISmartDevice>;
    triggerScene: (sceneId: string) => void;
  }): void {
    for (const dev of Array.from(context.devices.values())) {
      if (dev.groupId === this.groupId) {
        dev.setState(this.statePatch);
      }
    }
  }

  public getDescription(): string {
    return `Змінити стан групи пристроїв (${this.groupId})`;
  }

  public toJSON(): SetGroupStateActionData {
    return {
      type: this.type,
      groupId: this.groupId,
      statePatch: this.statePatch,
    };
  }
}

export interface RunSceneActionData {
  type: 'trigger_scene';
  sceneId: string;
}

export class RunSceneAction implements IAutomationAction {
  public readonly type = 'trigger_scene';
  public sceneId: string;

  constructor(sceneId: string) {
    this.sceneId = sceneId;
  }

  public execute(context: {
    devices: Map<string, ISmartDevice>;
    triggerScene: (sceneId: string) => void;
  }): void {
    context.triggerScene(this.sceneId);
  }

  public getDescription(): string {
    return `Запустить сценарий`;
  }

  public toJSON(): RunSceneActionData {
    return {
      type: this.type,
      sceneId: this.sceneId,
    };
  }
}

export function createActionFromJSON(data: any): IAutomationAction {
  switch (data.type) {
    case 'set_device_state':
      return new SetDeviceStateAction(data.deviceId, data.statePatch);
    case 'set_group_state':
      return new SetGroupStateAction(data.groupId, data.statePatch);
    case 'trigger_scene':
      return new RunSceneAction(data.sceneId);
    default:
      throw new Error(`Unknown action type: ${data.type}`);
  }
}
