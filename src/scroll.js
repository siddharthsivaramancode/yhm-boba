// Inertia scrolling: a small rAF lerp on top of native window scroll (no library).
// The page still scrolls the real window, so GSAP ScrollTrigger pins, sticky elements and
// anchors keep working; we only ease mouse-wheel/trackpad input toward a target.
// Off under prefers-reduced-motion and on touch/coarse pointers (native scroll there).
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let active = false;
let target = 0;
let current = 0;
let lerp = 0.11;
let written = 0; // last y we wrote, to tell our own scroll events from the user's

const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;
const clamp = (v) => Math.max(0, Math.min(maxScroll(), v));
const locked = () => document.body.style.overflow === "hidden";

// does the wheel event belong to an inner scroller (bag drawer, modal, horizontal row)?
function innerScrolls(el, dy) {
  while (el && el !== document.body && el !== document.documentElement) {
    const cs = getComputedStyle(el);
    if (/(auto|scroll)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 1) {
      if ((dy > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 1) || (dy < 0 && el.scrollTop > 0)) return true;
    }
    el = el.parentElement;
  }
  return false;
}

function onWheel(e) {
  if (e.ctrlKey || e.defaultPrevented || locked()) return; // pinch-zoom, modals
  const t = e.target instanceof Element ? e.target : null;
  if (t && (t.closest("[data-native-scroll]") || innerScrolls(t, e.deltaY))) return;
  if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // horizontal trackpad swipes stay native
  e.preventDefault();
  const unit = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? window.innerHeight : 1;
  if (Math.abs(target - window.scrollY) > window.innerHeight * 2) target = window.scrollY;
  target = clamp(target + e.deltaY * unit);
  lerp = 0.11;
}

function onNativeScroll() {
  // keyboard, scrollbar drags, find-in-page: follow the real position
  if (Math.abs(window.scrollY - written) > 3) { current = target = written = window.scrollY; }
}

function tick(_t, deltaMs) {
  if (locked()) { current = target = written = window.scrollY; return; }
  const d = target - current;
  if (Math.abs(d) < 0.4) {
    if (current !== target) { current = target; write(); }
    return;
  }
  // frame-rate independent easing: the same glide at 30 or 144 fps
  const k = 1 - Math.pow(1 - lerp, Math.min(4, (deltaMs || 16.7) / 16.7));
  current += d * k;
  write();
}
function write() { written = Math.round(current); window.scrollTo(0, current); }

export function initSmoothScroll() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (reduce || !fine || active) return () => {};
  active = true;
  current = target = written = window.scrollY;
  document.documentElement.style.scrollBehavior = "auto";
  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("scroll", onNativeScroll, { passive: true });
  gsap.ticker.add(tick);
  ScrollTrigger.refresh();
  return () => {
    active = false;
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("scroll", onNativeScroll);
    gsap.ticker.remove(tick);
  };
}

// Smooth-scroll to an element or y position; uses the inertia loop when it is on.
export function scrollToTarget(el, offset = -64) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const y = typeof el === "number" ? el : el.getBoundingClientRect().top + window.scrollY + offset;
  if (active && !reduce) {
    current = written = window.scrollY;
    target = clamp(y);
    lerp = 0.075; // longer, calmer glide for jumps
    return;
  }
  window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
}
