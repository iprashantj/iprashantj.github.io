import numpy as np
def unwatermark(arr):
    """Invert the generator's flat 4-point sparkle overlay: I = (1-a)O + a*C."""
    cx, cy, R, p, A, C = 1159.5, 599.5, 24.5, 0.72, 0.32, 236.0
    soft = 0.1
    out = arr.astype(np.float32).copy()
    y0, y1, x0, x1 = int(cy - 30), int(cy + 31), int(cx - 30), int(cx + 31)
    yy, xx = np.mgrid[y0:y1, x0:x1]
    f = (np.abs(xx - cx) / R) ** p + (np.abs(yy - cy) / R) ** p
    a = (A * np.clip((1.0 - f) / soft + 0.5, 0, 1))[..., None]
    out[y0:y1, x0:x1] = np.clip((out[y0:y1, x0:x1] - a * C) / (1 - a), 0, 255)
    return out.astype(np.uint8)
