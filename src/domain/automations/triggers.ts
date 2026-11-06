import { IAutomationTrigger } from '../interfaces/IAutomation';
import { ISmartDevice } from '../interfaces/ISmartDevice';
import { SimulationContext } from '../interfaces/ISensor';

export interface MotionTriggerData {
  type: 'sensor_motion';
  deviceId: string;
  mustDetect: boolean; // true = detected, false = cleared
}

export class MotionTrigger implements IAutomationTrigger {
  public readonly type = 'sensor_motion';
  public deviceId: string;
  public mustDetect: boolean;

  constructor(deviceId: string, mustDetect: boolean = true) {
    this.deviceId = deviceId;
    this.mustDetect = mustDetect;
  }

  public evaluate(context: SimulationContext, devices: Map<string, ISmartDevice>): boolean {
    const dev = devices.get(this.deviceId);
    if (!dev || dev.type !== 'motion') return false;
    const isDetecting = Boolean((dev.getState() as any).isDetecting);
    return isDetecting === this.mustDetect;
  }

  public getDescription(): string {
    return this.mustDetect
      ? `Датчик движения зафиксировал активность`
      : `Датчик движения не фиксирует движения`;
  }

  public toJSON(): MotionTriggerData {
    return {
      type: this.type,
      deviceId: this.deviceId,
      mustDetect: this.mustDetect,
    };
  }
}

export interface DoorTriggerData {
  type: 'door_state';
  deviceId: string;
  mustBeOpen: boolean;
}

export class DoorTrigger implements IAutomationTrigger {
  public readonly type = 'door_state';
  public deviceId: string;
  public mustBeOpen: boolean;

  constructor(deviceId: string, mustBeOpen: boolean = true) {
    this.deviceId = deviceId;
    this.mustBeOpen = mustBeOpen;
  }

  public evaluate(context: SimulationContext, devices: Map<string, ISmartDevice>): boolean {
    const dev = devices.get(this.deviceId);
    if (!dev || dev.type !== 'door_sensor') return false;
    const isOpen = Boolean((dev.getState() as any).isOpen);
    return isOpen === this.mustBeOpen;
  }

  public getDescription(): string {
    return this.mustBeOpen ? `Дверь открылась` : `Дверь закрылась`;
  }

  public toJSON(): DoorTriggerData {
    return {
      type: this.type,
      deviceId: this.deviceId,
      mustBeOpen: this.mustBeOpen,
    };
  }
}

export interface TemperatureTriggerData {
  type: 'temperature';
  deviceId: string;
  operator: 'greater' | 'less';
  threshold: number;
}

export class TemperatureTrigger implements IAutomationTrigger {
  public readonly type = 'temperature';
  public deviceId: string;
  public operator: 'greater' | 'less';
  public threshold: number;

  constructor(deviceId: string, operator: 'greater' | 'less', threshold: number) {
    this.deviceId = deviceId;
    this.operator = operator;
    this.threshold = threshold;
  }

  public evaluate(context: SimulationContext, devices: Map<string, ISmartDevice>): boolean {
    const dev = devices.get(this.deviceId);
    if (!dev) return false;
    const currentTemp = (dev.getState() as any).currentTemperature ?? context.ambientTemperature;
    if (this.operator === 'greater') {
      return currentTemp > this.threshold;
    } else {
      return currentTemp < this.threshold;
    }
  }

  public getDescription(): string {
    return `Температура ${this.operator === 'greater' ? '>' : '<'} ${this.threshold}°C`;
  }

  public toJSON(): TemperatureTriggerData {
    return {
      type: this.type,
      deviceId: this.deviceId,
      operator: this.operator,
      threshold: this.threshold,
    };
  }
}

export interface PresenceTriggerData {
  type: 'person_presence';
  isHome: boolean;
}

export class PresenceTrigger implements IAutomationTrigger {
  public readonly type = 'person_presence';
  public isHome: boolean;

  constructor(isHome: boolean) {
    this.isHome = isHome;
  }

  public evaluate(context: SimulationContext): boolean {
    return context.isPersonHome === this.isHome;
  }

  public getDescription(): string {
    return this.isHome ? `Человек вернулся домой` : `Человек ушел из дома`;
  }

  public toJSON(): PresenceTriggerData {
    return {
      type: this.type,
      isHome: this.isHome,
    };
  }
}

export interface TimeTriggerData {
  type: 'time';
  hour: number;
  comparison: 'after' | 'before' | 'exact';
}

export class TimeTrigger implements IAutomationTrigger {
  public readonly type = 'time';
  public hour: number;
  public comparison: 'after' | 'before' | 'exact';

  constructor(hour: number, comparison: 'after' | 'before' | 'exact' = 'after') {
    this.hour = hour;
    this.comparison = comparison;
  }

  public evaluate(context: SimulationContext): boolean {
    if (this.comparison === 'after') {
      return context.timeOfDayHours >= this.hour;
    } else if (this.comparison === 'before') {
      return context.timeOfDayHours < this.hour;
    } else {
      return Math.floor(context.timeOfDayHours) === Math.floor(this.hour);
    }
  }

  public getDescription(): string {
    return `Время суток ${this.comparison === 'after' ? 'после' : 'до'} ${this.hour}:00`;
  }

  public toJSON(): TimeTriggerData {
    return {
      type: this.type,
      hour: this.hour,
      comparison: this.comparison,
    };
  }
}

export function createTriggerFromJSON(data: any): IAutomationTrigger {
  switch (data.type) {
    case 'sensor_motion':
      return new MotionTrigger(data.deviceId, data.mustDetect);
    case 'door_state':
      return new DoorTrigger(data.deviceId, data.mustBeOpen);
    case 'temperature':
      return new TemperatureTrigger(data.deviceId, data.operator, data.threshold);
    case 'person_presence':
      return new PresenceTrigger(data.isHome);
    case 'time':
      return new TimeTrigger(data.hour, data.comparison);
    default:
      throw new Error(`Unknown trigger type: ${data.type}`);
  }
}
