/**
 * pathConfig.ts
 * Example waypoint path traversing a 1280x720 playfield in a zigzag pattern.
 */

export interface Point2D {
  x: number;
  y: number;
}

export const DEFAULT_PATH_WAYPOINTS: Point2D[] = [
  { x: -50, y: 150 },
  { x: 250, y: 150 },
  { x: 250, y: 450 },
  { x: 600, y: 450 },
  { x: 600, y: 200 },
  { x: 950, y: 200 },
  { x: 950, y: 550 },
  { x: 1330, y: 550 },
];
