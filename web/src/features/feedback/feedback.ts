import { APP_VERSION } from '../../version'

/** Caixa de entrada das sugestões do grupo de teste (aparece no app). */
export const FEEDBACK_EMAIL = 'sugestoescontrolle@gmail.com'

/** Marca que o convite automático já foi mostrado neste aparelho. */
const SEEN_KEY = 'controlle.feedback.invite.v1'

export function inviteSeen(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === '1'
  } catch {
    return true // sem armazenamento, não insiste
  }
}

export function markInviteSeen() {
  try {
    localStorage.setItem(SEEN_KEY, '1')
  } catch {
    /* sem armazenamento: só não lembra */
  }
}

export const MESSAGE_MAX = 2000

/** Link mailto com assunto e corpo prontos; o texto vai codificado. */
export function mailtoFor(message: string, name: string): string {
  const subject = `Sugestão para o Controlle (v${APP_VERSION})`
  const body =
    `${message.trim()}\n\n` +
    `—\n${name.trim() ? `De: ${name.trim()}\n` : ''}Versão: ${APP_VERSION}\nAparelho: ${navigator.userAgent}`
  return `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
