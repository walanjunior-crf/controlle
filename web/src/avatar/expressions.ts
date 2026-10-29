import type { Expression, Mood } from './types'

/** Cada humor do app vira olhos, boca, pose, efeito e um item temporário. */
export const EXPRESSIONS: Record<Mood, Expression> = {
  neutral: { mood: 'neutral', eyes: null, mouth: null, pose: 'idle', fx: null, extra: null },
  happy: { mood: 'happy', eyes: 'arc', mouth: 'open', pose: 'idle', fx: null, extra: null },
  celebrate: { mood: 'celebrate', eyes: 'arc', mouth: 'open', pose: 'up', fx: 'confetti', extra: null },
  sleepy: { mood: 'sleepy', eyes: 'closed', mouth: 'small', pose: 'rest', fx: 'zzz', extra: null },
  love: { mood: 'love', eyes: 'arc', mouth: 'smile', pose: 'hug', fx: 'hearts', extra: null },
  wave: { mood: 'wave', eyes: null, mouth: 'open', pose: 'wave', fx: null, extra: null },
  rest: { mood: 'rest', eyes: 'closed', mouth: 'smile', pose: 'rest', fx: null, extra: 'nightcap' },
  proud: { mood: 'proud', eyes: null, mouth: 'open', pose: 'idle', fx: 'sparkles', extra: 'medal' },
}

export const MOODS = Object.keys(EXPRESSIONS) as Mood[]
