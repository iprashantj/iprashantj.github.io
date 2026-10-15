import { useRef } from 'react';
import { certs, counters } from '../data';
import { reveal, useRegister, useScene } from '../engine/hooks';
import { clamp, easeOutCubic } from '../engine/director';

const N = certs.length;
const STEP = 360 / N;

export default function Awards() {
  const ref = useRegister('awards');
  const head = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const nums = useRef<(HTMLSpanElement | null)[]>([]);
  const cylWrap = useRef<HTMLDivElement>(null);
  const cyl = useRef<HTMLDivElement>(null);
  const lastNums = useRef<number[]>([]);

  useScene('awards', (s) => {
    reveal(head.current, s);
    const exitO = Math.max(0, 1 - s.exit * 2.4);
    cards.current.forEach((c, i) => {
      if (!c) return;
      const t = easeOutCubic(clamp((s.enter - 0.25 - i * 0.12) / 0.5));
      c.style.opacity = (Math.min(1, t * 1.4) * exitO).toFixed(3);
      c.style.transform = `perspective(800px) rotateX(${(-100 * (1 - t)).toFixed(2)}deg)`;
      const v = Math.round(counters[i].value * easeOutCubic(clamp((s.enter - 0.3 - i * 0.1) / 0.4)));
      if (v !== lastNums.current[i] && nums.current[i]) {
        nums.current[i]!.textContent = String(v);
        lastNums.current[i] = v;
      }
    });
    if (cylWrap.current) {
      const e = easeOutCubic(clamp((s.enter - 0.3) / 0.7));
      const o = e * exitO;
      cylWrap.current.style.opacity = o.toFixed(3);
      cylWrap.current.style.visibility = o < 0.002 ? 'hidden' : 'visible';
      cylWrap.current.style.setProperty('--rise', `${((1 - e) * 80).toFixed(1)}px`);
    }
    if (cyl.current) {
      cyl.current.style.transform = `translateZ(-360px) rotateX(-14deg) rotateY(${(-s.p * (360 - STEP)).toFixed(2)}deg)`;
    }
  });

  return (
    <section className="scene scene-awards" id="awards" ref={ref} style={{ height: '320vh' }}>
      <div className="sticky">
        <div className="inner">
          <div className="awards-col">
            <div className="panel" ref={head}>
              <div className="label mono"><b>(06)</b> — Awards &amp; proof</div>
            </div>
            <div className="counters">
              {counters.map((c, i) => (
                <div className={`counter ${i % 2 ? 'is-ink' : 'is-red'}`} key={c.label} ref={(el) => { cards.current[i] = el; }}>
                  <div className="counter-num display">
                    <span ref={(el) => { nums.current[i] = el; }}>0</span><i>{c.suffix}</i>
                  </div>
                  <div className="counter-label mono">{c.label}</div>
                </div>
              ))}
            </div>
            <div className="cyl-wrap" ref={cylWrap}>
              <div className="cyl-stage">
                <div className="cyl" ref={cyl}>
                  {certs.map((c, i) => (
                    <div className="cert" key={c.title} style={{ transform: `rotateY(${STEP * i}deg) translateZ(360px)` }}>
                      <div className={`cert-face cert-front${i % 3 === 0 ? ' is-red' : ''}`}>
                        <span className="cert-seal">✓</span>
                        <div className="cert-title display">{c.title}</div>
                        <div className="cert-issuer mono">{c.issuer}</div>
                      </div>
                      <div className="cert-face cert-back"><span className="display">{String(i + 1).padStart(2, '0')}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
