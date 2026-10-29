import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ACHIEVEMENTS } from '../../domain'
import type { AchievementId, AvatarConfig } from '../../domain'
import { saveProfile } from '../../db/db'
import { BrandText } from '../../components/BrandText'
import { IconChevronLeft } from '../../components/icons'
import { useToast } from '../../components/Toast'
import { useRewards } from '../../hooks/useRewards'
import { Avatar, useProfileLoaded } from './Avatar'
import {
  BEARD_SPECIES, CATALOG, COATS, COSTUMES, FURS, SHARK_COATS, SHARK_FURS, DEFAULT_AVATAR, HAIR_SPECIES, SPECIES_FUR,
  isOwned, lockHint, normalizeAvatar, ownKey, unlockRank,
  type ColorPart, type Key, type Part,
} from './avatarParts'
import { renderAvatar } from '../../avatar'
import { Sheet } from '../../components/Sheet'
import './profile.css'

interface Section {
  key: Key
  /** recorte das miniaturas (viewBox) para peças pequenas */
  zoom?: string
  /** só aparece quando faz sentido para o bicho escolhido */
  when?: (c: AvatarConfig) => boolean
  /** catálogo que depende do bicho (ex.: tubarão só em cores de tubarão) */
  parts?: (c: AvatarConfig) => (Part | ColorPart)[]
}

const isShark = (c: AvatarConfig) => c.species === 'tubarao'

const isDog = (c: AvatarConfig) => c.species === 'cachorro'
const hasBreed = (c: AvatarConfig) => isDog(c) && c.breed !== 'srd'
interface Tab {
  id: string
  label: string
  sections: Section[]
}

const TABS: Tab[] = [
  { id: 'bicho', label: 'Bicho', sections: [{ key: 'species' }, { key: 'breed', when: isDog }] },
  { id: 'jeito', label: 'Jeito', sections: [{ key: 'persona', zoom: '22 30 56 56' }] },
  { id: 'pelagem', label: 'Pelagem', sections: [{ key: 'fur', when: (c) => !hasBreed(c), parts: (c) => (isShark(c) ? SHARK_FURS : FURS) },
      { key: 'coat', when: (c) => !hasBreed(c), parts: (c) => (isShark(c) ? COATS.filter((p) => SHARK_COATS.has(p.id)) : COATS) },
    ] },
  {
    id: 'rosto',
    label: 'Rosto',
    sections: [
      { key: 'eyes', zoom: '27 29 46 46' },
      { key: 'eyeColor' },
      { key: 'brows', zoom: '29 25 42 42' },
      { key: 'mouth', zoom: '33 47 34 34' },
      { key: 'beard', zoom: '30 44 40 40', when: (c) => BEARD_SPECIES.has(c.species) },
      { key: 'cheeks', zoom: '22 34 56 56' },
    ],
  },
  {
    id: 'cabeca',
    label: 'Cabeça',
    sections: [
      { key: 'hat' },
      { key: 'hatColor' },
      { key: 'hair', when: (c) => HAIR_SPECIES.has(c.species) },
      { key: 'hairColor', when: (c) => HAIR_SPECIES.has(c.species) && c.hair !== 'nenhum' },
    ],
  },
  { id: 'oculos', label: 'Óculos', sections: [{ key: 'glasses', zoom: '22 24 56 56' }, { key: 'glassesColor' }] },
  {
    id: 'joias',
    label: 'Brincos e piercing',
    sections: [
      { key: 'earrings', zoom: '8 10 84 84' },
      { key: 'earringSide', zoom: '8 10 84 84', when: (c) => c.earrings !== 'nenhum' },
      { key: 'piercing', zoom: '26 30 48 48' },
      { key: 'piercingSide', zoom: '26 30 48 48', when: (c) => ['nariz', 'sobrancelha', 'labio'].includes(c.piercing) },
      { key: 'metal' },
    ],
  },
  { id: 'roupa', label: 'Roupa', sections: [{ key: 'outfit', zoom: '10 30 80 80' }, { key: 'outfitColor' }] },
  { id: 'fantasia', label: 'Fantasia', sections: [{ key: 'costume' }] },
  { id: 'fundo', label: 'Fundo', sections: [{ key: 'bg' }, { key: 'pattern' }] },
]


/** chance de "nenhum" no Surpreenda-me, para não virar um carnaval toda vez */
const NONE_WEIGHT: Partial<Record<Key, number>> = {
  costume: 0.8,
  beard: 0.8,
  piercing: 0.75,
  earrings: 0.55,
  glasses: 0.55,
  hat: 0.45,
  hair: 0.45,
  brows: 0.5,
  cheeks: 0.4,
  pattern: 0.5,
}

const achTitle = (id: AchievementId) => ACHIEVEMENTS.find((a) => a.id === id)?.title ?? id
const valueOf = (p: Part | ColorPart) => ('hex' in p ? p.hex : p.id)

