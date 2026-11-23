import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import HeroCup from "./components/HeroCup.jsx";
import DrinkLab from "./components/DrinkLab.jsx";
import { Menu, ScribbleWall } from "./components/MenuAndWall.jsx";
import { Gallery, Footer } from "./components/GalleryAndFooter.jsx";
import OurStory from "./components/OurStory.jsx";
import Showcase from "./components/Showcase.jsx";
import Toast from "./components/Toast.jsx";
import IntroSeal from "./components/IntroSeal.jsx";
import ReceiptModal from "./components/ReceiptModal.jsx";
import CounterTicket from "./components/CounterTicket.jsx";
import { reduceMotion, finePointer, shopIsOpen } from "./data.js";
import { initSmoothScroll, scrollToTarget } from "./scroll.js";
import { sfx, setSound, onSoundChange } from "./sfx.js";
import OrderBag from "./order/OrderBag.jsx";
import { useBag, bagActions, bagCount } from "./order/store.js";

gsap.registerPlugin(ScrollTrigger);

const MARQUEE = ["Brown sugar boba", "Matcha milk tea", "Dubai strawberry cup", "Honeydew", "Taro", "Mango refresher", "Open till 10"];

/* ---------------------------------------------------------------- nav + sound toggle */
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [sound, setSoundState] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    let saved = false;
    try { saved = localStorage.getItem("yhm-sound") === "1"; } catch (e) {}
    if (saved) setSound(true);
    const off = onSoundChange(setSoundState);
    setSoundState(saved);
    return () => { window.removeEventListener("scroll", onScroll); off(); };
  }, []);

  const toggle = () => {
    const next = !sound;
    setSound(next);
    if (next) sfx("pop");
  };

  return (
    <header className={"nav" + (scrolled ? " scrolled" : "")}>
      <a className="nav-brand" href="#top" aria-label="You Had Me @ Boba, back to top">You Had Me <i>@</i> Boba</a>
      <OpenBadge />
      <nav className="nav-links" aria-label="Sections">
        <a href="#lab">Drink lab</a>
        <a href="#menu">Menu</a>
        <a href="#story">Our story</a>
        <a href="#wall">Reviews</a>
        <a href="#visit">Visit</a>
      </nav>
      <button className="sound-toggle" type="button" onClick={toggle} aria-pressed={sound}
        aria-label={sound ? "Turn sound effects off" : "Turn sound effects on"} title={sound ? "Sound on" : "Sound off"}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 9v6h4l5 4V5L8 9H4z" />
          {sound ? <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /> : <path d="m16 9.5 5 5m0-5-5 5" />}
        </svg>
      </button>
      <BagButton />
      <a className="pill pill-neon magnetic nav-order" href="#lab" data-cursor="SIP">Order now</a>
    </header>
  );
}

/* live open/closed badge (America/Chicago, same logic as the footer) */
function OpenBadge() {
  const [open, setOpen] = useState(shopIsOpen);
  useEffect(() => {
    const t = setInterval(() => setOpen(shopIsOpen()), 60000);
    return () => clearInterval(t);
  }, []);
  if (open === null) return null;
  return (
    <a href="#visit" className={"open-badge" + (open ? " is-open" : "")}
      aria-label={open ? "Open now on West Poplar, until 10 PM. See visit info." : "Closed now, opens at 11 AM. See visit info."}>
      <span className="open-dot" aria-hidden="true" />
      <span className="open-long">{open ? "Open now on West Poplar · until 10 PM" : "Closed · opens at 11 AM"}</span>
      <span className="open-short" aria-hidden="true">{open ? "Open" : "Closed"}</span>
    </a>
  );
}

function BagButton() {
  const { items } = useBag();
  const n = bagCount(items);
  return (
    <button id="bag-button" type="button" className="bag-button magnetic" data-cursor="BAG" onClick={bagActions.open}
      aria-label={n ? `Open your bag, ${n} item${n > 1 ? "s" : ""}` : "Open your bag"}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></svg>
      {n > 0 && <span className="bag-count">{n}</span>}
    </button>
  );
}

/* ---------------------------------------------------------------- kinetic marquee
   Drifts left on its own; scrolling speeds it up and scroll direction flips it, with a little skew. */
