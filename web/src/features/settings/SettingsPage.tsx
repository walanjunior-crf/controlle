import { useId, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveSettings } from '../../db/db'
import { reorderTrackers, setArchived } from '../../db/actions'
import type { Settings, Tracker } from '../../domain/types'
import { BrandText } from '../../components/BrandText'
import { CalendarSheet } from '../../components/CalendarSheet'
import { CLogo } from '../../components/CLogo'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { SegmentedControl } from '../../components/controls'
import { IconChevronRight, IconDown, IconUp } from '../../components/icons'
import { Sheet } from '../../components/Sheet'
import { useToast } from '../../components/Toast'
import { useSettings } from '../../hooks/useSettings'
import { useAllTrackers } from '../../hooks/useSnapshots'
import { backupFilename, downloadBlob, exportCSV, exportJSON, importJSON } from '../../platform/backup'
import { isStandalone, platformHint, useInstallPrompt } from '../../platform/install'
import { IosInstallSteps } from '../today/InstallBanner'

export const APP_VERSION = '0.1.0'

function Group({ title, children, footer }: { title: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <section className="settings-group">
      <h2 className="section-title">{title}</h2>
      <div className="card settings-card">{children}</div>
      {footer && <p className="field-hint group-foot">{footer}</p>}
    </section>
  )
}

