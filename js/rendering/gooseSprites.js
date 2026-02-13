/**
 * Procedural goose drawing functions — pencil-sketch style goose on a briefcase.
 * Matches the existing rider sprite conventions (128x128 canvas, stroke-based).
 */

// --- Goose Idle: sitting on briefcase, long neck up, beak forward ---
export function drawGooseIdle(ctx, size) {
  const cx = size / 2;
  const cy = size / 2;
  setupStyle(ctx);

  // Briefcase (sled)
  drawBriefcase(ctx, cx - 25, cy + 15, 50, 18);

  // Body (oval, sitting on briefcase)
  ctx.beginPath();
  ctx.ellipse(cx, cy + 6, 18, 12, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Neck (long, slightly curved upward)
  ctx.beginPath();
  ctx.moveTo(cx + 8, cy - 2);
  ctx.quadraticCurveTo(cx + 12, cy - 18, cx + 6, cy - 30);
  ctx.stroke();

  // Head (small circle)
  ctx.beginPath();
  ctx.arc(cx + 6, cy - 36, 7, 0, Math.PI * 2);
  ctx.stroke();

  // Eye
  ctx.beginPath();
  ctx.arc(cx + 9, cy - 38, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Beak (wedge pointing right)
  ctx.fillStyle = '#e8860c';
  ctx.beginPath();
  ctx.moveTo(cx + 13, cy - 38);
  ctx.lineTo(cx + 22, cy - 36);
  ctx.lineTo(cx + 13, cy - 34);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#2c2c2c';

  // Tail feathers (small flick at back)
  ctx.beginPath();
  ctx.moveTo(cx - 16, cy + 2);
  ctx.lineTo(cx - 26, cy - 4);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 16, cy + 5);
  ctx.lineTo(cx - 24, cy + 2);
  ctx.stroke();

  // Feet (tucked, visible below briefcase)
  ctx.fillStyle = '#e8860c';
  drawFoot(ctx, cx - 8, cy + 34);
  drawFoot(ctx, cx + 6, cy + 34);
  ctx.fillStyle = '#2c2c2c';
}

// --- Goose Crouch: tucked low on briefcase, neck pulled back ---
export function drawGooseCrouch(ctx, size) {
  const cx = size / 2;
  const cy = size / 2;
  setupStyle(ctx);

  // Briefcase
  drawBriefcase(ctx, cx - 25, cy + 15, 50, 18);

  // Body (flatter, crouched)
  ctx.beginPath();
  ctx.ellipse(cx, cy + 8, 20, 10, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Neck (short, tucked)
  ctx.beginPath();
  ctx.moveTo(cx + 10, cy + 2);
  ctx.quadraticCurveTo(cx + 14, cy - 6, cx + 10, cy - 12);
  ctx.stroke();

  // Head (tucked lower)
  ctx.beginPath();
  ctx.arc(cx + 10, cy - 18, 7, 0, Math.PI * 2);
  ctx.stroke();

  // Eye
  ctx.beginPath();
  ctx.arc(cx + 13, cy - 20, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Beak
  ctx.fillStyle = '#e8860c';
  ctx.beginPath();
  ctx.moveTo(cx + 17, cy - 20);
  ctx.lineTo(cx + 25, cy - 18);
  ctx.lineTo(cx + 17, cy - 16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#2c2c2c';

  // Tail (streaming back in wind)
  ctx.beginPath();
  ctx.moveTo(cx - 18, cy + 4);
  ctx.lineTo(cx - 30, cy - 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 18, cy + 7);
  ctx.lineTo(cx - 28, cy + 4);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 17, cy + 10);
  ctx.lineTo(cx - 26, cy + 8);
  ctx.stroke();
}

// --- Goose Jump: neck stretched up, wings spread, launching off briefcase ---
export function drawGooseJump(ctx, size) {
  const cx = size / 2;
  const cy = size / 2;
  setupStyle(ctx);

  // Briefcase (below)
  drawBriefcase(ctx, cx - 20, cy + 12, 40, 14);

  // Body
  ctx.beginPath();
  ctx.ellipse(cx, cy + 2, 16, 12, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Neck (stretched tall)
  ctx.beginPath();
  ctx.moveTo(cx + 4, cy - 8);
  ctx.quadraticCurveTo(cx + 6, cy - 22, cx + 2, cy - 34);
  ctx.stroke();

  // Head
  ctx.beginPath();
  ctx.arc(cx + 2, cy - 40, 7, 0, Math.PI * 2);
  ctx.stroke();

  // Eye (determined)
  ctx.beginPath();
  ctx.arc(cx + 5, cy - 42, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Beak
  ctx.fillStyle = '#e8860c';
  ctx.beginPath();
  ctx.moveTo(cx + 9, cy - 42);
  ctx.lineTo(cx + 18, cy - 40);
  ctx.lineTo(cx + 9, cy - 38);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#2c2c2c';

  // Wings (spread up in V for jump)
  ctx.beginPath();
  ctx.moveTo(cx - 10, cy + 0);
  ctx.lineTo(cx - 28, cy - 18);
  ctx.lineTo(cx - 22, cy - 22);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 10, cy + 0);
  ctx.lineTo(cx + 28, cy - 18);
  ctx.lineTo(cx + 22, cy - 22);
  ctx.stroke();

  // Feet (together, straight down)
  ctx.fillStyle = '#e8860c';
  drawFoot(ctx, cx - 4, cy + 28);
  drawFoot(ctx, cx + 4, cy + 28);
  ctx.fillStyle = '#2c2c2c';
}

// --- Goose Air: flapping wildly, panicked honk, beak open ---
export function drawGooseAir(ctx, size) {
  const cx = size / 2;
  const cy = size / 2;
  setupStyle(ctx);

  // Briefcase (detached, tumbling slightly)
  ctx.save();
  ctx.translate(cx - 2, cy + 14);
  ctx.rotate(0.15);
  ctx.beginPath();
  ctx.roundRect(-16, -6, 32, 12, 3);
  ctx.stroke();
  ctx.restore();

  // Body (leaning back)
  ctx.beginPath();
  ctx.ellipse(cx - 2, cy + 2, 16, 12, -0.2, 0, Math.PI * 2);
  ctx.stroke();

  // Neck (bent, panicked)
  ctx.beginPath();
  ctx.moveTo(cx + 4, cy - 6);
  ctx.quadraticCurveTo(cx + 14, cy - 16, cx + 8, cy - 28);
  ctx.stroke();

  // Head
  ctx.beginPath();
  ctx.arc(cx + 8, cy - 34, 7, 0, Math.PI * 2);
  ctx.stroke();

  // Eye (wide, panicked)
  ctx.beginPath();
  ctx.arc(cx + 11, cy - 36, 2.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + 11, cy - 36, 1, 0, Math.PI * 2);
  ctx.fill();

  // Beak (open — honking!)
  ctx.fillStyle = '#e8860c';
  // Upper beak
  ctx.beginPath();
  ctx.moveTo(cx + 15, cy - 36);
  ctx.lineTo(cx + 25, cy - 37);
  ctx.lineTo(cx + 15, cy - 34);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Lower beak (open)
  ctx.beginPath();
  ctx.moveTo(cx + 15, cy - 33);
  ctx.lineTo(cx + 23, cy - 31);
  ctx.lineTo(cx + 15, cy - 31);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#2c2c2c';

  // "HONK" text
  ctx.font = 'bold 8px sans-serif';
  ctx.fillText('HONK', cx + 16, cy - 42);

  // Wings (flapping wildly — asymmetric)
  ctx.beginPath();
  ctx.moveTo(cx - 12, cy - 2);
  ctx.lineTo(cx - 32, cy - 16);
  ctx.lineTo(cx - 28, cy - 22);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 8, cy + 2);
  ctx.lineTo(cx + 30, cy - 8);
  ctx.lineTo(cx + 26, cy - 14);
  ctx.stroke();

  // Feet (spread, dangling)
  ctx.fillStyle = '#e8860c';
  drawFoot(ctx, cx - 12, cy + 26);
  drawFoot(ctx, cx + 8, cy + 28);
  ctx.fillStyle = '#2c2c2c';
}

// --- Goose Dead: ragdoll goose, X eyes, feathers flying ---
export function drawGooseDead(ctx, size) {
  const cx = size / 2;
  const cy = size / 2;
  setupStyle(ctx);

  // Briefcase (tumbling away)
  ctx.save();
  ctx.translate(cx + 22, cy + 20);
  ctx.rotate(0.5);
  ctx.beginPath();
  ctx.roundRect(-15, -6, 30, 12, 3);
  ctx.stroke();
  ctx.restore();

  // Body (twisted, ragdoll)
  ctx.beginPath();
  ctx.ellipse(cx - 5, cy + 5, 16, 11, 0.4, 0, Math.PI * 2);
  ctx.stroke();

  // Neck (limp, flopping)
  ctx.beginPath();
  ctx.moveTo(cx + 4, cy - 2);
  ctx.quadraticCurveTo(cx + 18, cy - 6, cx + 14, cy - 20);
  ctx.stroke();

  // Head
  ctx.beginPath();
  ctx.arc(cx + 14, cy - 26, 7, 0, Math.PI * 2);
  ctx.stroke();

  // X eyes
  ctx.beginPath();
  ctx.moveTo(cx + 11, cy - 30); ctx.lineTo(cx + 14, cy - 27);
  ctx.moveTo(cx + 14, cy - 30); ctx.lineTo(cx + 11, cy - 27);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 16, cy - 30); ctx.lineTo(cx + 19, cy - 27);
  ctx.moveTo(cx + 19, cy - 30); ctx.lineTo(cx + 16, cy - 27);
  ctx.stroke();

  // Beak (drooping)
  ctx.fillStyle = '#e8860c';
  ctx.beginPath();
  ctx.moveTo(cx + 21, cy - 27);
  ctx.lineTo(cx + 28, cy - 24);
  ctx.lineTo(cx + 21, cy - 24);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#2c2c2c';

  // Wings (limp)
  ctx.beginPath();
  ctx.moveTo(cx - 12, cy + 0);
  ctx.lineTo(cx - 28, cy + 10);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 2, cy + 2);
  ctx.lineTo(cx + 20, cy + 15);
  ctx.stroke();

  // Feet (limp, splayed)
  ctx.fillStyle = '#e8860c';
  drawFoot(ctx, cx - 18, cy + 22);
  drawFoot(ctx, cx + 2, cy + 26);
  ctx.fillStyle = '#2c2c2c';

  // Feathers floating away
  drawFeather(ctx, cx - 20, cy - 20, 0.3);
  drawFeather(ctx, cx + 25, cy - 35, -0.4);
  drawFeather(ctx, cx - 8, cy - 34, 0.6);

  // Stars (dazed)
  drawStar(ctx, cx + 5, cy - 38, 4);
  drawStar(ctx, cx + 24, cy - 34, 3);
}

// --- Helpers ---

function setupStyle(ctx) {
  ctx.strokeStyle = '#2c2c2c';
  ctx.fillStyle = '#2c2c2c';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

function drawBriefcase(ctx, x, y, w, h) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 4);
  ctx.stroke();
  // Handle
  const cx = x + w / 2;
  ctx.beginPath();
  ctx.arc(cx, y, 8, Math.PI, 0);
  ctx.stroke();
}

function drawFoot(ctx, x, y) {
  // Webbed foot — three toes splayed
  const prevStroke = ctx.strokeStyle;
  ctx.strokeStyle = '#c06a00';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - 5, y + 6);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + 7);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 5, y + 6);
  ctx.stroke();
  // Webbing
  ctx.beginPath();
  ctx.moveTo(x - 5, y + 6);
  ctx.lineTo(x, y + 7);
  ctx.lineTo(x + 5, y + 6);
  ctx.stroke();
  ctx.strokeStyle = prevStroke;
}

function drawFeather(ctx, x, y, rotation) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.quadraticCurveTo(4, 0, 0, 6);
  ctx.quadraticCurveTo(-2, 0, 0, -6);
  ctx.stroke();
  // Spine
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(0, 6);
  ctx.stroke();
  ctx.restore();
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
