# You Had Me @ Boba (concept site)

A pitch mockup for You Had Me @ Boba in Collierville, TN. It is **not** the shop's official site, and the shop
has not approved it. Keep it private: `index.html` has `noindex`, and nothing on the page sends orders, payments
or form data anywhere.

Stack: React 18 + Vite 5 + Tailwind 3 + GSAP 3 (ScrollTrigger) + three.js / React Three Fiber (lazy 3D cup) + qrcode.
Look: bright "sunlit storefront" (cream walls, espresso ink, tactile borders, pink neon CTAs).

## Run
    npm install
    npm run dev        # http://localhost:5190

## Build a private preview
    npm run build
Then drag the `dist/` folder onto https://app.netlify.com/drop and share that link only with the owner.

## Launch checklist (Vercel, only after the owner says yes)
Vercel detects Vite automatically (build `npm run build`, output `dist/`); no extra config is needed.
1. `src/data.js`: set `SHOP.formspreeId` to the owner's Formspree form id so catering inquiries reach their email
   (until then the form sends nothing and shows a local confirmation), and set `SHOP.wallUrl` to the live URL + `#wall`.
2. `index.html`: confirm the canonical / `og:url` domain (placeholder `https://youhadmeatboba.com/`).
3. `index.html`: delete the `robots noindex, nofollow` line so Google can index the site.
4. Add the owner's photos to `public/photos/` and confirm the claims and prices listed below.

## Before showing the owner
- Photos: the Lookbook shows Unsplash stock as placeholders (credited on each card). Add the owner's shots as
  `public/photos/lookbook-neon.jpg`, `lookbook-pour.jpg`, `lookbook-wall.jpg`, `lookbook-dubai.jpg`; local
  files replace the placeholders automatically.
- Confirm with the owner (all in `src/data.js`): prices and topping prices, ingredient claims (Uji/ceremonial
  matcha, Belgian chocolate, kataifi, house-made espresso jelly), the "Our Story" copy (pearls every 4 hours,
  100% real fruit, open late), the showcase copy ("top 3", "West Poplar's #1", "Uji"), the Poplar Midnight Tiger's price (unknown, shown as "Ask at counter"), and the
  delivery links.
- Wall QR: set `SHOP.wallUrl` in `src/data.js` to the live address + `#wall` once the site is deployed. Until then
  the QR points at whatever page you're viewing and says it only works once the site is live.
- The review quotes are real Google reviews; keep them word for word.

## What's on the page
- "Pierce the seal" intro (once per session; skipped with reduced motion), inertia scrolling on desktop
- Hero 3D cup: tap to shake; 5 taps in a row unlock a secret-menu drink
- "Top 3 crowd favorites" showcase: the whole section floods with each drink's color (pills, arrows, keys, swipe)
- Hero and Lab 3D cup: drag to spin (touch too), tap to shake, optional phone-shake (asks for motion permission)
- Drink Lab: build a drink, add it to the bag, print a receipt-style drink card, or "Show at counter"
- Bag: pickup via a full-screen "show this to the barista" ticket, call-in or copy, or delivery links
- Menu with a floating preview card and "Match my craving" pills; click a drink to open it in the Lab
- Menu "Viral drop" spotlight for the 16 oz Dubai Strawberry Chocolate Cup
- Our Story (dark cacao chapter), a 6-photo Lookbook grid, Scribble Wall (draggable reviews, doodle pad, QR share), visit info with a live open status
- Catering inquiry form: validates and shows a confirmation, but sends nothing; it offers Call the shop / Copy inquiry

## Files
- `src/App.jsx`: nav + open badge, marquee, cursor, magnetic buttons, sound toggle
- `src/scroll.js`: inertia scroll and `scrollToTarget`
- `src/data.js`: all content (menu, story, secret drink, photos, shop info, hours)
- `src/sfx.js`: synthesized Web Audio sounds (off by default)
- `src/ui/store.js`, `src/order/store.js`: small shared stores (UI state, bag)
- `src/three/BobaCup.jsx`: the 3D cup
- `src/components/`: IntroSeal, HeroCup, Showcase, Toast, DrinkLab, ReceiptModal, CounterTicket, MenuAndWall, WallQR, OurStory,
  GalleryAndFooter
- `src/ui/useDialog.js`: shared modal behavior (focus trap, Escape, scroll lock) and copy helper
- `src/styles/base.css`: tokens and shared styles
