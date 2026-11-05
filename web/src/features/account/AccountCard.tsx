import { useState } from 'react'
import { Sheet } from '../../components/Sheet'
import { useToast } from '../../components/Toast'
import { signOut, useSession } from '../../platform/cloud/client'
import { forgetCloudLink, syncNow, useCloudStatus } from '../../platform/cloud/useCloudSync'
import { disablePush } from '../../platform/cloud/push'
import { LoginSheet } from './LoginSheet'
import { PushSettings } from './PushControls'
import './account.css'

const ago = (t: number) => {
  const s = Math.round((Date.now() - t) / 1000)
  if (s < 60) return 'agora mesmo'
  const m = Math.round(s / 60)
  if (m < 60) return `há ${m} min`
  const h = Math.round(m / 60)
  return h < 24 ? `há ${h} h` : `há ${Math.round(h / 24)} dias`
}

/**
 * Conta no Perfil, discreta: um selo embaixo do nome. Sem conta, convida a guardar
 * na nuvem; com conta, mostra se está em dia e abre os detalhes (e-mail, sair).
 */
export function AccountChip() {
  const { ready, session } = useSession()
  const status = useCloudStatus()
  const toast = useToast()
  const [login, setLogin] = useState(false)
  const [details, setDetails] = useState(false)

  if (!ready) return null

  if (!session) {
    return (
      <>
        <button type="button" className="account-chip" onClick={() => setLogin(true)}>
          <span aria-hidden="true">☁️</span> Guardar na nuvem
        </button>
        <LoginSheet
          open={login}
          onClose={() => setLogin(false)}
          onDone={() => {
            setLogin(false)
            toast.show('Pronto! Seus hábitos agora têm cópia na nuvem.')
          }}
        />
      </>
    )
  }

  const error = status.phase === 'error'
  const short = status.phase === 'syncing' ? 'Sincronizando…' : error ? 'Sem sincronizar' : 'Na nuvem'
  const line =
    status.phase === 'syncing'
      ? 'Sincronizando…'
      : error
        ? status.message ?? 'Não foi possível sincronizar.'
        : status.lastAt
          ? `Cópia atualizada ${ago(status.lastAt)}.`
          : 'Cópia na nuvem ligada.'

  return (
    <>
      <button type="button" className={`account-chip is-on${error ? ' is-error' : ''}`} onClick={() => setDetails(true)} aria-label={`Conta: ${line}`}>
        <span aria-hidden="true">{error ? '⚠️' : '☁️'}</span> {short}
      </button>
      <Sheet
        open={details}
        onClose={() => setDetails(false)}
        title="Sua conta"
        footer={
          <div className="feedback-actions">
            <button type="button" className="btn btn-primary btn-block" disabled={status.phase === 'syncing'} onClick={() => void syncNow()}>
              Sincronizar agora
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-block"
              onClick={async () => {
                await disablePush().catch(() => {})
                await signOut()
                forgetCloudLink()
                setDetails(false)
                toast.show('Você saiu da conta. Os dados continuam neste aparelho.')
              }}
            >
              Sair da conta
            </button>
          </div>
        }
      >
        <p className="account-email">{session.user.email}</p>
        <p className={`muted account-line${error ? ' is-error' : ''}`} role="status">
          {line}
        </p>
        <p className="muted account-note">Seus hábitos ficam guardados na nuvem e voltam sozinhos se você trocar de celular. Só você vê seus registros.</p>
        <PushSettings />
      </Sheet>
    </>
  )
}
