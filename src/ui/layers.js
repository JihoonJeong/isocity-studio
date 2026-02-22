/**
 * Layer panel UI — visibility toggles and opacity controls.
 */

export function buildLayerList(project, onUpdate) {
  const container = document.getElementById('layer-list');
  container.innerHTML = '';

  for (const layer of project.layers) {
    const item = document.createElement('div');
    item.className = 'layer-item';

    const vis = document.createElement('div');
    vis.className = 'layer-vis' + (layer.visible ? ' on' : '');
    vis.textContent = layer.visible ? '✓' : '';
    vis.addEventListener('click', () => {
      layer.visible = !layer.visible;
      vis.classList.toggle('on', layer.visible);
      vis.textContent = layer.visible ? '✓' : '';
      onUpdate();
    });

    const name = document.createElement('span');
    name.className = 'layer-name';
    name.textContent = layer.name;

    const opacity = document.createElement('input');
    opacity.type = 'range';
    opacity.className = 'layer-opacity';
    opacity.min = 0;
    opacity.max = 1;
    opacity.step = 0.05;
    opacity.value = layer.opacity ?? 1;
    opacity.addEventListener('input', () => {
      layer.opacity = +opacity.value;
      onUpdate();
    });

    item.append(vis, name, opacity);
    container.appendChild(item);
  }
}
