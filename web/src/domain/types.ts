// Contrato do domínio do Controlle. Fonte da verdade para app, banco e testes.
// Datas de dia lógico são strings "YYYY-MM-DD" (DayKey) para evitar problemas de fuso.
// Timestamps de registros são epoch em milissegundos.

/** Como um tracker é medido. */
export type TrackerKind =
  | 'binary'   // feito / não feito (pílula, treino)
  | 'counter'  // soma incrementos (água: +250 ml)
  | 'numeric'  // valor livre com unidade (peso, páginas)
  | 'duration' // minutos (meditação)
  | 'scale'    // 1..5 (humor)

/** Para numeric: somar o período (páginas) ou usar o último valor (peso). */
export type NumericAggregation = 'sum' | 'last'

export type GoalComparison = 'atLeast' | 'atMost' | 'exactly'
export type GoalPeriod = 'day' | 'week'

/** 0 = domingo ... 6 = sábado (igual a Date.getDay). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

/** "YYYY-MM-DD" do dia lógico. */
export type DayKey = string

export type EntrySource = 'app' | 'quick' | 'import'

export interface Tracker {
  id: string
  name: string
  /** emoji (padrão) */
  icon: string
  /** token da paleta (ex.: "green-500") ou hex "#RRGGBB" */
  color: string
  kind: TrackerKind
  /** "ml", "copos", "kg", "min", "páginas"; vazio para binário */
  unit: string
  /** quanto um toque soma (counter); ignorado para binário */
  increment: number
  numericAggregation: NumericAggregation
  sortOrder: number
  archived: boolean
  /** epoch ms */
  createdAt: number
}

/** Meta versionada: mudar a meta cria nova versão com effectiveFrom; o passado não muda. */
export interface Goal {
  id: string
  trackerId: string
  target: number
  comparison: GoalComparison
  period: GoalPeriod
  /** dias ativos; vazio = todos */
  weekdays: Weekday[]
  /** primeiro dia lógico em que vale */
  effectiveFrom: DayKey
}

/** Evento imutável. Desfazer = apagar o evento. */
export interface Entry {
  id: string
  trackerId: string
  /** epoch ms */
  timestamp: number
  /** dia lógico calculado na gravação (com a virada vigente) — indexado */
  day: DayKey
  /** binário: 1; escala: 1..5; demais: o valor */
  value: number
  note?: string
  source: EntrySource
}

/** Folga: não quebra nem soma sequência. trackerId null = folga geral. */
export interface RestDay {
  id: string
  trackerId: string | null
  day: DayKey
}

/** Lembrete exibido no app (e, quando houver push, enviado). minutos desde 00:00. */
export interface Reminder {
  id: string
  trackerId: string
  minuteOfDay: number
  weekdays: Weekday[]
  enabled: boolean
}

export interface Settings {
  id: 'settings'
  name: string
  /** hora da virada do dia lógico, 0..6 (padrão 4) */
  dayStartHour: number
  /** 0 = semana começa no domingo, 1 = segunda */
  weekStartsOn: 0 | 1
  onboarded: boolean
  theme: 'system' | 'light' | 'dark'
}

export const DEFAULT_SETTINGS: Settings = {
  id: 'settings',
  name: '',
  dayStartHour: 4,
  weekStartsOn: 1,
  onboarded: false,
  theme: 'system',
}

/** Tudo de um tracker que o motor precisa. */
export interface TrackerSnapshot {
  tracker: Tracker
  goals: Goal[]
  entries: Entry[]
}
