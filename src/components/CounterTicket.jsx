// "Show at counter": a bold, high-contrast full-screen ticket a customer can hold up to the barista.
// Built from the same data as the bag and the Lab. It sends nothing; payment happens at the register.
// Tries to keep the screen awake (Wake Lock API) while open; silently skips where unsupported.
import { useEffect, useRef } from "react";
import { DRINKS, SECRET_DRINK, TREATS, ICE, TOPPINGS, SHOP, money } from "../data.js";
import { useUI, uiActions } from "../ui/store.js";
import { useDialog } from "../ui/useDialog.js";

// "75% Sweet • Less Ice • Boba + Cheese Foam" from a custom drink
export function customDetail({ sweetness, ice, toppings }) {
  const parts = [`${sweetness}% Sweet`, (ICE.find((i) => i.id === ice) || ICE[2]).label.replace(/\b\w/g, (c) => c.toUpperCase())];
  const tops = TOPPINGS.filter((t) => toppings.includes(t.id)).map((t) => (t.short || t.name).replace(/\b\w/g, (c) => c.toUpperCase()));
  if (tops.length) parts.push(tops.join(" + "));
  return parts.join(" • ");
}
// flavor color for an item (bag line or drink id), used to tint the pass banner
export function itemColor(item) {
  const id = item.custom ? item.custom.drinkId : item.id;
  const d = [...DRINKS, SECRET_DRINK, ...TREATS].find((x) => x.id === id);
  return d ? d.base : "#FF4D8D";
}
// readable text on a colored banner
function onColor(hex) {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const L = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return L > 0.55 ? "#231712" : "#FFFDF9";
}
// one ticket line from a bag item (custom drinks get the spec line, menu items just the name)
export function ticketLine(item) {
  const name = item.custom ? ([...DRINKS, SECRET_DRINK].find((d) => d.id === item.custom.drinkId)?.name || item.name) : item.name;
  return { qty: item.qty || 1, name, detail: item.custom ? customDetail(item.custom) : "" };
}

function Ticket({ t }) {
  const box = useRef(null);
  useDialog(box, uiActions.closeCounter);
  useEffect(() => {
    let lock = null, alive = true;
    (async () => {
      try { if ("wakeLock" in navigator) { const l = await navigator.wakeLock.request("screen"); if (alive) lock = l; else l.release(); } } catch (e) { /* not allowed: fine */ }
    })();
    return () => { alive = false; try { lock && lock.release(); } catch (e) {} };
  }, []);
  const count = t.lines.reduce((s, l) => s + l.qty, 0);
  return (
    <div ref={box} role="dialog" aria-modal="true" aria-labelledby="ct-title" className="counter-ticket fixed inset-0 z-[160] flex flex-col overflow-y-auto" data-native-scroll>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-[3px] border-ink px-5 py-4"
        style={{ background: t.color || "#FF4D8D", color: onColor(t.color || "#FF4D8D") }}>
        <div className="flex flex-wrap items-center gap-3">
          <p className="m-0 font-display text-[20px] font-bold leading-tight">You Had Me <i className="font-light">@</i> Boba</p>
          <span className="live-badge"><span className="live-dot" aria-hidden="true" />LIVE ORDER TICKET</span>
        </div>
        <button type="button" onClick={uiActions.closeCounter} className="pill pill-ghost" style={{ minHeight: 42 }} data-autofocus>Close</button>
      </div>
      <div className="mx-auto flex w-full max-w-[760px] flex-1 flex-col px-5 py-6 sm:py-10">
        <p className="m-0 text-[clamp(16px,2.4vw,20px)] font-bold uppercase tracking-[.14em]">Show this to the barista</p>
        <h2 id="ct-title" className="sr-only">Order ticket, {count} item{count === 1 ? "" : "s"}</h2>
        <ul className="m-0 mt-5 list-none p-0">
          {t.lines.map((l, i) => (
            <li key={i} className="ct-line py-5 first:border-t-0 first:pt-0">
              <p className="m-0 font-display text-[clamp(34px,8vw,64px)] font-bold leading-[1.02] tracking-[-.01em]">
                <span className="mr-3 inline-block rounded-xl bg-ink px-3 text-[#FFFDF9]">{l.qty}x</span>{l.name}
              </p>
              {l.detail && <p className="m-0 mt-3 text-[clamp(20px,4.4vw,32px)] font-semibold leading-snug">{l.detail}</p>}
            </li>
          ))}
        </ul>
        <div className="ct-line mt-2 flex items-baseline justify-between pt-5">
          <span className="text-[clamp(20px,4vw,28px)] font-bold">Total</span>
          <span className="font-display text-[clamp(32px,7vw,52px)] font-bold tabular-nums">{money(t.total)}</span>
        </div>
        {t.unpriced && t.total !== null && <p className="m-0 mt-2 text-right text-[clamp(16px,3vw,20px)] font-semibold">Plus items priced at the counter</p>}
        <p className="m-0 mt-auto pt-8 text-[15px] font-medium">
          Pay at the counter · prices before tax · {SHOP.street}, Collierville · {SHOP.phone}
        </p>
      </div>
    </div>
  );
}

export default function CounterTicket() {
  const { counter } = useUI();
  return counter && counter.lines.length ? <Ticket t={counter} /> : null;
}
