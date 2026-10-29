import { useId, useState } from 'react'
import { Sheet } from '../../components/Sheet'
import { useToast } from '../../components/Toast'
import { useProfile } from '../profile/Avatar'
import { FEEDBACK_EMAIL, MESSAGE_MAX, mailtoFor } from './feedback'
import './feedback.css'

interface Props {
  open: boolean
  onClose: () => void
  /** convite automático da primeira abertura (texto de boas-vindas) */
  invite?: boolean
}

export function FeedbackSheet({ open, onClose, invite = false }: Props) {
  const profile = useProfile()
  const toast = useToast()
  const ids = { text: useId(), hint: useId() }
  const [text, setText] = useState('')

  const send = () => {
    window.location.href = mailtoFor(text, profile.displayName)
    toast.show('Abrindo o seu app de e-mail…')
    setText('')
    onClose()
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(FEEDBACK_EMAIL)
      toast.show('E-mail copiado')
    } catch {
      toast.show(`Copie o endereço: ${FEEDBACK_EMAIL}`)
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={invite ? 'Conta pra gente o que achou' : 'Enviar uma sugestão'}
      footer={
        <div className="feedback-actions">
          <button type="button" className="btn btn-primary btn-block" disabled={!text.trim()} onClick={send}>
            Enviar por e-mail
          </button>
          <button type="button" className="btn btn-ghost btn-block" onClick={onClose}>
            {invite ? 'Agora não' : 'Cancelar'}
          </button>
        </div>
      }
    >
      <div className="feedback">
        <p className="muted">
          {invite
            ? 'Você faz parte do grupo que está testando o Controlle. Ideias, coisas que faltaram ou algo que deu errado: escreva aqui e mande direto para o e-mail do app.'
            : 'Escreva sua ideia, o que faltou ou o que deu errado. Ao enviar, o seu app de e-mail abre com tudo preenchido.'}
        </p>
        <label className="field-label" htmlFor={ids.text}>
          Sua sugestão
        </label>
        <textarea
          id={ids.text}
          className="input feedback-text"
          rows={5}
          maxLength={MESSAGE_MAX}
          placeholder="Ex.: queria poder marcar dois hábitos de uma vez"
          value={text}
          aria-describedby={ids.hint}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="feedback-mail" id={ids.hint}>
          <span>
            Vai para <strong className="feedback-address">{FEEDBACK_EMAIL}</strong>
          </span>
          <button type="button" className="btn btn-small btn-ghost" onClick={() => void copy()}>
            Copiar e-mail
          </button>
        </div>
        <p className="field-hint">Se o e-mail não abrir, copie o endereço e mande pelo app que preferir.</p>
      </div>
    </Sheet>
  )
}
