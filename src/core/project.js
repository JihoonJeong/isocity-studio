/**
 * Project loader.
 * A "project" defines a city with its layers, zone groups, and settings.
 *
 * Project JSON format:
 * {
 *   name: "마포구",
 *   mapW: 1400, mapH: 1000,
 *   layers: [
 *     { id: "bg-blank", name: "Background (Blank)", type: "image", src: "bg-blank.jpeg", visible: true, opacity: 1 },
 *     { id: "bg-full", name: "Background (Buildings)", type: "image", src: "bg-full.jpeg", visible: false, opacity: 1 },
 *     { id: "svg-map", name: "SVG Map", type: "image", src: "map.svg", visible: false, opacity: 0.7 },
 *   ],
 *   groups: [
 *     { id: "sangam", name: "상암동", color: "#E57373", zones: [
 *       { id: "sangam_B1", name: "DMC 미디어시티" },
 *       ...
 *     ]},
 *     ...
 *   ],
 *   gridDefaults: { cellW: 70, cellH: 35, offX: 0, offY: 0 }
 * }
 */

export async function loadProject(basePath) {
  const res = await fetch(`${basePath}/project.json`);
  if (!res.ok) throw new Error(`Failed to load project: ${res.status}`);
  const project = await res.json();

  // Load layer images
  project._images = {};
  const imagePromises = [];

  for (const layer of project.layers) {
    if (layer.type === 'image') {
      const img = new Image();
      const promise = new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve; // Don't block on missing images
      });
      img.src = `${basePath}/${layer.src}`;
      project._images[layer.id] = img;
      imagePromises.push(promise);
    }
  }

  await Promise.all(imagePromises);

  // Build flat zone list and group lookup
  project._allZones = [];
  project._groupMap = {};
  for (const group of project.groups) {
    project._groupMap[group.id] = group;
    for (const zone of group.zones) {
      project._allZones.push({ ...zone, groupId: group.id });
    }
  }

  return project;
}

/** Get total zone count */
export function getTotalZones(project) {
  return project._allZones.length;
}
