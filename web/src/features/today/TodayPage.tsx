import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { deleteEntry, logEntry, saveTracker } from '../../db/actions'
import {
  daysBetween,
  TEMPLATES,
  dayProgress,
  formatDayLong,
  formatMinuteOfDay,
  formatValue,
  goalOn,
  overallProgress,
  overallStreak,
  trackerStreak,
} from '../../domain'
import type { TrackerSnapshot } from '../../domain/types'
import { BrandText } from '../../components/BrandText'
import { CLogo } from '../../components/CLogo'
import { CRing } from '../../components/CRing'
import { StreakChip } from '../../components/controls'
import { IconBell, IconPlus } from '../../components/icons'
import { TrackerCard } from '../../components/TrackerCard'
import { useToast } from '../../components/Toast'
import { useEngineOptions } from '../../hooks/useEngineOptions'
import { useSettings } from '../../hooks/useSettings'
import { useRestDays, useSnapshots } from '../../hooks/useSnapshots'
import { useToday } from '../../hooks/useToday'
import { readLocal, writeLocal } from '../../hooks/storage'
import { templateToDraft } from '../../hooks/templateDraft'
import { useDueReminders } from '../../platform/reminders'
import { InstallBanner } from './InstallBanner'
import { LogSheet, SCALE_FACES } from './LogSheet'
import { Avatar, useProfile } from '../profile/Avatar'
import { LevelChip } from '../rewards/LevelCard'
import { emitReaction } from '../../avatar/reactions'
import { useRewards } from '../../hooks/useRewards'
import { UpcomingEvents } from '../agenda/UpcomingEvents'

