import { describe, expect, it } from 'vitest'
import { goalOn, isActiveOn } from '../goals'
import { aggregate, dayProgress, overallProgress, periodProgress } from '../progress'
import { at, entry, goal, OPTS, rest, snap, tracker, ts } from './helpers'

const T = '2026-10-27' // terça

describe('aggregate', () => {
  const t = tracker()
  const e = (v: number, h: number) => entry(t.id, at(T, h), v)

  it('vazio → null', () => {
    for (const k of ['binary', 'counter', 'numeric', 'duration', 'scale'] as const) {
      expect(aggregate([], k, 'sum')).toBeNull()
    }
  })
  it('binary → 1', () => expect(aggregate([e(1, 8), e(1, 9)], 'binary', 'sum')).toBe(1))
  it('counter/duration → soma', () => {
    expect(aggregate([e(250, 8), e(250, 9), e(500, 10)], 'counter', 'sum')).toBe(1000)
    expect(aggregate([e(5, 8), e(10, 9)], 'duration', 'sum')).toBe(15)
  })
  it('numeric sum / last (maior timestamp, não ordem do array)', () => {
    const list = [e(70.2, 20), e(71, 7), e(70.5, 9)]
    expect(aggregate(list, 'numeric', 'sum')).toBeCloseTo(211.7)
    expect(aggregate(list, 'numeric', 'last')).toBe(70.2)
  })
  it('scale → média', () => expect(aggregate([e(3, 8), e(4, 12), e(5, 20)], 'scale', 'sum')).toBe(4))
})

describe('goalOn (metas versionadas)', () => {
  const goals = [
    goal('x', { target: 1000, effectiveFrom: '2026-01-01' }),
    goal('x', { target: 2500, effectiveFrom: '2026-10-20' }),
    goal('x', { target: 2000, effectiveFrom: '2026-06-01' }),
  ]
  it('maior effectiveFrom <= dia', () => {
    expect(goalOn(goals, '2025-12-31')).toBeUndefined()
    expect(goalOn(goals, '2026-01-01')?.target).toBe(1000)
    expect(goalOn(goals, '2026-07-15')?.target).toBe(2000)
    expect(goalOn(goals, '2026-10-19')?.target).toBe(2000)
    expect(goalOn(goals, '2026-10-20')?.target).toBe(2500)
  })
  it('o passado não muda ao trocar a meta', () => {
    const s = snap({ kind: 'counter', unit: 'ml' }, [
      { target: 1000, effectiveFrom: '2026-01-01' },
      { target: 2500, effectiveFrom: '2026-10-20' },
    ], [['2026-10-19', 9, 1500], ['2026-10-20', 9, 1500]])
    expect(dayProgress(s, [], '2026-10-19', OPTS).isMet).toBe(true)
    expect(dayProgress(s, [], '2026-10-20', OPTS).isMet).toBe(false)
    expect(dayProgress(s, [], '2026-10-20', OPTS).target).toBe(2500)
  })
})

describe('isActiveOn', () => {
  const t = tracker({ createdAt: ts(2026, 10, 20, 2) }) // 02:00 com virada 4h → dia 19
  const g = goal(t.id)
  it('sem meta = inativo', () => expect(isActiveOn(t, undefined, T, 4)).toBe(false))
  it('criado depois do dia = inativo (respeita a virada)', () => {
    expect(isActiveOn(t, g, '2026-10-18', 4)).toBe(false)
    expect(isActiveOn(t, g, '2026-10-19', 4)).toBe(true)
    expect(isActiveOn(t, g, '2026-10-19', 0)).toBe(false)
  })
  it('weekdays: vazio = todos; lista restringe', () => {
    const seg = goal(t.id, { weekdays: [1, 3, 5] })
    expect(isActiveOn(t, seg, '2026-10-26', 4)).toBe(true) // segunda
    expect(isActiveOn(t, seg, T, 4)).toBe(false) // terça
  })
  it('arquivado = inativo', () => expect(isActiveOn({ ...t, archived: true }, g, T, 4)).toBe(false))
})

