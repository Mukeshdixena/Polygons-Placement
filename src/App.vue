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
        <button @click="exportPolygons">Export</button>
      </div>

      <div style="margin-top: 8px;">
        <h4>Algorithm</h4>
        <button @click="runFitting">Run Largest-Rectangle</button>
        <div style="margin-top:8px"><strong>Exec time:</strong> {{ execTime }} ms</div>
      </div>

      <div style="margin-top: 12px;">
        <h4>Notes</h4>
        <ul>
          <li>Modes: click / freehand</li>
          <li>Use Hole Mode to draw obstacles</li>
          <li>After finishing, vertices are draggable</li>
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

// geometry not yet plugged in; later we will import functions from src/geometry.js

const editorRef = ref(null);
const execTime = ref(0);

function startPolygon() { editorRef.value.startNewPolygon(); }
function finishPolygon() { editorRef.value.finishCurrentPolygon(); }
function undo() { editorRef.value.undoPoint(); }
function toggleHole() { editorRef.value.toggleHoleMode(); }
function clearAll() { editorRef.value.clearAll(); }
function exportPolygons() { editorRef.value.getPolygons().then?.(); /* getPolygons returns arrays */ 
  // But getPolygons is synchronous - call directly:
  const pol = editorRef.value.getPolygons();
  console.log(pol);
  alert('Polygons copied to console.'); 
}

async function runFitting() {
  // This is where we will call the largest-rectangle algorithm with polygon arrays.
  const start = performance.now();

  const { outer, holes } = editorRef.value.getPolygons();
  // Placeholder: call geometry functions (later)
  // e.g. const rect = findLargestInscribedRectangle(outer[0], holes);
  console.log('Running algorithm on', outer, holes);
  const end = performance.now();
  execTime.value = (end - start).toFixed(2);
}
</script>
