import { Point2D, WallSegment } from '../types';

export interface SimulationContext {
  personPosition: Point2D | null;
  isPersonHome: boolean;
  walls: WallSegment[];
  ambientTemperature: number;
  timeOfDayHours: number; // 0-24
  activeDoors: Set<string>;
}

export interface ISensor {
  isTriggered: boolean;
  evaluate(context: SimulationContext): boolean;
  resetTrigger(): void;
}
