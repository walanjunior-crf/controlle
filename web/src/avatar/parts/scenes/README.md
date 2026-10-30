# Cenas lendárias (fundos da coleção)

Cada arquivo desenha UMA cena que substitui um padrão de fundo (`PATTERNS` em `../backgrounds.ts`):

| arquivo | id do padrão | tema |
| --- | --- | --- |
| agua.ts | gotas | Hidratação: fundo do mar |
| movimento.ts | pista | Movimento: pista olímpica |
| leitura.ts | estante | Leitura: biblioteca/estante cheia |
| mente.ts | zen | Mente: jardim budista |
| saude.ts | ervas | Saúde |
| largar.ts | arcoiris | Largar um hábito |
| humor.ts | sorrisos | Humor |

Regras:
- Exporte `SCENE: (x: Ctx) => string`, que devolve SVG para a caixa 100×100. O avatar é recortado num círculo (raio 50 em 50,50) e o bicho cobre o centro (≈ x 25..75, y 22..100). A cena é desenhada por cima da cor de fundo `x.c.bg` e atrás do bicho.
- Cena lendária = o tema tem que aparecer de verdade: pode (e deve) pintar o fundo inteiro com paleta própria, em camadas (céu/parede/água, chão, elementos). A cor escolhida pela pessoa (`x.c.bg`) pode tingir de leve a cena (mix), mas o tema manda.
- Use `layer()`, `cut()`, `cutPoly()`, `cutEllipse()`, `stroke()` de `../../paper` e `ramp/adjust/mix` de `../../color` para os três estilos (chapado, pelúcia, papel) funcionarem. `look.style` para detalhes próprios (costura na pelúcia).
- Seeds únicas por forma (`'cena-agua-...'`). Sem gradientes SVG, sem filtros, sem Math.random (use `rng` de paper se precisar de variação determinística).
- Formas que leiam a 60 px. Não imports de `../backgrounds` (evita ciclo).
