// Shared content for every section. Prices come from the brief; confirm with the owner before going live.
// Menu copy. Ingredient claims (Uji matcha, Belgian chocolate, kataifi) and topping prices come from the
// pitch brief: confirm every line with the owner before this goes live.
// kcal / caffeine are rough estimates for a 24 oz regular-sweet drink, used only by the lab's spec card.
export const DRINKS = [
  { id: "matcha", name: "Matcha Milk Tea", price: 7.99, note: "Hand-whisked ceremonial Uji matcha poured over velvet milk. Grassy, round and only lightly sweet.",
    taste: "earthy ceremonial Uji matcha folded into velvet milk", base: "#7BAE5F", cream: "#E9F1DC", deep: "#3E5E2C", swirl: "#F4F8EC", kind: "milk", kcal: 290, caffeine: 70 },
  { id: "honeydew", name: "Honeydew Milk Tea", price: 7.99, note: "Ripe honeydew shaken with jasmine green tea and milk. Cool, pale and melon-sweet.",
    taste: "ripe honeydew and jasmine green tea, cool and pale", base: "#B7D99A", cream: "#F1F7E6", deep: "#5E7D45", swirl: "#FFFFFF", kind: "milk", kcal: 310, caffeine: 35 },
  { id: "horchata", name: "Horchata Frappe with Coffee Jelly", price: 7.99, note: "Cinnamon-spiced rice milk blended over ice, poured over house-made espresso jelly cubes.",
    taste: "cinnamon-spiced rice milk blended thick over ice", base: "#E7D3B5", cream: "#F8EEDF", deep: "#8A6440", swirl: "#C99A6B", kind: "frappe", kcal: 420, caffeine: 60 },
  { id: "taro", name: "Taro Milk Tea", price: 7.99, note: "Roasted taro root steeped into black tea and milk. Nutty, vanilla-soft and unapologetically purple.",
    taste: "roasted taro root with a nutty, vanilla-soft finish", base: "#B79AD6", cream: "#EDE3F7", deep: "#5E4580", swirl: "#F6EEFF", kind: "milk", kcal: 340, caffeine: 40 },
  { id: "mango", name: "Mango Fruit Refresher", price: 7.99, note: "Sun-ripe mango shaken hard with green tea and ice. Bright, tart and made for a Tennessee July.",
    taste: "sun-ripe mango shaken bright with green tea", base: "#F6B23C", cream: "#FFE8BD", deep: "#A8650C", swirl: "#FFD27A", kind: "fruit", kcal: 210, caffeine: 30 },
  { id: "brownsugar", name: "Brown Sugar Boba Milk", price: 7.99, note: "Pearls slow-cooked in dark brown sugar syrup, spooned warm against cold fresh milk so the caramel streaks down the glass.",
    taste: "slow-cooked brown sugar caramel streaking through cold fresh milk", base: "#B07A4A", cream: "#F3E3D0", deep: "#5A341B", swirl: "#4A2614", kind: "milk", kcal: 450, caffeine: 0, tiger: 1 },
];
// The Dubai cup is a dessert, not a configurable drink.
export const DUBAI = { id: "dubai", name: "Dubai Strawberry Chocolate Cup", price: 15.99, size: "16 oz",
  note: "16 oz of macerated sweet strawberries layered with warm Belgian milk chocolate, roasted pistachio cream and crisp toasted kataifi pastry.",
  base: "#D9485F", cream: "#F7D9DE", deep: "#4A2617", kind: "treat" };
export const BROWN_SUGAR = DRINKS.find((d) => d.id === "brownsugar");

export const TREATS = [
  DUBAI,
  { id: "pancakes", name: "Mini Pancakes", price: 10.99, note: "A skillet of bite-size buttermilk pancakes, griddled to order and dusted with powdered sugar. Made for sharing, rarely shared.", base: "#E3A857", cream: "#FBEBCF", deep: "#7A4E1C", kind: "treat" },
  { id: "tiramisu", name: "Tiramisu", price: 6.99, note: "Espresso-soaked ladyfingers under a cloud of mascarpone and a hard dusting of cocoa.", base: "#8C6A52", cream: "#EADCCF", deep: "#3E2A1E", kind: "treat" },
];