function Marquee() {
  const track = useRef(null);
  useEffect(() => {
    const el = track.current;
    if (!el || reduceMotion()) return;
    let x = 0, dir = 1, boost = 0, half = el.scrollWidth / 2;
    const ro = new ResizeObserver(() => { half = el.scrollWidth / 2; });
    ro.observe(el);
    const skewTo = gsap.quickTo(el, "skewX", { duration: 0.5, ease: "power3" });
    const st = ScrollTrigger.create({
      onUpdate(self) {
        const v = self.getVelocity();
        if (Math.abs(v) > 30) dir = v > 0 ? 1 : -1;
        boost = Math.min(Math.abs(v) / 120, 14);
        skewTo(gsap.utils.clamp(-8, 8, -v / 300));
      },
    });
    const tick = (_, dt) => {
      boost *= 0.94;
      if (boost < 0.05) skewTo(0);
      x -= dir * (0.9 + boost) * (dt / 16.67);
      if (x <= -half) x += half;
      if (x > 0) x -= half;
      gsap.set(el, { x });
    };
    gsap.ticker.add(tick);
    return () => { gsap.ticker.remove(tick); st.kill(); ro.disconnect(); };
  }, []);

  const row = (p) => MARQUEE.flatMap((t, i) => [<span key={p + "t" + i}>{t}</span>, <i key={p + "s" + i}>✦</i>]);
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track" ref={track}>{row("a")}{row("b")}</div>
    </div>
  );
}

/* ---------------------------------------------------------------- custom cursor
   A small dot that grows into a labelled disc over anything with data-cursor="LABEL". */
function Cursor() {
  const dot = useRef(null);
  const label = useRef(null);
  useEffect(() => {
    if (!finePointer()) return;
    const el = dot.current;
    document.documentElement.classList.add("has-cursor");
    const moveX = gsap.quickTo(el, "x", { duration: reduceMotion() ? 0 : 0.18, ease: "power3" });
    const moveY = gsap.quickTo(el, "y", { duration: reduceMotion() ? 0 : 0.18, ease: "power3" });
    let current = "";
    const onMove = (e) => {
      moveX(e.clientX); moveY(e.clientY);
      el.classList.remove("hidden");
      const target = e.target instanceof Element ? e.target : null;
      // text fields keep the normal caret and hide the disc
      if (target && target.closest("input, textarea, select")) { el.classList.add("hidden"); return; }
      const host = target && target.closest("[data-cursor]");
      const next = host ? host.getAttribute("data-cursor") : "";
      if (next !== current) {
        current = next;
        label.current.textContent = next;
        el.classList.toggle("big", !!next);
      }
    };
    const onLeave = () => el.classList.add("hidden");
    const onDown = () => gsap.to(el, { scale: 0.82, duration: 0.15 });
    const onUp = () => gsap.to(el, { scale: 1, duration: 0.4, ease: "elastic.out(1, .5)" });
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    return () => {
      document.documentElement.classList.remove("has-cursor");
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);
  return <div className="cursor hidden" ref={dot} aria-hidden="true"><span className="cursor-label" ref={label} /></div>;
}

/* ---------------------------------------------------------------- magnetic pull for every .magnetic element */
function useMagnetic() {
  useEffect(() => {
    if (!finePointer() || reduceMotion()) return;
    let active = null;
    const release = (el) => gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, .45)" });
    const onMove = (e) => {
      const el = e.target instanceof Element ? e.target.closest(".magnetic") : null;
      if (active && active !== el) { release(active); active = null; }
      if (!el) return;
      active = el;
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      gsap.to(el, { x: dx * 0.35, y: dy * 0.45, duration: 0.4, ease: "power3" });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => { window.removeEventListener("pointermove", onMove); if (active) gsap.set(active, { x: 0, y: 0 }); };
  }, []);
}

/* ---------------------------------------------------------------- in-page links: smooth scroll that respects reduced motion */
function useAnchorScroll() {
  useEffect(() => {
    const onClick = (e) => {
      const a = e.target instanceof Element ? e.target.closest('a[href^="#"]') : null;
      if (!a) return;
      const id = a.getAttribute("href").slice(1);
      const target = id ? document.getElementById(id) : null;
      if (!target) return;
      e.preventDefault();
      scrollToTarget(id === "top" ? 0 : target);
      history.replaceState(null, "", "#" + id);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
}

export default function App() {
  useMagnetic();
  useAnchorScroll();
  useEffect(() => initSmoothScroll(), []);
  useEffect(() => {
    // pinned sections measure after web fonts settle
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
    const t = setTimeout(() => ScrollTrigger.refresh(), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <div className="grain" aria-hidden="true" />
      <Cursor />
      <Nav />
      <main>
        <HeroCup />
        <Marquee />
        <Showcase />
        <DrinkLab />
        <Menu />
        <OurStory />
        <Gallery />
        <ScribbleWall />
      </main>
      <Footer />
      <OrderBag />
      <ReceiptModal />
      <CounterTicket />
      <Toast />
      <IntroSeal />
    </>
  );
}
