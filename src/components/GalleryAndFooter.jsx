import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SHOP, LOOKBOOK_PHOTOS, shopIsOpen, reduceMotion, finePointer } from "../data.js";
import { sfx } from "../sfx.js";
import { copyText } from "../ui/useDialog.js";

gsap.registerPlugin(ScrollTrigger);

const wrap = "px-[clamp(20px,5vw,72px)]";
const inner = "max-w-[1200px] mx-auto";

/* ------------------------------------------------------------------ */
/* Lookbook                                                            */
/* ------------------------------------------------------------------ */
const W = 480;
const H = 600;

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const clamp01 = (v) => Math.max(0, Math.min(1, v));

function sceneNeon() {
  const r = rng(11);
  const bricks = [];
  for (let y = 0, row = 0; y < H; y += 30, row++) for (let x = -(row % 2) * 36; x < W; x += 72) bricks.push([x, y, r()]);
  return (c, t) => {
    c.fillStyle = "#150b0b";
    c.fillRect(0, 0, W, H);
    for (const [x, y, v] of bricks) {
      c.fillStyle = `rgb(${(52 + v * 30) | 0},${(24 + v * 14) | 0},${(24 + v * 12) | 0})`;
      c.fillRect(x + 2, y + 2, 68, 26);
    }
    const fl = 1 - (Math.sin(t * 41) * Math.sin(t * 13 + 1) > 0.9 ? 0.55 : 0) - 0.04 * Math.sin(t * 7);
    const g = c.createRadialGradient(W / 2, H * 0.45, 10, W / 2, H * 0.45, 360);
    g.addColorStop(0, `rgba(255,122,156,${0.36 * fl})`);
    g.addColorStop(1, "rgba(255,122,156,0)");
    c.globalCompositeOperation = "screen";
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = "source-over";
    const v = c.createRadialGradient(W / 2, H / 2, 160, W / 2, H / 2, 420);
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(1, "rgba(0,0,0,.62)");
    c.fillStyle = v;
    c.fillRect(0, 0, W, H);
    // mounting wires
    c.strokeStyle = "rgba(10,6,6,.9)";
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(70, 190); c.lineTo(70, 0);
    c.moveTo(410, 190); c.lineTo(410, 0);
    c.stroke();
    c.textAlign = "center";
    c.textBaseline = "middle";
    const neon = (txt, y, size) => {
      c.font = `italic 600 ${size}px Fraunces, Georgia, serif`;
      for (const b of [48, 26, 10]) {
        c.shadowColor = "#FF7A9C";
        c.shadowBlur = b;
        c.fillStyle = `rgba(255,122,156,${0.55 * fl})`;
        c.fillText(txt, W / 2, y);
      }
      c.shadowBlur = 14;
      c.lineWidth = 2.4;
      c.strokeStyle = `rgba(255,228,236,${fl})`;
      c.strokeText(txt, W / 2, y);
      c.shadowBlur = 0;
    };
    neon("you had me", 250, 64);
    neon("@ boba", 350, 92);
    c.shadowColor = "#FF7A9C";
    c.shadowBlur = 22;
    c.strokeStyle = `rgba(255,228,236,${fl})`;
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(150, 430);
    c.quadraticCurveTo(240, 460, 330, 430);
    c.stroke();
    c.shadowBlur = 0;
  };
}

