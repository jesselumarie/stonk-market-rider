import { PHYSICS, DIFFICULTY, RIDER_STATES } from '../config.js';
import { clamp, angleBetween, vectorMagnitude } from '../utils/math.js';
import { getTerrainAt } from './terrain.js';

let state = {
  x: 0,
  y: 0,
  vx: 200,
  vy: 0,
  rotation: 0,
  riderState: RIDER_STATES.ON_TERRAIN,
  airTime: 0,
  collisionData: null,
  terrainEndX: 0,
  deathCause: '',
};

export function initPhysics(collisionData, startX = 0) {
  const terrain = getTerrainAt(collisionData, startX);
  state = {
    x: startX,
    y: terrain.y,
    vx: 200,
    vy: 0,
    rotation: terrain.slope,
    riderState: RIDER_STATES.ON_TERRAIN,
    airTime: 0,
    collisionData,
    terrainEndX: collisionData.length > 0
      ? collisionData[collisionData.length - 1].x2
      : 0,
    deathCause: '',
  };
}

export function updatePhysics(dt, input) {
  if (state.riderState === RIDER_STATES.DEAD) return getPhysicsState();

  // Cap dt to avoid physics explosion on tab refocus
  dt = Math.min(dt, 0.05);

  if (state.riderState === RIDER_STATES.ON_TERRAIN) {
    updateOnTerrain(dt, input);
  } else if (state.riderState === RIDER_STATES.AIRBORNE) {
    updateAirborne(dt, input);
  }

  // Check if rider passed the end of terrain
  if (state.x >= state.terrainEndX && state.riderState !== RIDER_STATES.DEAD) {
    state.riderState = RIDER_STATES.DEAD;
    state.deathCause = 'Reached the end of the line';
  }

  return getPhysicsState();
}

