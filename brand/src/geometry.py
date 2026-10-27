"""Geometria compartilhada do C-anel (logo, ícone, wordmark).

Anel circular de diâmetro externo D, traço t = 0.24*D, abertura de GAP graus
centrada em 0° (direita), medida na linha central; pontas redondas.
"""
import math

THICKNESS = 0.24   # fração do diâmetro externo
GAP_DEG = 64.0     # abertura na linha central

def c_ring_path(cx, cy, D, thickness=THICKNESS, gap=GAP_DEG, closed=False):
    """Contorno preenchido (SVG d) do C-anel. y para baixo (SVG)."""
    w = thickness * D
    R = D / 2            # raio externo
    r = R - w            # raio interno
    rc = R - w / 2       # raio da linha central
    if closed:
        return (f"M{cx+R:.3f} {cy:.3f} A{R:.3f} {R:.3f} 0 1 0 {cx-R:.3f} {cy:.3f} "
                f"A{R:.3f} {R:.3f} 0 1 0 {cx+R:.3f} {cy:.3f} Z "
                f"M{cx+r:.3f} {cy:.3f} A{r:.3f} {r:.3f} 0 1 1 {cx-r:.3f} {cy:.3f} "
                f"A{r:.3f} {r:.3f} 0 1 1 {cx+r:.3f} {cy:.3f} Z")
    a = math.radians(gap / 2)
    ca, sa = math.cos(a), math.sin(a)
    # ponta superior (ângulo +a, acima do eixo => y menor)
    ox0, oy0 = cx + R * ca, cy - R * sa
    ox1, oy1 = cx + R * ca, cy + R * sa
    ix1, iy1 = cx + r * ca, cy + r * sa
    ix0, iy0 = cx + r * ca, cy - r * sa
    h = w / 2
    return (f"M{ox0:.3f} {oy0:.3f} "
            f"A{R:.3f} {R:.3f} 0 1 0 {ox1:.3f} {oy1:.3f} "      # arco externo, anti-horário na tela
            f"A{h:.3f} {h:.3f} 0 0 0 {ix1:.3f} {iy1:.3f} "      # ponta redonda inferior
            f"A{r:.3f} {r:.3f} 0 1 1 {ix0:.3f} {iy0:.3f} "      # arco interno de volta
            f"A{h:.3f} {h:.3f} 0 0 0 {ox0:.3f} {oy0:.3f} Z")    # ponta redonda superior
