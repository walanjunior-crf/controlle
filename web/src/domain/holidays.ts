import type { DayKey } from './types'

// Feriados nacionais do Brasil e algumas datas comemorativas, calculados no próprio
// aparelho (sem internet). Feriados estaduais e municipais não entram: variam de cidade
// para cidade, e quem precisar deles pode criar como compromisso.

export type HolidayKind = 'feriado' | 'facultativo' | 'data'

export interface Holiday {
  day: DayKey
  name: string
  kind: HolidayKind
}

const pad = (n: number) => String(n).padStart(2, '0')

/** Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher), como [mês 1-12, dia]. */
export function easterSunday(year: number): [number, number] {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return [month, day]
}

/** Soma dias a uma data civil sem depender de fuso (usa UTC ao meio-dia). */
function shift(year: number, month: number, day: number, n: number): DayKey {
  const d = new Date(Date.UTC(year, month - 1, day + n, 12))
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

/** n-ésimo domingo do mês (n ≥ 1). */
function nthSunday(year: number, month: number, n: number): DayKey {
  const first = new Date(Date.UTC(year, month - 1, 1, 12)).getUTCDay()
  const day = 1 + ((7 - first) % 7) + (n - 1) * 7
  return `${year}-${pad(month)}-${pad(day)}`
}

const cache = new Map<number, Holiday[]>()

/** Feriados e datas do ano, em ordem de data. */
export function holidaysOfYear(year: number): Holiday[] {
  const hit = cache.get(year)
  if (hit) return hit
  const [em, ed] = easterSunday(year)
  const fixed = (m: number, d: number) => `${year}-${pad(m)}-${pad(d)}`
  const list: Holiday[] = [
    { day: fixed(1, 1), name: 'Confraternização Universal', kind: 'feriado' },
    { day: shift(year, em, ed, -48), name: 'Carnaval', kind: 'facultativo' },
    { day: shift(year, em, ed, -47), name: 'Carnaval', kind: 'facultativo' },
    { day: shift(year, em, ed, -2), name: 'Sexta-feira Santa', kind: 'feriado' },
    { day: shift(year, em, ed, 0), name: 'Páscoa', kind: 'data' },
    { day: fixed(4, 21), name: 'Tiradentes', kind: 'feriado' },
    { day: fixed(5, 1), name: 'Dia do Trabalho', kind: 'feriado' },
    { day: nthSunday(year, 5, 2), name: 'Dia das Mães', kind: 'data' },
    { day: shift(year, em, ed, 60), name: 'Corpus Christi', kind: 'facultativo' },
    { day: fixed(6, 12), name: 'Dia dos Namorados', kind: 'data' },
    { day: nthSunday(year, 8, 2), name: 'Dia dos Pais', kind: 'data' },
    { day: fixed(9, 7), name: 'Independência do Brasil', kind: 'feriado' },
    { day: fixed(10, 12), name: 'Nossa Senhora Aparecida', kind: 'feriado' },
    { day: fixed(11, 2), name: 'Finados', kind: 'feriado' },
    { day: fixed(11, 15), name: 'Proclamação da República', kind: 'feriado' },
    ...(year >= 2024 ? [{ day: fixed(11, 20), name: 'Consciência Negra', kind: 'feriado' as const }] : []),
    { day: fixed(12, 24), name: 'Véspera de Natal', kind: 'data' },
    { day: fixed(12, 25), name: 'Natal', kind: 'feriado' },
    { day: fixed(12, 31), name: 'Véspera de Ano Novo', kind: 'data' },
  ]
  list.sort((a, b) => a.day.localeCompare(b.day))
  cache.set(year, list)
  return list
}

/** Feriados/datas de um intervalo de dias de calendário, agrupados por dia. */
export function holidaysByDay(from: DayKey, to: DayKey): Map<DayKey, Holiday[]> {
  const out = new Map<DayKey, Holiday[]>()
  for (let y = Number(from.slice(0, 4)); y <= Number(to.slice(0, 4)); y++) {
    for (const h of holidaysOfYear(y)) {
      if (h.day < from || h.day > to) continue
      const list = out.get(h.day)
      if (list) list.push(h)
      else out.set(h.day, [h])
    }
  }
  return out
}