function scenePour() {
  const r = rng(5);
  const ribbons = Array.from({ length: 7 }, (_, i) => ({ x: 164 + i * 25 + (r() - 0.5) * 12, amp: 5 + r() * 8, ph: r() * 6, w: 7 + r() * 9, sp: 0.07 + r() * 0.06, off: r(), dark: r() > 0.5 }));
  const pearls = Array.from({ length: 26 }, () => ({ x: 162 + r() * 156, y: 512 + r() * 36, s: 9 + r() * 4 }));
  const glass = (c) => {
    c.beginPath();
    c.moveTo(130, 120); c.lineTo(350, 120); c.lineTo(332, 538);
    c.quadraticCurveTo(330, 560, 310, 560); c.lineTo(170, 560); c.quadraticCurveTo(150, 560, 148, 538);
    c.closePath();
  };
  return (c, t) => {
    const bg = c.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#35211A"); bg.addColorStop(1, "#120a07");
    c.fillStyle = bg; c.fillRect(0, 0, W, H);
    const glow = c.createRadialGradient(W / 2, 330, 20, W / 2, 330, 300);
    glow.addColorStop(0, "rgba(255,179,107,.28)"); glow.addColorStop(1, "rgba(255,179,107,0)");
    c.fillStyle = glow; c.fillRect(0, 0, W, H);
    c.save();
    glass(c);
    const milk = c.createLinearGradient(130, 0, 350, 0);
    milk.addColorStop(0, "#E6CDB0"); milk.addColorStop(0.45, "#F8EBDA"); milk.addColorStop(1, "#E3C9AA");
    c.fillStyle = milk; c.fill();
    c.clip();
    ribbons.forEach((b) => {
      const p = (t * b.sp + b.off) % 1;
      const head = 120 + Math.min(1, p * 1.5) * 430;
      const alpha = p > 0.78 ? clamp01((1 - p) / 0.22) : 1;
      c.globalAlpha = 0.92 * alpha;
      c.strokeStyle = b.dark ? "#5A341B" : "#B07A4A";
      c.lineCap = "round"; c.lineJoin = "round";
      c.lineWidth = b.w;
      c.beginPath();
      for (let y = 112; y <= head; y += 6) {
        const x = b.x + Math.sin(y * 0.026 + b.ph + t * 0.5) * b.amp;
        y === 112 ? c.moveTo(x, y) : c.lineTo(x, y);
      }
      c.stroke();
      c.fillStyle = c.strokeStyle;
      c.beginPath();
      c.arc(b.x + Math.sin(head * 0.026 + b.ph + t * 0.5) * b.amp, head, b.w * 0.75, 0, 7);
      c.fill();
    });
    c.globalAlpha = 1;
    pearls.forEach((p) => {
      c.fillStyle = "#24120B";
      c.beginPath(); c.arc(p.x, p.y, p.s, 0, 7); c.fill();
      c.fillStyle = "rgba(255,220,180,.35)";
      c.beginPath(); c.arc(p.x - p.s * 0.3, p.y - p.s * 0.35, p.s * 0.28, 0, 7); c.fill();
    });
    c.restore();
    c.fillStyle = "#F3E3D0";
    c.beginPath(); c.ellipse(240, 120, 110, 11, 0, 0, 7); c.fill();
    c.strokeStyle = "rgba(255,255,255,.45)"; c.lineWidth = 2; c.stroke();
    glass(c);
    c.strokeStyle = "rgba(255,255,255,.3)"; c.lineWidth = 2; c.stroke();
    c.fillStyle = "rgba(255,255,255,.2)";
    c.fillRect(150, 140, 12, 380);
  };
}

function sceneWall() {
  const r = rng(23);
  const paper = ["#F6EFE6", "#FBE7A6", "#FFCBD8", "#D8EBC3", "#FFD9B0"];
  const ink = ["#2A1A12", "#C2185B", "#2E6B3A", "#2F4DA8"];
  const kinds = ["heart", "text:thank you!", "star", "squiggle", "text:hi!", "spiral", "text:best boba", "heart"];
  const shape = (k) => {
    const pts = [];
    if (k === "heart") for (let a = 0; a <= 6.3; a += 0.15) pts.push([(16 * Math.sin(a) ** 3) / 17, -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) / 17]);
    else if (k === "star") for (let i = 0; i <= 10; i++) { const a = (i * 0.8 * Math.PI) - Math.PI / 2; pts.push([Math.cos(a), Math.sin(a)]); }
    else if (k === "spiral") for (let a = 0; a < 17; a += 0.25) pts.push([(a / 17) * Math.cos(a), (a / 17) * Math.sin(a)]);
    else for (let x = -1; x <= 1.001; x += 0.05) pts.push([x, Math.sin(x * 9) * 0.35]);
    return pts;
  };
  const notes = Array.from({ length: 8 }, (_, i) => ({
    x: 82 + (i % 3) * 158 + (r() - 0.5) * 36, y: 90 + Math.floor(i / 3) * 175 + (r() - 0.5) * 30,
    s: 128 + r() * 24, rot: (r() - 0.5) * 0.3, col: paper[i % paper.length], ph: r() * 6, ink: ink[i % ink.length], kind: kinds[i], pts: shape(kinds[i]),
  }));
  return (c, t) => {
    const bg = c.createRadialGradient(150, 0, 20, 240, 300, 520);
    bg.addColorStop(0, "#4A3024"); bg.addColorStop(0.6, "#2A1C16"); bg.addColorStop(1, "#150D0A");
    c.fillStyle = bg; c.fillRect(0, 0, W, H);
    c.fillStyle = "rgba(246,239,230,.05)";
    for (let y = 14; y < H; y += 26) for (let x = 12 + ((y / 26) % 2) * 13; x < W; x += 26) c.fillRect(x, y, 1.5, 1.5);
    notes.forEach((n, i) => {
      c.save();
      c.translate(n.x + Math.sin(t * 0.6 + n.ph) * 2, n.y + Math.cos(t * 0.5 + n.ph) * 2);
      c.rotate(n.rot + Math.sin(t * 0.45 + n.ph) * 0.02);
      c.shadowColor = "rgba(0,0,0,.5)"; c.shadowBlur = 16; c.shadowOffsetY = 7;
      c.fillStyle = n.col;
      c.fillRect(-n.s / 2, -n.s / 2, n.s, n.s);
      c.shadowColor = "transparent"; c.shadowBlur = 0; c.shadowOffsetY = 0;
      c.fillStyle = "rgba(255,255,255,.4)";
      c.fillRect(-26, -n.s / 2 - 8, 52, 16);
      const local = (t - i * 0.5 + 9) % 9;
      const p = clamp01(local / 1.6);
      c.globalAlpha = local > 8 ? 9 - local : 1;
      c.strokeStyle = n.ink; c.fillStyle = n.ink;
      c.lineCap = "round"; c.lineJoin = "round"; c.lineWidth = 3.2;
      if (n.kind.startsWith("text:")) {
        c.font = `italic 600 ${n.kind.length > 10 ? 25 : 34}px Fraunces, Georgia, serif`;
        c.textAlign = "center"; c.textBaseline = "middle";
        const txt = n.kind.slice(5);
        c.fillText(txt.slice(0, Math.ceil(txt.length * p)), 0, 4);
      } else {
        const k = Math.max(2, Math.floor(n.pts.length * p));
        c.beginPath();
        for (let j = 0; j < k; j++) { const [px, py] = n.pts[j]; j ? c.lineTo(px * n.s * 0.32, py * n.s * 0.32) : c.moveTo(px * n.s * 0.32, py * n.s * 0.32); }
        c.stroke();
      }
      c.restore();
    });
  };
}

