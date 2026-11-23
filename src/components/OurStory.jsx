// "Our Story": sits between the Menu and the Lookbook. All copy lives in data.js STORY
// (needs the owner's confirmation: 4-hour pearls, real fruit, ceremonial matcha, hours framing).
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { STORY, reduceMotion } from "../data.js";

gsap.registerPlugin(ScrollTrigger);

const ICONS = {
  // simmering pot with pearls
  pearls: (
    <>
      <path d="M8 22h32l-3 15a4 4 0 0 1-4 3H15a4 4 0 0 1-4-3L8 22z" />
      <path d="M5 22h38" />
      <path d="M17 15c0-3 3-3 3-6M24 15c0-3 3-3 3-6M31 15c0-3 3-3 3-6" />
      <circle cx="18" cy="30" r="2.2" /><circle cx="25" cy="32" r="2.2" /><circle cx="31" cy="29" r="2.2" />
    </>
  ),
  // leaf over a fruit slice
  fruit: (
    <>
      <circle cx="24" cy="28" r="12" />
      <path d="M24 16v24M12 28h24M15.5 19.5l17 17M32.5 19.5l-17 17" opacity=".55" />
      <path d="M24 16c2-6 8-9 14-8-1 6-6 10-14 8z" />
    </>
  ),
  // crescent moon and clock hands
  late: (
    <>
      <path d="M33 8a15 15 0 1 0 7 25A13 13 0 0 1 33 8z" />
      <path d="M22 18v8l5 3" />
      <circle cx="38" cy="12" r="1.2" /><circle cx="42" cy="20" r=".9" />
    </>
  ),
};

export default function OurStory() {
  const root = useRef(null);

  useEffect(() => {
    if (reduceMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from(".story-line", {
        yPercent: 105, duration: 1, ease: "power4.out", stagger: 0.08,
        scrollTrigger: { trigger: ".story-title", start: "top 85%" },
      });
      gsap.from(".story-p", {
        y: 24, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.12,
        scrollTrigger: { trigger: ".story-body", start: "top 85%" },
      });
      gsap.from(".story-pillar", {
        y: 40, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.12,
        scrollTrigger: { trigger: ".story-pillars", start: "top 88%" },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  const [a, b] = STORY.title.split(". ");
  return (
    <section ref={root} id="story" aria-labelledby="story-title"
      className="theme-dark relative overflow-hidden px-[clamp(20px,5vw,72px)] py-[clamp(90px,12vw,160px)]"
      style={{ background: "radial-gradient(90% 70% at 85% 20%, rgba(255,77,141,.22), transparent 60%), radial-gradient(70% 60% at 5% 90%, rgba(255,179,107,.14), transparent 60%), #231712" }}>
      <div className="relative mx-auto max-w-[1200px]">
        <p className="mb-4 text-[15px] font-medium text-neon-2">{STORY.eyebrow}</p>
        <h2 id="story-title" className="story-title m-0 max-w-[20ch] font-display text-[clamp(38px,5.8vw,84px)] font-bold leading-[1.0] tracking-[-.02em]">
          <span className="block overflow-hidden pb-[.06em]"><span className="story-line block">{a}.</span></span>
          <span className="block overflow-hidden pb-[.06em]"><span className="story-line block italic font-medium text-neon">{b}</span></span>
        </h2>

        <div className="story-body mt-[clamp(32px,5vw,60px)] grid gap-6 md:grid-cols-2 md:gap-[clamp(32px,5vw,80px)]">
          {STORY.paragraphs.map((p, i) => (
            <p key={i} className="story-p m-0 max-w-[52ch] text-[clamp(16px,1.35vw,19px)] leading-[1.7] text-oat-2">{p}</p>
          ))}
        </div>

        <ul className="story-pillars theme-light m-0 mt-[clamp(48px,7vw,96px)] grid list-none gap-4 p-0 md:grid-cols-3 md:gap-5">
          {STORY.pillars.map((pl) => (
            <li key={pl.id} className="story-pillar group relative overflow-hidden rounded-card tactile p-6 sm:p-7" style={{ background: { pearls: "#FFE9F0", fruit: "#EAF4E3", late: "#FFF3D9" }[pl.id] }}>
              <span aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                style={{ background: "radial-gradient(circle, rgba(255,77,141,.18), transparent 70%)" }} />
              <svg viewBox="0 0 48 48" aria-hidden="true" className="h-12 w-12 text-ink" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                {ICONS[pl.id]}
              </svg>
              <h3 className="m-0 mt-5 font-display text-[clamp(21px,1.9vw,26px)] font-semibold leading-tight text-oat">{pl.title}</h3>
              <p className="m-0 mt-1 text-[14px] font-medium text-neon-2">{pl.sub}</p>
              <p className="m-0 mt-3 text-[15px] leading-relaxed text-oat-2">{pl.text}</p>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-[12.5px] text-oat-3" style={{ color: "rgba(251,246,238,.66)" }}>Pitch copy, to be confirmed with the shop.</p>
      </div>
    </section>
  );
}
