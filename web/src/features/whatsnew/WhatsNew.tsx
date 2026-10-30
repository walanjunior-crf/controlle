import { useEffect, useState } from 'react'
import { Sheet } from '../../components/Sheet'
import { APP_VERSION } from '../../version'
import { inviteSeen } from '../feedback/feedback'
import { unseenNotes, type ReleaseNote } from './notes'

const KEY = 'controlle.whatsnew.seen'

/** última versão cujas novidades a pessoa viu; sem registro = usava o app antes desta tela */
function lastSeen(): string {
  try {
    return localStorage.getItem(KEY) ?? '0.0.0'
  } catch {
    return APP_VERSION
  }
}

/** quem acabou de instalar não precisa de novidades: chame ao terminar o primeiro acesso */
export function markSeen() {
  try {
    localStorage.setItem(KEY, APP_VERSION)
  } catch {
    /* sem armazenamento: só não lembra entre sessões */
  }
}

/** Resumo das novidades, uma vez por atualização (depois do convite de sugestões, se houver). */
export function WhatsNew() {
  const [notes, setNotes] = useState<ReleaseNote[]>([])
  useEffect(() => {
    if (!inviteSeen()) return // o convite de sugestões vem primeiro; as novidades ficam para a próxima abertura
    const seen = lastSeen()
    const list = unseenNotes(seen, APP_VERSION)
    if (!list.length) {
      markSeen()
      return
    }
    const t = window.setTimeout(() => setNotes(list), 900)
    return () => window.clearTimeout(t)
  }, [])

  const close = () => {
    markSeen()
    setNotes([])
  }
  const [first] = notes
  return (
    <Sheet
      open={notes.length > 0}
      onClose={close}
      title={first ? `Novidades da versão ${first.version}` : ''}
      footer={
        <button type="button" className="btn btn-primary btn-block" onClick={close}>
          Entendi
        </button>
      }
    >
      {notes.map((n) => (
        <div key={n.version} className="wn-release">
          <p className="wn-title">{n.title}</p>
          <ul className="wn-list">
            {n.items.map((it, i) => (
              <li key={i}>
                <span className="wn-icon" aria-hidden="true">
                  {it.icon}
                </span>
                <span>{it.text}</span>
              </li>
            ))}
          </ul>
          {notes.length > 1 && n !== notes[notes.length - 1] && <hr className="wn-sep" />}
        </div>
      ))}
    </Sheet>
  )
}
