import { useRef } from 'react';
import { manifesto, stats } from '../data';
import { Back, reveal, useRegister, useScene } from '../engine/hooks';
import { clamp, easeOutCubic } from '../engine/director';
import Odometer, { type OdometerHandle } from '../components/Odometer';
import TiltCard from '../components/TiltCard';

const words = manifesto.split(' ').map((w) => {
  const hot = w.includes('*');
  return { text: w.replace(/\*/g, ''), hot };
});

export default function About() {
  const ref = useRegister('about');
  const shade = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLDivElement>(null);
  const wordEls = useRef<(HTMLSpanElement | null)[]>([]);
  const statsEl = useRef<HTMLDivElement>(null);
  const odos = useRef<(OdometerHandle | null)[]>([]);
  const textWrap = useRef<HTMLDivElement>(null);

  useScene('about', (s) => {
    if (shade.current) {
      const e = easeOutCubic(s.enter);
      shade.current.style.opacity = s.vis.toFixed(3);
      shade.current.style.transform = `translate3d(${((1 - e) * -12).toFixed(2)}vw, 0, 0)`;
      shade.current.style.visibility = s.vis < 0.002 ? 'hidden' : 'visible';
    }
    reveal(label.current, s);
    reveal(textWrap.current, s, { dy: 30 });
    // word-by-word reveal with scroll
    const n = wordEls.current.length;
    const prog = clamp((s.p + 0.06) / 0.55) * (n + 6);
    wordEls.current.forEach((w, i) => {
      if (!w) return;
      const t = easeOutCubic(clamp((prog - i) / 6));
      w.style.opacity = (0.1 + 0.9 * t).toFixed(3);
      w.style.transform = `translate3d(0, ${(0.25 * (1 - t)).toFixed(3)}em, 0)`;
      w.style.filter = t > 0.99 ? 'none' : `blur(${(4 * (1 - t)).toFixed(2)}px)`;
    });
    reveal(statsEl.current, s, { dy: 90, delay: 0.25 });
    const k = easeOutCubic(clamp((s.p - 0.2) / 0.6));
    stats.forEach((st, i) => odos.current[i]?.set(st.value * k));
  });

  return (
    <section className="scene scene-about" id="about" ref={ref} style={{ height: '280vh' }}>
      <Back>
        <div className="about-shade" ref={shade} />
      </Back>
      <div className="sticky">
        <div className="inner">
          <div className="about-col">
            <div>
              <div className="label mono" ref={label}><b>(02)</b> — About me</div>
              <div className="panel" ref={textWrap}>
                <p className="manifesto">
                  {words.map((w, i) => (
                    <span key={i} className={`mw${w.hot ? ' red' : ''}`} ref={(el) => { wordEls.current[i] = el; }}>
                      {w.text}{' '}
                    </span>
                  ))}
                </p>
              </div>
            </div>
            <div className="stats" ref={statsEl}>
              {stats.map((st, i) => (
                <TiltCard key={i} className="stat">
                  <div className="stat-num display">
                    <Odometer digits={String(st.value).length} ref={(h) => { odos.current[i] = h; }} />
                    <span className="stat-suf">{st.suffix}</span>
                  </div>
                  <div className="stat-label">{st.label}</div>
                  <span className="sr-only">{st.value}{st.suffix} {st.label}</span>
                </TiltCard>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
