// "Top 3 crowd favorites": a full-bleed color-splash showcase between the hero ticker and the Drink Lab.
// Switching 01 / 02 / 03 (pills, arrows, arrow keys or a horizontal swipe) floods the section and its edge
// vignette with that flavor's color. Copy and colors live in data.js SHOWCASE (partly unconfirmed).
// Reuses the lazy BobaCup chunk; its canvas pauses itself when scrolled out of view.
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { SHOWCASE, DRINKS, DUBAI, money } from "../data.js";
import { uiActions } from "../ui/store.js";
import { bagActions } from "../order/store.js";
import { scrollToTarget } from "../scroll.js";
import { sfx } from "../sfx.js";

const BobaCup = lazy(() => import("../three/BobaCup.jsx"));
const CUP_TOPPINGS = { brownsugar: ["tapioca"], matcha: ["tapioca", "foam"], dubai: ["popping"] };

/* ---- decorative garnishes (pure SVG, aria-hidden) ---- */
const Pearl = ({ s = 40 }) => (
  <svg width={s} height={s} viewBox="0 0 40 40"><defs><radialGradient id="gp" cx="35%" cy="30%" r="70%"><stop offset="0" stopColor="#7A4A30" /><stop offset=".5" stopColor="#2B1710" /><stop offset="1" stopColor="#120905" /></radialGradient></defs>
    <circle cx="20" cy="20" r="18" fill="url(#gp)" /><ellipse cx="14" cy="12" rx="5" ry="3.4" fill="#fff" opacity=".55" transform="rotate(-30 14 12)" /></svg>
);
const Ice = ({ s = 60 }) => (
  <svg width={s} height={s} viewBox="0 0 60 60"><rect x="6" y="6" width="48" height="48" rx="12" fill="rgba(235,248,255,.45)" stroke="rgba(255,255,255,.85)" strokeWidth="2" />
    <path d="M14 18c4-5 10-6 16-5" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".8" fill="none" /></svg>
);
const Leaf = ({ s = 70 }) => (
  <svg width={s} height={s} viewBox="0 0 70 70"><path d="M8 62C10 30 30 10 62 8 60 40 40 60 8 62z" fill="#9BD47F" stroke="#2F5E26" strokeWidth="2.5" />
    <path d="M10 60C26 44 40 30 58 12" stroke="#2F5E26" strokeWidth="2" fill="none" /></svg>
);
const Foam = ({ s = 60 }) => (
  <svg width={s} height={s} viewBox="0 0 60 60"><circle cx="24" cy="30" r="16" fill="#E8F6D9" /><circle cx="38" cy="26" r="12" fill="#F4FBEC" /><circle cx="34" cy="38" r="10" fill="#DDF0CB" /></svg>
);
const Berry = ({ s = 64 }) => (
  <svg width={s} height={s} viewBox="0 0 64 64"><path d="M32 58C14 46 8 32 12 22c4-9 14-10 20-5 6-5 16-4 20 5 4 10-2 24-20 36z" fill="#E8274F" stroke="#7A0F26" strokeWidth="2" />
    {[[24, 28], [36, 26], [30, 36], [22, 40], [40, 38], [31, 47]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="1.6" ry="2.4" fill="#FFE27A" />)}
    <path d="M20 16c6 2 9 2 12-2 3 4 6 4 12 2-3-5-8-6-12-4-4-2-9-1-12 4z" fill="#3E8A2E" /></svg>
);
const Pistachio = ({ s = 44 }) => (
  <svg width={s} height={s} viewBox="0 0 44 44"><ellipse cx="22" cy="22" rx="18" ry="12" fill="#C9B48A" transform="rotate(-25 22 22)" /><ellipse cx="22" cy="22" rx="12" ry="8" fill="#8DBA4E" transform="rotate(-25 22 22)" /></svg>
);
const GARNISH = {
  pearls: [[Pearl, 64, "8%", "14%", 0], [Pearl, 34, "18%", "70%", 4], [Ice, 110, "84%", "10%", 8], [Pearl, 90, "88%", "74%", 6], [Ice, 70, "4%", "82%", 3]],
  matcha: [[Leaf, 110, "6%", "12%", 6], [Foam, 70, "16%", "74%", 0], [Leaf, 80, "86%", "70%", 3], [Foam, 120, "84%", "8%", 8], [Leaf, 50, "48%", "88%", 2]],
  berry: [[Berry, 110, "6%", "10%", 7], [Pistachio, 50, "18%", "76%", 0], [Berry, 70, "86%", "72%", 3], [Pistachio, 90, "84%", "12%", 8], [Berry, 46, "50%", "86%", 2]],
};

