/**
 * Motor v2 do avatar (traço papel recortado).
 *
 * renderAvatar(config, { mood, detail }) devolve o conteúdo de um
 * <svg viewBox="0 0 100 100">. Partes nomeadas por classe para animar:
 *   .av-body .av-arm-l .av-arm-r .av-head .av-ear-l .av-ear-r .av-eyes .av-mouth .av-fx
 * Ordem das camadas: fundo → corpo/roupa/braços → cabeça (cabelo de trás, orelhas,
 * cabeça, estampa, frente, bochechas, boca, barba, nariz, olhos, sobrancelhas,
 * piercing, brincos, cabelo da frente, óculos, fantasia, chapéu) → efeitos → textura.
 */
import type { AvatarConfig } from '../domain/types'
import { effective, normalizeAvatar } from '../features/profile/avatarParts'
import { body } from './body'
import { adjust, mix, ramp } from './color'
import { EXPRESSIONS, PERSONA_MOOD } from './expressions'
import { BACKGROUND_DECOR } from './decor'
import { GRAIN_PATTERN, cut, cutEllipse, cutPoly, detail, f, layer, mirror } from './paper'
import { atCrown, atEyes, onHead } from './place'
import { PATTERNS } from './parts/backgrounds'
import { COATS } from './parts/coats'
import { COSTUMES } from './parts/costumes'
import { BEARDS, BROWS, CHEEKS, EYES, MOUTHS, lids } from './parts/face'
import { GLASSES } from './parts/glasses'
import { HAIR } from './parts/hair'
import { HATS } from './parts/hats'
import { EARRINGS, PIERCINGS } from './parts/jewelry'
import { OUTFITS } from './parts/outfits'
import { SPECIES_DEFS } from './species'
import type { Ctx, Mood } from './types'

export interface RenderOpts {
  mood?: Mood
  /** 'full' para o avatar grande; 'lite' para miniaturas (sem textura nem fio de borda) */
  detail?: 'full' | 'lite'
}

const BODY_CLIP = 'M14 104L17 90L26 82L38 78.5L50 77.6L62 78.5L74 82L83 90L86 104Z'

function fx(x: Ctx): string {
  const kind = x.expr.fx
  if (!kind) return ''
  let s = ''
  if (kind === 'zzz') {
    s += [[70, 30, 7], [78, 21, 9], [87, 11, 11]].map(([px, py, size], i) => `<text x="${px}" y="${py}" font-family="system-ui, sans-serif" font-weight="800" font-size="${size}" fill="#FFFFFF" fill-opacity="${0.95 - i * 0.12}" class="av-z av-z${i}">z</text>`).join('')
  } else if (kind === 'hearts') {
    for (const [px, py, sz, i] of [[22, 30, 3.4, 0], [79, 26, 4.2, 1], [74, 14, 2.8, 2]]) {
      s += `<g class="av-float av-float${i}">${layer(`M${px} ${py + sz * 0.9}C${f(px - sz * 1.6)} ${f(py - sz * 0.1)} ${f(px - sz * 0.7)} ${f(py - sz * 1.3)} ${px} ${f(py - sz * 0.45)}C${f(px + sz * 0.7)} ${f(py - sz * 1.3)} ${f(px + sz * 1.6)} ${f(py - sz * 0.1)} ${px} ${f(py + sz * 0.9)}Z`, '#E2506E', { lift: 0.5 })}</g>`
    }
  } else if (kind === 'sparkles') {
    for (const [px, py, r, i] of [[20, 28, 4, 0], [82, 22, 5, 1], [86, 44, 3, 2]]) {
      const pts: [number, number][] = []
      for (let k = 0; k < 8; k++) {
        const a = -Math.PI / 2 + (k * Math.PI) / 4
        const rr = k % 2 ? r * 0.35 : r
        pts.push([px + rr * Math.cos(a), py + rr * Math.sin(a)])
      }
      s += `<g class="av-float av-float${i}">${layer(cutPoly(pts, `spark${i}`, 0.1), '#F6CF57', { lift: 0.4 })}</g>`
    }
  } else if (kind === 'confetti') {
    const cs = ['#F6CF57', '#E57AA6', '#5AA0E0', '#FFFFFF', '#9BD3AE']
    ;[[14, 22, 20], [26, 10, -30], [72, 9, 40], [86, 24, -15], [9, 44, 60], [91, 46, 10], [40, 6, 70], [60, 14, -45]].forEach(([px, py, a], i) => {
      s += `<g class="av-float av-float${i % 3}" transform="rotate(${a} ${px} ${py})">${layer(`M${px - 3} ${py - 1.3}h6v2.6h-6Z`, cs[i % cs.length], { lift: 0.4, edge: false })}</g>`
    })
  }
  return `<g class="av-fx av-fx-${kind}">${s}</g>`
}

