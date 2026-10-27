"""Marca do Controlle (opção B): um C cuja ponta de baixo vira um traço de "feito"
e se solta num ponto. Geometria em uma caixa de 100x100, desenhada com traço
(stroke) de pontas redondas. Usado por make_mark.py (logo, ícones, wordmark)
e espelhado em web/src/components/CLogo.tsx.
"""
import math

STROKE = 18.0           # espessura do traço
R = 28.0                # raio da linha central do C
CX, CY = 43.6, 50.0     # centro do C (deslocado para a marca inteira ficar centrada)
A_TOP, A_BOT = 80.0, 310.0   # o C vai da ponta de cima (80°) até embaixo à direita (310°), pela esquerda
TAIL = 11.0             # comprimento do traço de feito
DOT_GAP = 20.0          # distância do fim do traço até o centro do ponto
DOT_R = 8.0


def _pt(a):
    r = math.radians(a)
    return CX + R * math.cos(r), CY - R * math.sin(r)


def geometry():
    """Retorna (d do traço, (cx, cy) do ponto)."""
    x0, y0 = _pt(A_TOP)
    x1, y1 = _pt(A_BOT)
    tx, ty = -math.sin(math.radians(A_BOT)), -math.cos(math.radians(A_BOT))  # tangente no fim (tela, y para baixo)
    ex, ey = x1 + tx * TAIL, y1 + ty * TAIL
    d = f"M{x0:.2f} {y0:.2f} A{R} {R} 0 1 0 {x1:.2f} {y1:.2f} L{ex:.2f} {ey:.2f}"
    return d, (ex + tx * DOT_GAP, ey + ty * DOT_GAP)


def body(fg="currentColor", dot=None):
    """Elementos SVG da marca (sem <svg>), na caixa 0..100."""
    d, (dx, dy) = geometry()
    return (f'<path d="{d}" fill="none" stroke="{fg}" stroke-width="{STROKE}" '
            f'stroke-linecap="round" stroke-linejoin="round"/>'
            f'<circle cx="{dx:.2f}" cy="{dy:.2f}" r="{DOT_R}" fill="{dot or fg}"/>')


def bounds():
    """Caixa ocupada pela marca (x0, y0, x1, y1), considerando o traço."""
    d, (dx, dy) = geometry()
    h = STROKE / 2
    x0 = CX - R - h
    x1 = dx + DOT_R
    y0 = CY - R - h
    y1 = CY + R + h
    return x0, y0, x1, y1


if __name__ == "__main__":
    print(geometry(), bounds())
