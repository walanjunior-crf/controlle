import { useState } from 'react'
import { useToast } from '../../components/Toast'
import { signOut, useSession } from '../../platform/cloud/client'
import { forgetCloudLink, syncNow, useCloudStatus } from '../../platform/cloud/useCloudSync'
import { LoginSheet } from './LoginSheet'
import './account.css'

const ago = (t: number) => {
  const s = Math.round((Date.now() - t) / 1000)
  if (s < 60) return 'agora mesmo'
  const m = Math.round(s / 60)
  if (m < 60) return `há ${m} min`
  const h = Math.round(m / 60)
  return h < 24 ? `há ${h} h` : `há ${Math.round(h / 24)} dias`
}

/** Conta no Perfil: entrar, estado da cópia na nuvem, sair. */
export function AccountCard() {
  const { ready, session } = useSession()
  const status = useCloudStatus()
  const toast = useToast()
  const [login, setLogin] = useState(false)

  if (!ready) return <div className="card account-card" aria-busy="true" />

  if (!session) {
    return (
      <>
        <button type="button" className="card account-card account-cta" onClick={() => setLogin(true)}>
          <span className="account-icon" aria-hidden="true">
            ☁️
          </span>
          <span className="account-text">
            <strong>Criar conta ou entrar</strong>
            <span className="muted">Guarde seus hábitos na nuvem e jogue com amigos.</span>
          </span>
          <span className="col-entry-go" aria-hidden="true">
            ›
          </span>
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

  const line =
    status.phase === 'syncing'
      ? 'Sincronizando…'
      : status.phase === 'error'
        ? status.message ?? 'Não foi possível sincronizar.'
        : status.lastAt
          ? `Cópia na nuvem atualizada ${ago(status.lastAt)}`
          : 'Cópia na nuvem ligada'

  return (
    <div className="card account-card">
      <span className="account-icon" aria-hidden="true">
        {status.phase === 'error' ? '⚠️' : '☁️'}
      </span>
      <span className="account-text">
        <strong>{session.user.email}</strong>
        <span className={`muted${status.phase === 'error' ? ' is-error' : ''}`} role="status">
          {line}
        </span>
      </span>
      <span className="account-actions">
        <button type="button" className="btn btn-small btn-ghost" onClick={() => void syncNow()} disabled={status.phase === 'syncing'}>
          Sincronizar
        </button>
        <button
          type="button"
          className="btn btn-small btn-ghost"
          onClick={async () => {
            await signOut()
            forgetCloudLink()
            toast.show('Você saiu da conta. Os dados continuam neste aparelho.')
          }}
        >
          Sair
        </button>
      </span>
    </div>
  )
}
