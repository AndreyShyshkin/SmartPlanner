import { IAutomationAction, IAutomationTrigger } from '../interfaces/IAutomation';
import { ISerializable } from '../interfaces/ISerializable';
import { createTriggerFromJSON } from './triggers';
import { createActionFromJSON } from './actions';

export interface AutomationData {
  id: string;
  name: string;
  isEnabled: boolean;
  trigger: any;
  actions: any[];
}

export class Automation implements ISerializable<AutomationData> {
  public id: string;
  public name: string;
  public isEnabled: boolean;
  public trigger: IAutomationTrigger;
  public actions: IAutomationAction[];
  public lastTriggeredAt?: number;

  constructor(
    id: string,
    name: string,
    trigger: IAutomationTrigger,
    actions: IAutomationAction[] = [],
    isEnabled: boolean = true
  ) {
    this.id = id;
    this.name = name;
    this.trigger = trigger;
    this.actions = actions;
    this.isEnabled = isEnabled;
  }

  public toJSON(): AutomationData {
    return {
      id: this.id,
      name: this.name,
      isEnabled: this.isEnabled,
      trigger: this.trigger.toJSON(),
      actions: this.actions.map((a) => a.toJSON()),
    };
  }

  public static fromJSON(data: AutomationData): Automation {
    const trigger = createTriggerFromJSON(data.trigger);
    const actions = (data.actions || []).map((a) => createActionFromJSON(a));
    return new Automation(data.id, data.name, trigger, actions, data.isEnabled);
  }
}
