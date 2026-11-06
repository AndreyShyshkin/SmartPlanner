import { Point2D, RectBounds } from '../types';

export interface IGeometricItem {
  x: number;
  y: number;
  getBounds(): RectBounds;
  containsPoint(point: Point2D): boolean;
  distanceTo(point: Point2D): number;
}
