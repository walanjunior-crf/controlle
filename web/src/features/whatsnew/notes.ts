/**
 * Novidades de cada versão, mostradas uma vez na primeira abertura depois de atualizar.
 * Escreva para quem usa: frases curtas, o que mudou e onde achar. Mais nova primeiro.
 */
export interface ReleaseNote {
  version: string
  title: string
  items: Array<{ icon: string; text: string }>
  /** só para quem tem o teste da nuvem ligado */
  beta?: boolean
}

export const RELEASES: ReleaseNote[] = [
  {
    version: '0.6.0',
    title: 'Juntos: hábitos com os amigos',
    beta: true,
    items: [
      { icon: '☁️', text: 'Conta com e-mail: seus hábitos ganham cópia na nuvem e voltam sozinhos se você trocar de celular. No Perfil, embaixo do seu nome.' },
      { icon: '🤝', text: 'Juntos: adicione amigos, crie grupos e chame a turma por link. Em Perfil → Amigos e grupos.' },
      { icon: '🏁', text: 'Desafios em grupo com placar. No modo Check-in, cada um posta o dia (com foto, se quem criou pedir) e a turma reage e comenta.' },
      { icon: '💬', text: 'Cada desafio tem o seu chat.' },
      { icon: '🔔', text: 'Notificações de mensagens, check-ins, reações e amizades, e um lembrete às 20h se faltar marcar o dia. No iPhone, com o app na tela inicial.' },
    ],
  },
  {
    version: '0.5.2',
    title: 'Asa de Camilla, agora verde',
    items: [{ icon: '🧚', text: 'A Asa de Camilla ficou verde brilhante, com bordado branco em espiral. Livre para todo mundo em Perfil → Montar avatar → Roupa → Asas.' }],
  },
  {
    version: '0.5.1',
    title: 'Asa de Camilla',
    items: [{ icon: '🧚', text: 'Asas de fada para o seu avatar, liberadas para todo mundo. Em Perfil → Montar avatar → Roupa → Asas.' }],
  },
  {
    version: '0.5.0',
    title: 'Coleção e um Perfil só seu',
    items: [
      { icon: '👤', text: 'O Perfil virou uma aba, na ponta direita, com o seu avatar. Ajustes agora fica na engrenagem ⚙️ no canto do Perfil.' },
      { icon: '🎁', text: 'Coleção: cada tema de hábito (água, leitura, sono…) libera 3 itens para o avatar com a prática: algo para segurar, algo para vestir e um fundo. O que você já fez conta. Toque em Usar para pôr no avatar.' },
      { icon: '🏷️', text: 'Ao criar ou editar um hábito, escolha o tema dele. O app já sugere um pelo nome.' },
      { icon: '🔔', text: 'No Hoje, um aviso mostra quando falta pouco para o próximo item.' },
    ],
  },
]

/** compara "0.4.10" com "0.5.0": negativo se a < b */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0)
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (d) return d
  }
  return 0
}

/** notas que a pessoa ainda não viu (mais nova primeiro), até `current` */
export function unseenNotes(lastSeen: string, current: string, beta = true): ReleaseNote[] {
  return RELEASES.filter((r) => (beta || !r.beta) && compareVersions(r.version, lastSeen) > 0 && compareVersions(r.version, current) <= 0)
}
