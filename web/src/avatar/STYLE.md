# Avatar do Controlle — guia do traço "papel recortado" (motor v2)

Leia antes de desenhar qualquer peça. A referência viva é `species/gato.ts` + `parts/hats.ts` (boné) + `parts/glasses.ts` (redondo) + `parts/outfits.ts` (camiseta).

## O traço
- Toda forma é uma **folha de papel recortada**: use `layer(d, cor, opts)` de `paper.ts`. Ele já desenha a sombra curta (papel colado sobre papel) e o fio claro da borda.
- Contornos sempre **levemente irregulares** e determinísticos: `cut(pontos, seed)` (curvas), `cutPoly(pontos, seed)` (cantos vivos: orelhas, dentes, espinhos), `cutEllipse(cx, cy, rx, ry, seed)`. A `seed` é uma string única por forma (ex.: `'urso-ear-l'`); nunca use Math.random.
- **Sem gradientes, sem filtros SVG, sem contorno preto.** Volume vem de sobrepor folhas: base, um tom mais escuro (`ramp(cor).shade`/`deep`) para dobras e partes de trás, um mais claro (`light`/`pale`) para focinho, barriga e realces.
- Traços de expressão (bocas finas, bigodes, sobrancelhas) usam `stroke(d, cor, largura)`: ponta arredondada, tinta `faceInk(x)` ou `x.fur.ink`.
- Cores: sempre derivadas com `ramp(hex)` / `adjust()` / `mix()` de `color.ts`. Cores fixas só para coisas que têm cor própria (nariz rosado, metal, dentes).
- Formas **gordinhas e simples**: tem que ler a 28 px. Detalhe pequeno demais (< 1.2 unidade) some; prefira uma forma clara a três detalhes.
- `lift` (opção de `layer`) controla a altura da sombra: 1 = padrão; 0.4–0.6 para peças pequenas e coladas (nariz, botões); `shadow: false` para manchas pintadas no mesmo papel (bochecha, pinta).

## Coordenadas
- Caixa 100×100. O motor encolhe o personagem 8% em direção à base, então tudo cabe entre y≈8 e y≈100.
- Cada bicho define um **esqueleto** (`Rig` em `types.ts`): cabeça, olhos, nariz, boca, sobrancelhas, topo da cabeça (`crown`), lóbulos (`lobes`, onde vão brincos), bochechas, laterais, pescoço. As peças **devem** usar esses pontos, nunca coordenadas fixas de um bicho só.
- Sistemas locais (o motor posiciona e escala):
  - **Chapéus** (`parts/hats.ts`, e `hat` das fantasias): origem no topo da cabeça, cabeça de x −25 a 25, y negativo para cima, a cabeça desce até y≈+45. Em bicho de orelha alta, `crown.width` é o vão entre as orelhas: o chapéu fica naturalmente menor.
  - **Óculos** (`parts/glasses.ts`): olho esquerdo em (−10, 0), direito em (10, 0).
  - **Peruca** (`parts/hair.ts`): cabeça de referência centrada em (0, 0), rx 26, ry 23.
  - **Rosto** (`parts/face.ts`): olhos recebem (cx, cy, escala, lado); bocas recebem o ponto `rig.mouth`.
  - **Brincos**: recebem o ponto do lóbulo; o brinco pende para baixo a partir dele.

## Animação (o motor cuida, mas respeite as classes)
- Orelhas: cada orelha num `<g class="av-ear av-ear-l">` / `av-ear-r` (giram um pouco quando o bicho mexe a orelha).
- Não mude as classes `av-*` que o motor coloca (`av-body`, `av-head`, `av-eyes`, `av-mouth`, `av-arm-*`, `av-fx`).

## Arquivos
- Núcleo (não editar; se precisar de algo, descreva no relatório): `render.ts`, `paper.ts`, `color.ts`, `types.ts`, `place.ts`, `body.ts`, `expressions.ts`, `decor.ts`, `species/gato.ts`, `species/index.ts`.
- Catálogo de ids, nomes e regras (não editar): `src/features/profile/avatarParts.ts` (CATALOG, SPECIES_FUR, SHARK_FURS, HAIR_SPECIES, BEARD_SPECIES, effective()).
- Cada ajudante edita **só os arquivos da sua tarefa**.

## Como revisar
```
cd web
npx tsc -b
npx tsx scripts/avatar-sheet.ts --out /tmp/x --cols hat=nenhum,bone,cartola            # linhas = 8 bichos
npx tsx scripts/avatar-sheet.ts --out /tmp/x --rows moods --cols outfit=camiseta --set species=urso
npx tsx scripts/avatar-sheet.ts --out /tmp/x --cols eyes=brilho,anime --size 60 --lite   # tamanho pequeno
```
Abra o PNG gerado (ferramenta Read) e confira: encaixe em todos os bichos, leitura a 60 px e no modo `--lite`, nada flutuando, nada cortado, cores coerentes em fundo claro e escuro (`--set bg=#F1E6D0` e `--set bg=#243B6B`).
