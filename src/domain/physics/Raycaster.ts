import { Point2D, WallSegment } from '../types';

export class Raycaster {
  /**
   * Checks if there is an unobstructed direct line of sight between two 2D points,
   * taking into account all wall segments.
   */
  public static hasLineOfSight(
    from: Point2D,
    to: Point2D,
    walls: WallSegment[]
  ): boolean {
    for (const wall of walls) {
      // If wall has a door and door is currently open, light/sensor beam can pass through
      if (wall.isDoor && wall.isDoorOpen) {
        continue;
      }

      if (
        Raycaster.lineSegmentsIntersect(
          from.x,
          from.y,
          to.x,
          to.y,
          wall.startX,
          wall.startY,
          wall.endX,
          wall.endY
        )
      ) {
        return false;
      }
    }
    return true;
  }

  /**
   * Returns true if line segment (x1, y1)-(x2, y2) intersects with (x3, y3)-(x4, y4).
   */
  public static lineSegmentsIntersect(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    x4: number,
    y4: number
  ): boolean {
    const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (Math.abs(denom) < 1e-6) {
      return false; // parallel or collinear
    }

    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

    // We use a small epsilon > 0.02 and < 0.98 to avoid self-occlusion at endpoints
    return ua > 0.02 && ua < 0.98 && ub > 0.02 && ub < 0.98;
  }

  /**
   * Casts a fan of rays around a center to compute a visible 2D polygon (e.g. for motion sensor FOV rendering)
   */
  public static computeVisiblePolygon(
    center: Point2D,
    radius: number,
    walls: WallSegment[],
    fovAngleDeg: number = 360,
    rotationDeg: number = 0,
    numRays: number = 72
  ): Point2D[] {
    const polygon: Point2D[] = [];
    const halfFov = (fovAngleDeg * Math.PI) / 360;
    const centerAngle = (rotationDeg * Math.PI) / 180;
    const startAngle = centerAngle - halfFov;
    const angleStep = (2 * halfFov) / (numRays - 1);

    for (let i = 0; i < numRays; i++) {
      const angle = fovAngleDeg === 360 ? (i * 2 * Math.PI) / numRays : startAngle + i * angleStep;
      const targetX = center.x + Math.cos(angle) * radius;
      const targetY = center.y + Math.sin(angle) * radius;

      let closestDistance = radius;
      let hitPoint: Point2D = { x: targetX, y: targetY };

      for (const wall of walls) {
        if (wall.isDoor) continue;
        const intersection = Raycaster.getIntersection(
          center.x,
          center.y,
          targetX,
          targetY,
          wall.startX,
          wall.startY,
          wall.endX,
          wall.endY
        );

        if (intersection) {
          const dist = Math.hypot(intersection.x - center.x, intersection.y - center.y);
          if (dist < closestDistance) {
            closestDistance = dist;
            hitPoint = intersection;
          }
        }
      }

      polygon.push(hitPoint);
    }

    return polygon;
  }

  private static getIntersection(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    x4: number,
    y4: number
  ): Point2D | null {
    const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (Math.abs(denom) < 1e-6) return null;

    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

    if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
      return {
        x: x1 + ua * (x2 - x1),
        y: y1 + ua * (y2 - y1),
      };
    }
    return null;
  }
}
