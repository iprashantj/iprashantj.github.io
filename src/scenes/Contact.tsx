import { useRef } from 'react';
import { contact, person, year } from '../data';
import { Back, useRegister, useScene } from '../engine/hooks';
import { clamp, easeOutCubic, sceneIndex, scrollToScene } from '../engine/director';

const [emailName, emailDomain] = contact.email.split('@');
const IDX = sceneIndex('contact');

export default function Contact() {
  const ref = useRegister('contact');
  const red = useRef<HTMLDivElement>(null);
  const big = useRef<HTMLDivElement>(null);
  const front = useRef<HTMLDivElement>(null);
  const lastPoly = useRef('');

  useScene('contact', (s, g) => {
    // red background revealed by the same blade as the canvas
    let t = 0;
    if (g.active > IDX) t = 1;
    else if (g.active === IDX) t = g.t;
    if (red.current) {
      const { vw, vh } = g;
      const skew = 0.2 * vh;
      const e = -skew + (vw + 2 * skew) * t;
      const poly = t >= 1
        ? 'none'
        : `polygon(0px 0px, ${(e + skew).toFixed(1)}px 0px, ${(e - skew).toFixed(1)}px ${vh}px, 0px ${vh}px)`;
      if (poly !== lastPoly.current) {
        red.current.style.clipPath = poly;
        red.current.style.visibility = t <= 0 ? 'hidden' : 'visible';
        lastPoly.current = poly;
      }
    }
    // giant LET'S TALK: fades and rises once the blade has passed
    const r = easeOutCubic(clamp((t - 0.35) / 0.65)) * easeOutCubic(clamp(s.p * 3 + 0.4));
    if (big.current) {
      big.current.style.opacity = r.toFixed(3);
      big.current.style.transform = `translate3d(-50%, ${((1 - r) * 10).toFixed(2)}vh, 0)`;
      big.current.style.visibility = r < 0.002 ? 'hidden' : 'visible';
    }
    if (front.current) {
      const f = easeOutCubic(clamp((t - 0.6) / 0.4)) * easeOutCubic(clamp(s.enter));
      front.current.style.opacity = f.toFixed(3);
      front.current.style.transform = `translate3d(0, ${((1 - f) * 50).toFixed(1)}px, 0)`;
      front.current.style.visibility = f < 0.002 ? 'hidden' : 'visible';
    }
  });

  const links = [
    { label: 'GitHub', href: contact.github, cursor: 'Open' },
    { label: 'LinkedIn', href: contact.linkedin, cursor: 'Open' },
    { label: 'Résumé', href: contact.resume, cursor: 'PDF' },
  ];

  return (
    <section className="scene scene-contact" id="contact" ref={ref} style={{ height: '240vh' }}>
      <Back>
        <div className="contact-red" ref={red} />
        <div className="contact-big display" ref={big} aria-hidden="true">
          <span>Let's</span>
          <span>Talk</span>
        </div>
      </Back>
      <div className="sticky">
        <div className="inner">
          <div className="contact-front" ref={front}>
            <h2 className="sr-only">Let's talk</h2>
            <a className="email display" href={`mailto:${contact.email}`} data-cursor="Write">
              <span className="email-l">{emailName}</span>
              <span className="email-l email-dom">@{emailDomain}</span>
            </a>
            <ul className="links">
              {links.map((l) => (
                <li key={l.label}>
                  <a href={l.href} target="_blank" rel="noreferrer" data-cursor={l.cursor}>
                    <span>{l.label}</span><i aria-hidden="true">↗</i>
                  </a>
                </li>
              ))}
            </ul>
            <footer className="foot mono">
              <span>© {year} {person.full}</span>
              <button onClick={() => scrollToScene('hero')} data-cursor="Go">Back to top ↑</button>
            </footer>
          </div>
        </div>
      </div>
    </section>
  );
}
