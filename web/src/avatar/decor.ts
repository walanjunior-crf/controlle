import { cut, cutEllipse, layer } from './paper'

/**
 * Assinatura do fundo no traço papel: um "sol" recortado num tom mais claro do
 * fundo e uma faixa de colina atrás do corpo. Discreto, igual para todos.
 */
export function BACKGROUND_DECOR(bg: string, adjust: (h: string, dl: number, c?: number) => string, _mix: unknown): string {
  return (
    layer(cutEllipse(80, 20, 22, 21, 'bg-sun'), adjust(bg, 0.06, 0.92), { lift: 0.7, edge: false }) +
    layer(cut([[-6, 74], [18, 66], [42, 70], [66, 63], [90, 68], [108, 64], [108, 108], [-6, 108]], 'bg-hill', 0.4), adjust(bg, -0.05, 1.02), { lift: 0.7, edge: false })
  )
}
