import { forwardRef, useImperativeHandle, useRef } from 'react';
import { smoothstep } from '../engine/director';

export type OdometerHandle = { set: (v: number) => void };

/** Mechanical odometer: each digit is a column 0–9,0 that rolls; the lowest digit snaps (smoothstep .55–1) and carries upward. */
const Odometer = forwardRef<OdometerHandle, { digits: number; className?: string; pad?: boolean }>(
  function Odometer({ digits, className, pad = false }, ref) {
    const cols = useRef<(HTMLSpanElement | null)[]>([]);
    const wraps = useRef<(HTMLSpanElement | null)[]>([]);
    const last = useRef(-1);

    useImperativeHandle(ref, () => ({
      set(v: number) {
        if (Math.abs(v - last.current) < 1e-4) return;
        last.current = v;
        const n = cols.current.length;
        const lead = Math.max(1, String(Math.floor(v + 0.999)).length);
        for (let i = 0; i < n; i++) {
          const k = n - 1 - i; // place value index (0 = units)
          const p10 = Math.pow(10, k);
          const base = Math.floor(v / p10) % 10;
          const rem = v - Math.floor(v / p10) * p10; // value of the lower places
          const carry = smoothstep(0.55, 1, rem - (p10 - 1));
          const pos = base + carry;
          const el = cols.current[i];
          if (el) el.style.transform = `translate3d(0, ${(-pos * 100) / 11}%, 0)`;
          const w = wraps.current[i];
          if (w && !pad) w.style.display = k < lead ? '' : 'none';
        }
      },
    }));

    return (
      <span className={`odo ${className ?? ''}`} aria-hidden="true">
        {Array.from({ length: digits }, (_, i) => (
          <span className="odo-d" key={i} ref={(el) => { wraps.current[i] = el; }}>
            <span className="odo-col" ref={(el) => { cols.current[i] = el; }}>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d, j) => <span key={j}>{d}</span>)}
            </span>
          </span>
        ))}
      </span>
    );
  },
);
export default Odometer;
