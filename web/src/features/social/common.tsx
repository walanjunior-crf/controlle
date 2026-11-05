import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { BrandText } from '../../components/BrandText'
import { IconChevronLeft } from '../../components/icons'
import type { Person } from '../../platform/cloud/social'
import { Avatar } from '../profile/Avatar'
import './social.css'

/** carrega dados da nuvem com estado de carregando/erro e um "recarregar" */
export function useCloudData<T>(load: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | undefined>(undefined)
  const [error, setError] = useState(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(load, deps)
  const reload = useCallback(async () => {
    try {
      setData(await run())
      setError(false)
    } catch (e) {
      console.warn('[grupos]', e)
      setError(true)
    }
  }, [run])
  useEffect(() => {
    void reload()
    const onVisible = () => document.visibilityState === 'visible' && void reload()
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [reload])
  return { data, error, reload }
}

export function PageHeader({ title, fallback, right }: { title: string; fallback?: string; right?: React.ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  return (
    <header className={`page-head soc-head${fallback ? ' with-back' : ''}`}>
      {fallback && (
        <button type="button" className="icon-btn" aria-label="Voltar" onClick={() => (location.key === 'default' ? navigate(fallback, { replace: true }) : navigate(-1))}>
          <IconChevronLeft />
        </button>
      )}
      <BrandText as="h1" className="page-title soc-title">
        {title}
      </BrandText>
      {right}
    </header>
  )
}

/** avatar de outra pessoa (do perfil público) */
export function PersonAvatar({ p, size = 44 }: { p: Person; size?: number }) {
  return <Avatar profile={{ displayName: p.display_name || '?', avatar: p.avatar ?? { kind: 'initials' }, color: 'green-500' }} size={size} decorative />
}

export function PersonLine({ p, children, sub }: { p: Person; children?: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="soc-person">
      <PersonAvatar p={p} />
      <div className="soc-person-text">
        <strong>{p.display_name || 'Sem nome'}</strong>
        <span className="muted">{sub ?? `${p.handle ? `@${p.handle} · ` : ''}Nível ${p.level} · ${p.items} ${p.items === 1 ? 'item' : 'itens'}`}</span>
      </div>
      {children && <div className="soc-person-actions">{children}</div>}
    </div>
  )
}

export function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="card soc-empty">
      <p>Não foi possível carregar agora. Confira a internet.</p>
      <button type="button" className="btn btn-small btn-ghost" onClick={onRetry}>
        Tentar de novo
      </button>
    </div>
  )
}

/** "há 5 min", "ontem" */
export function when(iso: string): string {
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'agora'
  const m = Math.round(s / 60)
  if (m < 60) return `há ${m} min`
  const h = Math.round(m / 60)
  if (h < 24) return `há ${h} h`
  const d = Math.round(h / 24)
  return d === 1 ? 'ontem' : `há ${d} dias`
}