function sceneDubai() {
  const r = rng(77);
  const edge = (y) => (y - 110) * (35 / 430);
  const strands = Array.from({ length: 150 }, () => {
    const a = r() * 6.28, d = Math.sqrt(r());
    return { x: 240 + Math.cos(a) * d * 128, y: 100 - Math.abs(Math.sin(a)) * d * 36 + 14, l: 18 + r() * 22, a: r() * 6.28, c: r() };
  });
  const chunks = Array.from({ length: 20 }, () => { const y = 350 + r() * 180; return { x: 120 + edge(y) + r() * (240 - edge(y) * 2), y, rx: 14 + r() * 12, ry: 12 + r() * 10, rot: r() * 3 }; });
  const crumbs = Array.from({ length: 36 }, () => ({ x: 130 + r() * 220, y: 192 + r() * 66, s: 2 + r() * 3 }));
  const layer = (c, t, top, bot, k, color) => {
    c.fillStyle = color;
    c.beginPath();
    c.moveTo(80, top + Math.sin(80 * 0.03 + t * 0.6 + k) * 5);
    for (let x = 80; x <= 400; x += 10) c.lineTo(x, top + Math.sin(x * 0.03 + t * 0.6 + k) * 5);
    for (let x = 400; x >= 80; x -= 10) c.lineTo(x, bot + Math.sin(x * 0.03 + t * 0.6 + k + 1) * 5);
    c.closePath(); c.fill();
  };
  return (c, t) => {
    const bg = c.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#3A1F24"); bg.addColorStop(1, "#150B0C");
    c.fillStyle = bg; c.fillRect(0, 0, W, H);
    const glow = c.createRadialGradient(W / 2, 330, 20, W / 2, 330, 300);
    glow.addColorStop(0, "rgba(217,72,95,.3)"); glow.addColorStop(1, "rgba(217,72,95,0)");
    c.fillStyle = glow; c.fillRect(0, 0, W, H);
    c.save();
    c.beginPath(); c.moveTo(110, 110); c.lineTo(370, 110); c.lineTo(335, 540); c.quadraticCurveTo(334, 556, 318, 556); c.lineTo(162, 556); c.quadraticCurveTo(146, 556, 145, 540); c.closePath();
    c.fillStyle = "#F7D9DE"; c.fill();
    c.clip();
    layer(c, t, 105, 205, 0, "#C9A24A");
    layer(c, t, 200, 270, 1.5, "#8DB36A");
    layer(c, t, 265, 345, 3, "#4A2617");
    layer(c, t, 340, 600, 4.5, "#D9485F");
    crumbs.forEach((p) => { c.fillStyle = "#4C7A3B"; c.fillRect(p.x, p.y, p.s, p.s); });
    chunks.forEach((p) => {
      c.save(); c.translate(p.x, p.y); c.rotate(p.rot);
      c.fillStyle = "#B52A44"; c.beginPath(); c.ellipse(0, 0, p.rx, p.ry, 0, 0, 7); c.fill();
      c.fillStyle = "rgba(255,200,200,.5)"; c.beginPath(); c.ellipse(-p.rx * 0.3, -p.ry * 0.3, p.rx * 0.35, p.ry * 0.25, 0, 0, 7); c.fill();
      c.restore();
    });
    const dp = (t * 0.12) % 1;
    const tip = 340 + Math.min(1, dp * 1.4) * 170;
    c.globalAlpha = dp > 0.8 ? clamp01((1 - dp) / 0.2) : 1;
    c.strokeStyle = "#4A2617"; c.fillStyle = "#4A2617"; c.lineCap = "round"; c.lineWidth = 12;
    c.beginPath(); c.moveTo(255, 336); c.lineTo(255, tip); c.stroke();
    c.beginPath(); c.arc(255, tip, 9, 0, 7); c.fill();
    c.globalAlpha = 1;
    c.fillStyle = "rgba(255,255,255,.2)";
    c.fillRect(128, 130, 14, 400);
    c.restore();
    c.save();
    c.beginPath(); c.moveTo(110, 110); c.lineTo(370, 110); c.lineTo(335, 540); c.quadraticCurveTo(334, 556, 318, 556); c.lineTo(162, 556); c.quadraticCurveTo(146, 556, 145, 540); c.closePath();
    c.strokeStyle = "rgba(255,255,255,.35)"; c.lineWidth = 2; c.stroke();
    c.restore();
    // golden kataifi mound above the rim
    strands.forEach((s) => {
      c.strokeStyle = s.c > 0.5 ? "#E0B957" : "#C99A3A";
      c.lineWidth = 2.4; c.lineCap = "round";
      c.beginPath();
      c.moveTo(s.x, s.y);
      c.quadraticCurveTo(s.x + Math.cos(s.a) * s.l, s.y - s.l * 0.4, s.x + Math.cos(s.a + 1) * s.l, s.y + Math.sin(s.a) * 6);
      c.stroke();
    });
  };
}

