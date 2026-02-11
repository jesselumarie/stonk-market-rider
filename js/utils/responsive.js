/**
 * Mobile detection, capability degradation, and resize handling.
 */

const capabilities = {
  isMobile: false,
  isLowPower: false,
  enableParallax: true,
  enablePostProcessing: true,
  enablePencilShader: true,
  maxSplinePoints: 2000,
};

export function detectCapabilities() {
  capabilities.isMobile =
    window.innerWidth < 768 ||
    ('ontouchstart' in window) ||
    (navigator.maxTouchPoints > 0);

  capabilities.isLowPower =
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) ||
    (navigator.deviceMemory && navigator.deviceMemory < 4);

  if (capabilities.isMobile) {
    capabilities.enableParallax = false;
    capabilities.enablePostProcessing = false;
    capabilities.enablePencilShader = false;
    capabilities.maxSplinePoints = 500;
  }

  if (capabilities.isLowPower) {
    capabilities.enablePostProcessing = false;
    capabilities.maxSplinePoints = Math.min(capabilities.maxSplinePoints, 800);
  }

  return capabilities;
}

export function getCapabilities() {
  return capabilities;
}

export function isMobile() {
  return capabilities.isMobile;
}

export function setupResizeHandler(renderer, camera) {
  function onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    detectCapabilities();
  }

  window.addEventListener('resize', onResize);
  return onResize;
}
