# Storyboard v3 = v1's DRAWINGS, untouched, with three surgical edits:
#   - drop panel 1 (the empty title frame)
#   - erase the 'otto' wordmark from panels 3 and 5 (it survives only in panel 6)
#   - re-centre the otter in panel 5
# Nothing is regenerated: every stroke is pixels lifted from v1.
#
# Erasing samples paper from DIRECTLY ABOVE the target inside the same panel,
# so the sheet's vignette is matched locally — one tiled patch from elsewhere
# left visible rectangles.
from PIL import Image
import numpy as np

SRC = 'docs/design/intro/otto-intro-storyboard-v1.png'
OUT = 'docs/design/intro/otto-intro-storyboard-v3.png'
im = Image.open(SRC).convert('RGB')

PAN = {
    1: (44, 52, 441, 316), 2: (481, 52, 892, 316), 3: (934, 52, 1331, 316),
    4: (44, 422, 441, 685), 5: (481, 422, 892, 685), 6: (934, 422, 1331, 685),
}
CELL = {
    2: (465, 18, 912, 375), 3: (918, 18, 1352, 375),
    4: (28, 388, 462, 745), 5: (465, 388, 912, 745), 6: (918, 388, 1352, 745),
}

def ink_bbox(img, box, thresh=430):
    x0, y0, x1, y1 = box
    a = np.asarray(img.crop(box).convert('RGB')).astype(int).sum(axis=2)
    m = a < thresh
    if not m.any():
        return None
    ys, xs = np.where(m)
    return (int(x0 + xs.min()), int(y0 + ys.min()), int(x0 + xs.max()) + 1, int(y0 + ys.max()) + 1)

def patch_from_above(dst, box, src, pan):
    """Cover `box` with paper taken from the same columns higher up the panel."""
    x0, y0, x1, y1 = box
    h = y1 - y0
    sy = max(pan[1] + 3, y0 - h - 6)          # a clean band above the target
    strip = src.crop((x0, sy, x1, sy + h))
    dst.paste(strip, (x0, y0))

work = im.copy()

# --- panel 3: erase the wordmark ------------------------------------------
p3 = PAN[3]
t3 = ink_bbox(im, (p3[0] + 4, p3[1] + 80, p3[0] + 175, p3[1] + 175))
t3 = (t3[0] - 8, t3[1] - 8, t3[2] + 8, t3[3] + 8)
patch_from_above(work, t3, im, p3)
print('panel3 wordmark erased', t3)

# --- panel 5: erase the wordmark, then centre the otter --------------------
p5 = PAN[5]
otter = ink_bbox(im, (p5[0] + 2, p5[1] + 2, 700, p5[3] - 2))
# His hat BREAKS THE FRAME — part of it is drawn above the top border. Take the
# crop from above the frame so the overshoot travels with him instead of being
# left behind at the old position.
TOP = 396
otter_img = im.crop((otter[0] - 10, TOP, otter[2] + 10, p5[3] - 2))

# Wipe the interior with a clean COLUMN from the panel's own right side,
# repeated across — it carries the panel's own top-to-bottom tone.
col = im.crop((p5[2] - 40, p5[1] + 2, p5[2] - 4, p5[3] - 2))
for x in range(p5[0] + 2, p5[2] - 2, col.width):
    w = min(col.width, (p5[2] - 2) - x)
    work.paste(col.crop((0, 0, w, col.height)), (x, p5[1] + 2))

# Wipe the band above the frame too (starting clear of the panel number).
band = im.crop((p5[2] - 40, TOP, p5[2] - 4, p5[1] + 1))
for x in range(p5[0] + 24, p5[2] - 2, band.width):
    w = min(band.width, (p5[2] - 2) - x)
    work.paste(band.crop((0, 0, w, band.height)), (x, TOP))

cx = (p5[0] + p5[2]) // 2
nx = cx - otter_img.width // 2
work.paste(otter_img, (nx, TOP))
# Re-wipe the above-frame band to the LEFT of where his hat actually lands —
# the source crop carried a couple of stray ticks from the old position.
for x in range(p5[0] + 24, nx + 50, band.width):
    w = min(band.width, (nx + 50) - x)
    if w > 0:
        work.paste(band.crop((0, 0, w, band.height)), (x, TOP))
print('panel5 otter re-centred', otter[0], '->', nx)

# --- lay out panels 2..6 --------------------------------------------------
cw = max(CELL[k][2] - CELL[k][0] for k in CELL)
ch = max(CELL[k][3] - CELL[k][1] for k in CELL)
M, G = 34, 26
# Flat paper: the gaps are thin, and a matched solid beats a visible tile seam.
bg = tuple(np.asarray(im.crop((6, 400, 26, 740))).reshape(-1, 3).mean(axis=0).round().astype(int))
canvas = Image.new('RGB', (M * 2 + cw * 3 + G * 2, M * 2 + ch * 2 + G), bg)
print('paper', bg)

for i, k in enumerate([2, 3, 4, 5, 6]):
    col_i, row = i % 3, i // 3
    cell = work.crop(CELL[k])
    canvas.paste(cell, (M + col_i * (cw + G) + (cw - cell.width) // 2, M + row * (ch + G)))

canvas.save(OUT)
print('wrote', OUT, canvas.size)
