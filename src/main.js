/**
 * IsoCity Studio — Entry point.
 *
 * Loads a project (city data + layers + zones) and provides
 * an interactive isometric grid zone builder.
 */

import { loadProject, getTotalZones } from './core/project.js';
import { gridState, invalidateGrid, getCells, findCellAt } from './core/grid.js';
import { renderScene, canvasToMap } from './core/renderer.js';
import * as assignments from './core/assignments.js';
import { buildLayerList } from './ui/layers.js';
import { buildZoneList, updateStats } from './ui/zones.js';

// ════════════════════════════════════════════════════════════
// STATE
// ════════════════════════════════════════════════════════════

let project = null;
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let showNums = true;
let gridOpacity = 0.45;
let selectedCells = new Set();
let hoveredCell = -1;
let focusedZone = null;

// ════════════════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════════════════

async function init() {
  setInfo('Loading project...');

  try {
    project = await loadProject('./projects/mapo-gu');
  } catch (err) {
    setInfo(`Failed to load project: ${err.message}`);
    return;
  }

  // Apply grid defaults from project
  if (project.gridDefaults) {
    Object.assign(gridState, project.gridDefaults);
    syncGridControls();
  }

  // Build UI
  buildLayerList(project, render);
  rebuildZoneList();
  updateStats(project);

  // Setup events
  setupCanvasEvents();
  setupControlEvents();
  setupActionEvents();
  setupKeyboard();

  // Collapsible sections
  document.querySelectorAll('.section-title[data-collapse]').forEach(el => {
    el.addEventListener('click', () => {
      const target = el.dataset.collapse;
      const body = document.getElementById(`body-${target}`);
      if (body) body.style.display = body.style.display === 'none' ? '' : 'none';
      el.querySelector('.collapse-arrow')?.classList.toggle('open');
    });
  });

  resize();
  window.addEventListener('resize', resize);

  setInfo(`Loaded "${project.name}" — ${getTotalZones(project)} zones. Click cells to select, click zone to assign.`);
}

// ════════════════════════════════════════════════════════════
// RENDER
// ════════════════════════════════════════════════════════════

function render() {
  if (!project) return;
  const cw = canvas.width, ch = canvas.height;
  renderScene(ctx, project, {
    canvasW: cw, canvasH: ch,
    showNums, gridOpacity,
    selectedCells, hoveredCell
  });
  document.getElementById('stat-cells').textContent = getCells(project.mapW, project.mapH).length;
  document.getElementById('stat-selected').textContent = selectedCells.size;
}

function resize() {
  const leftW = 250, rightW = 300;
  canvas.width = window.innerWidth - leftW - rightW;
  canvas.height = window.innerHeight;
  canvas.style.marginLeft = leftW + 'px';
  render();
}

// ════════════════════════════════════════════════════════════
// CANVAS EVENTS
// ════════════════════════════════════════════════════════════

function setupCanvasEvents() {
  canvas.addEventListener('click', (e) => {
    const { mx, my } = canvasToMap(e.offsetX, e.offsetY, canvas.width, canvas.height, project.mapW, project.mapH);
    const cells = getCells(project.mapW, project.mapH);
    const cell = findCellAt(mx, my, cells);

    if (cell) {
      if (assignments.isCellAssigned(cell.id)) {
        const zid = assignments.getZoneForCell(cell.id);
        const zoneInfo = project._allZones.find(z => z.id === zid);
        setInfo(`Cell #${cell.id} → "${zoneInfo?.name || zid}" (right-click zone name to unassign)`);
        return;
      }
      if (selectedCells.has(cell.id)) {
        selectedCells.delete(cell.id);
      } else {
        selectedCells.add(cell.id);
      }
      focusedZone = null;
      setInfo(`Selected: ${selectedCells.size} cells`);
      render();
    } else if (!e.shiftKey) {
      selectedCells.clear();
      focusedZone = null;
      setInfo('Selection cleared');
      render();
    }
  });

  canvas.addEventListener('mousemove', (e) => {
    const { mx, my } = canvasToMap(e.offsetX, e.offsetY, canvas.width, canvas.height, project.mapW, project.mapH);
    const cells = getCells(project.mapW, project.mapH);
    const cell = findCellAt(mx, my, cells);
    const newHov = cell ? cell.id : -1;
    if (newHov !== hoveredCell) {
      hoveredCell = newHov;
      render();
    }
  });
}

// ════════════════════════════════════════════════════════════
// CONTROL EVENTS
// ════════════════════════════════════════════════════════════

function setupControlEvents() {
  bindSlider('ctrl-cell-w', 'val-cell-w', v => { gridState.cellW = v; invalidateGrid(); render(); });
  bindSlider('ctrl-cell-h', 'val-cell-h', v => { gridState.cellH = v; invalidateGrid(); render(); });
  bindSlider('ctrl-off-x', 'val-off-x', v => { gridState.offX = v; invalidateGrid(); render(); });
  bindSlider('ctrl-off-y', 'val-off-y', v => { gridState.offY = v; invalidateGrid(); render(); });
  bindSlider('ctrl-opacity', 'val-opacity', v => { gridOpacity = v; render(); });

  document.getElementById('ctrl-numbers').addEventListener('change', (e) => {
    showNums = e.target.checked;
    render();
  });

  document.getElementById('search-input').addEventListener('input', (e) => {
    rebuildZoneList(e.target.value);
  });
}

