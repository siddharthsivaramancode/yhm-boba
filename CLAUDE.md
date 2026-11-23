# You Had Me @ Boba — project instructions

A pitch website the user is building **on spec** for a real local boba shop, to land them as a first
web-design client. It is NOT the shop's official site and the shop has not agreed to anything yet.

## The shop (verified from its Google Maps listing)
- You Had Me @ Boba, 1010 W Poplar Ave, Suite 102, Collierville, TN 38017 · (901) 221-8009
- Open daily 11 AM–10 PM · 4.1★ from 109 Google reviews · no email found
- Their Google "Website" link (youhadmeatboba.com) is a GoDaddy parked page. That is the pitch angle.

## Rules (always follow)
- **Don't publish or deploy.** It looks like the shop's real site (bag, ordering buttons), so a public link could
  mislead customers. Local files only; `index.html` has `noindex`. If the user shares a Netlify link, it should be
  private, for the owner only, until the owner approves.
- **Don't publish it as a claude.ai Artifact** (it would impersonate a real business).
- No real network ordering or payments. The bag sends nothing; pickup = show at counter / call the shop. The catering
  form POSTs to Formspree (`https://formspree.io/f/<SHOP.formspreeId>`, Accept: application/json, _subject, _gotcha
  honeypot) ONLY when `SHOP.formspreeId` in data.js is set; while it's empty it makes no request at all.
- Don't invent facts about the shop (owner names, dates, awards). Ingredient claims (Uji matcha, Belgian
  chocolate, kataifi, house-made espresso jelly) and topping prices (+$0.75, cheese foam +$1.00) came from the
  user's brief: flag them as "confirm with the owner". Also unconfirmed (pitch copy added Nov 2026): the STORY
  claims (pearls cooked every 4 hours, 100% real fruit, ceremonial-grade matcha, "neighborhood third place" framing).
  The Poplar Midnight Tiger is a real drink per the user; its recipe line (double brown sugar, salted cheese foam,
  espresso jelly) is from the user's spec. Its PRICE IS UNKNOWN: `price: null` in data.js, shown as "Ask at counter"
  and left out of every total (money() and bagTotal handle null). Confirm the price with the owner.
