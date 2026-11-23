// "Print drink card": a thermal-receipt style modal for the drink built in the Lab.
// Opened with uiActions.openReceipt({ name, sweetness, ice, toppings: [{name, price}], base, price, total }).
// Copy and share actions (navigator.share, falling back to the clipboard), Escape to close, focus trap.
// It is a keepsake card, not an order: nothing is sent anywhere.
import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { SHOP, money, isPriced, reduceMotion } from "../data.js";
import { useUI, uiActions } from "../ui/store.js";
import { sfx } from "../sfx.js";

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

function stamp() {
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date());
  } catch (e) { return new Date().toLocaleString(); }
}

function asText(r, when) {
  const lines = [
    "You Had Me @ Boba · drink card",
    when,
    "",
    r.name + "  " + (isPriced(r.price) ? money(r.price) : "price at counter"),
    "  " + r.sweetness + "% sweet",
    "  " + r.ice,
    ...r.toppings.map((t) => "  + " + t.name + (isPriced(t.price) ? "  " + money(t.price) : "")),
    "",
    "Total  " + (isPriced(r.total) ? money(r.total) : "price at counter"),
    "",
    SHOP.address,
    "Call ahead for pickup: " + SHOP.phone,
  ];
  return lines.join("\n");
}

async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; }
  } catch (e) { /* fall through */ }
  try {
    const ta = document.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch (e) { return false; }
}

function Receipt({ r, onClose }) {
  const dialog = useRef(null), backdrop = useRef(null), paper = useRef(null);
  const opener = useRef(typeof document !== "undefined" ? document.activeElement : null);
  const closing = useRef(false);
  const [msg, setMsg] = useState("");
  const [when] = useState(stamp);
  const text = asText(r, when);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    if (reduceMotion()) return onClose();
    gsap.to(paper.current, { y: -30, opacity: 0, duration: 0.25, ease: "power2.in" });
    gsap.to(backdrop.current, { opacity: 0, duration: 0.3, onComplete: onClose });
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const op = opener.current;
    const bd = backdrop.current, pp = paper.current;
    if (!reduceMotion()) {
      // explicit from/to values so a StrictMode double-run can't freeze it at opacity 0
      gsap.fromTo(bd, { opacity: 0 }, { opacity: 1, duration: 0.3 });
      // the receipt feeds out of a printer slot
      gsap.fromTo(pp, { clipPath: "inset(0 0 100% 0)", y: -20 }, { clipPath: "inset(0 0 0% 0)", y: 0, duration: 1.1, ease: "steps(14)" });
    }
    dialog.current.querySelector("[data-autofocus]")?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (e.key !== "Tab") return;
      const items = [...dialog.current.querySelectorAll(FOCUSABLE)].filter((n) => n.offsetParent !== null);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (!dialog.current.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      gsap.killTweensOf([bd, pp]);
      gsap.set([bd, pp], { clearProps: "opacity,clipPath,transform" });
      document.body.style.overflow = prev;
      if (op && document.contains(op)) op.focus();
    };
  }, [close]);

  const copy = async () => {
    const ok = await copyText(text);
    setMsg(ok ? "Copied. Paste it anywhere." : "Couldn't copy here. Select the card text instead.");
    if (ok) sfx("pop");
  };
  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: "My drink at You Had Me @ Boba", text }); setMsg("Shared."); return; }
      catch (e) { if (e && e.name === "AbortError") return; }
    }
    copy();
  };

  return (
    <div ref={backdrop} className="fixed inset-0 z-[150] flex items-start justify-center overflow-y-auto bg-[rgba(10,6,5,.78)] px-4 py-10 backdrop-blur-sm sm:items-center"
      onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }} data-native-scroll>
      <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="rc-title" className="w-full max-w-[380px]">
        <div ref={paper} className="receipt relative px-6 pb-8 pt-7 text-[#2A1A12]">
          <p className="m-0 text-center font-display text-[22px] font-bold leading-tight">You Had Me <i className="font-light text-[#C9476A]">@</i> Boba</p>
          <p className="m-0 mt-1 text-center text-[12px]">{SHOP.street}<br />{SHOP.city} · {SHOP.phone}</p>
          <p className="rc-rule" aria-hidden="true" />
          <h2 id="rc-title" className="m-0 flex items-baseline justify-between gap-3 text-[15px] font-bold">
            <span className="flex items-center gap-2">
              <span aria-hidden="true" className="inline-block h-3 w-3 rounded-full border border-black/30" style={{ background: r.base }} />
              {r.name}
            </span>
            <span className="tabular-nums">{money(r.price)}</span>
          </h2>
          <ul className="m-0 mt-2 list-none p-0 text-[13.5px] leading-[1.7]">
            <li>{r.sweetness}% sweet</li>
            <li>{r.ice}</li>
            {r.toppings.map((t) => (
              <li key={t.name} className="flex justify-between"><span>+ {t.name}</span>{isPriced(t.price) && <span className="tabular-nums">{money(t.price)}</span>}</li>
            ))}
          </ul>
          <p className="rc-rule" aria-hidden="true" />
          <p className="m-0 flex justify-between text-[17px] font-bold"><span>Total</span><span className="tabular-nums">{money(r.total)}</span></p>
          <p className="m-0 mt-1 text-[11.5px] opacity-70">Before tax. Prices to be confirmed by the shop.</p>
          <p className="rc-rule" aria-hidden="true" />
          <p className="m-0 text-center text-[12.5px] leading-relaxed">Show this at the counter, or call ahead<br />and we'll have it ready for pickup.</p>
          <div aria-hidden="true" className="rc-barcode mx-auto mt-4" />
          <p className="m-0 mt-2 text-center text-[11px] tracking-[.18em]">{when}</p>
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <button type="button" className="pill pill-neon" onClick={share} data-autofocus>Share card</button>
          <button type="button" className="pill pill-ghost" onClick={copy}>Copy text</button>
          <button type="button" className="pill pill-ghost" onClick={close}>Close</button>
        </div>
        <p role="status" aria-live="polite" className="mt-3 min-h-[1.4em] text-center text-[14px] text-neon-2">{msg}</p>
      </div>
    </div>
  );
}

export default function ReceiptModal() {
  const { receipt } = useUI();
  if (!receipt) return null;
  return <Receipt r={receipt} onClose={uiActions.closeReceipt} />;
}
