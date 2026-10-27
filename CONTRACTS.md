# Controlle — contratos entre as frentes (web app)

Web app instalável (PWA) para iPhone e Android, de uso individual; grupos com amigos
entram depois como recurso opcional. Sem servidor, sem App Store, sem pagamentos.
Dados ficam no aparelho (IndexedDB via Dexie); backup por exportação/importação.

Stack: Vite + React 19 + TypeScript (strict), Dexie + dexie-react-hooks (useLiveQuery),
date-fns (locale ptBR), react-router-dom (HashRouter, para hospedar em GitHub Pages),
vite-plugin-pwa, Vitest. Sem bibliotecas de UI nem de gráficos: CSS próprio e SVG.
Textos em português do Brasil. Celular primeiro (375–430 px), mas funcional no desktop.

## Pastas (web/)

```
src/
  domain/      motor puro, sem React/Dexie — Frente A (+ testes em domain/__tests__)
    types.ts   (pronto) tipos base
  db/          (pronto) db.ts (Dexie), actions.ts (logEntry, undoLast, saveTracker, ...)
  hooks/       hooks que juntam db + domínio — Frente C
  components/  componentes visuais (CRing, BrandText, TrackerCard, Toast, Sheet...) — Frente C
  features/    telas: today, builder, history, stats, settings, onboarding — Frente C
  platform/    PWA: instalação, backup, lembretes in-app, persistência — Frente D
  styles/      global.css (importa public/tokens.css) — Frente C
public/        ícones, fontes, tokens.css, brand/ — Frente B
```

## Domínio (Frente A) — `src/domain/*`

Todas as funções são puras; recebem `dayStartHour` / `weekStartsOn` explícitos.
DayKey = "YYYY-MM-DD". Use date-fns, sem somar 86_400_000 (horário de verão).

```ts
// calendar.ts
export function dayKeyFor(timestamp: number, dayStartHour: number): DayKey
  // 01:30 com virada às 4h → dia anterior. Usa o fuso local do aparelho.
export function todayKey(dayStartHour: number, now?: number): DayKey
export function parseDayKey(key: DayKey): Date               // 00:00 local daquele dia
export function addDays(key: DayKey, n: number): DayKey
export function weekdayOf(key: DayKey): Weekday
export function daysBetween(from: DayKey, to: DayKey): DayKey[] // inclusivo, em ordem
export function weekRange(key: DayKey, weekStartsOn: 0 | 1): { start: DayKey; end: DayKey }
export function monthDays(year: number, month0: number): DayKey[]

// goals.ts
export function goalOn(goals: Goal[], day: DayKey): Goal | undefined  // maior effectiveFrom <= day
export function isActiveOn(tracker: Tracker, goal: Goal | undefined, day: DayKey, dayStartHour: number): boolean
  // meta existe, weekday ativo (vazio = todos), não arquivado, criado até o dia

// progress.ts
export interface DayProgress {
  trackerId: string; day: DayKey
  value: number | null      // agregado do dia; null sem registros
  target: number | null; comparison: GoalComparison | null; period: GoalPeriod | null
  fraction: number          // 0..1 para anéis
  isActive: boolean; isMet: boolean; isRest: boolean; entryCount: number
}
export interface PeriodProgress { trackerId: string; start: DayKey; end: DayKey; value: number; target: number; fraction: number; isMet: boolean }
export interface OverallProgress { day: DayKey; active: number; met: number; fraction: number; complete: boolean }
export interface EngineOptions { dayStartHour: number; weekStartsOn: 0 | 1 }

export function aggregate(entries: Entry[], kind: TrackerKind, numericAggregation: NumericAggregation): number | null
export function dayProgress(s: TrackerSnapshot, restDays: RestDay[], day: DayKey, o: EngineOptions): DayProgress
export function periodProgress(s: TrackerSnapshot, day: DayKey, o: EngineOptions): PeriodProgress | null
export function overallProgress(all: TrackerSnapshot[], restDays: RestDay[], day: DayKey, o: EngineOptions): OverallProgress

// streaks.ts
export interface StreakInfo { current: number; best: number; atRisk: boolean }
export function trackerStreak(s: TrackerSnapshot, restDays: RestDay[], today: DayKey, o: EngineOptions): StreakInfo
export function overallStreak(all: TrackerSnapshot[], restDays: RestDay[], today: DayKey, o: EngineOptions): StreakInfo

// stats.ts
export interface DailyValue { day: DayKey; value: number | null; fraction: number; isMet: boolean; isActive: boolean; isRest: boolean }
export interface TrackerStats { adherence: number; total: number; dailyAverage: number; series: DailyValue[]; bestHour: number | null; activeDays: number; metDays: number }
export function trackerStats(s: TrackerSnapshot, restDays: RestDay[], lastDays: number, today: DayKey, o: EngineOptions): TrackerStats
export function monthHeatmap(all: TrackerSnapshot[], restDays: RestDay[], year: number, month0: number, o: EngineOptions, trackerId?: string): DailyValue[]

// templates.ts
export type TemplateId = 'pill' | 'water' | 'workout' | 'sleep' | 'reading' | 'meditation' | 'noAlcohol' | 'mood'
export interface TrackerTemplate {
  id: TemplateId; name: string; icon: string /* emoji */; description: string
  tracker: Omit<Tracker, 'id' | 'createdAt' | 'sortOrder' | 'archived'>
  goal: Omit<Goal, 'id' | 'trackerId' | 'effectiveFrom'>
  reminderMinutes: number[]
}
export const TEMPLATES: TrackerTemplate[]

// achievements.ts
export type AchievementId = 'firstEntry' | 'firstPerfectDay' | 'perfectWeek' | 'streak7' | 'streak30' | 'streak100' | 'streak365'
export interface Achievement { id: AchievementId; title: string; detail: string; icon: string }
export const ACHIEVEMENTS: Achievement[]
export function unlockedAchievements(all: TrackerSnapshot[], restDays: RestDay[], today: DayKey, o: EngineOptions): Set<AchievementId>

// format.ts  (pt-BR, vírgula decimal)
export function formatValue(value: number | null, kind: TrackerKind, unit: string): string
  // "2,5 L" (ml >= 1000), "3 copos", "45 min", "1h 15min", "Feito"/"Pendente", "4/5"
export function formatTarget(goal: Goal | undefined, kind: TrackerKind, unit: string): string
  // "meta 2 L", "até 2 cafés", "4x por semana"
export function formatMinuteOfDay(min: number): string  // "08:30"
export function formatDayLong(key: DayKey): string        // "terça, 27 de outubro"

// index.ts reexporta tudo.
```

