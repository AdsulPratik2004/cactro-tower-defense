/**
 * SpatialGrid.ts
 * High-performance 2D Uniform Spatial Partitioning Grid optimized for ZERO heap allocation per frame.
 *
 * OPTIMIZATION NOTES:
 * 1. Pre-allocates a fixed 2D grid array of cell buckets (32 cols x 20 rows = 640 cells).
 * 2. Clearing the grid simply sets `cell.length = 0` for all buckets (0 memory allocations).
 * 3. Fast integer key indexing `(cellY * cols) + cellX` replaces string `${x},${y}` keys,
 *    eliminating string garbage collection pressure during 5,000-entity ticks.
 * 4. Reuses a pre-allocated scratch array for queryRadius results.
 */

export class SpatialGrid<T extends number | string = number> {
  public readonly cellSize: number;
  public readonly cols: number;
  public readonly rows: number;

  private cells: T[][];
  private queryScratch: T[] = [];

  constructor(cellSize: number = 64, width: number = 1920, height: number = 1280) {
    this.cellSize = cellSize;
    this.cols = Math.ceil(width / cellSize) + 2;
    this.rows = Math.ceil(height / cellSize) + 2;

    const totalCells = this.cols * this.rows;
    this.cells = new Array(totalCells);

    for (let i = 0; i < totalCells; i++) {
      this.cells[i] = [];
    }
  }

  public getCellCoordinates(x: number, y: number): { cellX: number; cellY: number } {
    return {
      cellX: Math.max(0, Math.min(this.cols - 1, Math.floor(x / this.cellSize))),
      cellY: Math.max(0, Math.min(this.rows - 1, Math.floor(y / this.cellSize))),
    };
  }

  private getCellIndex(cellX: number, cellY: number): number {
    return cellY * this.cols + cellX;
  }

  /**
   * Clears all cell arrays in O(GridCells) time with ZERO memory allocation.
   */
  public clear(): void {
    const totalCells = this.cells.length;
    for (let i = 0; i < totalCells; i++) {
      this.cells[i].length = 0;
    }
  }

  /**
   * Inserts an entity ID into the pre-allocated spatial cell bucket.
   */
  public insert(id: T, x: number, y: number): void {
    const cellX = Math.max(0, Math.min(this.cols - 1, Math.floor(x / this.cellSize)));
    const cellY = Math.max(0, Math.min(this.rows - 1, Math.floor(y / this.cellSize)));
    const idx = cellY * this.cols + cellX;
    this.cells[idx].push(id);
  }

  /**
   * Queries candidate entity IDs within radius into a reused scratch array.
   */
  public queryRadius(x: number, y: number, radius: number): T[] {
    this.queryScratch.length = 0;

    const minCellX = Math.max(0, Math.floor((x - radius) / this.cellSize));
    const maxCellX = Math.min(this.cols - 1, Math.floor((x + radius) / this.cellSize));
    const minCellY = Math.max(0, Math.floor((y - radius) / this.cellSize));
    const maxCellY = Math.min(this.rows - 1, Math.floor((y + radius) / this.cellSize));

    for (let cy = minCellY; cy <= maxCellY; cy++) {
      const rowOffset = cy * this.cols;
      for (let cx = minCellX; cx <= maxCellX; cx++) {
        const cell = this.cells[rowOffset + cx];
        for (let i = 0; i < cell.length; i++) {
          this.queryScratch.push(cell[i]);
        }
      }
    }

    return this.queryScratch;
  }
}