- Showcase copy (data.js SHOWCASE) is unconfirmed: the "top 3 crowd favorites" ranking, "West Poplar's #1" and
  "Uji" matcha. Showcase big text uses real menu names only ("Brown sugar / Boba milk"); no invented drink-like
  phrases anywhere, and never "Tiger Sugar" (a rival chain's brand). "The Poplar Midnight Tiger" is a real drink.
- Scribble Wall QR encodes `SHOP.wallUrl` (data.js). It's empty until the site is live, so the QR falls back to the
  current page URL and the sheet says "Preview only: this QR works once the site is live".
- Review quotes in `src/data.js` are real Google reviews; keep them verbatim and credited.
- Sub-agents run on Sonnet (Haiku for boilerplate), never Opus, one file each. Keep replies token-light.
- Never put the user's personal details into outside requests. Commit only when the user says "commit"
  (this folder is not a git repo yet).

## Launch checklist (only after the owner approves; deploying is the user's call, never Claude's)
- Vercel: Vite static build works as is (`npm run build`, output `dist/`, `base: "./"` is fine); no vercel.json needed.
- Set `SHOP.formspreeId` (owner's Formspree form) and `SHOP.wallUrl` (live URL + "#wall") in src/data.js.
- Confirm the canonical / og:url domain in index.html (placeholder https://youhadmeatboba.com/; the owner keeps
  their GoDaddy domain and points it at Vercel).
- Remove `<meta name="robots" content="noindex, nofollow">` from index.html.
- Swap in the owner's photos (public/photos/lookbook-*.jpg) and confirm every "confirm with owner" claim and price.

## Stack and layout
React 18.3 + Vite 5 + Tailwind 3.4 + GSAP 3.12.5 (+ScrollTrigger) + three 0.169 / @react-three/fiber 8.17 /
drei 9.117. Dev: `npm run dev` (port 5190; preview server "yhm-boba" in `.claude/launch.json`).
The user's main project, Quest Learn, is in `C:\QUEST-Learn\quest-learn` with its own CLAUDE.md. Don't mix them.
Verify UI changes in the browser at 1440 and 375 before calling them done; give honest, direct answers.
Share: `npm run build`, then drag `dist/` onto Netlify Drop (`base: "./"`).
```
src/App.jsx                    nav (open/closed badge, sound toggle, bag button #bag-button), kinetic marquee,
                               custom cursor (data-cursor="SHAKE|SIP|DRAG|MIX|ADD|BAG|VIEW|DRAW"), global .magnetic,
                               anchor clicks -> scrollToTarget, grain div; mounts OrderBag, ReceiptModal,
                               CounterTicket, IntroSeal
src/scroll.js                  inertia scroll: rAF lerp over native window scroll (works with ScrollTrigger pins);
                               off for reduced motion and touch. scrollToTarget(el|y) for in-page jumps
src/data.js                    ALL content: DRINKS (+tiger stripe strength), DUBAI, TREATS, SWEETNESS, ICE, TOPPINGS,
                               REVIEWS, SHOP, money(); STORY, SECRET_DRINK, LOOKBOOK_PHOTOS (Unsplash), shopIsOpen()
src/sfx.js                     filtered Web Audio: clink (muffled ice), slosh, shake, bloop/plop, pop, pierce, pin;
                               low-pass master bus; off by default (localStorage yhm-sound)
src/ui/store.js                UI store: labPick (menu -> lab drink), secret unlock (localStorage yhm-secret),
                               introDone (sessionStorage yhm-seal-pierced), receipt + counter-ticket payloads
src/ui/phone.js                phoneClick: tel: links dial on phones; on desktop they copy the number + toast
src/ui/useDialog.js            shared modal hook (scroll lock, focus trap, Esc, focus return) + copyText()
src/order/store.js             bag store (useBag, bagActions add/setQty/remove/open/close/setMode, bagTotal,
                               hasUnpriced: null-priced lines are skipped in totals)
src/order/OrderBag.jsx         slide-out drawer: items, treat quick-add, pickup (Show at counter / call / copy)
                               vs delivery links
src/three/BobaCup.jsx          R3F cup: U-bottom lathe, domed cafe lid, wide pink straw, CanvasTexture sleeve decal,
                               shader liquid (tiger stripes thickened by sweetness, uTiger), softbox Lightformers in a
                               cream env, clearcoat pearls (golden burst), translucent ice, foam pour, droplets.
                               Drag (mouse/touch) spins with inertia; a tap (not a drag) shakes. Highlights use
                               normal blending: additive blending turns black on the transparent canvas.
                               Props: drink, sweetness, ice, toppings[], shake, mode, onShake, scrollProgress, burst
src/components/IntroSeal.jsx   "pierce the seal" intro overlay (once per session, skipped for reduced motion)
src/components/Showcase.jsx    full-bleed "Top 3 crowd favorites" (data.js SHOWCASE): color flood + edge vignette per
                               flavor, giant stacked type, blurred SVG garnishes, pills/arrows/keys/swipe, reuses
                               the lazy BobaCup; CTA loads the drink in the Lab (Dubai: add to bag)
src/components/Toast.jsx       uiActions.toast(msg) confirmation toast (e.g. "Phone number copied!")
src/components/HeroCup.jsx     hero headline (+ "Fresh pearls" / "Collierville, TN" stickers) (waits for the intro) + lazy BobaCup, pinned on >=768px;
                               5 cup taps in 4 s = golden burst + secret-menu unlock toast
src/components/DrinkLab.jsx    configurator (+secret drink once unlocked, picks from the menu), tasting note,
                               kcal/caffeine, Print drink card, Show at counter, opt-in phone shake
                               (DeviceMotion, permission asked on tap), delivery links, Add to bag fly-to-bag
src/components/CounterTicket.jsx  full-screen high-contrast "show this to the barista" ticket (Wake Lock if allowed);
                               banner tinted with the drink's flavor color + shimmering "LIVE ORDER TICKET" badge;
                               customDetail()/ticketLine()/itemColor() build it from Lab or bag data
src/components/ReceiptModal.jsx thermal-receipt drink card: share (navigator.share) / copy, Esc, focus trap
src/components/MenuAndWall.jsx Menu (color-wash hover, spring preview card on fine pointers; row click/Enter =
                               drink -> Lab, dessert -> bag; "Match my craving" mood pills (data.js MOODS) highlight + scroll + Load in Lab;
                               Dubai "Viral drop" spotlight card) and ScribbleWall
                               (draggable notes, doodle pad, "Share wall / QR link")
src/components/WallQR.jsx      QR sheet for the wall (qrcode 1.5.4, lazy-loaded, generated locally)
src/components/OurStory.jsx    "Born on West Poplar" story + three pillars (copy in data.js STORY)
src/components/GalleryAndFooter.jsx  Lookbook: 6 cards, 3x2 grid (photo order: public/photos/lookbook-{neon|pour|wall|dubai}.jpg,
                               then Unsplash placeholder with credit tag, then canvas scene or flavor gradient; warm grade, grain, tilt)
                               and Footer (visit info, big phone pill, keyless Google Maps iframe from SHOP.mapEmbed
                               + "Open in Google Maps", open status, delivery links, catering modal: validates,
                               sends nothing, confirmation with Call the shop + Copy inquiry)
src/styles/base.css            tokens + chrome (nav, badge, pills, cursor, marquee, grain, preview card, receipt)
```

## Design direction
"Sunlit storefront" (the user's call, Nov 23 2026, replacing the old dark theme): Oat Milk Cream `#FBF6EE` and
Crisp Vanilla `#FFFDF9` surfaces with paper grain, Roasted Espresso `#231712` ink, tactile `1.5px solid #231712`
edges with offset shadows on pills and cards (`.pill`, `.tactile`), Neon Sign Pink `#FF4D8D` for CTA fills and the
`@` (never small pink text: use raspberry `#B02A5B` / Tailwind `neon-2`, AA on cream), Matcha `#5F9E4E` for the open
pill, pistachio/chocolate/gold only on the Dubai spotlight. Tailwind token names are historical: `espresso*` =
cream surfaces, `oat*` = ink; they are CSS variables, so `.theme-dark` / `.theme-light` flip a whole section.
Color-blocked chapters: hero = luminous multi-flavor mesh (blurred radial splashes of #FF6FA5 / #FFB35C / #F7C97E
+ matcha/taro pastels pooling at the edges, HeroCup SPLASHES; they drift toward the pointer via GSAP quickTo on
transforms only, static on touch/reduced motion) with a cream-gold halo behind the cup, espresso type, an espresso
"Order now" (.pill-ink) and a vanilla "Build a drink"; showcase flavor floods, Lab pistachio mist `#EDF5E8`, Our Story
deep cacao `#231712` (theme-dark, pink highlights), Scribble Wall buttercream with a blush `#FFEBF2` board and 2px ink
border. Big uppercase display type is OK in the showcase and stickers (the user's call). Fraunces (display) + DM Sans (body). The 3D cup is the one bold element. Sentence-case copy, warm and specific to West Poplar / Collierville,
no all-caps labels, no "→". Reference sites (inspiration only, never copy): Unseen Studio, SŌM, MORPHO WATER,
Newmix Coffee, Santioni Spirits, Johnny Dirty Soda.

## Status and known gaps
- Color + showcase release (Nov 23 2026) builds clean. Headless Chromium 1440 + 375: showcase pills, arrow keys and
  touch swipe; showcase/mood CTAs load the Lab; counter pass tint + badge; "Call it in" copies the number with a
  toast on desktop; 6 Lookbook photos load; draw-call counting confirmed off-screen canvases render 0 frames.
  The straw is aligned to the lid hole (STRAW_* / LID_HOLE constants in BobaCup.jsx compute the hole position).
- Bright storefront release (Nov 23 2026) builds clean. Checked in headless Chromium at 1440 and 375 with touch:
  drag-spin vs tap-shake, secret unlock, Ask-at-counter pricing in Lab/bag/ticket, counter ticket (Esc), QR sheet,
  catering validation + confirmation + copy, no sideways scroll, no console errors.
- Polish release (Nov 23 2026) builds clean. Checked in headless Chromium at 1440 and 375: intro, inertia scroll,
  secret unlock, menu preview and Lab handoff, receipt focus trap and Esc, Lookbook photos, reduced motion (no intro).
  The 3D chunk is lazy (~250 KB gzip).
- Lookbook uses Unsplash stock as placeholders (credited on each card). They are NOT the shop: swap in the owner's
  photos (`public/photos/lookbook-*.jpg` wins automatically). Missing local files log a harmless 404 each.
- Hero pearls are still hard to see through the dark liquid; the cup is good but not studio-perfect.
- Sounds were written by ear, not listened to in this environment; check them with the sound toggle on.
- 60fps not measured (the browser pane throttles when hidden; headless rendering is software).

## Outreach plan
Private: see `CLAUDE.local.md` (gitignored, not on GitHub).