describe('dayProgress', () => {
  it('binary: pendente e feito', () => {
    const s = snap({}, {}, [[T, 9]])
    const p = dayProgress(s, [], T, OPTS)
    expect(p).toMatchObject({ value: 1, fraction: 1, isActive: true, isMet: true, entryCount: 1, target: 1, period: 'day' })
    const p2 = dayProgress(s, [], '2026-10-26', OPTS)
    expect(p2).toMatchObject({ value: null, fraction: 0, isMet: false, isActive: true, entryCount: 0 })
  })

  it('registro de madrugada conta no dia anterior', () => {
    const t = tracker()
    const s = { tracker: t, goals: [goal(t.id)], entries: [entry(t.id, ts(2026, 10, 28, 1, 30))] }
    expect(dayProgress(s, [], T, OPTS).isMet).toBe(true)
    expect(dayProgress(s, [], '2026-10-28', OPTS).isMet).toBe(false)
  })

  it('counter atLeast: fração parcial e limitada a 1', () => {
    const s = snap({ kind: 'counter', unit: 'ml' }, { target: 2000 }, [[T, 9, 250], [T, 10, 250]])
    expect(dayProgress(s, [], T, OPTS)).toMatchObject({ value: 500, fraction: 0.25, isMet: false })
    const s2 = snap({ kind: 'counter', unit: 'ml' }, { target: 2000 }, [[T, 9, 2500]])
    expect(dayProgress(s2, [], T, OPTS)).toMatchObject({ fraction: 1, isMet: true })
  })

  it('atMost: sem registro conta 0 (cumprido); acima do alvo decai', () => {
    const g = { target: 2, comparison: 'atMost' as const }
    const empty = snap({ kind: 'counter', unit: 'cafés' }, g)
    expect(dayProgress(empty, [], T, OPTS)).toMatchObject({ value: null, fraction: 1, isMet: true })
    const ok = snap({ kind: 'counter', unit: 'cafés' }, g, [[T, 9, 2]])
    expect(dayProgress(ok, [], T, OPTS)).toMatchObject({ fraction: 1, isMet: true })
    const over = snap({ kind: 'counter', unit: 'cafés' }, g, [[T, 9, 3]])
    expect(dayProgress(over, [], T, OPTS)).toMatchObject({ fraction: 0.5, isMet: false })
    const wayOver = snap({ kind: 'counter', unit: 'cafés' }, g, [[T, 9, 10]])
    expect(dayProgress(wayOver, [], T, OPTS).fraction).toBe(0)
  })

  it('exactly: tolerância e fração', () => {
    const g = { target: 3, comparison: 'exactly' as const }
    const under = snap({ kind: 'counter' }, g, [[T, 9, 2]])
    expect(dayProgress(under, [], T, OPTS).fraction).toBeCloseTo(2 / 3)
    expect(dayProgress(under, [], T, OPTS).isMet).toBe(false)
    const exact = snap({ kind: 'numeric' }, g, [[T, 9, 1.1], [T, 10, 1.9]])
    expect(dayProgress(exact, [], T, OPTS)).toMatchObject({ fraction: 1, isMet: true })
    const over = snap({ kind: 'counter' }, g, [[T, 9, 4]])
    expect(dayProgress(over, [], T, OPTS)).toMatchObject({ fraction: 0, isMet: false })
  })

  it('scale usa média; numeric last usa o último', () => {
    const mood = snap({ kind: 'scale' }, { target: 3 }, [[T, 9, 2], [T, 20, 3]])
    expect(dayProgress(mood, [], T, OPTS)).toMatchObject({ value: 2.5, isMet: false })
    const sleep = snap({ kind: 'numeric', numericAggregation: 'last' }, { target: 7 }, [[T, 7, 5], [T, 9, 7.5]])
    expect(dayProgress(sleep, [], T, OPTS)).toMatchObject({ value: 7.5, isMet: true })
  })

  it('dia de weekday inativo não é cumprido mesmo com registro', () => {
    const s = snap({}, { weekdays: [1] }, [[T, 9]])
    expect(dayProgress(s, [], T, OPTS)).toMatchObject({ isActive: false, isMet: false, value: 1 })
  })

  it('folga geral e do tracker', () => {
    const s = snap({ id: 'agua' }, {}, [])
    expect(dayProgress(s, [rest(T)], T, OPTS)).toMatchObject({ isRest: true, isActive: false, isMet: false })
    expect(dayProgress(s, [rest(T, 'agua')], T, OPTS)).toMatchObject({ isRest: true, isActive: false })
    expect(dayProgress(s, [rest(T, 'outro')], T, OPTS)).toMatchObject({ isRest: false, isActive: true })
  })

  it('arquivado e criado depois → inativo', () => {
    expect(dayProgress(snap({ archived: true }, {}, [[T, 9]]), [], T, OPTS).isActive).toBe(false)
    expect(dayProgress(snap({ createdAt: ts(2026, 10, 28, 9) }), [], T, OPTS).isActive).toBe(false)
  })

  it('sem meta → inativo, campos de meta null', () => {
    const s = snap({}, { effectiveFrom: '2027-01-01' })
    expect(dayProgress(s, [], T, OPTS)).toMatchObject({ isActive: false, target: null, comparison: null, period: null })
  })
})

