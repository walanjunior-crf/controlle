"""Gera os assets web (PWA) em /home/claude/Controlle/web/public a partir das fontes da marca."""
import os, shutil, cairosvg
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools import subset
from geometry import c_ring_path
HERE = os.path.dirname(os.path.abspath(__file__))
BRAND = '/home/claude/Constancia/Brand'
FONTS = '/home/claude/Constancia/Resources/Fonts'
PUB = '/home/claude/Controlle/web/public'
for d in ('fonts', 'icons', 'brand'):
    os.makedirs(f'{PUB}/{d}', exist_ok=True)

# --- Fontes: "Controlle C" woff2 ---------------------------------------------------
for style, w in (('Regular', 400), ('Semibold', 600), ('Bold', 700)):
    f = TTFont(f'{FONTS}/ConstanciaC-{style}.otf')
    ps = f'ControlleC-{style}'
    for rec in f['name'].names:
        s = rec.toUnicode()
        rec.string = s.replace('ConstanciaC-', 'ControlleC-').replace('ConstanciaC', 'Controlle C')
    f['CFF '].cff.fontNames = [ps]
    top = f['CFF '].cff.topDictIndex[0]
    top.FullName = f'Controlle C {style}'; top.FamilyName = 'Controlle C'
    f.flavor = 'woff2'
    f.save(f'{PUB}/fonts/controlle-c-{w}.woff2')

# Nunito variável (OFL), subset Latin básico + Latin-1 + pontuação comum, para uso offline
vf = TTFont(f'{HERE}/Nunito-VF.ttf')
opts = subset.Options(); opts.flavor = 'woff2'; opts.layout_features = ['*']; opts.name_IDs = ['*']
opts.notdef_outline = True
ss = subset.Subsetter(opts)
ss.populate(unicodes=list(range(0x20, 0x7F)) + list(range(0xA0, 0x100)) +
            [0x2013, 0x2014, 0x2018, 0x2019, 0x201C, 0x201D, 0x2022, 0x2026, 0x20AC, 0x2212, 0x00B7])
ss.subset(vf)
vf.flavor = 'woff2'
vf.save(f'{PUB}/fonts/nunito-latin-var.woff2')
shutil.copy(f'{HERE}/OFL-Nunito.txt', f'{PUB}/fonts/OFL-Nunito.txt') if os.path.exists(f'{HERE}/OFL-Nunito.txt') else None

# --- Ícones ------------------------------------------------------------------------
G500 = '#336633'
def icon_svg(size, ring_frac, bg=G500, fg='#FFFFFF'):
    c = size / 2
    d = c_ring_path(c, c, size * ring_frac)
    rect = f'<rect width="{size}" height="{size}" fill="{bg}"/>' if bg else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 {size} {size}">'
            f'{rect}<path fill="{fg}" d="{d}"/></svg>')

def png(svg, path, size):
    cairosvg.svg2png(bytestring=svg.encode(), write_to=path, output_width=size, output_height=size)

png(icon_svg(1024, 0.5625), f'{PUB}/icons/apple-touch-icon.png', 180)
png(icon_svg(1024, 0.5625), f'{PUB}/icons/icon-192.png', 192)
png(icon_svg(1024, 0.5625), f'{PUB}/icons/icon-512.png', 512)
png(icon_svg(1024, 0.60), f'{PUB}/icons/icon-maskable-512.png', 512)  # dentro do círculo seguro de 80%

# favicon.svg: anel verde, mais grosso p/ 16px, troca de cor no escuro
fav_d = c_ring_path(16, 16, 30, thickness=0.27)
fav = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">'
       '<style>path{fill:#336633}@media (prefers-color-scheme:dark){path{fill:#5FA35F}}</style>'
       f'<path d="{fav_d}"/></svg>\n')
open(f'{PUB}/favicon.svg', 'w').write(fav)
open(f'{PUB}/icons/favicon.svg', 'w').write(fav)
png(fav.replace('<style>path{fill:#336633}@media (prefers-color-scheme:dark){path{fill:#5FA35F}}</style>', '')
       .replace('<path d', '<path fill="#336633" d'), f'{PUB}/icons/favicon-32.png', 32)

# --- Brand -------------------------------------------------------------------------
for n in ('logo-c-ring.svg', 'logo-c-ring-white.svg', 'wordmark.svg', 'wordmark-dark.svg'):
    shutil.copy(f'{BRAND}/{n}', f'{PUB}/brand/{n}')
print('ok')
