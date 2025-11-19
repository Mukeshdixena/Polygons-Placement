<template>
  <div class="editor-root">
    <div class="toolbar">
      <div class="modes">
        <label><input type="radio" value="click" v-model="mode" /> Click-to-draw</label>
        <label><input type="radio" value="freehand" v-model="mode" /> Freehand</label>
      </div>

      <div class="actions">
        <button @click="startNewPolygon">New Polygon</button>
        <button @click="finishCurrentPolygon" :disabled="!isDrawing">Finish</button>
        <button @click="undoPoint" :disabled="!isDrawing">Undo</button>
        <button @click="toggleHoleMode" :class="{ active: holeMode }">Hole Mode</button>
        <button @click="clearAll">Clear All</button>
        <button @click="onExport">Export</button>
        <button @click="runAlgorithm">Run</button>
      </div>

      <div class="hint">
        <small>Mode: <strong>{{ mode }}</strong>. Hole mode: <strong>{{ holeMode }}</strong></small>
      </div>
    </div>

    <div class="canvas-wrap">
      <canvas ref="canvas" class="paper-canvas"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import paper from 'paper';
import { findLargestInscribedRectangle } from '../geometry.js';

const canvas = ref(null);
let scope = null;
let tool = null;

const mode = ref('click'); // 'click' or 'freehand'
const holeMode = ref(false);

let currentPath = null;
let polygons = []; // { path: paper.Path, isHole: boolean }
let vertexSpheres = [];
let guideSegment = null;
let freehandPath = null;

const isDrawing = ref(false);
let resultsLayer = []; // store result shapes to clear them later

// Utilities from previous editor (slightly trimmed)
function simplifyRDP(points, epsilon) {
  if (points.length < 3) return points.slice();
  function sqDist(p, q) { const dx = p[0] - q[0], dy = p[1] - q[1]; return dx * dx + dy * dy; }
  function pointLineDistanceSq(a, b, p) {
    const A = p[0] - a[0], B = p[1] - a[1];
    const C = b[0] - a[0], D = b[1] - a[1];
    const dot = A * C + B * D; const lenSq = C * C + D * D;
    let param = lenSq !== 0 ? dot / lenSq : -1; let xx, yy;
    if (param < 0) { xx = a[0]; yy = a[1]; }
    else if (param > 1) { xx = b[0]; yy = b[1]; }
    else { xx = a[0] + param * C; yy = a[1] + param * D; }
    return sqDist(p, [xx, yy]);
  }
  function simplifySection(points, first, last, epsSq, result) {
    let maxDist = 0; let index = -1;
    for (let i = first + 1; i <= last - 1; i++) {
      const d = pointLineDistanceSq(points[first], points[last], points[i]);
      if (d > maxDist) { maxDist = d; index = i; }
    }
    if (maxDist > epsSq) { simplifySection(points, first, index, epsSq, result); simplifySection(points, index, last, epsSq, result); }
    else result.push(points[first]);
  }
  const result = []; simplifySection(points, 0, points.length - 1, epsilon * epsilon, result);
  result.push(points[points.length - 1]); return result;
}

function createClosedPathFromArray(arr, options = {}) {
  const p = new scope.Path({ closed: true, strokeColor: options.strokeColor || 'black', strokeWidth: options.strokeWidth || 1.6 });
  for (const pt of arr) p.add(new scope.Point(pt[0], pt[1]));
  if (options.fillColor) { p.fillColor = options.fillColor; p.opacity = options.opacity ?? 0.45; }
  return p;
}

function updateAllVertexHandles() {
  vertexSpheres.forEach(s => s.remove());
  vertexSpheres = [];
  polygons.forEach((pobj, pIndex) => {
    pobj.path.segments.forEach((segment, idx) => {
      const circ = new scope.Path.Circle({
        center: segment.point,
        radius: 4,
        fillColor: '#ffffff',
        strokeColor: '#000000',
        strokeWidth: 1,
        data: { polygonIndex: pIndex, segmentIndex: idx }
      });
      circ.onMouseDrag = (ev) => {
        const segIdx = circ.data.segmentIndex;
        pobj.path.segments[segIdx].point = ev.point;
        circ.position = ev.point;
      };
      circ.onMouseDown = () => { circ.fillColor = '#ffcc00'; };
      vertexSpheres.push(circ);
    });
  });
}

