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

/** Hoje: a marca do Controlle (C com check que termina num ponto), em traço de ícone. */
export const IconToday = ({ size = 26, className }: IconProps) => (
  <svg {...base(size)} viewBox="0 0 100 100" strokeWidth={10.5} className={className}>
    <path d="M48.46 22.43 A28 28 0 1 0 61.60 71.45 L70.02 64.38" />
    <circle cx="85.35" cy="51.52" r="7" fill="currentColor" stroke="none" />
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

export const IconCalendarPlus = ({ size = 18, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="4" />
    <path d="M8 3v4M16 3v4M3.5 10h17M12 13.5v4M10 15.5h4" />
  </svg>
)

/** Agenda: folha de calendário com um horário marcado. */
export const IconAgenda = ({ size = 26, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="4" />
    <path d="M8 3v4M16 3v4M3.5 10h17" />
    <path d="M8 14h5M8 17h8" />
  </svg>
)

export const IconCamera = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.7l1.3-2h5l1.3 2h1.7A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z" />
    <circle cx="12" cy="12.5" r="3.5" />
  </svg>
)

export const IconUpload = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 15v3.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V15" />
  </svg>
)

export const IconClock = ({ size = 18, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
)

export const IconPin = ({ size = 18, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
    <circle cx="12" cy="10" r="2.3" />
  </svg>
)
