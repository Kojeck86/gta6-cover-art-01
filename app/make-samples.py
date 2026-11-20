#!/usr/bin/env python3
"""Draw the three sample scenes for Neon Coast Cover Studio.

Every scene is original art drawn in code with Pillow: flat-illustration
style (sunset boulevard, neon night street, fishing pier). No photo of a
real person, no game artwork. Run: python3 make-samples.py
Writes samples/*.jpg at 1200x900, quality 88.
"""
import math
import os
import random
from PIL import Image, ImageDraw, ImageFilter

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "samples")
W, H = 1200, 900


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def vgrad(img, top, mid, bottom):
    """Vertical three-stop gradient painted straight onto img."""
    d = ImageDraw.Draw(img)
    for y in range(H):
        t = y / (H - 1)
        if t < 0.55:
            c = lerp(top, mid, t / 0.55)
        else:
            c = lerp(mid, bottom, (t - 0.55) / 0.45)
        d.line([(0, y), (W, y)], fill=c)


def glow(img, cx, cy, r, color, steps=24):
    """Soft radial glow: translucent concentric discs on their own layer."""
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for i in range(steps, 0, -1):
        rr = r * i / steps
        alpha = int(10 + 90 * (1 - i / steps) ** 2)
        d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=color + (alpha,))
    img.paste(Image.alpha_composite(img.convert("RGBA"), layer).convert("RGB"), (0, 0))


def grain(img, amount=9):
    rnd = random.Random(7)
    px = img.load()
    for _ in range(22000):
        x, y = rnd.randrange(W), rnd.randrange(H)
        v = px[x, y]
        n = rnd.randint(-amount, amount)
        px[x, y] = tuple(max(0, min(255, c + n)) for c in v[:3])


def palm(d, x, y, s, color, lean=0.12):
    """One palm silhouette: curved trunk plus seven drooping fronds."""
    tx, ty = x + s * lean, y - s * 0.95
    d.line([(x, y), (tx, ty)], fill=color, width=max(3, int(s * 0.045)))
    for k in range(7):
        ang = math.pi * (0.08 + 0.84 * k / 6)
        ex = tx + math.cos(ang) * s * 0.42
        ey = ty + math.sin(ang) * s * 0.30 - s * 0.06
        mx = tx + math.cos(ang) * s * 0.22
        my = ty + math.sin(ang) * s * 0.16 - s * 0.14
        d.line([(tx, ty), (mx, my), (ex, ey)], fill=color, width=max(2, int(s * 0.02)))
        d.ellipse([ex - 3, ey - 3, ex + 3, ey + 3], fill=color)


def boulevard():
    img = Image.new("RGB", (W, H))
    vgrad(img, (255, 176, 92), (255, 110, 130), (94, 38, 110))
    d = ImageDraw.Draw(img, "RGBA")
    glow(img, 600, 470, 260, (255, 214, 130))
    d.ellipse([520, 390, 680, 550], fill=(255, 226, 150))
    # Low haze band hugging the horizon so the sky melts into the street.
    d.rectangle([0, 520, W, 566], fill=(255, 190, 150, 42))
    d.rectangle([0, 560, W, H], fill=(52, 22, 64))
    d.polygon([(0, 900), (520, 560), (680, 560), (1200, 900)], fill=(38, 16, 50))
    palm(d, 150, 620, 300, (30, 10, 38), lean=0.10)
    palm(d, 1050, 630, 330, (30, 10, 38), lean=-0.08)
    palm(d, 330, 600, 200, (38, 14, 46), lean=0.14)
    # Vintage convertible silhouette on the boulevard, deep red so it
    # reads against the dark road.
    car = (168, 44, 58)
    d.rounded_rectangle([380, 640, 830, 730], radius=28, fill=car)
    d.polygon([(470, 640), (520, 585), (690, 585), (740, 640)], fill=car)
    d.polygon([(530, 592), (680, 592), (665, 632), (545, 632)], fill=(255, 214, 150))
    d.ellipse([440, 712, 510, 782], fill=(18, 8, 22))
    d.ellipse([700, 712, 770, 782], fill=(18, 8, 22))
    d.ellipse([462, 734, 488, 760], fill=(200, 200, 200))
    d.ellipse([722, 734, 748, 760], fill=(200, 200, 200))
    img = img.filter(ImageFilter.GaussianBlur(0.4))
    grain(img)
    return img


