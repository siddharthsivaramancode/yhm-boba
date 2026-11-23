import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { DRINKS, DUBAI, TREATS, REVIEWS, SHOP, MOODS, money, reduceMotion, finePointer } from "../data.js";
import { bagActions } from "../order/store.js";
import { uiActions } from "../ui/store.js";
import { scrollToTarget } from "../scroll.js";
import { sfx } from "../sfx.js";
import WallQR from "./WallQR.jsx";

const PAD = "px-[clamp(20px,5vw,72px)] py-[clamp(90px,12vw,160px)]";

/* ============================== MENU ============================== */
const SWEETS = TREATS.filter((t) => t.id !== "dubai");

function MenuRow({ item, feature, added, onAdd, onAct, onLeave, onGo }) {
  const isDrink = item.kind !== "treat";
  return (
    <li
      tabIndex={0}
      data-item={item.id}
      data-cursor={isDrink ? "MIX" : "ADD"}
      aria-label={`${item.name}, ${money(item.price)}. Press Enter to ${isDrink ? "customize it in the drink lab" : "add it to your bag"}.`}
      onPointerEnter={(e) => onAct(item, e)}
      onPointerLeave={(e) => onLeave(e)}
      onFocus={(e) => onAct(item, e)}
      onBlur={onLeave}
      onKeyDown={(e) => { if (e.key === "Enter" && e.target === e.currentTarget) { e.preventDefault(); onGo(item); } }}
      onClick={(e) => { if (e.nativeEvent.pointerType !== "touch" && finePointer()) { onGo(item); return; } sfx("clink"); onAct(item, e); }}
      className={`group list-none rounded-xl outline-offset-4 transition-transform duration-500 ease-out hover:translate-x-1 focus-visible:translate-x-1 ${feature ? "py-7 md:py-9" : "py-4"} border-b border-line`}
    >
      <div className="flex items-baseline gap-3">
        <span aria-hidden="true" className="inline-block shrink-0 rounded-full self-center"
          style={{ width: feature ? 16 : 11, height: feature ? 16 : 11, background: item.base, boxShadow: `0 0 0 3px ${item.deep}66` }} />
        <span className={`font-display font-semibold leading-[1.1] tracking-[-.01em] ${feature ? "text-[clamp(26px,3.2vw,40px)]" : "text-[clamp(20px,2vw,26px)]"}`}>
          {item.name}
        </span>
        <span aria-hidden="true" className="min-w-[14px] flex-1 translate-y-[-5px] border-b border-dotted border-oat/35" />
        <span className={`font-display tabular-nums ${feature ? "text-[clamp(24px,2.6vw,34px)] text-neon-2" : "text-[clamp(18px,1.8vw,22px)] text-neon-2"}`}
          style={{ fontVariantNumeric: "tabular-nums" }}>
          {money(item.price)}
        </span>
        <span role="status" aria-live="polite" className="w-[46px] shrink-0 self-center text-right text-[13px] text-matcha">{added ? "Added" : ""}</span>
        <button type="button" data-cursor="ADD" aria-label={`Add ${item.name} to bag`}
          onClick={(e) => { e.stopPropagation(); onAdd(item); }}
          onFocus={(e) => e.stopPropagation()}
          className={`grid h-10 w-10 shrink-0 self-center place-items-center rounded-full border text-[22px] leading-none transition-colors duration-300 ${added ? "border-matcha bg-matcha/20 text-matcha" : "border-oat/40 text-oat hover:border-neon hover:text-neon-2"}`}>
          {added ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 8.5l3.2 3L13 4.5" /></svg>
          ) : "+"}
        </button>
      </div>
      <p className={`mt-1.5 pl-[23px] text-oat-2 ${feature ? "max-w-[46ch] text-[16px]" : "text-[15px]"}`}>
        {item.note}
        {item.size && (
          <span className="ml-2 inline-block rounded-full border border-neon/50 px-2.5 py-px align-middle text-[12.5px] text-neon-2">{item.size} cup</span>
        )}
      </p>
    </li>
  );
}

/* Floating preview card (fine pointers only): follows the cursor on a damped spring and leans
   into its velocity. It is pointer-events: none; clicking the row runs the card's action. */
