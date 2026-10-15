import Lenis from 'lenis';
import gsap from 'gsap';

export const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
export const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Shot ranges written by the frame pipeline (public/frames/manifest.json)
const S1 = [0, 59], S2 = [60, 119], S3 = [120, 187], S4 = [188, 239];
const s4 = (f: number) => S4[0] + (S4[1] - S4[0]) * f;

export type SceneId = 'hero' | 'about' | 'work' | 'journey' | 'skills' | 'awards' | 'contact';
export type SceneDef = { id: SceneId; from: number; to: number; x: number; k: number; label: string; height: number };

export const SCENES: SceneDef[] = [
  { id: 'hero', label: 'Hello', from: S1[0], to: S1[1], x: 0.7, k: 1.0, height: 230 },
  { id: 'about', label: 'About', from: S2[0], to: S2[1], x: 0.27, k: 1.0, height: 280 },
  { id: 'work', label: 'Work', from: S3[0], to: S3[1], x: 0.77, k: 0.86, height: 460 },
  { id: 'journey', label: 'Journey', from: s4(0), to: s4(0.6), x: 0.26, k: 1.0, height: 240 },
  { id: 'skills', label: 'Toolkit', from: s4(0.6), to: s4(0.85), x: 0.5, k: 0.98, height: 280 },
  { id: 'awards', label: 'Awards', from: s4(0.85), to: S4[1], x: 0.75, k: 1.0, height: 320 },
  // S1 reversed: he turns back to face the viewer
  { id: 'contact', label: 'Contact', from: S1[1], to: S1[0], x: 0.5, k: 1.0, height: 240 },
];
export const sceneIndex = (id: SceneId) => SCENES.findIndex((s) => s.id === id);

export type SceneState = { enter: number; p: number; exit: number; vis: number; top: number; h: number };
export type DirectorState = {
  y: number;
  vw: number;
  vh: number;
  mobile: boolean;
  progress: number;
  scenes: SceneState[];
  /** index of the active scene (last whose top - lead <= y) */
  active: number;
  /** blade transition 0..1 into `active` from `active - 1` (1 = settled) */
  t: number;
  /** fractional frame for the outgoing (prev) and incoming (active) scenes */
  frameOut: number;
  frameIn: number;
  time: number;
};

type Listener = (s: DirectorState) => void;

const listeners = new Set<Listener>();
const introListeners = new Set<() => void>();
const els = new Map<SceneId, HTMLElement>();

export const state: DirectorState = {
  y: 0,
  vw: window.innerWidth,
  vh: window.innerHeight,
  mobile: window.innerWidth < 820,
  progress: 0,
  scenes: SCENES.map(() => ({ enter: 0, p: 0, exit: 0, vis: 0, top: 0, h: 1 })),
  active: 0,
  t: 1,
  frameOut: 0,
  frameIn: 0,
  time: 0,
};

let lenis: Lenis | null = null;
let introDone = false;

function measure() {
  state.vw = window.innerWidth;
  state.vh = window.innerHeight;
  state.mobile = state.vw < 820;
  const sy = window.scrollY;
  SCENES.forEach((s, i) => {
    const el = els.get(s.id);
    if (!el) return;
    const r = el.getBoundingClientRect();
    state.scenes[i].top = r.top + sy;
    state.scenes[i].h = r.height;
  });
}

const ro = new ResizeObserver(() => measure());
window.addEventListener('resize', measure);

export function register(id: SceneId, el: HTMLElement | null) {
  if (!el) return;
  els.set(id, el);
  ro.observe(el);
  measure();
}

function update(time: number) {
  const y = lenis ? lenis.scroll : window.scrollY;
  const { vh } = state;
  state.y = y;
  state.time = time;
  const docH = document.documentElement.scrollHeight - vh;
  state.progress = docH > 0 ? clamp(y / docH) : 0;

  const lead = 0.78 * vh;
  const span = 0.62 * vh;
  let active = 0;
  SCENES.forEach((def, i) => {
    const s = state.scenes[i];
    const { top, h } = s;
    s.enter = clamp((y - (top - vh)) / vh);
    s.p = clamp((y - top) / Math.max(1, h - vh));
    s.exit = clamp((y - (top + h - vh)) / vh);
    s.vis = clamp(Math.min(s.enter * 1.6, 1 - s.exit * 2.2));
    if (y >= top - lead) active = i;
    void def;
  });
  state.active = active;
  const cur = SCENES[active];
  state.frameIn = cur.from + (cur.to - cur.from) * state.scenes[active].p;
  if (active > 0) {
    const top = state.scenes[active].top;
    state.t = easeInOutSine(clamp((y - (top - lead)) / span));
    state.frameOut = SCENES[active - 1].to;
    if (state.t < 1) state.frameIn = cur.from;
  } else {
    state.t = 1;
    state.frameOut = state.frameIn;
  }
  listeners.forEach((fn) => fn(state));
}

export function subscribe(fn: Listener) {
  listeners.add(fn);
  fn(state);
  return () => {
    listeners.delete(fn);
  };
}

export function onIntro(fn: () => void) {
  if (introDone) {
    fn();
    return () => {};
  }
  introListeners.add(fn);
  return () => {
    introListeners.delete(fn);
  };
}

export function fireIntro() {
  introDone = true;
  introListeners.forEach((fn) => fn());
  introListeners.clear();
  lenis?.start();
}

export function scrollToScene(id: SceneId) {
  const i = sceneIndex(id);
  const target = i === 0 ? 0 : state.scenes[i].top + 2;
  if (lenis) lenis.scrollTo(target, { duration: 2.2, easing: easeOutQuart });
  else window.scrollTo(0, target);
}

export function scrollToY(y: number) {
  if (lenis) lenis.scrollTo(y, { duration: 2.2, easing: easeOutQuart });
}

export function boot() {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  lenis = new Lenis({
    lerp: reduced ? 1 : 0.075,
    smoothWheel: true,
    wheelMultiplier: 0.9,
    touchMultiplier: 1.4,
  });
  lenis.stop();
  gsap.ticker.lagSmoothing(0);
  gsap.ticker.add((time) => {
    lenis!.raf(time * 1000);
    update(time);
  });
  measure();
  // debug/screenshot hook
  (window as unknown as { __director: unknown }).__director = { state, jump: (y: number) => lenis!.scrollTo(y, { immediate: true, force: true }) };
}
