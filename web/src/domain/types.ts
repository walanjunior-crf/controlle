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

// ---------------------------------------------------------------------------------
// Agenda (v0.2)

/** Repetição de um compromisso. */
export type EventRepeat = 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'yearly'

/**
 * Compromisso livre da agenda. Datas e horários são de calendário (não de dia lógico)
 * e "flutuantes": valem no fuso do aparelho.
 */
export interface CalendarEvent {
  id: string
  title: string
  notes?: string
  location?: string
  /** dia da primeira ocorrência, "YYYY-MM-DD" */
  date: DayKey
  allDay: boolean
  /** minutos desde 00:00 (ignorado se allDay) */
  startMinute: number
  /** minutos desde 00:00; pode passar de 1440 se terminar no dia seguinte */
  endMinute: number
  repeat: EventRepeat
  /** para repeat 'weekly': dias da semana (vazio = o dia da semana de `date`) */
  repeatWeekdays: Weekday[]
  /** última data em que repete (inclusiva) */
  repeatUntil?: DayKey
  /** ocorrências apagadas individualmente */
  exceptions: DayKey[]
  /** token da paleta ou "#RRGGBB" */
  color: string
  /** alerta antes do início, em minutos (null = sem alerta) */
  alertMinutes: number | null
  source: 'app' | 'import'
  /** UID do arquivo .ics de origem, para não duplicar ao importar de novo */
  importUid?: string
  createdAt: number
  updatedAt: number
}

// ---------------------------------------------------------------------------------
// Perfil (v0.2) — local por enquanto; pensado para os grupos no futuro

/** Avatar montado em camadas (v0.4). Todos os campos são ids do catálogo, menos as cores (#RRGGBB). */
/**
 * Avatar montado. Cores são `#RRGGBB`; o resto são ids do catálogo em
 * features/profile/avatarParts.ts. Configurações antigas (v0.4) só tinham parte
 * dos campos: `normalizeAvatar` completa o que faltar.
 */
export interface AvatarConfig {
  species: string
  /** raça (só vale para o cachorro) */
  breed: string
  fur: string
  coat: string
  eyes: string
  eyeColor: string
  brows: string
  mouth: string
  cheeks: string
  beard: string
  hair: string
  hairColor: string
  hat: string
  hatColor: string
  glasses: string
  glassesColor: string
  earrings: string
  piercing: string
  metal: string
  outfit: string
  outfitColor: string
  costume: string
  bg: string
  pattern: string
  /** jeito padrão do rosto: normal, sonolento ou enjoado */
  persona: string
  /** estilo do desenho: chapado (padrão), pelucia ou papel */
  style: string
  /** lado dos brincos e do piercing (como aparece na tela) */
  earringSide: string
  piercingSide: string
}

export type AvatarChoice =
  /** combinação pronta do avatar montado (motor v2) */
  | { kind: 'preset'; id: string }
  /** ícone estático (desenhos da v0.2), com cor de fundo opcional */
  | { kind: 'icon'; id: string; bg?: string }
  /** personagem montado pela pessoa, com itens liberados por nível e conquistas */
  | { kind: 'custom'; config: AvatarConfig }
  /** foto recortada em quadrado, JPEG pequeno (~256 px) como data URL */
  | { kind: 'photo'; dataUrl: string }
  | { kind: 'initials' }

export interface Profile {
  id: 'me'
  /** id estável do perfil, para identificar a pessoa em grupos no futuro */
  uid: string
  displayName: string
  /** apelido curto e único entre amigos, sem @ (ex.: "walan") */
  handle: string
  bio: string
  /** token da paleta usado no fundo do avatar e em destaques */
  color: string
  avatar: AvatarChoice
  /** peças do avatar compradas com créditos ("chave:id"); ausente = ainda não usou a loja */
  owned?: string[]
  /** último avatar montado, guardado quando a pessoa troca por ícone, foto ou iniciais */
  customAvatar?: AvatarConfig
  createdAt: number
  updatedAt: number
}
