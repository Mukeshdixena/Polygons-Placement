// src/geometry.js
// Grid-sampling + local refinement algorithm to find a large rectangle inside a polygon.
// Exports: findLargestInscribedRectangle(outerPolygonArray, holePolygonsArray = [], options = {})

function getBounds(polygon) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x,y] of polygon) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

// Ray-casting point-in-polygon (robust enough for our usage)
export function isPointInsidePolygon(polygon, point) {
  const [x, y] = point;
  let inside = false;
  let j = polygon.length - 1;
  for (let i = 0; i < polygon.length; i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi + 0.0) + xi);
    if (intersect) inside = !inside;
    j = i;
  }
  return inside;
}

export function isPointInsideAnyHole(point, holes) {
  if (!holes || holes.length === 0) return false;
  for (const h of holes) {
    if (isPointInsidePolygon(h, point)) return true;
  }
  return false;
}

function degToRad(d) { return d * Math.PI / 180; }

export function rectangleCornersFrom(center, width, height, angleDeg) {
  // center: [x,y], width, height, angleDeg (degrees)
  const [cx, cy] = center;
  const a = degToRad(angleDeg);
  const cos = Math.cos(a), sin = Math.sin(a);
  const hw = width / 2, hh = height / 2;
  // define corners relative to center (clockwise)
  const corners = [
    [ hw,  hh],
    [ hw, -hh],
    [-hw, -hh],
    [-hw,  hh],
  ].map(([rx, ry]) => {
    const x = cx + (rx * cos - ry * sin);
    const y = cy + (rx * sin + ry * cos);
    return [x, y];
  });
  return corners;
}

function samplePointsOnSegment(a, b, count) {
  const pts = [];
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    pts.push([ a[0] * (1 - t) + b[0] * t, a[1] * (1 - t) + b[1] * t ]);
  }
  return pts;
}

// Check whether rectangle (corners) fits inside outer polygon and avoids holes.
// We check: all sampled points along rectangle edges are inside outer and not inside holes.
export function rectangleFits(corners, outerPolygon, holes = [], edgeSampleCount = 6) {
  // quick check: corners should be inside outer and not in hole
  for (const c of corners) {
    if (!isPointInsidePolygon(outerPolygon, c)) return false;
    if (isPointInsideAnyHole(c, holes)) return false;
  }

  // sample points along each edge and test them
  for (let i = 0; i < 4; i++) {
    const a = corners[i];
    const b = corners[(i + 1) % 4];
    const samples = samplePointsOnSegment(a, b, edgeSampleCount);
    for (const p of samples) {
      if (!isPointInsidePolygon(outerPolygon, p)) return false;
      if (isPointInsideAnyHole(p, holes)) return false;
    }
  }

  // additionally, check rectangle center is inside outer (redundant but safe)
  const cx = (corners[0][0] + corners[2][0]) / 2;
  const cy = (corners[0][1] + corners[2][1]) / 2;
  if (!isPointInsidePolygon(outerPolygon, [cx, cy])) return false;

  return true;
}

// Local maximizer for a given center and angle. Hill-climb alternating expansion of w/h.
function maximizeAt(center, angleDeg, outerPolygon, holes, bbox, opts) {
  const maxW = bbox.width;
  const maxH = bbox.height;
  // start small
  let w = 4;
  let h = 4;
  // coarse delta proportional to bbox
  let delta = Math.max(bbox.width, bbox.height) / 8;
  if (!isFinite(delta) || delta <= 0) delta = 40;

  const edgeSampleCount = opts.edgeSampleCount || 6;
  const maxIterations = opts.maxIterations || 18;

  let iter = 0;
  while (delta > 0.5 && iter < maxIterations) {
    let improved = true;
    iter++;
    while (improved) {
      improved = false;
      // Try expand width
      if (w + delta <= maxW) {
        const c = rectangleCornersFrom(center, w + delta, h, angleDeg);
        if (rectangleFits(c, outerPolygon, holes, edgeSampleCount)) {
          w += delta;
          improved = true;
        }
      }
      // Try expand height
      if (h + delta <= maxH) {
        const c = rectangleCornersFrom(center, w, h + delta, angleDeg);
        if (rectangleFits(c, outerPolygon, holes, edgeSampleCount)) {
          h += delta;
          improved = true;
        }
      }
      // Try small combined expand (both)
      if (!improved && w + delta <= maxW && h + delta <= maxH) {
        const c = rectangleCornersFrom(center, w + delta, h + delta, angleDeg);
        if (rectangleFits(c, outerPolygon, holes, edgeSampleCount)) {
          w += delta; h += delta; improved = true;
        }
      }
    }
    delta /= 2;
  }

  // quick local refinement: try nudges around center
  let bestArea = w * h;
  let best = { center, width: w, height: h, angleDeg, area: bestArea };
  const nudge = Math.max(bbox.width, bbox.height) / 50;
  const nudges = [
    [0,0], [nudge,0], [-nudge,0], [0,nudge], [0,-nudge],
    [nudge,nudge], [-nudge,-nudge], [nudge,-nudge], [-nudge,nudge]
  ];
  for (const [dx,dy] of nudges) {
    const newCenter = [center[0] + dx, center[1] + dy];
    const c = rectangleCornersFrom(newCenter, w, h, angleDeg);
    if (rectangleFits(c, outerPolygon, holes, edgeSampleCount)) {
      const area = w*h;
      if (area > bestArea) {
        bestArea = area;
        best = { center: newCenter, width: w, height: h, angleDeg, area };
      }
    }
  }

  return best;
}

