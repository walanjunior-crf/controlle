import { useState } from 'react'
import { COLOR_TOKENS, colorFor } from './colors'

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

export function ColorPicker({ value, onChange }: { value: string; onChange: (token: string) => void }) {
  return (
    <div className="color-picker" role="radiogroup" aria-label="Cor">
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
  )
}