function bindSlider(sliderId, valId, onChange) {
  const slider = document.getElementById(sliderId);
  const valEl = document.getElementById(valId);
  slider.addEventListener('input', () => {
    const v = +slider.value;
    valEl.textContent = v;
    onChange(v);
  });
}

function syncGridControls() {
  document.getElementById('ctrl-cell-w').value = gridState.cellW;
  document.getElementById('val-cell-w').textContent = gridState.cellW;
  document.getElementById('ctrl-cell-h').value = gridState.cellH;
  document.getElementById('val-cell-h').textContent = gridState.cellH;
  document.getElementById('ctrl-off-x').value = gridState.offX;
  document.getElementById('val-off-x').textContent = gridState.offX;
  document.getElementById('ctrl-off-y').value = gridState.offY;
  document.getElementById('val-off-y').textContent = gridState.offY;
}

// ════════════════════════════════════════════════════════════
// ACTION EVENTS
// ════════════════════════════════════════════════════════════

function setupActionEvents() {
  document.getElementById('btn-clear-sel').addEventListener('click', () => {
    selectedCells.clear();
    setInfo('Selection cleared');
    render();
  });

  document.getElementById('btn-undo').addEventListener('click', () => {
    const zid = assignments.undoLast();
    if (zid) {
      const info = project._allZones.find(z => z.id === zid);
      rebuildZoneList();
      updateStats(project);
      render();
      setInfo(`Undo: "${info?.name || zid}" unassigned`);
    }
  });

  document.getElementById('btn-reset').addEventListener('click', () => {
    if (!confirm('Reset all zone assignments?')) return;
    assignments.resetAll();
    selectedCells.clear();
    rebuildZoneList();
    updateStats(project);
    render();
    setInfo('All assignments reset');
  });

  document.getElementById('btn-export').addEventListener('click', () => {
    const data = {
      projectName: project.name,
      gridParams: { ...gridState },
      assignments: assignments.exportAssignments()
    };
    download('isocity-zones.json', JSON.stringify(data, null, 2));
    setInfo(`Exported ${assignments.getAssignedCount()} zone assignments`);
  });

  document.getElementById('btn-import').addEventListener('click', () => {
    document.getElementById('file-import').click();
  });

  document.getElementById('file-import').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.gridParams) {
          Object.assign(gridState, data.gridParams);
          syncGridControls();
          invalidateGrid();
        }
        if (data.assignments) {
          assignments.importAssignments(data.assignments);
        }
        rebuildZoneList();
        updateStats(project);
        render();
        setInfo(`Imported ${assignments.getAssignedCount()} zone assignments`);
      } catch (err) {
        alert('Invalid JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });
}

// ════════════════════════════════════════════════════════════
// KEYBOARD
// ════════════════════════════════════════════════════════════

function setupKeyboard() {
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;

    if (e.key === 'Escape') {
      selectedCells.clear();
      focusedZone = null;
      setInfo('Selection cleared');
      render();
    }

    if ((e.key === 'Delete' || e.key === 'Backspace') && focusedZone) {
      const info = project._allZones.find(z => z.id === focusedZone);
      assignments.unassign(focusedZone);
      rebuildZoneList();
      updateStats(project);
      selectedCells.clear();
      focusedZone = null;
      render();
      setInfo(`"${info?.name}" unassigned`);
    }

    if (e.key === 'z' && (e.metaKey || e.ctrlKey)) {
      document.getElementById('btn-undo').click();
    }
  });
}

// ════════════════════════════════════════════════════════════
// ZONE LIST INTEGRATION
// ════════════════════════════════════════════════════════════

function rebuildZoneList(filter = '') {
  buildZoneList(
    project,
    filter || document.getElementById('search-input').value,
    selectedCells,
    // onAssign
    (zoneId, groupId) => {
      assignments.assign(zoneId, groupId, selectedCells);
      selectedCells = new Set();
      const a = assignments.getAssignment(zoneId);
      const info = project._allZones.find(z => z.id === zoneId);
      rebuildZoneList();
      updateStats(project);
      render();
      setInfo(`✓ "${info?.name}" assigned (${a?.cellIds.size} cells)`);
    },
    // onHighlight
    (zoneId) => {
      const a = assignments.getAssignment(zoneId);
      if (a) {
        selectedCells = new Set(a.cellIds);
        focusedZone = zoneId;
        const info = project._allZones.find(z => z.id === zoneId);
        render();
        setInfo(`"${info?.name}" — ${a.cellIds.size} cells. Del to unassign.`);
      }
    },
    // onUnassign
    (zoneId) => {
      const info = project._allZones.find(z => z.id === zoneId);
      assignments.unassign(zoneId);
      rebuildZoneList();
      updateStats(project);
      render();
      setInfo(`"${info?.name}" unassigned`);
    }
  );
}

// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════

function setInfo(text) {
  document.getElementById('info-text').textContent = text;
}

function download(filename, content) {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ════════════════════════════════════════════════════════════
// START
// ════════════════════════════════════════════════════════════

init();
