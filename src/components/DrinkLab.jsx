import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { DRINKS, SECRET_DRINK, SWEETNESS, ICE, TOPPINGS, SHOP, money, isPriced, reduceMotion } from "../data.js";
import { customDetail } from "./CounterTicket.jsx";
import { useUI, uiActions } from "../ui/store.js";
import { bagActions } from "../order/store.js";
import { sfx } from "../sfx.js";

const BobaCup = React.lazy(() => import("../three/BobaCup.jsx"));

const ring = "peer-focus-visible:ring-2 peer-focus-visible:ring-neon peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-espresso";

function Step({ n, title, children }) {
  return (
    <fieldset className="border-0 p-0 m-0 min-w-0">
      <legend className="p-0 mb-3 flex items-baseline gap-3">
        <span className="font-display italic text-neon-2 text-[15px]">{n}</span>
        <span className="text-oat text-[15px] font-medium">{title}</span>
      </legend>
      {children}
    </fieldset>
  );
}

function Segmented({ name, label, options, value, onChange }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0,1fr))` }}>
      {options.map((o) => (
        <label key={String(o.id)} className="relative cursor-pointer">
          <input type="radio" name={name} className="peer sr-only" checked={value === o.id} onChange={() => onChange(o.id)} />
          <span className={`block text-center rounded-full border border-line px-3 py-3 text-[14px] text-oat-2 transition-colors peer-checked:bg-oat peer-checked:text-espresso peer-checked:border-oat hover:border-oat-3 ${ring}`}>{o.label}</span>
        </label>
      ))}
    </div>
  );
}

function Meter({ label, value, max, unit }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-[13px] text-oat-2 mb-1.5">
        <span>{label}</span>
        <span className="text-oat tabular-nums">{value}{unit}</span>
      </div>
      <div className="h-[3px] rounded-full bg-line overflow-hidden">
        <div className="h-full rounded-full bg-neon" style={{ width: pct + "%", transition: "width .5s cubic-bezier(.2,.7,.2,1)" }} />
      </div>
    </div>
  );
}

function join(list) {
  if (list.length <= 1) return list.join("");
  return list.slice(0, -1).join(", ") + " and " + list[list.length - 1];
}

export default function DrinkLab() {
  const [drinkId, setDrinkId] = useState("matcha");
  const [sweetness, setSweetness] = useState(75);
  const [ice, setIce] = useState("less");
  const [toppings, setToppings] = useState(["tapioca"]);
  const [shake, setShake] = useState(0);
  const [added, setAdded] = useState(false);
  const [live, setLive] = useState("");
  const btnRef = useRef(null);
  const timer = useRef(null);

  const ui = useUI();
  const teas = ui.secret ? [...DRINKS, SECRET_DRINK] : DRINKS;
  const drink = [...DRINKS, SECRET_DRINK].find((d) => d.id === drinkId) || DRINKS[0];

  const chooseDrink = (id) => {
    setDrinkId(id);
    const d = [...DRINKS, SECRET_DRINK].find((x) => x.id === id);
    if (d && d.toppings) { setToppings([...d.toppings]); setSweetness(100); }
  };
  // Menu "Customize in Lab" and the secret unlock hand a drink over through the UI store
  const lastPick = useRef(ui.labPick && ui.labPick.n);
  useEffect(() => {
    if (!ui.labPick || ui.labPick.n === lastPick.current) return;
    lastPick.current = ui.labPick.n;
    chooseDrink(ui.labPick.id);
    setLive("");
    requestAnimationFrame(() => setLive(`${[...DRINKS, SECRET_DRINK].find((d) => d.id === ui.labPick.id)?.name || "Drink"} selected in the drink lab`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ui.labPick]);
  const picked = TOPPINGS.filter((t) => toppings.includes(t.id));
  const sw = SWEETNESS.find((s) => s.id === sweetness);
  const iceOpt = ICE.find((i) => i.id === ice);

  // an unpriced drink (secret menu) stays unpriced: toppings never build a fake total on top of null
  const price = isPriced(drink.price) ? Math.round((drink.price + picked.reduce((s, t) => s + t.price, 0)) * 100) / 100 : null;
  const kcal = Math.round(drink.kcal * (0.55 + 0.45 * sweetness / 100) + picked.reduce((s, t) => s + t.kcal, 0));
  const caffeine = drink.caffeine + picked.reduce((s, t) => s + (t.caffeine || 0), 0);

  const note = useMemo(() => {
    let s = `${drink.taste}, ${sw.phrase}`;
    const tops = picked.map((t) => t.phrase);
    if (tops.length) s += ", with " + join(tops);
    s += ice === "none" ? ", served without ice." : ice === "less" ? ", over a little ice." : ", over plenty of ice.";
    return s.charAt(0).toUpperCase() + s.slice(1);
  }, [drink, sw, picked, ice]);

  const detail = `${sweetness}% sweet · ${iceOpt.label}${picked.length ? " · " + picked.map((t) => t.name).join(", ") : ""}`;

  const toggleTopping = (id) => setToppings((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  useEffect(() => () => clearTimeout(timer.current), []);

  function fly() {
    const bag = document.getElementById("bag-button");
    const btn = btnRef.current;
    if (!bag || !btn || reduceMotion()) return;
    const a = btn.getBoundingClientRect(), b = bag.getBoundingClientRect();
    const sx = a.left + a.width / 2 - 14, sy = a.top + a.height / 2 - 14;
    const dx = b.left + b.width / 2 - 14 - sx, dy = b.top + b.height / 2 - 14 - sy;
    const tok = document.createElement("div");
    tok.setAttribute("aria-hidden", "true");
    Object.assign(tok.style, {
      position: "fixed", left: sx + "px", top: sy + "px", width: "28px", height: "28px", borderRadius: "9px 9px 12px 12px",
      zIndex: "120", pointerEvents: "none",
      background: `linear-gradient(180deg, ${drink.cream}, ${drink.base})`,
      boxShadow: `0 0 18px 4px ${drink.base}99, 0 0 40px 8px #FF7A9C55`,
    });
    document.body.appendChild(tok);
    const lift = Math.min(160, Math.abs(dy) * 0.35 + 70);
    const d = 0.85;
    const tl = gsap.timeline({
      onComplete: () => {
        tok.remove();
        gsap.fromTo(bag, { scale: 1 }, { scale: 1.22, duration: 0.16, yoyo: true, repeat: 1, ease: "power2.out", clearProps: "transform" });
      },
    });
    tl.fromTo(tok, { x: 0 }, { x: dx, duration: d, ease: "power1.inOut" }, 0);
    tl.fromTo(tok, { y: 0 }, { y: -lift, duration: d * 0.4, ease: "power2.out" }, 0);
    tl.to(tok, { y: dy, duration: d * 0.6, ease: "power2.in" }, d * 0.4);
    tl.to(tok, { scale: 0.25, opacity: 0.6, duration: d, ease: "power1.in" }, 0);
  }

  // opt-in phone shake (iOS needs DeviceMotionEvent.requestPermission from a tap)
  const [motion, setMotion] = useState("off"); // off | on | denied
  const [canMotion] = useState(() => typeof window !== "undefined" && "DeviceMotionEvent" in window && window.matchMedia("(pointer: coarse)").matches);
  const motionOff = useRef(null);
  useEffect(() => () => motionOff.current && motionOff.current(), []);
  async function toggleMotion() {
    if (motion === "on") { motionOff.current && motionOff.current(); motionOff.current = null; setMotion("off"); return; }
    try {
      const DME = window.DeviceMotionEvent;
      if (DME && typeof DME.requestPermission === "function" && (await DME.requestPermission()) !== "granted") { setMotion("denied"); return; }
    } catch (e) { setMotion("denied"); return; }
    let last = null, lastShake = 0;
    const onMotion = (e) => {
      const a = e.accelerationIncludingGravity || e.acceleration;
      if (!a || a.x == null) return;
      if (last) {
        const d = Math.abs(a.x - last.x) + Math.abs(a.y - last.y) + Math.abs(a.z - last.z), now = performance.now();
        if (d > 18 && now - lastShake > 450) { lastShake = now; setShake((n) => n + 1); }
      }
      last = { x: a.x, y: a.y, z: a.z };
    };
    window.addEventListener("devicemotion", onMotion);
    motionOff.current = () => window.removeEventListener("devicemotion", onMotion);
    setMotion("on");
  }

  function showCounter() {
    sfx("pop");
    uiActions.openCounter({
      lines: [{ qty: 1, name: drink.name, detail: customDetail({ sweetness, ice, toppings }) }],
      total: price, color: drink.base,
    });
  }

  function printCard() {
    sfx("pop");
    uiActions.openReceipt({
      name: drink.name, base: drink.base, price: drink.price, sweetness, ice: iceOpt.label,
      toppings: picked.map((t) => ({ name: t.name, price: isPriced(drink.price) ? t.price : null })), total: price,
    });
  }

  function add() {
    bagActions.add({
      id: "custom-" + drink.id, name: drink.name, price, detail,
      custom: { drinkId: drink.id, sweetness, ice, toppings: [...toppings] },
    });
    sfx("pop");
    fly();
    setAdded(true);
    setLive("");
    requestAnimationFrame(() => setLive("Added to your bag"));
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 5000);
  }

  return (
    <section id="lab" aria-labelledby="lab-title" className="px-[clamp(20px,5vw,72px)] py-[clamp(90px,12vw,160px)]"
      style={{ background: "radial-gradient(80% 60% at 20% 30%, #F6FBF2 0%, rgba(246,251,242,0) 70%), #EDF5E8" }}>
      <style>{`@keyframes lab-fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}.lab-fade{animation:lab-fade .45s cubic-bezier(.2,.7,.2,1)}@media (prefers-reduced-motion:reduce){.lab-fade{animation:none}}`}</style>
      <div className="max-w-[1200px] mx-auto">
        <p className="text-neon-2 text-[15px] mb-4">Build your drink</p>
        <h2 id="lab-title" className="font-display font-bold text-oat leading-[0.98] tracking-[-0.02em] text-[clamp(40px,6.4vw,92px)] max-w-[14ch]">Your cup, your rules.</h2>
        <p className="mt-6 max-w-[52ch] text-oat-2 text-[clamp(16px,1.4vw,19px)] leading-relaxed">Choose a tea, set the sweetness and ice, add toppings. Watch it come together, then add it to your bag.</p>

        <div className="mt-[clamp(40px,6vw,80px)] grid gap-10 lg:gap-16 lg:grid-cols-[1.05fr_1fr] items-start">
          <div className="lg:sticky lg:top-24">
            <div className="relative overflow-hidden rounded-card tactile bg-espresso-2 h-[460px] lg:h-[min(78vh,720px)]"
              style={{ boxShadow: `inset 0 0 120px -30px ${drink.base}55` }}>
              <div aria-hidden="true" className="absolute inset-0 pointer-events-none transition-[background] duration-700"
                style={{ background: `radial-gradient(60% 55% at 50% 60%, ${drink.base}40, transparent 70%)` }} />
              <p aria-hidden="true" className="pointer-events-none absolute bottom-4 left-0 right-0 z-[1] m-0 text-center text-[13px] font-medium text-oat-2">Drag to spin · tap to shake</p>
              <div className="absolute inset-0" data-cursor="DRAG">
                <Suspense fallback={<div aria-hidden="true" className="absolute inset-0" style={{ background: `radial-gradient(40% 40% at 50% 55%, ${drink.base}66, transparent 70%)` }} />}>
                  <BobaCup drink={drink} sweetness={sweetness} ice={ice} toppings={toppings} shake={shake} mode="lab"
                    onShake={() => sfx("shake")} className="w-full h-full" />
                </Suspense>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-9">
            <Step n="1" title="Tea">
              <div role="radiogroup" aria-label="Tea" className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {teas.map((d) => (
                  <label key={d.id} className={`relative cursor-pointer ${d.secret ? "sm:col-span-2 lab-secret" : ""}`}>
                    <input type="radio" name="lab-tea" className="peer sr-only" checked={drinkId === d.id} onChange={() => chooseDrink(d.id)} />
                    <span className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-[14px] leading-snug transition-colors hover:border-oat-3 peer-checked:text-oat peer-checked:bg-espresso-2 ${d.secret ? "border-[#C99A2E] text-[#7A4E0C] peer-checked:border-[#E8B84A]" : "border-line text-oat-2 peer-checked:border-oat"} ${ring}`}>
                      <span aria-hidden="true" className="w-3 h-3 rounded-full shrink-0" style={{ background: d.secret ? "#E8B84A" : d.base, boxShadow: `0 0 10px ${d.secret ? "#E8B84Aaa" : d.base + "88"}` }} />
                      <span>{d.name}</span>
                      {d.secret && <span className="ml-auto rounded-full bg-[#F6E7BF] px-2 py-0.5 text-[12px] text-[#7A4E0C]">Secret menu</span>}
                    </span>
                  </label>
                ))}
              </div>
            </Step>
            <Step n="2" title="Sweetness">
              <Segmented name="lab-sweet" label="Sweetness" options={SWEETNESS} value={sweetness} onChange={setSweetness} />
            </Step>
            <Step n="3" title="Ice">
              <Segmented name="lab-ice" label="Ice" options={ICE} value={ice} onChange={setIce} />
            </Step>
            <Step n="4" title="Toppings">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {TOPPINGS.map((t) => (
                  <label key={t.id} className="relative cursor-pointer">
                    <input type="checkbox" className="peer sr-only" checked={toppings.includes(t.id)} onChange={() => toggleTopping(t.id)} />
                    <span className={`flex items-center justify-between gap-3 rounded-2xl border border-line px-4 py-3 text-[14px] text-oat-2 transition-colors hover:border-oat-3 peer-checked:border-neon peer-checked:text-oat peer-checked:bg-espresso-2 ${ring}`}>
                      <span className="flex items-center gap-3">
                        <span aria-hidden="true" className="w-3 h-3 rounded-full border border-oat-3/40" style={{ background: t.color }} />
                        {t.name}
                      </span>
                      <span className="text-neon-2 tabular-nums">+{money(t.price)}</span>
                    </span>
                  </label>
                ))}
              </div>
            </Step>

            <div className="rounded-card tactile bg-espresso-2 p-6 sm:p-7">
              <p key={note + drink.id} className="lab-fade font-display italic text-oat text-[clamp(19px,1.8vw,24px)] leading-snug min-h-[6.2em] sm:min-h-[4.6em]">
                {note}
              </p>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Meter label="Calories (est.)" value={kcal} max={700} unit="" />
                <Meter label="Caffeine (est.)" value={caffeine} max={120} unit=" mg" />
              </div>
              <p className="mt-3 text-[12px] text-oat-3">Estimates for a 24 oz drink.</p>
              <div className="mt-6 pt-6 border-t border-line flex flex-wrap items-center gap-3">
                <span className={`font-display font-bold text-oat tabular-nums mr-auto ${price === null ? "text-[24px]" : "text-[34px]"}`}>{money(price)}</span>
                <button type="button" className="pill pill-ghost" data-cursor="SHAKE" onClick={() => setShake((n) => n + 1)}>Shake it</button>
                <button type="button" className="pill pill-ghost" data-cursor="VIEW" onClick={printCard}>Print drink card</button>
                <button type="button" className="pill pill-ghost" data-cursor="VIEW" onClick={showCounter}>Show at counter</button>
                {canMotion && (
                  <button type="button" className="pill pill-ghost" aria-pressed={motion === "on"} onClick={toggleMotion}>
                    {motion === "on" ? "Phone shake on" : motion === "denied" ? "Motion blocked" : "Shake your phone to mix"}
                  </button>
                )}
                <button ref={btnRef} type="button" className="pill pill-neon magnetic" data-cursor="SIP" onClick={add}>Add to bag · {money(price)}</button>
              </div>
              <div className="mt-4 min-h-[22px] text-[14px]">
                {added && (
                  <p className="lab-fade text-oat-2">
                    Added to your bag.{" "}
                    <button type="button" className="text-neon-2 underline underline-offset-4 hover:text-neon-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-neon rounded-sm" onClick={() => bagActions.open()}>Open bag</button>
                  </p>
                )}
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-5 text-[14px]">
                <span className="text-oat-2">Or get it delivered:</span>
                {[["DoorDash", SHOP.doordash, "#FF3008"], ["Uber Eats", SHOP.ubereats, "#06C167"], ["Grubhub", SHOP.grubhub, "#F63440"]].map(([n, href, dot]) => (
                  <a key={n} href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-semibold text-oat underline decoration-oat/30 underline-offset-4 hover:decoration-neon">
                    <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: dot }} />{n}
                  </a>
                ))}
              </div>
              <div aria-live="polite" role="status" className="sr-only">{live}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
