import { Link, useLocation, useNavigate } from 'react-router-dom'
import { CATEGORIES, TIERS, TIER_LABELS, unlockKey, type CategoryProgress, type Tier } from '../../domain'
import { BrandText } from '../../components/BrandText'
import { IconChevronLeft } from '../../components/icons'
import { useRewards } from '../../hooks/useRewards'
import { ITEMS, SLOT_LABELS, itemFor } from './items'
import '../profile/profile.css'
import './collection.css'

/** Álbum: cada tema de hábito com seus três itens (comum, rara, lendária). */
export function CollectionPage() {
  const r = useRewards()
  const navigate = useNavigate()
  const location = useLocation()
  const back = () => (location.key === 'default' ? navigate('/perfil', { replace: true }) : navigate(-1))

  if (!r.ready) return <div className="page" aria-busy="true" />

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
          <strong className="num">{unlocked.size}</strong> de <span className="num">{ITEMS.length}</span> itens
        </p>
        <p className="muted">
          Cada tema de hábito tem três itens. Eles chegam com a prática: {TIERS[0]}, {TIERS[1]} e {TIERS[2]} checks somando os hábitos do tema.
        </p>
      </div>

      {order.map((c) => (
        <CategoryCard key={c.id} p={byCategory[c.id]} has={(t) => unlocked.has(unlockKey(c.id, t))} />
      ))}

      <p className="muted col-foot">
        O tema de cada hábito aparece na hora de criar ou editar. <Link to="/tracker/new">Criar um hábito</Link>
      </p>
    </div>
  )
}

function CategoryCard({ p, has }: { p: CategoryProgress; has: (t: Tier) => boolean }) {
  const info = CATEGORIES.find((c) => c.id === p.category)!
  const next = p.next
  const prev = next ? (next.tier > 1 ? TIERS[next.tier - 2] : 0) : 0
  const pct = next ? Math.max(0, Math.min(1, (p.checks - prev) / (next.target - prev))) : 1
  const nextItem = next ? itemFor(p.category, next.tier) : null
  return (
    <section className={`card col-cat${p.trackers ? '' : ' is-idle'}`} aria-label={info.label}>
      <div className="col-cat-head">
        <span className="col-cat-icon" aria-hidden="true">
          {info.icon}
        </span>
        <div className="col-cat-title">
          <h2>{info.label}</h2>
          <span className="muted num">
            {p.trackers
              ? `${p.checks.toLocaleString('pt-BR')} ${p.checks === 1 ? 'check' : 'checks'} · ${p.trackers} ${p.trackers === 1 ? 'hábito' : 'hábitos'}`
              : 'Nenhum hábito com este tema'}
          </span>
        </div>
        <span className="col-cat-count num">{p.reached}/3</span>
      </div>

      <ul className="col-items">
        {([1, 2, 3] as Tier[]).map((t) => {
          const it = itemFor(p.category, t)
          const on = has(t)
          return (
            <li key={t} className={`col-item tier-${t}${on ? ' is-on' : ''}`} aria-label={on ? it.name : `${it.name}, bloqueado: ${TIERS[t - 1]} checks`}>
              <span className="col-item-art" aria-hidden="true">
                <span className="col-item-emoji">{it.emoji}</span>
                {!on && <span className="col-item-lock">🔒</span>}
              </span>
              <strong>{it.name}</strong>
              <span className="col-item-meta">
                {TIER_LABELS[t]} · {SLOT_LABELS[it.slot]}
              </span>
              {!on && <span className="col-item-meta num">{TIERS[t - 1]} checks</span>}
            </li>
          )
        })}
      </ul>

      {next && nextItem && p.trackers > 0 && (
        <>
          <div className="ach-bar" aria-hidden="true">
            <span style={{ width: `${Math.round(pct * 100)}%` }} />
          </div>
          <p className="col-next">
            {next.left === 1 ? 'Falta' : 'Faltam'} <strong className="num">{next.left}</strong> {next.left === 1 ? 'check' : 'checks'} para {nextItem.name}.
          </p>
        </>
      )}
      {!next && <p className="col-next is-done">Tema completo! 🎉</p>}
    </section>
  )
}
