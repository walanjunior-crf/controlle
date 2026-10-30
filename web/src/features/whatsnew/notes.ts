/**
 * Novidades de cada versão, mostradas uma vez na primeira abertura depois de atualizar.
 * Escreva para quem usa: frases curtas, o que mudou e onde achar. Mais nova primeiro.
 */
export interface ReleaseNote {
  version: string
  title: string
  items: Array<{ icon: string; text: string }>
}

export const RELEASES: ReleaseNote[] = [
  {
    version: '0.5.0',
    title: 'Coleção e um Perfil só seu',
    items: [
      { icon: '👤', text: 'O Perfil virou uma aba, na ponta direita, com o seu avatar. Ajustes agora fica na engrenagem ⚙️ no canto do Perfil.' },
      { icon: '🎁', text: 'Coleção: cada tema de hábito (água, leitura, sono…) libera 3 itens para o avatar com a prática. O que você já fez conta.' },
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
export function unseenNotes(lastSeen: string, current: string): ReleaseNote[] {
  return RELEASES.filter((r) => compareVersions(r.version, lastSeen) > 0 && compareVersions(r.version, current) <= 0)
}
