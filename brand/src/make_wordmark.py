"""Wordmark "Controlle": C no glifo C-anel (ConstanciaC-Bold) em #336633,
resto em Nunito Bold (OFL) convertido em paths, grafite #1C1C1E."""
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
import os
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = '/home/claude/Constancia/Brand'
WORD = 'Controlle'
TRACK = 8  # tracking em unidades

def build(weight=700, cstyle='Bold', ink='#1C1C1E', green='#336633', name='wordmark.svg'):
    nun = instantiateVariableFont(TTFont(f'{HERE}/Nunito-VF.ttf'), {'wght': weight})
    cfont = TTFont(f'/home/claude/Constancia/Resources/Fonts/ConstanciaC-{cstyle}.otf')
    x = 0; parts = []
    for ch in WORD:
        f = cfont if ch in 'cCçÇ' else nun
        gname = f.getBestCmap()[ord(ch)]
        gs = f.getGlyphSet()
        pen = SVGPathPen(gs)
        # y-up -> y-down; baseline em y=950
        gs[gname].draw(TransformPen(pen, (1, 0, 0, -1, x, 950)))
        parts.append((green if f is cfont else ink, pen.getCommands()))
        x += f['hmtx'][gname][0] + TRACK
    width = x - TRACK
    pad = 40
    # bbox vertical: cap ~715 acima da base, l sobe ~ 740; corta 950-760 .. 950+20
    top, bottom = 950 - 780, 950 + 20
    vb = f'{-pad} {top - pad} {width + 2*pad} {bottom - top + 2*pad}'
    body = ''.join(f'<path fill="{c}" d="{d}"/>' for c, d in parts)
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" '
           f'width="{(width+2*pad)/4:.0f}" height="{(bottom-top+2*pad)/4:.0f}" role="img" aria-label="Controlle">'
           f'<title>Controlle</title>{body}</svg>\n')
    open(f'{OUT}/{name}', 'w').write(svg)

build()
build(ink='#FFFFFF', green='#5FA35F', name='wordmark-dark.svg')
