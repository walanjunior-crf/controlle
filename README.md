# Controlle

**Seus hábitos do dia, um toque por vez.**

O Controlle é um app de controle de hábitos diário — água, remédio, treino, sono, leitura,
meditação, humor — feito para usar entre amigos. Ele é um **web app instalável (PWA)**:
você abre um link no celular, adiciona à tela de início e ele passa a funcionar como um
app comum, inclusive sem internet.

- Sem App Store, sem Play Store, sem conta, sem servidor e **sem custo nenhum**.
- Os dados ficam **só no seu aparelho**. Ninguém (nem quem publicou o app) vê seus registros.
- Funciona no iPhone, no Android e no computador.

---

## Sumário

1. [Rodar no seu computador (Windows)](#1-rodar-no-seu-computador-windows)
2. [Publicar grátis no GitHub Pages](#2-publicar-grátis-no-github-pages)
3. [Instalar no celular](#3-instalar-no-celular)
4. [Onde ficam os dados e por que fazer backup](#4-onde-ficam-os-dados-e-por-que-fazer-backup)
5. [Limitações atuais](#5-limitações-atuais)
6. [Próximos passos](#6-próximos-passos)
7. [Comandos úteis](#7-comandos-úteis)

---

## 1. Rodar no seu computador (Windows)

Você só precisa disso se quiser mexer no código ou testar antes de publicar.
Para apenas **usar** o app, pule para a [seção 2](#2-publicar-grátis-no-github-pages).

### 1.1 Instalar o Node.js

1. Acesse <https://nodejs.org> e baixe a versão **22 LTS** (botão "LTS").
2. Execute o instalador e clique em "Próximo" até o fim (as opções padrão servem).
3. Abra o **Prompt de Comando** ou o **PowerShell** (tecla Windows → digite "PowerShell")
   e confira:

   ```
   node --version
   ```

   Deve aparecer algo como `v22.x.x`.

### 1.2 Rodar o app

No PowerShell, entre na pasta do projeto (troque o caminho pelo seu):

```
cd C:\Users\SeuNome\Documents\Controlle\web
npm install
npm run dev
```

- `npm install` baixa as dependências (só precisa na primeira vez ou quando elas mudarem).
- `npm run dev` inicia o app. Abra no navegador o endereço que aparecer,
  normalmente <http://localhost:5173>.
- Para parar, pressione `Ctrl + C` no PowerShell.

### 1.3 Abrir no celular pela rede de casa

Com o computador e o celular **no mesmo Wi-Fi**:

```
npm run dev -- --host
```

Vai aparecer um endereço do tipo `http://192.168.0.10:5173` (linha "Network").
Digite esse endereço no navegador do celular. Se não abrir, o Firewall do Windows pode
perguntar se permite o acesso — escolha **Permitir** em "Redes privadas".

> **Atenção:** assim você consegue *ver e testar* o app no celular, mas **não consegue
> instalá-lo de verdade**. A instalação (PWA), o funcionamento offline e o service worker
> exigem **HTTPS**, e o endereço da rede local é `http`. Para instalar, publique
> (seção 2) — é grátis e leva uns 10 minutos.

---

## 2. Publicar grátis no GitHub Pages

O GitHub hospeda sites gratuitamente e já tem HTTPS. Este projeto vem com uma
automação pronta (`.github/workflows/deploy.yml`) que, a cada alteração, roda os testes,
gera o app e publica sozinho.

### 2.1 Criar a conta

1. Acesse <https://github.com> → **Sign up** e crie sua conta (gratuita).
2. Seu nome de usuário fará parte do link do app. Ex.: usuário `ana-silva`.

### 2.2 Criar o repositório

1. No GitHub, clique no **+** (canto superior direito) → **New repository**.
2. Em **Repository name**, digite por exemplo `controlle`.
3. Marque **Public** (o GitHub Pages grátis exige repositório público — fique tranquilo:
   o que fica público é o *código*, **não** os seus dados, que nunca saem do celular).
4. Clique em **Create repository**.

### 2.3 Subir os arquivos

Escolha **um** dos jeitos:

**Opção A — GitHub Desktop (recomendado, mais fácil de atualizar depois)**

1. Instale o <https://desktop.github.com> e entre com sua conta.
2. **File → Add local repository…** → escolha a pasta `Controlle`
   (a que contém `web`, `README.md` e `.github`).
   Se ele disser que não é um repositório, clique em **create a repository** nesse aviso.
3. Escreva um resumo (ex.: "primeira versão") e clique em **Commit to main**.
4. Clique em **Publish repository** (ou **Push origin**), escolhendo o repositório que
   você criou. Desmarque "Keep this code private".

**Opção B — arrastando no site**

1. Na página do repositório recém-criado, clique em **uploading an existing file**.
2. Abra a pasta `Controlle` no Explorador de Arquivos e arraste para o navegador **todo o
   conteúdo** dela: a pasta `web`, o `README.md` e a pasta `.github`.
   - **Não envie** a pasta `web\node_modules` nem `web\dist` (são enormes e são geradas
     automaticamente). Se já existirem, apague-as antes ou arraste os itens um a um.
   - A pasta `.github` começa com ponto e pode estar oculta: no Explorador, vá em
     **Exibir → Mostrar → Itens ocultos**. Sem ela, a publicação automática não acontece.
3. Clique em **Commit changes**.

### 2.4 Ligar o GitHub Pages

1. No repositório, vá em **Settings** (engrenagem) → **Pages** (menu à esquerda).
2. Em **Build and deployment → Source**, escolha **GitHub Actions**.
3. Vá na aba **Actions** do repositório. Deve haver uma execução "Deploy no GitHub Pages".
   Se não houver, clique nela à esquerda → **Run workflow**.
4. Espere ficar verde (2–3 minutos). Pronto! Seu app estará em:

   ```
   https://<usuario>.github.io/<repositorio>/
   ```

   Exemplo: `https://ana-silva.github.io/controlle/`

Mande esse link para os amigos. Cada um instala no próprio celular e tem os próprios dados.

**Para atualizar o app depois:** altere os arquivos, faça *Commit* + *Push* no GitHub
Desktop (ou envie de novo pelo site). A publicação roda sozinha; quem já instalou verá um
aviso de "nova versão disponível" na próxima vez que abrir o app.

> Se a execução ficar vermelha, clique nela para ver o erro. O mais comum é um teste
> falhando (`npm test`) — corrija e envie de novo.

### 2.5 Alternativas (também grátis)

Se preferir não usar o GitHub Actions, gere o app no seu computador:

```
cd web
npm run build
```

Isso cria a pasta `web\dist`. Depois:

- **Netlify Drop:** acesse <https://app.netlify.com/drop> e **arraste a pasta `dist`**
  para a página. Em segundos você recebe um link `https://….netlify.app`.
- **Cloudflare Pages:** em <https://dash.cloudflare.com> → **Workers & Pages → Create →
  Pages → Upload assets**, dê um nome e arraste a pasta `dist`.

Nesses dois casos o site fica na raiz do domínio, então o build padrão (sem `BASE_PATH`)
já funciona. A cada atualização, rode `npm run build` e arraste a `dist` de novo.

---

## 3. Instalar no celular

### iPhone / iPad

1. Abra o link **no Safari** (no iPhone, outros navegadores podem não oferecer a opção
   ou não instalar como app completo).
2. Toque no botão **Compartilhar** (quadrado com seta para cima).
3. Role e toque em **Adicionar à Tela de Início** → **Adicionar**.
4. Abra o Controlle **pelo ícone** na tela de início (não pelo Safari).

### Android

1. Abra o link no **Chrome**.
2. Toque em **Instalar** no aviso que aparece — ou no menu **⋮ → Instalar app**
   (ou "Adicionar à tela inicial").
3. Abra pelo ícone criado.

No computador (Chrome ou Edge) também dá para instalar pelo ícone de instalação na barra
de endereço.

---

## 4. Onde ficam os dados e por que fazer backup

Tudo o que você registra fica guardado **no navegador do próprio aparelho** (IndexedDB).
Não existe cópia na internet. Isso traz privacidade total, mas também responsabilidade:

- **Se você apagar o app, limpar os dados do navegador ou trocar de celular, os registros
  somem** — a menos que você tenha um backup.
- **iPhone:** o iOS pode apagar os dados de sites que você não abre há algumas semanas
  **se o app NÃO estiver instalado na tela de início**. Instalado, ele é tratado como app
  e fica muito mais seguro. Por isso: instale e use pelo ícone.
- O Controlle também pede ao navegador **armazenamento persistente**, para que os dados
  não sejam apagados quando o aparelho estiver com pouco espaço.

**Faça backup de vez em quando** (ex.: uma vez por semana) em **Ajustes → Backup**:

- **Exportar backup (.json):** cópia completa (hábitos, metas, registros, lembretes,
  configurações). Guarde no Google Drive, iCloud Drive, e-mail etc.
  No iPhone abre a folha de compartilhamento — escolha **Salvar em Arquivos**.
- **Importar backup:** restaura um `.json`. "Juntar" mescla com o que já existe;
  "Substituir" apaga tudo e coloca o conteúdo do backup.
- **Exportar planilha (.csv):** seus registros em formato que abre direto no Excel
  (colunas data, hora, tracker, valor, unidade, nota).

Para trocar de celular: exporte no antigo, instale no novo e importe.

---

## 5. Limitações atuais

- **Lembretes com o app fechado vêm do calendário do celular.** Em Ajustes → Lembretes →
  "Adicionar lembretes ao calendário", o Controlle gera eventos repetidos com alerta na
  hora; no iPhone, toque em "Adicionar ao calendário" e depois em "Adicionar Tudo". Se nada
  acontecer no app instalado, use "Compartilhar arquivo" → "Salvar em Arquivos" e abra o
  arquivo no app Arquivos. (Não use o Safari para isso: no iPhone, o app instalado e o
  Safari guardam dados separados, então lá a lista estaria vazia.) Dica: crie
  antes um calendário chamado "Controlle" no app Calendário e escolha ele, para poder
  apagar tudo de uma vez. O calendário avisa sempre no horário, mesmo se você já registrou;
  se mudar os horários, apague os eventos antigos e adicione de novo. Com o app aberto, ele
  também mostra o que passou da hora e o ícone exibe um **número (badge)** com o que falta
  hoje (Android/computador e iPhone com iOS 16.4+ e app instalado).
- **Sem sincronização entre aparelhos.** Celular e computador têm dados separados; use o
  backup para levar de um para o outro.
- **Uso individual.** Cada amigo tem seu próprio app e seus dados; ainda não há
  comparação ou desafios em grupo.

---

## 6. Próximos passos

- **Grupos e desafios entre amigos** usando o plano gratuito do
  [Supabase](https://supabase.com) (banco + login), opcional: quem não quiser continua
  100% local.
- **Notificações push inteligentes** (que não avisam quando a meta já foi cumprida),
  junto com os grupos, usando o mesmo serviço gratuito.
- Sincronização opcional entre aparelhos.

---

## 7. Comandos úteis

Sempre dentro da pasta `web`:

| Comando | O que faz |
| --- | --- |
| `npm install` | Instala as dependências (primeira vez) |
| `npm run dev` | Roda o app em <http://localhost:5173> |
| `npm run dev -- --host` | Idem, acessível pelo celular na mesma rede |
| `npm test` | Roda os testes automatizados |
| `npm run build` | Gera a versão final em `web/dist` |
| `npm run preview` | Abre localmente a versão gerada pelo build |

Estrutura e contratos entre as partes do código: veja [`CONTRACTS.md`](CONTRACTS.md).

## Novidades da versão 0.3

- **Agenda** (aba nova): calendário por **mês** ou **semana**, com compromissos coloridos, hábitos nos horários dos lembretes e **feriados nacionais** (calculados no aparelho, sem internet; dá para ocultar em ⋯).
- **Compromissos** com repetição, alerta (na hora até 1 dia antes), local, notas e **cores/tons** à vontade (14 famílias × 4 tons, mais cor personalizada).
- **Lembretes no iPhone**: Agenda → ⋯ → *Exportar para a agenda do celular*. Gera um .ics com compromissos e hábitos; o iPhone avisa mesmo com o app fechado.
- **Importar** um .ics (Calendário do Mac, Google Agenda, link público do iCloud): Agenda → ⋯ → *Importar de um arquivo .ics*.
- **Histórico em Mês | Ano**, com o percentual do ano.
- **Perfil** com foto ou 16 avatares.

O guia completo em PDF está em `docs/Controlle-Guia.pdf`.

## v0.4 — Avatar montável, níveis e conquistas

- Editor de avatar (`/perfil/avatar`): gato, raposa, urso ou coelho, com pelagem, olhos, chapéu, óculos, roupa, fundo e padrão. O avatar reage ao humor (feliz quando o dia fecha completo).
- Check = hábito cumprido em um dia. Os checks formam o nível (1 a 40), calculado do histórico, sem gastar nem salvar nada.
- Itens bloqueados abrem por nível ou conquista (ex.: coroa no nível 10, Medalha C com 7 dias perfeitos).
- 27 conquistas em 5 grupos, com barra de progresso (`/conquistas`).

### v0.4.1 — Avatar caprichado

- Arte nova: sombreado, olhos grandes com íris colorida, mais expressões.
- 8 bichos: gato, cachorro, raposa, urso, coelho, rato, dinossauro e tubarão. Estampas: dálmata, salsicha, listrada, mancha no olho, bicolor e pintinhas.
- Rosto: 10 olhos, 7 cores de olhos, sobrancelhas, 9 bocas, sardas/pinta/curativo, barba e bigode.
- Cabelo (ondulado, black power, chanel, longo, coque, chiquinhas, topete, moicano) com 10 cores.
- Chapéus com cor livre (boina, cartola, chapéu de sol, laço…), óculos com cor da armação, brincos e piercings em prata, ouro, rosé, bronze, preto.
- Roupas com cor livre e fantasias: pirata, terno, policial, dinossauro, tubarão, chef e astronauta.
- Avatares da v0.4 continuam iguais (o app completa os campos novos).

### v0.4.2 — Avatar mais coerente e recompensas por nível

- Dálmata e salsicha agora são raças do cachorro (aba Bicho), com pelagem própria; não aparecem para os outros bichos.
- Sai a aba Cabelo: fica só a peruca ondulada (aba Cabeça), para gato, cachorro, urso, raposa e rato. Bigodes só para cachorro, urso e raposa.
- Desbloqueio mais exclusivo: nível 1 traz o básico e cada nível do 2 ao 30 libera de 4 a 5 peças. O cartão de nível mostra o que vem no próximo.

### v0.4.3 — Arte refinada e Bartolomeu

- Acabamento novo na arte: volume com luz e sombra, contornos finos no tom da pelagem, tufos de pelo, pálpebras e íris com profundidade, sombra da cabeça no corpo, caimento nas roupas, fundo com luz, textura leve e aro.
- O rato virou o Bartolomeu, um hamster de bochechas cheias.
- Brincos agora ficam nas orelhas (gato, raposa, coelho, urso, Bartolomeu).
- No editor, as peças aparecem na ordem em que desbloqueiam. Teto atual: nível 25, com 5 peças por nível.

### v0.4.4 — Tubarão novo e T-rex

- Tubarão redesenhado: focinho em torpedo, barbatana alta, barriga branca, guelras, nadadeiras e sorriso largo com dentinhos. Cores só de tubarões reais (cinza-azulado, cinza, tubarão-azul, ardósia, grafite, lixa, tubarão-baleia) e estampas tigre e pintas.
- O dinossauro virou um T-rex: cabeçona, mandíbula com dentes, arcos sobre os olhos, narinas e bracinhos curtos.

### v0.4.5 — Sugestões

- Convite na próxima abertura do app para mandar sugestões, e atalho fixo em Ajustes → Sugestões. Abre o e-mail já preenchido para sugestoescontrolle@gmail.com, com opção de copiar o endereço.

### v0.4.6 — Avatar vivo em papel recortado (motor v2)

- Motor novo em `web/src/avatar/`: cada bicho tem um esqueleto (olhos, nariz, boca, topo da cabeça, orelhas), e chapéus, óculos, brincos e peruca se encaixam e mudam de tamanho a partir dele.
- Traço papel recortado: folhas com borda de tesoura, sombra curta e textura de papel; cores com sombra e luz calculadas em OKLCH. Guia em `web/src/avatar/STYLE.md`.
- Corpo com braços e poses. Oito humores: normal, feliz, comemorando, carinho, acenando, orgulho (medalha), folga (touca) e sono.
- Avatar vivo: pisca, respira, mexe a orelha e reage ao check, ao dia completo, ao carinho (toque) e à volta depois de uma pausa. Na tela Hoje ele fica dentro do anel de progresso.
- Folha de contato para revisão: `npx tsx scripts/avatar-sheet.ts --out /tmp/x --cols hat=bone,cartola`.
- Avatares salvos continuam com as mesmas peças, agora no traço novo.
