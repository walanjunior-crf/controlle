import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import { db } from '../../db/db'
import { hasOccurrenceFrom } from '../../domain/agenda'
import type { DayKey } from '../../domain/types'
import { SegmentedControl } from '../../components/controls'
import { Sheet } from '../../components/Sheet'
import { useToast } from '../../components/Toast'
import { agendaFilename, buildAgendaICS } from '../../platform/agendaIcs'
import { calendarNeedsSafariHint, currentAppUrl, openCalendarFile, shareCalendarFile } from '../../platform/calendar'
import { CheckRow } from './Switch'
import './agenda.css'

type Range = 'all' | 'upcoming'

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** Folha "Exportar para a agenda do celular". */
export function AgendaExportSheet({ open, onClose, today }: { open: boolean; onClose: () => void; today: DayKey }) {
  const toast = useToast()
  const [withEvents, setWithEvents] = useState(true)
  const [withHabits, setWithHabits] = useState(true)
  const [range, setRange] = useState<Range>('upcoming')

  const data = useLiveQuery(async () => {
    const [events, trackers, reminders] = await Promise.all([db.events.toArray(), db.trackers.toArray(), db.reminders.toArray()])
    return { events, trackers, reminders }
  }, [])

  const events = useMemo(
    () => (data?.events ?? []).filter((e) => range === 'all' || hasOccurrenceFrom(e, today)),
    [data, range, today],
  )
  const habitCount = useMemo(() => {
    if (!data) return 0
    const active = new Set(data.trackers.filter((t) => !t.archived).map((t) => t.id))
    return data.reminders.filter((r) => r.enabled && active.has(r.trackerId)).length
  }, [data])

  const make = () => {
    if (!data) return null
    const built = buildAgendaICS(withEvents ? events : [], {
      habits: withHabits ? { trackers: data.trackers, reminders: data.reminders } : undefined,
      appUrl: currentAppUrl(),
    })
    if (built.eventCount + built.habitCount === 0) {
      toast.show('Nada para exportar com essas opções.')
      return null
    }
    return built
  }

  const add = () => {
    const built = make()
    if (built) openCalendarFile(built.ics, agendaFilename())
  }

  const share = async () => {
    const built = make()
    if (!built) return
    const ok = await shareCalendarFile(built.ics, agendaFilename(), 'Agenda do Controlle')
    if (!ok) toast.show('Não deu para compartilhar aqui. Use “Adicionar ao calendário”.')
  }

  const nothing = (!withEvents || events.length === 0) && (!withHabits || habitCount === 0)

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Exportar para a agenda do celular"
      footer={
        <div className="calendar-actions">
          <button type="button" className="btn btn-primary" onClick={add} disabled={nothing}>
            Adicionar ao calendário
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => void share()} disabled={nothing}>
            Compartilhar arquivo
          </button>
        </div>
      }
    >
      <p className="calendar-lead">
        Gera um arquivo de calendário (.ics) com alertas. O celular avisa nos horários, mesmo com o Controlle fechado.
      </p>

      <div className="ag-group" role="group" aria-label="O que exportar">
        <CheckRow
          checked={withEvents}
          onChange={setWithEvents}
          label="Compromissos"
          detail={plural(events.length, 'compromisso', 'compromissos')}
        />
        <CheckRow
          checked={withHabits}
          onChange={setWithHabits}
          label="Hábitos com horário"
          detail={habitCount === 0 ? 'Nenhum hábito com lembrete' : plural(habitCount, 'horário', 'horários')}
        />
      </div>

      {withEvents && (
        <div className="field ag-sheet-field">
          <span className="field-label">Quais compromissos</span>
          <SegmentedControl<Range>
            ariaLabel="Quais compromissos exportar"
            value={range}
            onChange={setRange}
            options={[
              { value: 'upcoming', label: 'Próximos' },
              { value: 'all', label: 'Todos' },
            ]}
          />
          <p className="field-hint">
            {range === 'upcoming'
              ? 'Os que ainda vão acontecer e os que repetem. Deixa de fora o que já passou.'
              : 'Inclui também os compromissos que já passaram.'}
          </p>
        </div>
      )}

      <div className="calendar-tips">
        <p className="field-hint">
          <strong>Dica:</strong> no iPhone, crie antes um calendário chamado “Controlle” no app Calendário e escolha ele na
          hora de adicionar. Assim fica fácil apagar ou esconder tudo de uma vez.
        </p>
        <p className="field-hint">
          A agenda do celular não sincroniza sozinha com o Controlle. Se mudar algo aqui, exporte de novo. Para não ficar
          duplicado, apague antes os eventos antigos (ou o calendário “Controlle” inteiro).
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
