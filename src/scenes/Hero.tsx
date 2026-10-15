import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { person, contact } from '../data';
import { Back, useIntro, useRegister, useScene } from '../engine/hooks';
import { scrollToScene, easeOutCubic, clamp } from '../engine/director';
import { MagButton } from '../components/Chrome';

export default function Hero() {
  const ref = useRegister('hero');
  const name = useRef<HTMLDivElement>(null);
  const letters = useRef<(HTMLSpanElement | null)[]>([]);
  const front = useRef<HTMLDivElement>(null);
  const hl = useRef<(HTMLSpanElement | null)[]>([]);
  const introDone = useRef(false);

  // Fit the giant name so it never collides with the copy column (long names shrink, short ones keep min(18.5vw, 36vh)).
  useEffect(() => {
    const el = name.current;
    if (!el) return;
    const fit = () => {
      el.style.removeProperty('--name-size');
      const fs = parseFloat(getComputedStyle(el).fontSize);
      const ratio = el.scrollWidth / fs; // width in em
      const vw = window.innerWidth;
      const avail = vw < 820 ? vw * 0.94 : vw * (1 - 0.03 - 0.42);
      if (ratio * fs > avail) el.style.setProperty('--name-size', `${(avail / ratio).toFixed(1)}px`);
    };
    document.fonts.ready.then(fit);
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  useIntro(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const d = reduced ? 0.01 : 1;
    gsap.fromTo(letters.current, { y: 0, yPercent: 115, rotateX: -80 },
      { y: 0, yPercent: 0, rotateX: 0, duration: 1.6 * d, ease: 'expo.out', stagger: 0.07 * d });
    const el = front.current!;
    gsap.fromTo(el.querySelectorAll('.mask > span'), { y: 0, yPercent: 110 },
      { y: 0, yPercent: 0, duration: 1.4 * d, ease: 'expo.out', stagger: 0.09 * d, delay: 0.25 * d });
    gsap.fromTo(el.querySelectorAll('.hero-fade'), { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 1.2 * d, ease: 'expo.out', stagger: 0.08 * d, delay: 0.55 * d,
        onComplete: () => { introDone.current = true; } });
  });

  useScene('hero', (s) => {
    // giant name: tiny alternating parallax, fades on exit
    const o = clamp(1 - s.exit * 2.2);
    if (name.current) {
      name.current.style.opacity = o.toFixed(3);
      name.current.style.visibility = o < 0.002 ? 'hidden' : 'visible';
    }
    // apply parallax on the wrapper spans (letters themselves are owned by the intro tween)
    letters.current.forEach((l, i) => {
      const w = l?.parentElement;
      if (w) w.style.transform = `translate3d(0, ${((i % 2 ? 1 : -1) * s.p * 26).toFixed(1)}px, 0)`;
    });
    // front copy: fade out fast on exit
    if (front.current) {
      const fo = Math.max(0, 1 - s.exit * 2.4);
      front.current.style.opacity = fo.toFixed(3);
      front.current.style.transform = `translate3d(0, ${(-s.exit * 80).toFixed(1)}px, 0)`;
      front.current.style.visibility = fo < 0.002 ? 'hidden' : 'visible';
    }
    // highlighter: he "reads" the lines as you scroll
    const n = hl.current.length;
    hl.current.forEach((h, i) => {
      if (!h) return;
      const t = easeOutCubic(clamp(s.p * 1.5 * n - i));
      h.style.transform = `scaleX(${t.toFixed(4)})`;
    });
  });

  return (
    <section className="scene scene-hero" id="hero" ref={ref} style={{ height: '230vh' }}>
      <Back>
        <div className="hero-name" ref={name} aria-hidden="true">
          {person.first.split('').map((c, i) => (
            <span className="hn-w" key={i}>
              <span className="hn-l" ref={(el) => { letters.current[i] = el; }}>{c}</span>
            </span>
          ))}
        </div>
      </Back>
      <div className="sticky">
        <div className="inner">
          <div className="hero-front panel" ref={front}>
            <p className="hero-hi hero-fade">Hi, I'm <b>{person.full}</b> —</p>
            <h1 className="hero-title display">
              <span className="mask"><span>{person.role[0]}</span></span>
              <span className="mask red"><span>{person.role[1]}</span></span>
            </h1>
            <p className="hero-desc hero-fade">
              {person.tagline.map((line, i) => (
                <span className="hl-line" key={i}>
                  {line}
                  <span className="hl" ref={(el) => { hl.current[i] = el; }} />
                </span>
              )).flatMap((el, i) => (i ? [' ', el] : [el]))}
            </p>
            <div className="hero-ctas hero-fade">
              <MagButton variant="red" cursor="Go" href="#work"
                onClick={(e) => { e.preventDefault(); scrollToScene('work'); }}>
                See my work ↘
              </MagButton>
              <MagButton variant="outline" cursor="PDF" href={contact.resume} download="Prashant_Jadhav_Resume.pdf">
                Download résumé
              </MagButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