// Lab options. Topping prices from the brief; confirm with the owner.
export const SWEETNESS = [
  { id: 0, label: "0%", phrase: "unsweetened, so the tea leads" },
  { id: 50, label: "50%", phrase: "half sweet" },
  { id: 75, label: "75%", phrase: "three-quarter sweet" },
  { id: 100, label: "100%", phrase: "full sweet, the way the shop makes it" },
];
export const ICE = [
  { id: "none", label: "No ice", cubes: 0 },
  { id: "less", label: "Less ice", cubes: 2 },
  { id: "regular", label: "Regular ice", cubes: 4 },
];
export const TOPPINGS = [
  { id: "tapioca", name: "Tapioca pearls", short: "Boba", price: 0.75, phrase: "chewy brown-sugar tapioca", color: "#2B1710", kcal: 130 },
  { id: "jelly", name: "Coffee jelly", short: "Coffee jelly", price: 0.75, phrase: "bittersweet espresso jelly", color: "#3B2216", kcal: 40, caffeine: 25 },
  { id: "popping", name: "Popping boba", short: "Popping boba", price: 0.75, phrase: "strawberry popping boba", color: "#F2557A", kcal: 70 },
  { id: "foam", name: "Cheese foam", short: "Cheese foam", price: 1.0, phrase: "a salted cream cheese foam cap", color: "#FFF6E8", kcal: 120, cap: true },
];
// Prices can be null (unknown, e.g. the Poplar Midnight Tiger): money() then reads "Ask at counter".
export const isPriced = (n) => typeof n === "number" && Number.isFinite(n);
export const money = (n) => (isPriced(n) ? "$" + n.toFixed(2) : "Ask at counter");
export const lineTotal = (item) => (isPriced(item.price) ? item.price * (item.qty || 1) : null);

// Real Google review quotes, credited to Google reviews.
export const REVIEWS = [
  { q: "I wish I could give this place a 10/5! That was the best boba I've ever had in my life!", who: "Andrew R.", stars: 5 },
  { q: "Cute decor, the owner is super friendly, and of course the boba was delicious.", who: "Google review", stars: 5 },
  { q: "We ordered 2 honeydew milk teas and 1 horchata frappe with coffee jelly. Everything was so delicious!!", who: "Google review", stars: 5 },
  { q: "The store is exceptionally clean, with happy music playing in the background.", who: "James B.", stars: 5 },
  { q: "Very friendly atmosphere, great drinks … this one is open late. 10/10", who: "Jannah", stars: 5 },
];

export const SHOP = {
  name: "You Had Me @ Boba",
  street: "1010 W Poplar Ave, Suite 102",
  city: "Collierville, TN 38017",
  address: "1010 W Poplar Ave, Suite 102, Collierville, TN 38017",
  phone: "(901) 221-8009",
  tel: "+19012218009",
  hours: "Open daily, 11 AM to 10 PM",
  rating: 4.1,
  reviews: 109,
  maps: "https://www.google.com/maps/search/?api=1&query=You+Had+Me+%40+Boba+1010+W+Poplar+Ave+Collierville+TN",
  doordash: "https://www.doordash.com/search/store/you%20had%20me%20at%20boba%20collierville/",
  ubereats: "https://www.ubereats.com/search?q=You%20Had%20Me%20%40%20Boba",
  grubhub: "https://www.grubhub.com/search?queryText=You%20Had%20Me%20%40%20Boba",
  // Scribble Wall QR target. Empty = placeholder (the current page URL + #wall). Set it to the real live
  // address + "#wall" once the owner approves and the site is deployed; the QR only works then.
  wallUrl: "",
  // Catering form -> Formspree. Paste the form id (the part after formspree.io/f/) once the owner says yes and
  // has set up the form with their email. Empty = the form sends NOTHING and shows a local confirmation.
  formspreeId: "",
};
export const wallLink = () => SHOP.wallUrl || (typeof window !== "undefined" ? window.location.origin + window.location.pathname + "#wall" : "#wall");

export const reduceMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export const finePointer = () => typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/* ---------------------------------------------------------------- polish release additions */

// "Our Story" copy. NEEDS THE OWNER'S CONFIRMATION before going live: the 4-hour pearl batches,
// "100% real fruit", "ceremonial matcha" and the founding/late-night framing are pitch copy, not verified facts.
export const STORY = {
  eyebrow: "Our story",
  title: "Born on West Poplar. Built for late nights and sweet cravings.",
  paragraphs: [
    "You Had Me @ Boba is Collierville's neighborhood third place: not home, not work, just a warm room on West Poplar with happy music, a wall full of notes from regulars, and drinks made one cup at a time. People come in for a boba and stay for the conversation.",
    "Tapioca pearls simmer warm in brown sugar in small batches every 4 hours, ceremonial matcha is whisked to order, and the Dubai chocolate strawberry cups are layered fresh when you ask. Before you leave, grab a pen and leave your mark on the Scribble Wall. The sign stays lit till ten.",
  ],
  pillars: [
    { id: "pearls", title: "Small-batch pearls", sub: "Cooked every 4 hrs", text: "Tapioca is simmered in brown sugar in small batches, so every cup gets pearls that are soft, warm and chewy." },
    { id: "fruit", title: "100% real fruit & ceremonial matcha", sub: "No powders where it counts", text: "Refreshers start with real fruit, and the matcha is ceremonial grade, whisked by hand for every order." },
    { id: "late", title: "Open late till 10 PM daily", sub: "11 AM to 10 PM, every day", text: "Lunch break, after school or one last cup after dinner. The pink sign stays on till ten." },
  ],
};

