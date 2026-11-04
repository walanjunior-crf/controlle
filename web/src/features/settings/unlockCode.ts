/**
 * Código que libera todas as peças do avatar neste aparelho. Guardamos só o SHA-256
 * do código normalizado (minúsculas, sem acento nem espaços), nunca o texto.
 */
const HASH = '3499dd1da9f70dcc3258929cb81ce2a05028bf116fd05db67730874566f938be'

export const normalizeCode = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, '')

/** código de teste da conta (v0.6) */
const BETA_HASH = 'dd26c14597fcbcdd89627806bfa199b56a6a13918c9d9e6d5ffe415caa01fc44'

async function sha(input: string): Promise<string | null> {
  const code = normalizeCode(input)
  if (!code || !globalThis.crypto?.subtle) return null
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function checkUnlockCode(input: string): Promise<boolean> {
  return (await sha(input)) === HASH
}

export async function checkBetaCode(input: string): Promise<boolean> {
  return (await sha(input)) === BETA_HASH
}
