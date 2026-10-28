import type { DailyValue, DayKey } from '../../domain'

/**
 * Intensidade do mapa de calor (0–1) de um dia: a fração cumprida, só para dias ativos
 * até hoje. A cor sai do CSS: color-mix(var(--heat) <f>, var(--green-100)).
 */
export function heatFraction(cell: DailyValue, today: DayKey): number {
  return cell.isActive && cell.day <= today ? Math.max(0, Math.min(1, cell.fraction)) : 0
}