const SCENES = { neon: sceneNeon, pour: scenePour, wall: sceneWall, dubai: sceneDubai };

function Scene({ kind, label, tint }) {
  if (!SCENES[kind]) {
    return <div role={label ? "img" : undefined} aria-label={label || undefined} aria-hidden={label ? undefined : true} className="absolute inset-0"
      style={{ background: `radial-gradient(90% 80% at 30% 20%, ${tint ? tint[1] : "#FFB36B"} 0%, ${tint ? tint[0] : "#3A1D20"} 75%)` }} />;
  }
  return <CanvasScene kind={kind} label={label} />;
}
function CanvasScene({ kind, label }) {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current;
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    cv.width = W * dpr;
    cv.height = H * dpr;
    const c = cv.getContext("2d");
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const draw = SCENES[kind]();
    if (reduceMotion()) {
      draw(c, 2.5);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { c.setTransform(dpr, 0, 0, dpr, 0, 0); draw(c, 2.5); });
      return;
    }
    let vis = false, raf = 0;
    const t0 = performance.now();
    const loop = (now) => {
      if (!vis) { raf = 0; return; }
      draw(c, (now - t0) / 1000);
      raf = requestAnimationFrame(loop);
    };
    const io = new IntersectionObserver(([e]) => {
      vis = e.isIntersecting;
      if (vis && !raf) raf = requestAnimationFrame(loop);
    });
    io.observe(cv);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [kind]);
  return <canvas ref={ref} role={label ? "img" : undefined} aria-label={label || undefined} aria-hidden={label ? undefined : true} className="absolute inset-0 h-full w-full object-cover" />;
}

// Photo order: local public/photos/lookbook-{kind}.jpg, then the Unsplash placeholder, then the canvas scene.
function Media({ story }) {
  const photo = LOOKBOOK_PHOTOS[story.kind];
  const srcs = [`${import.meta.env.BASE_URL}photos/lookbook-${story.kind}.jpg`, photo && photo.src].filter(Boolean);
  const [i, setI] = useState(0);
  const [ok, setOk] = useState(false);
  const failed = i >= srcs.length;
  const stock = ok && i === 1;
  return (
    <>
      {!ok && <Scene kind={story.kind} label={failed ? story.alt : ""} tint={story.tint} />}
      {!failed && (
        <img
          key={srcs[i]}
          src={srcs[i]}
          alt={ok ? (stock ? photo.alt : story.alt) : ""}
          loading="lazy"
          decoding="async"
          draggable="false"
          referrerPolicy="no-referrer"
          onLoad={() => setOk(true)}
          onError={() => { setOk(false); setI((n) => n + 1); }}
          className={`lb-photo absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${ok ? "opacity-100" : "opacity-0"}`}
        />
      )}
      {ok && <span aria-hidden="true" className="lb-grade pointer-events-none absolute inset-0" />}
      {ok && <span aria-hidden="true" className="lb-grain pointer-events-none absolute inset-0" />}
      {stock && (
        <span className="absolute right-3 top-3 z-[2] rounded-full border border-ink bg-espresso/90 px-2.5 py-1 text-[11px] text-oat">
          Placeholder photo: {photo.by} / Unsplash
        </span>
      )}
    </>
  );
}

// Six cards, 3 x 2 on desktop. Photo order per card: public/photos/lookbook-{kind}.jpg, then the Unsplash
// placeholder (data.js LOOKBOOK_PHOTOS), then a canvas scene (neon/pour/wall/dubai) or a flavor gradient.
const STORIES = [
  { kind: "neon", title: "The midnight neon sign", rot: -1.2, tint: ["#3A1D20", "#FF4D8D"],
    alt: "A pink neon sign glowing on a dark wall", text: "Past nine on West Poplar the pink sign hums on for the late crowd." },
  { kind: "pour", title: "Warm brown sugar pour", rot: 1.2, tint: ["#5C341E", "#D98A3C"],
    alt: "Caramel brown sugar syrup streaking down a glass of cold milk", text: "Warm pearls, cold milk, caramel streaks painting the glass." },
  { kind: "wall", title: "The community scribble wall", rot: -0.8, tint: ["#2A1C16", "#FFB36B"],
    alt: "A wall layered with notes and doodles", text: "Every doodle and thank-you note from regulars stays up." },
  { kind: "dubai", title: "The Dubai chocolate crunch", rot: 1, tint: ["#4A2617", "#C8235A"],
    alt: "The Dubai strawberry chocolate cup with pistachio cream and kataifi", text: "Strawberries, warm chocolate, pistachio cream and kataifi crunch." },
  { kind: "matcha", title: "Hand-whisked Uji matcha", rot: -1, tint: ["#2F5E26", "#8CD175"],
    alt: "Matcha being whisked into a bright green froth", text: "Whisked to order until it's bright, frothy and grassy-sweet." },
  { kind: "sweets", title: "Hot mini pancakes & sweets", rot: 0.9, tint: ["#7A4E1C", "#F2C48D"],
    alt: "A stack of pancakes dusted with powdered sugar", text: "Griddled to order, dusted in sugar, made for sharing." },
];

