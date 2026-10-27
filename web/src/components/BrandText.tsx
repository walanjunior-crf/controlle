import type { ReactNode } from 'react'

type Tag = 'h1' | 'h2' | 'h3' | 'span' | 'p' | 'strong'

interface BrandTextProps {
  as?: Tag
  children: string
  className?: string
  id?: string
}

/** Envolve cada c/C/ç/Ç em <span class="brand-c"> (glifo C-anel + cor primária). */
export function brandify(text: string): ReactNode[] {
  const parts: ReactNode[] = []
  let buf = ''
  let k = 0
  for (const ch of text) {
    if (ch === 'c' || ch === 'C' || ch === 'ç' || ch === 'Ç') {
      if (buf) parts.push(buf)
      buf = ''
      parts.push(
        <span key={k++} className="brand-c">
          {ch}
        </span>,
      )
    } else buf += ch
  }
  if (buf) parts.push(buf)
  return parts
}

export function BrandText({ as = 'span', children, className, id }: BrandTextProps) {
  const Tag = as
  return (
    <Tag className={className} id={id}>
      {brandify(children)}
    </Tag>
  )
}
