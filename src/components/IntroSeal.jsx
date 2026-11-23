// "Pierce the seal" intro: a top-down sealed cup lid. Click/Enter drives the pink straw through the
// film with a pop, then the overlay zooms away to reveal the hero. Shown once per browser session
// (sessionStorage, guarded), never under prefers-reduced-motion. Escape or Skip dismisses it.
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { sfx } from "../sfx.js";
import { uiActions, getUI, INTRO_KEY } from "../ui/store.js";

const PEARLS = Array.from({ length: 26 }, (_, i) => {
  const a = i * 2.399, r = 22 + Math.sqrt(i / 26) * 108; // golden-angle scatter
  return [200 + Math.cos(a) * r, 200 + Math.sin(a) * r, 9 + ((i * 7) % 5)];
});
const CRACKS = Array.from({ length: 9 }, (_, i) => {
  const a = (i / 9) * Math.PI * 2 + (i % 2) * 0.2, l = 26 + ((i * 13) % 22);
  return `M200 200 L${200 + Math.cos(a) * l} ${200 + Math.sin(a) * l}`;
});

export default function IntroSeal() {
  const [show, setShow] = useState(() => !getUI().introDone);
  const root = useRef(null), lid = useRef(null), straw = useRef(null), hole = useRef(null), prompt = useRef(null), btn = useRef(null);
  const busy = useRef(false);

  const finish = () => {
    try { sessionStorage.setItem(INTRO_KEY, "1"); } catch (e) {}
    document.body.style.overflow = "";
    uiActions.setIntroDone(true);
    setShow(false);
  };

  const skip = () => {
    if (busy.current) return;
    busy.current = true;
    gsap.to(root.current, { opacity: 0, duration: 0.45, ease: "power2.out", onComplete: finish });
  };

  const pierce = () => {
    if (busy.current) return;
    busy.current = true;
    const tl = gsap.timeline({ onComplete: finish });
    tl.to(prompt.current, { opacity: 0, y: 8, duration: 0.25 }, 0)
      .to(straw.current, { x: 0, y: 0, rotation: 0, duration: 0.42, ease: "power2.in" }, 0)
      .to(straw.current, { scaleY: 0.62, scaleX: 0.92, duration: 0.18, ease: "power3.in" }, 0.36)
      .call(() => sfx("pierce"), null, 0.3)
      .fromTo(hole.current, { scale: 0, opacity: 0, svgOrigin: "200 200" }, { scale: 1, opacity: 1, duration: 0.28, ease: "back.out(3)" }, 0.44)
      .fromTo(".seal-crack", { strokeDashoffset: 60 }, { strokeDashoffset: 0, duration: 0.3, stagger: 0.015, ease: "power2.out" }, 0.44)
      .fromTo(".seal-ripple", { scale: 0.2, opacity: 0.8, svgOrigin: "200 200" }, { scale: 1.6, opacity: 0, duration: 0.8, ease: "power2.out" }, 0.44)
      .to(lid.current, { scale: 0.96, duration: 0.08, yoyo: true, repeat: 1, ease: "power1.inOut" }, 0.44)
      .to(lid.current, { scale: 7, opacity: 0, duration: 0.9, ease: "power3.in" }, 0.95)
      .to(root.current, { opacity: 0, duration: 0.45, ease: "power1.in" }, 1.4);
  };

  useEffect(() => {
    if (!show) return;
    document.body.style.overflow = "hidden";
    btn.current && btn.current.focus({ preventScroll: true });
    const ctx = gsap.context(() => {
      gsap.set(straw.current, { svgOrigin: "200 200", x: 70, y: -70 });
      gsap.set(lid.current, { transformOrigin: "50% 50%" });
      gsap.from(lid.current, { scale: 0.85, opacity: 0, duration: 0.9, ease: "power3.out" });
      gsap.from(straw.current, { x: 160, y: -160, opacity: 0, duration: 1, delay: 0.3, ease: "power3.out" });
      gsap.to(straw.current, { y: -48, duration: 1.4, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 1.3 });
    }, root);
    const onKey = (e) => {
      if (e.key === "Escape") { e.preventDefault(); skip(); }
      else if (e.key === "Tab") { // keep focus on the two controls
        const items = [...root.current.querySelectorAll("button")];
        const i = items.indexOf(document.activeElement);
        e.preventDefault();
        items[(i + (e.shiftKey ? -1 : 1) + items.length) % items.length].focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => { ctx.revert(); document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  if (!show) return null;
  return (
    <div ref={root} role="dialog" aria-modal="true" aria-label="Welcome. Pierce the seal to enter the site."
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden px-4"
      style={{ background: "radial-gradient(80% 70% at 50% 45%, #FFE4EE 0%, #FBF6EE 60%, #F3EADC 100%)" }}>
      <style>{`
        @keyframes sealPulse { 0%,100% { opacity:.55; transform: scale(1) } 50% { opacity:1; transform: scale(1.04) } }
        @keyframes sealSheen { from { transform: translateX(-60%) rotate(25deg) } to { transform: translateX(60%) rotate(25deg) } }
        .seal-pulse { animation: sealPulse 1.8s ease-in-out infinite; }
        .seal-sheen { animation: sealSheen 4.5s ease-in-out infinite alternate; }
      `}</style>

      <button type="button" onClick={skip}
        className="pill pill-ghost absolute right-[var(--pad)] top-5" style={{ minHeight: 40 }}>
        Skip
      </button>

      <p className="m-0 mb-6 font-display text-[clamp(20px,2.4vw,28px)] italic text-oat">
        You had me <span className="text-neon-2">@</span> boba
      </p>

      <button ref={btn} type="button" onClick={pierce} data-cursor="SIP" aria-label="Pierce the seal and enter"
        className="relative aspect-square w-[min(78vw,58svh,440px)] rounded-full focus-visible:outline-offset-8" style={{ borderRadius: "50%" }}>
        <svg ref={lid} viewBox="0 0 400 400" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
          <defs>
            <radialGradient id="sealTea" cx="45%" cy="40%" r="65%">
              <stop offset="0" stopColor="#C89466" /><stop offset=".55" stopColor="#8A5530" /><stop offset="1" stopColor="#3E2010" />
            </radialGradient>
            <radialGradient id="sealFilm" cx="38%" cy="32%" r="75%">
              <stop offset="0" stopColor="#FFF6EC" stopOpacity=".42" /><stop offset=".6" stopColor="#F6EFE6" stopOpacity=".16" /><stop offset="1" stopColor="#F6EFE6" stopOpacity=".3" />
            </radialGradient>
            <linearGradient id="sealRim" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#FFFFFF" stopOpacity=".85" /><stop offset=".45" stopColor="#F6EFE6" stopOpacity=".18" /><stop offset="1" stopColor="#FFB36B" stopOpacity=".5" />
            </linearGradient>
            <linearGradient id="sealStraw" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#E85A80" /><stop offset=".35" stopColor="#FFB0C4" /><stop offset=".6" stopColor="#FF7A9C" /><stop offset="1" stopColor="#C9476A" />
            </linearGradient>
            <clipPath id="sealClip"><circle cx="200" cy="200" r="152" /></clipPath>
            <path id="sealText" d="M200 200 m-122 0 a122 122 0 1 1 244 0 a122 122 0 1 1 -244 0" />
          </defs>
          {/* glow + cup rim */}
          <circle cx="200" cy="200" r="190" fill="rgba(255,77,141,.12)" />
          <circle cx="204" cy="206" r="174" fill="#231712" />
          <circle cx="200" cy="200" r="172" fill="#F3EADC" stroke="#231712" strokeWidth="3" />
          <circle cx="200" cy="200" r="163" fill="none" stroke="url(#sealRim)" strokeWidth="8" />
          {/* drink under the film */}
          <g clipPath="url(#sealClip)">
            <circle cx="200" cy="200" r="152" fill="url(#sealTea)" />
            {PEARLS.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="#24120B" opacity=".75" />)}
            <circle cx="200" cy="200" r="152" fill="url(#sealFilm)" />
            <g className="seal-sheen"><rect x="40" y="-60" width="70" height="520" fill="rgba(255,255,255,.14)" /></g>
            <text fill="rgba(42,15,22,.55)" fontFamily="Fraunces, Georgia, serif" fontStyle="italic" fontSize="17" letterSpacing="2">
              <textPath href="#sealText">you had me @ boba · west poplar · collierville · you had me @ boba · open till ten ·</textPath>
            </text>
            <text x="200" y="214" textAnchor="middle" fill="rgba(42,15,22,.5)" fontFamily="Fraunces, Georgia, serif" fontStyle="italic" fontWeight="300" fontSize="56">@</text>
          </g>
          {/* puncture */}
          <circle className="seal-ripple" cx="200" cy="200" r="60" fill="none" stroke="rgba(255,240,230,.55)" strokeWidth="2" opacity="0" />
          <g ref={hole} opacity="0">
            {CRACKS.map((d, i) => <path key={i} className="seal-crack" d={d} stroke="rgba(255,246,236,.75)" strokeWidth="1.6" strokeDasharray="60" fill="none" />)}
            <circle cx="200" cy="200" r="15" fill="#2A140B" stroke="rgba(255,246,236,.6)" strokeWidth="2" />
          </g>
          {/* straw: comes in from the top right, tip over the center */}
          <g ref={straw}>
            <ellipse cx="200" cy="206" rx="24" ry="9" fill="rgba(0,0,0,.35)" />
            <g transform="rotate(38 200 200)">
              <rect x="186" y="-140" width="28" height="340" rx="4" fill="url(#sealStraw)" />
              <ellipse cx="200" cy="200" rx="14" ry="6" fill="#B23A5C" />
              <rect x="191" y="-140" width="5" height="336" fill="rgba(255,255,255,.35)" />
            </g>
          </g>
        </svg>
      </button>

      <p ref={prompt} className="seal-pulse m-0 mt-8 text-[16px] text-oat" aria-hidden="true">Tap to pierce the seal</p>
    </div>
  );
}
