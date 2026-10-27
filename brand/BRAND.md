# Controlle: regras da marca

## Logo: o C-anel
- Um anel de progresso aberto: arco de ~296° com abertura de 64° voltada para a direita, centrada em 0°, com pontas redondas. A espessura do traço é 24% do diâmetro externo.
- Lê como "C" e como um dia quase completo. Com o dia 100% cumprido, o arco fecha em 360° (`logo-c-ring-closed.svg`). Use o anel fechado só como estado de conquista, nunca como logo.
- Geometria única: `src/geometry.py` (`c_ring_path`). O componente web `CLogo`/`CRing` deve usar as mesmas proporções.
- Área de respiro: no mínimo 25% do diâmetro em volta do logo. O tamanho mínimo é 16 px; abaixo de 24 px, use o favicon, que tem traço de 27%.
- Cores permitidas: #336633 sobre fundo claro, branco sobre #336633 e #5FA35F sobre fundo escuro. Não use gradiente, sombra, contorno, rotação nem outra cor.

## Wordmark
- "Controlle": o C inicial é o glifo C-anel em `--primary`, e o restante usa Nunito Bold em grafite #1C1C1E (no modo escuro, branco + #5FA35F). Arquivos: `wordmark.svg` e `wordmark-dark.svg`, com o texto convertido em paths.
- Não recrie o wordmark com texto ao vivo em layouts fixos. Use o SVG.

## O "c" verde no texto
- Todo c, C, ç e Ç de **títulos e momentos de marca** usa o glifo C-anel (fonte "Controlle C") e a cor `--primary`. Isso vale para H1 e H2 de tela, para o onboarding, para as conquistas e para telas vazias.
- **Não use** o c verde em corpo de texto, botões, listas, campos, valores numéricos, notificações ou texto com menos de 17 px.
- Na web, o componente `<BrandText>` envolve cada c/C/ç/Ç em `<span class="brand-c">` (definido em `tokens.css`), que aplica `font-family: "Controlle C", Nunito…` e `color: var(--primary)`. Como o @font-face de "Controlle C" tem `unicode-range: U+0043, U+0063, U+00C7, U+00E7`, qualquer outro caractere cai automaticamente para Nunito.
- Use o mesmo peso do título. Os arquivos cobrem 400, 600 e 700 (`controlle-c-400/600/700.woff2`).
- Acessibilidade: os spans não alteram o texto (leitores de tela leem a palavra normal). Com `prefers-contrast: more`, `--primary` escurece para #264D26.

## Tipografia
- A fonte base é **Nunito** (OFL), self-hosted em `/fonts/nunito-latin-var.woff2` com eixo de peso 200–1000 e subset Latin-1, para o app funcionar offline. Em seguida vêm `ui-rounded` e `system-ui` (no iOS a fonte final pode ser a SF Pro Rounded).
- `--font-text` é a fonte do corpo. `--font-brand` é "Controlle C" + base, para títulos.

## Paleta
| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `--green-900` | #1A331A | #D6EAD6 | texto sobre verde claro |
| `--green-700` | #264D26 | #A9D3A9 | pressionado, alto contraste |
| `--green-500` / `--primary` | #336633 | #5FA35F | marca, ações, anéis |
| `--green-400` | #4D8C4D | #4D8C4D | gráficos |
| `--green-200` | #8FBF8F | #2E5A2E | gráficos, estados suaves |
| `--green-100` / `--primary-soft` | #D6EAD6 | #1F3A1F | chips, trilho |
| `--green-50` / `--bg` | #F1F7F1 | #0F1A0F | fundo do app |
| `--card` | #FFFFFF | #172617 | cartões |
| `--amber` | #E0A43A | #F0B54D | **só** sequências e conquistas |
| `--text` / `--text-2` | #1C1C1E / #5A665A | #ECF3EC / #9DB09D | texto |
| `--line` | #D6E3D6 | #243A24 | divisores |

Contraste (WCAG) verificado:
- `--primary` sobre `--bg`: 6,3:1 no claro e 5,9:1 no escuro.
- Branco sobre #336633: 6,8:1.
- `--text-2` sobre `--bg`: 5,5:1 no claro e 7,8:1 no escuro.

O âmbar não serve como texto sobre fundo claro. Para isso use `--amber-text`.

## Ícones
- O ícone do app é o C-anel branco sobre #336633, quadrado e sem cantos arredondados (o SO arredonda). O anel ocupa 56% do lado.
- O ícone maskable ocupa 60%, dentro do círculo seguro de 80%.
- Fontes dos arquivos: `app-icon.svg` (1024) e `src/build_web.py`, que gera os PNGs da PWA.

## Regenerar
```
cd Brand/src
python3 make_svgs.py      # logo + ícone
python3 build_fonts.py    # ConstanciaC-*.otf (requer skia-pathops)
python3 make_wordmark.py  # wordmark (Nunito-VF.ttf + ConstanciaC-Bold)
python3 build_web.py      # woff2, ícones e cópias em Controlle/web/public
```
