<template>
  <canvas ref="canvas" class="paper-canvas"></canvas>
</template>

<script setup>
import { onMounted, ref, watch, nextTick } from 'vue';
import paper from 'paper';
import { mainPolygonPoints, holePolygons, backgroundPolygon, foregroundPolygon } from '../polygons-data.js';
import { findFittingPositions } from '../geometry.js';

const canvas = ref(null);
const props = {}; // No props for now; we'll call methods via ref

let paperScope;
let paperPaths = {
  main: null,
  holes: [],
  background: null,
  foreground: null,
  results: []
};

function createPathFromArray(points, options = {}) {
  const path = new paper.Path({
    closed: true,
    strokeColor: options.strokeColor || 'black',
    strokeWidth: options.strokeWidth || 1.6,
    fillColor: options.fillColor || null,
    opacity: options.opacity ?? 0.5
  });
  for (const p of points) path.add(new paper.Point(p[0], p[1]));
  return path;
}

function initializePaper() {
  paper.setup(canvas.value);
  paperScope = paper;
  resetScene();
  paper.view.update();
}

function resetScene() {
  paper.project.clear();

  paperPaths.main = createPathFromArray(mainPolygonPoints, { fillColor: '#cfe3ff', strokeColor: '#2a62d6', strokeWidth: 2 });
  paperPaths.background = createPathFromArray(backgroundPolygon, { fillColor: '#d6f5d6', strokeColor: '#2d9d2d' });

  paperPaths.holes = [];
  for (const h of holePolygons) {
    const hp = createPathFromArray(h, { fillColor: '#ffdede', strokeColor: '#d64d4d' });
    paperPaths.holes.push(hp);
  }

  paperPaths.foreground = createPathFromArray(foregroundPolygon, { fillColor: '#ffdfb6', strokeColor: '#d68c2d' });

  // Make foreground draggable as a shape
  addDragBehavior(paperPaths.foreground);
}

function addDragBehavior(path) {
  let dragging = false;
  let offset = null;

  path.onMouseDown = (event) => {
    dragging = true;
    offset = path.position.subtract(event.point);
  };

  path.onMouseDrag = (event) => {
    if (dragging) {
      path.position = event.point.add(offset);
    }
  };

  path.onMouseUp = () => {
    dragging = false;
  };
}

function clearResults() {
  for (const r of paperPaths.results) r.remove();
  paperPaths.results = [];
}

function drawResultRect(corners) {
  // corners: array of [x,y] quad
  const p = createPathFromArray(corners, { fillColor: '#fff496', strokeColor: '#bfa300' });
  paperPaths.results.push(p);
  paper.view.update();
}

function runAlgorithmAndRender() {
  // Convert the current foreground position back to polygon array relative to main coordinates
  // We will compute polygon arrays directly from path segments
  const fgPath = paperPaths.foreground;
  const fgPoints = fgPath.segments.map(s => [s.point.x, s.point.y]);

  const res = findFittingPositions(
    mainPolygonPoints,
    holePolygons,
    backgroundPolygon,
    fgPoints
  );

  clearResults();

  if (res && Array.isArray(res)) {
    for (const r of res) {
      if (r && r.length) drawResultRect(r);
    }
  }
}

onMounted(async () => {
  await nextTick();
  initializePaper();
});

// Expose methods to parent
defineExpose({
  resetScene,
  runAlgorithmAndRender,
});
</script>

<style scoped>
.paper-canvas {
  width: 100%;
  height: 100%;
}
</style>