function Story({ s, n }) {
  const tilt = useRef(null);

  useEffect(() => {
    const el = tilt.current;
    if (!el || reduceMotion()) return;
    gsap.set(el, { transformPerspective: 1100, rotation: s.rot });
    if (!finePointer()) return () => gsap.set(el, { clearProps: "transform" });
    const move = (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      gsap.to(el, { rotateY: (px - 0.5) * 14, rotateX: (0.5 - py) * 12, rotation: s.rot * 0.4, duration: 0.5, ease: "power3.out", overwrite: "auto" });
      el.style.setProperty("--mx", `${px * 100}%`);
      el.style.setProperty("--my", `${py * 100}%`);
      el.style.setProperty("--sx", `${px * 100}%`);
    };
    const leave = () => {
      gsap.to(el, { rotateX: 0, rotateY: 0, rotation: s.rot, duration: 1, ease: "elastic.out(1, 0.6)", overwrite: "auto" });
      el.style.setProperty("--mx", "30%");
      el.style.setProperty("--my", "0%");
      el.style.setProperty("--sx", "-30%");
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      gsap.killTweensOf(el);
      gsap.set(el, { clearProps: "transform" });
    };
  }, [s.rot]);

  return (
    <div className="relative [perspective:1100px]">
      <article
        ref={tilt}
        data-cursor="LOOK"
        aria-labelledby={`story-${s.kind}`}
        className="relative m-0 rounded-card border-[1.5px] border-ink bg-espresso-2 p-2 shadow-[6px_6px_0_#231712] [transform-style:preserve-3d] will-change-transform"
        style={{ "--mx": "30%", "--my": "0%", "--sx": "-30%", transform: reduceMotion() ? undefined : `rotate(${s.rot}deg)` }}
      >
        <div className="relative aspect-[4/5] overflow-hidden rounded-[18px] bg-espresso-2">
          <div className="plx absolute left-0 right-0 top-[-7.5%] h-[115%]">
            <Media story={s} />
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at var(--mx) var(--my), rgba(255,255,255,.18), transparent 46%), linear-gradient(105deg, transparent calc(var(--sx) - 14%), rgba(255,255,255,.16) var(--sx), transparent calc(var(--sx) + 14%)), linear-gradient(180deg, transparent 55%, rgba(20,13,10,.55) 100%)",
            }}
          />
        </div>
        <div
          className="absolute bottom-5 left-5 right-5 rounded-[16px] border-[1.5px] border-ink bg-espresso/90 p-4 shadow-[3px_3px_0_#231712] backdrop-blur-md"
          style={{ transform: "translateZ(46px)" }}
        >
          <h3 id={`story-${s.kind}`} className="m-0 font-display text-[clamp(20px,2vw,26px)] font-semibold italic leading-tight text-oat">
            {s.title}
          </h3>
          <p className="m-0 mt-1.5 text-[14.5px] leading-[1.5] text-oat-2">{s.text}</p>
        </div>
      </article>
    </div>
  );
}

