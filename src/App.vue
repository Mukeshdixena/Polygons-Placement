<template>
  <div class="app-root" style="display:flex; height:100vh;">
    <aside style="width: 320px; border-right: 1px solid #e6e6e6; padding: 12px; background: #fff;">
      <h3>Room Editor</h3>

      <div style="margin-bottom: 12px;">
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

      <div style="margin-top:8px">
        <strong>Execution Time:</strong> {{ execTime }} ms
      </div>

      <div v-if="result" style="margin-top:16px; font-size:14px;">
        <h4>Largest Rectangle</h4>

        <div><strong>Width:</strong> {{ result.width.toFixed(2) }}</div>
        <div><strong>Height:</strong> {{ result.height.toFixed(2) }}</div>
        <div><strong>Area:</strong> {{ result.area.toFixed(2) }}</div>
        <div><strong>Angle (deg):</strong> {{ result.angleDeg.toFixed(2) }}</div>
        <div><strong>Center:</strong> ({{ result.center[0].toFixed(2) }}, {{ result.center[1].toFixed(2) }})</div>

        <div style="margin-top:10px;"><strong>Corners:</strong></div>
        <ul>
          <li v-for="(c, i) in result.corners" :key="i">
            {{ i + 1 }}: ({{ c[0].toFixed(2) }}, {{ c[1].toFixed(2) }})
          </li>
        </ul>
      </div>
    </aside>

    <main style="flex:1;">
      <PolygonEditor ref="editorRef" />
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import PolygonEditor from './components/PolygonEditor.vue';

const editorRef = ref(null);
const execTime = ref(0);
const result = ref(null);

function startPolygon() { editorRef.value.startNewPolygon(); }
function finishPolygon() { editorRef.value.finishCurrentPolygon(); }
function undo() { editorRef.value.undoPoint(); }
function toggleHole() { editorRef.value.toggleHoleMode(); }
function clearAll() { result.value = null; execTime.value = 0; editorRef.value.clearAll(); }

function exportPolygons() {
  editorRef.value.exportJSON();
}


function runFitting() {
  const start = performance.now();
  const res = editorRef.value.runAlgorithm();
  const end = performance.now();

  execTime.value = (end - start).toFixed(2);

  if (res) {
    result.value = res;
  }
}
function exportPNG() {
  editorRef.value.exportPNG();
}

</script>
