/**
 * Zone assignment state.
 * Maps zone IDs to sets of cell IDs, and vice versa.
 */

// zoneId → { cellIds: Set<number>, groupId: string }
const assignments = new Map();
// cellId → zoneId
const cellToZone = new Map();
// undo stack
const undoStack = [];

export function assign(zoneId, groupId, cellIds) {
  if (!cellIds || cellIds.size === 0) return;

  // Clear previous assignment for this zone
  unassign(zoneId);

  assignments.set(zoneId, { cellIds: new Set(cellIds), groupId });
  for (const cid of cellIds) {
    cellToZone.set(cid, zoneId);
  }
  undoStack.push(zoneId);
}

export function unassign(zoneId) {
  const a = assignments.get(zoneId);
  if (!a) return;
  for (const cid of a.cellIds) cellToZone.delete(cid);
  assignments.delete(zoneId);
}

export function undoLast() {
  if (undoStack.length === 0) return null;
  const zoneId = undoStack.pop();
  unassign(zoneId);
  return zoneId;
}

export function resetAll() {
  assignments.clear();
  cellToZone.clear();
  undoStack.length = 0;
}

export function isAssigned(zoneId) {
  return assignments.has(zoneId);
}

export function getAssignment(zoneId) {
  return assignments.get(zoneId);
}

export function getZoneForCell(cellId) {
  return cellToZone.get(cellId) || null;
}

export function isCellAssigned(cellId) {
  return cellToZone.has(cellId);
}

export function getAssignedCount() {
  return assignments.size;
}

export function getUsedCellCount() {
  return cellToZone.size;
}

/** Export to plain object for JSON serialization */
export function exportAssignments() {
  const result = {};
  for (const [zoneId, info] of assignments) {
    result[zoneId] = {
      groupId: info.groupId,
      cellIds: [...info.cellIds].sort((a, b) => a - b)
    };
  }
  return result;
}

/** Import from plain object */
export function importAssignments(data) {
  resetAll();
  for (const [zoneId, info] of Object.entries(data)) {
    const cellSet = new Set(info.cellIds);
    assignments.set(zoneId, { cellIds: cellSet, groupId: info.groupId });
    for (const cid of cellSet) cellToZone.set(cid, zoneId);
  }
}