// Secret menu, unlocked by shaking the hero cup 5 times. Siddharth says the shop really sells it; the recipe
// (double brown sugar, salted cheese foam, espresso jelly) is from his spec. PRICE UNKNOWN: null on purpose,
// shown as "Ask at counter" everywhere and left out of every total. Confirm the price with the owner.
export const SECRET_DRINK = {
  id: "midnight", name: "The Poplar Midnight Tiger", price: null, secret: true,
  note: "Double brown sugar, salted cheese foam and espresso jelly. Off-menu, for people who shook the cup.",
  taste: "double brown sugar streaking through cold milk, deep and smoky-sweet",
  base: "#9A6236", cream: "#F1DCC4", deep: "#3E2010", swirl: "#2E160A", kind: "milk", kcal: 520, caffeine: 25,
  tiger: 1.6, toppings: ["tapioca", "foam", "jelly"],
};

// Lookbook photos. Local public/photos/lookbook-{kind}.jpg wins; then these Unsplash placeholders
// (free Unsplash License, checked with curl -I = 200 on 2026-11-23); then the canvas scene.
// They are stock mood shots, NOT the shop: swap in the owner's photos before showing it widely.
const U = (id) => `https://images.unsplash.com/${id}?w=1100&q=78&auto=format&fit=crop`;
export const LOOKBOOK_PHOTOS = {
  neon: { src: U("photo-1682422319466-011464028916"), by: "Raunaq Sachdev", alt: "A neon sign reading you're the boba to my tea, glowing on a dark wall under ivy" },
  pour: { src: U("photo-1745883949374-baeba0ed57c3"), by: "Malcolm Broström", alt: "A hand holding up a brown sugar milk tea with caramel stripes and pearls" },
  wall: { src: U("photo-1758799011821-16c66a714abc"), by: "Tanya Barrow", alt: "A dark brick wall covered in chalk names, dates and doodles" },
  dubai: { src: U("photo-1749767138185-793f09915dc3"), by: "Frankie Lopez", alt: "Strawberries under melted milk chocolate in a clear cup" },
  matcha: { src: U("photo-1589698272390-0501a07619bb"), by: "Payoon Gerinto", alt: "A bamboo whisk frothing bright green matcha in a bowl" },
  sweets: { src: U("photo-1460103841677-11ff72e1f0b9"), by: "Alisa Anton", alt: "A short stack of pancakes dusted with powdered sugar and topped with raspberries" },
};

// "Top 3 crowd favorites" showcase. UNCONFIRMED pitch copy: the top-3 ranking itself, "West Poplar's #1"
// and "Uji" matcha all need the owner's confirmation. Giant background text uses real menu names only
// (never "Tiger Sugar", a rival chain's brand). Colors: flood = section background, glow = edge vignette.
export const SHOWCASE = [
  { n: "01", drinkId: "brownsugar", title: "Brown Sugar Boba Milk", big: ["Brown sugar", "Boba milk"],
    blurb: "Warm brown sugar pearls, cold fresh milk, caramel streaks down the glass.", flood: "#5C341E", glow: "#D98A3C", garnish: "pearls" },
  { n: "02", drinkId: "matcha", title: "Uji Matcha Milk Tea", big: ["Hand-whisked", "Uji matcha"],
    blurb: "Ceremonial matcha whisked to order over velvet milk. Grassy, round, lightly sweet.", flood: "#3F7A32", glow: "#8CD175", garnish: "matcha" },
  { n: "03", treatId: "dubai", title: "Dubai Strawberry Chocolate Cup", big: ["Viral drop", "Dubai cup"],
    blurb: "Strawberries, warm milk chocolate, pistachio cream and crisp kataifi in a 16 oz cup.", flood: "#C8235A", glow: "#FF6B9D", garnish: "berry" },
];

// "Match my craving" mood pills in the Menu
export const MOODS = [
  { id: "creamy", label: "Sweet & creamy", itemId: "brownsugar" },
  { id: "fruity", label: "Fresh & fruity", itemId: "mango" },
  { id: "viral", label: "Viral indulgence", itemId: "dubai" },
];

// Opening hours logic shared by the header badge and the footer (America/Chicago, 11 AM to 10 PM).
export const OPEN_HOUR = 11, CLOSE_HOUR = 22;
export function shopIsOpen(now = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", hour: "numeric", hourCycle: "h23" }).formatToParts(now);
    const h = parseInt(parts.find((p) => p.type === "hour").value, 10) % 24;
    return h >= OPEN_HOUR && h < CLOSE_HOUR;
  } catch (e) {
    return null;
  }
}
