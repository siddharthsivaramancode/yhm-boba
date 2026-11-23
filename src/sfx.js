// Synthesized sound effects (Web Audio, no files). Off by default; App's toggle calls setSound().
// Everything runs through a low-pass master bus so nothing rings bright or bell-like.
// sfx("clink" | "slosh" | "shake" | "bloop" | "plop" | "pop" | "pierce" | "pin"); silent unless sound is on.
let ctx = null;
let bus = null;
let noiseBuf = null;
let on = false;
const listeners = new Set();

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    // master: gentle low-pass + soft compressor so stacked sounds never clip or sparkle
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 5200; lp.Q.value = 0.4;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.15;
    const master = ctx.createGain(); master.gain.value = 0.8;
    lp.connect(comp).connect(master).connect(ctx.destination);
    bus = lp;
    const len = ctx.sampleRate; // 1 s of white noise, reused
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function env(g, t, a, peak, d) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
}
function noise(c, t, dur, offset = Math.random() * 0.5) {
  const s = c.createBufferSource();
  s.buffer = noiseBuf; s.start(t, offset, dur + 0.05);
  return s;
}
function filt(c, type, f, q = 0.7) {
  const n = c.createBiquadFilter(); n.type = type; n.frequency.value = f; n.Q.value = q; return n;
}

const SFX = {
  // muffled ice: a short knock, two damped low partials through a low-pass, like cubes behind plastic
  clink(c, t, k = 1) {
    const lp = filt(c, "lowpass", 1700 + Math.random() * 500, 0.9);
    lp.connect(bus);
    [1, 1.47].forEach((m, i) => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = "sine"; o.frequency.value = (900 + Math.random() * 260) * m;
      env(g, t, 0.002, (0.11 / (i + 1)) * k, 0.07 + Math.random() * 0.04);
      o.connect(g).connect(lp); o.start(t); o.stop(t + 0.2);
    });
    const n = noise(c, t, 0.03), bp = filt(c, "bandpass", 2200, 1.4), g = c.createGain();
    env(g, t, 0.001, 0.07 * k, 0.025);
    n.connect(bp).connect(g).connect(lp);
  },
  // slosh: low-passed noise whose cutoff swings like liquid moving side to side
  slosh(c, t, k = 1) {
    const dur = 0.55, n = noise(c, t, dur), lp = filt(c, "lowpass", 500, 3.5), g = c.createGain();
    lp.frequency.setValueAtTime(320, t);
    lp.frequency.linearRampToValueAtTime(950, t + 0.14);
    lp.frequency.linearRampToValueAtTime(380, t + 0.3);
    lp.frequency.linearRampToValueAtTime(760, t + 0.42);
    lp.frequency.linearRampToValueAtTime(260, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.32 * k, t + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(lp).connect(g).connect(bus);
  },
  // shake: slosh under a few scattered ice knocks
  shake(c, t) {
    SFX.slosh(c, t, 1);
    for (let i = 0; i < 4; i++) SFX.clink(c, t + 0.03 + i * (0.06 + Math.random() * 0.05), 0.7 + Math.random() * 0.3);
  },
  // soft bloop: rounded sine that dips then lifts, heavily low-passed (a topping dropping in)
  bloop(c, t) {
    const o = c.createOscillator(), g = c.createGain(), lp = filt(c, "lowpass", 700, 1.2);
    o.type = "sine";
    o.frequency.setValueAtTime(240, t);
    o.frequency.exponentialRampToValueAtTime(140, t + 0.05);
    o.frequency.exponentialRampToValueAtTime(300, t + 0.16);
    env(g, t, 0.01, 0.28, 0.17);
    o.connect(g).connect(lp).connect(bus); o.start(t); o.stop(t + 0.25);
  },
  plop(c, t) { SFX.bloop(c, t); },
  // crisp pop: tight noise snap (band-passed) plus a quick falling body thump
  pop(c, t) {
    const n = noise(c, t, 0.025), bp = filt(c, "bandpass", 1500, 1.1), g = c.createGain();
    env(g, t, 0.0008, 0.35, 0.02);
    n.connect(bp).connect(g).connect(bus);
    const o = c.createOscillator(), og = c.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(420, t); o.frequency.exponentialRampToValueAtTime(110, t + 0.06);
    env(og, t, 0.002, 0.22, 0.07);
    o.connect(og).connect(bus); o.start(t); o.stop(t + 0.12);
  },
  // piercing the seal: film tension (short rising noise) into a crisp pop
  pierce(c, t) {
    const n = noise(c, t, 0.12), bp = filt(c, "bandpass", 900, 2), g = c.createGain();
    bp.frequency.setValueAtTime(700, t); bp.frequency.exponentialRampToValueAtTime(1800, t + 0.11);
    env(g, t, 0.06, 0.06, 0.05);
    n.connect(bp).connect(g).connect(bus);
    SFX.pop(c, t + 0.11);
  },
  // pinning a note: a softer pop with a papery tap
  pin(c, t) {
    SFX.pop(c, t);
    const n = noise(c, t + 0.04, 0.05), hp = filt(c, "bandpass", 3000, 0.8), g = c.createGain();
    env(g, t + 0.04, 0.002, 0.05, 0.04);
    n.connect(hp).connect(g).connect(bus);
  },
};

export function sfx(name) {
  if (!on) return;
  const c = audio();
  if (!c || !SFX[name]) return;
  SFX[name](c, c.currentTime + 0.005);
}
export function setSound(v) {
  on = !!v;
  if (on) audio();
  try { localStorage.setItem("yhm-sound", on ? "1" : "0"); } catch (e) {}
  listeners.forEach((fn) => fn(on));
}
export const soundOn = () => on;
export function onSoundChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