// Main exported function
// outerPolygon: array [[x,y],...]
// holes: array of polygons
// options: { gridStep, angleStepDeg, edgeSampleCount, coarseGridFactor, maxCenters, maxCandidates }
export function findLargestInscribedRectangle(outerPolygon, holes = [], options = {}) {
  if (!outerPolygon || outerPolygon.length < 3) return null;

  const bbox = getBounds(outerPolygon);
  const opts = options || {};

  const gridStep = opts.gridStep || Math.max(bbox.width, bbox.height) / (opts.coarseGridFactor || 24);
  const angleStepDeg = opts.angleStepDeg || 15; // try more angles for better results (smaller step = slower)
  const maxCenters = opts.maxCenters || 2000; // safeguard for too many centers
  const maxCandidates = opts.maxCandidates || 300; // top centers to refine
  const edgeSampleCount = opts.edgeSampleCount || 6;

  // build grid of candidate centers inside polygon
  const centers = [];
  const sx = Math.max(1, Math.floor(bbox.width / gridStep));
  const sy = Math.max(1, Math.floor(bbox.height / gridStep));
  for (let iy = 0; iy <= sy; iy++) {
    const y = bbox.minY + (iy / sy) * bbox.height;
    for (let ix = 0; ix <= sx; ix++) {
      const x = bbox.minX + (ix / sx) * bbox.width;
      if (isPointInsidePolygon(outerPolygon, [x,y]) && !isPointInsideAnyHole([x,y], holes)) {
        centers.push([x,y]);
        if (centers.length >= maxCenters) break;
      }
    }
    if (centers.length >= maxCenters) break;
  }

  if (centers.length === 0) return null;

  // quick coarse pass: for each center check multiple angles with a small local expansion to estimate area
  const candidates = [];
  for (const center of centers) {
    let bestLocalArea = 0;
    let bestLocal = null;
    for (let ang = 0; ang < 180; ang += angleStepDeg) {
      // small quick expansion (start with small w/h and expand a couple of times)
      const quick = maximizeAt(center, ang, outerPolygon, holes, bbox, { edgeSampleCount, maxIterations: 8 });
      if (quick.area > bestLocalArea) {
        bestLocalArea = quick.area;
        bestLocal = quick;
      }
    }
    if (bestLocal) candidates.push(bestLocal);
    if (candidates.length >= maxCandidates) break;
  }

  if (candidates.length === 0) return null;

  // sort candidates by area and keep top N for deeper refinement
  candidates.sort((a,b) => b.area - a.area);
  const top = candidates.slice(0, Math.min(candidates.length, Math.max(5, Math.floor(candidates.length/3))));

  // deep refinement: for each top candidate, run maximizeAt with smaller delta and more iterations
  let bestGlobal = { area: 0, corners: null, center: null, width: 0, height: 0, angleDeg: 0 };
  for (const cand of top) {
    // refine with smaller grid/iterations
    const refined = maximizeAt(cand.center, cand.angleDeg, outerPolygon, holes, bbox, { edgeSampleCount: opts.edgeSampleCount || 8, maxIterations: 24 });
    if (refined.area > bestGlobal.area) {
      const corners = rectangleCornersFrom(refined.center, refined.width, refined.height, refined.angleDeg);
      bestGlobal = {
        area: refined.area,
        corners,
        center: refined.center,
        width: refined.width,
        height: refined.height,
        angleDeg: refined.angleDeg
      };
    }
  }

  // As a final polish, attempt small angle perturbations around best angle
  if (bestGlobal.area > 0) {
    const best = bestGlobal;
    const anglePerturb = Math.max(1, Math.min(5, Math.floor((angleStepDeg || 15)/2)));
    for (let da = -anglePerturb; da <= anglePerturb; da++) {
      const ang = best.angleDeg + da;
      const refined = maximizeAt(best.center, ang, outerPolygon, holes, bbox, { edgeSampleCount: opts.edgeSampleCount || 8, maxIterations: 24 });
      if (refined.area > bestGlobal.area) {
        bestGlobal.area = refined.area;
        bestGlobal.corners = rectangleCornersFrom(refined.center, refined.width, refined.height, refined.angleDeg);
        bestGlobal.center = refined.center;
        bestGlobal.width = refined.width;
        bestGlobal.height = refined.height;
        bestGlobal.angleDeg = refined.angleDeg;
      }
    }
  }

  return bestGlobal.area > 0 ? bestGlobal : null;
}
