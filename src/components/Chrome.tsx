import { useEffect, useRef, type ReactNode, type AnchorHTMLAttributes } from 'react';
import gsap from 'gsap';
import { frames } from '../engine/frames';
import { SCENES, fireIntro, scrollToScene, sceneIndex, lerp, type SceneId } from '../engine/director';
import { useDirector } from '../engine/hooks';
import { person } from '../data';

/* ───────────────────────── Preloader ───────────────────────── */
export function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const num = useRef<HTMLDivElement>(null);
  const lines = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const counter = { v: 0 };
    let target = 0;
    let finished = false;
    const render = () => {
      if (num.current) num.current.textContent = String(Math.round(counter.v)).padStart(3, '0');
    };
    const finish = () => {
      if (finished) return;
      finished = true;
      const tl = gsap.timeline();
      tl.to(lines.current!.querySelectorAll('.pl-line > span'), { yPercent: -110, duration: 0.6, ease: 'expo.in', stagger: 0.05 })
        .to(num.current, { yPercent: -30, opacity: 0, duration: 0.5, ease: 'expo.in' }, '<0.1')
        .add(() => fireIntro(), '-=0.05')
        .to(root.current!.querySelector('.pl-top'), { yPercent: -100, duration: 1.2, ease: 'expo.inOut' }, '<')
        .to(root.current!.querySelector('.pl-bot'), { yPercent: 100, duration: 1.2, ease: 'expo.inOut' }, '<')
        .set(root.current, { display: 'none' });
    };
    const bump = () => {
      gsap.to(counter, {
        v: target, duration: 0.6, ease: 'power2.out', overwrite: true, onUpdate: render,
        onComplete: () => { if (target >= 100) finish(); },
      });
    };
    const off = frames.onProgress((loaded, gate) => {
      const t = Math.min(100, Math.round((loaded / gate) * 100));
      if (t !== target) { target = t; bump(); }
    });
    const small = window.innerWidth < 820;
    frames.load(small).catch(() => { target = 100; bump(); });
    return () => { off(); };
  }, []);

  return (
    <div className="preloader" ref={root} aria-label="Loading">
      <div className="pl-half pl-top" />
      <div className="pl-half pl-bot" />
      <div className="pl-center" ref={lines}>
        <div className="pl-line mono"><span>{person.full} — portfolio</span></div>
        <div className="pl-num" ref={num}>000</div>
        <div className="pl-line mono"><span>Full-stack PHP developer · Pune</span></div>
      </div>
    </div>
  );
}

/* ───────────────────────── HUD ───────────────────────── */
export function HUD() {
  const root = useRef<HTMLDivElement>(null);
  const pills = useRef<(HTMLButtonElement | null)[]>([]);
  const pct = useRef<HTMLSpanElement>(null);
  const rail = useRef<HTMLSpanElement>(null);
  const last = useRef({ active: -1, white: false, pct: -1 });
  const contactIdx = sceneIndex('contact');

  useDirector((g) => {
    const white = g.active === contactIdx && g.t > 0.6;
    // nav highlight follows the settled scene (switch at the midpoint of a blade)
    const active = g.t < 0.5 && g.active > 0 ? g.active - 1 : g.active;
    const L = last.current;
    if (white !== L.white) {
      root.current?.classList.toggle('hud--white', white);
      L.white = white;
    }
    if (active !== L.active) {
      pills.current.forEach((p, i) => p?.classList.toggle('is-active', i === active));
      L.active = active;
    }
    const v = Math.round(g.progress * 100);
    if (v !== L.pct) {
      if (pct.current) pct.current.textContent = String(v).padStart(2, '0') + '%';
      L.pct = v;
    }
    if (rail.current) rail.current.style.transform = `scaleY(${g.progress.toFixed(4)})`;
  });

  return (
    <div className="hud" ref={root}>
      <button className="logo" onClick={() => scrollToScene('hero')} aria-label="Back to top" data-cursor="Go">
        {person.first}<sup>®</sup>
      </button>
      <nav className="pillnav" aria-label="Sections">
        {SCENES.map((s, i) => (
          <button key={s.id} ref={(el) => { pills.current[i] = el; }} onClick={() => scrollToScene(s.id as SceneId)}>
            {s.label}
          </button>
        ))}
      </nav>
      <div className="progress mono">
        <span ref={pct}>00%</span>
        <span className="rail"><span ref={rail} /></span>
      </div>
    </div>
  );
}

/* ───────────────────────── Cursor ───────────────────────── */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    document.documentElement.classList.add('has-cursor');
    const p = { x: -100, y: -100, rx: -100, ry: -100 };
    let hover: string | null = null;
    const move = (e: PointerEvent) => {
      p.x = e.clientX; p.y = e.clientY;
      const t = (e.target as HTMLElement)?.closest?.('[data-cursor]') as HTMLElement | null;
      const lab = t?.dataset.cursor ?? null;
      if (lab !== hover) {
        hover = lab;
        ring.current!.classList.toggle('is-hover', !!lab);
        if (lab) label.current!.textContent = lab;
      }
    };
    const tick = () => {
      p.rx = lerp(p.rx, p.x, 0.16);
      p.ry = lerp(p.ry, p.y, 0.16);
      dot.current!.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
      ring.current!.style.transform = `translate3d(${p.rx}px, ${p.ry}px, 0)`;
    };
    window.addEventListener('pointermove', move);
    gsap.ticker.add(tick);
    return () => {
      window.removeEventListener('pointermove', move);
      gsap.ticker.remove(tick);
    };
  }, []);

  return (
    <>
      <div className="cursor-ring" ref={ring}><span ref={label} /></div>
      <div className="cursor-dot" ref={dot} />
    </>
  );
}

/* ───────────────────────── Magnetic button ───────────────────────── */
type BtnProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: 'red' | 'outline';
  cursor: string;
  children: ReactNode;
};
export function MagButton({ variant = 'red', cursor, children, className = '', ...rest }: BtnProps) {
  const el = useRef<HTMLAnchorElement>(null);
  const qx = useRef<gsap.QuickToFunc>();
  const qy = useRef<gsap.QuickToFunc>();
  useEffect(() => {
    qx.current = gsap.quickTo(el.current, 'x', { duration: 0.9, ease: 'elastic.out(1, 0.35)' });
    qy.current = gsap.quickTo(el.current, 'y', { duration: 0.9, ease: 'elastic.out(1, 0.35)' });
  }, []);
  return (
    <a
      ref={el}
      className={`btn btn--${variant} ${className}`}
      data-cursor={cursor}
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse') return;
        const r = el.current!.getBoundingClientRect();
        qx.current?.((e.clientX - (r.left + r.width / 2)) * 0.35);
        qy.current?.((e.clientY - (r.top + r.height / 2)) * 0.35);
      }}
      onPointerLeave={() => { qx.current?.(0); qy.current?.(0); }}
      {...rest}
    >
      <span className="btn-fill" />
      <span className="btn-roll" aria-hidden="true">
        <span>{children}</span>
        <span>{children}</span>
      </span>
      <span className="sr-only">{children}</span>
    </a>
  );
}
