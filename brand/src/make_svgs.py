import cairosvg
from geometry import c_ring_path
OUT = '/home/claude/Constancia/Brand'
G500 = '#336633'

def svg(w, h, body, bg=None):
    rect = f'<rect width="{w}" height="{h}" fill="{bg}"/>' if bg else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">'
            f'{rect}{body}</svg>\n')

# Logo: 512 viewBox, margem ~ 6%
logo_d = c_ring_path(256, 256, 448)
open(f'{OUT}/logo-c-ring.svg', 'w').write(svg(512, 512, f'<path fill="{G500}" d="{logo_d}"/>'))
open(f'{OUT}/logo-c-ring-white.svg', 'w').write(svg(512, 512, f'<path fill="#FFFFFF" d="{logo_d}"/>'))
open(f'{OUT}/logo-c-ring-closed.svg', 'w').write(svg(512, 512, f'<path fill="{G500}" fill-rule="evenodd" d="{c_ring_path(256,256,448,closed=True)}"/>'))

# Ícone 1024: anel com ~56% da largura, centralizado (zona segura do iOS)
ICON_D = 576
icon_d = c_ring_path(512, 512, ICON_D)
open(f'{OUT}/app-icon.svg', 'w').write(svg(1024, 1024, f'<path fill="#FFFFFF" d="{icon_d}"/>', bg=G500))
# Variantes iOS 18
open(f'{OUT}/app-icon-dark.svg', 'w').write(svg(1024, 1024, f'<path fill="#5FA35F" d="{icon_d}"/>'))  # fundo transparente
open(f'{OUT}/app-icon-tinted.svg', 'w').write(svg(1024, 1024, f'<path fill="#FFFFFF" d="{icon_d}"/>', bg='#000000'))
