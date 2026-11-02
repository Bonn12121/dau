export const audioBus = { on: true, volume: 0.7 };

export function syncAudio(on: boolean, volume: number) {
  audioBus.on = on;
  audioBus.volume = volume;
}

type Kind = "tap" | "tick" | "go" | "correct" | "wrong" | "streak" | "done";

let ctx: AudioContext | null = null;

export function unlockAudio() {
  const AC = window.AudioContext;
  if (!AC) return;
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") void ctx.resume();
}

function tone(freq: number, at: number, dur: number, type: OscillatorType, gain: number) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  amp.gain.setValueAtTime(0.0001, at);
  amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), at + 0.02);
  amp.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start(at);
  osc.stop(at + dur + 0.02);
}

export function sfx(kind: Kind) {
  if (!audioBus.on || audioBus.volume <= 0) return;
  unlockAudio();
  if (!ctx) return;
  const now = ctx.currentTime;
  const v = audioBus.volume;
  if (kind === "tap") tone(520, now, 0.05, "square", 0.03 * v);
  if (kind === "tick") tone(440 + 40, now, 0.08, "triangle", 0.05 * v);
  if (kind === "go") {
    tone(523, now, 0.09, "triangle", 0.05 * v);
    tone(784, now + 0.08, 0.12, "triangle", 0.05 * v);
  }
  if (kind === "correct") {
    tone(523, now, 0.1, "triangle", 0.06 * v);
    tone(659, now + 0.08, 0.12, "triangle", 0.05 * v);
    tone(784, now + 0.16, 0.16, "sine", 0.04 * v);
  }
  if (kind === "wrong") {
    tone(196, now, 0.16, "sawtooth", 0.03 * v);
    tone(155, now + 0.08, 0.18, "triangle", 0.04 * v);
  }
  if (kind === "streak") {
    tone(659, now, 0.08, "triangle", 0.05 * v);
    tone(880, now + 0.07, 0.1, "triangle", 0.05 * v);
    tone(1046, now + 0.14, 0.16, "sine", 0.04 * v);
  }
  if (kind === "done") {
    tone(392, now, 0.12, "triangle", 0.05 * v);
    tone(523, now + 0.12, 0.14, "triangle", 0.05 * v);
    tone(659, now + 0.24, 0.2, "sine", 0.05 * v);
  }
}