export function AvatarEditorPage() {
  const profile = useProfileLoaded()
  const rewards = useRewards()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const [draft, setDraft] = useState<AvatarConfig | null>(null)
  const [tab, setTab] = useState('bicho')
  const [buying, setBuying] = useState<{ key: Key; part: Part | ColorPart } | null>(null)
  const [hint, setHint] = useState('')

  const start = useMemo(() => (profile?.avatar.kind === 'custom' ? normalizeAvatar(profile.avatar.config) : DEFAULT_AVATAR), [profile])
  const cfg = draft ?? start
  const back = () => (location.key === 'default' ? navigate('/perfil', { replace: true }) : navigate(-1))

  if (!profile || !rewards.ready) return <div className="page" aria-busy="true" />

  const { level, wallet, credits } = rewards
  const current = TABS.find((t) => t.id === tab) ?? TABS[0]
  const open = (key: Key, p: Part) => isOwned(key, p, wallet)
  const costume = COSTUMES.find((c) => c.id === cfg.costume)

  const choose = (key: Key, p: Part | ColorPart) => {
    if (!open(key, p)) {
      if (p.unlock) setHint(`${p.label} vem com a conquista ${achTitle(p.unlock.achievement)}.`)
      else setBuying({ key, part: p })
      return
    }
    setHint('')
    const next: AvatarConfig = { ...cfg, [key]: valueOf(p) }
    // trocar de bicho troca também a pelagem, se a pessoa ainda não tinha mexido nela
    if (key === 'species' && cfg.fur.toLowerCase() === (SPECIES_FUR[cfg.species] ?? '').toLowerCase()) next.fur = SPECIES_FUR[p.id] ?? cfg.fur
    if (key === 'species' && p.id === 'tubarao' && !SHARK_FURS.some((x) => x.hex.toLowerCase() === next.fur.toLowerCase())) next.fur = SHARK_FURS[0].hex
    setDraft(next)
  }

  const randomize = () => {
    const next = { ...cfg }
    for (const key of Object.keys(CATALOG) as Key[]) {
      const ok = (CATALOG[key].parts as Part[]).filter((p) => open(key, p))
      const none = ok.find((p) => p.id === 'nenhum')
      const pickNone = none && Math.random() < (NONE_WEIGHT[key] ?? 0)
      const pool = none ? ok.filter((p) => p !== none) : ok
      const p = pickNone || !pool.length ? none! : pool[Math.floor(Math.random() * pool.length)]
      next[key] = valueOf(p)
    }
    if (Math.random() < 0.6) next.fur = SPECIES_FUR[next.species] ?? next.fur
    setDraft(next)
    setHint('')
  }

  const save = async () => {
    const prev = profile.avatar
    try {
      await saveProfile({ avatar: { kind: 'custom', config: cfg } })
      toast.show('Avatar salvo', { label: 'Desfazer', onAction: () => void saveProfile({ avatar: prev }) })
      back()
    } catch {
      toast.show('Não foi possível salvar o avatar.')
    }
  }

  const buy = async () => {
    if (!buying) return
    const { key, part } = buying
    const price = part.price ?? 0
    if (price > credits.balance) return
    const next = new Set(wallet.owned)
    next.add(ownKey(key, part))
    try {
      await saveProfile({ owned: [...next] })
      setBuying(null)
      setDraft({ ...cfg, [key]: valueOf(part) })
      toast.show(`${part.label} é seu!`)
    } catch {
      toast.show('Não foi possível comprar agora.')
    }
  }

  const isOn = (key: Key, p: Part | ColorPart) => ('hex' in p ? cfg[key].toLowerCase() === p.hex.toLowerCase() : cfg[key] === p.id)
  const preview = { ...profile, avatar: { kind: 'custom' as const, config: cfg } }

  /** aviso quando a fantasia cobre o que a pessoa está escolhendo */
  const coveredBy = (key: Key): string | null => {
    if (cfg.costume === 'nenhum' || !costume) return null
    const hood = cfg.costume === 'dinossauro' || cfg.costume === 'tubarao'
    if (key === 'outfit') return costume.label
    if ((key === 'hat' && cfg.costume !== 'terno') || (hood && (key === 'hair' || key === 'earrings'))) return costume.label
    return null
  }

  return (
    <div className="page profile-page">
      <header className="page-head with-back">
        <button type="button" className="icon-btn" aria-label="Voltar" onClick={back}>
          <IconChevronLeft />
        </button>
        <BrandText as="h1" className="page-title">
          Montar avatar
        </BrandText>
      </header>

      <section className="ae-stage" aria-label="Pré-visualização">
        <Avatar profile={preview} size={150} ring alive pettable />
        <p className="ae-wallet">
          <span className="ae-coins num">🪙 {credits.balance}</span> {credits.balance === 1 ? 'crédito' : 'créditos'} · Nível {level.level} ({level.title})
        </p>
        <p className="muted ae-tip">Toque no avatar para fazer carinho. Cada nível novo dá créditos para trocar por peças.</p>
      </section>

      <div className="ae-tabs" role="tablist" aria-label="Partes do avatar">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className="ae-tab"
            onClick={() => {
              setTab(t.id)
              setHint('')
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card profile-card ae-panel" role="tabpanel" aria-label={current.label}>
        {current.id === 'pelagem' && hasBreed(cfg) && (
          <p className="ae-note">
            A raça {CATALOG.breed.parts.find((b) => b.id === cfg.breed)?.label} já vem com pelagem própria. Para escolher cor e estampa, use Vira-lata na aba Bicho.
          </p>
        )}
        {current.id === 'cabeca' && !HAIR_SPECIES.has(cfg.species) && <p className="ae-note muted-note">Peruca não combina com este bicho.</p>}
        {current.sections.filter((sec) => !sec.when || sec.when(cfg)).map(({ key, zoom, parts }) => {
          const cat = CATALOG[key]
          const cover = coveredBy(key)
          return (
            <div key={key} className="ae-section">
              {current.sections.filter((sec) => !sec.when || sec.when(cfg)).length > 1 && <h3 className="ae-section-title">{cat.label}</h3>}
              {cover && <p className="ae-note">A fantasia {cover} cobre esta parte. Tire a fantasia para ver.</p>}
              <div className={`ae-options${cat.color && key !== 'fur' ? ' is-colors' : ''}`} role="group" aria-label={cat.label}>
                {[...(parts ? parts(cfg) : (cat.parts as (Part | ColorPart)[]))].sort((a, b) => unlockRank(a) - unlockRank(b)).map((p) => {
                  const locked = !open(key, p)
                  const on = isOn(key, p)
                  const lockText = lockHint(p, achTitle)
                  const thumbCfg = { ...cfg, ...(key === 'costume' ? {} : { costume: 'nenhum' }), [key]: valueOf(p) }
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className={`ae-opt${locked ? ' is-locked' : ''}`}
                      aria-pressed={on}
                      aria-label={locked ? `${p.label} (bloqueado: ${lockText})` : p.label}
                      title={p.label}
                      onClick={() => choose(key, p)}
                    >
                      {'hex' in p && key !== 'fur' ? (
                        <span className="ae-swatch" style={{ background: p.hex }} aria-hidden="true">
                          {locked && <span className="ae-swatch-lock">{p.unlock ? '🏆' : p.price}</span>}
                        </span>
                      ) : (
                        <span className={`ae-opt-art${zoom ? ' is-zoom' : ''}`}>
                          <svg viewBox={zoom ?? '0 0 100 100'} aria-hidden="true" dangerouslySetInnerHTML={{ __html: renderAvatar(thumbCfg, { detail: 'lite' }) }} />
                        </span>
                      )}
                      {!(cat.color && key !== 'fur') && <span>{p.label}</span>}
                      {locked && !(cat.color && key !== 'fur') && (
                        <span className="ae-lock">{p.unlock ? `🏆 ${lockText}` : `🪙 ${p.price}`}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
        <p className="ae-hint" role="status" aria-live="polite">
          {hint}
        </p>
      </div>

      <Sheet
        open={buying !== null}
        onClose={() => setBuying(null)}
        title={buying ? `Comprar ${buying.part.label}?` : ''}
        footer={
          buying && (
            <div className="feedback-actions">
              <button type="button" className="btn btn-primary btn-block" disabled={(buying.part.price ?? 0) > credits.balance} onClick={() => void buy()}>
                Comprar por {buying.part.price} {buying.part.price === 1 ? 'crédito' : 'créditos'}
              </button>
              <button type="button" className="btn btn-ghost btn-block" onClick={() => setBuying(null)}>
                Agora não
              </button>
            </div>
          )
        }
      >
        {buying && (
          <div className="ae-buy">
            <span className="ae-buy-art">
              <svg viewBox="0 0 100 100" aria-hidden="true" dangerouslySetInnerHTML={{ __html: renderAvatar({ ...cfg, [buying.key]: valueOf(buying.part) }) }} />
            </span>
            <p>
              Você tem <strong className="num">{credits.balance}</strong> {credits.balance === 1 ? 'crédito' : 'créditos'}.
              {(buying.part.price ?? 0) > credits.balance
                ? ` Faltam ${(buying.part.price ?? 0) - credits.balance}. Cada nível novo dá mais créditos.`
                : ' A peça fica sua para sempre.'}
            </p>
          </div>
        )}
      </Sheet>

      <div className="ae-actions">
        <button type="button" className="btn btn-primary" onClick={() => void save()}>
          Usar este avatar
        </button>
        <button type="button" className="btn btn-ghost" onClick={randomize}>
          Surpreenda-me
        </button>
      </div>
    </div>
  )
}
