import { useRef } from 'react';
import { journey, journeyYears } from '../data';
import { Back, reveal, useRegister, useScene } from '../engine/hooks';
import { clamp, easeOutCubic } from '../engine/director';
import Odometer, { type OdometerHandle } from '../components/Odometer';

export default function Journey() {
  const ref = useRegister('journey');
  const yearWrap = useRef<HTMLDivElement>(null);
  const year = useRef<OdometerHandle>(null);
  const head = useRef<HTMLDivElement>(null);
  const line = useRef<SVGPathElement>(null);
  const items = useRef<(HTMLLIElement | null)[]>([]);
  const n = journey.length;

  useScene('journey', (s) => {
    if (yearWrap.current) {
      const e = easeOutCubic(s.enter);
      yearWrap.current.style.opacity = s.vis.toFixed(3);
      yearWrap.current.style.visibility = s.vis < 0.002 ? 'hidden' : 'visible';
      yearWrap.current.style.transform = `translate3d(0, ${((1 - e) * 8).toFixed(2)}vh, 0)`;
    }
    const k = easeOutCubic(clamp(s.p / 0.85));
    year.current?.set(journeyYears.from + (journeyYears.to - journeyYears.from) * k);
    reveal(head.current, s);
    // the red line draws from the bottom (oldest) to the top (newest)
    const draw = clamp((s.p - 0.02) / 0.8);
    if (line.current) line.current.style.strokeDashoffset = (1 - draw).toFixed(4);
    const exitO = Math.max(0, 1 - s.exit * 2.4);
    items.current.forEach((el, i) => {
      if (!el) return;
      const order = n - 1 - i; // bottom item first
      const at = order / (n - 1);
      const t = easeOutCubic(clamp((draw - at * 0.86 + 0.08) / 0.22));
      const o = t * exitO * easeOutCubic(s.enter);
      el.style.opacity = o.toFixed(3);
      el.style.transform = `perspective(900px) rotateY(${(-55 * (1 - t)).toFixed(2)}deg) translate3d(${((1 - t) * 30).toFixed(1)}px,0,0)`;
      el.classList.toggle('is-on', draw >= at * 0.86 + 0.02);
    });
  });

  return (
    <section className="scene scene-journey" id="journey" ref={ref} style={{ height: '240vh' }}>
      <Back>
        <div className="journey-year" ref={yearWrap} aria-hidden="true">
          <Odometer digits={4} ref={year} className="outline" pad />
        </div>
      </Back>
      <div className="sticky">
        <div className="inner">
          <div className="journey-col">
            <div className="panel" ref={head}>
              <div className="label mono"><b>(04)</b> — Journey</div>
              <h2 className="sec-title display">Learning<br /><span className="red">out loud.</span></h2>
            </div>
            <div className="timeline">
              <svg className="tl-svg" preserveAspectRatio="none" viewBox="0 0 2 100" aria-hidden="true">
                <path d="M1 100 L1 0" className="tl-track" />
                <path d="M1 100 L1 0" className="tl-line" pathLength={1} ref={line} />
              </svg>
              <ol>
                {journey.map((j, i) => (
                  <li className="tl-item panel" key={j.title} ref={(el) => { items.current[i] = el; }}>
                    <span className="tl-node" />
                    <div className="tl-year mono">{j.year}</div>
                    <div className="tl-title display">{j.title}</div>
                    <div className="tl-org">{j.org}</div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
