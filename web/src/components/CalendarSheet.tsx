import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { formatMinuteOfDay } from '../domain'
import type { Weekday } from '../domain/types'
import {
  buildICS,
  calendarFilename,
  calendarNeedsSafariHint,
  currentAppUrl,
  openCalendarFile,
  shareCalendarFile,
} from '../platform/calendar'
import { Sheet } from './Sheet'
import { useToast } from './Toast'

const DAY_LETTERS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

function daysLabel(weekdays: Weekday[]): string {
  if (weekdays.length === 0 || weekdays.length === 7) return 'todo dia'
  const set = new Set(weekdays)
  if (set.size === 5 && [1, 2, 3, 4, 5].every((d) => set.has(d as Weekday))) return 'seg a sex'
  return [...set].sort((a, b) => a - b).map((d) => DAY_LETTERS[d]).join(', ')
}

interface Props {
  open: boolean
  onClose: () => void
  /** Só os lembretes deste tracker; sem ele, todos. */
  trackerId?: string
}

/** Folha que explica e gera o arquivo de agenda com os lembretes. */
export function CalendarSheet({ open, onClose, trackerId }: Props) {
  const toast = useToast()
  const data = useLiveQuery(async () => {
    const [trackers, reminders] = await Promise.all([db.trackers.toArray(), db.reminders.toArray()])
    return { trackers, reminders: trackerId ? reminders.filter((r) => r.trackerId === trackerId) : reminders }
  }, [trackerId])

  const trackers = data?.trackers ?? []
  const byId = new Map(trackers.map((t) => [t.id, t]))
  const items = (data?.reminders ?? [])
    .filter((r) => r.enabled && byId.get(r.trackerId) && !byId.get(r.trackerId)!.archived)
    .sort((a, b) => a.minuteOfDay - b.minuteOfDay)
  const single = trackerId ? byId.get(trackerId) : undefined

  const make = () => {
    const { ics } = buildICS(trackers, items, { appUrl: currentAppUrl() })
    return { ics, filename: calendarFilename(single?.name) }
  }

  const add = () => {
    const { ics, filename } = make()
    openCalendarFile(ics, filename)
  }

  const share = async () => {
    const { ics, filename } = make()
    const ok = await shareCalendarFile(ics, filename)
    if (!ok) toast.show('Não deu para compartilhar aqui. Use “Adicionar ao calendário”.')
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={single ? `Lembretes de ${single.name}` : 'Lembretes no calendário'}
      footer={
        items.length > 0 ? (
          <div className="calendar-actions">
            <button type="button" className="btn btn-primary" onClick={add}>
              Adicionar ao calendário
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => void share()}>
              Compartilhar arquivo
            </button>
          </div>
        ) : undefined
      }
    >
      <p className="calendar-lead">
        O app cria eventos repetidos com alerta na hora. Assim o próprio celular avisa, mesmo com o Controlle fechado.
      </p>

      {items.length === 0 ? (
        <p className="field-hint">
          {single
            ? 'Este tracker ainda não tem horários de lembrete. Adicione um horário e salve.'
            : 'Nenhum tracker tem horário de lembrete ainda. Defina os horários ao criar ou editar um tracker.'}
        </p>
      ) : (
        <ul className="calendar-list">
          {items.map((r) => {
            const t = byId.get(r.trackerId)!
            return (
              <li key={r.id}>
                <span className="calendar-icon" aria-hidden="true">
                  {t.icon}
                </span>
                <span className="calendar-name">{t.name}</span>
                <span className="calendar-when num">
                  {formatMinuteOfDay(r.minuteOfDay)} · {daysLabel(r.weekdays)}
                </span>
              </li>
            )
          })}
        </ul>
      )}

      <div className="calendar-tips">
        <p className="field-hint">
          <strong>Dica:</strong> no iPhone, crie antes um calendário chamado “Controlle” no app Calendário e escolha ele na
          hora de adicionar. Assim fica fácil apagar ou esconder tudo de uma vez.
        </p>
        <p className="field-hint">
          O calendário avisa sempre no horário, mesmo que você já tenha registrado. Se mudar os horários, apague os
          eventos antigos e adicione de novo.
        </p>
        {calendarNeedsSafariHint() && (
          <p className="field-hint">
            Se nada acontecer, toque em <strong>Compartilhar arquivo</strong> → <strong>Salvar em Arquivos</strong>. Depois
            abra o arquivo no app Arquivos e toque em <strong>Adicionar Tudo</strong>.
          </p>
        )}
      </div>
    </Sheet>
  )
}
