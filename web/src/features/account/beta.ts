import { hasStoredSession } from '../../platform/cloud/client'

/**
 * Enquanto a conta está em teste, ela só aparece para quem digitar o código de teste
 * em Ajustes (ou já tiver entrado neste aparelho). Na versão final, some este filtro.
 */
const KEY = 'controlle.beta.cloud'

export function cloudBeta(): boolean {
  try {
    return localStorage.getItem(KEY) === '1' || hasStoredSession()
  } catch {
    return false
  }
}

export function enableCloudBeta() {
  try {
    localStorage.setItem(KEY, '1')
  } catch {
    /* sem armazenamento: o cartão não aparece */
  }
}
