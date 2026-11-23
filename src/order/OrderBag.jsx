import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { SHOP, TREATS, money, lineTotal, reduceMotion, finePointer } from "../data.js";
import { useBag, bagActions, bagTotal, bagCount, hasUnpriced } from "./store.js";
import { uiActions } from "../ui/store.js";
import { ticketLine, itemColor } from "../components/CounterTicket.jsx";
import { copyText } from "../ui/useDialog.js";

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])';
const PARTNERS = [
  { name: "DoorDash", url: SHOP.doordash, dot: "#FF3008" },
  { name: "Uber Eats", url: SHOP.ubereats, dot: "#06C167" },
  { name: "Grubhub", url: SHOP.grubhub, dot: "#F63440" },
];
const focusCls = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-neon focus-visible:outline-offset-2";

function summary(items) {
  const lines = items.map((i) => { const t = lineTotal(i); return `${i.qty} x ${i.name}${i.detail ? " (" + i.detail + ")" : ""} - ${t === null ? "price at counter" : money(t)}`; });
  const extra = hasUnpriced(items) ? " (plus items priced at the counter)" : "";
  return `Order for ${SHOP.name}\n${lines.join("\n")}\nSubtotal: ${money(bagTotal(items))}${extra}\nPickup at ${SHOP.street}`;
}

