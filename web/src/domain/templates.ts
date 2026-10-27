import type { Goal, Tracker } from './types'

export type TemplateId = 'pill' | 'water' | 'workout' | 'sleep' | 'reading' | 'meditation' | 'noAlcohol' | 'mood'

export interface TrackerTemplate {
  id: TemplateId
  name: string
  /** emoji */
  icon: string
  description: string
  tracker: Omit<Tracker, 'id' | 'createdAt' | 'sortOrder' | 'archived'>
  goal: Omit<Goal, 'id' | 'trackerId' | 'effectiveFrom'>
  /** minutos desde 00:00 */
  reminderMinutes: number[]
}

const h = (hour: number, minute = 0): number => hour * 60 + minute

export const TEMPLATES: TrackerTemplate[] = [
  {
    id: 'pill',
    name: 'Pílula',
    icon: '💊',
    description: 'Tome no mesmo horário todos os dias.',
    tracker: { name: 'Pílula', icon: '💊', color: 'green-500', kind: 'binary', unit: '', increment: 1, numericAggregation: 'sum' },
    goal: { target: 1, comparison: 'atLeast', period: 'day', weekdays: [] },
    reminderMinutes: [h(8)],
  },
  {
    id: 'water',
    name: 'Água',
    icon: '💧',
    description: 'Um toque a cada copo de 250 ml.',
    tracker: { name: 'Água', icon: '💧', color: 'teal', kind: 'counter', unit: 'ml', increment: 250, numericAggregation: 'sum' },
    goal: { target: 2000, comparison: 'atLeast', period: 'day', weekdays: [] },
    reminderMinutes: [h(10), h(13), h(16), h(19)],
  },
  {
    id: 'workout',
    name: 'Treino',
    icon: '🏋️',
    description: 'Quatro treinos por semana, nos dias que der.',
    tracker: { name: 'Treino', icon: '🏋️', color: 'terracotta', kind: 'binary', unit: '', increment: 1, numericAggregation: 'sum' },
    goal: { target: 4, comparison: 'atLeast', period: 'week', weekdays: [] },
    reminderMinutes: [],
  },
  {
    id: 'sleep',
    name: 'Sono',
    icon: '😴',
    description: 'Anote quantas horas dormiu.',
    tracker: { name: 'Sono', icon: '😴', color: 'plum', kind: 'numeric', unit: 'h', increment: 1, numericAggregation: 'last' },
    goal: { target: 7, comparison: 'atLeast', period: 'day', weekdays: [] },
    reminderMinutes: [],
  },
  {
    id: 'reading',
    name: 'Leitura',
    icon: '📚',
    description: 'Some as páginas lidas no dia.',
    tracker: { name: 'Leitura', icon: '📚', color: 'amber', kind: 'numeric', unit: 'páginas', increment: 10, numericAggregation: 'sum' },
    goal: { target: 20, comparison: 'atLeast', period: 'day', weekdays: [] },
    reminderMinutes: [],
  },
  {
    id: 'meditation',
    name: 'Meditação',
    icon: '🧘',
    description: 'Dez minutos de pausa por dia.',
    tracker: { name: 'Meditação', icon: '🧘', color: 'green-400', kind: 'duration', unit: 'min', increment: 5, numericAggregation: 'sum' },
    goal: { target: 10, comparison: 'atLeast', period: 'day', weekdays: [] },
    reminderMinutes: [],
  },
  {
    id: 'noAlcohol',
    name: 'Sem álcool',
    icon: '🚫',
    description: 'Marque cada dia em que ficou sem beber.',
    tracker: { name: 'Sem álcool', icon: '🚫', color: 'graphite', kind: 'binary', unit: '', increment: 1, numericAggregation: 'sum' },
    goal: { target: 1, comparison: 'atLeast', period: 'day', weekdays: [] },
    reminderMinutes: [],
  },
  {
    id: 'mood',
    name: 'Humor',
    icon: '🙂',
    description: 'Como você está hoje, de 1 a 5.',
    tracker: { name: 'Humor', icon: '🙂', color: 'green-700', kind: 'scale', unit: '', increment: 1, numericAggregation: 'sum' },
    goal: { target: 3, comparison: 'atLeast', period: 'day', weekdays: [] },
    reminderMinutes: [],
  },
]
