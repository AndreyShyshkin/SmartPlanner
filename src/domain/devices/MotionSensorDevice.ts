import { BaseDevice } from './BaseDevice';
import { ISensor, SimulationContext } from '../interfaces/ISensor';
import { BaseDeviceState } from '../interfaces/ISmartDevice';
import { Raycaster } from '../physics/Raycaster';

export interface MotionSensorState extends BaseDeviceState {
  isOn: boolean; // whether sensor is active
  isDetecting: boolean; // currently detected motion
  detectionRadius: number; // grid tiles radius (e.g. 1 to 8 tiles)
  fovAngle: number; // field of view in degrees (e.g. 90, 180, 360)
  rotationAngle: number; // direction angle in degrees (0 = East, 90 = South, etc.)
  lastDetectedAt?: number;
}

export class MotionSensorDevice extends BaseDevice<MotionSensorState> implements ISensor {
  public isTriggered: boolean = false;

  constructor(
    id: string,
    name: string,
    x: number,
    y: number,
    state: Partial<MotionSensorState> = {},
    roomId: string | null = null,
    groupId: string | null = null,
    isEnabled: boolean = true
  ) {
    const defaultState: MotionSensorState = {
      isOn: true,
      isDetecting: false,
      detectionRadius: 3.5,
      fovAngle: 360,
      rotationAngle: 0,
      ...state,
    };
    super(id, name, 'motion', x, y, defaultState, roomId, groupId, isEnabled);
    this.isTriggered = this.state.isDetecting;
  }

  public evaluate(context: SimulationContext): boolean {
    if (!this.isEnabled || !this.state.isOn || !context.personPosition || !context.isPersonHome) {
      this.isTriggered = false;
      this.setState({ isDetecting: false });
      return false;
    }

    // Distance check
    const dist = this.distanceTo(context.personPosition);
    if (dist > this.state.detectionRadius) {
      this.isTriggered = false;
      this.setState({ isDetecting: false });
      return false;
    }

    // FOV Angle check (if less than 360)
    if (this.state.fovAngle < 360) {
      const dx = context.personPosition.x - this.x;
      const dy = context.personPosition.y - this.y;
      const angleToTarget = (Math.atan2(dy, dx) * 180) / Math.PI;
      let diff = Math.abs(angleToTarget - this.state.rotationAngle);
      while (diff > 180) diff = Math.abs(diff - 360);
      if (diff > this.state.fovAngle / 2) {
        this.isTriggered = false;
        this.setState({ isDetecting: false });
        return false;
      }
    }

    // Raycast Line of Sight check: cannot see through walls!
    const canSee = Raycaster.hasLineOfSight(
      { x: this.x, y: this.y },
      context.personPosition,
      context.walls
    );

    this.isTriggered = canSee;
    this.setState({
      isDetecting: canSee,
      lastDetectedAt: canSee ? Date.now() : this.state.lastDetectedAt,
    });
    return canSee;
  }

  public resetTrigger(): void {
    this.isTriggered = false;
    this.setState({ isDetecting: false });
  }

  public getStatusSummary(): string {
    if (!this.state.isOn) return 'Вимкнено';
    return this.state.isDetecting ? 'Виявлено рух' : 'Спокійно';
  }

  public getIconName(): string {
    return 'Activity';
  }

  public clone(): MotionSensorDevice {
    return new MotionSensorDevice(
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