export default function OrderBag() {
  const bag = useBag();
  const { items, open, mode } = bag;
  const [render, setRender] = useState(open);
  const [copied, setCopied] = useState(false);
  const panel = useRef(null);
  const back = useRef(null);
  const closeBtn = useRef(null);
  const last = useRef(null);

  useEffect(() => {
    if (open) setRender(true);
  }, [open]);

  // slide in/out
  useEffect(() => {
    if (!render) return;
    const p = panel.current, b = back.current;
    if (!p || !b) return;
    const rm = reduceMotion();
    if (open) {
      last.current = document.activeElement;
      document.body.style.overflow = "hidden";
      if (rm) { gsap.set(p, { xPercent: 0 }); gsap.set(b, { opacity: 1 }); }
      else {
        gsap.fromTo(p, { xPercent: 100 }, { xPercent: 0, duration: 0.55, ease: "power3.out" });
        gsap.fromTo(b, { opacity: 0 }, { opacity: 1, duration: 0.4 });
      }
      closeBtn.current && closeBtn.current.focus({ preventScroll: true });
    } else {
      document.body.style.overflow = "";
      const done = () => {
        setRender(false);
        const el = last.current;
        if (el && el.focus && document.contains(el)) el.focus({ preventScroll: true });
      };
      if (rm) done();
      else {
        gsap.to(b, { opacity: 0, duration: 0.3 });
        gsap.to(p, { xPercent: 100, duration: 0.4, ease: "power3.in", onComplete: done });
      }
    }
  }, [open, render]);

  useEffect(() => () => { document.body.style.overflow = ""; }, []);

  const onKey = (e) => {
    if (e.key === "Escape") { e.stopPropagation(); bagActions.close(); return; }
    if (e.key !== "Tab" || !panel.current) return;
    const f = [...panel.current.querySelectorAll(FOCUSABLE)].filter((n) => n.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], end = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); end.focus(); }
    else if (!e.shiftKey && document.activeElement === end) { e.preventDefault(); first.focus(); }
    else if (!panel.current.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
  };

  async function copy() {
    const text = summary(items);
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch (e) {
      try {
        const ta = document.createElement("textarea");
        ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select(); ok = document.execCommand("copy"); ta.remove();
      } catch (e2) {}
    }
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  }

  if (!render) return null;
  const total = bagTotal(items);
  const count = bagCount(items);

  return (
    <div className="fixed inset-0 z-[97]" onKeyDown={onKey}>
      <div ref={back} className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={() => bagActions.close()} aria-hidden="true" />
      <aside ref={panel} role="dialog" aria-modal="true" aria-labelledby="bag-title"
        className="absolute right-0 top-0 h-full w-full sm:w-[440px] flex flex-col bg-espresso border-l-[1.5px] border-ink shadow-[-8px_0_0_rgba(35,23,18,.9)]">
        <header className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 id="bag-title" className="font-display text-[30px] font-bold text-oat">Your bag{count > 0 && <span className="ml-2 text-[16px] font-sans font-normal text-oat-2">{count} {count === 1 ? "item" : "items"}</span>}</h2>
          <button ref={closeBtn} type="button" aria-label="Close bag" onClick={() => bagActions.close()}
            className={`w-10 h-10 rounded-full border border-line text-oat hover:border-oat-3 ${focusCls}`}>
            <svg viewBox="0 0 24 24" width="18" height="18" className="mx-auto" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {items.length === 0 ? (
            <p className="py-8 text-oat-2 leading-relaxed">Your bag is empty. Build a drink or add a treat below.</p>
          ) : (
            <ul className="divide-y divide-line">
              {items.map((i) => (
                <li key={i.key} className="py-4 flex gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-oat text-[15px] font-medium leading-snug">{i.name}</p>
                    {i.detail && <p className="text-oat-2 text-[13px] mt-0.5 leading-snug">{i.detail}</p>}
                    <div className="mt-3 flex items-center gap-3">
                      <div className="inline-flex items-center rounded-full border border-line">
                        <button type="button" aria-label={`Decrease quantity of ${i.name}`} onClick={() => bagActions.setQty(i.key, i.qty - 1)} className={`w-8 h-8 text-oat rounded-full ${focusCls}`}>−</button>
                        <span className="w-6 text-center text-[14px] text-oat tabular-nums" aria-live="polite">{i.qty}</span>
                        <button type="button" aria-label={`Increase quantity of ${i.name}`} onClick={() => bagActions.setQty(i.key, i.qty + 1)} className={`w-8 h-8 text-oat rounded-full ${focusCls}`}>+</button>
                      </div>
                      <button type="button" aria-label={`Remove ${i.name}`} onClick={() => bagActions.remove(i.key)} className={`text-[13px] text-oat-3 underline underline-offset-4 hover:text-oat rounded-sm ${focusCls}`}>Remove</button>
                    </div>
                  </div>
                  <p className={`text-oat tabular-nums ${lineTotal(i) === null ? "text-[13px] font-semibold" : "text-[15px]"}`}>{money(lineTotal(i))}</p>
                </li>
              ))}
            </ul>
          )}

          <h3 className="mt-8 mb-3 font-display italic text-neon-2 text-[18px]">Add something sweet</h3>
          <ul className="grid gap-2">
            {TREATS.map((t) => (
              <li key={t.id} className="flex items-center gap-3 rounded-2xl border border-line bg-espresso-2/70 px-4 py-3">
                <span aria-hidden="true" className="w-3 h-3 rounded-full shrink-0" style={{ background: t.base }} />
                <span className="flex-1 min-w-0 text-[14px] text-oat leading-snug">{t.name}<span className="block text-oat-2 text-[13px] tabular-nums">{money(t.price)}</span></span>
                <button type="button" aria-label={`Add ${t.name} to bag`} onClick={() => bagActions.add({ id: t.id, name: t.name, price: t.price })}
                  className={`w-9 h-9 rounded-full bg-oat text-espresso text-[20px] leading-none hover:bg-neon transition-colors ${focusCls}`}>+</button>
              </li>
            ))}
          </ul>

          <div role="radiogroup" aria-label="Fulfilment" className="mt-8 grid grid-cols-2 gap-2">
            {[["pickup", "Pickup"], ["delivery", "Delivery"]].map(([id, label]) => (
              <label key={id} className="relative cursor-pointer">
                <input type="radio" name="bag-mode" className="peer sr-only" checked={mode === id} onChange={() => bagActions.setMode(id)} />
                <span className="block text-center rounded-full border border-line px-3 py-2.5 text-[14px] text-oat-2 peer-checked:bg-oat peer-checked:text-espresso peer-checked:border-oat peer-focus-visible:ring-2 peer-focus-visible:ring-neon">{label}</span>
              </label>
            ))}
          </div>
          {mode === "pickup" ? (
            <p className="mt-4 text-[14px] text-oat-2 leading-relaxed">
              {SHOP.street} · ready in about 10–15 minutes.{" "}
              <a href={SHOP.maps} target="_blank" rel="noopener noreferrer" className={`text-neon-2 underline underline-offset-4 ${focusCls}`}>Open in maps</a>
            </p>
          ) : (
            <div className="mt-4">
              <div className="grid gap-2">
                {PARTNERS.map((p) => (
                  <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer"
                    className={`flex items-center gap-3 rounded-full border border-line px-4 py-2.5 text-[14px] text-oat hover:border-oat-3 ${focusCls}`}>
                    <span aria-hidden="true" className="w-2.5 h-2.5 rounded-full" style={{ background: p.dot }} />{p.name}
                  </a>
                ))}
              </div>
              <p className="mt-3 text-[13px] text-oat-3">Delivery partners set their own prices and menus.</p>
            </div>
          )}
        </div>

        <footer className="px-6 pt-4 pb-6 border-t border-line bg-espresso/70">
          <div className="flex items-baseline justify-between">
            <span className="text-oat-2 text-[14px]">Subtotal</span>
            <span className="font-display text-[28px] font-bold text-oat tabular-nums">{money(total)}</span>
          </div>
          {hasUnpriced(items) && <p className="mt-1 text-right text-[13px] font-semibold text-oat-2">Plus items priced at the counter</p>}
          {mode === "pickup" && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" disabled={!items.length} className="pill pill-neon flex-1 justify-center"
                onClick={() => { bagActions.close(); uiActions.openCounter({ lines: items.map(ticketLine), total: items.every((i) => i.price === null) ? null : total, unpriced: hasUnpriced(items), color: itemColor(items[0]) }); }}>Show at counter</button>
              <a href={"tel:" + SHOP.tel} className="pill pill-ghost" onClick={async (e) => {
                // desktops usually have nothing to handle tel: links, so copy the number instead; phones still dial
                if (!finePointer()) return;
                e.preventDefault();
                uiActions.toast((await copyText(SHOP.phone)) ? `Phone number copied! ${SHOP.phone}` : `Call ${SHOP.phone}`);
              }}>Call it in</a>
              <button type="button" onClick={copy} disabled={!items.length} className="pill pill-ghost">{copied ? "Copied" : "Copy"}</button>
            </div>
          )}
          <p className="mt-3 text-[12.5px] text-oat-3 leading-snug">No online checkout yet: show the ticket at the counter, or call the shop and read them your order.</p>
          <span className="sr-only" role="status">{copied ? "Order copied" : ""}</span>
        </footer>
      </aside>
    </div>
  );
}
