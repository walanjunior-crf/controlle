/**
 * Objetos na mão (coleção de hábitos, v0.5). Sistema local: origem (0,0) no centro
 * da pata que segura, y negativo para cima. O objeto fica de pé mesmo quando o braço
 * gira (o motor desfaz a rotação) e a pata é desenhada por cima, "segurando".
 * Caixa útil: x de -9 a 9, y de -18 a 5 (o balão pode subir mais, até -34).
 * Use layer()/cut*() como as outras peças: o estilo (chapado/pelúcia/papel) vem de graça.
 */
import { ramp } from '../color'
import { cut, cutEllipse, layer } from '../paper'
import type { Ctx } from '../types'

export const HELD: Record<string, (x: Ctx) => string> = {
  nenhum: () => '',
  // referência: garrafinha d'água (corpo, tampa e rótulo)
  garrafa: () => {
    const body = ramp('#7FC8E8')
    return (
      layer(cut([[-4.6, 3.5], [-4.8, -9], [-3.2, -12], [3.2, -12], [4.8, -9], [4.6, 3.5]], 'held-garrafa', 0.2), body.base) +
      layer(cut([[-4.7, -5.5], [4.7, -5.5], [4.7, -1], [-4.7, -1]], 'held-garrafa-rot', 0.15), '#FFFFFF', { lift: 0.3 }) +
      layer(cutEllipse(0, -13.4, 2.8, 2, 'held-garrafa-tampa'), '#2F7F7A', { lift: 0.4 })
    )
  },
}
