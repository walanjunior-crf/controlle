import { useEffect, type ReactNode } from 'react'
import { HashRouter, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { IconAgenda, IconHistory, IconSettings, IconStats, IconToday } from './components/icons'
import { ToastProvider } from './components/Toast'
import { TrackerBuilderPage } from './features/builder/TrackerBuilderPage'
import { HistoryPage } from './features/history/HistoryPage'
import { AgendaPage } from './features/agenda/AgendaPage'
import { EventEditorPage } from './features/agenda/EventEditorPage'
import { ProfilePage } from './features/profile/ProfilePage'
import { AvatarEditorPage } from './features/profile/AvatarEditorPage'
import { ConquistasPage } from './features/rewards/ConquistasPage'
import { useRewardToasts } from './features/rewards/useRewardToasts'
import { OnboardingPage } from './features/onboarding/OnboardingPage'
import { SettingsPage } from './features/settings/SettingsPage'
import { StatsPage } from './features/stats/StatsPage'
import { TodayPage } from './features/today/TodayPage'
import { useSettingsLoaded } from './hooks/useSettings'
import { useBadgeSync } from './platform/reminders'
import { useUpdateAvailable } from './platform/update'

const TABS = [
  { to: '/', label: 'Hoje', Icon: IconToday, end: true },
  { to: '/agenda', label: 'Agenda', Icon: IconAgenda, end: false },
  { to: '/historico', label: 'Histórico', Icon: IconHistory, end: false },
  { to: '/estatisticas', label: 'Estatísticas', Icon: IconStats, end: false },
  { to: '/ajustes', label: 'Ajustes', Icon: IconSettings, end: false },
]

function TabBar() {
  return (
    <nav className="tab-bar" aria-label="Navegação principal">
      {TABS.map(({ to, label, Icon, end }) => (
        <NavLink key={to} to={to} end={end} className={({ isActive }) => `tab${isActive ? ' is-active' : ''}`}>
          <Icon />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

function UpdateBand() {
  const { needRefresh, update } = useUpdateAvailable()
  if (!needRefresh) return null
  return (
    <div className="update-band" role="status">
      <span>Nova versão disponível</span>
      <button type="button" className="btn btn-small btn-on-primary" onClick={update}>
        Atualizar
      </button>
    </div>
  )
}

function BadgeSync() {
  useBadgeSync()
  return null
}

function RewardSync() {
  useRewardToasts()
  return null
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function WithTabs({ children }: { children: ReactNode }) {
  return (
    <>
      <main className="app-main">{children}</main>
      <TabBar />
    </>
  )
}

function Shell() {
  const settings = useSettingsLoaded()

  useEffect(() => {
    if (!settings) return
    const root = document.documentElement
    if (settings.theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', settings.theme)
    // barra de status do iPhone / Android acompanha o tema escolhido
    const dark = settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((m) => {
      if (settings.theme === 'system') {
        m.content = m.media.includes('dark') ? '#0F1A0F' : '#336633'
      } else m.content = dark ? '#0F1A0F' : '#336633'
    })
  }, [settings])

  if (!settings) return <div className="boot" aria-busy="true" />

  if (!settings.onboarded) {
    return (
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/tracker/new" element={<TrackerBuilderPage />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    )
  }

  return (
    <>
      <BadgeSync />
      <RewardSync />
      <UpdateBand />
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<WithTabs><TodayPage /></WithTabs>} />
        <Route path="/agenda" element={<WithTabs><AgendaPage /></WithTabs>} />
        <Route path="/agenda/novo" element={<main className="app-main no-tabs"><EventEditorPage /></main>} />
        <Route path="/agenda/:id" element={<main className="app-main no-tabs"><EventEditorPage /></main>} />
        <Route path="/perfil" element={<main className="app-main no-tabs"><ProfilePage /></main>} />
        <Route path="/perfil/avatar" element={<main className="app-main no-tabs"><AvatarEditorPage /></main>} />
        <Route path="/conquistas" element={<main className="app-main no-tabs"><ConquistasPage /></main>} />
        <Route path="/historico" element={<WithTabs><HistoryPage /></WithTabs>} />
        <Route path="/estatisticas" element={<WithTabs><StatsPage /></WithTabs>} />
        <Route path="/ajustes" element={<WithTabs><SettingsPage /></WithTabs>} />
        <Route path="/tracker/new" element={<main className="app-main no-tabs"><TrackerBuilderPage /></main>} />
        <Route path="/tracker/:id" element={<main className="app-main no-tabs"><TrackerBuilderPage /></main>} />
        <Route path="/onboarding" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <HashRouter>
      <ToastProvider>
        <Shell />
      </ToastProvider>
    </HashRouter>
  )
}
