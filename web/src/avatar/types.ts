import type { AvatarConfig } from '../domain/types'
import type { Ramp } from './color'

export type Pt = readonly [number, number]

/**
 * Esqueleto de um bicho: onde ficam as coisas no rosto e no corpo, numa caixa
 * 100×100. Toda peça se posiciona e muda de tamanho a partir daqui, por isso
 * o mesmo chapéu serve no gato, no coelho e no T-rex.
 */
export interface Rig {
  /** oval da cabeça (aproximado; o desenho pode ter outra silhueta) */
  head: { cx: number; cy: number; rx: number; ry: number }
  /** centros dos olhos e escala do olho (1 = olho padrão, raio ~6) */
  eyes: { l: Pt; r: Pt; size: number }
  nose: Pt
  /** centro da boca */
  mouth: Pt
  /** linha das sobrancelhas (y) */
  brows: number
  /**
   * Topo da cabeça onde o chapéu apoia: chapéus são desenhados num sistema local
   * com origem aqui e largura de referência 50; o motor escala por `width / 50`.
   * Em bicho de orelha alta, `width` é o vão entre as orelhas.
   */
  crown: { x: number; y: number; width: number }
  /** pontos de brinco (lóbulo/ponta da orelha), esquerda e direita */
  lobes: { l: Pt; r: Pt }
  cheeks: { l: Pt; r: Pt }
  /** laterais da cabeça na altura dos olhos (fones, hastes de óculos) */
  sides: { l: number; r: number; y: number }
  /** y onde a cabeça encontra o corpo */
  neck: number
  /** orelhas altas acima da cabeça (coelho, gato, raposa) */
  tallEars?: boolean
}

export type Mood = 'neutral' | 'happy' | 'celebrate' | 'sleepy' | 'love' | 'wave' | 'rest' | 'proud'
export type Pose = 'idle' | 'up' | 'wave' | 'hug' | 'rest'

/** O que um humor muda: olhos, boca, pose, efeitos e um item temporário. */
export interface Expression {
  mood: Mood
  eyes: 'arc' | 'closed' | 'heart' | null
  mouth: 'open' | 'smile' | 'small' | null
  pose: Pose
  fx: 'zzz' | 'hearts' | 'sparkles' | 'confetti' | null
  extra: 'medal' | 'nightcap' | null
}

/** Tudo que uma peça precisa para se desenhar. */
export interface Ctx {
  /** configuração efetiva (já normalizada e com as regras de cada bicho) */
  c: AvatarConfig
  rig: Rig
  /** rampa da pelagem */
  fur: Ramp
  /** rampa da parte clara (focinho, barriga) */
  muzzle: Ramp
  expr: Expression
  /** modo completo (avatar grande) ou leve (miniaturas) */
  full: boolean
}

export type Draw = (x: Ctx) => string

export interface SpeciesDef {
  rig: Rig
  /** cor clara do focinho/barriga a partir da pelagem (padrão: ramp.pale) */
  muzzle?: (fur: string) => string
  /** atrás da cabeça: orelhas em pé, barbatana. Envolva cada orelha em <g class="av-ear-l|r"> */
  back: Draw
  /** cabeça e focinho */
  head: Draw
  /** depois da estampa: orelhas caídas, bigodes, guelras */
  front?: Draw
  nose: Draw
  /** cauda, atrás do corpo */
  tail?: Draw
}

/** Uma peça de rosto desenhada por olho (side: -1 esquerda, 1 direita). */
export type EyeDraw = (x: Ctx, cx: number, cy: number, s: number, side: -1 | 1) => string
export type PointDraw = (x: Ctx, p: Pt, side: -1 | 1) => string

export interface OutfitDef {
  /** tronco (o corpo já vem desenhado na cor da pelagem por baixo) */
  torso: Draw
  /** cor da manga sobre o braço, ou null (braço à mostra) */
  sleeve?: (x: Ctx) => string | null
}

export interface CostumeDef extends OutfitDef {
  /** por cima do rosto (capuz, tapa-olho, capacete) */
  over?: Draw
  /** chapéu próprio, no sistema local do topo da cabeça */
  hat?: Draw
  hides: { hat?: true; hair?: true; ears?: true; earrings?: true }
}
