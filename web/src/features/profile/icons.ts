/**
 * Ícones estáticos do Controlle (os 16 desenhos originais da v0.2): formas chapadas e
 * traço arredondado, sem animação. A pessoa escolhe o desenho e a cor do fundo.
 *
 * O desenho é constante e escrito aqui (nunca vem do usuário); a cor do fundo passa
 * por `safeBg` antes de entrar no SVG.
 */

export interface StaticIcon {
  id: string
  /** nome em pt-BR, usado no aria-label */
  label: string
  /** cor de fundo original */
  bg: string
  /** desenho sem o círculo do fundo; `{{bg}}` vira a cor do fundo */
  body: string
}

// fundos (paleta da marca)
const GREEN = '#336633'
const GREEN_MID = '#4D8C4D'
const GREEN_DARK = '#264D26'
const AMBER = '#E0A43A'
const TEAL = '#2F7F7A'
const TERRA = '#C0643F'
const PLUM = '#7A4E7E'
const GRAPHITE = '#4A4F4A'

// tintas dos desenhos
const INK = '#1F2A1F'
const CREAM = '#FFF6E8'
const PINK = '#F4A7A0'
const LEAF = '#62B05C'
const LEAF_DARK = '#3F8A47'

const R = 'stroke-linecap="round" stroke-linejoin="round"'
/** preenchimento + contorno da mesma cor: arredonda os cantos das formas */
const fs = (c: string, w = 6) => `fill="${c}" stroke="${c}" stroke-width="${w}" ${R}`
const line = (c: string, w: number) => `fill="none" stroke="${c}" stroke-width="${w}" ${R}`
const eye = (x: number, y: number, r = 4.2) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}"/>`
const smile = (x: number, y: number, w = 4, c = INK, sw = 2.8) =>
  `<path d="M${x - w} ${y} Q${x} ${y + w * 0.9} ${x + w} ${y}" ${line(c, sw)}/>`

/** marcador trocado pela cor do fundo escolhida (recortes que imitam o fundo, ex.: lua) */
const BG = '{{bg}}'

function make(id: string, label: string, bg: string, body: string): StaticIcon {
  return { id, label, bg, body }
}

const rays = (() => {
  let d = ''
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4
    const c = Math.cos(a)
    const s = Math.sin(a)
    d += `M${(50 + 29 * c).toFixed(1)} ${(52 + 29 * s).toFixed(1)}L${(50 + 37 * c).toFixed(1)} ${(52 + 37 * s).toFixed(1)}`
  }
  return d
})()

