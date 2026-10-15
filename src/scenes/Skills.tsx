import { useEffect, useRef } from 'react';
import { skills } from '../data';
import { Back, Front, reveal, useRegister, useScene } from '../engine/hooks';
import { lerp } from '../engine/director';

// Fibonacci sphere
const N = skills.length;
const golden = Math.PI * (3 - Math.sqrt(5));
const pts = skills.map((_, i) => {
  const y = 1 - (i / (N - 1)) * 2;
  const r = Math.sqrt(1 - y * y);
  const th = golden * i;
  // The top pole never rotates, so lift it clear of the portrait's head instead of parking it on the face.
  if (i === N - 1) return { x: 0, y: -1.5, z: 0 };
  return { x: Math.cos(th) * r, y: y * 0.82, z: Math.sin(th) * r };
});

export default function Skills() {
  const ref = useRegister('skills');
  const backWrap = useRef<HTMLDivElement>(null);
  const frontWrap = useRef<HTMLDivElement>(null);
  const backs = useRef<(HTMLSpanElement | null)[]>([]);
  const fronts = useRef<(HTMLSpanElement | null)[]>([]);
  const head = useRef<HTMLDivElement>(null);
  const tape = useRef<HTMLDivElement>(null);
  const tapeTrack = useRef<HTMLDivElement>(null);
  const m = useRef({ x: 0, y: 0, tx: 0, ty: 0, spin: 0, last: 0 });

  useEffect(() => {
    const mv = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      m.current.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      m.current.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('pointermove', mv);
    return () => window.removeEventListener('pointermove', mv);
  }, []);

  useScene('skills', (s, g) => {
    const o = s.vis;
    const hidden = o < 0.002;
    [backWrap.current, frontWrap.current].forEach((w) => {
      if (!w) return;
      w.style.opacity = o.toFixed(3);
      w.style.visibility = hidden ? 'hidden' : 'visible';
    });
    reveal(head.current, s);
    reveal(tape.current, s, { dy: 120 });
    if (tapeTrack.current) tapeTrack.current.style.transform = `translate3d(${(-s.p * 50 - 5).toFixed(2)}%, 0, 0)`;
    if (hidden) return;

    const mm = m.current;
    const dt = mm.last ? Math.min(0.05, g.time - mm.last) : 0.016;
    mm.last = g.time;
    mm.spin += dt * 0.32;
    mm.x = lerp(mm.x, mm.tx, 0.05);
    mm.y = lerp(mm.y, mm.ty, 0.05);

    const { vw, vh } = g;
    const R = g.mobile ? Math.min(44 * vw / 100, 34 * vh / 100) : Math.min(0.27 * vw, 0.46 * vh);
    const cx = vw / 2;
    const cy = vh * (g.mobile ? 0.6 : 0.56);
    const yaw = mm.spin + s.p * 5 + mm.x * 0.5;
    const tilt = -0.28 + mm.y * 0.18;
    const cyw = Math.cos(yaw), syw = Math.sin(yaw), ct = Math.cos(tilt), st = Math.sin(tilt);

    pts.forEach((p, i) => {
      // rotate around Y then tilt around X
      const x1 = p.x * cyw + p.z * syw;
      const z1 = -p.x * syw + p.z * cyw;
      const y2 = p.y * ct - z1 * st;
      const z2 = p.y * st + z1 * ct;
      const X = cx + x1 * R;
      const Y = cy + y2 * R * 0.78;
      const sc = 0.78 + (z2 + 1) * 0.17;
      const front = z2 > 0;
      const tf = `translate3d(${X.toFixed(1)}px, ${Y.toFixed(1)}px, 0) translate(-50%, -50%) scale(${sc.toFixed(3)})`;
      const b = backs.current[i], f = fronts.current[i];
      if (b) {
        b.style.transform = tf;
        b.style.opacity = front ? '0' : (0.45 + (z2 + 1) * 0.5).toFixed(3);
        b.style.zIndex = String(Math.round((z2 + 1) * 100));
      }
      if (f) {
        f.style.transform = tf;
        f.style.opacity = front ? Math.min(1, 0.6 + z2 * 1.4).toFixed(3) : '0';
        f.style.zIndex = String(Math.round((z2 + 1) * 100));
      }
    });
  });

  const tapeText = [...skills, ...skills, ...skills];

  return (
    <section className="scene scene-skills" id="skills" ref={ref} style={{ height: '280vh' }}>
      <Back>
        <div className="orbit orbit-back" ref={backWrap}>
          {skills.map((sk, i) => <span className="chip-o chip-back" key={sk} ref={(el) => { backs.current[i] = el; }}>{sk}</span>)}
        </div>
      </Back>
      <Front>
        <div className="orbit orbit-front" ref={frontWrap}>
          {skills.map((sk, i) => <span className="chip-o chip-front" key={sk} ref={(el) => { fronts.current[i] = el; }}>{sk}</span>)}
        </div>
      </Front>
      <div className="sticky">
        <div className="inner">
          <div className="skills-head panel" ref={head}>
            <div className="label mono"><b>(05)</b> — Toolkit</div>
            <h2 className="sec-title display">Everything<br /><span className="red">in orbit.</span></h2>
            <ul className="sr-only">{skills.map((s) => <li key={s}>{s}</li>)}</ul>
          </div>
          <div className="tape" ref={tape} aria-hidden="true">
            <div className="tape-band">
              <div className="tape-track display" ref={tapeTrack}>
                {tapeText.map((t, i) => <span key={i}>{t}<i>✦</i></span>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