function extraBody(x: Ctx): string {
  if (x.expr.extra !== 'medal') return ''
  return (
    layer(cutPoly([[43, 78], [47, 78], [51, 91], [47.4, 91]], 'medal-rl'), '#C0392B', { lift: 0.4 }) +
    layer(cutPoly([[57, 78], [53, 78], [49, 91], [52.6, 91]], 'medal-rr'), '#2E6FB7', { lift: 0.4 }) +
    layer(cutEllipse(50, 94, 5.6, 5.6, 'medal'), '#E8B930', { lift: 0.8 }) +
    `<path d="M52.4 91.6A3.4 3.4 0 1 0 52.4 96.4" fill="none" stroke="#8A6512" stroke-width="1.4" stroke-linecap="round"/>`
  )
}

function nightcap(x: Ctx): string {
  const r = ramp('#5B6FB8')
  return atCrown(
    x,
    layer(cut([[-24, 9], [-20, -6], [-6, -14], [10, -16], [24, -24], [30, -20], [20, -8], [24, 9]], 'cap', 0.3), r.base) +
      layer(cut([[-25, 6], [25, 6], [25, 12], [-25, 12]], 'cap-band', 0.2), '#F4F1EA') +
      layer(cutEllipse(30, -21, 4, 4, 'cap-pom'), '#F4F1EA'),
  )
}

