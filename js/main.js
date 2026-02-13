import { STATES, RIDER_STATES } from './config.js';
import { detectCapabilities, getCapabilities } from './utils/responsive.js';
import { initScene, addToScene, removeFromScene, clearGameObjects, render, getCamera, getScene, resizeRenderer } from './rendering/scene.js';
import { createRiderSprites, updateRiderSprite, getRiderSprite } from './rendering/riderModel.js';
import { createPaperOverlay, createMarginDoodles } from './rendering/effects.js';
import { initDeathScreen, showDeathScreen, hideDeathScreen } from './rendering/deathScreen.js';
import { buildTerrain, getTerrainAt, getPriceAtX, computeStats } from './game/terrain.js';
import { initPhysics, updatePhysics, getPhysicsState, getDifficultyState } from './game/physics.js';
import { initRider, handleInput, getJumpInput, getLeanInput, getAccelInput, AIR_ROTATE_SPEED, getSpriteState, getRiderRotation } from './game/rider.js';
import { initCamera, updateCamera } from './game/camera.js';
import {
  initAudio, resumeAudio, startPencilLoop, stopPencilLoop,
  updatePencilVolume, startWindLoop, stopWindLoop, updateWindVolume,
  playJump, playLandClean, playDeathSting, playWilhelmScream, stopAllSounds,
} from './audio/soundManager.js';
import { fetchStockData, generateSampleData } from './data/stockApi.js';
import { initStockPicker, showError, clearError, setTickerFromURL } from './ui/stockPicker.js';
import { initHUD, showHUD, hideHUD, updateHUD } from './ui/hud.js';
import { decodeShareUrl, copyShareUrl } from './ui/shareUrl.js';

// --- App State ---
let appState = STATES.MENU;
let currentTerrain = null;
let gameObjects = [];
let animFrameId = null;
let lastTime = 0;
let paused = false;
let riderRotation = 0;

// Current ride info
let currentTicker = '';
let currentCompany = '';
let currentTimeframe = '1Y';
let previousRiderState = RIDER_STATES.ON_TERRAIN;

// --- DOM Elements ---
const canvas = document.getElementById('game-canvas');
const menuScreen = document.getElementById('menu-screen');
const loadingScreen = document.getElementById('loading-screen');
const loadingFill = document.getElementById('loading-fill');
const pauseOverlay = document.getElementById('pause-overlay');

// --- Init ---
async function init() {
  detectCapabilities();
  initScene(canvas);
  initDeathScreen();
  initHUD();

  const caps = getCapabilities();
  if (caps.enableParallax) {
    createPaperOverlay(getScene());
    createMarginDoodles(getScene());
  }

  // Input handlers
  setupInputHandlers();

  // Resize
  window.addEventListener('resize', () => resizeRenderer());

  // Visibility change (pause on tab switch)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && appState === STATES.RIDING) {
      pauseGame();
    }
  });

  // Focus handling
  window.addEventListener('blur', () => {
    if (appState === STATES.RIDING) pauseGame();
  });
  window.addEventListener('focus', () => {
    if (paused && appState === STATES.RIDING) unpauseGame();
  });

  // Death screen buttons
  document.getElementById('ride-again-btn').addEventListener('click', () => {
    startRide(currentTicker, currentCompany, currentTimeframe);
  });
  document.getElementById('new-ride-btn').addEventListener('click', () => {
    transitionToMenu();
  });
  document.getElementById('share-btn').addEventListener('click', () => {
    copyShareUrl(currentTicker, currentTimeframe);
  });

  // Initialize stock picker
  await initStockPicker((symbol, name, timeframe) => {
    startRide(symbol, name, timeframe);
  });

  // Check for shared URL
  const shared = decodeShareUrl();
  if (shared) {
    setTickerFromURL(shared.ticker, shared.timeframe);
    if (shared.autoplay) {
      startRide(shared.ticker, '', shared.timeframe);
    }
  }

  // Show menu
  setState(STATES.MENU);
}

