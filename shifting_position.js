const Start = performance.now(); 
console.time("Execution Time");
function plotPointsRec(ctx, pointsList, color = false) {
    if (!pointsList.length) return;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    if (color) {
        let firstPolygon = pointsList[0];
        if (firstPolygon && firstPolygon.length > 0) {
            drawFilledPolygon(ctx, firstPolygon, 'rgba(0, 0, 255, 0.5)');
        }

        for (let i = 0; i < pointsList.length; i++) {
            let points = pointsList[i];
            if (points && points.length > 0) {
                drawPolygon(ctx, points);
                drawPoints(ctx, points);
            }
        }
    } else {
        for (let points of pointsList) {
            if (points && points.length > 0) {
                drawPolygon(ctx, points);
                drawPoints(ctx, points);
            }
        }
    }
}

function drawPolygon(ctx, points) {
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1]);
    }
    ctx.lineTo(points[0][0], points[0][1]);  // Close the polygon
    ctx.stroke();
}

function drawPoints(ctx, points) {
    for (let point of points) {
        ctx.beginPath();
        ctx.arc(point[0], point[1], 3, 0, Math.PI * 2);  // Draw a small circle for each point
        ctx.fill();
    }
}

function drawFilledPolygon(ctx, points, fillColor) {
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1]);
    }
    ctx.lineTo(points[0][0], points[0][1]);  // Close the polygon
    ctx.fillStyle = fillColor;
    ctx.fill();
}

const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');


const mainPolygonPoints = [
    [0, 180], [0, 260], [140, 260], [140, 350], [250, 350], [250, 0],
    [140, 0], [140, 70], [100, 70], [100, 180]
];

const holePolygons = [
    [[230, 150], [210, 160], [220, 170], [240, 160]],
    [[160, 10], [160, 20], [170, 20], [170, 30], [180, 30], [180, 20], [220, 20], [220, 10]],
    [[160, 50], [160, 60], [230, 60], [230, 50]],
    [[210, 80], [230, 110], [240, 90], [230, 70]],
    [[200, 300], [200, 320], [220, 320], [220, 300]],
    [[230, 310], [230, 350], [250, 350], [250, 310]],
    [[180, 190], [180, 250], [220, 250], [220, 190]],
];

const backgroundPolygon = [[180, 190], [180, 250], [220, 250], [220, 190]];


const foregroundPolygon = [[165, 210], [195, 210], [195, 170], [165, 170]];

plotPointsRec(ctx, [foregroundPolygon].concat(holePolygons, [mainPolygonPoints]), true);
const fittingPositions = findFittingPositions(mainPolygonPoints, holePolygons, backgroundPolygon, foregroundPolygon);

plotPointsRec(ctx, [fittingPositions[2]].concat(holePolygons, [mainPolygonPoints]), true);
// plotPointsRec(ctx, fittingPositions.concat(holePolygons, [mainPolygonPoints]), true);

function findFittingPositions(polygonPoints, holePolygons, backgroundPolygon, foregroundPolygon) {

    const foregroundCenter = calculatePolygonCenter(foregroundPolygon);

    const projectedPoints = projectPointOnBackground(backgroundPolygon, foregroundCenter);


    let result = determineFittingPosition(projectedPoints, foregroundPolygon, polygonPoints, holePolygons);


    return result;
}

function calculatePolygonCenter(polygon) {
    const [xSum, ySum] = polygon.reduce(
        ([sumX, sumY], [x, y]) => [sumX + x, sumY + y],
        [0, 0]
    );

    return [xSum / polygon.length, ySum / polygon.length];
}

