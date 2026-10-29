"""Export exact Nunito wordmarks as font-independent SVG paths (fonttools 4.61.1)."""
from pathlib import Path
from html import escape
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets' / 'branding'
FONT_ROOT = ROOT / 'node_modules' / '@expo-google-fonts' / 'nunito'

def text_svg(text, filename, color, weight='900Black', accent=None, dot=False):
    font = TTFont(FONT_ROOT / weight / f'Nunito_{weight}.ttf')
    glyphs, cmap = font.getGlyphSet(), font.getBestCmap()
    cap = font['OS/2'].sCapHeight
    padding = 100
    x, paths = padding, []
    for index, char in enumerate(text):
        name = cmap[ord(char)]
        pen = SVGPathPen(glyphs)
        glyphs[name].draw(pen)
        fill = accent if accent and index >= 5 else color
        paths.append(f'<path fill="{fill}" transform="translate({x} {cap+padding}) scale(1 -1)" d="{pen.getCommands()}"/>')
        x += font['hmtx'][name][0] - (18 if weight == '900Black' else 0)
    if dot:
        paths.append(f'<circle cx="{x+65}" cy="{padding+40}" r="55" fill="{("#FF6B6B" if color == "#FFFFFF" else "#FFD447")}"/>')
        x += 150
    label = escape(text, quote=True)
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {x+padding} {cap+padding*2}" role="img" aria-label="{label}"><title>{label}</title>'+''.join(paths)+'</svg>\n'
    (OUT / filename).write_text(svg)

text_svg('BLOOPIQ', 'wordmark-light.svg', '#17324D', accent='#FF6B6B', dot=True)
text_svg('BLOOPIQ', 'wordmark-on-blue.svg', '#FFFFFF', accent='#FFD447', dot=True)
text_svg('BLOOPIQ', 'wordmark-dark.svg', '#FFFFFF', accent='#FF6B6B', dot=True)
text_svg('See it. Know it.', 'source/tagline-first.svg', '#FFFFFF')
text_svg('Score it.', 'source/tagline-second.svg', '#FFD447')
text_svg('Flags, sports & friendly competition', 'source/tagline-detail.svg', '#FFFFFF', weight='600SemiBold')
print('Exported path-based Nunito wordmarks and feature-graphic text.')
