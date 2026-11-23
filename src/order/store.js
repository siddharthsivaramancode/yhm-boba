// Tiny shared order bag (no backend). Any component: const bag = useBag(); bagActions.add(...)
// Line item: { key, id, name, price (unit, incl. toppings), qty, detail?: string, custom?: {drinkId, sweetness, ice, toppings[]} }
import { useSyncExternalStore } from "react";
import { isPriced } from "../data.js";

let state = { items: [], open: false, mode: "pickup" }; // mode: "pickup" | "delivery"
const subs = new Set();
const set = (patch) => { state = { ...state, ...patch }; subs.forEach((f) => f()); };
let seq = 0;

export const bagActions = {
  add(item) {
    // identical plain menu items stack; custom drinks are always their own line
    const same = !item.custom && state.items.find((i) => !i.custom && i.id === item.id);
    if (same) set({ items: state.items.map((i) => (i === same ? { ...i, qty: i.qty + (item.qty || 1) } : i)) });
    else set({ items: [...state.items, { qty: 1, ...item, key: "l" + ++seq }] });
  },
  setQty(key, qty) { set({ items: qty <= 0 ? state.items.filter((i) => i.key !== key) : state.items.map((i) => (i.key === key ? { ...i, qty } : i)) }); },
  remove(key) { set({ items: state.items.filter((i) => i.key !== key) }); },
  clear() { set({ items: [] }); },
  open() { set({ open: true }); },
  close() { set({ open: false }); },
  setMode(mode) { set({ mode }); },
};

// unpriced lines (price null, "Ask at counter") are left out of the subtotal; hasUnpriced() flags them
export const bagTotal = (items) => items.reduce((s, i) => s + (isPriced(i.price) ? i.price * i.qty : 0), 0);
export const hasUnpriced = (items) => items.some((i) => !isPriced(i.price));
export const bagCount = (items) => items.reduce((s, i) => s + i.qty, 0);

export function useBag() {
  return useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => state, () => state);
}
