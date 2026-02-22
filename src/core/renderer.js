/**
 * Canvas renderer — layers, diamond grid, selections, assignments.
 */

import { getCells } from './grid.js';
import { getZoneForCell, getAssignment } from './assignments.js';

/**
 * Render the full scene.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} project - loaded project data
 * @param {object} opts - { canvasW, canvasH, showNums, gridOpacity, selectedCells, hoveredCell }
 */
export function renderScene(ctx, project, opts) {
  const { canvasW, canvasH, showNums, gridOpacity, selectedCells, hoveredCell } = opts;
  const { mapW, mapH } = project;

  const scale = Math.min(canvasW / mapW, canvasH / mapH) * 0.97;
  const panX = (canvasW - mapW * scale) / 2;
  const panY = (canvasH - mapH * scale) / 2;

  ctx.clearRect(0, 0, canvasW, canvasH);
  ctx.fillStyle = '#0f0f1a';
  ctx.fillRect(0, 0, canvasW, canvasH);

  ctx.save();
  ctx.translate(panX, panY);
  ctx.scale(scale, scale);

  // ─── Layers ───
  for (const layer of project.layers) {
    if (!layer.visible) continue;
    if (layer.type === 'image') {
      const img = project._images[layer.id];
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.globalAlpha = layer.opacity ?? 1;
        ctx.drawImage(img, 0, 0, mapW, mapH);
        ctx.globalAlpha = 1;
      }
    }
  }

  // ─── Grid cells ───
  const cells = getCells(mapW, mapH);

  for (const c of cells) {
    const isHov = c.id === hoveredCell;
    const isSel = selectedCells.has(c.id);
    const zoneId = getZoneForCell(c.id);
    const isZoned = !!zoneId;

    let groupColor = null;
    if (isZoned) {
      const a = getAssignment(zoneId);
      const group = a ? project._groupMap[a.groupId] : null;
      groupColor = group?.color || '#888';
    }

    // Diamond path
    ctx.beginPath();
    ctx.moveTo(c.cx, c.y);
    ctx.lineTo(c.x + c.w, c.cy);
    ctx.lineTo(c.cx, c.y + c.h);
    ctx.lineTo(c.x, c.cy);
    ctx.closePath();

    // Fill
    if (isSel) {
      ctx.fillStyle = 'rgba(0, 229, 255, 0.4)';
      ctx.fill();
    } else if (isZoned) {
      ctx.fillStyle = hexToRgba(groupColor, 0.4);
      ctx.fill();
    } else if (isHov) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.fill();
    }

    // Stroke
    if (isSel) {
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 2;
    } else if (isZoned) {
      ctx.strokeStyle = hexToRgba(groupColor, 0.6);
      ctx.lineWidth = 1;
    } else {
      ctx.strokeStyle = `rgba(255, 255, 255, ${gridOpacity * 0.4})`;
      ctx.lineWidth = isHov ? 1 : 0.3;
    }
    ctx.stroke();

    // Cell number (unassigned only)
    if (showNums && !isZoned) {
      const fs = Math.max(5, Math.min(13, c.h * 0.28));
      ctx.fillStyle = isSel ? '#00e5ff' : `rgba(255,255,255,${gridOpacity * 0.6})`;
      ctx.font = `bold ${fs}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 2;
      ctx.fillText(c.id, c.cx, c.cy);
      ctx.shadowBlur = 0;
    }

    // Zone label (on center cell of assigned zone)
    if (isZoned) {
      const a = getAssignment(zoneId);
      if (a) {
        const sortedIds = [...a.cellIds].sort((a, b) => a - b);
        const centerCellId = sortedIds[Math.floor(sortedIds.length / 2)];
        if (c.id === centerCellId) {
          const zoneInfo = project._allZones.find(z => z.id === zoneId);
          const label = zoneInfo?.name || zoneId;
          const fs = Math.max(5, Math.min(10, c.h * 0.24));
          ctx.fillStyle = '#fff';
          ctx.font = `bold ${fs}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowColor = 'rgba(0,0,0,0.9)';
          ctx.shadowBlur = 3;
          const maxChars = Math.max(4, Math.floor(c.w / (fs * 0.6)));
          const display = label.length > maxChars ? label.slice(0, maxChars - 1) + '…' : label;
          ctx.fillText(display, c.cx, c.cy);
          ctx.shadowBlur = 0;
        }
      }
    }
  }

  ctx.restore();

  return { scale, panX, panY };
}

/** Get map-space coordinates from canvas pixel coordinates */
export function canvasToMap(px, py, canvasW, canvasH, mapW, mapH) {
  const scale = Math.min(canvasW / mapW, canvasH / mapH) * 0.97;
  const panX = (canvasW - mapW * scale) / 2;
  const panY = (canvasH - mapH * scale) / 2;
  return {
    mx: (px - panX) / scale,
    my: (py - panY) / scale
  };
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
