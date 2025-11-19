
# Room Rectangle Finder

**Interactive Polygon Editor + Largest Inscribed Rectangle Algorithm**
Built with **Vue 3**, **Paper.js**, and **Vite**

This project allows users to draw custom room shapes, add holes or obstacles, and compute the **largest rectangle** that fits completely inside the polygon.
Useful for architecture, CAD, interior space optimization, packing problems, and computational geometry research.

---

## 🚀 Live Demo

(Optional — you can enable GitHub Pages)
If you want, I can generate a **GitHub Pages deployment guide** so your demo runs at:

```
https://mukeshdixena.github.io/Polygons-Placement/
```

---

## 🎥 Preview (GIF)

Place a demo GIF here:

```
./preview/room-rectangle-demo.gif
```

If you want, I can generate a placeholder GIF template and instructions.

---

## 🖼 Project Screenshots

Place images inside `/screenshots/`:

| Feature                  | Screenshot                             |
| ------------------------ | -------------------------------------- |
| Drawing room polygon     | ![](screenshots/draw-room.png)         |
| Hole mode                | ![](screenshots/hole-mode.png)         |
| Largest rectangle result | ![](screenshots/largest-rectangle.png) |
| JSON / PNG exports       | ![](screenshots/export-tools.png)      |

If you want, I can generate matching placeholder images.

---

# 📦 Features

### Drawing

* Click-to-draw polygon mode
* Freehand sketch mode with smoothing
* Auto-close when clicking near start point
* Visual snapping indicator
* Draw interior holes
* Drag vertices to reshape polygons

### Algorithm

* Computes the **largest inscribed axis-aligned or rotated rectangle**
* Supports concave polygons
* Supports holes
* Multi-angle sweep
* Grid sampling
* Edge-based refinement
* Returns width, height, area, center, corners, angle

### Exporting

* Export drawing as **PNG**
* Export geometry as **JSON**

---

# 🧩 Tech Stack

| Layer         | Technology              |
| ------------- | ----------------------- |
| UI Framework  | Vue 3 (Composition API) |
| Dev Server    | Vite                    |
| Canvas Engine | Paper.js                |
| Geometry      | Custom JS algorithms    |
| Drawing       | HTML Canvas             |

---

# 🛠 Installation

### Clone

```bash
git clone https://github.com/Mukeshdixena/Polygons-Placement
cd Polygons-Placement
```

### Install

```bash
npm install
```

### Run Dev Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

---

# 📂 Project Structure

```
src/
│
├── components/
│   └── PolygonEditor.vue
│
├── geometry.js
│
├── App.vue
│
└── main.js
```

---

# 🎮 How to Use

### 1. Draw a Room Shape

* Select **Click-to-draw**
* Click to add vertices
* Click near the first vertex to auto-close
* Or use **Finish** button
* In **Freehand** mode: draw freely and algorithm cleans it up

### 2. Add Holes

* Toggle **Hole Mode**
* Draw a polygon inside the room

### 3. Edit Vertices

* Drag vertex handles
* Room updates dynamically

### 4. Run the Algorithm

* Click **Run**
* The largest inscribed rectangle appears
* Stats shown in sidebar (width, height, area, angle, center, corners)

### 5. Export

* **PNG Export**
* **JSON Export** (outer + holes)

---

# 🧠 Technical Algorithm Description

The “Largest Inscribed Rectangle” algorithm uses:

### 1. Bounding Grid Sampling

Scan bounding box with grid points → consider each as potential rectangle center.

### 2. Angle Sweep

Test multiple angles (0°, 12°, 24°, …).

### 3. Axes Definition

For each angle:

```
u = (cosθ, sinθ)
v = (-sinθ, cosθ)
```

### 4. Extent Search

Expand rectangle along +u, –u, +v, –v until hitting polygon boundaries.

### 5. Collision Tests

All corners must satisfy:

* Inside outer polygon
* Not inside any hole
* Not crossing polygon edges

### 6. Max Area Selection

Choose rectangle with largest area.

---

# ⚡ Performance

* Typical execution time: **1–10 ms**
* Complexity depends on grid step and number of angles
* Works smoothly for 4–40 vertex polygons

---

# 🧱 Limitations

* One outer polygon supported
* Holes must lie inside outer polygon
* Self-intersecting polygons not supported
* Extremely thin or noisy shapes reduce accuracy

---

# 🚀 Future Enhancements

I can generate implementations for:

* Zoom + pan
* Snap-to-grid
* Multiple best rectangles
* SVG export
* DXF export
* Dimension lines on rectangle
* Auto-update during vertex dragging
* Undo/redo history
* Dark mode

Tell me which one you'd like next.

---

# 📄 License

MIT License

---

# 🙋‍♂️ Author

Built by **Mukesh Dixena** with assistance from AI-powered tooling.

---
