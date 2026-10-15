export type Shot = { from: number; to: number; box: [number, number, number, number]; cx: number };
export type Manifest = { w: number; h: number; count: number; shots: Shot[] };

const BASE = import.meta.env.BASE_URL;

class FrameStore {
  manifest: Manifest | null = null;
  imgs: (HTMLImageElement | null)[] = [];
  loaded = 0;
  private shotIndex: number[] = [];
  private listeners = new Set<(loaded: number, gate: number) => void>();
  gate = 1; // frames the preloader waits for

  shotOf(i: number) {
    return this.shotIndex[Math.max(0, Math.min(this.shotIndex.length - 1, i))] ?? 0;
  }

  /** Loaded image for frame i, or the nearest loaded frame in the same shot. */
  get(i: number): HTMLImageElement | null {
    const m = this.manifest;
    if (!m) return null;
    i = Math.max(0, Math.min(m.count - 1, i));
    if (this.imgs[i]) return this.imgs[i];
    const s = m.shots[this.shotOf(i)];
    for (let d = 1; d <= s.to - s.from; d++) {
      const a = i - d, b = i + d;
      if (a >= s.from && this.imgs[a]) return this.imgs[a];
      if (b <= s.to && this.imgs[b]) return this.imgs[b];
    }
    return null;
  }

  onProgress(fn: (loaded: number, gate: number) => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  async load(small: boolean) {
    const res = await fetch(`${BASE}frames/manifest.json`);
    const m: Manifest = await res.json();
    this.manifest = m;
    this.imgs = new Array(m.count).fill(null);
    m.shots.forEach((s, k) => {
      for (let i = s.from; i <= s.to; i++) this.shotIndex[i] = k;
    });

    // order: shot boundaries, then strides 8 → 4 → 2 → 1
    const order: number[] = [];
    const seen = new Set<number>();
    const push = (i: number) => {
      if (i >= 0 && i < m.count && !seen.has(i)) {
        seen.add(i);
        order.push(i);
      }
    };
    m.shots.forEach((s) => { push(s.from); push(s.to); });
    for (const stride of [8, 4, 2, 1]) {
      for (const s of m.shots) for (let i = s.from; i <= s.to; i += stride) push(i);
    }
    this.gate = Math.ceil(m.count / 4);

    const dir = small ? 'sm' : 'lg';
    let next = 0;
    let gateCount = 0;
    const gateSet = new Set(order.slice(0, this.gate));
    const emit = () => this.listeners.forEach((fn) => fn(gateCount, this.gate));

    const worker = async () => {
      while (next < order.length) {
        const i = order[next++];
        const img = new Image();
        img.src = `${BASE}frames/${dir}/f${String(i).padStart(3, '0')}.webp`;
        try {
          await img.decode();
          this.imgs[i] = img;
          this.loaded++;
        } catch {
          /* missing frame: get() falls back to nearest loaded */
        }
        if (gateSet.has(i)) gateCount++;
        emit();
      }
    };
    await Promise.all(Array.from({ length: 6 }, worker));
  }
}

export const frames = new FrameStore();