function projectPointOnBackground(polygon, midPoint) {
    const projectedPoints = [];

    for (let i = 0; i < polygon.length - 1; i++) {
        const currentEdge = [polygon[i], polygon[i + 1]];
        const currentPoint = projectPointOntoEdge(currentEdge, midPoint);

        if (currentPoint !== null) {
            projectedPoints.push(currentPoint);
        }
    }

    const currentEdge = [polygon[polygon.length - 1], polygon[0]];
    const currentPoint = projectPointOntoEdge(currentEdge, midPoint);
    if (currentPoint !== null) {
        projectedPoints.push(currentPoint);
    }

    projectedPoints.push(...polygon);

    projectedPoints.sort((a, b) => {
        const distanceA = Math.hypot(a[0] - midPoint[0], a[1] - midPoint[1]);
        const distanceB = Math.hypot(b[0] - midPoint[0], b[1] - midPoint[1]);
        return distanceA - distanceB; // Nearest first
    });

    return projectedPoints;
}

function projectPointOntoEdge(edge, point) {

    const [x1, y1] = edge[0];
    const [x2, y2] = edge[1];
    const [px, py] = point;


    const dx = x2 - x1;
    const dy = y2 - y1;

    const dpx = px - x1;
    const dpy = py - y1;

    const edgeLengthSquared = dx * dx + dy * dy;

    if (edgeLengthSquared === 0) {
        return null; // Edge is a point
    }

    const t = (dpx * dx + dpy * dy) / edgeLengthSquared;

    if (t < 0 || t > 1) {
        return null; // Projected point is outside the edge
    }

    const projectedX = x1 + t * dx;
    const projectedY = y1 + t * dy;

    if (projectedX == x1 && projectedY == y1 || projectedX == x2 && projectedY == y2) {
        return null;
    }

    return [projectedX, projectedY];
}


function determineFittingPosition(projectedPoints, foregroundPolygon, polygonPoints, holePolygons) {

    const { minX, maxX, minY, maxY } = getPolygonBounds(foregroundPolygon);
    const width = maxX - minX;
    const height = maxY - minY;
    const gapDistance = 10;

    for (let point of projectedPoints) {
        let position = checkAvailableSpace(point, width, height, gapDistance, polygonPoints, holePolygons);
        if (position.length !== 0) {
            return position;
        }
    }
    return null;
}

function getPolygonBounds(polygonPoints) {
    return polygonPoints.reduce((acc, [x, y]) => {
        return {
            minX: Math.min(acc.minX, x),
            maxX: Math.max(acc.maxX, x),
            minY: Math.min(acc.minY, y),
            maxY: Math.max(acc.maxY, y),
        };
    }, { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });
}

function checkAvailableSpace(centerPoint, width, height, gapDistance, polygonPoints, holePolygons) {
    const [x, y] = centerPoint;
    const halfHeight = gapDistance + height / 2;
    const halfWidth = gapDistance + width / 2;

    const surroundingPoints = [
        [x, y - halfHeight],             // Top
        [x + halfWidth, y - halfHeight], // Top Right
        [x + halfWidth, y],              // Right
        [x + halfWidth, y + halfHeight], // Bottom Right
        [x, y + halfHeight],              // Bottom
        [x - halfWidth, y + halfHeight], // Bottom Left
        [x - halfWidth, y],               // Left
        [x - halfWidth, y - halfHeight], // Top Left
    ];

    let all_position = []

    for (const point of surroundingPoints) {
        if (is_valide_place(point, holePolygons, polygonPoints)) {
            const position = getRectangleCorners(point, width, height, holePolygons, polygonPoints);
            if (position !== null) {
                all_position.push(position);
            }
        }
    }

    return all_position;
}


function getRectangleCorners(midPoint, width, height, holePolygons, polygonPoints) {
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const rectangleCorners = [
        [midPoint[0] + halfWidth, midPoint[1] + halfHeight], // Top Right
        [midPoint[0] + halfWidth, midPoint[1] - halfHeight], // Bottom Right
        [midPoint[0] - halfWidth, midPoint[1] - halfHeight], // Bottom Left
        [midPoint[0] - halfWidth, midPoint[1] + halfHeight], // Top Left
    ];


    // if(is_valide_place_poly(rectangleCorners, holePolygons, polygonPoints)){
    //     return null;
    // }

    for (const corner of rectangleCorners) {
        if (!is_valide_place(corner, holePolygons, polygonPoints)) {
            return null;
        }
    }

    for (const hole of holePolygons) {
        if (polygonsOverlap(hole, rectangleCorners)) {
            return null;
        }
    }


    return rectangleCorners;
}