function getPolygonsAsArrays() {
  const outer = [];
  const holes = [];
  polygons.forEach(pobj => {
    const arr = pobj.path.segments.map(s => [s.point.x, s.point.y]);
    if (pobj.isHole) holes.push(arr); else outer.push(arr);
  });
  return { outer, holes };
}

function handleClickModeAdd(point) {
  if (!currentPath) {
    currentPath = new scope.Path({ strokeColor: '#2a62d6', strokeWidth: 2 });
    isDrawing.value = true;
  }
  currentPath.add(point);
  if (guideSegment) { guideSegment.remove(); guideSegment = null; }
  if (currentPath && currentPath.lastSegment) {
    guideSegment = new scope.Path({
      segments: [currentPath.lastSegment.point, point],
      strokeColor: 'rgba(0,0,0,0.35)',
      dashArray: [6, 4]
    });
  }
}

function finishCurrentPath() {
  if (!currentPath || currentPath.segments.length < 3) {
    if (currentPath) { currentPath.remove(); currentPath = null; }
    isDrawing.value = false;
    return;
  }
  let arr = currentPath.segments.map(s => [s.point.x, s.point.y]);
  if (mode.value === 'freehand') {
    arr = simplifyRDP(arr, 3.0);
    if (arr.length < 3) { currentPath.remove(); currentPath = null; isDrawing.value = false; return; }
  }
  const closed = createClosedPathFromArray(arr, {
    fillColor: holeMode.value ? '#ffdede' : '#cfe3ff',
    strokeColor: holeMode.value ? '#d64d4d' : '#2a62d6',
    strokeWidth: 1.8,
    opacity: 0.6
  });
  polygons.push({ path: closed, isHole: !!holeMode.value });
  if (currentPath) { currentPath.remove(); currentPath = null; }
  if (guideSegment) { guideSegment.remove(); guideSegment = null; }
  isDrawing.value = false;
  updateAllVertexHandles();
}

function undoPoint() {
  if (!currentPath) return;
  if (currentPath.segments.length > 0) {
    currentPath.segments[currentPath.segments.length - 1].remove();
    if (currentPath.segments.length === 0) {
      currentPath.remove();
      currentPath = null;
      isDrawing.value = false;
    }
  }
}

function clearAll() {
  polygons.forEach(p => p.path.remove());
  polygons = [];
  if (currentPath) { currentPath.remove(); currentPath = null; }
  if (guideSegment) { guideSegment.remove(); guideSegment = null; }
  vertexSpheres.forEach(s => s.remove());
  vertexSpheres = [];
  clearResults();
  isDrawing.value = false;
}

function toggleHoleMode() { holeMode.value = !holeMode.value; }

function startFreehand(point) {
  freehandPath = new scope.Path({ strokeColor: '#2a62d6', strokeWidth: 1.6 });
  freehandPath.add(point);
  isDrawing.value = true;
}
function continueFreehand(point) {
  if (!freehandPath) return;
  freehandPath.add(point);
}
function endFreehand() {
  if (!freehandPath) return;
  let arr = freehandPath.segments.map(s => [s.point.x, s.point.y]);
  arr = simplifyRDP(arr, 4.0);
  freehandPath.remove();
  freehandPath = null;
  if (arr.length >= 3) {
    currentPath = new scope.Path();
    for (const p of arr) currentPath.add(new scope.Point(p[0], p[1]));
    finishCurrentPath();
  } else {
    isDrawing.value = false;
  }
}

