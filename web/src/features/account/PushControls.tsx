import { useState } from 'react'
import { useToast } from '../../components/Toast'
import { PushDenied, usePush } from '../../platform/cloud/push'
import { Switch } from '../agenda/Switch'
import './account.css'

const DISMISS = 'controlle.push.prompt'

function IosHint() {
  return (
    <p className="muted push-hint">
      No iPhone, as notificações só funcionam com o Controlle na tela inicial: toque em <strong>Compartilhar</strong> e depois em{' '}
      <strong>Adicionar à Tela de Início</strong>. Abra por lá e ligue aqui.
    </p>
  )
}

function useEnable() {
  const push = usePush()
  const toast = useToast()
  const enable = () =>
    push.enable().then(
      () => toast.show('Notificações ligadas 🔔'),
      (e) =>
        toast.show(
          e instanceof PushDenied ? 'O celular bloqueou as notificações. Libere nas configurações do navegador.' : 'Não deu para ligar agora. Tente de novo.',
        ),
    )
  return { push, enable }
}

/** Interruptores dentro de "Sua conta". */
export function PushSettings() {
  const { push, enable } = useEnable()
  if (push.support === 'unsupported') return null
  return (
    <div className="push-settings">
      <h3 className="push-title">Notificações</h3>
      {push.support === 'ios-install' ? (
        <IosHint />
      ) : (
        <div className="ag-group">
          <Switch
            checked={push.on}
            onChange={(v) => !push.busy && (v ? void enable() : void push.disable())}
            label="Avisos dos amigos"
            hint={push.denied ? 'Bloqueado nas configurações do navegador.' : 'Mensagens, check-ins, reações e pedidos de amizade.'}
          />
          {push.on && (
            <Switch
              checked={push.remind}
              onChange={(v) => !push.busy && void push.setRemind(v)}
              label="Lembrete às 20h"
              hint="Se faltar marcar o dia num desafio."
            />
          )}
        </div>
      )}
    </div>
  )
}

/** Convite discreto na tela Juntos, até a pessoa ligar ou dispensar. */
export function PushPrompt() {
  const { push, enable } = useEnable()
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem(DISMISS) === '1'
    } catch {
      return false
    }
  })
  if (hidden || !push.ready || push.on || push.denied || push.support === 'unsupported') return null
  const dismiss = () => {
    setHidden(true)
    try {
      localStorage.setItem(DISMISS, '1')
    } catch {
      /* sem armazenamento: some só nesta visita */
    }
  }
  return (
    <div className="card push-prompt">
      <span className="push-bell" aria-hidden="true">
        🔔
      </span>
      <div className="push-prompt-text">
        <strong>Saber quando a turma posta</strong>
        {push.support === 'ios-install' ? (
          <IosHint />
        ) : (
          <p className="muted">Avisamos de mensagens, check-ins e reações, e lembramos às 20h se faltar marcar o dia.</p>
        )}
        <div className="push-prompt-actions">
          {push.support === 'ok' && (
            <button type="button" className="btn btn-primary btn-small" disabled={push.busy} onClick={() => void enable()}>
              Ligar notificações
            </button>
          )}
          <button type="button" className="btn btn-ghost btn-small" onClick={dismiss}>
            Agora não
          </button>
        </div>
      </div>
    </div>
  )
}