function setupInputHandlers() {
  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.key === ' ') {
      e.preventDefault();
      if (appState === STATES.RIDING) {
        initAudioOnInteraction();
        handleInput('jump_down');
      } else if (appState === STATES.DEAD) {
        startRide(currentTicker, currentCompany, currentTimeframe);
      }
    }
    if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A' || e.key === 'h' || e.key === 'H') {
      if (appState === STATES.RIDING) {
        e.preventDefault();
        handleInput('lean_left_down');
      }
    }
    if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D' || e.key === 'l' || e.key === 'L') {
      if (appState === STATES.RIDING) {
        e.preventDefault();
        handleInput('lean_right_down');
      }
    }
    if (e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      if (appState === STATES.RIDING) {
        e.preventDefault();
        handleInput('accel_up_down');
      }
    }
    if (e.code === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      if (appState === STATES.RIDING) {
        e.preventDefault();
        handleInput('accel_down_down');
      }
    }
  });

  document.addEventListener('keyup', (e) => {
    if (e.code === 'Space' || e.key === ' ') {
      handleInput('jump_up');
    }
    if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A' || e.key === 'h' || e.key === 'H') {
      handleInput('lean_left_up');
    }
    if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D' || e.key === 'l' || e.key === 'L') {
      handleInput('lean_right_up');
    }
    if (e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      handleInput('accel_up_up');
    }
    if (e.code === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      handleInput('accel_down_up');
    }
  });

  // Touch / click on canvas (for jump)
  canvas.addEventListener('pointerdown', (e) => {
    if (appState === STATES.RIDING) {
      e.preventDefault();
      initAudioOnInteraction();
      handleInput('jump_down');
    }
  });

  canvas.addEventListener('pointerup', () => {
    handleInput('jump_up');
  });

  // Init audio on any interaction
  document.addEventListener('click', initAudioOnInteraction, { once: false });
  document.addEventListener('touchstart', initAudioOnInteraction, { once: false });
}

let audioInitialized = false;
function initAudioOnInteraction() {
  if (!audioInitialized) {
    initAudio();
    resumeAudio();
    audioInitialized = true;
  }
}

// --- State Transitions ---
function setState(newState) {
  appState = newState;

  menuScreen.style.display = newState === STATES.MENU ? 'flex' : 'none';
  loadingScreen.classList.toggle('visible', newState === STATES.LOADING);
  hideDeathScreen();

  if (newState === STATES.MENU) {
    hideHUD();
  }
}

function transitionToMenu() {
  cleanupRide();
  setState(STATES.MENU);
}

async function startRide(ticker, companyName, timeframe) {
  initAudioOnInteraction();
  currentTicker = ticker;
  currentCompany = companyName;
  currentTimeframe = timeframe;

  setState(STATES.LOADING);
  clearError();
  updateLoadingProgress(10);

  let priceData;
  try {
    priceData = await fetchStockData(ticker, timeframe);
    updateLoadingProgress(50);
  } catch (err) {
    // Fall back to sample data on API failure
    console.warn('API failed, using sample data:', err.message);
    showError(`Couldn't fetch ${ticker} data. Using sample data for demo.`);
    priceData = generateSampleData();
    updateLoadingProgress(50);
  }

  if (priceData.length < 5) {
    showError('Not enough data for this ticker/timeframe. Try a different one.');
    setState(STATES.MENU);
    return;
  }

  // Build terrain
  cleanupRide();
  currentTerrain = buildTerrain(priceData);
  updateLoadingProgress(70);

  // Add terrain visuals to scene
  addToScene(currentTerrain.lineObject);
  addToScene(currentTerrain.dotObjects);
  addToScene(currentTerrain.gridObject);
  addToScene(currentTerrain.labelObjects);
  gameObjects.push(
    currentTerrain.lineObject,
    currentTerrain.dotObjects,
    currentTerrain.gridObject,
    currentTerrain.labelObjects
  );

  // Create rider
  const riderSprite = createRiderSprites();
  addToScene(riderSprite);
  gameObjects.push(riderSprite);
  updateLoadingProgress(85);

  // Init physics
  initPhysics(currentTerrain.collisionData, 0);
  initRider();
  initCamera();
  riderRotation = 0;
  previousRiderState = RIDER_STATES.ON_TERRAIN;

  updateLoadingProgress(100);

  // Start gameplay
  setTimeout(() => {
    setState(STATES.RIDING);
    showHUD(ticker, companyName);

    // Start audio loops
    startPencilLoop();
    startWindLoop();

    // Start game loop
    lastTime = performance.now();
    paused = false;
    gameLoop(performance.now());
  }, 300);
}

