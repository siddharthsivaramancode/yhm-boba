// Tiny shared UI store (no deps): which drink the Lab should show, secret-menu unlock, intro state.
// const ui = useUI(); uiActions.pickDrink("taro") etc.
import { useSyncExternalStore } from "react";

const SECRET_KEY = "yhm-secret";
let secret = false;
try { secret = localStorage.getItem(SECRET_KEY) === "1"; } catch (e) {}

export const INTRO_KEY = "yhm-seal-pierced";
function introWillShow() {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  try { return sessionStorage.getItem(INTRO_KEY) !== "1"; } catch (e) { return true; }
}

let state = {
  labPick: null,      // { id, n }: n bumps so picking the same drink twice still fires
  secret,             // Poplar Midnight Tiger unlocked
  introDone: !introWillShow(), // false while the "pierce the seal" intro is up
  receipt: null,      // drink-card payload for the receipt modal, or null
  counter: null,      // "show at counter" ticket: { lines: [{ qty, name, detail }], total, unpriced, color }
  toast: null,        // { msg, n } short confirmation toast
};
const subs = new Set();
const set = (patch) => { state = { ...state, ...patch }; subs.forEach((f) => f()); };
let n = 0;

export const uiActions = {
  pickDrink(id) { set({ labPick: { id, n: ++n } }); },
  unlockSecret() {
    try { localStorage.setItem(SECRET_KEY, "1"); } catch (e) {}
    set({ secret: true });
  },
  setIntroDone(v) { set({ introDone: v }); },
  openReceipt(r) { set({ receipt: r }); },
  closeReceipt() { set({ receipt: null }); },
  openCounter(t) { set({ counter: t }); },
  closeCounter() { set({ counter: null }); },
  toast(msg) { set({ toast: { msg, n: ++n } }); },
  clearToast() { set({ toast: null }); },
};
export const getUI = () => state;
export function subscribeUI(f) { subs.add(f); return () => subs.delete(f); }
export function useUI() { return useSyncExternalStore(subscribeUI, () => state, () => state); }
