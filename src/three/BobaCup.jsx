// 3D boba cup (React Three Fiber). Glass cup with transmission, procedural swirl liquid,
// physics toppings, ice, cheese foam, condensation and fake caustics. Fills its parent.
// Props: { drink, sweetness=100, ice="regular", toppings=[], shake=0, mode="hero"|"lab",
//          interactive=true, onShake, scrollProgress (number | ref), burst (number: golden pearl burst), className }
// The glass is a lathe with a true curved U-bottom; drink.tiger (0..1.6) sets how strongly brown-sugar
// tiger stripes cling to the walls, and sweetness thickens them.
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, ContactShadows, RoundedBox } from "@react-three/drei";
import { ICE } from "../data.js";
import { sfx } from "../sfx.js";

const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const H = 2.4, Y0 = -1.2, RB = 0.6, RT = 0.82;          // cup height, bottom y, radii
const BR = 0.52, BP = 2.3;                                // U-bottom: curve height and superellipse power
const taper = (y) => RB + (RT - RB) * ((y - Y0) / H);
// radius at height y: straight taper above the curve, a rounded U (superellipse quarter) below it
const cupR = (y) => {
  const u = Math.min(1, Math.max(0, (y - Y0) / BR));
  return taper(y) * Math.pow(1 - Math.pow(1 - u, BP), 1 / BP);
};
const FLOOR = Y0 + 0.045;                                 // inside bottom of the glass
// sample heights densely near the bottom curve, evenly up the wall
function heights(from, to, n = 40) {
  const out = [];
  for (let i = 0; i <= n; i++) { const t = i / n; out.push(from + (to - from) * (t < 0.4 ? Math.pow(t / 0.4, 1.8) * 0.4 : t)); }
  return out;
}

/* ---------- geometry helpers ---------- */
function lathe(rOff, top, seg = 64) {
  const pts = [new THREE.Vector2(0, FLOOR)];
  for (const y of heights(FLOOR + 0.004, top, 36)) pts.push(new THREE.Vector2(Math.max(0.001, cupR(y) + rOff), y));
  pts.push(new THREE.Vector2(0, top));
  return new THREE.LatheGeometry(pts, seg);
}
function cupGeometry() {
  const p = [new THREE.Vector2(0, Y0)];
  for (const y of heights(Y0 + 0.002, Y0 + H, 44)) p.push(new THREE.Vector2(cupR(y), y));
  p.push(new THREE.Vector2(RT + 0.025, Y0 + H + 0.01), new THREE.Vector2(RT + 0.01, Y0 + H + 0.035), new THREE.Vector2(RT - 0.02, Y0 + H));
  const inner = heights(FLOOR, Y0 + H, 44).reverse();
  for (const y of inner) p.push(new THREE.Vector2(Math.max(0.001, cupR(y) - 0.02), y));
  p.push(new THREE.Vector2(0, FLOOR));
  return new THREE.LatheGeometry(p, 96);
}
// printed "You Had Me @ Boba" decal on the cup wall: a CanvasTexture on a lathe band just outside the
// glass. The canvas is transparent between the letters, so the drink shows through like real printing.
const SLEEVE_Y0 = Y0 + 0.62, SLEEVE_Y1 = Y0 + 1.42;
function sleeveGeometry() {
  const pts = [];
  for (let i = 0; i <= 12; i++) { const y = SLEEVE_Y0 + ((SLEEVE_Y1 - SLEEVE_Y0) * i) / 12; pts.push(new THREE.Vector2(cupR(y) + 0.009, y)); }
  return new THREE.LatheGeometry(pts, 96);
}
function sleeveTexture() {
  const c = document.createElement("canvas");
  c.width = 2048; c.height = 320;
  const x = c.getContext("2d");
  const rows = (cx) => {
    // badge: pink @ disc, wordmark, small hearts and a hand-drawn underline
    x.save(); x.translate(cx, 160);
    x.fillStyle = "#FF4D8D"; x.strokeStyle = "#231712"; x.lineWidth = 7;
    x.beginPath(); x.arc(-300, 0, 74, 0, Math.PI * 2); x.fill(); x.stroke();
    x.fillStyle = "#FFFDF9"; x.font = "italic 300 118px Fraunces, Georgia, serif"; x.textAlign = "center"; x.textBaseline = "middle";
    x.fillText("@", -300, 6);
    x.textAlign = "left"; x.lineJoin = "round"; x.strokeStyle = "#231712"; x.lineWidth = 12; x.fillStyle = "#FFFDF9";
    x.font = "700 70px Fraunces, Georgia, serif"; x.strokeText("You Had Me", -200, -34); x.fillText("You Had Me", -200, -34);
    x.font = "italic 600 70px Fraunces, Georgia, serif"; x.strokeText("@ Boba", -200, 44); x.fillText("@ Boba", -200, 44);
    x.strokeStyle = "#FF4D8D"; x.lineWidth = 8; x.lineCap = "round";
    x.beginPath(); x.moveTo(-196, 96); x.bezierCurveTo(-80, 112, 60, 82, 190, 100); x.stroke();
    x.font = "700 30px 'DM Sans', system-ui, sans-serif"; x.lineWidth = 8; x.strokeText("Collierville, TN", 250, 4); x.fillText("Collierville, TN", 250, 4);
    const heart = (hx, hy, s) => { x.beginPath(); x.moveTo(hx, hy + s * 0.3); x.bezierCurveTo(hx, hy - s * 0.3, hx - s, hy - s * 0.3, hx - s, hy + s * 0.15); x.bezierCurveTo(hx - s, hy + s * 0.6, hx, hy + s, hx, hy + s * 1.1); x.bezierCurveTo(hx, hy + s, hx + s, hy + s * 0.6, hx + s, hy + s * 0.15); x.bezierCurveTo(hx + s, hy - s * 0.3, hx, hy - s * 0.3, hx, hy + s * 0.3); x.fill(); };
    x.fillStyle = "#FF4D8D"; heart(310, -70, 16); heart(360, 70, 11);
    x.restore();
  };
  rows(512); rows(1536);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  t.wrapS = THREE.RepeatWrapping; t.offset.x = 0.25; // a badge faces the camera
  return t;
}

