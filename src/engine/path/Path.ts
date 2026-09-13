/**
 * Path.ts
 * Manages path waypoints, pre-computes segment lengths and cumulative distances,
 * and provides distance-based position and angle queries for entities.
 */

import type { Point2D } from '../config/pathConfig';

export interface PathPosition {
  x: number;
  y: number;
  angle: number;
  finished: boolean;
}

interface PathSegment {
  p1: Point2D;
  p2: Point2D;
  length: number;
  startDistance: number;
  endDistance: number;
  angle: number;
}

export class Path {
  public readonly waypoints: Point2D[];
  private segments: PathSegment[] = [];
  public readonly totalLength: number = 0;

  constructor(waypoints: Point2D[]) {
    if (waypoints.length < 2) {
      throw new Error('Path requires at least two waypoints.');
    }

    this.waypoints = waypoints;
    let accumulatedDistance = 0;

    for (let i = 0; i < waypoints.length - 1; i++) {
      const p1 = waypoints[i];
      const p2 = waypoints[i + 1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const length = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);

      this.segments.push({
        p1,
        p2,
        length,
        startDistance: accumulatedDistance,
        endDistance: accumulatedDistance + length,
        angle,
      });

      accumulatedDistance += length;
    }

    this.totalLength = accumulatedDistance;
  }

  public getPositionAtDistance(distanceTraveled: number): PathPosition {
    if (this.segments.length === 0) {
      return { x: 0, y: 0, angle: 0, finished: true };
    }

    // Finished path check
    if (distanceTraveled >= this.totalLength) {
      const lastSeg = this.segments[this.segments.length - 1];
      return {
        x: lastSeg.p2.x,
        y: lastSeg.p2.y,
        angle: lastSeg.angle,
        finished: true,
      };
    }

    // Before start of path check
    if (distanceTraveled <= 0) {
      const firstSeg = this.segments[0];
      return {
        x: firstSeg.p1.x,
        y: firstSeg.p1.y,
        angle: firstSeg.angle,
        finished: false,
      };
    }

    // Search to find current segment
    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i];
      if (distanceTraveled >= seg.startDistance && distanceTraveled < seg.endDistance) {
        const segDist = distanceTraveled - seg.startDistance;
        const t = seg.length > 0 ? segDist / seg.length : 0;
        const x = seg.p1.x + t * (seg.p2.x - seg.p1.x);
        const y = seg.p1.y + t * (seg.p2.y - seg.p1.y);

        return {
          x,
          y,
          angle: seg.angle,
          finished: false,
        };
      }
    }

    const lastSeg = this.segments[this.segments.length - 1];
    return {
      x: lastSeg.p2.x,
      y: lastSeg.p2.y,
      angle: lastSeg.angle,
      finished: true,
    };
  }
}
