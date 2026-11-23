import { lazy, Suspense, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BROWN_SUGAR, SECRET_DRINK, SHOP, reduceMotion, finePointer } from "../data.js";
import { phoneClick } from "../ui/phone.js";
import { getUI, subscribeUI, uiActions } from "../ui/store.js";
import { scrollToTarget } from "../scroll.js";
import { sfx } from "../sfx.js";

gsap.registerPlugin(ScrollTrigger);

const BobaCup = lazy(() => import("../three/BobaCup.jsx"));
const TOPPINGS = ["tapioca"];

const LINES = ["You had", "me @", "Boba"];

// Luminous multi-flavor mesh: soft radial splashes pooling at the edges and corners.
// [color, left, top, size (vmax), parallax depth (px)]
const SPLASHES = [
  ["#FF6FA5", "-12%", "-18%", 62, 34],   // strawberry, top-left
  ["#FFB35C", "72%", "-22%", 58, 26],    // mango, top-right
  ["#F7C97E", "38%", "70%", 60, 18],     // caramel, bottom-centre
  ["#FF6FA5", "78%", "62%", 56, 40],     // strawberry, bottom-right
  ["#FFB35C", "-18%", "58%", 52, 30],    // mango, bottom-left
  ["#CFE9BE", "-8%", "26%", 34, 22],     // matcha pastel, left edge
  ["#DCCBF4", "52%", "-14%", 36, 16],    // taro pastel, top-centre
];

// golden pearls spray out of the cup (DOM, so it works even before the 3D chunk loads)
function goldenBurst(host) {
  if (!host || reduceMotion()) return;
  for (let i = 0; i < 26; i++) {
    const d = document.createElement("span");
    const s = 8 + Math.random() * 12;
    Object.assign(d.style, {
      position: "absolute", left: -s / 2 + "px", top: -s / 2 + "px", width: s + "px", height: s + "px", borderRadius: "50%",
      background: "radial-gradient(circle at 35% 30%, #FFF4C2, #E8B84A 45%, #8A5A12 100%)",
      boxShadow: "0 0 14px rgba(255,200,90,.8)",
    });
    host.appendChild(d);
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4, v = 160 + Math.random() * 260;
    gsap.timeline({ onComplete: () => d.remove() })
      .to(d, { x: Math.cos(a) * v, y: Math.sin(a) * v, duration: 0.7, ease: "power2.out" })
      .to(d, { y: "+=" + (220 + Math.random() * 160), opacity: 0, duration: 0.9, ease: "power2.in" });
  }
}

