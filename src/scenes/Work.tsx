import { useRef } from 'react';
import { projects, type Project } from '../data';
import { Back, reveal, useRegister, useScene } from '../engine/hooks';
import { clamp, easeInOutCubic, easeOutCubic } from '../engine/director';

function Visual({ kind }: { kind: Project['visual'] }) {
  if (kind === 'chain') {
    const nodes = ['Apple SFTP', 'ASN parse', 'DHL label', 'Odoo PO'];
    return (
      <div className="vis vis-chain" aria-hidden="true">
        {nodes.map((n, i) => (
          <div className="vc-node" key={n} style={{ animationDelay: `${i * 0.5}s` }}>
            <span className="vc-dot" />
            <span className="vc-name">{n}</span>
            <span className="vc-ok">200</span>
          </div>
        ))}
        <span className="vc-track"><span className="vc-packet" /></span>
        <div className="vc-sig mono">x-signature: hmac-sha256</div>
      </div>
    );
  }
  if (kind === 'gauge') {
    return (
      <div className="vis vis-gauge" aria-hidden="true">
        <svg viewBox="0 0 200 120" className="vg-svg">
          <path d="M20 110 A80 80 0 0 1 180 110" className="vg-track" pathLength={1} />
          <path d="M20 110 A80 80 0 0 1 180 110" className="vg-fill" pathLength={1} />
        </svg>
        <div className="vg-read display">10×</div>
        <div className="vg-sub mono">100,000 PDFs · 33 min</div>
        <div className="vg-bars">
          {Array.from({ length: 14 }, (_, i) => <span key={i} style={{ animationDelay: `${i * 0.09}s` }} />)}
        </div>
      </div>
    );
  }
  return (
    <div className="vis vis-route" aria-hidden="true">
      <div className="vr-grid">
        {Array.from({ length: 48 }, (_, i) => <span key={i} style={{ animationDelay: `${(i * 37) % 23 / 10}s` }} />)}
      </div>
      <svg viewBox="0 0 240 160" className="vr-svg">
        <path id="vr-path" d="M18 140 C 60 140, 50 70, 100 78 S 150 30, 222 22" className="vr-line" />
        <circle r="6" className="vr-bus">
          <animateMotion dur="5s" repeatCount="indefinite" rotate="auto">
            <mpath href="#vr-path" />
          </animateMotion>
        </circle>
        <circle cx="18" cy="140" r="4" className="vr-stop" />
        <circle cx="222" cy="22" r="4" className="vr-stop" />
      </svg>
      <div className="vr-tag mono">Bus 04 · live</div>
    </div>
  );
}

export default function Work() {
  const ref = useRegister('work');
  const floor = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const deck = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLElement | null)[]>([]);
  const lastIdx = useRef(-1);
  const n = projects.length;

  useScene('work', (s, g) => {
    if (floor.current) {
      floor.current.style.opacity = s.vis.toFixed(3);
      floor.current.style.visibility = s.vis < 0.002 ? 'hidden' : 'visible';
      floor.current.style.setProperty('--shift', `${(s.p * 900).toFixed(1)}px`);
    }
    reveal(head.current, s);

    // deck entry from below with rotateY
    if (deck.current) {
      const e = easeOutCubic(clamp(s.enter));
      const o = e * Math.max(0, 1 - s.exit * 2.4);
      deck.current.style.opacity = o.toFixed(3);
      deck.current.style.visibility = o < 0.002 ? 'hidden' : 'visible';
      deck.current.style.transform = `translate3d(0, ${((1 - e) * 45).toFixed(2)}vh, 0) rotateY(${(-25 * (1 - e)).toFixed(2)}deg)`;
    }

    // dwell mapping: q = i + easeInOut(frac)
    const raw = clamp((s.p - 0.06) / 0.86) * (n - 1);
    const i0 = Math.min(n - 1, Math.floor(raw));
    const q = i0 + easeInOutCubic(clamp((raw - i0 - 0.22) / 0.56)); // dwell: hold each card ~44% of its span
    const vh = g.vh / 100;
    cards.current.forEach((c, j) => {
      if (!c) return;
      const d = q - j;
      let z: number, y: number, rx = 0, o: number;
      if (d <= 0) {
        z = d * 300; y = d * 3.2 * vh; o = clamp(1 + d * 0.45);
      } else {
        z = d * 900; y = -12 * d * vh; rx = 28 * d; o = clamp(1 - 1.8 * d);
      }
      c.style.transform = `translate3d(0, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotateX(${rx.toFixed(2)}deg)`;
      c.style.opacity = o.toFixed(3);
      c.style.zIndex = String(100 - j);
      c.style.visibility = o < 0.002 ? 'hidden' : 'visible';
      c.style.pointerEvents = Math.abs(d) < 0.5 ? 'auto' : 'none';
    });
    const idx = Math.round(q);
    if (idx !== lastIdx.current && counter.current) {
      counter.current.textContent = String(idx + 1).padStart(2, '0');
      lastIdx.current = idx;
    }
    if (bar.current) bar.current.style.transform = `scaleX(${(q / (n - 1)).toFixed(4)})`;
  });

  return (
    <section className="scene scene-work" id="work" ref={ref} style={{ height: '460vh' }}>
      <Back>
        <div className="work-floor" ref={floor}><div className="wf-plane" /></div>
      </Back>
      <div className="sticky">
        <div className="inner">
          <div className="work-head" ref={head}>
            <div className="label mono"><b>(03)</b> — Selected work</div>
            <div className="work-count display"><span ref={counter}>01</span> / {String(n).padStart(2, '0')}</div>
            <span className="work-bar"><span ref={bar} /></span>
          </div>
          <div className="deck" ref={deck}>
            {projects.map((p, i) => (
              <article className="card" key={p.name} ref={(el) => { cards.current[i] = el; }}>
                <div className="card-l">
                  <div className="card-meta mono"><b>{String(i + 1).padStart(2, '0')}</b> {p.category}</div>
                  <h3 className="card-name display">{p.name}</h3>
                  <p className="card-line">{p.line}</p>
                  <ul className="chips">{p.chips.map((c) => <li key={c}>{c}</li>)}</ul>
                  <a className="card-link" href={p.url} target="_blank" rel="noreferrer" data-cursor="Open">
                    View on GitHub <span>↗</span>
                  </a>
                </div>
                <div className="card-r"><Visual kind={p.visual} /></div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