export default function Showcase() {
  const [i, setI] = useState(0);
  const sec = useRef(null);
  const swipe = useRef(null);
  const [added, setAdded] = useState(false);
  const s = SHOWCASE[i];
  const drink = s.drinkId ? DRINKS.find((d) => d.id === s.drinkId) : DUBAI;
  const go = (n) => { setI((n + SHOWCASE.length) % SHOWCASE.length); setAdded(false); sfx("bloop"); };

  // horizontal swipe (touch or pen); vertical scrolling stays native via touch-action: pan-y
  useEffect(() => {
    const el = sec.current;
    const down = (e) => { if (e.pointerType === "mouse") return; swipe.current = { x: e.clientX, y: e.clientY }; };
    const up = (e) => {
      const st = swipe.current; swipe.current = null;
      if (!st) return;
      const dx = e.clientX - st.x, dy = e.clientY - st.y;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) setI((n) => (n + (dx < 0 ? 1 : -1) + SHOWCASE.length) % SHOWCASE.length);
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", () => { swipe.current = null; });
    return () => { el.removeEventListener("pointerdown", down); el.removeEventListener("pointerup", up); };
  }, []);

  const onKey = (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(i + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); go(i - 1); }
  };

  const action = () => {
    if (s.drinkId) {
      uiActions.pickDrink(s.drinkId);
      const lab = document.getElementById("lab");
      if (lab) scrollToTarget(lab);
    } else {
      bagActions.add({ id: DUBAI.id, name: DUBAI.name, price: DUBAI.price });
      sfx("pop"); setAdded(true);
    }
  };

  return (
    <section ref={sec} id="favorites" aria-roledescription="carousel" aria-label="Top 3 crowd favorites" onKeyDown={onKey}
      className="showcase relative isolate flex min-h-[max(92svh,640px)] w-full items-center overflow-hidden"
      style={{ touchAction: "pan-y", "--flood": s.flood, "--glow": s.glow }}>
      {/* color floods: one layer per flavor, cross-faded */}
      {SHOWCASE.map((x, k) => (
        <div key={x.n} aria-hidden="true" className="sc-flood absolute inset-0 -z-10" style={{ opacity: k === i ? 1 : 0,
          background: `radial-gradient(120% 95% at 50% 50%, ${x.flood} 42%, ${x.glow} 125%)`,
          boxShadow: `inset 0 0 160px 40px ${x.glow}99` }} />
      ))}

      {/* giant stacked type behind the cup */}
      <div key={"big" + i} aria-hidden="true" className="sc-big pointer-events-none absolute inset-0 -z-[5] flex flex-col items-center justify-center text-center">
        {s.big.map((line) => <span key={line} className="block">{line}</span>)}
      </div>

      {/* depth-of-field garnishes (grid columns use minmax(0, …) so the canvas can't push the layout wider) */}
      {Object.entries(GARNISH).map(([kind, items]) => (
        <div key={kind} aria-hidden="true" className="sc-garnish pointer-events-none absolute inset-0 -z-[4]" style={{ opacity: kind === s.garnish ? 1 : 0 }}>
          {items.map(([G, size, x, y, blur], k) => (
            <span key={k} className="sc-g absolute" style={{ left: x, top: y, filter: blur ? `blur(${blur}px)` : undefined, animationDelay: `${-k * 1.3}s`, opacity: blur > 5 ? 0.75 : 1 }}>
              <G s={size} />
            </span>
          ))}
        </div>
      ))}

      <div className="relative mx-auto grid w-full max-w-[1280px] items-center gap-6 px-[var(--pad)] py-16 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="text-[#FFF6E6] md:order-1">
          <p className="m-0 text-[15px] font-semibold tracking-[.12em]">TOP 3 CROWD FAVORITES</p>
          <p className="m-0 mt-6 font-display text-[64px] font-bold leading-none tabular-nums">{s.n}<span className="text-[24px] font-medium opacity-70"> / 03</span></p>
        </div>

        <div className="relative order-first h-[min(62svh,560px)] w-full min-w-0 md:order-2" style={{ transform: "rotate(-7deg)" }} data-cursor="DRAG">
          <Suspense fallback={null}>
            <BobaCup className="h-full w-full" drink={drink} mode="lab" sweetness={100} ice="less" toppings={CUP_TOPPINGS[drink.id] || []} />
          </Suspense>
        </div>

        <div className="text-[#FFF6E6] md:order-3">
          <div aria-live="polite">
            <h2 key={"t" + i} className="sc-in m-0 font-display text-[clamp(30px,3.4vw,46px)] font-bold leading-[1.02]">{s.title}</h2>
            <p key={"b" + i} className="sc-in m-0 mt-3 max-w-[34ch] text-[16px] leading-relaxed opacity-90">{s.blurb}</p>
            <p className="m-0 mt-3 font-display text-[26px] font-bold tabular-nums">{money(drink.price)}</p>
          </div>
          <button type="button" onClick={action} className="pill mt-5" style={{ background: "#FFF6E6" }}>
            {s.drinkId ? "Customize in Drink Lab" : added ? "Added to bag" : "Add to bag"}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {s.drinkId ? <path d="M8 3v10M4 9l4 4 4-4" /> : <path d="M8 3v10M3 8h10" />}
            </svg>
          </button>
          <div className="mt-8 flex items-center gap-2">
            <button type="button" onClick={() => go(i - 1)} aria-label="Previous favorite" className="sc-arrow">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 3L5 8l5 5" /></svg>
            </button>
            <div role="tablist" aria-label="Choose a favorite" className="flex gap-2">
              {SHOWCASE.map((x, k) => (
                <button key={x.n} type="button" role="tab" aria-selected={k === i} aria-label={`${x.n}: ${x.title}`} onClick={() => go(k)}
                  className={`sc-pill ${k === i ? "is-on" : ""}`}>{x.n}</button>
              ))}
            </div>
            <button type="button" onClick={() => go(i + 1)} aria-label="Next favorite" className="sc-arrow">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 3l5 5-5 5" /></svg>
            </button>
          </div>
          <p className="m-0 mt-3 text-[13px] opacity-75">Swipe, use the arrow keys, or tap a number.</p>
        </div>
      </div>
    </section>
  );
}