function PreviewCard({ item, show, pos }) {
  const el = useRef(null);
  const sp = useRef({ x: 0, y: 0, vx: 0, vy: 0, init: false });
  useEffect(() => {
    if (!show) { sp.current.init = false; return; }
    const s = sp.current, reduce = reduceMotion();
    if (!s.init) { s.x = pos.current.x; s.y = pos.current.y; s.vx = s.vy = 0; s.init = true; }
    let raf = 0, last = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const tx = pos.current.x, ty = pos.current.y;
      if (reduce) { s.x = tx; s.y = ty; s.vx = s.vy = 0; }
      else {
        const k = 170, c = 19; // stiffness, damping
        s.vx += ((tx - s.x) * k - s.vx * c) * dt; s.vy += ((ty - s.y) * k - s.vy * c) * dt;
        s.x += s.vx * dt; s.y += s.vy * dt;
      }
      const w = el.current ? el.current.offsetWidth : 300, h = el.current ? el.current.offsetHeight : 200;
      // keep it on screen: flip to the left of the cursor near the right edge
      const left = s.x + 28 + w > window.innerWidth - 12 ? s.x - w - 28 : s.x + 28;
      const top = Math.max(76, Math.min(window.innerHeight - h - 12, s.y - h / 2));
      const rot = Math.max(-8, Math.min(8, s.vx * 0.012));
      if (el.current) el.current.style.transform = `translate3d(${left}px, ${top}px, 0) rotate(${rot}deg)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [show, pos]);
  if (!item) return null;
  const isDrink = item.kind !== "treat";
  return (
    <div ref={el} aria-hidden="true" className={`menu-preview ${show ? "is-on" : ""}`} style={{ "--glow": item.base }}>
      <div className="mp-inner">
        <div className="mp-glow" />
        <div className="mp-cup">
          <div className="mp-liquid" style={{ background: `linear-gradient(180deg, ${item.cream} 0%, ${item.base} 55%, ${item.deep} 100%)` }}>
            {isDrink && <div className="mp-pearls" />}
          </div>
        </div>
        <div className="mp-copy">
          <p className="m-0 font-display text-[21px] font-semibold leading-tight text-oat">{item.name}</p>
          <p className="m-0 mt-1 text-[13.5px] leading-snug text-oat-2">{isDrink ? item.taste.charAt(0).toUpperCase() + item.taste.slice(1) + "." : item.note}</p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="font-display text-[20px] text-neon-2 tabular-nums">{money(item.price)}</span>
            <span className="mp-action">
              {isDrink ? "Customize in Lab" : "Add to bag"}
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                {isDrink ? <path d="M3 8h10M9 4l4 4-4 4" /> : <path d="M8 3v10M3 8h10" />}
              </svg>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Viral Drop spotlight: the 16 oz Dubai Strawberry Chocolate Cup gets its own pistachio / chocolate / gold card.
   Price and size come from data.js (DUBAI). */
function Spotlight({ item, added, onAdd, onAct, onLeave }) {
  return (
    <article
      aria-labelledby="spot-title"
      data-item={item.id}
      data-cursor="ADD"
      onPointerEnter={(e) => onAct(item, e)}
      onPointerLeave={(e) => onLeave(e)}
      className="spotlight relative overflow-hidden rounded-card p-6 sm:p-8"
    >
      <span aria-hidden="true" className="spot-drip" />
      <div className="relative flex flex-wrap items-center gap-2">
        <span className="rounded-full border-[1.5px] border-ink bg-[#C7DE9C] px-3 py-1 text-[13px] font-semibold text-ink">Viral drop</span>
        <span className="rounded-full border-[1.5px] border-[#E8C46A] px-3 py-1 text-[13px] font-semibold text-[#F6DA8E]">{item.size} cup</span>
      </div>
      <h3 id="spot-title" className="relative m-0 mt-5 max-w-[14ch] font-display text-[clamp(30px,3.4vw,44px)] font-bold leading-[1.02] tracking-[-.01em] text-[#FFF6E6]">
        {item.name}
      </h3>
      <p className="relative m-0 mt-3 max-w-[44ch] text-[15.5px] leading-relaxed text-[#F1E2CF]">{item.note}</p>
      <div className="relative mt-6 flex flex-wrap items-center gap-4">
        <span className="font-display text-[40px] font-bold leading-none text-[#F6DA8E] tabular-nums">{money(item.price)}</span>
        <button type="button" onClick={() => onAdd(item)} aria-label={`Add ${item.name} to bag`}
          className="pill" style={{ background: added ? "#C7DE9C" : "#F6DA8E" }}>
          {added ? "Added to bag" : "Add to bag"}
        </button>
      </div>
      <span role="status" className="sr-only">{added ? `${item.name} added to your bag` : ""}</span>
    </article>
  );
}

export function Menu() {
  const sec = useRef(null);
  const wash = useRef(null);
  const layers = useRef([null, null]);
  const st = useRef({ i: 0, id: null, timer: 0 });
  const [added, setAdded] = useState(null);
  const addTimer = useRef(0);
  const [fine] = useState(finePointer);
  const [preview, setPreview] = useState({ item: null, show: false });
  const pos = useRef({ x: 0, y: 0 });
  const hideT = useRef(0);
  const goLab = (item) => {
    uiActions.pickDrink(item.id);
    sfx("clink");
    setPreview((p) => ({ ...p, show: false }));
    const lab = document.getElementById("lab");
    if (lab) scrollToTarget(lab);
  };
  const onAdd = (item) => {
    bagActions.add({ id: item.id, name: item.name, price: item.price });
    sfx("pop");
    setAdded(item.id);
    clearTimeout(addTimer.current);
    addTimer.current = setTimeout(() => setAdded(null), 1600);
  };
  const onGo = (item) => (item.kind === "treat" ? onAdd(item) : goLab(item));
  // "Match my craving": highlight the matching item and bring it into view
  const [mood, setMood] = useState(null);
  const moodItem = mood ? [...DRINKS, ...TREATS].find((x) => x.id === MOODS.find((m) => m.id === mood).itemId) : null;
  const pickMood = (m) => {
    setMood(m.id);
    sfx("bloop");
    const root = sec.current;
    root.querySelectorAll(".craving-hit").forEach((n) => n.classList.remove("craving-hit"));
    const el = root.querySelector(`[data-item="${m.itemId}"]`);
    if (!el) return;
    void el.offsetWidth; // restart the pulse
    el.classList.add("craving-hit");
    scrollToTarget(el, -Math.round(window.innerHeight * 0.3));
  };
  useEffect(() => () => { clearTimeout(addTimer.current); clearTimeout(hideT.current); }, []);

  useEffect(() => {
    const el = sec.current, w = wash.current, s = st.current;
    gsap.set(w, { "--wx": 400, "--wy": 300 });
    const move = (e) => {
      pos.current.x = e.clientX; pos.current.y = e.clientY;
      if (!s.id) return;
      const r = el.getBoundingClientRect();
      gsap.to(w, { "--wx": e.clientX - r.left, "--wy": e.clientY - r.top, duration: reduceMotion() ? 0 : 0.7, ease: "power3.out", overwrite: "auto" });
    };
    el.addEventListener("pointermove", move);
    return () => {
      el.removeEventListener("pointermove", move);
      clearTimeout(s.timer);
      gsap.killTweensOf(w);
      layers.current.forEach((l) => l && gsap.killTweensOf(l));
    };
  }, []);

  const fade = (el, o) => gsap.to(el, { opacity: o, duration: reduceMotion() ? 0 : 0.7, ease: "power3.out", overwrite: "auto" });

  const activate = (item, e) => {
    const s = st.current;
    clearTimeout(s.timer);
    if (fine && e && e.type === "pointerenter" && e.nativeEvent.pointerType !== "touch") {
      clearTimeout(hideT.current);
      pos.current.x = e.clientX; pos.current.y = e.clientY;
      setPreview({ item, show: true });
    }
    const r = sec.current.getBoundingClientRect();
    let cx, cy;
    if (e && e.clientX != null && (e.clientX || e.clientY)) { cx = e.clientX; cy = e.clientY; }
    else { const b = e.currentTarget.getBoundingClientRect(); cx = b.left + b.width / 2; cy = b.top + b.height / 2; }
    gsap.to(wash.current, { "--wx": cx - r.left, "--wy": cy - r.top, duration: reduceMotion() || !s.id ? 0 : 0.7, ease: "power3.out", overwrite: "auto" });
    if (s.id === item.id) { fade(layers.current[s.i], 0.48); return; }
    const next = s.id ? 1 - s.i : s.i;
    layers.current[next].style.background =
      `radial-gradient(circle at calc(var(--wx)*1px) calc(var(--wy)*1px), ${item.base}70 0%, ${item.cream}aa 30%, transparent 64%),` +
      `radial-gradient(circle at calc(var(--wx)*1px + 20vw) calc(var(--wy)*1px - 14vw), ${item.cream} 0%, transparent 50%),` +
      `radial-gradient(circle at calc(var(--wx)*1px - 22vw) calc(var(--wy)*1px + 16vw), ${item.base}44 0%, transparent 55%)`;
    if (s.id) fade(layers.current[s.i], 0);
    fade(layers.current[next], 0.48);
    s.i = next; s.id = item.id;
  };
  const leave = (e) => {
    if (e && e.pointerType === "touch") return; // taps stay lit until another tap
    clearTimeout(hideT.current);
    hideT.current = setTimeout(() => setPreview((p) => ({ ...p, show: false })), 120);
    const s = st.current;
    clearTimeout(s.timer);
    s.timer = setTimeout(() => {
      s.id = null;
      layers.current.forEach((l) => fade(l, 0));
    }, 140);
  };

  const rowProps = { onAct: activate, onLeave: leave, onAdd, onGo };
  const groupHead = (t) => (
    <h3 className="mb-2 border-b-[1.5px] border-ink pb-3 font-display text-[22px] italic text-oat">{t}</h3>
  );

  return (
    <section ref={sec} id="menu" aria-labelledby="menu-title" className={`relative overflow-hidden bg-espresso ${PAD}`}>
      <div ref={wash} aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
        <div ref={(n) => (layers.current[0] = n)} className="absolute inset-0 opacity-0" />
        <div ref={(n) => (layers.current[1] = n)} className="absolute inset-0 opacity-0" />
        <div className="absolute inset-0 bg-espresso/10" />
      </div>
      <div className="relative z-10 mx-auto max-w-[1200px]">
        <p className="mb-4 text-[15px] font-medium text-neon-2">Menu</p>
        <h2 id="menu-title" className="font-display text-[clamp(40px,6.4vw,92px)] font-bold leading-[.98] tracking-[-.02em]">Favorites, on repeat.</h2>
        <p className="mt-5 max-w-[46ch] text-[18px] text-oat-2">Everything is made to order. Drinks come in 24 oz cups; ask about seasonal flavors at the counter.</p>

        <div className="mt-8 rounded-card tactile p-4 sm:p-5" role="group" aria-labelledby="mood-title">
          <p id="mood-title" className="m-0 mb-3 font-display text-[20px] font-semibold">Match my craving</p>
          <div className="flex flex-wrap items-center gap-2">
            {MOODS.map((m) => (
              <button key={m.id} type="button" aria-pressed={mood === m.id} onClick={() => pickMood(m)}
                className="pill" style={{ minHeight: 42, background: mood === m.id ? "#FF4D8D" : "#FFFDF9" }}>{m.label}</button>
            ))}
            {moodItem && (
              <span className="flex flex-wrap items-center gap-3 sm:ml-auto" aria-live="polite">
                <span className="text-[15px] text-oat-2">Try the <b className="text-oat">{moodItem.name}</b></span>
                <button type="button" className="pill pill-neon" style={{ minHeight: 42 }} onClick={() => onGo(moodItem)}>
                  {moodItem.kind === "treat" ? (added === moodItem.id ? "Added" : "Add to bag") : "Load in Lab"}
                </button>
              </span>
            )}
          </div>
        </div>

        <div className="mt-[clamp(40px,6vw,80px)] grid gap-x-[clamp(36px,6vw,96px)] gap-y-12 lg:grid-cols-2">
          <div>
            {groupHead("Milk teas & refreshers")}
            <ul className="m-0 p-0">{DRINKS.map((d) => <MenuRow key={d.id} item={d} added={added === d.id} {...rowProps} />)}</ul>
          </div>
          <div className="flex flex-col gap-12">
            <div>
              <Spotlight item={DUBAI} added={added === DUBAI.id} {...rowProps} />
            </div>
            <div>
              {groupHead("Sweets")}
              <ul className="m-0 p-0">{SWEETS.map((d) => <MenuRow key={d.id} item={d} added={added === d.id} {...rowProps} />)}</ul>
            </div>
          </div>
        </div>
        <p className="mt-10">
          {fine && <span className="mr-4 text-[14px] text-oat-3">Click a drink to open it in the lab.</span>}
          <a href="#lab" className="text-[16px] text-oat-2 underline decoration-oat/30 underline-offset-4 transition-colors hover:text-oat hover:decoration-neon-2">Customize any drink in the builder</a>
        </p>
      </div>
      {fine && <PreviewCard item={preview.item} show={preview.show} pos={pos} />}
    </section>
  );
}

/* ============================== SCRIBBLE WALL ============================== */
const STORE = "yhm-wall-notes";
const MAX_NOTES = 12;
const PAPERS = ["#F6EFE6", "#FBE7A6", "#FFCBD8", "#D8EBC3"];
const ROTS = [-3, 2.5, -1.5, 3.5, -2.5, 1.5, -3.5, 2, -1];
const SLOTS = [[3, 4], [35, 9], [67, 3], [6, 38], [38, 42], [68, 36], [4, 70], [37, 72], [67, 69]];
const REST = "0 6px 14px rgba(0,0,0,.35), 0 1px 2px rgba(0,0,0,.4)";
const LIFT = "0 24px 40px rgba(0,0,0,.5), 0 6px 12px rgba(0,0,0,.35)";
const INKS = [["Espresso", "#231712"], ["Pink", "#FF4D8D"], ["Green", "#5F9E4E"], ["Amber", "#E08A2E"]];
const STAR = "M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z";

function useMedia(q) {
  const [m, setM] = useState(() => typeof window !== "undefined" && window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const f = () => setM(mq.matches);
    f();
    mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, [q]);
  return m;
}

function StarRow({ n = 5, size = 16, color = "#E8A317", dim = false }) {
  return (
    <span className="inline-flex" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" style={{ fill: color, opacity: dim ? 0.22 : 1, display: "block" }}><path d={STAR} /></svg>
      ))}
    </span>
  );
}

function loadNotes() {
  try {
    const a = JSON.parse(localStorage.getItem(STORE) || "[]");
    if (!Array.isArray(a)) return [];
    return a.filter((x) => x && typeof x.id === "string" && (typeof x.text === "string" || typeof x.img === "string"))
      .slice(-MAX_NOTES).map((x) => ({ id: x.id, text: String(x.text || "").slice(0, 80), img: typeof x.img === "string" && x.img.startsWith("data:image/") ? x.img : "" }));
  } catch (e) { return []; }
}

function Note({ n, i, free, wallRef, zRef, onRemove }) {
  const el = useRef(null);
  const drag = useRef(null);
  const you = n.kind === "you";
  const rot = ROTS[i % ROTS.length] * (free ? 1 : 0.6);
  const slot = SLOTS[i % SLOTS.length];
  const extra = Math.min(Math.floor(i / SLOTS.length) * 3, 6);

  useEffect(() => {
    const e = el.current;
    gsap.set(e, { rotation: rot });
    if (n.fresh && !reduceMotion()) gsap.fromTo(e, { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(1.8)" });
    return () => gsap.killTweensOf(e);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clamp = (x, y) => {
    const e = el.current, w = wallRef.current;
    return [
      Math.max(-e.offsetLeft, Math.min(w.clientWidth - e.offsetWidth - e.offsetLeft, x)),
      Math.max(-e.offsetTop, Math.min(w.clientHeight - e.offsetHeight - e.offsetTop, y)),
    ];
  };
  const front = () => { zRef.current += 1; el.current.style.zIndex = zRef.current; };
  const rm = () => reduceMotion();

  const down = (ev) => {
    if (!free || ev.button > 0 || ev.target.closest("button")) return;
    const e = el.current;
    e.setPointerCapture(ev.pointerId);
    front();
    drag.current = { sx: ev.clientX, sy: ev.clientY, x: gsap.getProperty(e, "x"), y: gsap.getProperty(e, "y") };
    gsap.to(e, { scale: 1.04, rotation: rm() ? rot : rot + (rot < 0 ? -2 : 2), boxShadow: LIFT, duration: rm() ? 0 : 0.25, overwrite: "auto" });
  };
  const move = (ev) => {
    const d = drag.current;
    if (!d) return;
    const [x, y] = clamp(d.x + ev.clientX - d.sx, d.y + ev.clientY - d.sy);
    gsap.set(el.current, { x, y });
  };
  const up = () => {
    if (!drag.current) return;
    drag.current = null;
    gsap.to(el.current, { scale: 1, rotation: rot, boxShadow: REST, duration: rm() ? 0 : 0.8, ease: "elastic.out(1,.5)", overwrite: "auto" });
  };
  const key = (ev) => {
    const k = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[ev.key];
    if (!free || !k) return;
    ev.preventDefault();
    front();
    const step = ev.shiftKey ? 48 : 14, e = el.current;
    const [x, y] = clamp(gsap.getProperty(e, "x") + k[0] * step, gsap.getProperty(e, "y") + k[1] * step);
    gsap.to(e, { x, y, duration: rm() ? 0 : 0.25, ease: "power3.out", overwrite: "auto" });
  };

  const style = free
    ? { left: `${Math.min(slot[0] + extra, 70)}%`, top: `${Math.min(slot[1] + extra, 72)}%`, width: "clamp(200px,31%,250px)", boxShadow: REST, touchAction: "none" }
    : { boxShadow: REST };
  const paper = you ? { background: "#FFFDF9", color: "#231712", border: "1.5px solid #231712" } : { background: PAPERS[i % PAPERS.length], color: "#2A1A12" };
  const who = n.who === "Google review" ? "A happy guest" : n.who;

  return (
    <article
      ref={el}
      tabIndex={0}
      data-cursor={free ? "DRAG" : undefined}
      aria-label={you ? "Your note" : `Review by ${who}`}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onLostPointerCapture={up}
      onKeyDown={key} onFocus={front}
      className={`${free ? "absolute cursor-grab select-none active:cursor-grabbing" : "relative shrink-0 snap-center"} flex flex-col rounded-[6px] p-5 pt-6 will-change-transform ${free ? "" : "w-[min(78vw,270px)]"}`}
      style={{ ...style, ...paper }}
    >
      <span aria-hidden="true" className="pointer-events-none absolute -top-2.5 left-1/2 h-5 w-16 -translate-x-1/2 rotate-[-3deg] rounded-[2px] bg-white/35 shadow-sm backdrop-blur-[1px]" />
      {you ? (
        <>
          <div className="mb-2 flex items-center justify-between">
            <span className="rounded-full bg-neon px-2.5 py-px text-[12px] font-semibold text-ink">You</span>
            <button type="button" onClick={() => onRemove(n.id)} aria-label="Remove your note" className="grid h-8 w-8 place-items-center rounded-full text-[20px] leading-none text-oat-2 hover:bg-oat/10">×</button>
          </div>
          {n.img && <img src={n.img} alt="Your doodle" draggable="false" className="mb-2 w-full rounded-[4px] bg-espresso/60" />}
          {n.text && <p className="font-display text-[19px] italic leading-snug [overflow-wrap:anywhere]">{n.text}</p>}
        </>
      ) : (
        <>
          <StarRow n={n.stars} size={17} />
          <blockquote className="my-3 font-display text-[clamp(16px,1.4vw,19px)] italic leading-[1.4]">“{n.q}”</blockquote>
          <p className="mt-auto text-[14px] font-semibold">— {who}</p>
          <p className="text-[12.5px] opacity-65">Google review</p>
        </>
      )}
    </article>
  );
}

// Doodle pad. The canvas backing store follows its on-screen size x devicePixelRatio (re-measured on resize
// and rotation, keeping the drawing), so strokes are crisp and land exactly under the finger. touch-action:
// none on the canvas only, so drawing never scrolls the page; everywhere else scrolls normally.
const BRUSHES = [["Fine", 3], ["Bold", 7]];
function DoodlePad({ onPin }) {
  const cv = useRef(null);
  const ctxR = useRef(null);
  const pen = useRef(null);
  const dirty = useRef(false);
  const undo = useRef([]); // snapshots (canvas copies) taken before each stroke
  const [ink, setInk] = useState(INKS[0][1]);
  const [size, setSize] = useState(BRUSHES[0][1]);
  const [canUndo, setCanUndo] = useState(false);
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const c = cv.current;
    const fit = () => {
      const r = c.getBoundingClientRect(), dpr = Math.min(3, window.devicePixelRatio || 1);
      const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
      if (c.width === w && c.height === h && ctxR.current) return;
      const resize = c.width !== w || c.height !== h;
      const keep = document.createElement("canvas"); keep.width = c.width; keep.height = c.height;
      if (resize) keep.getContext("2d").drawImage(c, 0, 0);
      if (resize) { c.width = w; c.height = h; }
      const x = c.getContext("2d");
      x.setTransform(dpr, 0, 0, dpr, 0, 0); x.lineCap = "round"; x.lineJoin = "round";
      if (resize && keep.width > 1) x.drawImage(keep, 0, 0, keep.width, keep.height, 0, 0, r.width, r.height);
      ctxR.current = x;
    };
    fit();
    const ro = new ResizeObserver(fit); ro.observe(c);
    return () => { ro.disconnect(); ctxR.current = null; pen.current = null; };
  }, []);

  const pt = (e) => { const r = cv.current.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const snapshot = () => {
    const c = cv.current, k = document.createElement("canvas"); k.width = c.width; k.height = c.height;
    k.getContext("2d").drawImage(c, 0, 0);
    undo.current = [...undo.current.slice(-19), k]; setCanUndo(true);
  };
  const down = (e) => {
    if (e.button > 0) return;
    e.preventDefault();
    cv.current.setPointerCapture(e.pointerId);
    snapshot();
    const p = pt(e), x = ctxR.current;
    x.fillStyle = ink; x.strokeStyle = ink; x.lineWidth = size;
    x.beginPath(); x.arc(p.x, p.y, size / 2, 0, 7); x.fill();
    pen.current = { id: e.pointerId, last: p, mid: p };
    dirty.current = true; setMsg("");
  };
  const move = (e) => {
    const s = pen.current, x = ctxR.current;
    if (!s || !x || e.pointerId !== s.id) return;
    // coalesced events give every sample between frames, so fast finger strokes stay smooth
    const evs = e.nativeEvent.getCoalescedEvents ? e.nativeEvent.getCoalescedEvents() : [];
    for (const ev of evs.length ? evs : [e.nativeEvent]) {
      const p = pt(ev), mid = { x: (s.last.x + p.x) / 2, y: (s.last.y + p.y) / 2 };
      x.beginPath(); x.moveTo(s.mid.x, s.mid.y); x.quadraticCurveTo(s.last.x, s.last.y, mid.x, mid.y); x.stroke();
      s.last = p; s.mid = mid;
    }
  };
  const end = () => { pen.current = null; };
  const wipe = () => { const c = cv.current, x = ctxR.current; if (!x) return; x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, c.width, c.height); x.restore(); };
  const clear = () => { if (dirty.current) snapshot(); wipe(); dirty.current = false; };
  const back = () => {
    const k = undo.current.pop(); if (!k) return;
    const c = cv.current, x = ctxR.current;
    wipe(); x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.drawImage(k, 0, 0, k.width, k.height, 0, 0, c.width, c.height); x.restore();
    dirty.current = true; setCanUndo(undo.current.length > 0);
  };

  const pin = () => {
    const t = text.trim();
    if (!dirty.current && !t) { setMsg("Draw something or write a few words first."); return; }
    let img = "";
    if (dirty.current) {
      const o = document.createElement("canvas");
      o.width = 420; o.height = 300;
      o.getContext("2d").drawImage(cv.current, 0, 0, 420, 300);
      img = o.toDataURL("image/png");
    }
    onPin({ text: t, img });
    wipe(); dirty.current = false; undo.current = []; setCanUndo(false);
    setText(""); setMsg("Pinned. It's on the wall.");
    sfx("pin");
  };

  const tool = "grid h-11 min-w-11 place-items-center rounded-full border-[1.5px] border-ink bg-espresso-2 px-3 text-[14px] font-semibold text-oat disabled:opacity-40";
  return (
    <div className="min-w-0 rounded-card tactile bg-espresso-2 p-4 sm:p-5">
      <h3 className="font-display text-[26px] font-semibold leading-tight">Leave your mark</h3>
      <p className="mt-1 text-[15px] text-oat-2">Draw something, say hi, or tell the next person what to order.</p>
      <canvas
        ref={cv} data-cursor="DRAW" role="img" aria-label="Drawing pad. Draw with a mouse, finger or stylus."
        onPointerDown={down} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}
        className="mt-4 block aspect-[7/5] w-full rounded-xl border-[1.5px] border-ink bg-white"
        style={{ touchAction: "none" }}
      />
      {/* one row: colours, brush, undo, clear (44px targets) */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {INKS.map(([name, c]) => (
          <button key={c} type="button" aria-label={`${name} pen`} aria-pressed={ink === c} onClick={() => setInk(c)}
            className="grid h-11 w-11 place-items-center rounded-full">
            <span className="block h-7 w-7 rounded-full transition-transform duration-300 ease-out"
              style={{ background: c, transform: ink === c ? "scale(1.12)" : "scale(1)", boxShadow: ink === c ? `0 0 0 2px #FFFDF9, 0 0 0 4px ${c}` : "0 0 0 1.5px #231712" }} />
          </button>
        ))}
        <button type="button" className={tool} onClick={() => setSize(size === BRUSHES[0][1] ? BRUSHES[1][1] : BRUSHES[0][1])}
          aria-label={`Brush size: ${size === BRUSHES[0][1] ? "fine" : "bold"}. Tap to switch.`}>
          <span aria-hidden="true" className="block rounded-full bg-ink" style={{ width: size + 4, height: size + 4 }} />
        </button>
        <span className="ml-auto flex gap-1.5">
          <button type="button" className={tool} onClick={back} disabled={!canUndo} aria-label="Undo last stroke">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 14L4 9l5-5" /><path d="M4 9h11a5 5 0 0 1 0 10h-3" /></svg>
          </button>
          <button type="button" className={tool} onClick={clear}>Clear</button>
        </span>
      </div>
      <label className="mt-3 block text-[14px] text-oat-2" htmlFor="wall-text">A few words (optional)</label>
      <input id="wall-text" value={text} maxLength={80} onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") pin(); }}
        onFocus={(e) => { const el = e.currentTarget; setTimeout(() => el.scrollIntoView({ block: "center", behavior: "smooth" }), 300); }}
        enterKeyHint="done"
        className="mt-1 w-full rounded-xl border-[1.5px] border-ink bg-white px-3.5 py-3 text-[16px] text-oat placeholder:text-oat-3 focus:border-neon-2 focus:outline-none"
        placeholder="Best boba in town" />
      <div className="mt-1 text-right text-[12.5px] text-oat-3">{text.length}/80</div>
      <button type="button" onClick={pin} className="pill pill-neon mt-2 w-full" style={{ minHeight: 50 }}>Pin it to the wall</button>
      <p role="status" aria-live="polite" className="mt-3 min-h-[1.4em] text-[14px] text-neon-2">{msg}</p>
      <p className="text-[13px] text-oat-3">Notes stay on this device.</p>
    </div>
  );
}

