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

let lastJumpTime = 0;
let jumpPressed = false;
let jumpConsumed = false;

export function initRider() {
  lastJumpTime = 0;
  jumpPressed = false;
  jumpConsumed = false;
}

export function handleInput(event) {
  if (event === 'jump_down') {
    jumpPressed = true;
    jumpConsumed = false;
  } else if (event === 'jump_up') {
    jumpPressed = false;
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

/**
 * Determine which sprite to show based on physics state.
 */
export function getSpriteState(physicsState) {
  const { riderState, vx, vy } = physicsState;

  if (riderState === RIDER_STATES.DEAD) {
    return SPRITE_STATES.DEAD;
  }

  if (riderState === RIDER_STATES.AIRBORNE) {
    return vy < 0 ? SPRITE_STATES.JUMP : SPRITE_STATES.AIR;
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
