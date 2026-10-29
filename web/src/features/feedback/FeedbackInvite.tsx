import { useEffect, useState } from 'react'
import { FeedbackSheet } from './FeedbackSheet'
import { inviteSeen, markInviteSeen } from './feedback'

/** Na próxima abertura do app, convida (uma vez) a mandar sugestões. */
export function FeedbackInvite() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (inviteSeen()) return
    const t = window.setTimeout(() => setOpen(true), 1200)
    return () => window.clearTimeout(t)
  }, [])
  const close = () => {
    markInviteSeen()
    setOpen(false)
  }
  return <FeedbackSheet open={open} onClose={close} invite />
}