export function ScribbleWall() {
  const wall = useRef(null);
  const row = useRef(null);
  const z = useRef(10);
  const [mine, setMine] = useState(loadNotes);
  const mobile = useMedia("(max-width: 767px), (pointer: coarse)");
  const [qr, setQr] = useState(null); // opener button while the QR sheet is open

  useEffect(() => {
    try {
      localStorage.setItem(STORE, JSON.stringify(mine.map(({ id, text, img }) => ({ id, text, img }))));
    } catch (e) { /* storage unavailable: notes still work this session */ }
  }, [mine]);

  const pin = ({ text, img }) => {
    const note = { id: "n" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), kind: "you", text, img, fresh: true };
    setMine((m) => [...m, note].slice(-MAX_NOTES));
    if (row.current) row.current.scrollTo({ left: 0, behavior: reduceMotion() ? "auto" : "smooth" });
  };
  const remove = (id) => setMine((m) => m.filter((x) => x.id !== id));

  const reviews = REVIEWS.map((r, i) => ({ ...r, id: "r" + i, kind: "review" }));
  const mineN = mine.map((n) => ({ ...n, kind: "you" }));
  const list = mobile ? [...mineN.slice().reverse(), ...reviews] : [...reviews, ...mineN];
  const fill = (SHOP.rating / 5) * 100;

  return (
    <section id="wall" aria-labelledby="wall-title" className={`relative overflow-hidden ${PAD}`} style={{ background: "#FFF6DC" }}>
      <div className="mx-auto max-w-[1200px]">
        <p className="mb-4 text-[15px] font-medium text-neon-2">The scribble wall</p>
        <h2 id="wall-title" className="max-w-[16ch] font-display text-[clamp(40px,6.4vw,92px)] font-bold leading-[.98] tracking-[-.02em]">Notes from the regulars.</h2>

        <div className="mt-8 flex flex-wrap items-center gap-4">
        <a href={SHOP.maps} target="_blank" rel="noopener"
          className="inline-flex items-center gap-4 rounded-card tactile px-5 py-4 no-underline"
          aria-label={`Rated ${SHOP.rating.toFixed(1)} out of 5 from ${SHOP.reviews}+ Google reviews. Opens Google Maps.`}>
          <span className="font-display text-[clamp(48px,6vw,72px)] font-bold leading-none text-oat">{SHOP.rating.toFixed(1)}</span>
          <span className="flex flex-col gap-1.5">
            <span className="relative inline-flex" aria-hidden="true">
              <StarRow size={24} dim />
              <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill}%` }}>
                <StarRow size={24} />
              </span>
            </span>
            <span className="text-[15px] text-oat-2">{SHOP.reviews}+ Google reviews</span>
          </span>
        </a>
        <button type="button" className="pill pill-ghost" onClick={(e) => setQr(e.currentTarget)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 20h2M20 14v2" />
          </svg>
          Share wall / QR link
        </button>
        </div>

        <div className="mt-[clamp(32px,5vw,56px)] grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div
            ref={wall}
            className={`relative min-w-0 rounded-card tactile ${mobile ? "overflow-hidden" : "h-[760px] overflow-hidden"}`}
            style={{
              background:
                "radial-gradient(1px 1px at 20% 30%, rgba(35,23,18,.10) 50%, transparent 51%), radial-gradient(1px 1px at 70% 60%, rgba(255,77,141,.18) 50%, transparent 51%), radial-gradient(120% 90% at 30% 0%, #FFF5F9 0%, #FFEBF2 60%, #FFE0EC 100%)",
              border: "2px solid #231712",
              backgroundSize: "26px 26px, 38px 38px, auto",
              boxShadow: "5px 5px 0 #231712, inset 0 0 50px rgba(255,214,170,.35)",
            }}
          >
            <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 400 300" fill="none" stroke="#231712" strokeOpacity=".08" strokeWidth="1.6" strokeLinecap="round">
              <path d="M30 40c30-18 52 14 82-6s40-14 62 2" />
              <path d="M300 250c20-30 42 10 62-14" />
              <path d="M40 270c24-14 30 10 56-4" />
              <path d="M330 40l10 14 14-18M350 90c10 8 24 4 30-6" />
              <circle cx="210" cy="150" r="22" />
            </svg>
            {mobile ? (
              <div ref={row} className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-px-5 px-5 pb-6 pt-8" style={{ touchAction: "pan-x pan-y" }} tabIndex={-1}>
                {list.map((n, i) => <Note key={n.id} n={n} i={i} free={false} wallRef={wall} zRef={z} onRemove={remove} />)}
              </div>
            ) : (
              list.map((n, i) => <Note key={n.id} n={n} i={i} free wallRef={wall} zRef={z} onRemove={remove} />)
            )}
          </div>
          <DoodlePad onPin={pin} />
          {qr && <WallQR opener={qr} onClose={() => setQr(null)} />}
        </div>
        <p className="mt-4 text-[14px] text-oat-3">{mobile ? "Swipe the notes sideways to read them all." : "Drag a note around, or focus one and use the arrow keys."}</p>
      </div>
    </section>
  );
}

export default function MenuAndWall() {
  return (
    <>
      <Menu />
      <ScribbleWall />
    </>
  );
}
