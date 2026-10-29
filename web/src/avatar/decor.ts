import { cut, cutEllipse, layer, look, stroke } from './paper'

/**
 * Assinatura do fundo: um "sol" num tom mais claro do fundo e uma faixa de colina atrás
 * do corpo. Discreto, igual para todos.
 *  - chapado: círculo e colina sólidos, contraste baixo, sem sombra;
 *  - pelúcia: feltro costurado (anel de pontos no sol, pesponto na colina);
 *  - papel: recortes com sombra de papel.
 */
export function BACKGROUND_DECOR(bg: string, adjust: (h: string, dl: number, c?: number) => string, _mix: unknown): string {
  const hill = cut([[-6, 74], [18, 66], [42, 70], [66, 63], [90, 68], [108, 64], [108, 108], [-6, 108]], 'bg-hill', 0.4)
  if (look.style === 'chapado') {
    return layer(cutEllipse(80, 20, 21, 21, 'bg-sun'), adjust(bg, 0.045, 0.94), { shadow: false, edge: false }) + layer(hill, adjust(bg, -0.035, 1.02), { shadow: false, edge: false })
  }
  if (look.style === 'pelucia') {
    const stitch = (d: string, c: string) => stroke(d, c, 0.55, 'stroke-dasharray="1.6 1.3" stroke-opacity="0.8"')
    return (
      layer(cutEllipse(80, 20, 22, 21, 'bg-sun'), adjust(bg, 0.07, 0.92), { lift: 0.8, edge: false }) +
      stitch(cutEllipse(80, 20, 18.6, 17.8, 'bg-sun-seam'), adjust(bg, 0.17, 0.8)) +
      layer(hill, adjust(bg, -0.05, 1.02), { lift: 0.8, edge: false }) +
      stitch('M-4 78Q18 70 42 74T90 72T108 69', adjust(bg, 0.1, 0.9))
    )
  }
  return (
    layer(cutEllipse(80, 20, 22, 21, 'bg-sun'), adjust(bg, 0.06, 0.92), { lift: 0.7, edge: false }) +
    layer(hill, adjust(bg, -0.05, 1.02), { lift: 0.7, edge: false })
  )
}
