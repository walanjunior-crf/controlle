"""Gera os assets web (PWA) em /home/claude/Controlle/web/public a partir das fontes da marca."""
import os, shutil, cairosvg
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools import subset
from geometry import c_ring_path
HERE = os.path.dirname(os.path.abspath(__file__))
BRAND = '/home/claude/Constancia/Brand'
FONTS = os.path.join(HERE, '..', 'fonts')
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

import make_mark  # logo, ícones, favicon e wordmark
print('ok')
