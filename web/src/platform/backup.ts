import { db, type ControlleDB } from '../db/db'
import type { CalendarEvent, Entry, Goal, Profile, Reminder, RestDay, Settings, Tracker } from '../domain/types'

// Backup local: tudo fica no aparelho, então exportar é a única cópia de segurança.

export const BACKUP_APP = 'controlle'
export const BACKUP_SCHEMA_VERSION = 2

export interface BackupFile {
  app: typeof BACKUP_APP
  schemaVersion: number
  /** ISO 8601 */
  exportedAt: string
  settings: Settings | null
  trackers: Tracker[]
  goals: Goal[]
  entries: Entry[]
  restDays: RestDay[]
  reminders: Reminder[]
  /** v2+; ausente em backups v1 */
  events?: CalendarEvent[]
  /** v2+; ausente em backups v1 */
  profile?: Profile | null
}

export class BackupFormatError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BackupFormatError'
  }
}

/** Monta o objeto de backup (útil para testes e para o Blob). */
export async function buildBackup(database: ControlleDB = db): Promise<BackupFile> {
  const [settings, trackers, goals, entries, restDays, reminders, events, profile] = await Promise.all([
    database.settings.get('settings'),
    database.trackers.toArray(),
    database.goals.toArray(),
    database.entries.toArray(),
    database.restDays.toArray(),
    database.reminders.toArray(),
    database.events.toArray(),
    database.profile.get('me'),
  ])
  return {
    app: BACKUP_APP,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    settings: settings ?? null,
    trackers,
    goals,
    entries,
    restDays,
    reminders,
    events,
    profile: profile ?? null,
  }
}

export async function exportJSON(database: ControlleDB = db): Promise<Blob> {
  const data = await buildBackup(database)
  return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
}

const TABLES = ['trackers', 'goals', 'entries', 'restDays', 'reminders'] as const

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Valida a estrutura do arquivo e devolve o backup tipado ou lança BackupFormatError. */
export function parseBackup(text: string): BackupFile {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new BackupFormatError('Este arquivo não é um backup válido do Controlle (o conteúdo não é JSON).')
  }
  if (!isObject(raw) || raw.app !== BACKUP_APP) {
    throw new BackupFormatError('Este arquivo não é um backup do Controlle.')
  }
  if (typeof raw.schemaVersion !== 'number') {
    throw new BackupFormatError('Backup sem versão. O arquivo pode estar corrompido.')
  }
  if (raw.schemaVersion > BACKUP_SCHEMA_VERSION) {
    throw new BackupFormatError(
      'Este backup foi feito por uma versão mais nova do Controlle. Atualize o app antes de importar.',
    )
  }
  for (const table of TABLES) {
    const list = raw[table]
    if (!Array.isArray(list)) {
      throw new BackupFormatError(`Backup incompleto: a lista "${table}" está faltando.`)
    }
    if (!list.every((item) => isObject(item) && typeof item.id === 'string' && item.id.length > 0)) {
      throw new BackupFormatError(`Backup corrompido: há itens sem identificador em "${table}".`)
    }
  }
  const entriesOk = (raw.entries as Record<string, unknown>[]).every(
    (e) => typeof e.trackerId === 'string' && typeof e.timestamp === 'number' && typeof e.value === 'number' && typeof e.day === 'string',
  )
  if (!entriesOk) throw new BackupFormatError('Backup corrompido: há registros com dados inválidos.')
  if (raw.settings != null && !isObject(raw.settings)) {
    throw new BackupFormatError('Backup corrompido: configurações inválidas.')
  }
  return raw as unknown as BackupFile
}

/**
 * Importa um backup JSON.
 * - merge: mantém o que existe e sobrescreve itens com o mesmo id.
 * - replace: apaga tudo e grava o backup.
 */
