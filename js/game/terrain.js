import * as THREE from 'three';
import { RENDERING } from '../config.js';
import { generateSplinePoints, slopeAngle } from '../utils/math.js';
import { getCapabilities } from '../utils/responsive.js';

/**
 * Build terrain geometry and collision data from stock price data.
 */
export function buildTerrain(priceData, sceneWidth = RENDERING.TERRAIN_WIDTH) {
  const caps = getCapabilities();
  const resolution = caps.isMobile ? RENDERING.MOBILE_SPLINE_RESOLUTION : RENDERING.SPLINE_RESOLUTION;

  // Normalize price data to terrain coordinates
  const controlPoints = normalizePriceData(priceData, sceneWidth);

  // Generate smooth spline
  const splinePoints = generateSplinePoints(controlPoints, resolution);

  // Build collision segments with slope data
  const collisionData = buildCollisionData(splinePoints);

  // Create Three.js geometry for the line
  const { lineObject, dotObjects, gridObject, labelObjects } = createTerrainVisuals(
    splinePoints, controlPoints, priceData, sceneWidth
  );

  return {
    splinePoints,
    collisionData,
    controlPoints,
    lineObject,
    dotObjects,
    gridObject,
    labelObjects,
    sceneWidth,
    priceData,
  };
}

function normalizePriceData(priceData, sceneWidth) {
  const prices = priceData.map(d => d.close);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;

  return priceData.map((d, i) => ({
    x: (i / (priceData.length - 1)) * sceneWidth,
    y: ((d.close - minPrice) / priceRange) * RENDERING.TERRAIN_HEIGHT,
    price: d.close,
    date: d.date,
    timestamp: d.timestamp,
    index: i,
  }));
}

function buildCollisionData(splinePoints) {
  const segments = [];
  for (let i = 0; i < splinePoints.length - 1; i++) {
    const p1 = splinePoints[i];
    const p2 = splinePoints[i + 1];
    segments.push({
      x1: p1.x,
      y1: p1.y,
      x2: p2.x,
      y2: p2.y,
      slope: slopeAngle(p1.x, p1.y, p2.x, p2.y),
    });
  }
  return segments;
}

/**
 * Get terrain height and slope at a given X position.
 */
export function getTerrainAt(collisionData, x) {
  if (collisionData.length === 0) return { y: 0, slope: 0, index: 0 };

  // Binary search for the segment containing x
  let lo = 0;
  let hi = collisionData.length - 1;

  if (x <= collisionData[0].x1) {
    return { y: collisionData[0].y1, slope: collisionData[0].slope, index: 0 };
  }
  if (x >= collisionData[hi].x2) {
    return { y: collisionData[hi].y2, slope: collisionData[hi].slope, index: hi };
  }

  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const seg = collisionData[mid];
    if (x < seg.x1) {
      hi = mid - 1;
    } else if (x > seg.x2) {
      lo = mid + 1;
    } else {
      // Interpolate y within segment
      const t = (x - seg.x1) / (seg.x2 - seg.x1 || 1);
      const y = seg.y1 + t * (seg.y2 - seg.y1);
      return { y, slope: seg.slope, index: mid };
    }
  }

  // Fallback
  const seg = collisionData[Math.min(lo, collisionData.length - 1)];
  return { y: seg.y1, slope: seg.slope, index: lo };
}

/**
 * Get price data at a given terrain X position.
 */
export function getPriceAtX(controlPoints, x) {
  if (controlPoints.length === 0) return null;

  for (let i = 0; i < controlPoints.length - 1; i++) {
    if (x >= controlPoints[i].x && x <= controlPoints[i + 1].x) {
      const t = (x - controlPoints[i].x) / (controlPoints[i + 1].x - controlPoints[i].x || 1);
      return {
        price: controlPoints[i].price + t * (controlPoints[i + 1].price - controlPoints[i].price),
        date: controlPoints[i].date,
        index: i,
        total: controlPoints.length,
      };
    }
  }

  const last = controlPoints[controlPoints.length - 1];
  return { price: last.price, date: last.date, index: controlPoints.length - 1, total: controlPoints.length };
}