function setupTool() {
  tool = new scope.Tool();
  tool.onMouseDown = function (event) {
    const pt = event.point;
    if (mode.value === 'click') handleClickModeAdd(pt);
    else startFreehand(pt);
  };
  tool.onMouseDrag = function (event) {
    const pt = event.point;
    if (mode.value === 'freehand') continueFreehand(pt);
    else {
      if (guideSegment) { guideSegment.remove(); guideSegment = null; }
      if (currentPath && currentPath.lastSegment) {
        guideSegment = new scope.Path({
          segments: [currentPath.lastSegment.point, event.point],
          strokeColor: 'rgba(0,0,0,0.35)',
          dashArray: [6, 4]
        });
      }
    }
  };
  tool.onMouseUp = function () {
    if (mode.value === 'freehand') endFreehand();
  };
}

function resizeCanvas() {
  const el = canvas.value;
  if (!el) return;
  el.width = el.clientWidth;
  el.height = el.clientHeight;
  scope.view.viewSize = new scope.Size(el.width, el.height);
  scope.view.update();
}

// Drawing/clearing results
function clearResults() {
  resultsLayer.forEach(r => r.remove());
  resultsLayer = [];
}
function drawResultRectangleCorners(corners) {
  clearResults();
  if (!corners) return;
  const path = createClosedPathFromArray(corners, { fillColor: '#fff496', strokeColor: '#bfa300', strokeWidth: 2, opacity: 0.9 });
  resultsLayer.push(path);
  scope.view.update();
}

// run algorithm and render
function runAlgorithm() {
  // take the first non-hole polygon as outer
  const { outer, holes } = getPolygonsAsArrays();
  if (!outer || outer.length === 0) {
    alert('Please draw an outer polygon (room) first.');
    return null;
  }
  const outerPolygon = outer[0]; // currently we support single outer polygon
  const opts = {
    gridStep: Math.max(outerPolygon.length > 0 ? 1 : 1, Math.max(scope.view.size.width, scope.view.size.height) / 40),
    angleStepDeg: 12,
    edgeSampleCount: 8
  };
  const result = findLargestInscribedRectangle(outerPolygon, holes, opts);
  if (!result) {
    alert('No fitting rectangle found (maybe polygon too small or degenerate).');
    clearResults();
    return null;
  }
  drawResultRectangleCorners(result.corners);
  return result;
}

function exportPNG() {
  if (!canvas.value) return;

  // Force Paper.js to render latest frame
  scope.view.update();

  // Extract base64 PNG
  const dataURL = canvas.value.toDataURL("image/png");

  // Create download link
  const link = document.createElement("a");
  link.download = "room-rectangle.png";
  link.href = dataURL;
  link.click();
}


onMounted(async () => {
  await nextTick();
  scope = paper;
  scope.setup(canvas.value);
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  setupTool();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCanvas);
  try { tool.remove(); } catch (e) { }
  try { scope.project.clear(); } catch (e) { }
});

// Expose methods to parent
defineExpose({
  startNewPolygon() { if (currentPath) { currentPath.remove(); currentPath = null; } isDrawing.value = true; },
  finishCurrentPolygon() { finishCurrentPath(); },
  undoPoint() { undoPoint(); },
  toggleHoleMode() { toggleHoleMode(); },
  clearAll() { clearAll(); },
  getPolygons() { return getPolygonsAsArrays(); },
  runAlgorithm() { return runAlgorithm(); },
  drawResultRectangle(corners) { drawResultRectangleCorners(corners); },
  exportPNG,
  exportJSON
});

function exportJSON() {
  const data = getPolygonsAsArrays();

  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "room-polygons.json";
  link.click();

  URL.revokeObjectURL(url);
}

</script>

<style scoped>
.editor-root {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.toolbar {
  padding: 12px;
  background: #fff;
  border-bottom: 1px solid #eee;
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.modes label {
  margin-right: 8px;
}

.actions button {
  margin-right: 6px;
  padding: 6px 10px;
}

.actions button.active {
  background: #f0f0f0;
}

.canvas-wrap {
  flex: 1;
  display: block;
}

.paper-canvas {
  width: 100%;
  height: calc(100vh - 70px);
  display: block;
  background: #fafafa;
}

.hint {
  width: 100%;
  margin-top: 6px;
  color: #666;
  font-size: 12px;
}
</style>