export function Gallery() {
  const root = useRef(null);

  useEffect(() => {
    if (reduceMotion()) return;
    const mm = gsap.matchMedia();
    mm.add({ desk: "(min-width: 768px)", mob: "(max-width: 767px)" }, (ctx) => {
      const k = ctx.conditions.desk ? 1 : 0.35;
      void k;
      gsap.utils.toArray(".plx", root.current).forEach((img) => {
        gsap.fromTo(img, { yPercent: -5 }, { yPercent: 5, ease: "none", scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
      });
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={root} id="gallery" aria-labelledby="gallery-title" className={`relative ${wrap} py-[clamp(90px,12vw,160px)] overflow-hidden`}>
      <div className={inner}>
        <p className="m-0 mb-4 text-neon-2 text-[15px] font-medium">Inside the shop</p>
        <h2 id="gallery-title" className="m-0 mb-[clamp(40px,6vw,80px)] max-w-[16ch] font-display font-bold leading-[1.02] tracking-[-0.02em] text-[clamp(40px,6.4vw,92px)]">
          The moments people come back for.
        </h2>
        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {STORIES.map((s, i) => (
            <Story key={s.kind} s={s} n={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Open-now indicator (America/Chicago)                                */
/* ------------------------------------------------------------------ */
function OpenNow() {
  const [open, setOpen] = useState(shopIsOpen);
  useEffect(() => {
    const t = setInterval(() => setOpen(shopIsOpen()), 60000);
    return () => clearInterval(t);
  }, []);
  if (open === null) return null;
  return (
    <p className="m-0 mt-3 inline-flex items-center gap-2 text-[14.5px] text-oat-2" role="status">
      <span
        aria-hidden="true"
        className={`inline-block h-2.5 w-2.5 rounded-full ${open ? "bg-matcha shadow-[0_0_0_3px_rgba(95,158,78,.3)]" : "bg-oat/30"}`}
      />
      {open ? "Open now" : "Closed now · opens at 11 AM"}
    </p>
  );
}

function inquiryText(v) {
  return [
    `Catering inquiry for ${SHOP.name}`,
    `Name: ${v.name.trim()}`,
    `Contact: ${v.contact.trim()}`,
    `Event: ${v.event || "Not given"} on ${v.date || "date TBD"}`,
    `Headcount: ${v.count}`,
    v.drinks.trim() && `Preferred drinks: ${v.drinks.trim()}`,
    v.notes.trim() && `Notes: ${v.notes.trim()}`,
  ].filter(Boolean).join("\n");
}

/* ------------------------------------------------------------------ */
/* Catering modal                                                      */
/* ------------------------------------------------------------------ */
const EVENT_TYPES = ["Graduation", "Birthday", "Nurse appreciation", "Teacher appreciation", "Office party", "Other"];
const field =
  "w-full rounded-[14px] border-[1.5px] border-ink bg-white px-4 py-3 text-[16px] text-oat placeholder:text-oat-3 focus:border-neon focus:outline-none focus:ring-2 focus:ring-neon/40";
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([tabindex="-1"]), select, textarea, [tabindex]:not([tabindex="-1"])';

function validate(v) {
  const e = {};
  if (!v.name.trim()) e.name = "Add your name so the shop knows who to ask for.";
  const c = v.contact.trim();
  if (!c) e.contact = "Add a phone number or email so the shop can reach you.";
  else if (c.includes("@") ? !/^\S+@\S+\.\S+$/.test(c) : c.replace(/\D/g, "").length < 10)
    e.contact = "That doesn't look like a full phone number or email. Check it and try again.";
  if (!v.event) e.event = "Pick the kind of event you're planning.";
  if (!v.date) e.date = "Choose the day you need the boba bar.";
  const n = parseInt(v.count, 10);
  if (!n) e.count = "Add a headcount so the shop can plan.";
  else if (n < 10) e.count = "Catering starts at 10 guests.";
  return e;
}

function Field({ id, label, error, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[14px] font-medium text-oat-2">
        {label}
        {hint && <span className="font-normal text-oat-3"> {hint}</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-err`} className="m-0 mt-1.5 text-[13.5px] text-neon-2">
          {error}
        </p>
      )}
    </div>
  );
}

function CateringModal({ onClose, opener }) {
  const dialog = useRef(null);
  const backdrop = useRef(null);
  const closing = useRef(false);
  const [vals, setVals] = useState({ name: "", contact: "", event: "", date: "", count: "", drinks: "", notes: "" });
  const [copied, setCopied] = useState("");
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(null); // null = offline (no endpoint), "ok" = delivered, "error" = failed
  const [gotcha, setGotcha] = useState(""); // honeypot: real people never fill this

  const requestClose = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    if (reduceMotion()) return onClose();
    gsap.to(dialog.current, { opacity: 0, y: 16, scale: 0.98, duration: 0.22, ease: "power2.in" });
    gsap.to(backdrop.current, { opacity: 0, duration: 0.25, onComplete: onClose });
  }, [onClose]);

  // open: animate, lock scroll, focus, return focus on unmount
  useEffect(() => {
    sfx("pop");
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const ctx = gsap.context(() => {
      if (!reduceMotion()) {
        gsap.from(backdrop.current, { opacity: 0, duration: 0.3 });
        gsap.from(dialog.current, { opacity: 0, y: 28, scale: 0.96, duration: 0.5, ease: "power3.out" });
      }
    });
    dialog.current.querySelector("input")?.focus();
    return () => {
      ctx.revert();
      document.body.style.overflow = prevOverflow;
      if (opener && document.contains(opener)) opener.focus();
    };
  }, [opener]);

  // Esc + focus trap
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        requestClose();
      } else if (e.key === "Tab") {
        const items = [...dialog.current.querySelectorAll(FOCUSABLE)].filter((n) => n.offsetParent !== null);
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (!dialog.current.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [requestClose]);

  const set = (k) => (e) => {
    setVals((v) => ({ ...v, [k]: e.target.value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  // POST to Formspree only when SHOP.formspreeId is set; otherwise no network request at all.
  async function send(v) {
    if (!SHOP.formspreeId) return null;
    try {
      const res = await fetch(`https://formspree.io/f/${encodeURIComponent(SHOP.formspreeId)}`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          _subject: "Catering inquiry, You Had Me @ Boba",
          _gotcha: gotcha,
          name: v.name.trim(), contact: v.contact.trim(), event: v.event, date: v.date, headcount: v.count,
          drinks: v.drinks.trim(), notes: v.notes.trim(),
        }),
      });
      return res.ok ? "ok" : "error";
    } catch (err) { return "error"; }
  }

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate(vals);
    setErrors(errs);
    const firstBad = Object.keys(errs)[0];
    if (firstBad) {
      dialog.current.querySelector(`#cat-${firstBad}`)?.focus();
      return;
    }
    if (sending) return;
    setSending(true);
    const result = await send(vals);
    setSending(false);
    setSent(result);
    sfx("clink");
    setDone(true);
  };

  const props = (k) => ({
    id: `cat-${k}`,
    value: vals[k],
    onChange: set(k),
    "aria-invalid": errors[k] ? "true" : undefined,
    "aria-describedby": errors[k] ? `cat-${k}-err` : undefined,
    className: field,
  });

  return (
    <div
      ref={backdrop}
      onMouseDown={(e) => e.target === e.currentTarget && requestClose()}
      className="fixed inset-0 z-[98] grid place-items-center bg-[rgba(35,23,18,.55)] p-4 backdrop-blur-sm"
    >
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="catering-title"
        className="relative max-h-[92vh] w-full max-w-[560px] overflow-y-auto rounded-card tactile p-[clamp(22px,4vw,36px)]"
      >
        <button type="button" onClick={requestClose} aria-label="Close" className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full border-[1.5px] border-ink text-oat">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" /></svg>
        </button>

        {done ? (
          <div className="py-4">
            <span aria-hidden="true" className="mb-4 grid h-14 w-14 place-items-center rounded-full border-[1.5px] border-ink bg-[#E4F1DD] shadow-[3px_3px_0_#231712]">
              <svg width="26" height="26" viewBox="0 0 16 16" fill="none" stroke="#231712" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8.5l3.2 3L13 4.5" /></svg>
            </span>
            <h3 id="catering-title" className="m-0 mb-3 pr-10 font-display text-[clamp(28px,4vw,38px)] font-bold leading-tight">
              {sent === "error" ? "That didn't go through." : `Got it, ${vals.name.trim().split(" ")[0]}!`}
            </h3>
            {sent === "error" ? (
              <p className="m-0 mb-6 text-oat-2">
                We couldn't send your inquiry just now. Nothing is lost: call {SHOP.phone}, or copy the inquiry and text it to the shop.
              </p>
            ) : (
              <>
                <p className="m-0 mb-2 text-oat-2">
                  Your {vals.event ? vals.event.toLowerCase() : "event"} on {vals.date || "your date"} for about {vals.count} guests
                  {sent === "ok" ? " was sent to the shop." : " is noted."} The shop will follow up to confirm drinks, pricing and pickup.
                </p>
                <p className="m-0 mb-6 text-[14px] text-oat-3">
                  {sent === "ok"
                    ? `Need it sooner? Call ${SHOP.phone}.`
                    : `Nothing has been sent online yet. To lock in your date now, call ${SHOP.phone} or copy this inquiry and text it to the shop.`}
                </p>
              </>
            )}
            <div className="flex flex-wrap gap-3">
              <a href={`tel:${SHOP.tel}`} className="pill pill-neon">Call the shop</a>
              <button type="button" className="pill pill-ghost" onClick={async () => setCopied((await copyText(inquiryText(vals))) ? "Inquiry copied." : "Couldn't copy here.")}>Copy inquiry</button>
              <button type="button" onClick={requestClose} className="pill pill-ghost">Done</button>
            </div>
            <p role="status" aria-live="polite" className="m-0 mt-3 min-h-[1.3em] text-[14px] text-neon-2">{copied}</p>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="grid gap-4">
            {/* honeypot for bots (Formspree drops submissions where _gotcha is filled) */}
            <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
              <label>Leave this empty<input type="text" tabIndex={-1} autoComplete="off" value={gotcha} onChange={(e) => setGotcha(e.target.value)} name="_gotcha" /></label>
            </div>
            <div className="pr-10">
              <h3 id="catering-title" className="m-0 mb-1 font-display text-[clamp(28px,4vw,38px)] font-bold leading-tight">Plan a catering order</h3>
              <p className="m-0 text-[15px] text-oat-2">Graduations, office parties, nurse and teacher appreciation days: tell the shop a little about yours.</p>
            </div>
            <Field id="cat-name" label="Your name" error={errors.name}>
              <input type="text" autoComplete="name" {...props("name")} />
            </Field>
            <Field id="cat-contact" label="Phone or email" error={errors.contact}>
              <input type="text" autoComplete="email" {...props("contact")} />
            </Field>
            <Field id="cat-event" label="Event type" error={errors.event}>
              <select {...props("event")}>
                <option value="">Choose one</option>
                {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="cat-date" label="Event date" error={errors.date}>
                <input type="date" style={{ colorScheme: "light" }} {...props("date")} />
              </Field>
              <Field id="cat-count" label="Headcount" hint="(10 or more)" error={errors.count}>
                <input type="number" min="10" inputMode="numeric" {...props("count")} />
              </Field>
            </div>
            <Field id="cat-drinks" label="Preferred drinks" hint="(optional)">
              <input type="text" {...props("drinks")} placeholder="Brown sugar boba, taro, mango refresher" />
            </Field>
            <Field id="cat-notes" label="Notes" hint="(optional)">
              <textarea rows="3" id="cat-notes" value={vals.notes} onChange={set("notes")} className={field} placeholder="Flavors, allergies, pickup time" />
            </Field>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <button type="submit" className="pill pill-neon magnetic" disabled={sending} aria-busy={sending}>{sending ? "Sending…" : "Request a quote"}</button>
              <button type="button" onClick={requestClose} className="pill pill-ghost">Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Footer                                                              */
/* ------------------------------------------------------------------ */
const DELIVERY = [
  { name: "DoorDash", href: SHOP.doordash, dot: "#FF3008" },
  { name: "Uber Eats", href: SHOP.ubereats, dot: "#06C167" },
  { name: "Grubhub", href: SHOP.grubhub, dot: "#F63440" },
];

const label = "m-0 mb-4 text-neon-2 text-[15px] font-medium";

export function Footer() {
  const [open, setOpen] = useState(false);
  const [opener, setOpener] = useState(null);
  const trigger = useRef(null);

  const openModal = () => {
    setOpener(trigger.current);
    setOpen(true);
  };
  const closeModal = useCallback(() => setOpen(false), []);

  return (
    <footer id="visit" className={`relative ${wrap} pt-[clamp(90px,12vw,160px)] pb-0 overflow-hidden border-t-[1.5px] border-ink bg-espresso-2`}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[min(900px,120vw)] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[.16] blur-[90px]"
        style={{ background: "radial-gradient(circle, #FF7A9C, transparent 70%)" }}
      />
      <div className={`${inner} relative`}>
        <h2 className="m-0 mb-[clamp(48px,7vw,96px)] max-w-[16ch] font-display font-bold leading-[1.02] tracking-[-0.02em] text-[clamp(40px,6.4vw,92px)]">
          Come say hi on <i className="font-light text-neon-2">West Poplar.</i>
        </h2>

        <div className="grid gap-12 md:grid-cols-2 md:gap-16">
          <div>
            <h3 className={label}>Visit</h3>
            <a href={SHOP.maps} target="_blank" rel="noopener noreferrer" className="block text-[clamp(20px,2.2vw,26px)] font-display leading-snug text-oat no-underline hover:text-neon-2">
              {SHOP.street}
              <br />
              {SHOP.city}
            </a>
            <p className="m-0 mt-5 text-oat-2">{SHOP.hours}</p>
            <OpenNow />
            <p className="m-0 mt-5">
              <a href={`tel:${SHOP.tel}`} className="text-oat underline decoration-oat/30 underline-offset-4 hover:decoration-neon-2">{SHOP.phone}</a>
            </p>
          </div>

          <div>
            <h3 className={label}>Order delivery</h3>
            <p className="m-0 mb-5 max-w-[34ch] text-oat-2">Can't make it in? Your boba can come to you.</p>
            <div className="flex flex-wrap gap-3">
              {DELIVERY.map((d) => (
                <a key={d.name} href={d.href} target="_blank" rel="noopener noreferrer" data-cursor="SIP" className="pill pill-ghost magnetic">
                  <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: d.dot }} />
                  {d.name}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="relative mt-[clamp(56px,8vw,104px)] overflow-hidden rounded-card tactile p-[clamp(26px,5vw,56px)]" style={{ background: "#FFE9F0" }}>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full opacity-25 blur-[70px]"
            style={{ background: "radial-gradient(circle, #FFB36B, transparent 70%)" }}
          />
          <div className="relative grid items-end gap-8 md:grid-cols-[1.4fr_1fr]">
            <div>
              <h3 className="m-0 mb-3 font-display text-[clamp(30px,4vw,52px)] font-bold leading-[1.05] tracking-[-0.01em]">Party catering</h3>
              <p className="m-0 max-w-[44ch] text-[clamp(16px,1.6vw,19px)] text-oat-2">
                Boba bars for graduations, birthdays, office parties and nurse and teacher appreciation days. Tell us the headcount and we'll handle the cups, the pearls and the ice.
              </p>
            </div>
            <div className="md:justify-self-end">
              <button ref={trigger} type="button" onClick={openModal} aria-haspopup="dialog" className="pill pill-neon magnetic">
                Plan a catering order
              </button>
            </div>
          </div>
        </div>

        <div className="mt-[clamp(56px,8vw,96px)] flex flex-col gap-2 border-t border-oat/[.12] pb-[clamp(72px,9vw,96px)] pt-7 text-[14px] text-oat-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8">
          <p className="m-0">&copy; {new Date().getFullYear()} You Had Me @ Boba &middot; Collierville, Tennessee</p>
        </div>
      </div>

      {open && <CateringModal onClose={closeModal} opener={opener} />}
    </footer>
  );
}

export default function GalleryAndFooter() {
  return (
    <>
      <Gallery />
      <Footer />
    </>
  );
}