describe('meta semanal', () => {
  // treino 4x/semana; semana seg 26/10 .. dom 01/11
  const workout = snap({ id: 'w' }, { target: 4, period: 'week' }, [
    ['2026-10-26', 7],
    ['2026-10-26', 19], // mesmo dia não conta 2x
    ['2026-10-28', 7],
    ['2026-10-29', 7],
    ['2026-10-31', 7],
  ])

  it('periodProgress binary conta dias distintos', () => {
    const p = periodProgress(workout, '2026-10-27', OPTS)!
    expect(p).toMatchObject({ start: '2026-10-26', end: '2026-11-01', value: 4, target: 4, fraction: 1, isMet: true })
  })

  it('dayProgress: fração e isMet da semana até o dia', () => {
    expect(dayProgress(workout, [], '2026-10-26', OPTS)).toMatchObject({ fraction: 0.25, isMet: false, value: 1 })
    expect(dayProgress(workout, [], '2026-10-29', OPTS)).toMatchObject({ fraction: 0.75, isMet: false })
    expect(dayProgress(workout, [], '2026-10-31', OPTS)).toMatchObject({ fraction: 1, isMet: true })
    expect(dayProgress(workout, [], '2026-11-01', OPTS)).toMatchObject({ fraction: 1, isMet: true, value: null })
  })

  it('weekStartsOn 0 muda a janela', () => {
    const p = periodProgress(workout, '2026-11-01', { ...OPTS, weekStartsOn: 0 })!
    expect(p).toMatchObject({ start: '2026-11-01', end: '2026-11-07', value: 0, isMet: false })
  })

  it('soma semanal de duração', () => {
    const s = snap({ kind: 'duration', unit: 'min' }, { target: 150, period: 'week' }, [
      ['2026-10-26', 7, 30],
      ['2026-10-27', 7, 45],
    ])
    expect(periodProgress(s, '2026-10-30', OPTS)).toMatchObject({ value: 75, fraction: 0.5, isMet: false })
  })

  it('meta diária: periodProgress é o próprio dia; sem meta → null', () => {
    const s = snap({ kind: 'counter' }, { target: 4 }, [[T, 9, 2]])
    expect(periodProgress(s, T, OPTS)).toMatchObject({ start: T, end: T, value: 2, fraction: 0.5 })
    expect(periodProgress(snap({}, { effectiveFrom: '2027-01-01' }), T, OPTS)).toBeNull()
  })
})

describe('overallProgress', () => {
  const pill = snap({ id: 'p' }, {}, [[T, 8]])
  const water = snap({ id: 'a', kind: 'counter', unit: 'ml' }, { target: 2000 }, [[T, 9, 1000]])

  it('fração média e complete', () => {
    const o = overallProgress([pill, water], [], T, OPTS)
    expect(o).toMatchObject({ active: 2, met: 1, fraction: 0.75, complete: false })
    const o2 = overallProgress([pill], [], T, OPTS)
    expect(o2).toMatchObject({ active: 1, met: 1, fraction: 1, complete: true })
  })

  it('folga e inativos fora do denominador', () => {
    expect(overallProgress([pill, water], [rest(T, 'a')], T, OPTS)).toMatchObject({ active: 1, complete: true })
    expect(overallProgress([pill, water], [rest(T)], T, OPTS)).toMatchObject({ active: 0, complete: false, fraction: 0 })
    expect(overallProgress([], [], T, OPTS)).toMatchObject({ active: 0, complete: false })
  })

  it('tracker semanal: cumprido no dia se registrou OU semana já cumprida', () => {
    const w = snap({ id: 'w' }, { target: 4, period: 'week' }, [['2026-10-26', 7], ['2026-10-28', 7]])
    // segunda: pílula não feita, treino registrado → só o treino conta
    expect(overallProgress([pill, w], [], '2026-10-26', OPTS)).toMatchObject({ active: 2, met: 1 })
    // terça: pílula feita, treino não registrado e semana 1/4 → incompleto
    expect(overallProgress([pill, w], [], T, OPTS)).toMatchObject({ active: 2, met: 1, complete: false })
    // quarta: registrou treino → conta como cumprido
    const pillWed = snap({ id: 'p2' }, {}, [['2026-10-28', 8]])
    expect(overallProgress([pillWed, w], [], '2026-10-28', OPTS)).toMatchObject({ met: 2, complete: true })
    // semana já cumprida → dias seguintes contam mesmo sem registro
    const full = snap({ id: 'w2' }, { target: 2, period: 'week' }, [['2026-10-26', 7], ['2026-10-27', 7]])
    expect(overallProgress([full], [], '2026-10-29', OPTS).complete).toBe(true)
  })
})
