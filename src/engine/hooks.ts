import { useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import {
  subscribe, onIntro, register, sceneIndex, easeOutCubic,
  type DirectorState, type SceneId, type SceneState,
} from './director';

/** Subscribe to a scene's state every tick. The callback mutates DOM via refs; nothing re-renders. */
export function useScene(id: SceneId, fn: (s: SceneState, g: DirectorState) => void) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    const i = sceneIndex(id);
    return subscribe((g) => ref.current(g.scenes[i], g));
  }, [id]);
}

export function useDirector(fn: (g: DirectorState) => void) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => subscribe((g) => ref.current(g)), []);
}

export function useIntro(fn: () => void) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => onIntro(() => ref.current()), []);
}

export function useRegister(id: SceneId) {
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => register(id, ref.current), [id]);
  return ref;
}

const backEl = () => document.getElementById('layer-back')!;
const frontEl = () => document.getElementById('layer-front')!;
export const Back = ({ children }: { children: ReactNode }) => createPortal(children, backEl());
export const Front = ({ children }: { children: ReactNode }) => createPortal(children, frontEl());

/** Text-block rule: fade/translate in on enter, fade out fast on exit so sections never overlap. */
export function revealOpacity(s: SceneState, inSpan = 1) {
  const e = easeOutCubic(Math.min(1, s.enter / inSpan));
  return e * Math.max(0, 1 - s.exit * 2.4);
}

export function reveal(el: HTMLElement | null, s: SceneState, opts: { dy?: number; delay?: number } = {}) {
  if (!el) return;
  const { dy = 60, delay = 0 } = opts;
  const e = easeOutCubic(Math.max(0, Math.min(1, (s.enter - delay) / (1 - delay))));
  const o = e * Math.max(0, 1 - s.exit * 2.4);
  el.style.opacity = o.toFixed(3);
  el.style.transform = `translate3d(0, ${((1 - e) * dy).toFixed(1)}px, 0)`;
  el.style.visibility = o < 0.002 ? 'hidden' : 'visible';
}
