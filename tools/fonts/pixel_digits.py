"""
Builds apps/web/public/fonts/tg-pixel-digits.woff2: Press Start 2P's ten digits, moved down onto the baseline (D137).

Pixelify Sans, the site's heading face, draws a 5 that reads as an S and a 2 that reads as a Z. The site's CSS puts this
face first in the heading stack for digits only (unicode-range), scaled to Pixelify's cap height. Press Start 2P draws
on an 8x8 grid with an empty bottom row, so its digits sit 125/1000 em above the baseline; shifted down they line up
with the letters beside them. The OFL reserves the name "Press Start 2P", so the modified face is renamed.

Run with fontTools and brotli installed: python3 tools/fonts/pixel_digits.py
"""
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "apps/web/public/fonts/press-start-2p-latin.woff2"
OUT = ROOT / "apps/web/public/fonts/tg-pixel-digits.woff2"
NAME = "TG Pixel Digits"

font = TTFont(SOURCE)
options = subset.Options()
options.flavor = "woff2"
options.layout_features = []
options.name_IDs = []
options.notdef_outline = True
subsetter = subset.Subsetter(options)
subsetter.populate(unicodes=range(0x30, 0x3A))
subsetter.subset(font)

shift = font["head"].unitsPerEm // 8
glyf = font["glyf"]
for name in font.getGlyphOrder():
    glyph = glyf[name]
    if glyph.numberOfContours > 0:
        glyph.coordinates.translate((0, -shift))
        glyph.recalcBounds(glyf)
font["head"].yMin -= shift
font["head"].yMax -= shift
font["hhea"].ascent = font["OS/2"].sTypoAscender = font["OS/2"].usWinAscent = font["head"].unitsPerEm - shift
font["hhea"].descent = font["OS/2"].sTypoDescender = 0
font["OS/2"].usWinDescent = 0

name_table = font["name"]
name_table.names = []
for name_id, value in {0: "Copyright 2012 The Press Start 2P Project Authors (cody@zone38.net). Modified 2026 for TRMNL Games.", 1: NAME, 2: "Regular", 4: f"{NAME} Regular", 6: "TGPixelDigits-Regular", 13: "SIL Open Font License, Version 1.1", 14: "https://openfontlicense.org"}.items():
    name_table.setName(value, name_id, 3, 1, 0x409)

font.save(OUT)
check = TTFont(OUT)
print(OUT.name, OUT.stat().st_size, "bytes;", "digits", "".join(chr(c) for c in sorted(check.getBestCmap())), "; zero yMin", check["glyf"]["zero"].yMin)