## Banco (pronto) — `src/db`

`db` (Dexie): trackers, goals, entries (índice [trackerId+day]), restDays, reminders, settings.
`getSettings()`, `saveSettings(patch)`, `requestPersistentStorage()`, `newId()`.
Ações: `logEntry(trackerId, {value?, at?, note?, source?})`, `undoLast(trackerId)`,
`deleteEntry(id)`, `restoreEntry(entry)`, `saveTracker(draft)`, `setArchived`, `deleteTracker`,
`reorderTrackers(ids)`, `toggleRestDay(day, trackerId|null)`.
As telas leem com `useLiveQuery` e escrevem só por essas ações.

## Plataforma (Frente D) — `src/platform/*`

```ts
// backup.ts
export async function exportJSON(): Promise<Blob>          // todas as tabelas + versão
export async function importJSON(file: File, mode: 'merge' | 'replace'): Promise<{ trackers: number; entries: number }>
export async function exportCSV(): Promise<Blob>           // data, hora, tracker, valor, unidade, nota
export function downloadBlob(blob: Blob, filename: string): void  // usa navigator.share com arquivo quando disponível (iOS), senão <a download>
// install.ts
export function isStandalone(): boolean
export function platformHint(): 'ios-safari' | 'ios-other' | 'android' | 'desktop'
export function useInstallPrompt(): { canPrompt: boolean; prompt: () => Promise<void> }  // beforeinstallprompt (Android/desktop)
// reminders.ts — sem servidor não há push com o app fechado; isto cobre o app aberto
export function useDueReminders(): Array<{ reminder: Reminder; tracker: Tracker; dueAt: number }>
  // lembretes cujo horário de hoje já passou e cuja meta do dia ainda não foi cumprida
export async function updateAppBadge(count: number): Promise<void> // navigator.setAppBadge quando existir
// sw: vite-plugin-pwa (registerType 'autoUpdate'), manifest pt-BR, ícones de public/icons
export function useUpdateAvailable(): { needRefresh: boolean; update: () => void }
```

## Componentes de marca (Frente C, usando assets da Frente B)

- `public/tokens.css` (Frente B): variáveis de cor, modo escuro, @font-face "Controlle C"
  com unicode-range só para C c Ç ç.
- `<BrandText as="h1">texto</BrandText>`: envolve cada c/C/ç/Ç em `<span class="brand-c">`
  (glifo C-anel + cor primária). Só em títulos e momentos de marca.
- `<CRing progress={0..1} size={…} stroke={…} />`: anel em forma de C (300°, aberto à
  direita, pontas redondas); a 100% fecha em 360° com animação.
- `<CLogo size />`: o logo em SVG inline.
