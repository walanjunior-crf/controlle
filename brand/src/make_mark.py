"""Gera logo, ícones do app, favicon e wordmark a partir de mark.py (opção B)
e copia para web/public. Uso: python3 make_mark.py
"""
import os, shutil, cairosvg
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from mark import body, bounds

HERE = os.path.dirname(os.path.abspath(__file__))
BRAND = os.path.normpath(os.path.join(HERE, '..'))
PUB = os.path.normpath(os.path.join(HERE, '..', '..', 'web', 'public'))
PREV = os.path.join(BRAND, 'previews')
G500, G_DARK, WHITE, INK = '#336633', '#5FA35F', '#FFFFFF', '#1C1C1E'
for d in (PREV, f'{PUB}/icons', f'{PUB}/brand'):
    os.makedirs(d, exist_ok=True)

x0, y0, x1, y1 = bounds()
MW, MH = x1 - x0, y1 - y0
MCX, MCY = (x0 + x1) / 2, (y0 + y1) / 2


def placed(size, width_frac, fg, dot=None):
    """Marca centrada num quadrado `size`, ocupando `width_frac` da largura."""
    s = size * width_frac / MW
    return (f'<g transform="translate({size/2:.2f} {size/2:.2f}) scale({s:.4f}) '
            f'translate({-MCX:.2f} {-MCY:.2f})">{body(fg, dot)}</g>')


def svg(size, inner, bg=None, extra=''):
    rect = f'<rect width="{size}" height="{size}" fill="{bg}"/>' if bg else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" '
            f'viewBox="0 0 {size} {size}">{extra}{rect}{inner}</svg>\n')


def png(svg_text, path, size):
    cairosvg.svg2png(bytestring=svg_text.encode(), write_to=path, output_width=size, output_height=size)


def write(path, text):
    with open(path, 'w') as f:
        f.write(text)


# --- Logo (mantém os nomes de arquivo usados pelo app) -----------------------------
logo = svg(512, placed(512, 0.86, G500))
logo_white = svg(512, placed(512, 0.86, WHITE))
write(f'{BRAND}/logo-c-ring.svg', logo)
write(f'{BRAND}/logo-c-ring-white.svg', logo_white)

# --- Ícone do app: marca branca sobre verde, ~58% da largura ------------------------
icon = svg(1024, placed(1024, 0.58, WHITE), bg=G500)
write(f'{BRAND}/app-icon.svg', icon)
write(f'{BRAND}/app-icon-dark.svg', svg(1024, placed(1024, 0.58, G_DARK)))
write(f'{BRAND}/app-icon-tinted.svg', svg(1024, placed(1024, 0.58, WHITE), bg='#000000'))
png(icon, f'{PUB}/icons/apple-touch-icon.png', 180)
png(icon, f'{PUB}/icons/icon-192.png', 192)
png(icon, f'{PUB}/icons/icon-512.png', 512)
# maskable: tudo dentro do círculo seguro (80% do lado)
png(svg(1024, placed(1024, 0.52, WHITE), bg=G500), f'{PUB}/icons/icon-maskable-512.png', 512)

# --- Favicon: verde, troca de cor no modo escuro -----------------------------------
style = '<style>path{stroke:#336633}circle{fill:#336633}@media (prefers-color-scheme:dark){path{stroke:#5FA35F}circle{fill:#5FA35F}}</style>'
fav = svg(32, placed(32, 0.98, G500), extra=style)
write(f'{PUB}/favicon.svg', fav)
write(f'{PUB}/icons/favicon.svg', fav)
png(svg(32, placed(32, 0.98, G500)), f'{PUB}/icons/favicon-32.png', 32)

# --- Wordmark: a marca + "ontrolle" em Nunito Bold (contornos) ---------------------
def wordmark(ink, green, name, weight=760):
    nun = instantiateVariableFont(TTFont(f'{HERE}/Nunito-VF.ttf'), {'wght': weight})
    gs, cmap = nun.getGlyphSet(), nun.getBestCmap()
    BASE, CAP, OVER = 950, 705, 10
    s = (CAP + 2 * OVER) / (2 * 28 + 18)          # altura do C da marca = altura das maiúsculas
    tx, ty = -x0 * s, BASE + OVER - y1 * s
    parts = [f'<g transform="translate({tx:.1f} {ty:.1f}) scale({s:.4f})">{body(green)}</g>']
    x = MW * s + 70
    for ch in 'ontrolle':
        g = cmap[ord(ch)]
        pen = SVGPathPen(gs)
        gs[g].draw(TransformPen(pen, (1, 0, 0, -1, x, BASE)))
        parts.append(f'<path fill="{ink}" d="{pen.getCommands()}"/>')
        x += nun['hmtx'][g][0] + 8
    width = x - 8
    pad, top, bottom = 40, BASE - 780, BASE + 20
    vb = f'{-pad} {top - pad} {width + 2 * pad:.0f} {bottom - top + 2 * pad}'
    write(f'{BRAND}/{name}',
          f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="{(width + 2*pad)/4:.0f}" '
          f'height="{(bottom - top + 2*pad)/4:.0f}" role="img" aria-label="Controlle"><title>Controlle</title>'
          + ''.join(parts) + '</svg>\n')

wordmark(INK, G500, 'wordmark.svg')
wordmark(WHITE, G_DARK, 'wordmark-dark.svg')

for n in ('logo-c-ring.svg', 'logo-c-ring-white.svg', 'wordmark.svg', 'wordmark-dark.svg'):
    shutil.copy(f'{BRAND}/{n}', f'{PUB}/brand/{n}')

# --- Prévias -----------------------------------------------------------------------
png(logo, f'{PREV}/logo-c-ring.png', 512)
png(icon, f'{PREV}/app-icon.png', 512)
cairosvg.svg2png(url=f'{BRAND}/wordmark.svg', write_to=f'{PREV}/wordmark.png', output_width=1200)
cairosvg.svg2png(url=f'{BRAND}/wordmark-dark.svg', write_to=f'{PREV}/wordmark-dark.png', output_width=1200,
                 background_color='#0F1A0F')
print('ok', PUB)
