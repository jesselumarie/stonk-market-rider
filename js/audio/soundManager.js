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

// Cached Wilhelm Scream audio buffer (fetched once from Wikimedia Commons)
let wilhelmBuffer = null;
let wilhelmFetchAttempted = false;

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
  // Pre-fetch the real Wilhelm Scream so it's ready when needed
  fetchWilhelmScream();
}

function fetchWilhelmScream() {
  if (wilhelmFetchAttempted || !audioCtx) return;
  wilhelmFetchAttempted = true;

  const url = 'https://upload.wikimedia.org/wikipedia/commons/d/d9/Wilhelm_Scream.ogg';
  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error(res.status);
      return res.arrayBuffer();
    })
    .then(buf => audioCtx.decodeAudioData(buf))
    .then(decoded => { wilhelmBuffer = decoded; })
    .catch(() => { /* Fallback to procedural version */ });
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

export function playWilhelmScream() {
  if (!initialized) return;

  if (wilhelmBuffer) {
    // Play the real Wilhelm Scream
    const source = audioCtx.createBufferSource();
    source.buffer = wilhelmBuffer;
    const gain = audioCtx.createGain();
    gain.gain.value = 0.7;
    source.connect(gain);
    gain.connect(masterGain);
    source.start();
  } else {
    // Fallback: procedural scream if fetch failed
    playProceduralScream();
  }
}

function playProceduralScream() {
  const t = audioCtx.currentTime;
  const duration = 1.2;

  const fund = audioCtx.createOscillator();
  const fundGain = audioCtx.createGain();
  fund.type = 'sawtooth';
  fund.frequency.setValueAtTime(800, t);
  fund.frequency.exponentialRampToValueAtTime(400, t + duration);
  fundGain.gain.setValueAtTime(0.001, t);
  fundGain.gain.linearRampToValueAtTime(0.25, t + 0.05);
  fundGain.gain.setValueAtTime(0.25, t + 0.3);
  fundGain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  fund.connect(fundGain);
  fundGain.connect(masterGain);
  fund.start(t);
  fund.stop(t + duration);

  const vibrato = audioCtx.createOscillator();
  const vibratoGain = audioCtx.createGain();
  vibrato.frequency.value = 6;
  vibratoGain.gain.value = 30;
  vibrato.connect(vibratoGain);
  vibratoGain.connect(fund.frequency);
  vibrato.start(t);
  vibrato.stop(t + duration);

  const form2 = audioCtx.createOscillator();
  const form2Gain = audioCtx.createGain();
  form2.type = 'sawtooth';
  form2.frequency.setValueAtTime(1600, t);
  form2.frequency.exponentialRampToValueAtTime(800, t + duration);
  form2Gain.gain.setValueAtTime(0.001, t);
  form2Gain.gain.linearRampToValueAtTime(0.12, t + 0.05);
  form2Gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  form2.connect(form2Gain);
  form2Gain.connect(masterGain);
  form2.start(t);
  form2.stop(t + duration);

  const noiseLen = audioCtx.sampleRate * duration;
  const noiseBuf = audioCtx.createBuffer(1, noiseLen, audioCtx.sampleRate);
  const noiseData = noiseBuf.getChannelData(0);
  for (let i = 0; i < noiseLen; i++) {
    noiseData[i] = (Math.random() * 2 - 1) * 0.5;
  }
  const noiseSrc = audioCtx.createBufferSource();
  noiseSrc.buffer = noiseBuf;
  const noiseFilter = audioCtx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.setValueAtTime(2000, t);
  noiseFilter.frequency.exponentialRampToValueAtTime(800, t + duration);
  noiseFilter.Q.value = 2;
  const noiseGain = audioCtx.createGain();
  noiseGain.gain.setValueAtTime(0.001, t);
  noiseGain.gain.linearRampToValueAtTime(0.1, t + 0.05);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  noiseSrc.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(masterGain);
  noiseSrc.start(t);
  noiseSrc.stop(t + duration);
}

export function playFlipSick() {
  if (!initialized) return;
  const t = audioCtx.currentTime;

  // Ascending power chord — three notes staggered
  [400, 500, 600].forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, t + i * 0.04);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + i * 0.04 + 0.15);
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.18, t + i * 0.04 + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(t + i * 0.04);
    osc.stop(t + 0.5);
  });

  // Bright whoosh sweep
  const sweep = audioCtx.createOscillator();
  const sweepGain = audioCtx.createGain();
  sweep.type = 'sawtooth';
  sweep.frequency.setValueAtTime(200, t);
  sweep.frequency.exponentialRampToValueAtTime(1200, t + 0.2);
  sweep.frequency.exponentialRampToValueAtTime(800, t + 0.35);
  sweepGain.gain.setValueAtTime(0.15, t);
  sweepGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
  const sweepFilter = audioCtx.createBiquadFilter();
  sweepFilter.type = 'bandpass';
  sweepFilter.frequency.value = 1000;
  sweepFilter.Q.value = 0.8;
  sweep.connect(sweepFilter);
  sweepFilter.connect(sweepGain);
  sweepGain.connect(masterGain);
  sweep.start(t);
  sweep.stop(t + 0.45);
}

export function stopAllSounds() {
  stopPencilLoop();
  stopWindLoop();
}
