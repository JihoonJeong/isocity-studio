/**
 * Diamond grid generator.
 * Generates isometric 2:1 diamond cells covering the map canvas.
 * No boundary filtering — all cells within map bounds are included.
 */

let cachedCells = null;
let cacheKey = '';

export const gridState = {
  cellW: 70,
  cellH: 35,
  offX: 0,
  offY: 0,
};

export function invalidateGrid() {
  cacheKey = '';
  cachedCells = null;
}

/**
 * Generate diamond cells for the given map dimensions.
 * Each cell: { id, x, y, w, h, cx, cy }
 *   (x,y) = bounding box top-left
 *   (cx,cy) = diamond center
 */
export function getCells(mapW, mapH) {
  const { cellW, cellH, offX, offY } = gridState;
  const key = `${cellW},${cellH},${offX},${offY},${mapW},${mapH}`;
  if (cacheKey === key && cachedCells) return cachedCells;

  const cells = [];
  const rowH = cellH / 2;
  let id = 1;
  const pad = 2;

  for (let row = -pad; row < Math.ceil(mapH / rowH) + pad; row++) {
    const isOdd = ((row % 2) + 2) % 2 === 1;
    const numCols = Math.ceil(mapW / cellW) + pad * 2;

    for (let col = -pad; col < numCols; col++) {
      const x = col * cellW + (isOdd ? cellW / 2 : 0) + offX;
      const y = row * rowH + offY;
      const cx = x + cellW / 2;
      const cy = y + cellH / 2;

      if (cx > -cellW && cx < mapW + cellW && cy > -cellH && cy < mapH + cellH) {
        cells.push({ id: id++, x, y, w: cellW, h: cellH, cx, cy });
      }
    }
  }

  cachedCells = cells;
  cacheKey = key;
  return cells;
}

/** Point-in-diamond hit test */
export function hitTestCell(px, py, cell) {
  const dx = Math.abs(px - cell.cx) / (cell.w / 2);
  const dy = Math.abs(py - cell.cy) / (cell.h / 2);
  return (dx + dy) <= 1;
}

/** Find cell at map-space coordinates */
export function findCellAt(mx, my, cells) {
  for (const c of cells) {
    if (hitTestCell(mx, my, c)) return c;
  }
  return null;
}
