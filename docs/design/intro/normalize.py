#!/usr/bin/env python3
"""Otto intro — keyframe scale normaliser + contact-sheet builder.

WHY THIS EXISTS
The nine painted frames were generated independently, so the character is a
DIFFERENT SIZE in each one. SHOT_BREAKDOWN sec.2 invariant 6 requires shots A-D to
hold one consistent character size under a locked-off camera, so every frame has to
be rendered at a per-frame scale + offset. Without this the intro reads as a slow
camera creep-in, which the board forbids.

This file is the single source of truth for those constants. The app consumes the
same numbers (see BUILD_NOTE.md, sec.3). Edit FRAMES, re-run, LOOK at
frames/_contact-sheet.png.

    python3 docs/design/intro/normalize.py
"""
import os
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
KF = os.path.join(HERE, "keyframes")
OUT = os.path.join(HERE, "frames")

W, H = 768, 1376          # working frame, 9:16 portrait
GROUND = 1000             # shared ground line, px from top of frame

# scale  : multiplier on the whole source image so the character matches size
# head   : (x, y) of the head centre, SOURCE px  (horizontal anchor)
# ground : y of the character's ground contact, SOURCE px  (vertical anchor)
# cx     : where the head lands on the canvas -- this is the LEFT->RIGHT travel
# t      : (start, end) seconds in the 1.7s cut
FRAMES = {
    # --- SHOT A: he runs in, left -> right -------------------------------
    "A-run":                dict(scale=1.00, head=(400, 595), ground=907,  cx=150, t=(0.00, 0.11)),
    "A2-run-gather":        dict(scale=1.00, head=(560, 620), ground=922,  cx=240, t=(0.11, 0.22)),
    # A and A2 alternate twice more; cx keeps advancing (see BUILD_NOTE sec.3)
    "AB-plant":             dict(scale=0.72, head=(600, 710), ground=941,  cx=330, t=(0.45, 0.56)),
    # --- SHOT B: skid, hat flops over the eyes ---------------------------
    "B-skid-hat-over-eyes": dict(scale=0.63, head=(570, 730), ground=936,  cx=384, t=(0.56, 0.72)),
    # --- SHOT C: he rises and pushes the hat back up ---------------------
    "BC1-rising":           dict(scale=0.66, head=(570, 840), ground=1131, cx=384, t=(0.72, 0.82)),
    "BC2-stands-hat-down":  dict(scale=0.57, head=(410, 570), ground=1172, cx=384, t=(0.82, 0.92)),
    "C-pushes-hat-up":      dict(scale=0.54, head=(400, 540), ground=1202, cx=384, t=(0.92, 1.02)),
    # --- SHOT D: he turns to camera --------------------------------------
    "CD-lowers-paw":        dict(scale=0.68, head=(390, 550), ground=1081, cx=384, t=(1.02, 1.14)),
    "D-turns-to-camera":    dict(scale=0.70, head=(385, 530), ground=1068, cx=384, t=(1.14, 1.25)),
}


def bg_of(img):
    """That frame's own paper colour, so pasting leaves no visible seam."""
    small = img.resize((32, 32))
    px = sorted(small.getdata(), key=lambda c: -sum(c))
    return px[len(px) // 8]


def place(name, cfg):
    src = Image.open(os.path.join(KF, name + ".png")).convert("RGB")
    s = cfg["scale"]
    scaled = src.resize((int(src.width * s), int(src.height * s)), Image.LANCZOS)
    ox = int(cfg["cx"] - cfg["head"][0] * s)
    oy = int(GROUND - cfg["ground"] * s)
    canvas = Image.new("RGB", (W, H), bg_of(src))
    canvas.paste(scaled, (ox, oy))
    return canvas


def main():
    os.makedirs(OUT, exist_ok=True)
    cols, tw = len(FRAMES), 300
    th = int(tw * H / W)
    sheet = Image.new("RGB", (cols * (tw + 10) + 10, th + 54), (255, 255, 255))
    d = ImageDraw.Draw(sheet)
    x = 10
    for name, cfg in FRAMES.items():
        img = place(name, cfg)
        img.save(os.path.join(OUT, name + "-norm.png"))
        sheet.paste(img.resize((tw, th), Image.LANCZOS), (x, 34))
        d.text((x + 4, 8), name, fill=(20, 20, 20))
        d.text((x + 4, 20), "t %.2f-%.2f  scale %.2f" % (cfg["t"][0], cfg["t"][1], cfg["scale"]),
               fill=(120, 120, 120))
        d.rectangle([x, 34, x + tw, 34 + th], outline=(210, 205, 195))
        x += tw + 10
    sheet.save(os.path.join(OUT, "_contact-sheet.png"))
    print("wrote", OUT)


if __name__ == "__main__":
    main()
