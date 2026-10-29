import type { Expression, Mood } from './types'

/** Cada humor do app vira olhos, boca, pose, efeito e um item temporário. */
export const EXPRESSIONS: Record<Mood, Expression> = {
  neutral: { mood: 'neutral', eyes: null, mouth: null, pose: 'idle', fx: null, extra: null, lids: null },
  drowsy: { mood: 'drowsy', eyes: null, mouth: 'small', pose: 'idle', fx: null, extra: null, lids: 'half' },
  meh: { mood: 'meh', eyes: null, mouth: 'meh', pose: 'idle', fx: null, extra: null, lids: 'flat' },
  happy: { mood: 'happy', eyes: 'arc', mouth: 'open', pose: 'idle', fx: null, extra: null, lids: null },
  celebrate: { mood: 'celebrate', eyes: 'arc', mouth: 'open', pose: 'up', fx: 'confetti', extra: null, lids: null },
  sleepy: { mood: 'sleepy', eyes: 'closed', mouth: 'small', pose: 'rest', fx: 'zzz', extra: null, lids: null },
  love: { mood: 'love', eyes: 'arc', mouth: 'smile', pose: 'hug', fx: 'hearts', extra: null, lids: null },
  wave: { mood: 'wave', eyes: null, mouth: 'open', pose: 'wave', fx: null, extra: null, lids: null },
  rest: { mood: 'rest', eyes: 'closed', mouth: 'smile', pose: 'rest', fx: null, extra: 'nightcap', lids: null },
  proud: { mood: 'proud', eyes: null, mouth: 'open', pose: 'idle', fx: 'sparkles', extra: 'medal', lids: null },
}

export const MOODS = Object.keys(EXPRESSIONS) as Mood[]

/** jeito escolhido na aba Jeito → humor de base */
export const PERSONA_MOOD: Record<string, Mood> = { normal: 'neutral', sonolento: 'drowsy', enjoado: 'meh' }
