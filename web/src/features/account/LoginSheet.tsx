import { useEffect, useId, useState } from 'react'
import { Sheet } from '../../components/Sheet'
import { sendLoginCode, verifyLoginCode } from '../../platform/cloud/client'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Entrar com e-mail: o app manda um código numérico (8 dígitos neste projeto), sem senha. */
export function LoginSheet({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const ids = { email: useId(), code: useId() }
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setStep('email')
    setCode('')
    setError('')
  }, [open])

  const send = async () => {
    const e = email.trim().toLowerCase()
    if (!EMAIL.test(e)) return setError('Confira o e-mail.')
    setBusy(true)
    setError('')
    try {
      await sendLoginCode(e)
      setEmail(e)
      setStep('code')
    } catch (err) {
      const msg = String((err as { message?: string })?.message ?? '')
      setError(/rate|limit|seconds/i.test(msg) ? 'Muitos pedidos seguidos. Espere um minuto e tente de novo.' : 'Não foi possível enviar agora. Confira a internet e tente de novo.')
    } finally {
      setBusy(false)
    }
  }

  const verify = async () => {
    const c = code.replace(/\D/g, '')
    if (c.length < 6) return setError('Digite o código completo que chegou no e-mail.')
    setBusy(true)
    setError('')
    try {
      await verifyLoginCode(email, c)
      onDone()
    } catch {
      setError('Código errado ou vencido. Confira o e-mail mais recente ou peça outro.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={step === 'email' ? 'Entrar na sua conta' : 'Digite o código'}
      footer={
        <div className="feedback-actions">
          {step === 'email' ? (
            <button type="button" className="btn btn-primary btn-block" disabled={busy} onClick={() => void send()}>
              {busy ? 'Enviando…' : 'Receber código por e-mail'}
            </button>
          ) : (
            <>
              <button type="button" className="btn btn-primary btn-block" disabled={busy} onClick={() => void verify()}>
                {busy ? 'Conferindo…' : 'Entrar'}
              </button>
              <button type="button" className="btn btn-ghost btn-block" disabled={busy} onClick={() => setStep('email')}>
                Usar outro e-mail
              </button>
            </>
          )}
        </div>
      }
    >
      {step === 'email' ? (
        <form
          className="field"
          onSubmit={(e) => {
            e.preventDefault()
            void send()
          }}
        >
          <p className="muted login-text">Com a conta, seus hábitos ficam guardados na nuvem e você pode jogar com amigos. Sem senha: mandamos um código para o seu e-mail.</p>
          <label className="field-label" htmlFor={ids.email}>
            E-mail
          </label>
          <input id={ids.email} className="input" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} placeholder="voce@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </form>
      ) : (
        <form
          className="field"
          onSubmit={(e) => {
            e.preventDefault()
            void verify()
          }}
        >
          <p className="muted login-text">
            Mandamos um código de 8 números para <strong>{email}</strong>. Pode levar um minutinho; confira também o spam.
          </p>
          <label className="field-label" htmlFor={ids.code}>
            Código
          </label>
          <input id={ids.code} className="input login-code num" inputMode="numeric" autoComplete="one-time-code" maxLength={10} placeholder="00000000" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
        </form>
      )}
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </Sheet>
  )
}
