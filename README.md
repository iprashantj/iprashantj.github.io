# Prashant Jadhav — scroll-driven portfolio

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build into dist/ (relative paths, deploy anywhere)
```

- All copy lives in `src/data.ts`.
- `src/engine/director.ts` – Lenis + one gsap ticker, scene maths, blade timing.
- `src/engine/frames.ts` – manifest + stride-ordered WebP frame loader.
- `src/components/Stage.tsx` – canvas painter (fractional frames, blade transition).
- Layers: `#layer-back` (z0) → canvas (z1) → `#layer-front` (z2) → `<main>` (z3) → HUD (z50) → cursor/preloader (z90+).

## Regenerating frames (`tools/`)

```bash
pip install rembg onnxruntime scipy opencv-python-headless pillow
mkdir full && ffmpeg -i video.mp4 -start_number 0 full/f%03d.png
python tools/matte.py out      # writes out/lg, out/sm, out/manifest.json
cp -r out/lg out/sm out/manifest.json public/frames/
```

Cut frames (60, 120, 188) are set in `CUTS` in `matte.py` and mirrored in `director.ts`.
`wm.py` removes the video generator's sparkle watermark; drop it for a clean source video.
