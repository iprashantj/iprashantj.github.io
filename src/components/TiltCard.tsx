import { useRef, type ReactNode } from 'react';

/** Glass card that tilts toward the cursor (±14°) with a moving radial glare. */
export default function TiltCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  const el = useRef<HTMLDivElement>(null);
  const glare = useRef<HTMLDivElement>(null);
  const raf = useRef(0);
  const cur = useRef({ rx: 0, ry: 0, gx: 50, gy: 50, tx: 0, ty: 0, tgx: 50, tgy: 50 });

  const loop = () => {
    const c = cur.current;
    c.rx += (c.tx - c.rx) * 0.12;
    c.ry += (c.ty - c.ry) * 0.12;
    c.gx += (c.tgx - c.gx) * 0.12;
    c.gy += (c.tgy - c.gy) * 0.12;
    if (el.current) el.current.style.transform = `rotateX(${c.rx.toFixed(2)}deg) rotateY(${c.ry.toFixed(2)}deg)`;
    if (glare.current) glare.current.style.background = `radial-gradient(260px circle at ${c.gx.toFixed(1)}% ${c.gy.toFixed(1)}%, rgba(255,255,255,.75), rgba(255,255,255,0) 60%)`;
    if (Math.abs(c.tx - c.rx) + Math.abs(c.ty - c.ry) > 0.02) raf.current = requestAnimationFrame(loop);
    else raf.current = 0;
  };
  const kick = () => { if (!raf.current) raf.current = requestAnimationFrame(loop); };

  return (
    <div className={`tilt-wrap ${className}`}
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse') return;
        const r = e.currentTarget.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        const c = cur.current;
        c.ty = (px - 0.5) * 28;
        c.tx = -(py - 0.5) * 28;
        c.tgx = px * 100;
        c.tgy = py * 100;
        kick();
      }}
      onPointerLeave={() => {
        const c = cur.current;
        c.tx = c.ty = 0;
        c.tgx = c.tgy = 50;
        kick();
      }}>
      <div className="tilt" ref={el}>
        {children}
        <div className="tilt-glare" ref={glare} />
      </div>
    </div>
  );
}
