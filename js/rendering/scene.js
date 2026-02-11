import * as THREE from 'three';
import { RENDERING } from '../config.js';
import { getCapabilities } from '../utils/responsive.js';

let renderer, scene, camera;

export function initScene(canvas) {
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0xf5f0e8); // paper color

  scene = new THREE.Scene();

  // Perspective camera for 2.5D parallax
  camera = new THREE.PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    0.1,
    20000
  );
  camera.position.set(0, 0, 1500);

  // Ambient light
  const ambient = new THREE.AmbientLight(0xffffff, 1);
  scene.add(ambient);

  // Paper background
  createPaperBackground();

  // Notebook lines (parallax layer)
  const caps = getCapabilities();
  if (caps.enableParallax) {
    createNotebookLines();
  }

  return { renderer, scene, camera };
}

function createPaperBackground() {
  const bgGeometry = new THREE.PlaneGeometry(30000, 20000);
  const bgMaterial = new THREE.MeshBasicMaterial({ color: 0xf5f0e8 });
  const bg = new THREE.Mesh(bgGeometry, bgMaterial);
  bg.position.z = -500;
  scene.add(bg);
}

function createNotebookLines() {
  const lineGroup = new THREE.Group();
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0xc8d8e8,
    transparent: true,
    opacity: 0.3,
  });

  // Horizontal ruled lines
  for (let y = -5000; y <= 5000; y += 80) {
    const vertices = new Float32Array([-15000, y, -200, 15000, y, -200]);
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    lineGroup.add(new THREE.Line(geom, lineMaterial));
  }

  // Red margin line
  const marginMaterial = new THREE.LineBasicMaterial({
    color: 0xe8a8a8,
    transparent: true,
    opacity: 0.4,
  });
  const marginVerts = new Float32Array([-14000, -5000, -200, -14000, 5000, -200]);
  const marginGeom = new THREE.BufferGeometry();
  marginGeom.setAttribute('position', new THREE.BufferAttribute(marginVerts, 3));
  lineGroup.add(new THREE.Line(marginGeom, marginMaterial));

  scene.add(lineGroup);
}

export function addToScene(object) {
  scene.add(object);
}

export function removeFromScene(object) {
  scene.remove(object);
}

export function clearGameObjects(objects) {
  for (const obj of objects) {
    scene.remove(obj);
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach(m => m.dispose());
      } else {
        obj.material.dispose();
      }
    }
  }
}

export function render() {
  renderer.render(scene, camera);
}

export function getCamera() {
  return camera;
}

export function getRenderer() {
  return renderer;
}

export function getScene() {
  return scene;
}

export function resizeRenderer() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
