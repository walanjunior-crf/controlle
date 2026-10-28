/** Regras de texto do perfil (puras, testáveis). */

export const HANDLE_MIN = 3
export const HANDLE_MAX = 20
export const BIO_MAX = 80
export const NAME_MAX = 30

/**
 * Normaliza o apelido enquanto a pessoa digita: tira o @, acentos e espaços,
 * passa para minúsculas e mantém só letras, números, ponto e _ (até 20).
 */
export function normalizeHandle(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, '')
    .slice(0, HANDLE_MAX)
}

/** Mensagem de erro do apelido, ou null se ok. Vazio é permitido (opcional). */
export function handleError(handle: string): string | null {
  if (handle === '') return null
  if (handle.length < HANDLE_MIN) return `Use pelo menos ${HANDLE_MIN} caracteres.`
  if (/^[._]|[._]$/.test(handle)) return 'Comece e termine com letra ou número.'
  if (/[._]{2}/.test(handle)) return 'Evite dois símbolos seguidos.'
  return null
}

/** 1–2 letras para o avatar de iniciais: primeira e última palavra. */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return ''
  const first = (w: string) => Array.from(w)[0]?.toLocaleUpperCase('pt-BR') ?? ''
  if (words.length === 1) return first(words[0])
  return first(words[0]) + first(words[words.length - 1])
}
