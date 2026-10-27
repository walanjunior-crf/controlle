"""Gera a fonte ConstanciaC (C c Ç ç em C-anel) em 3 pesos, CFF/.otf.

Uso: python3 build_fonts.py   -> Resources/Fonts/ConstanciaC-*.otf
O traço é construído como linha central (arco elíptico) + stroke com pontas
redondas via skia-pathops, unido à cedilha e convertido em CFF.
"""
import math, os
import pathops
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.t2CharStringPen import T2CharStringPen
from fontTools.pens.areaPen import AreaPen
from fontTools.pens.recordingPen import RecordingPen, DecomposingRecordingPen
from fontTools.pens.boundsPen import BoundsPen

OUT = '/home/claude/Constancia/Resources/Fonts'
UPM, ASC, DESC, CAP, XH = 1000, 950, -250, 705, 500
OVERSHOOT = 10
GAP = 70.0      # abertura (graus) na linha central — um pouco maior que o logo p/ ler como letra no texto
RATIO = 0.93    # largura/altura do anel (levemente condensado, como um C de texto)
LSB = 50

WEIGHTS = {  # nome: (stroke C, stroke c, usWeightClass)
    'Regular':  (80, 74, 400),
    'Semibold': (105, 96, 600),
    'Bold':     (130, 118, 700),
}

K = 0.5522847498

def ellipse_arc(path, cx, cy, a, b, t0, t1, move=True):
    """Arco elíptico (graus, anti-horário em y-up) em cúbicas de <=90°."""
    n = max(1, math.ceil(abs(t1 - t0) / 90))
    step = (t1 - t0) / n
    def pt(t):
        r = math.radians(t); return cx + a * math.cos(r), cy + b * math.sin(r)
    def d(t):
        r = math.radians(t); return -a * math.sin(r), b * math.cos(r)
    if move:
        path.moveTo(*pt(t0))
    for i in range(n):
        s, e = t0 + i * step, t0 + (i + 1) * step
        h = 4 / 3 * math.tan(math.radians(e - s) / 4)
        p0, p3 = pt(s), pt(e); d0, d3 = d(s), d(e)
        path.cubicTo(p0[0] + h * d0[0], p0[1] + h * d0[1],
                     p3[0] - h * d3[0], p3[1] - h * d3[1], *p3)

def stroked(center, width):
    p = pathops.Path()
    p.addPath(center) if hasattr(p, 'addPath') else None
    p.stroke(width, pathops.LineCap.ROUND_CAP, pathops.LineJoin.ROUND_JOIN, 4)
    return p

def ring(height_top, w, cx):
    """Retorna (path preenchido, cx, cy_bottom_outer) do C-anel com topo em height_top."""
    bottom = -OVERSHOOT
    top = height_top + OVERSHOOT
    H = top - bottom
    W = H * RATIO
    b = (H - w) / 2; a = (W - w) / 2
    cy = bottom + H / 2
    # Contorno analítico: arco externo (anti-horário) -> ponta redonda inferior ->
    # arco interno (horário) -> ponta redonda superior. Offsets da elipse
    # aproximados por elipses (a±w/2, b±w/2): erro desprezível p/ RATIO ~0.93.
    t0, t1 = GAP / 2, 360 - GAP / 2
    ao, bo, ai, bi = a + w / 2, b + w / 2, a - w / 2, b - w / 2
    c = pathops.Path()
    ellipse_arc(c, cx, cy, ao, bo, t0, t1)
    _cap(c, (cx + ao * math.cos(math.radians(t1)), cy + bo * math.sin(math.radians(t1))),
            (cx + ai * math.cos(math.radians(t1)), cy + bi * math.sin(math.radians(t1))))
    ellipse_arc(c, cx, cy, ai, bi, t1, t0, move=False)
    _cap(c, (cx + ai * math.cos(math.radians(t0)), cy + bi * math.sin(math.radians(t0))),
            (cx + ao * math.cos(math.radians(t0)), cy + bo * math.sin(math.radians(t0))))
    c.close()
    return c, W, a, cy

