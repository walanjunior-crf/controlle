import { useEffect, useState, type ReactNode } from 'react'
import { Sheet } from '../../components/Sheet'
import { useToast } from '../../components/Toast'
import { useSession } from '../../platform/cloud/client'
import { PushDenied, pushSupport, usePush } from '../../platform/cloud/push'
import { afterAccountNudge } from './AccountNudge'
import { LoginSheet } from './LoginSheet'
import './account.css'

const KEY = 'controlle.push.tutorial.v1'

const seen = () => {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return true
  }
}
const markSeen = () => {
  try {
    localStorage.setItem(KEY, '1')
  } catch {
    /* sem armazenamento: aparece de novo na próxima abertura */
  }
}

/** ícone "Compartilhar" do Safari, para a pessoa reconhecer na tela */
const ShareIcon = () => (
  <svg className="nt-share" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3v12M8 7l4-4 4 4" />
    <path d="M6 11H5v10h14V11h-1" />
  </svg>
)

function Step({ n, done, children }: { n: number; done?: boolean; children: ReactNode }) {
  return (
    <li className={`nt-step${done ? ' is-done' : ''}`}>
      <span className="nt-num" aria-hidden="true">
        {done ? '✓' : n}
      </span>
      <span className="nt-text">{children}</span>
    </li>
  )
}

/**
 * Tutorial de uma vez só (por aparelho), depois das novidades: ensina a ligar as
 * notificações. No iPhone fora da tela inicial, ensina a instalar primeiro.
 */
export function NotifyTutorial() {
  const [open, setOpen] = useState(false)
  const support = pushSupport()

  useEffect(() => {
    if (seen() || support === 'unsupported') return
    let t = 0
    const stop = afterAccountNudge(() => {
      t = window.setTimeout(() => setOpen(true), 1200)
    })
    return () => {
      stop()
      window.clearTimeout(t)
    }
  }, [support])

  if (!open) return null
  return <TutorialSheet onClose={() => (markSeen(), setOpen(false))} />
}

function TutorialSheet({ onClose }: { onClose: () => void }) {
  const push = usePush()
  const { session } = useSession()
  const toast = useToast()
  const [login, setLogin] = useState(false)

  // já ligadas ou bloqueadas no aparelho: nada a ensinar
  useEffect(() => {
    if (push.ready && (push.on || push.denied)) onClose()
  }, [push.ready, push.on, push.denied, onClose])

  const ios = push.support === 'ios-install'
  const enable = () =>
    push.enable().then(
      () => {
        toast.show('Notificações ligadas 🔔')
        onClose()
      },
      (e) =>
        toast.show(
          e instanceof PushDenied ? 'O celular bloqueou as notificações. Libere nas configurações do navegador.' : 'Não deu para ligar agora. Tente de novo.',
        ),
    )

  return (
    <>
      <Sheet
        open={!login}
        onClose={onClose}
        title="Ligue as notificações"
        footer={
          <div className="feedback-actions">
            {ios ? (
              <button type="button" className="btn btn-primary btn-block" onClick={onClose}>
                Entendi
              </button>
            ) : !session ? (
              <button type="button" className="btn btn-primary btn-block" onClick={() => setLogin(true)}>
                Entrar com e-mail
              </button>
            ) : (
              <button type="button" className="btn btn-primary btn-block" disabled={push.busy || !push.ready} onClick={() => void enable()}>
                Ligar notificações
              </button>
            )}
            <button type="button" className="btn btn-ghost btn-block" onClick={onClose}>
              Agora não
            </button>
          </div>
        }
      >
        <div className="nt-hero" aria-hidden="true">
          <span className="nt-bell">🔔</span>
        </div>
        <p className="nt-lead">
          Saiba na hora quando a turma posta um check-in, manda mensagem ou reage ao seu, e receba um lembrete às 20h se faltar marcar o dia
          num desafio.
        </p>
        {ios ? (
          <ol className="nt-steps">
            <Step n={1}>
              No Safari, toque em <strong>Compartilhar</strong> <ShareIcon />
            </Step>
            <Step n={2}>
              Escolha <strong>Adicionar à Tela de Início</strong>
            </Step>
            <Step n={3}>Abra o Controlle pelo ícone novo: lá aparece o botão para ligar.</Step>
          </ol>
        ) : (
          <ol className="nt-steps">
            <Step n={1} done={Boolean(session)}>
              {session ? 'Você já entrou na sua conta.' : <>Entre com seu e-mail, para os avisos chegarem só para você.</>}
            </Step>
            <Step n={2}>
              Toque em <strong>Ligar notificações</strong> e depois em <strong>Permitir</strong>.
            </Step>
          </ol>
        )}
        <p className="muted nt-foot">Dá para mudar quando quiser em Perfil → selo da nuvem.</p>
      </Sheet>
      <LoginSheet
        open={login}
        onClose={() => setLogin(false)}
        onDone={() => {
          setLogin(false)
          toast.show('Pronto! Agora é só ligar.')
        }}
      />
    </>
  )
}
