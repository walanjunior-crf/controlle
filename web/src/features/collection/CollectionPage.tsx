import { Link, useLocation, useNavigate } from 'react-router-dom'
import { CATEGORIES, TIERS, TIER_LABELS, unlockKey, type CategoryProgress, type Tier } from '../../domain'
import { BrandText } from '../../components/BrandText'
import { IconChevronLeft } from '../../components/icons'
import { useRewards } from '../../hooks/useRewards'
import { ITEMS, SLOT_LABELS, itemFor, type CollectionItem } from './items'
import { renderAvatar } from '../../avatar'
import { saveProfile } from '../../db/db'
import type { AvatarConfig } from '../../domain/types'
import { useToast } from '../../components/Toast'
import { useProfileLoaded } from '../profile/Avatar'
import { DEFAULT_AVATAR, normalizeAvatar } from '../profile/avatarParts'
import '../profile/profile.css'
import './collection.css'

/** Álbum: cada tema de hábito com seus três itens (comum, rara, lendária). */
export function CollectionPage() {
  const r = useRewards()
  const profile = useProfileLoaded()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const back = () => (location.key === 'default' ? navigate('/perfil', { replace: true }) : navigate(-1))

  if (!r.ready || !profile) return <div className="page" aria-busy="true" />

  // miniaturas e "usar" partem do avatar montado da pessoa (ou do padrão)
  const mine: AvatarConfig = normalizeAvatar(profile.avatar.kind === 'custom' ? profile.avatar.config : (profile.customAvatar ?? DEFAULT_AVATAR))
  const base: AvatarConfig = { ...mine, costume: 'nenhum' }
  const wearing = (it: CollectionItem) => profile.avatar.kind === 'custom' && String(profile.avatar.config[it.key]) === it.id
  const use = async (it: CollectionItem) => {
    const prev = profile.avatar
    const config: AvatarConfig = { ...mine, [it.key]: it.id, ...(it.slot === 'mao' || it.slot === 'vestir' ? { costume: 'nenhum' } : {}) }
    try {
      await saveProfile({ avatar: { kind: 'custom', config } })
      toast.show(`${it.name} no seu avatar`, { label: 'Desfazer', onAction: () => void saveProfile({ avatar: prev }) })
    } catch {
      toast.show('Não foi possível usar agora.')
    }
  }

  const { byCategory, unlocked } = r.collection
  // temas em uso primeiro (mais checks antes); os sem hábito vão para o fim
  const order = [...CATEGORIES].sort((a, b) => {
    const pa = byCategory[a.id]
    const pb = byCategory[b.id]
    if (!pa.trackers !== !pb.trackers) return pa.trackers ? -1 : 1
    return pb.checks - pa.checks
  })

  return (
    <div className="page">
      <header className="page-head with-back">
        <button type="button" className="icon-btn" aria-label="Voltar" onClick={back}>
          <IconChevronLeft />
        </button>
        <BrandText as="h1" className="page-title">
          Coleção
        </BrandText>
      </header>

      <div className="card col-summary">
        <p className="col-summary-count">
          <strong className="num">{unlocked.size}</strong>
          <span>
            de <span className="num">{ITEMS.length}</span> itens
          </span>
        </p>
        <div className="level-bar" aria-hidden="true">
          <span style={{ width: `${Math.round((unlocked.size / ITEMS.length) * 100)}%` }} />
        </div>
        <p className="col-summary-text">
          Cada tema de hábito guarda três itens para o avatar. Eles chegam com a prática, em <span className="num">{TIERS[0]}</span>, <span className="num">{TIERS[1]}</span> e <span className="num">{TIERS[2]}</span> checks.
        </p>
      </div>

      {order.map((c) => (
        <CategoryCard key={c.id} p={byCategory[c.id]} has={(t) => unlocked.has(unlockKey(c.id, t))} base={base} wearing={wearing} onUse={(it) => void use(it)} />
      ))}

      <p className="muted col-foot">
        O tema de cada hábito aparece na hora de criar ou editar. <Link to="/tracker/new">Criar um hábito</Link>
      </p>
    </div>
  )
}

interface CardProps {
  p: CategoryProgress
  has: (t: Tier) => boolean
  base: AvatarConfig
  wearing: (it: CollectionItem) => boolean
  onUse: (it: CollectionItem) => void
}

/** recorte da miniatura: objeto na mão mostra o braço erguido; o resto, o avatar inteiro */
const THUMB_VIEW: Record<CollectionItem['slot'], string> = { mao: '0 26 62 62', vestir: '0 0 100 100', fundo: '0 0 100 100' }

function CategoryCard({ p, has, base, wearing, onUse }: CardProps) {
  const info = CATEGORIES.find((c) => c.id === p.category)!
  const next = p.next
  return (
    <section className={`card col-cat${p.trackers ? '' : ' is-idle'}`} aria-label={info.label}>
      <header className="col-cat-head">
        <span className="col-cat-icon" aria-hidden="true">
          {info.icon}
        </span>
        <div className="col-cat-title">
          <h2>{info.label}</h2>
          <p className="num">
            {p.trackers
              ? `${p.checks.toLocaleString('pt-BR')} ${p.checks === 1 ? 'check' : 'checks'} · ${p.trackers} ${p.trackers === 1 ? 'hábito' : 'hábitos'}`
              : 'Nenhum hábito com este tema ainda'}
          </p>
        </div>
        <span className={`col-cat-count num${p.reached === 3 ? ' is-full' : ''}`}>{p.reached}/3</span>
      </header>

      <ul className="col-items">
        {([1, 2, 3] as Tier[]).map((t) => {
          const it = itemFor(p.category, t)
          const on = has(t)
          const isNext = !on && next?.tier === t && p.trackers > 0
          const from = t > 1 ? TIERS[t - 2] : 0
          const pct = isNext ? Math.max(0, Math.min(1, (p.checks - from) / (TIERS[t - 1] - from))) : 0
          return (
            <li key={t} className={`col-item tier-${t}${on ? ' is-on' : ''}${isNext ? ' is-next' : ''}`}>
              <span className="col-item-art" aria-hidden="true">
                <svg viewBox={THUMB_VIEW[it.slot]} dangerouslySetInnerHTML={{ __html: renderAvatar({ ...base, [it.key]: it.id }, { detail: 'lite' }) }} />
                {!on && <span className="col-item-lockbadge">🔒</span>}
              </span>
              <div className="col-item-body">
                <div className="col-item-line">
                  <strong>{it.name}</strong>
                  <span className={`col-tier tier-${t}`}>{TIER_LABELS[t]}</span>
                </div>
                {isNext && next ? (
                  <>
                    <div className="col-item-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct * 100)} aria-label={`Progresso até ${it.name}`}>
                      <span style={{ width: `${Math.round(pct * 100)}%` }} />
                    </div>
                    <p className="col-item-sub num">
                      {next.left === 1 ? 'Falta 1 check' : `Faltam ${next.left} checks`}
                    </p>
                  </>
                ) : (
                  <p className="col-item-sub">
                    {SLOT_LABELS[it.slot]}
                    {!on && <span className="num"> · {TIERS[t - 1]} checks</span>}
                  </p>
                )}
              </div>
              {on ? (
                wearing(it) ? (
                  <span className="col-item-wearing">Usando</span>
                ) : (
                  <button type="button" className="btn btn-small btn-ghost col-item-use" onClick={() => onUse(it)} aria-label={`Usar ${it.name} no avatar`}>
                    Usar
                  </button>
                )
              ) : null}
            </li>
          )
        })}
      </ul>
      {!next && <p className="col-done">Tema completo! 🎉</p>}
    </section>
  )
}
