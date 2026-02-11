import * as THREE from 'three';
import { RENDERING } from '../config.js';

let riderSprite = null;
let spriteTextures = {};

/**
 * Generate all rider sprites programmatically using Canvas 2D.
 */
export function createRiderSprites() {
  spriteTextures = {
    idle: generateSpriteTexture(drawRiderIdle),
    crouch: generateSpriteTexture(drawRiderCrouch),
    jump: generateSpriteTexture(drawRiderJump),
    air: generateSpriteTexture(drawRiderAir),
    dead: generateSpriteTexture(drawRiderDead),
  };

  const material = new THREE.SpriteMaterial({
    map: spriteTextures.idle,
    transparent: true,
  });

  riderSprite = new THREE.Sprite(material);
  riderSprite.scale.set(RENDERING.RIDER_SCALE, RENDERING.RIDER_SCALE, 1);

  return riderSprite;
}

export function updateRiderSprite(spriteState, x, y, rotation) {
  if (!riderSprite) return;

  const tex = spriteTextures[spriteState];
  if (tex && riderSprite.material.map !== tex) {
    riderSprite.material.map = tex;
    riderSprite.material.needsUpdate = true;
  }

  // Offset the sprite center perpendicular to the slope so the
  // briefcase (bottom of sprite) sits exactly on the terrain line.
  const offset = RENDERING.RIDER_SCALE * 0.3;
  const px = x - offset * Math.sin(rotation);
  const py = y + offset * Math.cos(rotation);
  riderSprite.position.set(px, py, 1);
  riderSprite.material.rotation = -rotation;
}

export function getRiderSprite() {
  return riderSprite;
}

function generateSpriteTexture(drawFunction) {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, size, size);
  drawFunction(ctx, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// --- Procedural rider drawing functions ---
// Style: Black pencil sketch, guy in suit on briefcase

function drawRiderIdle(ctx, size) {
  const cx = size / 2;
  const cy = size / 2;
  ctx.strokeStyle = '#2c2c2c';
  ctx.fillStyle = '#2c2c2c';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Briefcase (sled)
  ctx.beginPath();
  ctx.roundRect(cx - 25, cy + 15, 50, 18, 4);
  ctx.stroke();
  // Handle
  ctx.beginPath();
  ctx.arc(cx, cy + 15, 8, Math.PI, 0);
  ctx.stroke();

  // Body (sitting)
  ctx.beginPath();
  ctx.moveTo(cx, cy + 15);
  ctx.lineTo(cx, cy - 10);
  ctx.stroke();

  // Head
  ctx.beginPath();
  ctx.arc(cx, cy - 20, 10, 0, Math.PI * 2);
  ctx.stroke();

  // Arms (relaxed, at sides)
  ctx.beginPath();
  ctx.moveTo(cx, cy - 5);
  ctx.lineTo(cx - 18, cy + 5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy - 5);
  ctx.lineTo(cx + 18, cy + 5);
  ctx.stroke();

  // Legs (sitting, bent)
  ctx.beginPath();
  ctx.moveTo(cx - 5, cy + 15);
  ctx.lineTo(cx - 15, cy + 5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 5, cy + 15);
  ctx.lineTo(cx + 15, cy + 5);
  ctx.stroke();

  // Tie
  ctx.beginPath();
  ctx.moveTo(cx, cy - 10);
  ctx.lineTo(cx - 3, cy);
  ctx.lineTo(cx, cy + 2);
  ctx.lineTo(cx + 3, cy);
  ctx.closePath();
  ctx.fill();

  // Hat/hair
  ctx.beginPath();
  ctx.moveTo(cx - 12, cy - 22);
  ctx.lineTo(cx + 12, cy - 22);
  ctx.stroke();
}

function drawRiderCrouch(ctx, size) {
  const cx = size / 2;
  const cy = size / 2;
  ctx.strokeStyle = '#2c2c2c';
  ctx.fillStyle = '#2c2c2c';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Briefcase
  ctx.beginPath();
  ctx.roundRect(cx - 25, cy + 15, 50, 18, 4);
  ctx.stroke();

  // Body (crouched lower)
  ctx.beginPath();
  ctx.moveTo(cx, cy + 15);
  ctx.lineTo(cx - 3, cy + 2);
  ctx.stroke();

  // Head (lower, tucked)
  ctx.beginPath();
  ctx.arc(cx - 3, cy - 8, 10, 0, Math.PI * 2);
  ctx.stroke();

  // Arms (gripping briefcase)
  ctx.beginPath();
  ctx.moveTo(cx - 3, cy + 5);
  ctx.lineTo(cx - 20, cy + 15);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 3, cy + 5);
  ctx.lineTo(cx + 15, cy + 15);
  ctx.stroke();

  // Legs (tucked tight)
  ctx.beginPath();
  ctx.moveTo(cx - 5, cy + 15);
  ctx.lineTo(cx - 10, cy + 8);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 5, cy + 15);
  ctx.lineTo(cx + 10, cy + 8);
  ctx.stroke();

  // Tie (flapping back)
  ctx.beginPath();
  ctx.moveTo(cx - 3, cy + 2);
  ctx.lineTo(cx + 10, cy - 2);
  ctx.stroke();
}