function is_valide_place_poly(rectangleCorners, holePolygons, polygonPoints) {

    for (const corner of rectangleCorners) {
        if (!is_valide_place(corner, holePolygons, polygonPoints)) {
            return false;
        }
    }
    return true;
}

function is_valide_place(point, holePolygons, polygonPoints) {

    let ans = !isInsideHoles(point, holePolygons) && isPointInsidePolygon(polygonPoints, point);
    return ans;
}




function isPointInsidePolygon(polygonPoints, point) {
    if (isPointOnPolygonEdge(polygonPoints, point)) {
        return true;
    }

    const [x, y] = point;
    const numVertices = polygonPoints.length;
    let inside = false;
    let [p1x, p1y] = polygonPoints[0];

    for (let i = 0; i <= numVertices; i++) {
        const [p2x, p2y] = polygonPoints[i % numVertices];
        if (y > Math.min(p1y, p2y) && y <= Math.max(p1y, p2y) && x <= Math.max(p1x, p2x)) {
            if (p1y !== p2y) {
                const xIntersection = ((y - p1y) * (p2x - p1x)) / (p2y - p1y) + p1x;
                if (p1x === p2x || x <= xIntersection) {
                    inside = !inside;
                }
            }
        }
        [p1x, p1y] = [p2x, p2y];
    }
    return inside;
}

function isInsideHoles(point, holePolygons) {

    return holePolygons.some(holePolygon => isPointInsidePolygon(holePolygon, point));
}



function isPointOnPolygonEdge(polygon, point, epsilon = 1e-9) {
    const [x, y] = point;
    const numVertices = polygon.length;
    for (let i = 0; i < numVertices; i++) {
        const [x1, y1] = polygon[i];
        const [x2, y2] = polygon[(i + 1) % numVertices];

        if (Math.min(x1, x2) <= x && x <= Math.max(x1, x2) && Math.min(y1, y2) <= y && y <= Math.max(y1, y2)) {
            if (Math.abs((x2 - x1) * (y - y1) - (y2 - y1) * (x - x1)) < epsilon) {
                return true;
            }
        }
    }
    return false;
}





function projectPolygon(polygon, axis) {
    let min = Infinity;
    let max = -Infinity;

    for (const point of polygon) {
        const projection = (point[0] * axis.x) + (point[1] * axis.y);
        min = Math.min(min, projection);
        max = Math.max(max, projection);
    }

    return { min, max };
}


function overlap(projection1, projection2) {
    return !(projection1.max < projection2.min || projection2.max < projection1.min);
}


function getAxes(polygon) {
    const axes = [];

    for (let i = 0; i < polygon.length; i++) {
        const p1 = polygon[i];
        const p2 = polygon[(i + 1) % polygon.length];

        const edge = { x: p2[0] - p1[0], y: p2[1] - p1[1] };


        const normal = { x: -edge.y, y: edge.x };


        const magnitude = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
        axes.push({ x: normal.x / magnitude, y: normal.y / magnitude });
    }

    return axes;
}


function polygonsOverlap(polygon1, polygon2) {


    const axes1 = getAxes(polygon1);
    const axes2 = getAxes(polygon2);

    const axes = [...axes1, ...axes2];

    for (const axis of axes) {
        const projection1 = projectPolygon(polygon1, axis);
        const projection2 = projectPolygon(polygon2, axis);

        if (!overlap(projection1, projection2)) {
            return false;
        }
    }

    return true;
}

const end = performance.now();

let executionTime = end - Start; 
console.log(executionTime);
console.log("executionTime");
console.timeEnd("Execution Time");