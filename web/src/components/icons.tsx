/** Ícones SVG próprios (traço 2, cantos redondos), herdam currentColor. */
interface IconProps {
  size?: number
  className?: string
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
})

/** Hoje: o C-anel com um ponto (o toque do dia). */
export const IconToday = ({ size = 26, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M18.4 7.3A8 8 0 1 0 18.4 16.7" strokeWidth={2.4} />
    <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
  </svg>
)

export const IconHistory = ({ size = 26, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="4" />
    <path d="M8 3v4M16 3v4M3.5 10h17" />
    <circle cx="8.5" cy="14.5" r="1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="14.5" r="1" fill="currentColor" stroke="none" />
    <circle cx="15.5" cy="14.5" r="1" fill="currentColor" stroke="none" />
  </svg>
)

export const IconStats = ({ size = 26, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M5 20V13M10 20V8M15 20v-5M20 20V5" strokeWidth={2.6} />
  </svg>
)

export const IconSettings = ({ size = 26, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
    <circle cx="15" cy="7" r="2.3" />
    <circle cx="9" cy="17" r="2.3" />
  </svg>
)

export const IconPlus = ({ size = 22, className }: IconProps) => (
  <svg {...base(size)} className={className} strokeWidth={2.6}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const IconMore = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <circle cx="5.5" cy="12" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="18.5" cy="12" r="1.4" fill="currentColor" stroke="none" />
  </svg>
)

export const IconChevronLeft = ({ size = 22, className }: IconProps) => (
  <svg {...base(size)} className={className} strokeWidth={2.4}>
    <path d="M15 5l-7 7 7 7" />
  </svg>
)

export const IconChevronRight = ({ size = 22, className }: IconProps) => (
  <svg {...base(size)} className={className} strokeWidth={2.4}>
    <path d="M9 5l7 7-7 7" />
  </svg>
)

export const IconUp = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className} strokeWidth={2.4}>
    <path d="M6 14l6-6 6 6" />
  </svg>
)

export const IconDown = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className} strokeWidth={2.4}>
    <path d="M6 10l6 6 6-6" />
  </svg>
)

export const IconTrash = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 12.5h9l1-12.5" />
  </svg>
)

export const IconClose = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className} strokeWidth={2.4}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)

export const IconBell = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z" />
    <path d="M10 20.5a2.2 2.2 0 0 0 4 0" />
  </svg>
)

export const IconShare = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M12 3.5v11M8 7.5l4-4 4 4" />
    <path d="M7 11H5.5v9.5h13V11H17" />
  </svg>
)

export const IconCheck = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className} strokeWidth={2.6}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
)
