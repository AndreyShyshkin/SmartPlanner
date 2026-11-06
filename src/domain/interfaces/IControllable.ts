export interface IControllable {
  executeCommand(command: string, payload?: any): void;
}

export interface ITemperatureModifier {
  getTemperatureContribution(): number; // heat/cooling in deg Celsius / min
}