function getProgress() {
  if (state.terrainEndX <= 0) return 0;
  return clamp(state.x / state.terrainEndX, 0, 1);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function getDifficulty() {
  const p = getProgress();
  // Ease-in curve so early game is forgiving, difficulty ramps in back half
  const curve = p * p;
  return {
    minSpeed: lerp(DIFFICULTY.BASE_MIN_SPEED, DIFFICULTY.MAX_MIN_SPEED, curve),
    speedBoost: lerp(DIFFICULTY.SPEED_BOOST_START, DIFFICULTY.SPEED_BOOST_END, curve),
    progress: p,
  };
}

export function getDifficultyState() {
  return getDifficulty();
}

function updateOnTerrain(dt, input) {
  const terrain = getTerrainAt(state.collisionData, state.x);
  const slope = terrain.slope;
  const diff = getDifficulty();

  // --- Board rotation ---
  // Player left/right rotates the board continuously while held
  if (input.lean && input.lean !== 0) {
    state.rotation += input.lean * PHYSICS.BOARD_ROTATE_SPEED * dt;
  }
  // Magnetic alignment: pull board rotation toward terrain slope
  const angleDiff = angleBetween(state.rotation, slope);
  state.rotation += angleDiff * PHYSICS.MAGNET_ALIGN_RATE * dt;

  // --- Velocity along terrain ---
  const gravityAccel = -PHYSICS.GRAVITY * Math.sin(slope);
  const frictionDecel = state.vx > 0 ? -PHYSICS.GRAVITY * 0.05 : PHYSICS.GRAVITY * 0.05;

  // Player speed control (up/down arrows)
  const ACCEL_FORCE = 1200;
  const playerAccel = (input.accel || 0) * ACCEL_FORCE;

  // Progressive forward push
  state.vx += (gravityAccel + frictionDecel + diff.speedBoost + playerAccel) * dt;
  state.vx *= PHYSICS.FRICTION;
  state.vx = clamp(state.vx, diff.minSpeed, PHYSICS.MAX_VELOCITY);

  // --- Hill launch detection ---
  // Project where rider would go following the current terrain tangent.
  // If momentum carries them above the terrain (convex hill crest), launch.
  const projDist = state.vx * PHYSICS.LAUNCH_LOOKAHEAD;
  const projX = state.x + projDist * Math.cos(slope);
  const projY = state.y + projDist * Math.sin(slope);
  const futureTerrain = getTerrainAt(state.collisionData, projX);
  const heightAbove = projY - futureTerrain.y;

  if (heightAbove > PHYSICS.LAUNCH_THRESHOLD && slope > -0.15) {
    // Natural hill launch — rider flies off with tangent velocity
    state.riderState = RIDER_STATES.AIRBORNE;
    const speed = state.vx;
    state.vx = speed * Math.cos(slope);
    state.vy = speed * Math.sin(slope);
    // Advance position for this frame
    state.x += state.vx * dt;
    state.y += state.vy * dt;
    state.airTime = 0;
    return;
  }

  // --- Stay on terrain (magnetic stick) ---
  state.x += state.vx * Math.cos(slope) * dt;
  const newTerrain = getTerrainAt(state.collisionData, state.x);
  state.y = newTerrain.y;

  // Manual jump (space bar) — always available as escape hatch
  if (input.jump) {
    state.riderState = RIDER_STATES.AIRBORNE;
    state.vy = PHYSICS.JUMP_FORCE;
    state.vx = state.vx * Math.cos(slope);
    state.airTime = 0;
  }
}

function updateAirborne(dt, input) {
  // Gravity
  state.vy -= PHYSICS.GRAVITY * dt;
  state.vy = clamp(state.vy, -2000, 2000);

  // Update position
  state.x += state.vx * dt;
  state.y += state.vy * dt;

  // Board rotation: player-controlled, same speed as on terrain
  if (input.lean && input.lean !== 0) {
    state.rotation += input.lean * PHYSICS.BOARD_ROTATE_SPEED * dt;
  }

  // Track air time
  state.airTime += dt;
  if (state.airTime > PHYSICS.AIRTIME_DEATH_SECONDS) {
    state.riderState = RIDER_STATES.DEAD;
    state.deathCause = 'Lost in the void';
    return;
  }

  // Magnetic landing: once past the jump apex, snap back to the
  // line when close. Prevents floating above downslopes.
  const terrain = getTerrainAt(state.collisionData, state.x);
  const distAbove = state.y - terrain.y;
  const pastApex = state.vy < 0;
  const MAGNET_RANGE = 25;

  if (state.y <= terrain.y) {
    // Below terrain — always snap
    handleLanding(terrain);
  } else if (pastApex && distAbove < MAGNET_RANGE) {
    // Falling and close to the line — magnet snap
    handleLanding(terrain);
  }
}

function handleLanding(terrain) {
  const diff = getDifficulty();

  // Death from extreme impact
  const impactForce = Math.abs(state.vy);
  if (impactForce > PHYSICS.LANDING_IMPACT_DEATH) {
    state.riderState = RIDER_STATES.DEAD;
    state.deathCause = 'Terminal velocity';
    return;
  }

  // Death from landing upside-down
  const angleMismatch = Math.abs(angleBetween(state.rotation, terrain.slope));
  if (angleMismatch > Math.PI / 2) {
    state.riderState = RIDER_STATES.DEAD;
    state.deathCause = 'Landed on your head';
    return;
  }

  const landingSpeed = vectorMagnitude(state.vx, state.vy);
  const penalty = clamp(1 - angleMismatch * 0.8, 0.3, 1);

  // Snap onto the line
  state.riderState = RIDER_STATES.ON_TERRAIN;
  state.y = terrain.y;
  state.rotation = terrain.slope;
  state.vx = landingSpeed * penalty * Math.cos(terrain.slope);
  state.vx = clamp(state.vx, diff.minSpeed, PHYSICS.MAX_VELOCITY);
  state.vy = 0;
  state.airTime = 0;
}

export function getPhysicsState() {
  return {
    x: state.x,
    y: state.y,
    vx: state.vx,
    vy: state.vy,
    rotation: state.rotation,
    riderState: state.riderState,
    airTime: state.airTime,
    deathCause: state.deathCause,
  };
}
