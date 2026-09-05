#!/usr/bin/env python3
"""
Generate Evensong's app icons with Pillow: a deep navy ground with a simple gold
candle and flame, no text.

  python3 scripts/make_icons.py

Writes assets/icon.png (1024x1024 RGB), adaptive-icon.png, splash-icon.png,
notification-icon.png (96x96 white on transparent) and favicon.png.
"""
import math
import os

from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets")

NAVY = (28, 34, 51)
NAVY_DEEP = (18, 22, 36)
GOLD = (230, 182, 85)
GOLD_DEEP = (184, 116, 42)
CREAM = (250, 240, 214)
WAX = (240, 232, 214)
WAX_SHADE = (214, 202, 178)
EMBER = (232, 140, 70)


def radial_bg(size: int) -> Image.Image:
    img = Image.new("RGB", (size, size), NAVY_DEEP)
    glow = Image.new("RGB", (size, size), NAVY_DEEP)
    d = ImageDraw.Draw(glow)
    cx, cy = size / 2, size * 0.42
    steps = 40
    for i in range(steps, 0, -1):
        r = size * 0.62 * i / steps
        t = i / steps
        c = tuple(int(NAVY_DEEP[k] + (NAVY[k] - NAVY_DEEP[k]) * (1 - t)) for k in range(3))
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=c)
    return Image.blend(img, glow, 1.0)


def glow_layer(size, cx, cy, radius, color, alpha):
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.ellipse([cx - radius, cy - radius, cx + radius, cy + radius], fill=color + (alpha,))
    return layer.filter(ImageFilter.GaussianBlur(radius * 0.55))


def flame(d: ImageDraw.ImageDraw, cx: float, base_y: float, h: float, w: float, color):
    pts = []
    n = 48
    for i in range(n + 1):
        t = i / n
        y = base_y - h * t
        ww = w * math.sin(math.pi * (0.5 * t + 0.5)) * (1 - t * 0.15) if t < 1 else 0
        pts.append((cx - ww, y))
    for i in range(n, -1, -1):
        t = i / n
        y = base_y - h * t
        ww = w * math.sin(math.pi * (0.5 * t + 0.5)) * (1 - t * 0.15) if t < 1 else 0
        pts.append((cx + ww, y))
    d.polygon(pts, fill=color)


def draw_candle(size: int, transparent: bool, scale: float = 1.0, mono: bool = False) -> Image.Image:
    s = size
    u = s / 1024 * scale
    canvas = Image.new("RGBA", (s, s), (0, 0, 0, 0)) if transparent else radial_bg(s).convert("RGBA")

    cx = s / 2
    candle_w = 220 * u
    candle_top = s / 2 - 40 * u
    candle_h = 400 * u
    flame_base = candle_top - 26 * u
    flame_h = 230 * u
    flame_w = 82 * u

    if mono:
        d = ImageDraw.Draw(canvas)
        white = (255, 255, 255, 255)
        d.rounded_rectangle([cx - candle_w / 2, candle_top, cx + candle_w / 2, candle_top + candle_h], radius=30 * u, fill=white)
        d.rounded_rectangle([cx - 8 * u, candle_top - 40 * u, cx + 8 * u, candle_top + 10 * u], radius=6 * u, fill=white)
        flame(d, cx, flame_base, flame_h, flame_w, white)
        return canvas

    # glow behind the flame
    canvas.alpha_composite(glow_layer(s, cx, flame_base - flame_h * 0.45, 360 * u, EMBER, 70))
    canvas.alpha_composite(glow_layer(s, cx, flame_base - flame_h * 0.45, 220 * u, GOLD, 120))

    d = ImageDraw.Draw(canvas)
    # candle body (wax) with a shaded edge and a soft drip
    d.rounded_rectangle([cx - candle_w / 2, candle_top, cx + candle_w / 2, candle_top + candle_h], radius=30 * u, fill=WAX)
    d.rounded_rectangle([cx + candle_w / 2 - 44 * u, candle_top + 6 * u, cx + candle_w / 2, candle_top + candle_h], radius=26 * u, fill=WAX_SHADE)
    d.ellipse([cx - candle_w / 2, candle_top - 22 * u, cx + candle_w / 2, candle_top + 22 * u], fill=CREAM)
    d.ellipse([cx - candle_w / 2 + 40 * u, candle_top - 8 * u, cx + candle_w / 2 - 40 * u, candle_top + 12 * u], fill=GOLD_DEEP + (90,))
    d.rounded_rectangle([cx - candle_w / 2 + 12 * u, candle_top + 60 * u, cx - candle_w / 2 + 44 * u, candle_top + 150 * u], radius=16 * u, fill=CREAM)
    # brass holder
    d.rounded_rectangle([cx - 300 * u, candle_top + candle_h - 10 * u, cx + 300 * u, candle_top + candle_h + 54 * u], radius=28 * u, fill=GOLD_DEEP)
    d.rounded_rectangle([cx - 230 * u, candle_top + candle_h + 44 * u, cx + 230 * u, candle_top + candle_h + 90 * u], radius=24 * u, fill=GOLD)
    d.ellipse([cx - 300 * u, candle_top + candle_h - 40 * u, cx + 300 * u, candle_top + candle_h + 20 * u], fill=GOLD)
    d.rounded_rectangle([cx - candle_w / 2, candle_top + candle_h - 40 * u, cx + candle_w / 2, candle_top + candle_h], radius=1, fill=WAX)
    # wick
    d.rounded_rectangle([cx - 7 * u, candle_top - 34 * u, cx + 7 * u, candle_top + 6 * u], radius=6 * u, fill=(60, 48, 36))
    # flame (three layers)
    flame(d, cx, flame_base, flame_h, flame_w, EMBER)
    flame(d, cx, flame_base, flame_h * 0.7, flame_w * 0.64, GOLD)
    flame(d, cx, flame_base, flame_h * 0.38, flame_w * 0.34, CREAM)
    return canvas


def main():
    os.makedirs(ROOT, exist_ok=True)
    icon = draw_candle(1024, transparent=False, scale=1.0).convert("RGB")
    icon.save(os.path.join(ROOT, "icon.png"))
    adaptive = draw_candle(1024, transparent=True, scale=0.72)
    adaptive.save(os.path.join(ROOT, "adaptive-icon.png"))
    splash = draw_candle(1024, transparent=True, scale=0.9)
    splash.save(os.path.join(ROOT, "splash-icon.png"))
    notif = draw_candle(1024, transparent=True, scale=0.95, mono=True).resize((96, 96), Image.LANCZOS)
    notif.save(os.path.join(ROOT, "notification-icon.png"))
    icon.resize((64, 64), Image.LANCZOS).save(os.path.join(ROOT, "favicon.png"))
    print("icons written to", os.path.abspath(ROOT))


if __name__ == "__main__":
    main()