function greeting(hour: number): string {
  if (hour >= 5 && hour < 12) return 'Bom dia'
  if (hour >= 12 && hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

const CELEBRATED_KEY = 'controlle.celebrated'

export function TodayPage() {
  const settings = useSettings()
  const snapshots = useSnapshots()
  const restDays = useRestDays()
  const today = useToday()
  const o = useEngineOptions()
  const toast = useToast()
  const navigate = useNavigate()
  const due = useDueReminders()
  const profile = useProfile()
  const rewards = useRewards()

  const hour = new Date().getHours()
  const [detailsId, setDetailsId] = useState<string | null>(null)
  const [pulseId, setPulseId] = useState<string | null>(null)
  const [celebrating, setCelebrating] = useState(false)

  const rows = useMemo(
    () =>
      (snapshots ?? []).map((s) => ({
        s,
        goal: goalOn(s.goals, today),
        progress: dayProgress(s, restDays, today, o),
        streak: trackerStreak(s, restDays, today, o),
      })),
    [snapshots, restDays, today, o],
  )
  const overall = useMemo(() => overallProgress(snapshots ?? [], restDays, today, o), [snapshots, restDays, today, o])
  const streak = useMemo(() => overallStreak(snapshots ?? [], restDays, today, o), [snapshots, restDays, today, o])

  // Celebração: só quando o dia vira completo com o app aberto, uma vez por dia.
  const prevComplete = useRef<boolean | null>(null)
  useEffect(() => {
    if (!snapshots) return
    const was = prevComplete.current
    prevComplete.current = overall.complete
    if (was === false && overall.complete && readLocal(CELEBRATED_KEY) !== today) {
      writeLocal(CELEBRATED_KEY, today)
      setCelebrating(true)
      emitReaction('day')
      navigator.vibrate?.([10, 40, 10])
      const t = window.setTimeout(() => setCelebrating(false), 2600)
      return () => window.clearTimeout(t)
    }
  }, [overall.complete, snapshots, today])

  // Avatar vivo: reage aos checks (em qualquer tela de registro), ao dia completo e à volta depois de pausa
  const todayEntries = useMemo(() => (snapshots ?? []).reduce((n, sn) => n + sn.entries.filter((e) => e.day === today).length, 0), [snapshots, today])
  const prevEntries = useRef<number | null>(null)
  useEffect(() => {
    if (!snapshots) return
    const was = prevEntries.current
    prevEntries.current = todayEntries
    if (was !== null && todayEntries > was && !overall.complete) emitReaction('check')
  }, [todayEntries, snapshots, overall.complete])
  const greeted = useRef(false)
  useEffect(() => {
    if (!snapshots || greeted.current) return
    greeted.current = true
    let last = ''
    for (const sn of snapshots) for (const e of sn.entries) if (e.day < today && e.day > last) last = e.day
    if (last && daysBetween(last, today).length - 1 >= 7) window.setTimeout(() => emitReaction('back'), 900)
  }, [snapshots, today])
  const buddy = profile.avatar.kind === 'custom'

  const flash = (id: string) => {
    setPulseId(id)
    window.setTimeout(() => setPulseId((x) => (x === id ? null : x)), 450)
  }

  const quickLog = useCallback(
    async (s: TrackerSnapshot) => {
      const t = s.tracker
      if (t.kind === 'scale') {
        setDetailsId(t.id) // escala precisa escolher o rosto
        return
      }
      const { entry, created } = await logEntry(t.id, { source: 'quick' })
      if (!created) {
        toast.show(`${t.name} já está feito hoje`, { label: 'Desfazer', onAction: () => void deleteEntry(entry.id) })
        return
      }
      navigator.vibrate?.(10)
      flash(t.id)
      const what = t.kind === 'binary' ? 'feito' : `+${formatValue(entry.value, t.kind, t.unit)}`
      toast.show(`${t.icon} ${t.name} ${what}`, { label: 'Desfazer', onAction: () => void deleteEntry(entry.id) })
    },
    [toast],
  )

  const createFromTemplate = async (i: number) => {
    const t = TEMPLATES[i]
    if (!t) return
    await saveTracker(templateToDraft(t))
    toast.show(`${t.icon} ${t.name} criado`)
  }

  const detailsSnapshot = snapshots?.find((s) => s.tracker.id === detailsId) ?? null
  const name = (profile.displayName || settings.name).trim()

  return (
    <div className="page today-page">
      <header className="today-head">
        <div className="today-who">
          <Link to="/perfil" className="today-avatar" aria-label="Seu perfil">
            <Avatar profile={profile} size={44} decorative />
          </Link>
          <div>
            <p className="today-date">
              {formatDayLong(today)} {rewards.ready && <LevelChip level={rewards.level.level} />}
            </p>
            <h1 className="today-greet">
              {greeting(hour)}
              {name ? ', ' : ''}
              {name && <BrandText>{name}</BrandText>}
            </h1>
          </div>
        </div>
        <Link to="/tracker/new" className="icon-btn icon-btn-filled" aria-label="Criar tracker">
          <IconPlus />
        </Link>
      </header>

      <InstallBanner />

      {due.length > 0 && (
        <div className="due-list" role="region" aria-label="Lembretes atrasados">
          {due.slice(0, 3).map(({ reminder, tracker }) => {
            const s = snapshots?.find((x) => x.tracker.id === tracker.id)
            return (
              <div className="due-banner" key={reminder.id}>
                <IconBell size={18} />
                <span className="due-text">
                  {tracker.icon} {tracker.name} · <span className="num">{formatMinuteOfDay(reminder.minuteOfDay)}</span>
                </span>
                <button type="button" className="btn btn-small btn-primary" onClick={() => s && void quickLog(s)}>
                  Registrar
                </button>
              </div>
            )
          })}
        </div>
      )}

      {snapshots === undefined ? (
        <div className="hero hero-skeleton" aria-busy="true" />
      ) : snapshots.length === 0 ? (
        <section className="today-empty">
          <CLogo size={88} animated />
          <BrandText as="h2" className="empty-title">
            Comece pelo que importa pra você
          </BrandText>
          <p className="muted">Escolha um modelo para criar com um toque. Dá pra ajustar tudo depois.</p>
          <div className="template-buttons">
            {TEMPLATES.slice(0, 4).map((t, i) => (
              <button key={t.id} type="button" className="template-btn" onClick={() => void createFromTemplate(i)}>
                <span className="template-emoji" aria-hidden="true">
                  {t.icon}
                </span>
                <span className="template-name">{t.name}</span>
                <span className="template-desc">{t.description}</span>
              </button>
            ))}
          </div>
          <button type="button" className="btn btn-ghost btn-block" onClick={() => navigate('/tracker/new')}>
            Criar do zero
          </button>
        </section>
      ) : (
        <>
          <section className={`hero${overall.complete ? ' is-complete' : ''}${celebrating ? ' is-celebrating' : ''}`} aria-label="Progresso de hoje">
            <CRing
              progress={overall.fraction}
              size={148}
              stroke={18}
              ariaLabel="Progresso geral de hoje"
              className="hero-ring"
              label={
                buddy ? (
                  <Avatar profile={profile} size={104} alive pettable className="hero-buddy" />
                ) : (
                  <span className="hero-ring-label">
                    <span className="hero-pct num">{Math.round(overall.fraction * 100)}</span>
                    <span className="hero-pct-unit">%</span>
                  </span>
                )
              }
            />
            <div className="hero-copy">
              <p className="hero-count num">
                {overall.active === 0 ? (
                  'Nada pra hoje'
                ) : overall.complete ? (
                  <BrandText>Dia completo</BrandText>
                ) : (
                  <>
                    <strong>{overall.met}</strong> de {overall.active} hoje
                    {buddy && <span className="hero-pct-inline">{Math.round(overall.fraction * 100)}% do dia</span>}
                  </>
                )}
              </p>
              <StreakChip count={streak.current} />
              {streak.atRisk && streak.current > 0 && (
                <p className="risk-note">Registre hoje para manter a sequência de {streak.current} {streak.current === 1 ? 'dia' : 'dias'}.</p>
              )}
            </div>
            {celebrating && <Confetti />}
          </section>

          <UpcomingEvents />

          <section className="tracker-grid" aria-label="Seus trackers">
            {rows.map(({ s, goal, progress, streak: st }) => (
              <TrackerCard
                key={s.tracker.id}
                tracker={s.tracker}
                goal={goal}
                progress={progress}
                streak={st.current}
                pulse={pulseId === s.tracker.id}
                onTap={() => void quickLog(s)}
                onDetails={() => setDetailsId(s.tracker.id)}
              />
            ))}
          </section>
          <p className="hint-line">Toque para registrar. Segure para mais opções.</p>
        </>
      )}

      <LogSheet snapshot={detailsSnapshot} today={today} dayStartHour={settings.dayStartHour} onClose={() => setDetailsId(null)} />
    </div>
  )
}

const CONFETTI_COLORS = ['var(--green-500)', 'var(--green-200)', 'var(--amber)', 'var(--green-400)', 'var(--green-100)']

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        left: 8 + ((i * 41) % 84),
        delay: (i % 7) * 60,
        rot: (i * 67) % 360,
        drift: ((i % 5) - 2) * 18,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        round: i % 3 === 0,
      })),
    [],
  )
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className={p.round ? 'round' : ''}
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}ms`,
            background: p.color,
            ['--rot' as string]: `${p.rot}deg`,
            ['--drift' as string]: `${p.drift}px`,
          }}
        />
      ))}
    </div>
  )
}

export { SCALE_FACES }
