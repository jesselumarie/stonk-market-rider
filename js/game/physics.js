import { PHYSICS, DIFFICULTY, RIDER_STATES } from '../config.js';
import { clamp, vectorAngle, vectorMagnitude } from '../utils/math.js';
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
    landingTolerance: lerp(DIFFICULTY.LANDING_TOLERANCE_START, DIFFICULTY.LANDING_TOLERANCE_END, curve),
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

  // Acceleration from gravity along slope
  const gravityAccel = -PHYSICS.GRAVITY * Math.sin(slope);
  const frictionDecel = state.vx > 0 ? -PHYSICS.GRAVITY * 0.05 : PHYSICS.GRAVITY * 0.05;

  // Progressive forward push
  state.vx += (gravityAccel + frictionDecel + diff.speedBoost) * dt;
  state.vx *= PHYSICS.FRICTION;
  state.vx = clamp(state.vx, diff.minSpeed, PHYSICS.MAX_VELOCITY);

  // Move along terrain — rider sticks to the line at all times
  state.x += state.vx * Math.cos(slope) * dt;
  const newTerrain = getTerrainAt(state.collisionData, state.x);
  state.y = newTerrain.y;
  state.rotation = newTerrain.slope;

  // Only detach on explicit jump
  if (input.jump) {
    state.riderState = RIDER_STATES.AIRBORNE;
    state.vy = PHYSICS.JUMP_FORCE;
    // Preserve horizontal velocity
    const speed = state.vx;
    state.vx = speed * Math.cos(state.rotation);
    state.airTime = 0;
  }
}

function updateAirborne(dt, input) {
  // Gravity
  state.vy -= PHYSICS.GRAVITY * dt;
  state.vy = clamp(state.vy, -2000, 2000);

  // Air control: rotate velocity vector with left/right input
  if (input.lean && input.lean !== 0) {
    const angle = vectorAngle(state.vx, state.vy);
    const speed = vectorMagnitude(state.vx, state.vy);
    const newAngle = angle + input.lean * input.airRotateSpeed * dt;
    state.vx = speed * Math.cos(newAngle);
    state.vy = speed * Math.sin(newAngle);
  }

  // Update position
  state.x += state.vx * dt;
  state.y += state.vy * dt;

  // Update rotation to follow velocity vector
  state.rotation = vectorAngle(state.vx, state.vy);

  // Track air time
  state.airTime += dt;
  if (state.airTime > PHYSICS.AIRTIME_DEATH_SECONDS) {
    state.riderState = RIDER_STATES.DEAD;
    state.deathCause = 'Lost in the void';
    return;
  }

  // Check for terrain collision
  const terrain = getTerrainAt(state.collisionData, state.x);
  if (state.y <= terrain.y && state.vy < 0) {
    // Landing!
    handleLanding(terrain);
  }
}

function handleLanding(terrain) {
  const velocityAngle = vectorAngle(state.vx, state.vy);
  const angleMismatch = Math.abs(velocityAngle - terrain.slope);
  const impactForce = Math.abs(state.vy);
  const diff = getDifficulty();

  if (angleMismatch > diff.landingTolerance || impactForce > PHYSICS.LANDING_IMPACT_DEATH) {
    // Bad landing → death
    state.riderState = RIDER_STATES.DEAD;
    if (impactForce > PHYSICS.LANDING_IMPACT_DEATH) {
      state.deathCause = 'Terminal velocity';
    } else {
      state.deathCause = 'Bad landing';
    }
    return;
  }

  // Clean landing → back to terrain
  state.riderState = RIDER_STATES.ON_TERRAIN;
  state.y = terrain.y;
  state.rotation = terrain.slope;
  // Convert velocity back to terrain-following speed
  state.vx = vectorMagnitude(state.vx, state.vy) * Math.cos(terrain.slope);
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
