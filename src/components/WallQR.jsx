// "Share wall / QR link": a printable QR sheet so guests waiting at the counter can scan and add a doodle.
// The QR is generated locally (qrcode package, loaded on demand) from SHOP.wallUrl via wallLink().
// Until the site is live that is just this page's address, so the sheet says so plainly.
import { useEffect, useRef, useState } from "react";
import { SHOP, wallLink } from "../data.js";
import { useDialog, copyText } from "../ui/useDialog.js";

export default function WallQR({ opener, onClose }) {
  const box = useRef(null);
  const [svg, setSvg] = useState("");
  const [msg, setMsg] = useState("");
  const url = wallLink();
  const live = !!SHOP.wallUrl;
  useDialog(box, onClose, opener);

  useEffect(() => {
    let alive = true;
    import("qrcode").then(({ default: QR }) =>
      QR.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#231712", light: "#FFFDF9" } })
    ).then((s) => { if (alive) setSvg(s); }).catch(() => { if (alive) setMsg("Couldn't draw the QR code here. Copy the link instead."); });
    return () => { alive = false; };
  }, [url]);

  const copy = async () => setMsg((await copyText(url)) ? "Link copied." : "Couldn't copy. Select the link text instead.");

  return (
    <div className="fixed inset-0 z-[150] flex items-start justify-center overflow-y-auto bg-[rgba(35,23,18,.55)] px-4 py-10 backdrop-blur-sm sm:items-center"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }} data-native-scroll>
      <div ref={box} role="dialog" aria-modal="true" aria-labelledby="qr-title" className="tactile relative w-full max-w-[420px] rounded-card p-6 text-center sm:p-8">
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full border-[1.5px] border-ink">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" /></svg>
        </button>
        <p className="m-0 text-[14px] font-semibold text-neon-2">The scribble wall</p>
        <h2 id="qr-title" className="m-0 mt-1 font-display text-[30px] font-bold leading-tight">Scan to leave a doodle</h2>
        <p className="m-0 mt-2 text-[15px] text-oat-2">Waiting for your drink? Point your camera here and add a note to the wall.</p>
        <div className="mx-auto mt-5 aspect-square w-[min(100%,260px)] rounded-2xl border-[1.5px] border-ink bg-[#FFFDF9] p-3 [&>svg]:h-full [&>svg]:w-full"
          role="img" aria-label={`QR code for ${url}`} dangerouslySetInnerHTML={svg ? { __html: svg } : undefined} />
        {!live && (
          <p className="m-0 mt-4 rounded-xl border-[1.5px] border-dashed border-ink bg-[#FFF3D9] px-3 py-2 text-[13.5px] font-semibold">
            Preview only: this QR works once the site is live.
          </p>
        )}
        <p className="m-0 mt-3 break-all text-[13px] text-oat-3">{url}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <button type="button" className="pill pill-neon" onClick={copy} data-autofocus>Copy link</button>
          <button type="button" className="pill pill-ghost" onClick={onClose}>Done</button>
        </div>
        <p role="status" aria-live="polite" className="m-0 mt-3 min-h-[1.3em] text-[14px] text-neon-2">{msg}</p>
      </div>
    </div>
  );
}
