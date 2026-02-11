import * as THREE from 'three';

/**
 * Create pencil-style line material for the terrain.
 */
export function createPencilLineMaterial() {
  return new THREE.LineBasicMaterial({
    color: 0x2c2c2c,
    linewidth: 2,
  });
}

/**
 * Create a paper grain overlay (full-screen quad).
 */
export function createPaperOverlay(scene) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Generate paper grain noise
  const imageData = ctx.createImageData(512, 512);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const noise = Math.random() * 20;
    imageData.data[i] = 245 - noise;     // R
    imageData.data[i + 1] = 240 - noise; // G
    imageData.data[i + 2] = 232 - noise; // B
    imageData.data[i + 3] = 30;          // A (subtle)
  }
  ctx.putImageData(imageData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(10, 10);

  const overlayGeom = new THREE.PlaneGeometry(30000, 20000);
  const overlayMat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0.15,
    depthWrite: false,
  });
  const overlay = new THREE.Mesh(overlayGeom, overlayMat);
  overlay.position.z = 5;
  scene.add(overlay);

  return overlay;
}

/**
 * Create doodle decorations for notebook margins.
 */
export function createMarginDoodles(scene) {
  const group = new THREE.Group();

  // Small dollar signs, arrows, squiggles scattered in the margins
  const doodleMaterial = new THREE.LineBasicMaterial({
    color: 0xaaaaaa,
    transparent: true,
    opacity: 0.3,
  });

  // Create a few simple doodle shapes
  for (let i = 0; i < 15; i++) {
    const x = -14500 + Math.random() * 800;
    const y = -3000 + Math.random() * 6000;
    const doodle = createDollarSign(x, y, doodleMaterial);
    group.add(doodle);
  }

  // Some arrows on the right margin
  for (let i = 0; i < 8; i++) {
    const x = 11000 + Math.random() * 500;
    const y = -2000 + Math.random() * 4000;
    const arrow = createArrowDoodle(x, y, doodleMaterial);
    group.add(arrow);
  }

  group.position.z = 2;
  scene.add(group);
  return group;
}

function createDollarSign(x, y, material) {
  const points = [];
  // S curve
  for (let t = 0; t <= 1; t += 0.1) {
    points.push(new THREE.Vector3(
      x + Math.sin(t * Math.PI * 2) * 15,
      y + t * 40 - 20,
      0
    ));
  }
  const geom = new THREE.BufferGeometry().setFromPoints(points);
  return new THREE.Line(geom, material);
}

function createArrowDoodle(x, y, material) {
  const group = new THREE.Group();

  // Arrow shaft
  const shaftVerts = new Float32Array([x, y, 0, x, y + 30, 0]);
  const shaftGeom = new THREE.BufferGeometry();
  shaftGeom.setAttribute('position', new THREE.BufferAttribute(shaftVerts, 3));
  group.add(new THREE.Line(shaftGeom, material));

  // Arrowhead
  const headVerts = new Float32Array([
    x - 8, y + 22, 0,
    x, y + 30, 0,
    x + 8, y + 22, 0,
  ]);
  const headGeom = new THREE.BufferGeometry();
  headGeom.setAttribute('position', new THREE.BufferAttribute(headVerts, 3));
  group.add(new THREE.Line(headGeom, material));

  return group;
}