export default function HeroCup() {
  const sectionRef = useRef(null);
  const contentRef = useRef(null);
  const prog = useRef(0);
  const burstRef = useRef(null);
  const taps = useRef([]);
  const [burst, setBurst] = useState(0);
  const [toast, setToast] = useState(false);
  const toastT = useRef(0);
  useEffect(() => () => clearTimeout(toastT.current), []);

  // secret menu: 5 shakes within 4 seconds
  const onShake = () => {
    const now = performance.now();
    taps.current = [...taps.current.filter((t) => now - t < 4000), now];
    if (taps.current.length < 5) return;
    taps.current = [];
    setBurst((n) => n + 1);
    uiActions.unlockSecret();
    sfx("pop");
    goldenBurst(burstRef.current);
    setToast(true);
    clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setToast(false), 9000);
  };
  const tryIt = () => {
    setToast(false);
    uiActions.pickDrink(SECRET_DRINK.id);
    const lab = document.getElementById("lab");
    if (lab) scrollToTarget(lab);
  };

  // scroll-linked cup progress (pin) on tablets and up
  useEffect(() => {
    if (reduceMotion()) return;
    const mm = gsap.matchMedia();
    mm.add("(min-width: 768px)", () => {
      const st = ScrollTrigger.create({
        trigger: sectionRef.current, start: "top top", end: () => "+=" + Math.round(window.innerHeight * 0.6),
        pin: true, scrub: true, invalidateOnRefresh: true, onUpdate: (self) => { prog.current = self.progress; },
      });
      return () => { st.kill(); prog.current = 0; };
    });
    return () => mm.revert();
  }, []);

  // ---------- mesh splashes drift toward the pointer (transform only; static on touch / reduced motion) ----------
  const meshRef = useRef(null);
  useEffect(() => {
    if (reduceMotion() || !finePointer()) return;
    const sec = sectionRef.current;
    const blobs = [...meshRef.current.children];
    const movers = blobs.map((b) => ({ x: gsap.quickTo(b, "x", { duration: 1.6, ease: "power3" }), y: gsap.quickTo(b, "y", { duration: 1.6, ease: "power3" }), d: +b.dataset.depth }));
    const onMove = (e) => {
      const r = sec.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
      movers.forEach((m) => { m.x(nx * m.d * 2); m.y(ny * m.d * 2); });
    };
    sec.addEventListener("pointermove", onMove);
    return () => { sec.removeEventListener("pointermove", onMove); gsap.killTweensOf(blobs); };
  }, []);

  // ---------- headline load-in + scroll drift ----------
  useEffect(() => {
    if (reduceMotion()) return;
    let off = () => {};
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: !getUI().introDone });
      tl.from(".hc-ch", { yPercent: 115, rotate: 5, duration: 1.05, ease: "power4.out", stagger: 0.04 }, 0.1);
      tl.from(".hc-fade", { y: 18, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.12 }, 0.7);
      // wait for the "pierce the seal" intro to finish before the headline lands
      if (!getUI().introDone) off = subscribeUI(() => { if (getUI().introDone) { off(); tl.play(0); } });
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px)", () => {
        gsap.to(contentRef.current, {
          y: () => -window.innerHeight * 0.14, opacity: 0.35, ease: "none",
          scrollTrigger: { trigger: sectionRef.current, start: "top top", end: () => "+=" + Math.round(window.innerHeight * 0.6), scrub: true, invalidateOnRefresh: true },
        });
      });
    }, sectionRef);
    return () => { off(); ctx.revert(); };
  }, []);

  return (
    <section
      ref={sectionRef} id="top" data-cursor="SHAKE" aria-label="You Had Me @ Boba, boba tea in Collierville"
      className="hc relative w-full overflow-hidden text-oat"
      style={{ minHeight: "max(100svh, 640px)", background: "#FFE7DA" }}
    >
      <style>{`
        @keyframes hcGlow { 0%,100% { opacity:.85; transform:scale(1) } 18% { opacity:.62 } 22% { opacity:.9 } 55% { opacity:.78; transform:scale(1.05) } 60% { opacity:.6 } 64% { opacity:.88 } }
        @keyframes hcSign { 0%,100% { opacity:1 } 41% { opacity:1 } 43% { opacity:.55 } 45% { opacity:1 } 47% { opacity:.7 } 49% { opacity:1 } }
        @keyframes hcCupIn { from { opacity:0 } to { opacity:1 } }
        .hc-cup { animation: hcCupIn 1.2s ease .3s both; }
        .hc-glow { animation: hcGlow 6.5s ease-in-out infinite; }
        .hc-at { animation: hcSign 7s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .hc-glow, .hc-at, .hc-cup { animation: none } }
      `}</style>

      {/* playful boba stickers */}
      <span aria-hidden="true" className="sticker sticker-pink hc-fade pointer-events-none absolute z-[2] max-[859px]:right-[5%] max-[859px]:bottom-[30%] min-[860px]:right-[38%] min-[860px]:top-[22%]" style={{ "--r": "-8deg" }}>Fresh pearls</span>
      <span aria-hidden="true" className="sticker sticker-matcha hc-fade pointer-events-none absolute z-[2] max-[859px]:left-[6%] max-[859px]:bottom-[6%] min-[860px]:right-[6%] min-[860px]:bottom-[16%]" style={{ "--r": "7deg", animationDelay: "-2s" }}>Collierville, TN</span>
      {/* luminous mesh backdrop: each splash is painted once and only moved with transforms */}
      <div ref={meshRef} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {SPLASHES.map(([c, l, t, size, depth], k) => (
          <span key={k} data-depth={depth} className="hc-splash absolute rounded-full"
            style={{ left: l, top: t, width: size + "vmax", height: size + "vmax", background: `radial-gradient(circle at 50% 50%, ${c} 0%, ${c}cc 28%, ${c}00 68%)`, animationDelay: `${-k * 2.3}s` }} />
        ))}
        {/* milky center so the type and cup sit on a lighter pool */}
        <span className="absolute inset-0" style={{ background: "radial-gradient(55% 50% at 40% 48%, rgba(255,247,238,.72) 0%, rgba(255,247,238,0) 70%)" }} />
      </div>

      <div className="hc-cup isolate absolute z-[1] max-[859px]:inset-x-0 max-[859px]:bottom-0 max-[859px]:h-[42svh] min-[860px]:right-[1%] min-[860px]:top-1/2 min-[860px]:h-[92svh] min-[860px]:w-[48%] min-[860px]:-translate-y-1/2">
        <span aria-hidden="true" className="hc-halo pointer-events-none absolute left-1/2 top-[50%] -z-[1] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full max-[859px]:w-[min(88vw,420px)] min-[860px]:w-[min(44vw,640px)]" />
        <Suspense fallback={null}>
          <BobaCup className="relative h-full w-full" drink={BROWN_SUGAR} mode="hero" sweetness={100} ice="regular" toppings={TOPPINGS} scrollProgress={prog} onShake={onShake} burst={burst} />
        </Suspense>
        <div ref={burstRef} aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[55%] h-0 w-0" />
      </div>

      <div role="status" aria-live="polite" className="absolute bottom-6 left-[var(--pad)] right-[var(--pad)] z-20 flex justify-center md:justify-start">
        {toast && (
          <div className="secret-toast pointer-events-auto flex max-w-[460px] flex-wrap items-center gap-3 rounded-[18px] tactile px-5 py-4">
            <p className="m-0 flex-1 text-[15px] leading-snug text-oat">
              <span className="font-display italic text-[#7A4E0C]">Secret menu unlocked.</span> The Poplar Midnight Tiger is waiting in the drink lab.
            </p>
            <button type="button" onClick={tryIt} className="pill pill-neon" style={{ minHeight: 40 }}>Try it</button>
          </div>
        )}
      </div>

      <div ref={contentRef} className="pointer-events-none relative z-10 flex w-full flex-col justify-center px-[var(--pad)] pb-14 pt-24 md:pt-[96px] max-[859px]:justify-start max-[859px]:pt-28 max-[859px]:pb-[min(340px,40svh)]" style={{ minHeight: "max(100svh, 640px)" }}>
        <p className="hc-fade m-0 mb-4 font-sans text-[15px] font-semibold text-ink">
          Collierville · open daily 11 AM – 10 PM ·{" "}
          <a href={`tel:${SHOP.tel}`} onClick={phoneClick} className="pointer-events-auto whitespace-nowrap text-ink underline decoration-ink/40 underline-offset-4 hover:decoration-neon">{SHOP.phone}</a>
        </p>

        <h1 aria-label="You had me @ Boba" className="m-0 font-display font-extrabold uppercase text-ink"
          style={{ textShadow: "0 2px 0 rgba(255,247,238,.55), 0 0 28px rgba(255,247,238,.45)", fontSize: "clamp(64px, 10.8vw, 168px)", lineHeight: 0.86, letterSpacing: "-0.035em", fontVariationSettings: '"opsz" 144', fontWeight: 800 }}>
          {LINES.map((line) => (
            <span key={line} aria-hidden="true" className="block overflow-hidden" style={{ paddingBlock: "0.07em", marginBlock: "-0.07em", paddingRight: "0.06em" }}>
              {line.split("").map((ch, i) =>
                ch === " " ? <span key={i} className="inline-block" style={{ width: "0.2em" }} />
                : ch === "@" ? (
                  <span key={i} className="hc-ch hc-at inline-block italic text-neon"
                    style={{ fontWeight: 400, color: "#FF4D8D", WebkitTextStroke: "0.025em #231712", textShadow: "0.04em 0.04em 0 #231712" }}>@</span>
                ) : <span key={i} className="hc-ch inline-block">{ch}</span>
              )}
            </span>
          ))}
        </h1>

        <p className="hc-fade mb-0 mt-7 max-w-[46ch] font-sans text-[17px] font-medium leading-relaxed text-ink">
          Hand-whisked ceremonial matcha, slow-cooked brown sugar pearls, and West Poplar's viral Dubai strawberry chocolate cups, crafted fresh to order.
        </p>

        <div className="hc-fade pointer-events-auto mt-7 flex flex-wrap gap-3">
          <a className="pill pill-ink magnetic" href="#visit" data-cursor="SIP">Order now</a>
          <a className="pill pill-ghost magnetic" href="#lab" data-cursor="MIX">Build a drink</a>
        </div>
      </div>

      <p aria-hidden="true" className="hc-fade pointer-events-none absolute bottom-6 right-[var(--pad)] z-10 m-0 hidden font-sans text-[13px] font-semibold text-ink md:block">
        Tap the cup to shake it, drag to spin
      </p>
    </section>
  );
}
