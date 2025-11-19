<template>
  <div class="app-root">
    <aside class="sidebar">
      <h3>Room Editor</h3>

      <div class="btn-group">
        <button @click="startPolygon">Start New</button>
        <button @click="finishPolygon">Finish</button>
        <button @click="undo">Undo</button>
        <button @click="toggleHole">Toggle Hole</button>
        <button @click="clearAll">Clear</button>
        <button @click="exportPolygons">Export JSON</button>
        <button @click="exportPNG">Export PNG</button>
      </div>

      <h4>Algorithm</h4>
      <button @click="runFitting">Run Largest Rectangle</button>

      <div class="exec">
        <strong>Execution Time:</strong> {{ execTime }} ms
      </div>

      <div v-if="result" class="result">
        <h4>Largest Rectangle</h4>
        <div><strong>Width:</strong> {{ result.width.toFixed(2) }}</div>
        <div><strong>Height:</strong> {{ result.height.toFixed(2) }}</div>
        <div><strong>Area:</strong> {{ result.area.toFixed(2) }}</div>
        <div><strong>Angle (deg):</strong> {{ result.angleDeg.toFixed(2) }}</div>
        <div><strong>Center:</strong> ({{ result.center[0].toFixed(2) }}, {{ result.center[1].toFixed(2) }})</div>

        <div class="corner-title"><strong>Corners:</strong></div>
        <ul>
          <li v-for="(c, i) in result.corners" :key="i">
            {{ i + 1 }}: ({{ c[0].toFixed(2) }}, {{ c[1].toFixed(2) }})
          </li>
        </ul>
      </div>
    </aside>

    <main class="main-area">
      <PolygonEditor ref="editorRef" />
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import PolygonEditor from './components/PolygonEditor.vue'

const editorRef = ref(null)
const execTime = ref(0)
const result = ref(null)

function startPolygon() { editorRef.value.startNewPolygon() }
function finishPolygon() { editorRef.value.finishCurrentPolygon() }
function undo() { editorRef.value.undoPoint() }
function toggleHole() { editorRef.value.toggleHoleMode() }
function clearAll() { result.value = null; execTime.value = 0; editorRef.value.clearAll() }

function exportPolygons() { editorRef.value.exportJSON() }

function runFitting() {
  const start = performance.now()
  const res = editorRef.value.runAlgorithm()
  const end = performance.now()
  execTime.value = (end - start).toFixed(2)
  if (res) result.value = res
}

function exportPNG() { editorRef.value.exportPNG() }
</script>

<style>
.app-root {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  width: 320px;
  border-right: 1px solid #e6e6e6;
  padding: 12px;
  background: #fff;
  overflow-y: auto;
}

.btn-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.exec {
  margin-top: 8px;
}

.result {
  margin-top: 16px;
  font-size: 14px;
}

.corner-title {
  margin-top: 10px;
}

.main-area {
  flex: 1;
  overflow: hidden;
}

@media (max-width: 900px) {
  .app-root {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #e6e6e6;
  }

  .main-area {
    height: calc(100vh - 300px);
  }
}

@media (max-width: 600px) {
  .btn-group button {
    flex: 1 1 calc(50% - 6px);
  }
}
</style>