export async function importJSON(
  file: File,
  mode: 'merge' | 'replace',
  database: ControlleDB = db,
): Promise<{ trackers: number; entries: number }> {
  let text: string
  try {
    text = await file.text()
  } catch {
    throw new BackupFormatError('Não foi possível ler o arquivo selecionado.')
  }
  const data = parseBackup(text)
  const tables = [
    database.trackers,
    database.goals,
    database.entries,
    database.restDays,
    database.reminders,
    database.settings,
    database.events,
    database.profile,
  ]
  await database.transaction('rw', tables, async () => {
    if (mode === 'replace') {
      await Promise.all(tables.map((t) => t.clear()))
    }
    await database.trackers.bulkPut(data.trackers)
    await database.goals.bulkPut(data.goals)
    await database.entries.bulkPut(data.entries)
    await database.restDays.bulkPut(data.restDays)
    await database.reminders.bulkPut(data.reminders)
    // v2: agenda e perfil (backups v1 não têm esses campos)
    if (Array.isArray(data.events)) {
      await database.events.bulkPut(
        data.events.map((e) => ({
          ...e,
          exceptions: Array.isArray(e.exceptions) ? e.exceptions : [],
          repeatWeekdays: Array.isArray(e.repeatWeekdays) ? e.repeatWeekdays : [],
          alertMinutes: e.alertMinutes ?? null,
        })),
      )
    }
    if (data.profile) {
      const currentProfile = await database.profile.get('me')
      if (mode === 'replace' || !currentProfile) {
        await database.profile.put({ ...data.profile, id: 'me' })
      }
    }
    if (data.settings) {
      const current = await database.settings.get('settings')
      // No merge, configurações locais prevalecem; só preenche se não houver.
      if (mode === 'replace' || !current) {
        await database.settings.put({ ...data.settings, id: 'settings' })
      }
    }
  })
  return { trackers: data.trackers.length, entries: data.entries.length }
}

// ---------- CSV ----------

const pad = (n: number) => String(n).padStart(2, '0')

function csvField(value: string): string {
  return /[;"\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

/** Número com vírgula decimal, sem separador de milhar (Excel pt-BR). */
export function formatCsvNumber(n: number): string {
  return String(Math.round(n * 1e6) / 1e6).replace('.', ',')
}

/** CSV com ";" e BOM UTF-8 para abrir corretamente no Excel em português. */
export async function exportCSV(database: ControlleDB = db): Promise<Blob> {
  const [trackers, entries] = await Promise.all([database.trackers.toArray(), database.entries.toArray()])
  const byId = new Map(trackers.map((t) => [t.id, t]))
  const sorted = [...entries].sort((a, b) => a.timestamp - b.timestamp)
  const lines = ['data;hora;tracker;valor;unidade;nota']
  for (const e of sorted) {
    const t = byId.get(e.trackerId)
    const [y, m, d] = e.day.split('-')
    const at = new Date(e.timestamp)
    lines.push(
      [
        `${d}/${m}/${y}`,
        `${pad(at.getHours())}:${pad(at.getMinutes())}`,
        csvField(t?.name ?? '(removido)'),
        formatCsvNumber(e.value),
        csvField(t?.unit ?? ''),
        csvField(e.note ?? ''),
      ].join(';'),
    )
  }
  return new Blob(['﻿' + lines.join('\r\n') + '\r\n'], { type: 'text/csv;charset=utf-8' })
}

// ---------- Download ----------

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1)
}

/**
 * Salva um arquivo. No iOS usa a folha de compartilhamento (permite "Salvar em Arquivos"),
 * pois <a download> em PWA instalado no iOS é pouco confiável. Senão, <a download>.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  if (isIOS() && typeof navigator.share === 'function' && typeof navigator.canShare === 'function') {
    const file = new File([blob], filename, { type: blob.type || 'application/octet-stream' })
    if (navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: filename }).catch((err: unknown) => {
        // Usuário cancelou: não faz nada. Outro erro: tenta o link.
        if (err instanceof DOMException && err.name === 'AbortError') return
        anchorDownload(blob, filename)
      })
      return
    }
  }
  anchorDownload(blob, filename)
}

function anchorDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/** Nome sugerido: controlle-backup-2026-10-27.json */
export function backupFilename(ext: 'json' | 'csv', now = new Date()): string {
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  return `controlle-${ext === 'json' ? 'backup' : 'registros'}-${stamp}.${ext}`
}
