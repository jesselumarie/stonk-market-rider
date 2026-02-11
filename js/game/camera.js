import { CAMERA, RENDERING } from '../config.js';
import { lerp, clamp } from '../utils/math.js';

let cameraState = {
  x: 0,
  y: 0,
  zoom: 1.0,
  targetZoom: 1.0,
  isDeath: false,
  deathTime: 0,
};

export function initCamera() {
  cameraState = {
    x: 0,
    y: 0,
    zoom: 1.0,
    targetZoom: 1.0,
    isDeath: false,
    deathTime: 0,
  };
}

/**
 * Update camera position and zoom based on rider position and terrain data.
 */
export function updateCamera(threeCamera, riderX, riderY, controlPoints, dt, isDead = false) {
  if (isDead && !cameraState.isDeath) {
    cameraState.isDeath = true;
    cameraState.deathTime = 0;
  }

  if (cameraState.isDeath) {
    cameraState.deathTime += dt;
    // Slowly zoom out and drift up on death
    cameraState.targetZoom = clamp(cameraState.zoom + dt * 0.3, CAMERA.MIN_ZOOM, CAMERA.MAX_ZOOM * 1.5);
    cameraState.y = lerp(cameraState.y, riderY + 200, dt * 0.5);
    cameraState.x = lerp(cameraState.x, riderX, dt * 0.5);
  } else {
    // Calculate upcoming volatility for zoom
    const volatility = calculateVolatility(controlPoints, riderX);
    cameraState.targetZoom = mapVolatilityToZoom(volatility);

    // Camera follows rider with lead
    const leadX = 150; // pixels ahead
    cameraState.x = lerp(cameraState.x, riderX + leadX, dt * 3);
    // Scale vertical offset with zoom so terrain stays visible at all zoom levels
    // At min zoom (close), offset is small; at max zoom (far), offset is larger
    const curDistance = 1500 * cameraState.zoom;
    const visibleHalfHeight = curDistance * Math.tan(17.5 * Math.PI / 180);
    const verticalOffset = visibleHalfHeight * CAMERA.VERTICAL_OFFSET;
    cameraState.y = lerp(cameraState.y, riderY + verticalOffset, dt * 2);
  }

  // Smooth zoom
  cameraState.zoom = lerp(cameraState.zoom, cameraState.targetZoom, CAMERA.ZOOM_SPEED);

  // Apply to Three.js camera
  const distance = 1500 * cameraState.zoom;
  threeCamera.position.set(cameraState.x, cameraState.y, distance);
  threeCamera.lookAt(cameraState.x, cameraState.y, 0);
}

function calculateVolatility(controlPoints, riderX) {
  if (!controlPoints || controlPoints.length < 2) return 0;

  // Find current position in control points
  let startIdx = 0;
  for (let i = 0; i < controlPoints.length; i++) {
    if (controlPoints[i].x > riderX) {
      startIdx = i;
      break;
    }
  }

  // Get next N points
  const endIdx = Math.min(startIdx + CAMERA.LOOKAHEAD_POINTS, controlPoints.length);
  const lookahead = controlPoints.slice(startIdx, endIdx);

  if (lookahead.length < 2) return 0;

  // Use Y-range of upcoming terrain (already normalized to 0-TERRAIN_HEIGHT)
  // This is timeframe-agnostic — works for 1-minute and daily candles alike
  let yMin = Infinity, yMax = -Infinity;
  for (const p of lookahead) {
    if (p.y < yMin) yMin = p.y;
    if (p.y > yMax) yMax = p.y;
  }
  return (yMax - yMin) / RENDERING.TERRAIN_HEIGHT;
}

function mapVolatilityToZoom(volatility) {
  // volatility is Y-range fraction (0 = flat, 1 = full terrain height)
  // Flat terrain → closer camera, big swings → pull back
  const normalized = clamp(volatility / 0.5, 0, 1);
  return lerp(CAMERA.MIN_ZOOM, CAMERA.MAX_ZOOM, normalized);
}
