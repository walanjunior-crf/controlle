import { useState } from 'react'
import { IconClose, IconShare } from '../../components/icons'
import { readLocal, writeLocal } from '../../hooks/storage'
import { isStandalone, platformHint, useInstallPrompt } from '../../platform/install'

const KEY = 'controlle.installDismissed'

/** Instruções para adicionar à Tela de Início no iPhone (reutilizado em Ajustes). */
export function IosInstallSteps() {
  return (
    <ol className="install-steps">
      <li>
        Abra o Controlle no <strong>Safari</strong>.
      </li>
      <li>
        Toque em <strong>Compartilhar</strong> <IconShare size={18} className="inline-icon" /> na barra de baixo.
      </li>
      <li>
        Escolha <strong>Adicionar à Tela de Início</strong> e toque em <strong>Adicionar</strong>.
      </li>
    </ol>
  )
}

export function InstallBanner() {
  const [dismissed, setDismissed] = useState(() => readLocal(KEY) === '1')
  const { canPrompt, prompt } = useInstallPrompt()
  if (dismissed || isStandalone()) return null
  const hint = platformHint()
  if ((hint === 'android' || hint === 'desktop') && !canPrompt) return null

  const close = () => {
    writeLocal(KEY, '1')
    setDismissed(true)
  }

  return (
    <aside className="install-banner" aria-label="Instalar o app">
      <div className="install-copy">
        <strong>Instale o Controlle</strong>
        {hint === 'ios-safari' && (
          <span>
            Toque em Compartilhar <IconShare size={16} className="inline-icon" /> → Adicionar à Tela de Início.
          </span>
        )}
        {hint === 'ios-other' && <span>Abra este endereço no Safari para adicionar à Tela de Início.</span>}
        {(hint === 'android' || hint === 'desktop') && <span>Abre como app, em tela cheia, e funciona sem internet.</span>}
      </div>
      {(hint === 'android' || hint === 'desktop') && canPrompt && (
        <button type="button" className="btn btn-small btn-primary" onClick={() => void prompt()}>
          Instalar
        </button>
      )}
      <button type="button" className="icon-btn" aria-label="Dispensar" onClick={close}>
        <IconClose size={18} />
      </button>
    </aside>
  )
}