export function SettingsPage() {
  const settings = useSettings()
  const trackers = useAllTrackers() ?? []
  const navigate = useNavigate()
  const toast = useToast()
  const ids = { name: useId(), day: useId() }
  const fileRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<File | null>(null)
  const [mode, setMode] = useState<'merge' | 'replace'>('merge')
  const [installOpen, setInstallOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [nameDraft, setNameDraft] = useState<string | null>(null)
  const { canPrompt, prompt } = useInstallPrompt()

  const active = trackers.filter((t) => !t.archived)
  const archived = trackers.filter((t) => t.archived)

  const update = (patch: Partial<Settings>) => void saveSettings(patch)

  const move = (i: number, dir: -1 | 1) => {
    const ids = active.map((t) => t.id)
    const j = i + dir
    if (j < 0 || j >= ids.length) return
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
    void reorderTrackers([...ids, ...archived.map((t) => t.id)])
  }

  const doExport = async (kind: 'json' | 'csv') => {
    try {
      const blob = kind === 'json' ? await exportJSON() : await exportCSV()
      downloadBlob(blob, backupFilename(kind))
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Não foi possível exportar.')
    }
  }

  const doImport = async () => {
    const file = pending
    setPending(null)
    if (!file) return
    try {
      const r = await importJSON(file, mode)
      toast.show(`Importado: ${r.trackers} trackers, ${r.entries} registros`)
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Não foi possível importar este arquivo.')
    }
  }

  const name = nameDraft ?? settings.name
  const hint = platformHint()

  return (
    <div className="page settings-page">
      <header className="page-head">
        <BrandText as="h1" className="page-title">
          Ajustes
        </BrandText>
      </header>

      <Group title="Você">
        <div className="settings-row stack">
          <label htmlFor={ids.name} className="field-label">
            Seu nome
          </label>
          <input
            id={ids.name}
            className="input"
            type="text"
            value={name}
            placeholder="Como posso te chamar?"
            maxLength={30}
            autoComplete="given-name"
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={() => {
              if (nameDraft !== null) update({ name: nameDraft.trim() })
              setNameDraft(null)
            }}
          />
        </div>
      </Group>

      <Group title="Trackers">
        {active.length === 0 && <p className="settings-row muted">Nenhum tracker ativo.</p>}
        {active.map((t, i) => (
          <TrackerRow key={t.id} t={t}>
            <button type="button" className="icon-btn" aria-label={`Mover ${t.name} para cima`} disabled={i === 0} onClick={() => move(i, -1)}>
              <IconUp />
            </button>
            <button type="button" className="icon-btn" aria-label={`Mover ${t.name} para baixo`} disabled={i === active.length - 1} onClick={() => move(i, 1)}>
              <IconDown />
            </button>
            <button type="button" className="icon-btn" aria-label={`Editar ${t.name}`} onClick={() => navigate(`/tracker/${t.id}`)}>
              <IconChevronRight />
            </button>
          </TrackerRow>
        ))}
        <button type="button" className="settings-row settings-link" onClick={() => navigate('/tracker/new')}>
          Criar tracker
        </button>
      </Group>

      {archived.length > 0 && (
        <Group title="Arquivados">
          {archived.map((t) => (
            <TrackerRow key={t.id} t={t}>
              <button type="button" className="btn btn-small btn-ghost" onClick={() => void setArchived(t.id, false)}>
                Restaurar
              </button>
            </TrackerRow>
          ))}
        </Group>
      )}

      <Group title="Dia e semana" footer="A virada define quando um novo dia começa: com 4h, o que você registrar à 1h da manhã conta para o dia anterior.">
        <div className="settings-row">
          <label htmlFor={ids.day}>Virada do dia</label>
          <select id={ids.day} className="select" value={settings.dayStartHour} onChange={(e) => update({ dayStartHour: Number(e.target.value) })}>
            {[0, 1, 2, 3, 4, 5, 6].map((h) => (
              <option key={h} value={h}>
                {h === 0 ? 'Meia-noite' : `${h}h`}
              </option>
            ))}
          </select>
        </div>
        <div className="settings-row stack">
          <span className="field-label">Semana começa em</span>
          <SegmentedControl
            ariaLabel="Semana começa em"
            value={settings.weekStartsOn}
            onChange={(v) => update({ weekStartsOn: v })}
            options={[
              { value: 0, label: 'Domingo' },
              { value: 1, label: 'Segunda' },
            ]}
          />
        </div>
      </Group>

      <Group title="Aparência">
        <div className="settings-row stack">
          <span className="field-label">Tema</span>
          <SegmentedControl
            ariaLabel="Tema"
            value={settings.theme}
            onChange={(v) => update({ theme: v })}
            options={[
              { value: 'system', label: 'Sistema' },
              { value: 'light', label: 'Claro' },
              { value: 'dark', label: 'Escuro' },
            ]}
          />
        </div>
      </Group>

      <Group
        title="Lembretes"
        footer="Adicione os horários dos seus trackers ao calendário do celular para receber o aviso mesmo com o app fechado."
      >
        <button type="button" className="settings-row settings-link" onClick={() => setCalendarOpen(true)}>
          Adicionar lembretes ao calendário
        </button>
      </Group>

      <Group
        title="Backup"
        footer="Seus dados ficam só neste aparelho, sem conta e sem nuvem. Exporte um backup de vez em quando e guarde no Arquivos ou no seu e-mail."
      >
        <button type="button" className="settings-row settings-link" onClick={() => void doExport('json')}>
          Exportar backup (JSON)
        </button>
        <button type="button" className="settings-row settings-link" onClick={() => void doExport('csv')}>
          Exportar planilha (CSV)
        </button>
        <button type="button" className="settings-row settings-link" onClick={() => fileRef.current?.click()}>
          Importar backup
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (f) {
              setMode('merge')
              setPending(f)
            }
          }}
        />
      </Group>

      {!isStandalone() && (
        <Group title="Instalar">
          {hint === 'android' || hint === 'desktop' ? (
            canPrompt ? (
              <button type="button" className="settings-row settings-link" onClick={() => void prompt()}>
                Instalar o Controlle
              </button>
            ) : (
              <p className="settings-row muted">Use o menu do navegador e escolha “Instalar app” ou “Adicionar à tela inicial”.</p>
            )
          ) : (
            <button type="button" className="settings-row settings-link" onClick={() => setInstallOpen(true)}>
              Instalar no iPhone
            </button>
          )}
        </Group>
      )}

      <section className="about">
        <CLogo size={56} />
        <BrandText as="p" className="about-name">
          Controlle
        </BrandText>
        <p className="muted num">Versão {APP_VERSION}</p>
        <p className="muted">Feito para usar entre amigos.</p>
      </section>

      <CalendarSheet open={calendarOpen} onClose={() => setCalendarOpen(false)} />

      <ConfirmDialog
        open={pending !== null}
        title="Importar backup"
        message={pending ? `Arquivo: ${pending.name}` : undefined}
        confirmLabel={mode === 'replace' ? 'Substituir tudo' : 'Mesclar'}
        danger={mode === 'replace'}
        onConfirm={() => void doImport()}
        onCancel={() => setPending(null)}
      >
        <SegmentedControl
          ariaLabel="Modo de importação"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'merge', label: 'Mesclar' },
            { value: 'replace', label: 'Substituir' },
          ]}
        />
        <p className="field-hint">
          {mode === 'merge'
            ? 'Junta o backup com o que já está aqui. Registros iguais não duplicam.'
            : 'Apaga tudo deste aparelho e coloca o backup no lugar.'}
        </p>
      </ConfirmDialog>

      <Sheet open={installOpen} onClose={() => setInstallOpen(false)} title="Instalar no iPhone">
        <IosInstallSteps />
        <p className="field-hint">Instalado, o Controlle abre em tela cheia, funciona sem internet e mostra o número de pendências no ícone.</p>
      </Sheet>
    </div>
  )
}

function TrackerRow({ t, children }: { t: Tracker; children: ReactNode }) {
  return (
    <div className="settings-row tracker-row">
      <span className="tracker-emoji small" aria-hidden="true">
        {t.icon}
      </span>
      <span className="tracker-row-name">{t.name}</span>
      <span className="tracker-row-actions">{children}</span>
    </div>
  )
}