// Straw and lid hole share one definition: the hole sits exactly where the straw's axis meets the dome,
// and its opening is sized to the straw's radius.
const STRAW_R = 0.11, STRAW_LEN = 2.9;
const STRAW_POS = new THREE.Vector3(0.2, 0.62, 0.05);
const STRAW_ROT = new THREE.Euler(0.05, 0, -0.17);
const LID_Y = Y0 + H + 0.035, DOME_A = RT + 0.03, DOME_B = DOME_A * 0.44; // dome: half-ellipsoid
const LID_HOLE = (() => {
  // ray from the straw centre along its axis, intersected with the dome ellipsoid
  const d = new THREE.Vector3(0, 1, 0).applyEuler(STRAW_ROT), o = STRAW_POS.clone().sub(new THREE.Vector3(0, LID_Y, 0));
  const A = (d.x * d.x + d.z * d.z) / (DOME_A * DOME_A) + (d.y * d.y) / (DOME_B * DOME_B);
  const B = 2 * ((o.x * d.x + o.z * d.z) / (DOME_A * DOME_A) + (o.y * d.y) / (DOME_B * DOME_B));
  const C = (o.x * o.x + o.z * o.z) / (DOME_A * DOME_A) + (o.y * o.y) / (DOME_B * DOME_B) - 1;
  const t = (-B + Math.sqrt(B * B - 4 * A * C)) / (2 * A); // far root = where it exits the top of the dome
  return o.add(d.multiplyScalar(t)); // in lid-group coordinates
})();

// a thin vertical strip just outside the glass, for a view-fixed specular streak
function streakGeometry(phiStart, phiLength) {
  const pts = heights(Y0 + 0.05, Y0 + H - 0.02, 30).map((y) => new THREE.Vector2(cupR(y) + 0.006, y));
  return new THREE.LatheGeometry(pts, 6, phiStart, phiLength);
}

/* ---------- liquid shader ---------- */
const NOISE = /* glsl */ `
float h3(vec3 p){ p = fract(p*0.3183099+.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float n3(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.-2.*f);
  return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z); }
float fbm(vec3 p){ float a=.5, s=0.; for(int i=0;i<4;i++){ s+=a*n3(p); p*=2.03; a*=.5; } return s; }`;
const liquidVert = /* glsl */ `
varying vec3 vPos; varying vec3 vN; varying vec3 vView;
void main(){ vPos=position; vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.); vView=mv.xyz; gl_Position=projectionMatrix*mv; }`;
const liquidFrag = /* glsl */ `
uniform vec3 uBase, uCream, uDeep, uSwirl; uniform float uSweet, uMix, uTime, uTop, uFruit, uTiger;
varying vec3 vPos; varying vec3 vN; varying vec3 vView;
${NOISE}
void main(){
  float h = clamp((vPos.y - ${FLOOR.toFixed(3)}) / (uTop - ${FLOOR.toFixed(3)}), 0., 1.);
  float ang = atan(vPos.z, vPos.x);
  vec3 p = vec3(cos(ang)*1.6, vPos.y*1.1, sin(ang)*1.6);
  float t = uTime*.12;
  vec3 q = vec3(fbm(p*1.2+vec3(0.,t,0.)), fbm(p*1.2+vec3(5.2,-t,1.3)), 0.);
  // caramel veins run down the walls; mixing blurs them into the body
  float v = fbm(vec3(ang*2.4 + q.x*2.2 + uMix*3.0*sin(uTime*.7), vPos.y*1.4 - t*2., q.y*2.));
  float th = mix(.66, .48, uSweet);
  float veins = smoothstep(th, th+.07, v) * (1. - .75*uMix) * (.35 + .65*uSweet);
  float cloud = smoothstep(.35, .8, fbm(p*2.2 + q*1.5 + t)) * .35;
  vec3 body = mix(uDeep, uBase, smoothstep(0., .55, h));
  body = mix(body, uCream, smoothstep(.5, 1., h) * .6 + cloud * .25);
  body = mix(body, mix(uBase, uCream, .5), uMix * .35);
  vec3 col = mix(body, uSwirl, veins);
  // brown-sugar tiger stripes: diagonal syrup streaks clinging to the wall. Sweetness lowers the
  // threshold and widens the edge, so 0% shows faint threads and 100% shows thick bands.
  float ts = fbm(vec3(ang*3.2 + vPos.y*1.35 + q.x*1.4, vPos.y*0.75 - t*0.35, 3.7 + q.y));
  float tth = mix(.70, .44, uSweet) - max(uTiger - 1., 0.) * .1;
  float tw = mix(.025, .09, uSweet);
  float tfade = smoothstep(.08, .3, h) * (1. - smoothstep(.82, 1., h) * .7);
  float tiger = smoothstep(tth, tth + tw, ts) * tfade * min(uTiger, 1.) * (1. - .7*uMix);
  col = mix(col, uSwirl * mix(1.15, .8, uSweet), tiger * mix(.55, .95, uSweet));
  vec3 n = normalize(vN), vd = normalize(-vView);
  float fres = pow(1. - abs(dot(n, vd)), 2.5);
  float diff = .7 + .3*max(dot(n, normalize(vec3(.4,.8,.5))), 0.);
  col = col*diff + fres*.12*vec3(1.,.85,.8);
  col = mix(vec3(dot(col, vec3(.299,.587,.114))), col, 1.25);
  col = mix(col, col*1.12 + .05, uFruit);
  gl_FragColor = vec4(col, mix(.55, mix(.98, .85, uFruit), smoothstep(.06, .3, h)));
  #include <colorspace_fragment>
}`;
const causticFrag = /* glsl */ `
uniform float uTime; uniform vec3 uColor; varying vec2 vUv;
void main(){
  vec2 p = (vUv-.5)*7.; float c = 0.;
  for (int i=0;i<3;i++){ float fi=float(i); p += vec2(sin(p.y*1.3+uTime*.6+fi), cos(p.x*1.1-uTime*.5+fi*1.7))*.45; c += .5/max(length(fract(p)-.5+.02), .05); }
  c = min(pow(c*.12, 3.), 3.);
  float r = length(vUv-.5);
  float fall = 1. - smoothstep(.05, .23, r);   // ~1.6x cup base radius, fully transparent well inside the plane edge
  float a = clamp((c*.30 + .06) * fall, 0., .55) * fall;
  gl_FragColor = vec4(uColor*1.2, a);
}`;

