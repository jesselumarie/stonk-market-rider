import { RIDER_STATES } from '../config.js';

/**
 * Rider state manager - maps physics state to visual state for sprites.
 */

const SPRITE_STATES = {
  IDLE: 'idle',
  CROUCH: 'crouch',
  JUMP: 'jump',
  AIR: 'air',
  DEAD: 'dead',
};

const SPEED_THRESHOLD_CROUCH = 400;
const JUMP_COOLDOWN = 300; // ms
const AIR_ROTATE_SPEED = 3.0; // radians per second

let lastJumpTime = 0;
let jumpPressed = false;
let jumpConsumed = false;
let leanLeft = false;
let leanRight = false;
let accelUp = false;
let accelDown = false;

export function initRider() {
  lastJumpTime = 0;
  jumpPressed = false;
  jumpConsumed = false;
  leanLeft = false;
  leanRight = false;
  accelUp = false;
  accelDown = false;
}

export function handleInput(event) {
  if (event === 'jump_down') {
    jumpPressed = true;
    jumpConsumed = false;
  } else if (event === 'jump_up') {
    jumpPressed = false;
  } else if (event === 'lean_left_down') {
    leanLeft = true;
  } else if (event === 'lean_left_up') {
    leanLeft = false;
  } else if (event === 'lean_right_down') {
    leanRight = true;
  } else if (event === 'lean_right_up') {
    leanRight = false;
  } else if (event === 'accel_up_down') {
    accelUp = true;
  } else if (event === 'accel_up_up') {
    accelUp = false;
  } else if (event === 'accel_down_down') {
    accelDown = true;
  } else if (event === 'accel_down_up') {
    accelDown = false;
  }
}

export function getJumpInput(now) {
  if (jumpPressed && !jumpConsumed && (now - lastJumpTime) > JUMP_COOLDOWN) {
    jumpConsumed = true;
    lastJumpTime = now;
    return true;
  }
  return false;
}

export function getLeanInput() {
  let lean = 0;
  if (leanLeft) lean += 1;   // rotate nose up (counterclockwise)
  if (leanRight) lean -= 1;  // rotate nose down (clockwise)
  return lean;
}

export function getAccelInput() {
  if (accelUp) return 1;
  if (accelDown) return -1;
  return 0;
}

export { AIR_ROTATE_SPEED };

/**
 * Determine which sprite to show based on physics state.
 */
export function getSpriteState(physicsState) {
  const { riderState, vx, vy } = physicsState;

  if (riderState === RIDER_STATES.DEAD) {
    return SPRITE_STATES.DEAD;
  }

  if (riderState === RIDER_STATES.AIRBORNE) {
    return vy > 0 ? SPRITE_STATES.JUMP : SPRITE_STATES.AIR;
  }

  // ON_TERRAIN
  return Math.abs(vx) > SPEED_THRESHOLD_CROUCH
    ? SPRITE_STATES.CROUCH
    : SPRITE_STATES.IDLE;
}

/**
 * Compute rider rotation for display.
 * When dead, spin rapidly.
 */
export function getRiderRotation(physicsState, dt, currentRotation) {
  if (physicsState.riderState === RIDER_STATES.DEAD) {
    return currentRotation + 8 * dt; // fast spin
  }
  return physicsState.rotation;
}