function cleanupRide() {
  // Stop animation
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }

  // Stop audio
  stopAllSounds();

  // Remove game objects from scene
  if (gameObjects.length > 0) {
    for (const obj of gameObjects) {
      removeFromScene(obj);
    }
    gameObjects = [];
  }

  currentTerrain = null;
}

function updateLoadingProgress(percent) {
  if (loadingFill) {
    loadingFill.style.width = `${percent}%`;
  }
}

// --- Game Loop ---
function gameLoop(timestamp) {
  if (appState !== STATES.RIDING && appState !== STATES.DEAD) return;
  if (paused) {
    animFrameId = requestAnimationFrame(gameLoop);
    return;
  }

  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;

  if (appState === STATES.RIDING) {
    // Get jump input
    const jump = getJumpInput(performance.now());
    if (jump) {
      playJump();
    }

    // Get lean input for air control
    const lean = getLeanInput();
    const accel = getAccelInput();

    // Update physics
    const phys = updatePhysics(dt, { jump, lean, accel, airRotateSpeed: AIR_ROTATE_SPEED });

    // Detect state transitions for audio
    if (previousRiderState !== phys.riderState) {
      onRiderStateChange(previousRiderState, phys.riderState);
      previousRiderState = phys.riderState;
    }

    // Update audio volumes
    if (phys.riderState === RIDER_STATES.ON_TERRAIN) {
      updatePencilVolume(Math.abs(phys.vx));
      updateWindVolume(0);
    } else if (phys.riderState === RIDER_STATES.AIRBORNE) {
      updatePencilVolume(0);
      updateWindVolume(phys.vy);
    }

    // Update rider sprite
    const spriteState = getSpriteState(phys);
    riderRotation = getRiderRotation(phys, dt, riderRotation);
    updateRiderSprite(spriteState, phys.x, phys.y, riderRotation);

    // Update camera
    updateCamera(getCamera(), phys.x, phys.y, currentTerrain.controlPoints, dt, false);

    // Update HUD
    const priceInfo = getPriceAtX(currentTerrain.controlPoints, phys.x);
    updateHUD(priceInfo, getDifficultyState());

    // Check for death
    if (phys.riderState === RIDER_STATES.DEAD) {
      onDeath(phys);
    }
  } else if (appState === STATES.DEAD) {
    // Death animation: continue rendering but no physics updates
    const phys = getPhysicsState();
    const spriteState = getSpriteState(phys);
    riderRotation = getRiderRotation(phys, dt, riderRotation);
    updateRiderSprite(spriteState, phys.x, phys.y, riderRotation);
    updateCamera(getCamera(), phys.x, phys.y, currentTerrain.controlPoints, dt, true);
  }

  render();
  animFrameId = requestAnimationFrame(gameLoop);
}

function onRiderStateChange(from, to) {
  if (from === RIDER_STATES.AIRBORNE && to === RIDER_STATES.ON_TERRAIN) {
    // Clean landing
    playLandClean();
  }
}

function onDeath(physicsState) {
  appState = STATES.DEAD;
  hideHUD();
  stopPencilLoop();
  stopWindLoop();
  if (physicsState.deathCause === 'Reached the end of the line') {
    playWilhelmScream();
  } else {
    playDeathSting();
  }

  // Compute stats
  const priceInfo = getPriceAtX(currentTerrain.controlPoints, physicsState.x);
  const stats = computeStats(
    currentTerrain.priceData,
    priceInfo ? priceInfo.index : 0
  );

  showDeathScreen({
    ticker: currentTicker,
    timeframe: currentTimeframe,
    survived: stats.survived,
    total: stats.total,
    biggestDropPercent: stats.biggestDropPercent,
    deathCause: physicsState.deathCause || 'Unknown',
  });
}

function pauseGame() {
  paused = true;
  pauseOverlay.classList.add('visible');
  stopPencilLoop();
  stopWindLoop();
}

function unpauseGame() {
  paused = false;
  pauseOverlay.classList.remove('visible');
  lastTime = performance.now();
  if (appState === STATES.RIDING) {
    startPencilLoop();
    startWindLoop();
  }
}

// --- Start ---
init().catch(err => {
  console.error('Failed to initialize:', err);
});