def neon():
    img = Image.new("RGB", (W, H))
    vgrad(img, (16, 10, 42), (28, 14, 58), (10, 8, 26))
    d = ImageDraw.Draw(img, "RGBA")
    # Building blocks with lit windows: a regular grid per block, some
    # windows lit in neon colours, the rest dark, so the blocks read
    # as buildings instead of confetti.
    rnd = random.Random(11)
    for bx, bw, bh in [(0, 260, 520), (300, 240, 640), (980, 220, 560), (700, 180, 420)]:
        d.rectangle([bx, 560 - bh, bx + bw, 560], fill=(40, 26, 72))
        d.line([(bx, 560 - bh), (bx + bw, 560 - bh)], fill=(70, 52, 110), width=3)
        cols = max(2, bw // 40)
        rows = max(3, bh // 52)
        for r in range(rows):
            for c in range(cols):
                wx = bx + 14 + c * ((bw - 28) // cols)
                wy = 560 - bh + 16 + r * ((bh - 32) // rows)
                if rnd.random() < 0.42:
                    col = rnd.choice([(255, 80, 170), (60, 230, 220), (255, 210, 90), (140, 120, 255)])
                    d.rectangle([wx, wy, wx + 16, wy + 20], fill=col)
                else:
                    d.rectangle([wx, wy, wx + 16, wy + 20], fill=(24, 16, 48))
    # Neon signs: a tight glow and a rounded frame with three bars.
    for (x, y, w, h, col) in [
        (330, 180, 200, 54, (255, 60, 170)),
        (760, 240, 170, 46, (50, 235, 225)),
        (90, 300, 150, 40, (255, 190, 60)),
    ]:
        glow(img, x + w // 2, y + h // 2, w // 2 + 18, col)
        d.rounded_rectangle([x, y, x + w, y + h], radius=10, outline=col, width=4)
        for i in range(3):
            d.line([(x + 18 + i * (w - 36) // 2, y + 12), (x + 18 + i * (w - 36) // 2, y + h - 12)],
                   fill=col, width=5)
    # Wet pavement with smeared reflections.
    d.rectangle([0, 560, W, H], fill=(14, 10, 30))
    for (x, col, w) in [(420, (255, 60, 170), 90), (845, (50, 235, 225), 70), (165, (255, 190, 60), 60)]:
        for i in range(14):
            a = 110 - i * 7
            d.rectangle([x - w // 2 + i * 2, 570 + i * 20, x + w // 2 - i * 2, 588 + i * 20],
                        fill=col + (max(0, a),))
    # Two friends laughing, simple silhouettes.
    for (x, s, col) in [(480, 1.0, (8, 6, 18)), (560, 0.94, (10, 7, 20))]:
        d.ellipse([x - 16 * s, 600 - 150 * s, x + 16 * s, 600 - 118 * s], fill=col)
        d.rounded_rectangle([x - 24 * s, 600 - 118 * s, x + 24 * s, 600 - 20 * s], radius=12, fill=col)
        d.line([(x - 20 * s, 600 - 20 * s), (x - 16 * s, 600)], fill=col, width=9)
        d.line([(x + 20 * s, 600 - 20 * s), (x + 16 * s, 600)], fill=col, width=9)
    img = img.filter(ImageFilter.GaussianBlur(0.4))
    grain(img)
    return img


def pier():
    img = Image.new("RGB", (W, H))
    vgrad(img, (140, 210, 235), (255, 190, 130), (255, 140, 110))
    d = ImageDraw.Draw(img, "RGBA")
    glow(img, 880, 300, 220, (255, 220, 150))
    d.ellipse([820, 240, 940, 360], fill=(255, 232, 170))
    d.rectangle([0, 540, W, H], fill=(16, 120, 140))
    for i in range(9):
        y = 560 + i * 36
        d.line([(0, y), (W, y + 14)], fill=(255, 255, 255, 26), width=3)
    # Wooden pier in perspective.
    d.polygon([(430, 900), (540, 540), (660, 540), (770, 900)], fill=(122, 82, 52))
    for i in range(8):
        t = i / 7
        x0 = int(430 + (540 - 430) * t)
        x1 = int(770 + (660 - 770) * t)
        y = int(900 - (900 - 540) * t)
        d.line([(x0, y), (x1, y)], fill=(88, 56, 34), width=3)
    d.line([(540, 540), (430, 900)], fill=(96, 62, 38), width=6)
    d.line([(660, 540), (770, 900)], fill=(96, 62, 38), width=6)
    # Fisherman with a rod, bucket hat with a wide brim.
    fx, fy = 600, 560
    d.ellipse([fx - 15, fy - 150, fx + 15, fy - 120], fill=(24, 18, 26))
    d.ellipse([fx - 26, fy - 156, fx + 26, fy - 138], fill=(235, 225, 205))
    d.ellipse([fx - 14, fy - 168, fx + 14, fy - 140], fill=(235, 225, 205))
    d.rounded_rectangle([fx - 26, fy - 120, fx + 26, fy - 30], radius=12, fill=(24, 18, 26))
    d.line([(fx - 22, fy - 30), (fx - 18, fy)], fill=(24, 18, 26), width=9)
    d.line([(fx + 22, fy - 30), (fx + 18, fy)], fill=(24, 18, 26), width=9)
    d.line([(fx + 20, fy - 110), (760, fy - 330)], fill=(30, 22, 28), width=4)
    d.line([(760, fy - 330), (760, fy - 240)], fill=(220, 220, 220), width=2)
    palm(d, 90, 580, 260, (26, 60, 40), lean=0.10)
    palm(d, 1120, 590, 290, (26, 60, 40), lean=-0.10)
    img = img.filter(ImageFilter.GaussianBlur(0.4))
    grain(img)
    return img


def main():
    os.makedirs(OUT, exist_ok=True)
    for name, fn in [("boulevard", boulevard), ("neon", neon), ("pier", pier)]:
        path = os.path.join(OUT, name + ".jpg")
        fn().save(path, "JPEG", quality=88)
        print("wrote", path, os.path.getsize(path), "bytes")


if __name__ == "__main__":
    main()
