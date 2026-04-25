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
