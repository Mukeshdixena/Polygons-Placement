
# Room Rectangle Finder

Interactive Polygon Editor + Largest Inscribed Rectangle Algorithm  
Built with Vue 3, Paper.js, and Vite

This project allows users to draw custom room shapes, add holes or obstacles, and compute the largest rectangle that fits completely inside the polygon.  
Useful for architecture, CAD, interior space optimization, packing problems, and computational geometry research.

🚀 **Live Demo**  
https://mukeshdixena.github.io/Polygons-Placement/

## 📦 Features

### Drawing
- Click-to-draw polygon mode
- Freehand sketch mode with smoothing
- Auto-close when clicking near start point
- Visual snapping indicator
- Draw interior holes
- Drag vertices to reshape polygons

### Algorithm
- Computes the largest inscribed axis-aligned or rotated rectangle
- Supports concave polygons and holes
- Multi-angle sweep + grid sampling + edge-based refinement
- Returns width, height, area, center, corners, and rotation angle

### Exporting
- Export drawing as PNG
- Export geometry as JSON

## 🧩 Tech Stack

| Layer            | Technology                  |
|------------------|-----------------------------|
| UI Framework     | Vue 3 (Composition API)     |
| Dev Server       | Vite                        |
| Canvas Engine    | Paper.js                    |
| Geometry         | Custom JavaScript algorithms|
| Rendering        | HTML Canvas                 |

## 🛠 Installation

```bash
git clone https://github.com/Mukeshdixena/Polygons-Placement.git
cd Polygons-Placement
npm install
```

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

## 📂 Project Structure

```
src/
├── components/
│   └── PolygonEditor.vue
├── geometry.js
├── App.vue
└── main.js
```

## 🎮 How to Use

1. **Draw a Room Shape**  
   - Choose “Click-to-draw” or “Freehand” mode  
   - Click/drag to add vertices → close automatically or press Finish

2. **Add Holes**  
   - Enable “Hole Mode” and draw polygons inside the room

3. **Edit**  
   - Drag any vertex to reshape in real time

4. **Find Largest Rectangle**  
   - Click **Run** → largest inscribed rectangle is displayed with stats

5. **Export**  
   - PNG of the canvas  
   - JSON of outer polygon + holes

## 🧠 Algorithm Overview

- Grid sampling inside the bounding box for potential centers  
- Sweep through multiple rotation angles  
- For each angle, expand rectangle along rotated axes until boundary collision  
- Validate that all four corners lie inside the outer polygon and outside all holes  
- Select rectangle with maximum area

Typical runtime: **1–10 ms** on common room shapes.

## 🧱 Limitations

- Single outer polygon only
- Holes must be completely inside the outer polygon
- Self-intersecting polygons are not supported
- Very thin/noisy shapes may slightly reduce accuracy


Enjoy the tool! Feel free to open issues or PRs on the repo.
```
