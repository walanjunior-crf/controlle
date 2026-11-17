import type { DayKey } from './types'

/** Como o desafio pontua: 1 ponto por dia com check-in, ou 1 ponto por check-in. */
export type Scoring = 'days' | 'checkins'

export interface ScoreRow {
  user_id: string
  points: number
  /** dias diferentes com check-in */
  days: number
  checkins: number
  /** dias seguidos com check-in até hoje (ou até ontem, se hoje ainda não teve) */
  streak: number
  today: boolean
  /** posição, com empate dividindo a mesma posição (1, 1, 3…) */
  rank: number
}

const prevDay = (d: DayKey): DayKey => {
  const [y, m, n] = d.split('-').map(Number)
  const t = new Date(y, m - 1, n - 1)
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
}

/** Sequência atual: conta para trás a partir de hoje; se hoje ainda está vazio, a partir de ontem. */
export function currentStreak(days: Set<DayKey>, today: DayKey): number {
  let d = days.has(today) ? today : prevDay(today)
  let n = 0
  while (days.has(d)) {
    n++
    d = prevDay(d)
  }
  return n
}

/**
 * Placar do desafio a partir dos check-ins (só os que caem dentro do período).
 * Ordem: pontos, depois sequência, depois quem tem mais dias.
 */
export function scoreBoard(
  members: string[],
  checkins: Array<{ user_id: string; day: DayKey }>,
  scoring: Scoring,
  period: { start: DayKey; end: DayKey },
  today: DayKey,
): ScoreRow[] {
  const byUser = new Map<string, { days: Set<DayKey>; n: number }>()
  for (const u of members) byUser.set(u, { days: new Set(), n: 0 })
  for (const k of checkins) {
    if (k.day < period.start || k.day > period.end) continue
    const row = byUser.get(k.user_id)
    if (!row) continue
    row.days.add(k.day)
    row.n++
  }
  const last = today > period.end ? period.end : today
  const rows = [...byUser].map(([user_id, r]) => ({
    user_id,
    days: r.days.size,
    checkins: r.n,
    points: scoring === 'days' ? r.days.size : r.n,
    streak: currentStreak(r.days, last),
    today: r.days.has(today),
    rank: 0,
  }))
  rows.sort((a, b) => b.points - a.points || b.streak - a.streak || b.days - a.days)
  rows.forEach((r, i) => {
    r.rank = i > 0 && rows[i - 1].points === r.points ? rows[i - 1].rank : i + 1
  })
  return rows
}

export const scoringLabel = (s: Scoring) => (s === 'days' ? '1 ponto por dia ativo' : '1 ponto por check-in')
export const pointsWord = (n: number) => (n === 1 ? 'ponto' : 'pontos')