function drawRiderJump(ctx, size) {
  const cx = size / 2;
  const cy = size / 2;
  ctx.strokeStyle = '#2c2c2c';
  ctx.fillStyle = '#2c2c2c';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Briefcase (below, held)
  ctx.beginPath();
  ctx.roundRect(cx - 20, cy + 10, 40, 14, 3);
  ctx.stroke();

  // Body (upright, stretched)
  ctx.beginPath();
  ctx.moveTo(cx, cy + 10);
  ctx.lineTo(cx, cy - 15);
  ctx.stroke();

  // Head
  ctx.beginPath();
  ctx.arc(cx, cy - 25, 10, 0, Math.PI * 2);
  ctx.stroke();

  // Arms (up in V)
  ctx.beginPath();
  ctx.moveTo(cx, cy - 12);
  ctx.lineTo(cx - 20, cy - 30);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy - 12);
  ctx.lineTo(cx + 20, cy - 30);
  ctx.stroke();

  // Legs (together, straight down)
  ctx.beginPath();
  ctx.moveTo(cx - 5, cy + 10);
  ctx.lineTo(cx - 5, cy + 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 5, cy + 10);
  ctx.lineTo(cx + 5, cy + 0);
  ctx.stroke();

  // Tie (flying up)
  ctx.beginPath();
  ctx.moveTo(cx, cy - 15);
  ctx.lineTo(cx + 5, cy - 8);
  ctx.stroke();
}

function drawRiderAir(ctx, size) {
  const cx = size / 2;
  const cy = size / 2;
  ctx.strokeStyle = '#2c2c2c';
  ctx.fillStyle = '#2c2c2c';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Briefcase (detached slightly)
  ctx.beginPath();
  ctx.roundRect(cx - 18, cy + 12, 36, 12, 3);
  ctx.stroke();

  // Body (leaning back, panicked)
  ctx.beginPath();
  ctx.moveTo(cx + 5, cy + 12);
  ctx.lineTo(cx - 5, cy - 10);
  ctx.stroke();

  // Head
  ctx.beginPath();
  ctx.arc(cx - 5, cy - 20, 10, 0, Math.PI * 2);
  ctx.stroke();

  // Mouth (open, scared)
  ctx.beginPath();
  ctx.arc(cx - 3, cy - 17, 3, 0, Math.PI);
  ctx.stroke();

  // Arms (flailing)
  ctx.beginPath();
  ctx.moveTo(cx - 5, cy - 5);
  ctx.lineTo(cx - 28, cy - 20);
  ctx.lineTo(cx - 22, cy - 28);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 5, cy - 5);
  ctx.lineTo(cx + 22, cy - 25);
  ctx.lineTo(cx + 28, cy - 18);
  ctx.stroke();

  // Legs (spread)
  ctx.beginPath();
  ctx.moveTo(cx, cy + 12);
  ctx.lineTo(cx - 18, cy + 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 8, cy + 12);
  ctx.lineTo(cx + 20, cy + 2);
  ctx.stroke();

  // Tie (flying wildly)
  ctx.beginPath();
  ctx.moveTo(cx - 5, cy - 10);
  ctx.lineTo(cx + 12, cy - 15);
  ctx.lineTo(cx + 15, cy - 10);
  ctx.stroke();
}

function drawRiderDead(ctx, size) {
  const cx = size / 2;
  const cy = size / 2;
  ctx.strokeStyle = '#2c2c2c';
  ctx.fillStyle = '#2c2c2c';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Briefcase (tumbling away)
  ctx.save();
  ctx.translate(cx + 20, cy + 20);
  ctx.rotate(0.5);
  ctx.beginPath();
  ctx.roundRect(-15, -6, 30, 12, 3);
  ctx.stroke();
  ctx.restore();

  // Body (ragdoll, twisted)
  ctx.beginPath();
  ctx.moveTo(cx - 10, cy + 10);
  ctx.quadraticCurveTo(cx, cy, cx + 5, cy - 15);
  ctx.stroke();

  // Head (X eyes)
  ctx.beginPath();
  ctx.arc(cx + 5, cy - 25, 10, 0, Math.PI * 2);
  ctx.stroke();
  // X eyes
  ctx.beginPath();
  ctx.moveTo(cx + 1, cy - 29); ctx.lineTo(cx + 5, cy - 25);
  ctx.moveTo(cx + 5, cy - 29); ctx.lineTo(cx + 1, cy - 25);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 7, cy - 29); ctx.lineTo(cx + 11, cy - 25);
  ctx.moveTo(cx + 11, cy - 29); ctx.lineTo(cx + 7, cy - 25);
  ctx.stroke();

  // Arms (limp, ragdoll)
  ctx.beginPath();
  ctx.moveTo(cx, cy - 8);
  ctx.lineTo(cx - 25, cy - 20);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 2, cy - 5);
  ctx.lineTo(cx + 25, cy + 8);
  ctx.stroke();

  // Legs (ragdoll)
  ctx.beginPath();
  ctx.moveTo(cx - 10, cy + 10);
  ctx.lineTo(cx - 25, cy + 20);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 8, cy + 8);
  ctx.lineTo(cx + 5, cy + 25);
  ctx.stroke();

  // Stars around head (dazed)
  drawStar(ctx, cx - 10, cy - 35, 4);
  drawStar(ctx, cx + 18, cy - 32, 3);
  drawStar(ctx, cx + 15, cy - 40, 3.5);
}

function drawStar(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const px = x + r * Math.cos(angle);
    const py = y + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
}
