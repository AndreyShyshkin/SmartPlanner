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

  public getDescription(devices?: Map<string, ISmartDevice>): string {
    const name = devices?.get(this.deviceId)?.name;
    const prefix = name ? `Датчик «${name}»` : 'Датчик руху';
    return this.mustDetect
      ? `${prefix}: виявив людину (рух зафіксовано)`
      : `${prefix}: більше не бачить людину (рух припинився)`;
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

  public getDescription(devices?: Map<string, ISmartDevice>): string {
    const name = devices?.get(this.deviceId)?.name;
    const prefix = name ? `Двері «${name}»` : 'Двері';
    return this.mustBeOpen ? `${prefix}: відчинилися` : `${prefix}: зачинилися`;
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
    let currentTemp = context.ambientTemperature;
    if (dev) {
      currentTemp = (dev.getState() as any).currentTemperature ?? context.ambientTemperature;
    }
    if (this.operator === 'greater') {
      return currentTemp > this.threshold;
    } else {
      return currentTemp < this.threshold;
    }
  }

  public getDescription(devices?: Map<string, ISmartDevice>): string {
    const name = devices?.get(this.deviceId)?.name || 'Датчик температури';
    return `«${name}»: температура ${this.operator === 'greater' ? '>' : '<'} ${this.threshold}°C`;
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

export interface DeviceStateTriggerData {
  type: 'device_state';
  deviceId: string;
  property: string;
  expectedValue: any;
  label?: string;
}

export class DeviceStateTrigger implements IAutomationTrigger {
  public readonly type = 'device_state';
  public deviceId: string;
  public property: string;
  public expectedValue: any;
  public label?: string;

  constructor(
    deviceId: string,
    property: string,
    expectedValue: any,
    label?: string
  ) {
    this.deviceId = deviceId;
    this.property = property;
    this.expectedValue = expectedValue;
    this.label = label;
  }

  public evaluate(context: SimulationContext, devices: Map<string, ISmartDevice>): boolean {
    const dev = devices.get(this.deviceId);
    if (!dev) return false;
    const currentState = dev.getState() as any;
    return currentState[this.property] === this.expectedValue;
  }

  public getDescription(devices?: Map<string, ISmartDevice>): string {
    if (this.label) return this.label;
    const dev = devices?.get(this.deviceId);
    const devName = dev?.name || 'Пристрій';
    if (this.property === 'isOn') {
      return `«${devName}»: ${this.expectedValue ? 'увімкнено' : 'вимкнено'}`;
    }
    if (this.property === 'openPercentage') {
      return `«${devName}»: штори ${this.expectedValue > 0 ? 'відкриті' : 'закриті'}`;
    }
    return `«${devName}»: ${this.property} = ${this.expectedValue}`;
  }

  public toJSON(): DeviceStateTriggerData {
    return {
      type: this.type,
      deviceId: this.deviceId,
      property: this.property,
      expectedValue: this.expectedValue,
      label: this.label,
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
    return this.isHome ? `Людина повернулася додому (Вдома)` : `Людина пішла з дому (Поза домом)`;
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
  minute?: number;
  comparison: 'after' | 'before' | 'exact';
}

export class TimeTrigger implements IAutomationTrigger {
  public readonly type = 'time';
  public hour: number;
  public minute: number;
  public comparison: 'after' | 'before' | 'exact';

  constructor(
    hour: number,
    comparison: 'after' | 'before' | 'exact' = 'after',
    minute: number = 0
  ) {
    this.hour = hour;
    this.comparison = comparison;
    this.minute = minute;
  }

  public evaluate(context: SimulationContext): boolean {
    const targetDec = this.hour + this.minute / 60;
    if (this.comparison === 'after') {
      return context.timeOfDayHours >= targetDec;
    } else if (this.comparison === 'before') {
      return context.timeOfDayHours < targetDec;
    } else {
      return Math.abs(context.timeOfDayHours - targetDec) < 0.25;
    }
  }

  public getDescription(): string {
    const timeStr = `${String(this.hour).padStart(2, '0')}:${String(this.minute).padStart(2, '0')}`;
    const compText = this.comparison === 'after' ? 'після' : this.comparison === 'before' ? 'до' : 'рівно о';
    return `Час доби: ${compText} ${timeStr}`;
  }

  public toJSON(): TimeTriggerData {
    return {
      type: this.type,
      hour: this.hour,
      minute: this.minute,
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
    case 'device_state':
      return new DeviceStateTrigger(
        data.deviceId,
        data.property,
        data.expectedValue,
        data.label
      );
    case 'person_presence':
      return new PresenceTrigger(data.isHome);
    case 'time':
      return new TimeTrigger(data.hour, data.comparison, data.minute);
    default:
      throw new Error(`Unknown trigger type: ${data.type}`);
  }
}
