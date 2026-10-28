import { useId, useState } from 'react'
import { db } from '../../db/db'
import { importEvents } from '../../db/agendaActions'
import { formatDayCompact, formatEventTime, repeatRuleLabel } from '../../domain/agenda'
import { Sheet } from '../../components/Sheet'
import { ColorPicker } from '../../components/pickers'
import { colorFor } from '../../components/colors'
import { IconUpload } from '../../components/icons'
import { useToast } from '../../components/Toast'
import { decodeICS, parseICS, type ParsedImport } from '../../platform/icsImport'
import './agenda.css'

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

function summary(p: ParsedImport): string {
  const head = `Encontrei ${plural(p.events.length, 'compromisso', 'compromissos')}`
  const extra: string[] = []
  if (p.simplified > 0) extra.push(plural(p.simplified, 'simplificado', 'simplificados'))
  if (p.skipped > 0) extra.push(plural(p.skipped, 'ignorado', 'ignorados'))
  return extra.length ? `${head} (${extra.join(', ')})` : head
}

const PREVIEW = 5

/** Folha "Importar de um arquivo .ics". */
export function AgendaImportSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast()
  const inputId = useId()
  const [parsed, setParsed] = useState<ParsedImport | null>(null)
  const [fileName, setFileName] = useState('')
  const [color, setColor] = useState('teal')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const reset = () => {
    setParsed(null)
    setFileName('')
    setError('')
  }
  const close = () => {
    reset()
    onClose()
  }

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setError('')
    setBusy(true)
    try {
      const text = decodeICS(await file.arrayBuffer())
      const reminderIds = await db.reminders.toCollection().primaryKeys()
      const result = parseICS(text, { reminderIds })
      setFileName(file.name)
      setParsed(result)
      if (result.events.length === 0) setError(result.warnings[0] ?? 'Não encontrei compromissos neste arquivo.')
    } catch {
      setParsed(null)
      setError('Não consegui ler este arquivo. Confira se é um .ics.')
    } finally {
      setBusy(false)
    }
  }

  const doImport = async () => {
    if (!parsed || parsed.events.length === 0) return
    setBusy(true)
    try {
      const r = await importEvents(parsed.events.map((e) => ({ ...e, color })))
      const parts: string[] = []
      if (r.added) parts.push(plural(r.added, 'compromisso importado', 'compromissos importados'))
      if (r.updated) parts.push(plural(r.updated, 'atualizado', 'atualizados'))
      toast.show(parts.length ? capitalizeFirst(parts.join(', ')) : 'Nada novo para importar')
      close()
    } catch {
      setError('Não deu para salvar os compromissos. Tente de novo.')
    } finally {
      setBusy(false)
    }
  }

  const events = parsed?.events ?? []
  const preview = [...events].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.startMinute - b.startMinute)).slice(0, PREVIEW)

  return (
    <Sheet
      open={open}
      onClose={close}
      title="Importar de um arquivo .ics"
      footer={
        events.length > 0 ? (
          <button type="button" className="btn btn-primary btn-block" onClick={() => void doImport()} disabled={busy}>
            Importar {plural(events.length, 'compromisso', 'compromissos')}
          </button>
        ) : undefined
      }
    >
      <p className="calendar-lead">Traga compromissos de outra agenda. Importar de novo o mesmo arquivo atualiza, sem duplicar.</p>

      <label className="ag-file btn btn-ghost btn-block" htmlFor={inputId}>
        <IconUpload size={20} />
        <span>{fileName ? 'Escolher outro arquivo' : 'Escolher arquivo .ics'}</span>
        <input
          id={inputId}
          className="ag-file-input"
          type="file"
          accept=".ics,text/calendar"
          onChange={(e) => {
            void onFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </label>

      {busy && !parsed && (
        <p className="field-hint" role="status">
          Lendo o arquivo…
        </p>
      )}
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}

      {parsed && events.length > 0 && (
        <div className="ag-import-preview">
          <p className="ag-import-summary" role="status">
            {summary(parsed)}
          </p>
          {fileName && <p className="field-hint ag-file-name">{fileName}</p>}
          <ul className="ag-import-list" style={{ ['--ev' as string]: colorFor(color) }}>
            {preview.map((e) => (
              <li key={e.id}>
                <span className="ag-import-dot" aria-hidden="true" />
                <span className="ag-import-main">
                  <span className="ag-import-title">{e.title}</span>
                  <span className="ag-import-when">
                    {formatDayCompact(e.date)} · {formatEventTime(e)}
                    {e.repeat !== 'none' ? ` · ${repeatRuleLabel(e)}` : ''}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          {events.length > PREVIEW && <p className="field-hint">e mais {plural(events.length - PREVIEW, 'compromisso', 'compromissos')}.</p>}

          <div className="field ag-sheet-field">
            <span className="field-label">Cor dos compromissos importados</span>
            <ColorPicker value={color} onChange={setColor} />
          </div>

          {parsed.warnings.length > 0 && (
            <ul className="ag-warnings">
              {parsed.warnings.map((w) => (
                <li key={w} className="field-hint">
                  {w}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="calendar-tips">
        <p className="field-hint">
          <strong>Google Agenda:</strong> no computador, Configurações → Importar e exportar → Exportar. Abra o .zip baixado
          e escolha o arquivo .ics.
        </p>
        <p className="field-hint">
          <strong>iPhone (iCloud):</strong> no iCloud.com, compartilhe o calendário como público, copie o link, troque
          “webcal://” por “https://” e abra no navegador para baixar o .ics.
        </p>
      </div>
    </Sheet>
  )
}

function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
