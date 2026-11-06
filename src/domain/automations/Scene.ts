import { ISerializable } from '../interfaces/ISerializable';

export interface SceneActionItem {
  deviceId: string;
  statePatch: Record<string, any>;
}

export interface SceneData {
  id: string;
  name: string;
  icon: string;
  color?: string;
  actions: SceneActionItem[];
}

export class Scene implements ISerializable<SceneData> {
  public id: string;
  public name: string;
  public icon: string;
  public color?: string;
  public actions: SceneActionItem[];

  constructor(
    id: string,
    name: string,
    icon: string = 'Sparkles',
    color?: string,
    actions: SceneActionItem[] = []
  ) {
    this.id = id;
    this.name = name;
    this.icon = icon;
    this.color = color || '#0071E3';
    this.actions = actions;
  }

  public addAction(deviceId: string, statePatch: Record<string, any>): void {
    const existing = this.actions.findIndex((a) => a.deviceId === deviceId);
    if (existing >= 0) {
      this.actions[existing].statePatch = {
        ...this.actions[existing].statePatch,
        ...statePatch,
      };
    } else {
      this.actions.push({ deviceId, statePatch });
    }
  }

  public removeAction(deviceId: string): void {
    this.actions = this.actions.filter((a) => a.deviceId !== deviceId);
  }

  public toJSON(): SceneData {
    return {
      id: this.id,
      name: this.name,
      icon: this.icon,
      color: this.color,
      actions: [...this.actions],
    };
  }

  public static fromJSON(data: SceneData): Scene {
    return new Scene(data.id, data.name, data.icon, data.color, data.actions);
  }
}
