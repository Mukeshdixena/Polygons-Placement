# Algorithm Documentation: Fitting Polygons Inside a Main Polygon

This algorithm is designed to find fitting positions for a foreground polygon within a main polygon while considering potential obstacles such as holes and background polygons. The algorithm identifies valid positions where the foreground polygon can be placed without overlapping obstacles or exceeding the boundaries of the main polygon.

## Algorithm Overview

The key steps of the algorithm are:

1. **Input Data:**
   - `mainPolygonPoints`: The vertices of the main polygon that defines the overall bounding area.
   - `holePolygons`: A set of polygons representing holes or obstacles inside the main polygon.
   - `backgroundPolygon`: A background polygon used for projecting the fitting positions.
   - `foregroundPolygon`: The polygon that we aim to fit inside the main polygon without overlapping holes or going out of bounds.

2. **Fitting Procedure:**
   - **Center Calculation**: Calculate the center of the foreground polygon.
   - **Projection**: Project this center onto the background polygon to generate candidate points for fitting.
   - **Check Fitting**: For each candidate position, the algorithm checks whether the foreground polygon can fit by verifying that it does not overlap with holes or exit the main polygon.

3. **Collision and Validity Checks:**
   - **Edge Projection**: To ensure no overlap with other polygons, the algorithm projects polygon edges onto certain axes and checks for overlap using the **Separating Axis Theorem (SAT)**.
   - **Valid Position**: A position is valid if the foreground polygon stays within the main polygon and does not overlap any holes.

## Function Descriptions

### `findFittingPositions(polygonPoints, holePolygons, backgroundPolygon, foregroundPolygon)`
This function identifies valid positions for the foreground polygon.
- **Parameters:**
  - `polygonPoints`: Vertices of the main polygon.
  - `holePolygons`: Vertices of hole polygons.
  - `backgroundPolygon`: Vertices of the background polygon used for projection.
  - `foregroundPolygon`: Vertices of the polygon to fit inside the main polygon.
- **Returns**: The best fitting positions for the foreground polygon.

### `calculatePolygonCenter(polygon)`
Calculates the center (centroid) of a polygon.
- **Parameters**: `polygon`: Vertices of the polygon.
- **Returns**: The [x, y] coordinates of the polygon center.

### `projectPointOnBackground(polygon, midPoint)`
Projects the center of the foreground polygon onto the background polygon.
- **Parameters**:
  - `polygon`: Vertices of the background polygon.
  - `midPoint`: The center of the foreground polygon.
- **Returns**: A set of projected points sorted by distance from the midpoint.

### `projectPointOntoEdge(edge, point)`
Projects a point onto a polygon edge and returns the projection if it lies on the edge.
- **Parameters**:
  - `edge`: Two points representing a polygon edge.
  - `point`: The point to project onto the edge.
- **Returns**: The projected point, or `null` if the projection lies outside the edge.

### `determineFittingPosition(projectedPoints, foregroundPolygon, polygonPoints, holePolygons)`
Evaluates each candidate position to find one where the foreground polygon fits.
- **Parameters**:
  - `projectedPoints`: Candidate points generated by projecting the foreground center.
  - `foregroundPolygon`: The polygon to be fitted.
  - `polygonPoints`: Vertices of the main polygon.
  - `holePolygons`: Vertices of hole polygons.
- **Returns**: The best fitting position, or `null` if none is found.

### `getPolygonBounds(polygonPoints)`
Finds the bounding box of a polygon.
- **Parameters**: `polygonPoints`: Vertices of the polygon.
- **Returns**: The minimum and maximum x and y coordinates of the bounding box.

### `checkAvailableSpace(centerPoint, width, height, gapDistance, polygonPoints, holePolygons)`
Checks if there is enough space for the foreground polygon at a given point.
- **Parameters**:
  - `centerPoint`: The center of the foreground polygon.
  - `width`, `height`: Dimensions of the bounding box of the foreground polygon.
  - `gapDistance`: Additional gap required around the polygon.
  - `polygonPoints`: Vertices of the main polygon.
  - `holePolygons`: Vertices of hole polygons.
- **Returns**: A list of all possible valid positions around the center point.

### `getRectangleCorners(midPoint, width, height, holePolygons, polygonPoints)`
Calculates the corners of the foreground polygon's bounding box at a given point and checks for validity.
- **Parameters**:
  - `midPoint`: Center point of the foreground polygon.
  - `width`, `height`: Dimensions of the polygon's bounding box.
  - `holePolygons`: Vertices of the hole polygons.
  - `polygonPoints`: Vertices of the main polygon.
- **Returns**: The four corners of the bounding box, or `null` if any corners are invalid.

### `is_valide_place(point, holePolygons, polygonPoints)`
Checks if a point is valid (not inside any holes and within the main polygon).
- **Parameters**:
  - `point`: The point to validate.
  - `holePolygons`: Vertices of hole polygons.
  - `polygonPoints`: Vertices of the main polygon.
- **Returns**: `true` if the point is valid, otherwise `false`.

### `isPointInsidePolygon(polygonPoints, point)`
Checks if a point lies inside a polygon using the ray-casting algorithm.
- **Parameters**:
  - `polygonPoints`: Vertices of the polygon.
  - `point`: The point to check.
- **Returns**: `true` if the point is inside, otherwise `false`.

### `polygonsOverlap(polygon1, polygon2)`
Checks whether two polygons overlap using the Separating Axis Theorem (SAT).
- **Parameters**: Two polygons represented by their vertices.
- **Returns**: `true` if the polygons overlap, otherwise `false`.

---

## Usage Example

```javascript
const fittingPositions = findFittingPositions(mainPolygonPoints, holePolygons, backgroundPolygon, foregroundPolygon);
console.log(fittingPositions);
```

This call will attempt to find a valid fitting position for the `foregroundPolygon` within `mainPolygonPoints`, considering obstacles (`holePolygons`) and potential background projections (`backgroundPolygon`).

## Notes

- **Edge Cases**: The algorithm handles cases where polygons are degenerate (edges collapse to a point) by returning `null` for such projections.
- **Efficiency**: The projection and collision-checking steps ensure efficient validation of potential positions for the foreground polygon.