// lid and glass highlights: white with alpha and normal blending. (Additive blending writes alpha 1 into the
// transparent canvas, which shows up as black on the cream page.)
const filmFrag = /* glsl */ `
varying vec2 vUv;
void main(){
  vec2 p = vUv - .5; float r = length(p) * 2.;
  float ring = smoothstep(.84, .96, r) * (1. - smoothstep(.96, 1., r));
  float streak = exp(-pow((p.x*.8 + p.y*.6 + .13) / .05, 2.)) * (1. - smoothstep(.5, .95, r));
  float dot2 = exp(-pow(length(p - vec2(.2, .16)) / .05, 2.));
  float a = .035 + .05*(1. - r) + streak*.5 + ring*.32 + dot2*.35;
  gl_FragColor = vec4(vec3(1., .97, .94), min(a, 1.));
}`;
const streakFrag = /* glsl */ `
uniform float uI; varying vec2 vUv;
void main(){
  float across = smoothstep(0., .45, vUv.x) * (1. - smoothstep(.55, 1., vUv.x));
  float along = smoothstep(.04, .3, vUv.y) * (1. - smoothstep(.78, .98, vUv.y));
  float a = across * along * uI;
  gl_FragColor = vec4(vec3(1., .96, .92), a);
}`;
const uvVert = "varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }";

/* ---------- toppings physics ---------- */
const TYPES = [
  { id: "tapioca", n: 18, r: 0.085, buoy: 0 },
  { id: "jelly", n: 10, r: 0.085, buoy: 0.1 },
  { id: "popping", n: 12, r: 0.072, buoy: 0.55 },
];

