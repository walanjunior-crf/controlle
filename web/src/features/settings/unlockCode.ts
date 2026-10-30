/**
 * Código que libera todas as peças do avatar neste aparelho. Guardamos só o SHA-256
 * do código normalizado (minúsculas, sem acento nem espaços), nunca o texto.
 */
const HASH = '3499dd1da9f70dcc3258929cb81ce2a05028bf116fd05db67730874566f938be'

export const normalizeCode = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, '')

export async function checkUnlockCode(input: string): Promise<boolean> {
  const code = normalizeCode(input)
  if (!code || !globalThis.crypto?.subtle) return false
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code))
  const hex = [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
  return hex === HASH
}
