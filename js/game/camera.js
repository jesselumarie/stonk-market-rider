import { CAMERA, RENDERING } from '../config.js';
import { lerp, clamp, standardDeviation } from '../utils/math.js';

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
    cameraState.y = lerp(cameraState.y, riderY + RENDERING.TERRAIN_HEIGHT * CAMERA.VERTICAL_OFFSET, dt * 2);
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

  // Compute price changes
  const changes = [];
  for (let i = 1; i < lookahead.length; i++) {
    if (lookahead[i - 1].price !== 0) {
      changes.push((lookahead[i].price - lookahead[i - 1].price) / lookahead[i - 1].price);
    }
  }

  return standardDeviation(changes);
}

function mapVolatilityToZoom(volatility) {
  // Higher volatility → wider zoom (camera pulls back)
  // Typical daily volatility: 0.01-0.05
  const normalized = clamp(volatility / 0.05, 0, 1);
  return lerp(CAMERA.MIN_ZOOM, CAMERA.MAX_ZOOM, normalized);
}
