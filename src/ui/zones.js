/**
 * Zone list UI (right panel) — grouped by district/category.
 */

import * as assignments from '../core/assignments.js';

/**
 * Build the zone list in the right panel.
 * @param {object} project
 * @param {string} filter - search filter text
 * @param {Set} selectedCells - currently selected cell IDs
 * @param {function} onAssign - callback(zoneId, groupId) when user clicks to assign
 * @param {function} onHighlight - callback(zoneId|null) for hover highlight
 * @param {function} onUnassign - callback(zoneId) for right-click unassign
 */
export function buildZoneList(project, filter, selectedCells, onAssign, onHighlight, onUnassign) {
  const container = document.getElementById('zone-list');
  container.innerHTML = '';
  const lf = filter.toLowerCase();

  for (const group of project.groups) {
    const filtered = group.zones.filter(z =>
      !lf || z.name.toLowerCase().includes(lf)
        || z.id.toLowerCase().includes(lf)
        || group.name.toLowerCase().includes(lf)
    );
    if (filtered.length === 0) continue;

    const div = document.createElement('div');
    const assignedInGroup = filtered.filter(z => assignments.isAssigned(z.id)).length;

    // Group header
    const header = document.createElement('div');
    header.className = 'group-header';
    header.innerHTML = `
      <span class="group-arrow open">▶</span>
      <span class="group-name" style="color:${group.color}">${group.name}</span>
      <span class="group-count">${assignedInGroup}/${filtered.length}</span>
    `;

    const body = document.createElement('div');
    body.className = 'group-body';

    header.addEventListener('click', () => {
      body.classList.toggle('collapsed');
      header.querySelector('.group-arrow').classList.toggle('open');
    });

    // Zone items
    for (const zone of filtered) {
      const isAssigned = assignments.isAssigned(zone.id);
      const item = document.createElement('div');
      item.className = 'zone-item' + (isAssigned ? ' assigned' : '');
      item.dataset.zoneId = zone.id;

      const a = assignments.getAssignment(zone.id);
      const cellCount = a ? a.cellIds.size : 0;

      item.innerHTML = `
        <span class="zone-check">${isAssigned ? '✓' : '·'}</span>
        <span class="zone-dot" style="background:${group.color}"></span>
        <span class="zone-name">${zone.name}</span>
        <span class="zone-cells">${cellCount ? cellCount + 'c' : ''}</span>
      `;

      item.addEventListener('click', () => {
        if (selectedCells.size > 0) {
          onAssign(zone.id, group.id);
        } else if (isAssigned) {
          onHighlight(zone.id);
        }
      });

      item.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (isAssigned) onUnassign(zone.id);
      });

      body.appendChild(item);
    }

    div.append(header, body);
    container.appendChild(div);
  }
}

export function updateStats(project) {
  const total = project._allZones.length;
  const assigned = assignments.getAssignedCount();
  const cellsUsed = assignments.getUsedCellCount();

  document.getElementById('stat-assigned').textContent = `${assigned}/${total}`;
  document.getElementById('stat-assigned2').textContent = `${assigned}/${total}`;
  document.getElementById('stat-cells-used').textContent = cellsUsed;
}
