import { Automation } from './Automation';
import { ISmartDevice } from '../interfaces/ISmartDevice';
import { SimulationContext } from '../interfaces/ISensor';

export interface AutomationLogEntry {
  id: string;
  automationId: string;
  automationName: string;
  timestamp: number;
  description: string;
}

export class AutomationEngine {
  private automations: Map<string, Automation> = new Map();
  private lastTriggerTimes: Map<string, number> = new Map();
  private previousTriggerStates: Map<string, boolean> = new Map();
  private logs: AutomationLogEntry[] = [];
  private onLogCallback?: (log: AutomationLogEntry) => void;

  constructor(automations: Automation[] = []) {
    this.setAutomations(automations);
  }

  public setAutomations(automations: Automation[]): void {
    this.automations.clear();
    for (const auto of automations) {
      this.automations.set(auto.id, auto);
    }
  }

  public setOnLog(cb: (log: AutomationLogEntry) => void): void {
    this.onLogCallback = cb;
  }

  public getLogs(): AutomationLogEntry[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
    this.previousTriggerStates.clear();
  }

  /**
   * Evaluates all enabled automations against the current simulation state.
   * Uses Edge-Triggering (fires on false -> true state transition) to prevent
   * infinite spamming while conditions stay true.
   */
  public evaluate(
    context: SimulationContext,
    devices: Map<string, ISmartDevice>,
    triggerScene: (sceneId: string) => void
  ): void {
    const now = Date.now();

    for (const automation of Array.from(this.automations.values())) {
      if (!automation.isEnabled) {
        this.previousTriggerStates.delete(automation.id);
        continue;
      }

      const wasActive = this.previousTriggerStates.get(automation.id) ?? false;
      const isActive = automation.trigger.evaluate(context, devices);

      // Edge-triggered execution: only fires when the condition BECOMES true!
      if (isActive && !wasActive) {
        this.lastTriggerTimes.set(automation.id, now);
        automation.lastTriggeredAt = now;

        // Execute all actions
        for (const action of automation.actions) {
          action.execute({ devices, triggerScene });
        }

        const logEntry: AutomationLogEntry = {
          id: `log_${now}_${Math.random().toString(36).substring(2, 6)}`,
          automationId: automation.id,
          automationName: automation.name,
          timestamp: now,
          description: `Сработала автоматизация: "${automation.name}" (${automation.trigger.getDescription(devices)})`,
        };

        this.logs.unshift(logEntry);
        if (this.logs.length > 50) this.logs.pop();

        if (this.onLogCallback) {
          this.onLogCallback(logEntry);
        }
      }

      // Store current state for next tick comparison
      this.previousTriggerStates.set(automation.id, isActive);
    }
  }
}
