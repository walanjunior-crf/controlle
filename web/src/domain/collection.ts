import { checksByTracker } from './rewards'
import type { EngineOptions } from './progress'
import type { DayKey, HabitCategory, RestDay, Tracker, TrackerSnapshot } from './types'

// Coleção (v0.5): cada tema de hábito tem uma escada de marcos. Ao cruzar um marco, a
// pessoa ganha o item daquele degrau. Tudo sai do histórico (como níveis e conquistas),
// então quem já praticava antes recebe na hora o que já teria ganhado.

export interface CategoryInfo {
  id: HabitCategory
  label: string
  /** emoji do tema */
  icon: string
  /** exemplo curto para o seletor */
  hint: string
}

export const CATEGORIES: CategoryInfo[] = [
  { id: 'agua', label: 'Hidratação', icon: '💧', hint: 'Beber água, chá' },
  { id: 'movimento', label: 'Movimento', icon: '🏃', hint: 'Treino, caminhada, alongar' },
  { id: 'sono', label: 'Sono', icon: '😴', hint: 'Dormir cedo, horas de sono' },
  { id: 'leitura', label: 'Leitura', icon: '📚', hint: 'Livros, páginas' },
  { id: 'mente', label: 'Mente', icon: '🧘', hint: 'Meditar, respirar, gratidão' },
  { id: 'saude', label: 'Saúde', icon: '💊', hint: 'Remédio, vitamina, consulta' },
  { id: 'largar', label: 'Largar um hábito', icon: '🚭', hint: 'Sem álcool, sem cigarro, sem doce' },
  { id: 'humor', label: 'Humor', icon: '🙂', hint: 'Como foi o dia, diário' },
  { id: 'estudo', label: 'Estudo', icon: '✏️', hint: 'Idioma, curso, prática' },
  { id: 'outro', label: 'Outro', icon: '⭐', hint: 'Tudo que não cabe acima' },
]

const IDS = new Set<string>(CATEGORIES.map((c) => c.id))
export const isCategory = (v: unknown): v is HabitCategory => typeof v === 'string' && IDS.has(v)
export const categoryInfo = (id: HabitCategory): CategoryInfo => CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1]

/** Degraus da escada: checks somados de todos os hábitos do tema. */
export const TIERS = [10, 40, 120] as const
export type Tier = 1 | 2 | 3
export const TIER_LABELS: Record<Tier, string> = { 1: 'Comum', 2: 'Rara', 3: 'Lendária' }

/** "agua:1", "leitura:3"… identifica um degrau já conquistado */
export type HabitUnlock = `${HabitCategory}:${Tier}`
export const unlockKey = (c: HabitCategory, t: Tier): HabitUnlock => `${c}:${t}`

// --- dedução do tema ------------------------------------------------------------

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** palavras (sem acento) que apontam para cada tema; a ordem decide empates */
const KEYWORDS: Array<[HabitCategory, RegExp]> = [
  ['largar', /\b(sem|parar|largar|zero|evitar|menos)\b|alcool|cigarro|fumar|vape|refri/],
  ['agua', /agua|beber|hidrat|garrafa|copo/],
  ['saude', /remedio|pilula|vitamina|suplement|creatina|medica|anticoncep|consulta|dente|fio dental|skincare|protetor/],
  ['leitura', /\bler\b|leitura|livro|pagina|kindle|lendo/],
  ['sono', /\bsono\b|dormir|acordar|cama|cochilo|deitar/],
  ['estudo', /estud|ingles|espanhol|idioma|curso|aula|duolingo|frances|alemao|italiano|japones|piano|violao|guitarra|programa/],
  ['mente', /medit|respir|oracao|orar|gratid|terapia|mindful|journal|reza/],
  ['movimento', /treino|academia|corr|caminh|exerc|yoga|ioga|pedal|bike|bicicleta|nata|muscula|alonga|passos|pilates|crossfit|futebol|danca|lutar|jiu/],
  ['humor', /humor|diario|sentiment|emoc|como (foi|estou)/],
]