function createTerrainVisuals(splinePoints, controlPoints, priceData, sceneWidth) {
  // Main price line
  const lineVertices = [];
  for (const p of splinePoints) {
    lineVertices.push(p.x, p.y, 0);
  }
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(lineVertices, 3));

  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x2c2c2c,
    linewidth: RENDERING.LINE_WIDTH,
  });
  const lineObject = new THREE.Line(lineGeometry, lineMaterial);

  // Data point dots
  const dotObjects = new THREE.Group();
  const dotGeometry = new THREE.CircleGeometry(3, 8);
  const dotMaterial = new THREE.MeshBasicMaterial({ color: 0x2c2c2c });

  for (const cp of controlPoints) {
    const dot = new THREE.Mesh(dotGeometry, dotMaterial);
    dot.position.set(cp.x, cp.y, 0.1);
    dotObjects.add(dot);
  }

  // Grid lines (graph paper effect) + price/date labels
  const { gridObject, labelObjects } = createGrid(controlPoints, priceData, sceneWidth);

  return { lineObject, dotObjects, gridObject, labelObjects };
}

function makeTextSprite(text, color) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const fontSize = 48;
  ctx.font = `${fontSize}px "Patrick Hand", cursive`;
  const width = Math.ceil(ctx.measureText(text).width) + 8;
  canvas.width = width;
  canvas.height = fontSize + 12;
  // Re-set font after resize
  ctx.font = `${fontSize}px "Patrick Hand", cursive`;
  ctx.fillStyle = color || '#8899aa';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 4, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  // Scale sprite to world units (roughly 1 world unit per 2 canvas pixels)
  sprite.scale.set(width / 2, (fontSize + 12) / 2, 1);
  return sprite;
}

function formatPrice(p) {
  if (p >= 1000) return `$${(p / 1000).toFixed(1)}k`;
  if (p >= 1) return `$${p.toFixed(2)}`;
  return `$${p.toPrecision(3)}`;
}

function createGrid(controlPoints, priceData, sceneWidth) {
  const grid = new THREE.Group();
  const labels = new THREE.Group();
  const gridMaterial = new THREE.LineBasicMaterial({
    color: 0xc8d8e8,
    transparent: true,
    opacity: 0.4,
  });

  const prices = priceData.map(d => d.close);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;

  // Horizontal grid lines (price levels) with price labels
  const numHLines = 6;
  for (let i = 0; i <= numHLines; i++) {
    const y = (i / numHLines) * RENDERING.TERRAIN_HEIGHT;
    const vertices = new Float32Array([0, y, -0.1, sceneWidth, y, -0.1]);
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    grid.add(new THREE.Line(geom, gridMaterial));

    // Price label on left edge
    const price = minPrice + (i / numHLines) * priceRange;
    const label = makeTextSprite(formatPrice(price), '#8899aa');
    label.position.set(-label.scale.x / 2 - 5, y, 0.2);
    labels.add(label);
  }

  // Vertical grid lines (time intervals) with date labels
  const numVLines = Math.min(12, priceData.length);
  for (let i = 0; i <= numVLines; i++) {
    const x = (i / numVLines) * sceneWidth;
    const vertices = new Float32Array([x, -50, -0.1, x, RENDERING.TERRAIN_HEIGHT + 50, -0.1]);
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    grid.add(new THREE.Line(geom, gridMaterial));

    // Date label at bottom
    const dataIdx = Math.round((i / numVLines) * (priceData.length - 1));
    const dateStr = priceData[dataIdx]?.date || '';
    if (dateStr) {
      const dateLabel = makeTextSprite(dateStr, '#8899aa');
      dateLabel.position.set(x, -30, 0.2);
      labels.add(dateLabel);
    }
  }

  return { gridObject: grid, labelObjects: labels };
}

/**
 * Compute biggest drop percentage from start to a given index.
 */
export function computeStats(priceData, survivedIndex) {
  let biggestDrop = 0;
  let peak = priceData[0].close;

  for (let i = 1; i <= survivedIndex && i < priceData.length; i++) {
    if (priceData[i].close > peak) peak = priceData[i].close;
    const drop = (priceData[i].close - peak) / peak;
    if (drop < biggestDrop) biggestDrop = drop;
  }

  return {
    survived: survivedIndex,
    total: priceData.length,
    biggestDropPercent: (biggestDrop * 100).toFixed(1),
  };
}