const GOLD = new THREE.Color("#E8B84A"), PEARL = new THREE.Color("#2B1710");
function Toppings({ toppings, level, shakeRef, swirlRef, burst = 0 }) {
  const meshes = useRef([]);
  const pearlMat = useRef();
  const gold = useRef(0);
  const firstBurst = useRef(true);
  const P = useMemo(() => TYPES.map((t) => Array.from({ length: t.n }, () => ({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, s: 0, on: false, rx: Math.random() * 6, ry: Math.random() * 6 }))), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const all = useMemo(() => P.flatMap((arr, ti) => arr.map((p) => ((p.t = ti), p))), [P]);
  useEffect(() => {
    TYPES.forEach((t, ti) => {
      const want = toppings.includes(t.id);
      P[ti].forEach((p, i) => {
        if (want && !p.on) {
          p.on = true; p.s = 0.01;
          const a = Math.random() * 6.28, rr = Math.random() * 0.35;
          p.x = Math.cos(a) * rr; p.z = Math.sin(a) * rr; p.y = 0.8 + Math.random() * 0.3; p.vx = p.vy = p.vz = 0; // drop in from just under the lid
        } else if (!want) p.on = false;
      });
      if (want) setTimeout(() => sfx("bloop"), 350);
    });
  }, [toppings, P]);
  // secret-menu burst: pearls leap and glow gold for a few seconds
  useEffect(() => {
    if (firstBurst.current) { firstBurst.current = false; return; }
    gold.current = 1;
    if (reduce) return;
    all.forEach((p) => { if (!p.on) return; p.vy += 5 + Math.random() * 4; p.vx += (Math.random() - 0.5) * 3; p.vz += (Math.random() - 0.5) * 3; });
  }, [burst, all]);
  useFrame((_, dt) => {
    dt = Math.min(dt, 1 / 30);
    const shake = shakeRef.current, sw = swirlRef.current;
    if (pearlMat.current) {
      gold.current = Math.max(0, gold.current - dt / 4.5);
      const g = Math.min(1, gold.current * 1.6);
      pearlMat.current.color.copy(PEARL).lerp(GOLD, g);
      pearlMat.current.emissive.copy(GOLD).multiplyScalar(g * 0.55);
    }
    for (let k = 0; k < 2; k++) {
      const h = dt / 2;
      for (const p of all) {
        if (p.s <= 0.001 && !p.on) continue;
        const t = TYPES[p.t], inL = p.y < level;
        p.vy += (-9 * (inL ? 0.22 : 1) + (inL ? t.buoy * 2.4 : 0)) * h;
        if (inL) { const d = Math.exp(-3.2 * h); p.vx *= d; p.vy *= d; p.vz *= d; }
        if (shake > 0.05) { p.vx += (Math.random() - 0.5) * shake * 18 * h; p.vz += (Math.random() - 0.5) * shake * 18 * h; p.vy += Math.random() * shake * 14 * h; }
        if (sw > 0.02) { p.vx += -p.z * sw * 6 * h; p.vz += p.x * sw * 6 * h; }
        p.x += p.vx * h; p.y += p.vy * h; p.z += p.vz * h;
        // the U-bottom narrows the space for low pearls; check the radius a little below the centre
        const lim = Math.max(0, cupR(Math.min(p.y - t.r * 0.7, Y0 + H)) - 0.05 - t.r), rr = Math.hypot(p.x, p.z);
        if (rr > lim) { const f = lim / Math.max(rr, 1e-6); p.x *= f; p.z *= f; p.vx *= -0.3; p.vz *= -0.3; }
        if (p.y < FLOOR + t.r) { p.y = FLOOR + t.r; p.vy *= -0.2; }
        if (t.buoy > 0.3 && p.y > level - t.r) { p.y = level - t.r; p.vy *= -0.2; }
      }
      for (let i = 0; i < all.length; i++) {
        const a = all[i]; if (!a.on) continue;
        for (let j = i + 1; j < all.length; j++) {
          const b = all[j]; if (!b.on) continue;
          const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, m = TYPES[a.t].r + TYPES[b.t].r, d2 = dx * dx + dy * dy + dz * dz;
          if (d2 < m * m && d2 > 1e-6) { const d = Math.sqrt(d2), o = (m - d) * 0.5 / d; a.x -= dx * o; a.y -= dy * o; a.z -= dz * o; b.x += dx * o; b.y += dy * o; b.z += dz * o; }
        }
      }
    }
    TYPES.forEach((t, ti) => {
      const mesh = meshes.current[ti]; if (!mesh) return;
      P[ti].forEach((p, i) => {
        p.s += ((p.on ? 1 : 0) - p.s) * Math.min(1, dt * 8);
        p.rx += p.vx * dt * 3; p.ry += p.vz * dt * 3;
        dummy.position.set(p.x, p.y, p.z); dummy.rotation.set(p.rx, p.ry, 0); dummy.scale.setScalar(p.s * t.r);
        dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    });
  });
  useEffect(() => {
    // start every instance at zero scale so nothing flashes at full size before the first frame
    const z = new THREE.Matrix4().makeScale(0, 0, 0);
    meshes.current.forEach((m) => { if (!m) return; for (let i = 0; i < m.count; i++) m.setMatrixAt(i, z); m.instanceMatrix.needsUpdate = true; });
  }, []);
  return (
    <>
      <instancedMesh ref={(m) => (meshes.current[0] = m)} args={[null, null, 18]} frustumCulled={false}>
        <sphereGeometry args={[1, 20, 16]} />
        <meshPhysicalMaterial ref={pearlMat} color="#2B1710" emissive="#000000" roughness={0.12} clearcoat={1} clearcoatRoughness={0.05} />
      </instancedMesh>
      <instancedMesh ref={(m) => (meshes.current[1] = m)} args={[null, null, 10]} frustumCulled={false}>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshPhysicalMaterial color="#4A2A18" roughness={0.15} transmission={0.55} thickness={0.2} clearcoat={1} />
      </instancedMesh>
      <instancedMesh ref={(m) => (meshes.current[2] = m)} args={[null, null, 12]} frustumCulled={false}>
        <sphereGeometry args={[1, 20, 16]} />
        <meshPhysicalMaterial color="#F2557A" emissive="#F2557A" emissiveIntensity={0.35} roughness={0.08} transmission={0.4} thickness={0.3} clearcoat={1} />
      </instancedMesh>
    </>
  );
}

/* ---------- condensation ---------- */
function Droplets() {
  const ref = useRef();
  useEffect(() => {
    const d = new THREE.Object3D();
    for (let i = 0; i < 260; i++) {
      const y = Y0 + 0.1 + Math.pow(Math.random(), 1.4) * H * 0.78, a = Math.random() * 6.28, r = cupR(y) + 0.006;
      d.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
      const s = 0.008 + Math.random() * 0.016; d.scale.set(s, s * (1 + Math.random() * 0.6), s * 0.5);
      d.lookAt(0, y, 0); d.updateMatrix(); ref.current.setMatrixAt(i, d.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={ref} args={[null, null, 260]}>
      <sphereGeometry args={[1, 8, 6]} />
      <meshPhysicalMaterial color="#EAF3F8" roughness={0} transparent opacity={0.7} clearcoat={1} envMapIntensity={2.2} />
    </instancedMesh>
  );
}

/* ---------- the cup scene ---------- */
function Cup({ drink, sweetness, ice, toppings, shake, mode, interactive, onShake, scrollProgress, dragRef, burst }) {
  const group = useRef(), liquid = useRef(), surface = useRef(), caustic = useRef(), shine = useRef();
  const foamGroup = useRef(), foamStream = useRef(), foamA = useRef(toppings.includes("foam") ? 1 : 0);
  const streakA = useMemo(() => streakGeometry(Math.PI * 2 - 0.78, 0.2), []);
  const streakB = useMemo(() => streakGeometry(0.62, 0.09), []);
  const streakU = useMemo(() => [{ uI: { value: 0.26 } }, { uI: { value: 0.14 } }], []);
  const sleeveGeo = useMemo(sleeveGeometry, []);
  const [sleeveTex, setSleeveTex] = useState(() => sleeveTexture());
  useEffect(() => {
    // redraw the decal once the web fonts are ready so the wordmark uses Fraunces
    let alive = true;
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (alive) setSleeveTex(sleeveTexture()); });
    return () => { alive = false; };
  }, []);
  useEffect(() => () => sleeveTex.dispose(), [sleeveTex]);
  const spin = useRef({ a: 0, v: 0 });
  const foamTopGeo = useMemo(() => {
    // lumpy, hand-poured dome for the cheese foam
    const g = new THREE.SphereGeometry(1, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2), pos = g.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const a = Math.atan2(v.z, v.x), k = 1 + 0.05 * Math.sin(a * 5 + v.y * 4) + 0.035 * Math.sin(a * 11 - 1.3) * v.y;
      pos.setXYZ(i, v.x * k, v.y * (1 + 0.25 * Math.sin(a * 3 + 0.7)), v.z * k);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  const foam = toppings.includes("foam");
  const level = foam ? 0.5 : 0.78;
  const cupGeo = useMemo(cupGeometry, []);
  const liqGeo = useMemo(() => lathe(-0.035, level), [level]);
  const shakeRef = useRef(0), swirlRef = useRef(0), mixRef = useRef(0);
  const tilt = useRef({ x: 0, z: 0, vx: 0, vz: 0 });
  const iceCount = (ICE.find((i) => i.id === ice) || ICE[2]).cubes;
  const iceRefs = useRef([]);
  const fitKey = useRef("");
  const uniforms = useMemo(() => ({
    uBase: { value: new THREE.Color(drink.base) }, uCream: { value: new THREE.Color(drink.cream) },
    uDeep: { value: new THREE.Color(drink.deep) }, uSwirl: { value: new THREE.Color(drink.swirl || drink.deep) },
    uSweet: { value: sweetness / 100 }, uMix: { value: 0 }, uTime: { value: 0 }, uTop: { value: level }, uFruit: { value: 0 }, uTiger: { value: drink.tiger || 0 },
  }), []); // eslint-disable-line
  const target = useMemo(() => ({ base: new THREE.Color(), cream: new THREE.Color(), deep: new THREE.Color(), swirl: new THREE.Color() }), []);
  useEffect(() => {
    target.base.set(drink.base); target.cream.set(drink.cream); target.deep.set(drink.deep); target.swirl.set(drink.swirl || drink.deep);
  }, [drink, target]);
  const causticU = useMemo(() => ({ uTime: { value: 0 }, uColor: { value: new THREE.Color(drink.base) } }), []); // eslint-disable-line

  const doShake = (strength = 1) => { shakeRef.current = Math.min(1.4, shakeRef.current + strength); swirlRef.current = 1; mixRef.current = 1; tilt.current.vz += (Math.random() > 0.5 ? 1 : -1) * 3 * strength; };
  const first = useRef(true);
  useEffect(() => { if (first.current) { first.current = false; return; } doShake(1); sfx("shake"); }, [shake]); // eslint-disable-line
  // drag (mouse or touch): spins the cup on its axis with inertia, plus a little wobble
  useEffect(() => { if (dragRef) dragRef.current = (v) => { spin.current.v += v * 2.4; tilt.current.vz += v * 0.35; }; });

  useFrame((state, dt) => {
    dt = Math.min(dt, 1 / 30);
    const u = uniforms, k = Math.min(1, dt * 3.5);
    u.uBase.value.lerp(target.base, k); u.uCream.value.lerp(target.cream, k); u.uDeep.value.lerp(target.deep, k); u.uSwirl.value.lerp(target.swirl, k);
    causticU.uColor.value.lerp(target.base, k);
    u.uSweet.value += (sweetness / 100 - u.uSweet.value) * k;
    u.uFruit.value += ((drink.kind === "fruit" ? 1 : 0) - u.uFruit.value) * k;
    u.uTiger.value += ((drink.tiger || 0) - u.uTiger.value) * k;
    // cheese foam: a thick layer pours on (stream from above, swell, settle) and lifts off when removed
    const fa = foamA.current, ft = foam ? 1 : 0;
    foamA.current = reduce ? ft : ft > fa ? Math.min(1, fa + dt / 1.5) : Math.max(0, fa - dt * 3);
    if (foamGroup.current) {
      const a = foamA.current, e = 1 - Math.pow(1 - a, 3), wob = foam && a < 1 ? Math.sin(state.clock.elapsedTime * 14) * 0.05 * (1 - a) : 0;
      foamGroup.current.visible = a > 0.002;
      foamGroup.current.scale.set(1 + wob * 0.4, Math.max(0.001, e * (1 + wob)), 1 + wob * 0.4);
      if (foamStream.current) {
        const pouring = foam && a < 1, thin = 1 - THREE.MathUtils.smoothstep(a, 0.6, 1);
        foamStream.current.visible = pouring && thin > 0.15;
        const top = level + 0.4 * e, len = 2.1 - top;
        foamStream.current.position.set(0.04, top + len / 2, -0.02);
        foamStream.current.scale.set(thin, len, thin);
      }
    }
    u.uTop.value = level;
    if (!reduce) { u.uTime.value += dt; causticU.uTime.value += dt; }
    mixRef.current *= Math.exp(-dt * 0.35); u.uMix.value = mixRef.current;
    shakeRef.current *= Math.exp(-dt * 3); swirlRef.current *= Math.exp(-dt * 0.8);

    // damped spring tilt toward pointer + shake wobble
    const T = tilt.current, px = interactive && !reduce ? state.pointer.x : 0, py = interactive && !reduce ? state.pointer.y : 0;
    T.vz += (-px * 0.17 - T.z) * 26 * dt + Math.sin(state.clock.elapsedTime * 40) * shakeRef.current * 0.9; T.vz *= Math.exp(-5 * dt);
    T.vx += (py * 0.1 - T.x) * 26 * dt; T.vx *= Math.exp(-5 * dt);
    T.z += T.vz * dt; T.x += T.vx * dt;
    // fit camera: whole cup + straw + ~8% margin for any aspect; recomputed on resize
    const fk = state.size.width + "x" + state.size.height;
    if (fitKey.current !== fk) {
      fitKey.current = fk;
      const asp = state.size.width / Math.max(1, state.size.height), tf = Math.tan((state.camera.fov * Math.PI) / 360);
      const cy = 0.42, hh = 1.72 * 1.08 * 1.05, hw = 1.0 * 1.08 * 1.05;
      const dist = Math.max(hh / tf, hw / (tf * asp));
      state.camera.position.set(0, cy + dist * 0.11, dist); state.camera.lookAt(0, cy, 0);
    }
    const g = group.current;
    let sp = typeof scrollProgress === "number" ? scrollProgress : scrollProgress && scrollProgress.current ? scrollProgress.current : 0;
    const S = spin.current; S.a += S.v * dt; S.v *= Math.exp(-2.6 * dt);
    g.rotation.set(T.x, S.a + sp * 0.9 + (reduce ? 0 : Math.sin(state.clock.elapsedTime * 0.4) * 0.12), T.z);
    g.scale.setScalar((mode === "hero" ? 1 : 1) * (1 - sp * 0.18));
    g.position.y = reduce ? 0 : Math.sin(state.clock.elapsedTime * 1.2) * 0.025;
    if (shine.current) shine.current.rotation.y = -g.rotation.y; // highlights stay put relative to the camera
    // meniscus sloshes opposite to tilt
    if (surface.current) { surface.current.rotation.x = -Math.PI / 2 - T.x * 0.8 + Math.sin(state.clock.elapsedTime * 9) * shakeRef.current * 0.12; surface.current.rotation.y = -T.z * 0.8; }
    iceRefs.current.forEach((m, i) => {
      if (!m) return;
      const want = i < iceCount ? 1 : 0, s = Math.min(1, m.scale.x + (want - m.scale.x) * Math.min(1, dt * 5));
      m.scale.setScalar(Math.max(s, 0.0001));
      const tt = state.clock.elapsedTime + i * 1.7;
      m.position.y = level - 0.06 + (reduce ? 0 : Math.sin(tt * 1.3) * 0.025) + shakeRef.current * Math.sin(tt * 20) * 0.04;
      if (!reduce) { m.rotation.y += dt * 0.15 * (i % 2 ? 1 : -1); m.rotation.x = Math.sin(tt * 0.7) * 0.25; }
    });
  });

  const icePos = [[-0.26, 0.14], [0.24, -0.18], [0.06, 0.3], [-0.16, -0.28]];
  return (
    <group ref={group} onClick={interactive ? (e) => { e.stopPropagation(); if (e.delta > 8) return; doShake(1); sfx("shake"); onShake && onShake(); } : undefined}>
      <mesh geometry={liqGeo} renderOrder={1}>
        <shaderMaterial ref={liquid} uniforms={uniforms} vertexShader={liquidVert} fragmentShader={liquidFrag} transparent depthWrite={false} />
      </mesh>
      <mesh ref={surface} position={[0, level, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[cupR(level) - 0.04, 64]} />
        <meshPhysicalMaterial color={foam ? "#FFF6E8" : drink.cream} roughness={0.25} clearcoat={0.6} />
      </mesh>
      <group ref={foamGroup} position={[0, 0.5, 0]} visible={false}>
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[cupR(0.5 + 0.4) - 0.035, cupR(0.5) - 0.035, 0.4, 64]} />
          <meshPhysicalMaterial color="#FFF3E2" roughness={0.75} sheen={1} sheenColor="#ffffff" sheenRoughness={0.6} />
        </mesh>
        <mesh geometry={foamTopGeo} position={[0, 0.4, 0]} scale={[cupR(0.9) - 0.035, 0.2, cupR(0.9) - 0.035]}>
          <meshPhysicalMaterial color="#FFF6E8" roughness={0.68} sheen={1} sheenColor="#ffffff" clearcoat={0.15} />
        </mesh>
      </group>
      <mesh ref={foamStream} visible={false}>
        <cylinderGeometry args={[0.07, 0.085, 1, 20, 1, true]} />
        <meshPhysicalMaterial color="#FFF6E8" roughness={0.5} sheen={1} />
      </mesh>
      {drink.kind === "frappe" && !foam && (
        <mesh position={[0, level, 0]} scale={[1, 0.35, 1]}>
          <sphereGeometry args={[cupR(level) - 0.05, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshPhysicalMaterial color={drink.cream} roughness={0.8} sheen={1} />
        </mesh>
      )}
      <Toppings toppings={toppings} level={level} shakeRef={shakeRef} swirlRef={swirlRef} burst={burst} />
      {icePos.map((p, i) => (
        <RoundedBox key={i} ref={(m) => (iceRefs.current[i] = m)} renderOrder={5} args={[0.32, 0.32, 0.32]} radius={0.06} smoothness={3} position={[p[0], level, p[1]]} scale={0.0001}>
          <meshPhysicalMaterial color="#dff0ff" roughness={0.06} ior={1.31} clearcoat={1} clearcoatRoughness={0.03} envMapIntensity={3} transparent opacity={0.32} depthWrite={false} />
        </RoundedBox>
      ))}
      {/* straw */}
      <mesh position={STRAW_POS} rotation={STRAW_ROT}>
        <cylinderGeometry args={[STRAW_R, STRAW_R, STRAW_LEN, 28, 1, true]} />
        <meshPhysicalMaterial color="#FF4D8D" roughness={0.22} clearcoat={1} clearcoatRoughness={0.1} side={THREE.DoubleSide} />
      </mesh>
      {/* glass */}
      <mesh geometry={cupGeo} renderOrder={10}>
        <meshPhysicalMaterial color="#F4F8FA" roughness={0.05} ior={1.45} clearcoat={1} clearcoatRoughness={0.02} envMapIntensity={1.8} transparent opacity={0.12} depthWrite={false} />
      </mesh>
      {/* printed sleeve decal */}
      <mesh geometry={sleeveGeo} renderOrder={9}>
        <meshStandardMaterial map={sleeveTex} transparent alphaTest={0.02} roughness={0.45} depthWrite={false} />
      </mesh>
      {/* domed cafe lid: clear dome, thicker snap rim, straw collar */}
      <group position={[0, LID_Y, 0]}>
        <mesh scale={[1, DOME_B / DOME_A, 1]} renderOrder={13}>
          <sphereGeometry args={[DOME_A, 64, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshPhysicalMaterial color="#FFFFFF" roughness={0.04} clearcoat={1} clearcoatRoughness={0.02} envMapIntensity={2.4} transparent opacity={0.16} depthWrite={false} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} renderOrder={13}>
          <torusGeometry args={[RT + 0.03, 0.032, 14, 96]} />
          <meshPhysicalMaterial color="#FFFFFF" roughness={0.08} clearcoat={1} envMapIntensity={2.6} transparent opacity={0.55} depthWrite={false} />
        </mesh>
        {/* straw hole: a raised collar and lip hugging the straw where it pierces the dome */}
        <group position={LID_HOLE} rotation={STRAW_ROT}>
          <mesh position={[0, -0.01, 0]} renderOrder={13}>
            <cylinderGeometry args={[STRAW_R + 0.012, STRAW_R + 0.03, 0.07, 32, 1, true]} />
            <meshPhysicalMaterial color="#FFFFFF" roughness={0.08} clearcoat={1} transparent opacity={0.5} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0.025, 0]} rotation={[Math.PI / 2, 0, 0]} renderOrder={13}>
            <torusGeometry args={[STRAW_R + 0.014, 0.011, 10, 40]} />
            <meshPhysicalMaterial color="#FFFFFF" roughness={0.06} clearcoat={1} envMapIntensity={2.6} transparent opacity={0.75} depthWrite={false} />
          </mesh>
        </group>
      </group>
      {/* rim, sealed-lid film and view-fixed wall streaks */}
      <mesh position={[0, Y0 + H + 0.018, 0]} rotation={[Math.PI / 2, 0, 0]} renderOrder={11}>
        <torusGeometry args={[RT + 0.012, 0.016, 12, 96]} />
        <meshPhysicalMaterial color="#ffffff" roughness={0.04} clearcoat={1} envMapIntensity={2.8} transparent opacity={0.5} depthWrite={false} />
      </mesh>
      <group ref={shine}>
        <mesh position={[0, Y0 + H + 0.03, 0]} rotation={[Math.PI / 2, 0, -0.9]} renderOrder={12}>
          <torusGeometry args={[RT + 0.014, 0.012, 8, 48, Math.PI * 0.42]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0.85} depthWrite={false} />
        </mesh>
        <mesh position={[0, Y0 + H + 0.2, 0]} rotation={[-Math.PI / 2 + 0.5, 0, 0]} renderOrder={14}>
          <circleGeometry args={[RT * 0.9, 48]} />
          <shaderMaterial vertexShader={uvVert} fragmentShader={filmFrag} transparent depthWrite={false} />
        </mesh>
        <mesh geometry={streakA} renderOrder={12}>
          <shaderMaterial uniforms={streakU[0]} vertexShader={uvVert} fragmentShader={streakFrag} transparent depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
        <mesh geometry={streakB} renderOrder={12}>
          <shaderMaterial uniforms={streakU[1]} vertexShader={uvVert} fragmentShader={streakFrag} transparent depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      </group>
      <Droplets />
      {/* caustics on the surface under the cup */}
      <mesh ref={caustic} position={[0, Y0 - 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.6, 3.6]} />
        <shaderMaterial uniforms={causticU} vertexShader="varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }"
          fragmentShader={causticFrag} transparent depthWrite={false} />
      </mesh>
    </group>
  );
}

function hasWebGL() {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; }
}

export default function BobaCup({ drink, sweetness = 100, ice = "regular", toppings = [], shake = 0, mode = "hero", interactive = true, onShake, scrollProgress, burst = 0, className = "" }) {
  const wrap = useRef(null);
  const dragRef = useRef(null);
  const [visible, setVisible] = useState(true);
  const [ok] = useState(hasWebGL);
  useEffect(() => {
    const el = wrap.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting && !document.hidden), { rootMargin: "0px" });
    io.observe(el);
    const vis = () => setVisible(!document.hidden && el.getBoundingClientRect().bottom > 0);
    document.addEventListener("visibilitychange", vis);
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", vis); };
  }, []);
  // horizontal drags (mouse or touch) spin the cup; vertical swipes still scroll the page (touch-action: pan-y)
  useEffect(() => {
    if (!interactive) return;
    const el = wrap.current; let last = null, lt = 0;
    const down = (e) => { last = e.clientX; lt = performance.now(); };
    const move = (e) => {
      if (last == null) return;
      const now = performance.now(), v = (e.clientX - last) / Math.max(8, now - lt);
      last = e.clientX; lt = now;
      dragRef.current && dragRef.current(v * 2.2);
    };
    const up = () => { last = null; };
    el.addEventListener("pointercancel", up);
    el.addEventListener("pointerdown", down); window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
    return () => { el.removeEventListener("pointerdown", down); window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, [mode, interactive]);
  if (!ok || !drink) return null;
  return (
    <div ref={wrap} className={"relative h-full w-full " + className} style={{ touchAction: "pan-y" }}>
      <Canvas frameloop={visible ? "always" : "never"} dpr={[1, 1.75]} gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 0.5, mode === "hero" ? 8.6 : 8.4], fov: 30 }} onCreated={({ camera }) => camera.lookAt(0, 0.1, 0)} style={{ background: "transparent" }}>
        <ambientLight intensity={0.55} />
        <directionalLight position={[3, 5, 4]} intensity={1.7} color="#FFF6EC" />
        <pointLight position={[-2.5, 1.5, -2.5]} intensity={10} color="#FF4D8D" distance={9} />
        <pointLight position={[2.6, 0.5, -2.2]} intensity={8} color="#FFD3A0" distance={9} />
        <Cup drink={drink} sweetness={sweetness} ice={ice} toppings={toppings} shake={shake} mode={mode}
          interactive={interactive} onShake={onShake} scrollProgress={scrollProgress} dragRef={dragRef} burst={burst} />
        <ContactShadows position={[0, Y0 - 0.01, 0]} opacity={0.55} scale={3.4} blur={2.6} far={2} resolution={256} color="#000000" frames={reduce ? 1 : Infinity} />
        <Environment resolution={256} frames={1}>
          {/* warm cream "room" so glancing reflections read light on the cream page, not black */}
          <mesh scale={30}><sphereGeometry args={[1, 32, 16]} /><meshBasicMaterial color="#E9DCCB" side={THREE.BackSide} /></mesh>
          {/* studio softboxes: big key from the front-left, strip lights on the sides, top fill */}
          <Lightformer form="rect" intensity={4} position={[-2.6, 1.2, 3]} rotation-y={0.6} scale={[2.2, 5, 1]} />
          <Lightformer form="rect" intensity={2} position={[3, 1.5, 2.4]} rotation-y={-0.8} scale={[0.6, 5, 1]} />
          <Lightformer form="rect" intensity={3} position={[0, 4, 2]} scale={[6, 2, 1]} />
          <Lightformer form="rect" intensity={2.2} color="#FFB36B" position={[-4, 1, 0]} rotation-y={Math.PI / 2} scale={[4, 6, 1]} />
          <Lightformer form="rect" intensity={2.6} color="#FF7A9C" position={[4, 1, -1]} rotation-y={-Math.PI / 2} scale={[3, 6, 1]} />
          <Lightformer form="ring" intensity={1.5} position={[0, 0, -5]} scale={3} />
        </Environment>
      </Canvas>
    </div>
  );
}