const ICONS: Record<string, HabitCategory> = {
  '💧': 'agua', '🥤': 'agua', '🫖': 'agua',
  '🏋️': 'movimento', '🏃': 'movimento', '🚴': 'movimento', '🧗': 'movimento', '⚽': 'movimento', '🏊': 'movimento', '🤸': 'movimento', '👟': 'movimento',
  '😴': 'sono', '🛌': 'sono', '🌙': 'sono',
  '📚': 'leitura', '📖': 'leitura',
  '🧘': 'mente', '🙏': 'mente',
  '💊': 'saude', '🦷': 'saude', '🩺': 'saude',
  '🚫': 'largar', '🚭': 'largar',
  '🙂': 'humor', '😊': 'humor', '📓': 'humor',
  '✏️': 'estudo', '🎓': 'estudo', '🎹': 'estudo', '🎸': 'estudo',
}

/** Tema sugerido pelo nome (primeiro) e pelo ícone; "outro" quando nada bate. */
export function guessCategory(t: Pick<Tracker, 'name' | 'icon'>): HabitCategory {
  const name = fold(t.name)
  for (const [cat, re] of KEYWORDS) if (re.test(name)) return cat
  return ICONS[t.icon] ?? ICONS[t.icon.replace(/️/g, '')] ?? 'outro'
}

/** Tema efetivo: o escolhido pela pessoa, ou o deduzido. */
export function categoryOf(t: Pick<Tracker, 'name' | 'icon' | 'category'>): HabitCategory {
  return isCategory(t.category) ? t.category : guessCategory(t)
}

// --- escada ---------------------------------------------------------------------

export interface CategoryProgress {
  category: HabitCategory
  /** checks somados dos hábitos do tema */
  checks: number
  /** hábitos (ativos ou arquivados) com este tema */
  trackers: number
  /** degraus conquistados (0..3) */
  reached: 0 | Tier
  /** próximo degrau e quanto falta; null quando já completou */
  next: { tier: Tier; target: number; left: number } | null
}

export interface Collection {
  byCategory: Record<HabitCategory, CategoryProgress>
  unlocked: Set<HabitUnlock>
}

export function tierFor(checks: number): 0 | Tier {
  let r: 0 | Tier = 0
  TIERS.forEach((need, i) => {
    if (checks >= need) r = (i + 1) as Tier
  })
  return r
}

export function collectionFor(all: TrackerSnapshot[], restDays: RestDay[], today: DayKey, o: EngineOptions): Collection {
  const per = checksByTracker(all, restDays, today, o)
  const byCategory = {} as Record<HabitCategory, CategoryProgress>
  for (const c of CATEGORIES) byCategory[c.id] = { category: c.id, checks: 0, trackers: 0, reached: 0, next: null }
  for (const s of all) {
    const p = byCategory[categoryOf(s.tracker)]
    p.checks += per.get(s.tracker.id) ?? 0
    p.trackers++
  }
  const unlocked = new Set<HabitUnlock>()
  for (const p of Object.values(byCategory)) {
    p.reached = tierFor(p.checks)
    for (let t = 1; t <= p.reached; t++) unlocked.add(unlockKey(p.category, t as Tier))
    if (p.reached < 3) {
      const tier = (p.reached + 1) as Tier
      const target = TIERS[tier - 1]
      p.next = { tier, target, left: target - p.checks }
    }
  }
  return { byCategory, unlocked }
}

/** O marco mais próximo entre os temas em uso (para o aviso "faltam N"). */
export function closestMilestone(c: Collection, within = 3): CategoryProgress | null {
  let best: CategoryProgress | null = null
  for (const p of Object.values(c.byCategory)) {
    if (!p.trackers || !p.next || p.next.left > within) continue
    if (!best || p.next.left < best.next!.left) best = p
  }
  return best
}
