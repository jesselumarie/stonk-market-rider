/**
 * Procedural audio using Web Audio API.
 * All sounds generated programmatically — no external files needed.
 */

let audioCtx = null;
let masterGain = null;
let muted = false;
let initialized = false;

// Active sound nodes
let pencilSource = null;
let windSource = null;
let pencilGain = null;
let windGain = null;

export function initAudio() {
  // Audio context must be created on user gesture
  if (audioCtx) return;

  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.5;
    masterGain.connect(audioCtx.destination);
    initialized = true;
  } catch (e) {
    console.warn('Web Audio API not available:', e);
  }
}

export function resumeAudio() {
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

export function toggleMute() {
  muted = !muted;
  if (masterGain) {
    masterGain.gain.setTargetAtTime(muted ? 0 : 0.5, audioCtx.currentTime, 0.1);
  }
  return muted;
}

export function isMuted() {
  return muted;
}

// --- Looping sounds ---

export function startPencilLoop() {
  if (!initialized || pencilSource) return;

  // Filtered white noise simulating pencil on paper
  const bufferSize = audioCtx.sampleRate * 2;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.3;
  }

  pencilSource = audioCtx.createBufferSource();
  pencilSource.buffer = buffer;
  pencilSource.loop = true;

  // Bandpass filter for scratchy sound
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 3000;
  filter.Q.value = 0.5;

  pencilGain = audioCtx.createGain();
  pencilGain.gain.value = 0;

  pencilSource.connect(filter);
  filter.connect(pencilGain);
  pencilGain.connect(masterGain);
  pencilSource.start();
}

export function updatePencilVolume(speed) {
  if (!pencilGain) return;
  // Map speed to volume (louder = faster)
  const vol = Math.min(speed / 800, 1) * 0.25;
  pencilGain.gain.setTargetAtTime(vol, audioCtx.currentTime, 0.1);
}

export function stopPencilLoop() {
  if (pencilSource) {
    try {
      pencilGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
      setTimeout(() => {
        try { pencilSource.stop(); } catch (e) { /* ignore */ }
        pencilSource = null;
        pencilGain = null;
      }, 200);
    } catch (e) { /* ignore */ }
  }
}

export function startWindLoop() {
  if (!initialized || windSource) return;

  // Filtered noise with LFO for wind
  const bufferSize = audioCtx.sampleRate * 2;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.4;
  }

  windSource = audioCtx.createBufferSource();
  windSource.buffer = buffer;
  windSource.loop = true;

  // Low-pass filter for wind-like sound
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 800;
  filter.Q.value = 1.0;

  // LFO for subtle modulation
  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  lfo.frequency.value = 0.5;
  lfoGain.gain.value = 200;
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);
  lfo.start();

  windGain = audioCtx.createGain();
  windGain.gain.value = 0;

  windSource.connect(filter);
  filter.connect(windGain);
  windGain.connect(masterGain);
  windSource.start();
}

export function updateWindVolume(verticalSpeed) {
  if (!windGain) return;
  const vol = Math.min(Math.abs(verticalSpeed) / 600, 1) * 0.3;
  windGain.gain.setTargetAtTime(vol, audioCtx.currentTime, 0.1);
}

export function stopWindLoop() {
  if (windSource) {
    try {
      windGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
      setTimeout(() => {
        try { windSource.stop(); } catch (e) { /* ignore */ }
        windSource = null;
        windGain = null;
      }, 200);
    } catch (e) { /* ignore */ }
  }
}

// --- One-shot sounds ---

export function playJump() {
  if (!initialized) return;
  // Short whoosh: noise burst with frequency sweep
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(300, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.15);

  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);

  osc.connect(gain);
  gain.connect(masterGain);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.2);
}

export function playLandClean() {
  if (!initialized) return;
  // Satisfying thud: short low-freq noise burst
  playImpact(150, 0.15, 0.25);
}

export function playLandRough() {
  if (!initialized) return;
  // Crunchier landing
  playImpact(200, 0.2, 0.35);
}

function playImpact(freq, duration, volume) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();

  osc.type = 'triangle';
  osc.frequency.value = freq;

  filter.type = 'lowpass';
  filter.frequency.value = 400;

  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

export function playDeathSting() {
  if (!initialized) return;

  // Low rumble
  const rumbleOsc = audioCtx.createOscillator();
  const rumbleGain = audioCtx.createGain();
  rumbleOsc.type = 'sine';
  rumbleOsc.frequency.value = 60;
  rumbleGain.gain.setValueAtTime(0.4, audioCtx.currentTime);
  rumbleGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 2);
  rumbleOsc.connect(rumbleGain);
  rumbleGain.connect(masterGain);
  rumbleOsc.start();
  rumbleOsc.stop(audioCtx.currentTime + 2);

  // Noise crash
  const bufferSize = audioCtx.sampleRate;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.3));
  }
  const noiseSource = audioCtx.createBufferSource();
  noiseSource.buffer = buffer;

  const noiseFilter = audioCtx.createBiquadFilter();
  noiseFilter.type = 'lowpass';
  noiseFilter.frequency.value = 500;

  const noiseGain = audioCtx.createGain();
  noiseGain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);

  noiseSource.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(masterGain);
  noiseSource.start();

  // Dramatic sting chord
  [80, 100, 120].forEach(freq => {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.15, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 2.5);
    osc.connect(g);
    g.connect(masterGain);
    osc.start();
    osc.stop(audioCtx.currentTime + 2.5);
  });
}

export function stopAllSounds() {
  stopPencilLoop();
  stopWindLoop();
}
