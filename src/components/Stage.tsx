import { useEffect } from 'react';
import { frames } from '../engine/frames';
import { SCENES, subscribe, lerp, type DirectorState, type SceneDef } from '../engine/director';

/** Fixed full-viewport canvas that paints the person (z1). */
export default function Stage() {
  useEffect(() => {
    const canvas = document.getElementById('stage') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    let dpr = 1;
    let cw = 0, ch = 0;
    let lastKey = '';
    const mouse = { tx: 0, ty: 0, x: 0, y: 0 };
    const fine = window.matchMedia('(pointer: fine)').matches;

    const onMove = (e: PointerEvent) => {
      if (!fine) return;
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('pointermove', onMove);

    const resize = (g: DirectorState) => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.round(g.vw * dpr), h = Math.round(g.vh * dpr);
      if (w !== cw || h !== ch) {
        cw = canvas.width = w;
        ch = canvas.height = h;
        canvas.style.width = g.vw + 'px';
        canvas.style.height = g.vh + 'px';
        lastKey = '';
      }
    };

    /** Draw one scene at fractional frame f, offset horizontally by dx (CSS px). */
    const drawScene = (g: DirectorState, def: SceneDef, f: number, dx: number) => {
      const m = frames.manifest;
      if (!m) return;
      const fi = Math.floor(f + 1e-6);
      const frac = f - fi;
      const shot = m.shots[frames.shotOf(fi)];
      const [bx, by, bw, bh] = shot.box;
      const { vw, vh } = g;
      const scale = g.mobile ? Math.min((vh * 0.74) / 900, (vw * 1.05) / bw) : (vh * def.k) / 900;
      const x = g.mobile ? 0.5 : def.x;
      const offY = vh - 900 * scale + mouse.y * 7;
      const offX = x * vw - shot.cx * 1600 * scale + mouse.x * 14 + dx;
      const dX = offX + bx * scale, dY = offY + by * scale, dW = bw * scale, dH = bh * scale;
      const a = frames.get(fi);
      if (a) ctx.drawImage(a, dX, dY, dW, dH);
      if (frac > 0.001 && fi + 1 <= shot.to) {
        const b = frames.get(fi + 1);
        if (b && b !== a) {
          const ga = ctx.globalAlpha;
          ctx.globalAlpha = ga * frac;
          ctx.drawImage(b, dX, dY, dW, dH);
          ctx.globalAlpha = ga;
        }
      }
    };

    const unsub = subscribe((g) => {
      resize(g);
      mouse.x = lerp(mouse.x, mouse.tx, 0.06);
      mouse.y = lerp(mouse.y, mouse.ty, 0.06);
      const key = [
        g.active, g.frameIn.toFixed(3), g.frameOut.toFixed(3), g.t.toFixed(4),
        g.vw, g.vh, mouse.x.toFixed(3), mouse.y.toFixed(3), frames.loaded,
      ].join('|');
      if (key === lastKey) return;
      lastKey = key;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, g.vw, g.vh);
      const cur = SCENES[g.active];
      if (g.t >= 1 || g.active === 0) {
        drawScene(g, cur, g.frameIn, 0);
        return;
      }

      // ── Blade transition ──
      const t = g.t;
      const { vw, vh } = g;
      const skew = 0.2 * vh;
      const e = -skew + (vw + 2 * skew) * t;
      const prev = SCENES[g.active - 1];

      // outgoing: right of the line
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(e + skew, 0);
      ctx.lineTo(vw + 10, 0);
      ctx.lineTo(vw + 10, vh);
      ctx.lineTo(e - skew, vh);
      ctx.closePath();
      ctx.clip();
      ctx.globalAlpha = 1 - 0.35 * t;
      drawScene(g, prev, g.frameOut, 60 * t);
      ctx.restore();

      // incoming: left of the line
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(e + skew, 0);
      ctx.lineTo(e - skew, vh);
      ctx.lineTo(-10, vh);
      ctx.closePath();
      ctx.clip();
      drawScene(g, cur, g.frameIn, -60 * (1 - t));
      ctx.restore();

      // blade + trail
      const toContact = cur.id === 'contact';
      const col = toContact ? '255,255,255' : '255,31,31';
      ctx.save();
      const grad = ctx.createLinearGradient(e - 90, 0, e, 0);
      grad.addColorStop(0, `rgba(${col},0)`);
      grad.addColorStop(1, `rgba(${col},0.28)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(e + skew - 90, 0);
      ctx.lineTo(e + skew, 0);
      ctx.lineTo(e - skew, vh);
      ctx.lineTo(e - skew - 90, vh);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = `rgb(${col})`;
      ctx.lineWidth = 3;
      ctx.shadowColor = `rgba(${col},0.9)`;
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.moveTo(e + skew, 0);
      ctx.lineTo(e - skew, vh);
      ctx.stroke();
      ctx.restore();
    });

    return () => {
      unsub();
      window.removeEventListener('pointermove', onMove);
    };
  }, []);
  return null;
}
