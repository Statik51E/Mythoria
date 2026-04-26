// Lightweight procedural SFX via WebAudio. No external files = no network
// hiccup, no broken-URL risk, instant trigger when the dice spin.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") {
    void ctx.resume();
  }
  return ctx;
}

// Browsers gate AudioContext until a user gesture. Call this from the first
// click anywhere — afterwards the context stays unlocked for the session.
export function unlockAudio(): void {
  getCtx();
}

// One short noise burst with a fast exponential decay = a single dice "clack".
// Stack 7-9 of them with jittered timing/pitch and you get a believable tumble.
export function playDiceRoll(durationMs = 1300, volume = 0.5): void {
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;
  const sampleLen = Math.floor(c.sampleRate * 0.06);
  const buffer = c.createBuffer(1, sampleLen, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < sampleLen; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleLen * 0.18));
  }

  const master = c.createGain();
  master.gain.value = volume;
  const masterFilter = c.createBiquadFilter();
  masterFilter.type = "lowpass";
  masterFilter.frequency.value = 4500;
  master.connect(masterFilter).connect(c.destination);

  const clicks = 9;
  const span = durationMs / 1000;
  for (let i = 0; i < clicks; i++) {
    const t = now + (i / clicks) * span + (Math.random() - 0.5) * 0.05;
    const src = c.createBufferSource();
    src.buffer = buffer;
    const filter = c.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1200 + Math.random() * 2800;
    filter.Q.value = 1.5;
    const gain = c.createGain();
    const peak = (0.85 - i * 0.05) * (0.7 + Math.random() * 0.5);
    gain.gain.setValueAtTime(peak, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    src.connect(filter).connect(gain).connect(master);
    src.start(t);
    src.stop(t + 0.09);
  }

  // Final settle thud — a low sine that fades after the last clack.
  const settle = c.createOscillator();
  const settleGain = c.createGain();
  settle.type = "sine";
  settle.frequency.setValueAtTime(160, now + span);
  settle.frequency.exponentialRampToValueAtTime(70, now + span + 0.18);
  settleGain.gain.setValueAtTime(0.001, now + span);
  settleGain.gain.exponentialRampToValueAtTime(0.45 * volume, now + span + 0.02);
  settleGain.gain.exponentialRampToValueAtTime(0.001, now + span + 0.35);
  settle.connect(settleGain).connect(c.destination);
  settle.start(now + span);
  settle.stop(now + span + 0.4);
}

// Triumphant rising chord, played when a player rolls a natural 20.
export function playCritSuccess(volume = 0.6): void {
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    const t = now + i * 0.07;
    const osc = c.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, t);
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.55 * volume, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
    osc.connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + 0.75);
  });
  // Sparkly bell on top.
  const bell = c.createOscillator();
  const bellGain = c.createGain();
  bell.type = "sine";
  bell.frequency.setValueAtTime(2093, now + 0.05);
  bellGain.gain.setValueAtTime(0.0001, now + 0.05);
  bellGain.gain.exponentialRampToValueAtTime(0.35 * volume, now + 0.07);
  bellGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
  bell.connect(bellGain).connect(c.destination);
  bell.start(now + 0.05);
  bell.stop(now + 1.15);
}

// Dissonant low rumble + tritone for a critical failure.
export function playCritFail(volume = 0.6): void {
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;

  const sub = c.createOscillator();
  const subGain = c.createGain();
  sub.type = "sawtooth";
  sub.frequency.setValueAtTime(110, now);
  sub.frequency.exponentialRampToValueAtTime(38, now + 0.9);
  subGain.gain.setValueAtTime(0.0001, now);
  subGain.gain.exponentialRampToValueAtTime(0.55 * volume, now + 0.04);
  subGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.0);
  sub.connect(subGain).connect(c.destination);
  sub.start(now);
  sub.stop(now + 1.05);

  // Tritone above (the "diabolus in musica") for that ominous edge.
  const upper = c.createOscillator();
  const upperGain = c.createGain();
  upper.type = "square";
  upper.frequency.setValueAtTime(155.6, now); // E♭3
  upperGain.gain.setValueAtTime(0.0001, now);
  upperGain.gain.exponentialRampToValueAtTime(0.18 * volume, now + 0.04);
  upperGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
  upper.connect(upperGain).connect(c.destination);
  upper.start(now);
  upper.stop(now + 0.85);

  // Noise crack to seal it.
  const sampleLen = Math.floor(c.sampleRate * 0.25);
  const buffer = c.createBuffer(1, sampleLen, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < sampleLen; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleLen * 0.25));
  }
  const noise = c.createBufferSource();
  noise.buffer = buffer;
  const noiseFilter = c.createBiquadFilter();
  noiseFilter.type = "lowpass";
  noiseFilter.frequency.value = 700;
  const noiseGain = c.createGain();
  noiseGain.gain.setValueAtTime(0.45 * volume, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
  noise.connect(noiseFilter).connect(noiseGain).connect(c.destination);
  noise.start(now);
  noise.stop(now + 0.42);
}
