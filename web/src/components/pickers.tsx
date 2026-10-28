import { useState } from 'react'
import { COLOR_TOKENS, EXTENDED_SWATCHES, colorFor } from './colors'

export const HABIT_EMOJIS = [
  '💊', '💧', '🏋️', '🏃', '🚴', '🧘', '📖', '😴',
  '🥗', '🍎', '🥦', '☕', '🚭', '🚫', '🍷', '🦷',
  '🧴', '🪥', '🚿', '🛏️', '🧠', '✍️', '📝', '🎸',
  '🎨', '🗣️', '🌍', '💻', '📵', '🌞', '🌙', '🚶',
  '🧹', '🪴', '🐶', '💰', '📚', '🙏', '❤️', '😊',
  '⚖️', '🩺', '💉', '🥛', '🍵', '🏊', '⚽', '⭐',
]

export function EmojiPicker({ value, onChange }: { value: string; onChange: (emoji: string) => void }) {
  const [custom, setCustom] = useState('')
  return (
    <div className="emoji-picker">
      <div className="emoji-grid" role="radiogroup" aria-label="Ícone">
        {HABIT_EMOJIS.map((e) => (
          <button
            key={e}
            type="button"
            role="radio"
            aria-checked={value === e}
            className={value === e ? 'is-on' : ''}
            onClick={() => onChange(e)}
          >
            {e}
          </button>
        ))}
      </div>
      <input
        className="input emoji-custom"
        type="text"
        placeholder="Ou cole qualquer emoji aqui"
        aria-label="Emoji personalizado"
        value={custom}
        onChange={(ev) => {
          const v = ev.target.value
          setCustom(v)
          // pega o último grafema digitado/colado
          const seg =
            typeof Intl !== 'undefined' && 'Segmenter' in Intl
              ? Array.from(new Intl.Segmenter('pt-BR', { granularity: 'grapheme' }).segment(v.trim()), (s) => s.segment)
              : Array.from(v.trim())
          const last = seg[seg.length - 1]
          if (last) onChange(last)
        }}
      />
    </div>
  )
}

export function ColorPicker({
  value,
  onChange,
  extended = false,
}: {
  value: string
  onChange: (token: string) => void
  /** paleta grande (14 famílias × 4 tons) e cor personalizada, para etiquetas */
  extended?: boolean
}) {
  const same = (a: string, b: string) => a.toUpperCase() === b.toUpperCase()
  const custom = extended && /^#[0-9a-f]{6}$/i.test(value) && !EXTENDED_SWATCHES.some((r) => r.some((s) => same(s.hex, value)))
  return (
    <div className={`color-picker${extended ? ' is-extended' : ''}`} role="radiogroup" aria-label="Cor">
      {extended && <p className="color-group-label">Cores do Controlle</p>}
      <div className="color-row">
        {COLOR_TOKENS.map((c) => (
          <button
            key={c.token}
            type="button"
            role="radio"
            aria-checked={value === c.token}
            aria-label={c.label}
            className={value === c.token ? 'is-on' : ''}
            style={{ ['--swatch' as string]: colorFor(c.token) }}
            onClick={() => onChange(c.token)}
          >
            <span aria-hidden="true" />
          </button>
        ))}
      </div>
      {extended && (
        <>
          <p className="color-group-label">Tons</p>
          <div className="color-grid">
            {EXTENDED_SWATCHES.flat().map((s) => (
              <button
                key={s.hex}
                type="button"
                role="radio"
                aria-checked={same(value, s.hex)}
                aria-label={s.label}
                className={same(value, s.hex) ? 'is-on' : ''}
                style={{ ['--swatch' as string]: s.hex }}
                onClick={() => onChange(s.hex)}
              >
                <span aria-hidden="true" />
              </button>
            ))}
          </div>
          <label className={`color-custom${custom ? ' is-on' : ''}`} style={{ ['--swatch' as string]: custom ? value : 'transparent' }}>
            <span className="color-custom-dot" aria-hidden="true" />
            <span>{custom ? 'Cor personalizada' : 'Escolher outra cor…'}</span>
            <input
              type="color"
              aria-label="Cor personalizada"
              value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#2f7f7a'}
              onChange={(e) => onChange(e.target.value.toUpperCase())}
            />
          </label>
        </>
      )}
    </div>
  )
}
