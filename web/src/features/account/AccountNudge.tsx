import { useEffect, useId, useState } from 'react'
import { Sheet } from '../../components/Sheet'
import { useToast } from '../../components/Toast'
import { saveProfile } from '../../db/db'
import { useSession } from '../../platform/cloud/client'
import { handleTaken } from '../../platform/cloud/social'
import { CheckRow } from '../agenda/Switch'
import { useProfileLoaded } from '../profile/Avatar'
import { HANDLE_MAX, handleError, normalizeHandle } from '../profile/profileText'
import { afterWhatsNew } from '../whatsnew/WhatsNew'
import { LoginSheet } from './LoginSheet'
import './account.css'

const OFF = 'controlle.account.nudge.off'

const isOff = () => {
  try {
    return localStorage.getItem(OFF) === '1'
  } catch {
    return true
  }
}

// O tutorial das notificações espera este convite sair da tela.
let finished = false
const waiting = new Set<() => void>()
function finish() {
  if (finished) return
  finished = true
  waiting.forEach((f) => f())
  waiting.clear()
}
export function afterAccountNudge(cb: () => void): () => void {
  if (finished) cb()
  else waiting.add(cb)
  return () => void waiting.delete(cb)
}

/**
 * A cada abertura do app, quem ainda não tem conta (e-mail) ou apelido recebe o
 * convite para completar, até completar ou marcar "não mostrar mais".
 */
export function AccountNudge() {
  const { ready, session } = useSession()
  const profile = useProfileLoaded()
  const [phase, setPhase] = useState<'wait' | 'open' | 'done'>('wait')

  const complete = Boolean(session && profile?.handle)

  useEffect(() => {
    if (phase !== 'wait' || !ready || !profile) return
    if (isOff() || complete) {
      setPhase('done')
      finish()
      return
    }
    let t = 0
    const stop = afterWhatsNew(() => {
      t = window.setTimeout(() => setPhase('open'), 900)
    })
    return () => {
      stop()
      window.clearTimeout(t)
    }
  }, [phase, ready, profile, complete])

  if (phase !== 'open') return null
  return (
    <NudgeSheet
      onClose={() => {
        setPhase('done')
        finish()
      }}
    />
  )
}

function NudgeSheet({ onClose }: { onClose: () => void }) {
  const { session } = useSession()
  const profile = useProfileLoaded()
  const toast = useToast()
  const id = useId()
  const [login, setLogin] = useState(false)
  const [never, setNever] = useState(false)
  const [handle, setHandle] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const hasHandle = Boolean(profile?.handle)
  const logged = Boolean(session)

  // entrou e já tinha apelido: está tudo certo
  useEffect(() => {
    if (!logged || !hasHandle) return
    const t = window.setTimeout(onClose, 1200)
    return () => window.clearTimeout(t)
  }, [logged, hasHandle, onClose])

  const close = () => {
    if (never) {
      try {
        localStorage.setItem(OFF, '1')
      } catch {
        /* sem armazenamento */
      }
    }
    onClose()
  }

  const saveHandle = async () => {
    const e = handleError(handle) ?? (handle ? null : 'Escolha um apelido.')
    if (e) return setErr(e)
    setBusy(true)
    try {
      if (await handleTaken(handle)) return setErr(`@${handle} já é de outra pessoa. Tente outro.`)
      await saveProfile({ handle })
      toast.show(`Pronto, você é @${handle} 🎉`)
      onClose()
    } catch {
      setErr('Não deu para conferir agora. Tente de novo.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Sheet
        open={!login}
        onClose={close}
        title={logged ? 'Falta só o apelido' : 'Crie sua conta no Controlle'}
        footer={
          <div className="feedback-actions">
            {!logged ? (
              <button type="button" className="btn btn-primary btn-block" onClick={() => setLogin(true)}>
                Entrar com e-mail
              </button>
            ) : (
              <button type="button" className="btn btn-primary btn-block" disabled={busy} onClick={() => void saveHandle()}>
                Salvar apelido
              </button>
            )}
            <button type="button" className="btn btn-ghost btn-block" onClick={close}>
              {never ? 'Fechar' : 'Agora não'}
            </button>
          </div>
        }
      >
        <p className="nt-lead">
          Com conta, seus hábitos ficam guardados na nuvem e voltam se você trocar de celular. Com um apelido, os amigos te acham para fazer
          desafios juntos.
        </p>
        <ol className="nt-steps">
          <li className={`nt-step${logged ? ' is-done' : ''}`}>
            <span className="nt-num" aria-hidden="true">
              {logged ? '✓' : 1}
            </span>
            <span className="nt-text">{logged ? `Conta: ${session?.user.email}` : 'Entre com seu e-mail. Chega um código, sem senha.'}</span>
          </li>
          <li className={`nt-step nt-step-col${hasHandle ? ' is-done' : ''}`}>
            <span className="nt-step-row">
              <span className="nt-num" aria-hidden="true">
                {hasHandle ? '✓' : 2}
              </span>
              <span className="nt-text">{hasHandle ? `Apelido: @${profile?.handle}` : 'Escolha um apelido único.'}</span>
            </span>
            {logged && !hasHandle && (
              <span className="nt-handle">
                <span className={`handle-input${err ? ' is-invalid' : ''}`}>
                  <span className="handle-at" aria-hidden="true">
                    @
                  </span>
                  <input
                    className="input"
                    type="text"
                    aria-label="Apelido"
                    aria-invalid={err ? true : undefined}
                    aria-describedby={`${id}-h`}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder="seuapelido"
                    maxLength={HANDLE_MAX + 1}
                    value={handle}
                    onChange={(e) => {
                      setHandle(normalizeHandle(e.target.value))
                      setErr(null)
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && void saveHandle()}
                  />
                </span>
                <span className={err ? 'field-error' : 'field-hint'} id={`${id}-h`}>
                  {err ?? 'Letras minúsculas, números, ponto e _.'}
                </span>
              </span>
            )}
          </li>
        </ol>
        <div className="nt-never">
          <CheckRow checked={never} onChange={setNever} label="Não mostrar mais este aviso" />
        </div>
      </Sheet>
      <LoginSheet
        open={login}
        onClose={() => setLogin(false)}
        onDone={() => {
          setLogin(false)
          toast.show('Conta criada! Agora escolha seu apelido.')
        }}
      />
    </>
  )
}