/** Conteúdo interno (viewBox 0 0 100 100) do avatar no traço papel. */
export function renderAvatar(config: Partial<AvatarConfig>, opts: RenderOpts = {}): string {
  const c = effective(normalizeAvatar(config))
  const def = SPECIES_DEFS[c.species] ?? SPECIES_DEFS.gato
  // humor pedido (reação) ou o jeito escolhido pela pessoa
  const moodKey = opts.mood && opts.mood !== 'neutral' ? opts.mood : (PERSONA_MOOD[c.persona] ?? 'neutral')
  const expr = EXPRESSIONS[moodKey] ?? EXPRESSIONS.neutral
  const full = opts.detail !== 'lite'
  detail.full = full
  const fur = ramp(c.fur)
  const muzzleHex = def.muzzle ? def.muzzle(c.fur) : fur.pale
  const x: Ctx = { c, rig: def.rig, fur, muzzle: ramp(muzzleHex), expr, full }

  const costume = c.costume !== 'nenhum' ? COSTUMES[c.costume] : undefined
  const hides = costume?.hides ?? {}
  const dress = costume ?? OUTFITS[c.outfit] ?? OUTFITS.nenhum
  const hair = hides.hair ? undefined : HAIR[c.hair]
  const { rig } = x

  const eyeStyle = expr.eyes ?? c.eyes
  const eyeFn = EYES[eyeStyle] ?? EYES.brilho
  const s = rig.eyes.size
  let eyes = eyeFn(x, rig.eyes.l[0], rig.eyes.l[1], s, -1) + eyeFn(x, rig.eyes.r[0], rig.eyes.r[1], s, 1)
  if (expr.lids && !expr.eyes) eyes += lids(x, rig.eyes.l[0], rig.eyes.l[1], s, expr.lids, -1) + lids(x, rig.eyes.r[0], rig.eyes.r[1], s, expr.lids, 1)
  // bigode ocupa o espaço entre nariz e boca: a boca desce um pouco
  const mouthAt: [number, number] = c.beard !== 'nenhum' ? [rig.mouth[0], rig.mouth[1] + 2.2] : [rig.mouth[0], rig.mouth[1]]
  const sideL = c.earringSide !== 'direito'
  const sideR = c.earringSide !== 'esquerdo'
  const pierceFn = PIERCINGS[c.piercing] ?? PIERCINGS.nenhum
  const pierced = pierceFn(x)
  const piercing =
    c.piercing === 'septo' || !pierced
      ? pierced
      : (c.piercingSide !== 'esquerdo' ? pierced : '') + (c.piercingSide !== 'direito' ? mirror(pierced) : '')
  const mouthFn = MOUTHS[expr.mouth ?? c.mouth] ?? MOUTHS.sorriso
  const browFn = BROWS[c.brows] ?? BROWS.nenhum
  const earFn = EARRINGS[c.earrings] ?? EARRINGS.nenhum

  const hat = expr.extra === 'nightcap' ? nightcap(x) : costume?.hat ? atCrown(x, costume.hat(x)) : hides.hat ? '' : atCrown(x, (HATS[c.hat] ?? HATS.nenhum)(x))

  const out =
    `<defs><clipPath id="avc"><circle cx="50" cy="50" r="50"/></clipPath><clipPath id="avb"><path d="${BODY_CLIP}"/></clipPath>${full ? GRAIN_PATTERN : ''}</defs>` +
    `<g clip-path="url(#avc)">` +
    `<rect width="100" height="100" fill="${c.bg}"/>` +
    BACKGROUND_DECOR(c.bg, adjust, mix) +
    (PATTERNS[c.pattern] ?? PATTERNS.nenhum)(x) +
    // personagem um pouco menor, ancorado na base: sobra espaço para orelhas e chapéus
    `<g transform="translate(50 100) scale(0.92) translate(-50 -100)">` +
    `<g class="av-body">${def.tail ? def.tail(x) : ''}${body(x, dress)}${extraBody(x)}</g>` +
    `<g class="av-head">` +
    (hair?.back ? onHead(x, hair.back(x)) : '') +
    (hides.ears ? '' : def.back(x)) +
    def.head(x) +
    (COATS[c.coat] ?? COATS.liso)(x) +
    (hides.ears || !def.front ? '' : def.front(x)) +
    (CHEEKS[c.cheeks] ?? CHEEKS.nenhum)(x) +
    `<g class="av-mouth">${mouthFn(x, mouthAt, 1)}</g>` +
    (BEARDS[c.beard] ?? BEARDS.nenhum)(x) +
    def.nose(x) +
    `<g class="av-eyes">${eyes}</g>` +
    browFn(x, rig.eyes.l[0], rig.brows, -1) +
    browFn(x, rig.eyes.r[0], rig.brows, 1) +
    piercing +
    (hides.earrings ? '' : (sideL ? earFn(x, rig.lobes.l, -1) : '') + (sideR ? earFn(x, rig.lobes.r, 1) : '')) +
    (hair?.front ? onHead(x, hair.front(x)) : '') +
    atEyes(x, (GLASSES[c.glasses] ?? GLASSES.nenhum)(x)) +
    (costume?.over ? costume.over(x) : '') +
    hat +
    `</g>` +
    `</g>` +
    fx(x) +
    (full ? `<rect width="100" height="100" fill="url(#avPaperGrain)" pointer-events="none"/>` : '') +
    `</g>`
  detail.full = true
  return out
}