def _cap(path, p0, p1):
    """Semicírculo de p0 a p1, bojudo para fora (lado direito do sentido p0->p1... ajustado)."""
    mx, my = (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2
    r = math.hypot(p1[0] - p0[0], p1[1] - p0[1]) / 2
    s = math.degrees(math.atan2(p0[1] - my, p0[0] - mx))
    # contorno externo anti-horário: as pontas giram também anti-horário (+180)
    ellipse_arc(path, mx, my, r, r, s, s + 180, move=False)

def cedilla(cx, w, scale):
    """Cedilha: haste curta saindo da base do anel e gancho que curva para a esquerda."""
    sw = w * 0.66
    r = 58 * scale
    top = -OVERSHOOT - w * 0.4
    yb = -70 * scale
    c = pathops.Path()
    c.moveTo(cx, top)
    c.lineTo(cx, yb)
    ellipse_arc(c, cx - r, yb, r, r * 1.05, 0, -125, move=False)
    c.stroke(sw, pathops.LineCap.ROUND_CAP, pathops.LineJoin.ROUND_JOIN, 4)
    c.convertConicsToQuads(0.25)
    return c

def union(*paths):
    res = pathops.Path()
    for p in paths:
        res = pathops.op(res, p, pathops.PathOp.UNION) if len(list(res.contours)) else pathops.op(p, p, pathops.PathOp.UNION)
    return res

def fix_direction(path):
    """CFF: contornos externos anti-horários (área positiva em y-up)."""
    out = pathops.Path()
    for cont in path.contours:
        ap = AreaPen(); cont.draw(ap)
        # externo = não contido em outro contorno
        x0, y0, x1, y1 = cont.bounds
        is_inner = any(o is not cont and _contains(o, cont) for o in path.contours)
        want_positive = not is_inner
        if (ap.value > 0) != want_positive:
            cont.reverse()
        out.addPath(cont)
    return out

def _contains(o, c):
    ox0, oy0, ox1, oy1 = o.bounds; x0, y0, x1, y1 = c.bounds
    return ox0 < x0 and oy0 < y0 and ox1 > x1 and oy1 > y1 and (ox1-ox0) > (x1-x0)

def glyph(height, w, cedil=False, scale=1.0):
    W_est = (height + 2 * OVERSHOOT) * RATIO
    cx = LSB + W_est / 2
    p, W, a, cy = ring(height, w, cx)
    if cedil:
        p = pathops.op(p, cedilla(cx, w, scale), pathops.PathOp.UNION)
    else:
        p.simplify()
    p = fix_direction(p)
    right = max(x for x, y in p.points) if False else p.bounds[2]
    adv = round(right + LSB * 0.55)
    return p, adv

def to_charstring(p, adv):
    pen = T2CharStringPen(adv, None)
    p.draw(pen)
    return pen.getCharString()

def build(style, wC, wc, wclass, family='ConstanciaC', psfamily='ConstanciaC', path=None):
    order = ['.notdef', 'space', 'C', 'c', 'Ccedilla', 'ccedilla']
    gC, aC = glyph(CAP, wC)
    gc, ac = glyph(XH, wc)
    gCc, _ = glyph(CAP, wC, cedil=True, scale=1.0)
    gcc, _ = glyph(XH, wc, cedil=True, scale=0.85)
    # .notdef: retângulo vazado
    nd = pathops.Path()
    nd.moveTo(50, 0); nd.lineTo(450, 0); nd.lineTo(450, CAP); nd.lineTo(50, CAP); nd.close()
    nd.moveTo(100, 50); nd.lineTo(100, CAP - 50); nd.lineTo(400, CAP - 50); nd.lineTo(400, 50); nd.close()
    sp = T2CharStringPen(250, None)
    charstrings = {
        '.notdef': to_charstring(nd, 500), 'space': sp.getCharString(),
        'C': to_charstring(gC, aC), 'c': to_charstring(gc, ac),
        'Ccedilla': to_charstring(gCc, aC), 'ccedilla': to_charstring(gcc, ac),
    }
    paths = {'.notdef': nd, 'C': gC, 'c': gc, 'Ccedilla': gCc, 'ccedilla': gcc}
    advs = {'.notdef': 500, 'space': 250, 'C': aC, 'c': ac, 'Ccedilla': aC, 'ccedilla': ac}
    metrics = {n: (advs[n], round(paths[n].bounds[0]) if n in paths else 0) for n in order}
    fb = FontBuilder(UPM, isTTF=False)
    fb.setupGlyphOrder(order)
    fb.setupCharacterMap({0x20: 'space', 0x43: 'C', 0x63: 'c', 0xC7: 'Ccedilla', 0xE7: 'ccedilla'})
    ps = f'{psfamily}-{style}'
    fb.setupCFF(ps, {'FullName': f'{family} {style}', 'FamilyName': family, 'Weight': style}, charstrings, {})
    fb.setupHorizontalMetrics(metrics)
    fb.setupHorizontalHeader(ascent=ASC, descent=DESC)
    is_regular = style == 'Regular'
    fb.setupNameTable({
        'familyName': family if style in ('Regular', 'Bold') else f'{family} {style}',
        'styleName': style if style in ('Regular', 'Bold') else 'Regular',
        'uniqueFontIdentifier': f'{ps};1.000',
        'fullName': f'{family} {style}',
        'psName': ps,
        'version': 'Version 1.000',
        'typographicFamily': family,
        'typographicSubfamily': style,
        'copyright': 'C-anel glyphs for the Controlle app',
    })
    fs = 0x40 if is_regular else (0x20 if style == 'Bold' else 0x40)
    fb.setupOS2(sTypoAscender=ASC, sTypoDescender=DESC, sTypoLineGap=0,
                usWinAscent=ASC, usWinDescent=-DESC, sxHeight=XH, sCapHeight=CAP,
                usWeightClass=wclass, fsSelection=fs | 0x80, version=4, achVendID='CTRL',
                ulUnicodeRange1=0b11)  # Basic Latin + Latin-1 Supplement
    fb.setupPost()
    fb.font['head'].macStyle = 1 if style == 'Bold' else 0
    fb.save(path)
    return aC, ac

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for style, (wC, wc, wclass) in WEIGHTS.items():
        aC, ac = build(style, wC, wc, wclass, path=f'{OUT}/ConstanciaC-{style}.otf')
        print(style, 'C adv', aC, 'c adv', ac)