export const ICONS: StaticIcon[] = [
  make(
    'raposa',
    'Raposa',
    GREEN,
    `<path d="M22 22L41 38H59L78 22L77 54Q74 74 50 84Q26 74 23 54Z" ${fs('#EE8A3C')}/>
     <path d="M28 31L36 38L29 44Z" ${fs('#8A3F1C', 3)}/>
     <path d="M72 31L64 38L71 44Z" ${fs('#8A3F1C', 3)}/>
     <path d="M25 58Q39 57 50 70Q61 57 75 58Q71 75 50 84Q29 75 25 58Z" ${fs(CREAM, 3)}/>
     ${eye(38, 52)}${eye(62, 52)}
     <ellipse cx="50" cy="73" rx="5" ry="3.8" fill="${INK}"/>`,
  ),
  make(
    'coruja',
    'Coruja',
    PLUM,
    `<path d="M26 30L34 18L43 28H57L66 18L74 30Q80 50 76 66Q70 86 50 86Q30 86 24 66Q20 50 26 30Z" ${fs('#E8A93E', 4)}/>
     <circle cx="39" cy="45" r="12" fill="${CREAM}"/><circle cx="61" cy="45" r="12" fill="${CREAM}"/>
     <circle cx="39" cy="46" r="5.5" fill="${INK}"/><circle cx="61" cy="46" r="5.5" fill="${INK}"/>
     <circle cx="41" cy="44" r="1.8" fill="#fff"/><circle cx="63" cy="44" r="1.8" fill="#fff"/>
     <path d="M45.5 57H54.5L50 64Z" ${fs(TERRA, 3)}/>
     <path d="M40 72l4 4l4-4M52 72l4 4l4-4M46 79l4 3l4-3" ${line('#B9781F', 2.6)}/>`,
  ),
  make(
    'gato',
    'Gato',
    AMBER,
    `<path d="M24 48L26 18L46 33Z" ${fs('#3B403B')}/><path d="M76 48L74 18L54 33Z" ${fs('#3B403B')}/>
     <path d="M30 37L31 26L39 32Z" ${fs(PINK, 3)}/><path d="M70 37L69 26L61 32Z" ${fs(PINK, 3)}/>
     <ellipse cx="50" cy="56" rx="29" ry="25" fill="#3B403B"/>
     <ellipse cx="39" cy="53" rx="5.5" ry="6" fill="#C5E37A"/><ellipse cx="61" cy="53" rx="5.5" ry="6" fill="#C5E37A"/>
     <ellipse cx="39" cy="53" rx="1.8" ry="4.6" fill="${INK}"/><ellipse cx="61" cy="53" rx="1.8" ry="4.6" fill="${INK}"/>
     <path d="M46.5 62.5H53.5L50 66Z" ${fs(PINK, 2.5)}/>
     <path d="M50 66Q48 70 44 69M50 66Q52 70 56 69" ${line(CREAM, 2.2)}/>
     <path d="M15 59L32 62M16 68L32 66M85 59L68 62M84 68L68 66" ${line(CREAM, 2.2)} opacity=".85"/>`,
  ),
  make(
    'urso',
    'Urso',
    TEAL,
    `<circle cx="29" cy="31" r="12" fill="#B5763F"/><circle cx="71" cy="31" r="12" fill="#B5763F"/>
     <circle cx="29" cy="31" r="5.5" fill="#E7BB8C"/><circle cx="71" cy="31" r="5.5" fill="#E7BB8C"/>
     <circle cx="50" cy="55" r="29" fill="#B5763F"/>
     <ellipse cx="50" cy="66" rx="14" ry="11" fill="#E7BB8C"/>
     ${eye(39, 50)}${eye(61, 50)}
     <ellipse cx="50" cy="61" rx="5.5" ry="4" fill="${INK}"/>
     <path d="M50 64V68M45 70Q50 74 55 70" ${line(INK, 2.6)}/>`,
  ),
  make(
    'sapo',
    'Sapo',
    GRAPHITE,
    `<circle cx="33" cy="37" r="13" fill="#7CC46B"/><circle cx="67" cy="37" r="13" fill="#7CC46B"/>
     <ellipse cx="50" cy="60" rx="35" ry="24" fill="#7CC46B"/>
     <circle cx="33" cy="37" r="8" fill="${CREAM}"/><circle cx="67" cy="37" r="8" fill="${CREAM}"/>
     ${eye(34, 38, 4.5)}${eye(66, 38, 4.5)}
     <circle cx="46" cy="53" r="1.6" fill="#3E7A35"/><circle cx="54" cy="53" r="1.6" fill="#3E7A35"/>
     <path d="M32 63Q50 77 68 63" ${line(INK, 3.4)}/>
     <circle cx="24" cy="63" r="4.5" fill="${PINK}" opacity=".85"/><circle cx="76" cy="63" r="4.5" fill="${PINK}" opacity=".85"/>`,
  ),
  make(
    'pinguim',
    'Pinguim',
    TEAL,
    `<path d="M50 16Q77 16 78 52Q79 78 66 88H34Q21 78 22 52Q23 16 50 16Z" fill="#22303A"/>
     <circle cx="41" cy="44" r="12" fill="${CREAM}"/><circle cx="59" cy="44" r="12" fill="${CREAM}"/>
     <ellipse cx="50" cy="68" rx="17" ry="19" fill="${CREAM}"/>
     ${eye(42, 43)}${eye(58, 43)}
     <path d="M44.5 51H55.5L50 58Z" ${fs('#F0B54D', 3)}/>
     <circle cx="34" cy="53" r="3.5" fill="${PINK}" opacity=".8"/><circle cx="66" cy="53" r="3.5" fill="${PINK}" opacity=".8"/>`,
  ),
  make(
    'coelho',
    'Coelho',
    PLUM,
    `<ellipse cx="38" cy="27" rx="8.5" ry="19" transform="rotate(-10 38 27)" fill="${CREAM}"/>
     <ellipse cx="62" cy="27" rx="8.5" ry="19" transform="rotate(10 62 27)" fill="${CREAM}"/>
     <ellipse cx="38" cy="28" rx="3.6" ry="12" transform="rotate(-10 38 28)" fill="${PINK}"/>
     <ellipse cx="62" cy="28" rx="3.6" ry="12" transform="rotate(10 62 28)" fill="${PINK}"/>
     <ellipse cx="50" cy="61" rx="27" ry="23" fill="${CREAM}"/>
     ${eye(40, 57)}${eye(60, 57)}
     <path d="M46.5 64H53.5L50 67.5Z" ${fs(PINK, 2.5)}/>
     <path d="M50 67.5Q48 71.5 44.5 70.5M50 67.5Q52 71.5 55.5 70.5" ${line(INK, 2.2)}/>
     <circle cx="32" cy="66" r="4.5" fill="${PINK}" opacity=".7"/><circle cx="68" cy="66" r="4.5" fill="${PINK}" opacity=".7"/>`,
  ),
  make(
    'panda',
    'Panda',
    TERRA,
    `<circle cx="29" cy="32" r="11" fill="${INK}"/><circle cx="71" cy="32" r="11" fill="${INK}"/>
     <circle cx="50" cy="56" r="29" fill="${CREAM}"/>
     <ellipse cx="39" cy="54" rx="7.5" ry="10" transform="rotate(30 39 54)" fill="${INK}"/>
     <ellipse cx="61" cy="54" rx="7.5" ry="10" transform="rotate(-30 61 54)" fill="${INK}"/>
     <circle cx="40" cy="52.5" r="3" fill="#fff"/><circle cx="60" cy="52.5" r="3" fill="#fff"/>
     <ellipse cx="50" cy="65" rx="5" ry="3.6" fill="${INK}"/>
     <path d="M50 68V71M45.5 72.5Q50 76 54.5 72.5" ${line(INK, 2.4)}/>`,
  ),
  make(
    'tartaruga',
    'Tartaruga',
    AMBER,
    `<rect x="21" y="62" width="13" height="16" rx="6.5" fill="#9BD68A"/><rect x="56" y="62" width="13" height="16" rx="6.5" fill="#9BD68A"/>
     <path d="M72 58Q72 42 80 42Q90 42 90 52Q90 60 82 62Z" fill="#9BD68A"/>
     <path d="M12 66Q12 30 45 30Q78 30 78 66Z" ${fs(LEAF_DARK, 4)}/>
     <path d="M38 40H52L57.5 50L52 60H38L32.5 50Z" ${fs('#8FCB7F', 2.5)}/>
     <path d="M20 58Q21 50 26 44L29 50L25.5 60H20Z" ${fs('#8FCB7F', 2.5)}/>
     <path d="M70 58Q69 50 64 44L61 50L64.5 60H70Z" ${fs('#8FCB7F', 2.5)}/>
     <rect x="10" y="62" width="70" height="8" rx="4" fill="#2E6B35"/>
     ${eye(83, 50, 3)}
     <path d="M80 56Q83.5 58.5 87 56" ${line(INK, 2.2)}/>`,
  ),
  make(
    'peixe',
    'Peixe',
    GREEN_MID,
    `<path d="M70 50L86 35Q81 50 86 65Z" ${fs('#E0702E', 5)}/>
     <path d="M38 34Q47 21 60 33Z" ${fs('#E0702E', 4)}/>
     <ellipse cx="46" cy="50" rx="27" ry="19" fill="#F08A3E"/>
     <path d="M51 33Q44 50 51 67M62 37Q57 50 62 63" ${line(CREAM, 4.5)}/>
     <circle cx="32" cy="46" r="6.5" fill="${CREAM}"/>${eye(31, 46, 3.4)}
     <path d="M22 55Q25 57 28 55" ${line(INK, 2.2)}/>
     <circle cx="22" cy="27" r="3.4" ${line(CREAM, 2)}/><circle cx="30" cy="19" r="2.4" ${line(CREAM, 2)}/>`,
  ),
  make(
    'abelha',
    'Abelha',
    TEAL,
    `<ellipse cx="45" cy="33" rx="9" ry="14" transform="rotate(-25 45 33)" fill="${CREAM}" opacity=".92"/>
     <ellipse cx="62" cy="32" rx="9" ry="14" transform="rotate(25 62 32)" fill="${CREAM}" opacity=".92"/>
     <path d="M76 54L87 58L76 62Z" ${fs(INK, 3)}/>
     <ellipse cx="51" cy="58" rx="28" ry="21" fill="#F6C343"/>
     <path d="M49 37.4Q46 58 49 78.6H58Q61 58 58 37.6Z" fill="${INK}"/>
     <path d="M66 41Q69 58 66 75Q71 72 73 66Q76 58 73 50Q71 44 66 41Z" fill="${INK}"/>
     <path d="M32 42Q28 32 21 30" ${line(INK, 3)}/><circle cx="21" cy="30" r="3.5" fill="${INK}"/>
     ${eye(35, 54, 3.8)}
     <circle cx="31" cy="62" r="3.5" fill="${PINK}" opacity=".85"/>
     <path d="M34 64Q38 67 42 64" ${line(INK, 2.4)}/>`,
  ),
  make(
    'cacto',
    'Cacto',
    PLUM,
    `<path d="M41 54H33Q28 54 28 49V41M59 47H67Q72 47 72 42V34" ${line(LEAF, 10)}/>
     <rect x="39" y="20" width="22" height="48" rx="11" fill="${LEAF}"/>
     <path d="M50 26V34M45 50V56M55 52V58" ${line(LEAF_DARK, 2.4)}/>
     <circle cx="50" cy="19" r="5" fill="${PINK}"/><circle cx="50" cy="19" r="1.8" fill="#F6C343"/>
     <circle cx="45.5" cy="41" r="2.6" fill="${INK}"/><circle cx="54.5" cy="41" r="2.6" fill="${INK}"/>
     ${smile(50, 46, 3.2, INK, 2.2)}
     <path d="M33 70H67L63.5 86H36.5Z" ${fs('#E58A5C', 4)}/>
     <rect x="29" y="63" width="42" height="10" rx="5" fill="#F2A27A"/>`,
  ),
  make(
    'cogumelo',
    'Cogumelo',
    GREEN,
    `<path d="M39 58Q36 80 40 85H60Q64 80 61 58Z" ${fs(CREAM, 4)}/>
     <path d="M16 56Q18 21 50 21Q82 21 84 56Q50 65 16 56Z" ${fs('#E05A47', 4)}/>
     <circle cx="33" cy="38" r="6" fill="${CREAM}"/><circle cx="56" cy="31" r="5" fill="${CREAM}"/>
     <circle cx="70" cy="46" r="5" fill="${CREAM}"/><circle cx="47" cy="48" r="3.6" fill="${CREAM}"/>
     ${eye(45, 69, 2.8)}${eye(55, 69, 2.8)}
     ${smile(50, 74, 3.2, INK, 2.2)}`,
  ),
  make(
    'planta',
    'Planta',
    TERRA,
    `<path d="M50 62C42 46 42 30 50 16C58 30 58 46 50 62Z" ${fs(LEAF, 3)}/>
     <path d="M50 64C34 60 25 46 26 31C41 33 50 45 50 64Z" ${fs(LEAF_DARK, 3)}/>
     <path d="M50 64C66 60 75 46 74 31C59 33 50 45 50 64Z" ${fs(LEAF_DARK, 3)}/>
     <path d="M50 58V28M50 62Q38 52 32 38M50 62Q62 52 68 38" ${line('#9BD68A', 2.2)} opacity=".8"/>
     <path d="M35 68H65L61.5 86H38.5Z" ${fs(CREAM, 4)}/>
     <rect x="31" y="62" width="38" height="10" rx="5" fill="${CREAM}"/>
     <rect x="31" y="62" width="38" height="10" rx="5" fill="none" stroke="${BG}" stroke-opacity=".25" stroke-width="2"/>`,
  ),
  make(
    'sol',
    'Sol',
    GRAPHITE,
    `<path d="${rays}" ${line('#F6C343', 6)}/>
     <circle cx="50" cy="52" r="21" fill="#F6C343"/>
     <path d="M40 50Q43.5 46 47 50M53 50Q56.5 46 60 50" ${line(INK, 2.8)}/>
     <circle cx="38" cy="57" r="3.5" fill="#F08A3E" opacity=".75"/><circle cx="62" cy="57" r="3.5" fill="#F08A3E" opacity=".75"/>
     ${smile(50, 57, 5, INK, 2.8)}`,
  ),
  make(
    'lua',
    'Lua',
    GREEN_DARK,
    `<circle cx="45" cy="53" r="29" fill="#FFF0C4"/>
     <circle cx="61" cy="42" r="24" fill="${BG}"/>
     <path d="M24 56Q28.5 60 33 56" ${line(INK, 3)}/>
     <circle cx="30" cy="65" r="4" fill="${PINK}" opacity=".85"/>
     <path d="M74 56L76.2 62.8L83 65L76.2 67.2L74 74L71.8 67.2L65 65L71.8 62.8Z" ${fs('#FFF0C4', 2)}/>
     <path d="M70 22L71.3 25.7L75 27L71.3 28.3L70 32L68.7 28.3L65 27L68.7 25.7Z" ${fs('#FFF0C4', 1.5)}/>
     <circle cx="83" cy="40" r="2" fill="#FFF0C4"/>`,
  ),
]

const BY_ID = new Map(ICONS.map((a) => [a.id, a]))

export const findIcon = (id: string | undefined): StaticIcon | undefined => (id ? BY_ID.get(id) : undefined)

const HEX = /^#[0-9a-f]{6}$/i
/** cor do fundo válida (#RRGGBB) ou a original do ícone */
export const safeBg = (icon: StaticIcon, bg?: string) => (bg && HEX.test(bg) ? bg : icon.bg)

/** conteúdo interno de um <svg viewBox="0 0 100 100"> com fundo redondo */
export function iconSvg(icon: StaticIcon, bg?: string): string {
  const c = safeBg(icon, bg)
  return `<circle cx="50" cy="50" r="50" fill="${c}"/>${icon.body.split(BG).join(c)}`
}
