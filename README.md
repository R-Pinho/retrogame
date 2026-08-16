# Retro Play

Aplicação web para jogar jogos retrô (SNES por padrão, extensível a outros
sistemas) direto no navegador, em qualquer aparelho, sem login e com o
progresso salvo automaticamente no próprio dispositivo.

Motor de emulação: **[EmulatorJS](https://emulatorjs.org)** (Libretro
compilado para WebAssembly), carregado via CDN público — por isso o site
precisa estar **online** para funcionar. Só o *save* do progresso é local.

---

## Sumário

1. [Como rodar o projeto](#1-como-rodar-o-projeto)
2. [Estrutura de pastas](#2-estrutura-de-pastas)
3. [Como adicionar um jogo](#3-como-adicionar-um-jogo)
4. [Sistemas suportados e como adicionar outros](#4-sistemas-suportados-e-como-adicionar-outros)
5. [Como o save automático funciona](#5-como-o-save-automático-funciona)
6. [Personalização (cores, nome, tempo de auto-save)](#6-personalização)
7. [Publicando o site](#7-publicando-o-site)
8. [Auto-hospedando o EmulatorJS (opcional)](#8-auto-hospedando-o-emulatorjs-opcional)
9. [Solução de problemas](#9-solução-de-problemas)
10. [Sobre ROMs e direitos autorais](#10-sobre-roms-e-direitos-autorais)
11. [Créditos](#11-créditos)

---

## 1. Como rodar o projeto

⚠️ **Não abra o `index.html` clicando duas vezes nele.** O navegador bloqueia
carregamento de módulos WebAssembly e `fetch()` em arquivos abertos direto
do disco (`file://`). É preciso servir os arquivos por HTTP, mesmo que seja
localmente. Três jeitos rápidos de fazer isso:

**Com Python (já vem instalado na maioria dos sistemas):**
```bash
cd retro-play
python3 -m http.server 8080
```
Depois abra `http://localhost:8080` no navegador.

**Com Node.js:**
```bash
cd retro-play
npx serve .
```

**Com VS Code:** instale a extensão "Live Server" e clique em "Go Live" com
o `index.html` aberto.

Isso vale só para **testar localmente**. Depois de publicado num servidor de
verdade (veja a [seção 7](#7-publicando-o-site)), é só acessar a URL normalmente.

---

## 2. Estrutura de pastas

```
retro-play/
├── index.html            Página única do site
├── css/
│   └── style.css         Toda a aparência (cores, layout, animações)
├── js/
│   ├── config.js         Configurações gerais (edite à vontade)
│   ├── games.js          Lista de jogos — edite pra adicionar títulos
│   └── app.js            Lógica do site (prateleira, save automático, etc.)
├── roms/
│   ├── snes/              ROMs de Super Nintendo vão aqui
│   ├── nes/                ROMs de NES
│   ├── gba/                ROMs de Game Boy Advance
│   ├── n64/                ROMs de Nintendo 64
│   ├── psx/                ROMs (+ BIOS) de PlayStation 1
│   └── genesis/             ROMs de Mega Drive
└── README.md              Este arquivo
```

Cada pasta dentro de `roms/` já tem um `LEIA-ME.txt` com um lembrete rápido
das extensões aceitas naquele sistema.

---

## 3. Como adicionar um jogo

1. Copie o arquivo da ROM para a subpasta do sistema certo, ex:
   `roms/snes/nome-do-jogo.sfc`
2. Abra `js/games.js` e adicione um novo item na lista `GAME_LIBRARY`:

   ```js
   {
     id: "nome-curto-sem-espaco",
     title: "Nome do Jogo",
     system: "SNES",
     core: "snes",
     file: "roms/snes/nome-do-jogo.sfc",
     image: "",
   },
   ```
3. Salve e recarregue a página.

- Com **1 jogo só** na lista, o site pula direto pra tela de "toque para
  jogar" daquele título — sem prateleira de seleção.
- Com **2 ou mais**, aparece a prateleira de cartuchos pra escolher.
- O campo `image` é opcional: se preenchido com o caminho de uma imagem
  (ex: `"roms/snes/capa.png"`), ela aparece no cartucho no lugar do
  ícone padrão.

### Link direto de um jogo (útil para tags NFC)

Cada cartucho tem um ícone de link (🔗) no canto — clicar nele copia pra
área de transferência o endereço direto daquele jogo
(`seusite.com/?jogo=id-do-jogo`, usando o campo `id` cadastrado em
`games.js`). Abrir esse link já pula a prateleira e vai direto pro jogo —
é esse o link que faz sentido gravar numa tag NFC (com um app como o
"NFC Tools" no Android, por exemplo: Gravar → Adicionar um registro →
URL/URI → colar o link copiado).

Uma limitação a saber: como esse acesso pula a etapa de tocar num
cartucho na tela, o navegador ainda não teve nenhuma interação direta
*dentro* da página — por isso o som pode começar mudo até o primeiro
toque num controle (é uma política de autoplay do próprio navegador, não
tem como contornar). Depois desse primeiro toque, o áudio libera
normalmente.

### Modo "links secretos" (prateleira escondida)

Em `js/config.js`, `hideLibraryByDefault: true` (já vem assim) faz a
tela inicial não mostrar nenhum jogo clicável — vira uma tela vazia com
só o logo. A única forma de jogar é acessando o link direto de um jogo
específico. É pensado exatamente pra uso com tags NFC: quem não tem a
tag (ou o link) não vê nenhum jogo cadastrado.

Vale saber que isso *esconde* a lista, não a protege de verdade — não há
senha nem login. `js/games.js` continua sendo um arquivo público como
qualquer outro do site; alguém que abrir esse arquivo diretamente vê
todos os IDs. Serve bem contra "alguém que só está navegando no site não
vê nada", não contra alguém procurando de propósito.

Pra voltar a mostrar a prateleira normalmente (jogos + botão de
"Carregar ROM"), troque para `hideLibraryByDefault: false`.

---

## 4. Sistemas suportados e como adicionar outros

O projeto já vem com pastas e o mapeamento pronto para 6 sistemas:

| Sistema         | `core` em games.js | Extensões comuns          | Precisa de BIOS? |
|-----------------|---------------------|----------------------------|-------------------|
| Super Nintendo  | `snes`              | .smc .sfc .fig .swc .bs    | Não |
| NES             | `nes`                | .nes .fds .unif            | Não |
| Game Boy Advance| `gba`                | .gba                       | Opcional |
| Nintendo 64     | `n64`                | .z64 .n64                  | Não |
| PlayStation 1   | `psx`                | .cue + .bin                | **Sim** |
| Mega Drive      | `segaMD`             | .md .gen .smd .sg          | Não |

O EmulatorJS suporta bem mais sistemas além desses seis (Game Boy, Game
Boy Color, Sega Master System, Sega CD, Atari, PC Engine, arcade via
FBNeo, e outros). A lista completa e atualizada de núcleos fica em:
**https://emulatorjs.org/docs4devs/cores**

**Para adicionar um sistema novo que não é um desses seis:**

1. Veja o identificador do núcleo (`core`) na página de núcleos acima.
2. Crie uma pasta nova em `roms/`, ex: `roms/gameboy/`.
3. Cadastre o jogo em `js/games.js` normalmente, usando o `core` certo:
   ```js
   {
     id: "meu-jogo-gb",
     title: "Nome do Jogo",
     system: "Game Boy",
     core: "gb",
     file: "roms/gameboy/meu-jogo.gb",
   },
   ```
4. Se o sistema exigir BIOS (ex: PlayStation, Sega CD), adicione o campo
   `bios` apontando pro arquivo:
   ```js
   bios: "roms/psx/scph1001.bin",
   ```
5. (Só para sistemas "pesados" que pedem multi-threading, como PSP e
   DOS): esses exigem duas configurações extras — `EJS_threads = true`
   em `js/app.js` **e** dois cabeçalhos HTTP especiais no servidor
   (`Cross-Origin-Opener-Policy` e `Cross-Origin-Embedder-Policy`).
   Isso depende de onde o site é hospedado; veja
   "System Requirements" em https://emulatorjs.org caso vá usar um
   desses sistemas.

Quer também permitir que qualquer visitante teste uma ROM avulsa sem
mexer em `games.js`? Isso já existe: o cartucho **"Carregar ROM"** que
aparece sempre na prateleira lê o arquivo direto do aparelho da pessoa
(sem subir pra lugar nenhum) e tenta descobrir o núcleo certo pela
extensão — a tabela de extensões reconhecidas fica no topo de `js/app.js`
(`EXTENSION_CORE_MAP`), caso queira ensiná-lo a reconhecer mais formatos.

---

## 5. Como o save automático funciona

O EmulatorJS já grava os *save states* (o estado completo da emulação,
não só o save do jogo) sozinho no **IndexedDB do navegador** — um banco de
dados local do próprio navegador, sem servidor envolvido. O que este
projeto adiciona, em `js/app.js`, é só a automação em cima disso:

- **Ao iniciar um jogo:** tenta carregar automaticamente o save guardado
  num "slot" reservado (o slot 1, por padrão — configurável em
  `config.js`). Se não existir nenhum ainda (primeira vez jogando naquele
  aparelho), o jogo simplesmente começa do zero, sem erro.
- **Durante o jogo:** salva sozinho a cada X segundos (30s por padrão,
  ajustável em `config.js` → `autoSaveIntervalMs`).
- **Ao sair:** salva mais uma vez ao trocar de aba/aplicativo ou fechar a
  página (eventos `visibilitychange` e `pagehide`).

**Importante entender os limites disso:**
- O save é **por navegador, por aparelho**. Trocar de navegador (ex: Chrome
  para Firefox) ou de aparelho não traz o progresso salvo junto.
- Limpar os dados de navegação / "dados do site" do navegador apaga os
  saves também, já que é onde o IndexedDB vive.
- O slot de auto-save (1, por padrão) é separado dos slots de save manual
  que o próprio menu do EmulatorJS já oferece (teclas F2 salvar / F4
  carregar / F3 trocar de slot) — um não atrapalha o outro.

---

## 6. Personalização

Praticamente todo ajuste visual/comportamental sem mexer em lógica fica em
`js/config.js`, com comentário explicando cada campo: nome do site, cor de
destaque, cor de fundo, tempo de auto-save, se entra em tela cheia
automaticamente, etc.

Para mudar o **visual** mais a fundo (formato do cartucho, cores do tema,
fonte), o ponto de partida é o bloco `:root { ... }` no topo de
`css/style.css`, onde ficam as variáveis de cor e fonte.

---

## 7. Publicando o site

Como é um site 100% estático (HTML/CSS/JS puro, sem back-end), qualquer
hospedagem de arquivos estáticos serve. Algumas opções gratuitas:

- **Cloudflare Pages** — `wrangler pages deploy retro-play`, ou arrastando
  a pasta pelo painel do Cloudflare (você já usa Cloudflare Workers em
  outros projetos, então Pages deve ser bem familiar).
- **GitHub Pages** — suba a pasta pra um repositório e ative Pages nas
  configurações do repositório.
- **Netlify / Vercel** — arrastar a pasta no painel também funciona.

Não é necessário nenhum passo de build — os arquivos já estão prontos
para publicar como estão.

---

## 8. Auto-hospedando o EmulatorJS (opcional)

Por padrão, `js/config.js` carrega o EmulatorJS do CDN público deles
(`cdn.emulatorjs.org`). Isso é o mais simples e é atualizado
automaticamente pelo projeto oficial. Só faz sentido trocar isso se você
quiser: funcionamento 100% offline depois do primeiro carregamento, não
depender do CDN de terceiros, ou customizar o próprio EmulatorJS.

1. Baixe a pasta `data/` do repositório oficial:
   https://github.com/EmulatorJS/EmulatorJS
2. Coloque essa pasta dentro deste projeto, em `emulatorjs-data/data/`.
3. Em `js/config.js`, defina:
   ```js
   pathToDataOverride: "emulatorjs-data/data/",
   ```

---

## 9. Solução de problemas

**Tela preta / nada acontece ao abrir o cartucho**
Quase sempre é porque o `index.html` foi aberto direto do disco (`file://`)
em vez de por um servidor local — veja a [seção 1](#1-como-rodar-o-projeto).
Abra o console do navegador (F12) para ver a mensagem de erro exata.

**"Não encontrei a ROM..." ou "Erro de rede" ao clicar num cartucho, mas
o botão "Carregar ROM" funciona normalmente**
O upload manual sempre funciona porque lê o arquivo direto do aparelho,
sem depender de rede — então esse sintoma é sempre sobre o *caminho* da
ROM (o campo `file` em `games.js`) não estar sendo alcançado. Mesmo que
o nome do arquivo esteja digitado certinho, algumas causas comuns:
1. **Servidor de desenvolvimento leve (ex: extensão Live Server do VS
   Code).** Alguns desses servidores lidam mal com certos tipos de
   requisição — por isso a checagem interna do site usa `GET`, o mesmo
   método que o próprio EmulatorJS usa de verdade, em vez de `HEAD`.
2. Diferença de maiúsculas/minúsculas entre o `file` em `games.js` e o
   nome real do arquivo.
3. O `index.html` foi aberto direto (duplo clique) em vez de por um
   servidor local — veja a [seção 1](#1-como-rodar-o-projeto).

**Teste manual rápido:** com o servidor local rodando, copie a URL da
página no navegador e troque o final por `roms/snes/nome-do-arquivo.smc`
(o caminho exato do seu jogo) — cole essa URL numa nova aba. Se o
navegador baixar ou tocar o arquivo normalmente, o arquivo está acessível
e o problema é em outro lugar (avise que a checagem do site pode estar
com algum problema). Se der "Cannot GET" ou 404, o servidor não está
enxergando aquele caminho — confira a pasta raiz que o servidor está
usando (no Live Server, isso costuma ser a pasta aberta no VS Code).

**"CORS error" no console**
A ROM (ou a BIOS) precisa estar no mesmo domínio do site, ou o servidor
onde ela está precisa permitir CORS. Hospedar a ROM dentro da pasta
`roms/` do próprio projeto (como este README recomenda) evita esse
problema completamente.

**Sem som até eu tocar na tela**
Comportamento normal dos navegadores: eles bloqueiam áudio com som até
haver alguma interação do usuário na página. Assim que o jogador toca em
qualquer controle, o som libera sozinho.

**Controle Bluetooth/USB não é reconhecido**
Confirme que o navegador reconhece o controle fora do site também (em
`about:gamepad` no Firefox, ou em qualquer testador de gamepad). Em
iOS, controles Bluetooth precisam estar pareados nos Ajustes do aparelho
*antes* de abrir o site.

**O controle virtual continua na tela mesmo com um controle físico
conectado**
Isso depende da API do navegador detectar o evento de conexão do gamepad
corretamente (varia entre navegadores/SOs). O botão de alternar o
controle virtual, que já vem embutido na barra do EmulatorJS, sempre
funciona como alternativa manual.

---

## 10. Sobre ROMs e direitos autorais

Este projeto **não inclui nenhuma ROM** — as pastas em `roms/` vêm vazias
de propósito. Use apenas arquivos de jogos que você tem o direito de usar
(cópias de backup de jogos que você possui, por exemplo). O mesmo vale
para arquivos de BIOS de console, que devem ser extraídos de um aparelho
que você possui.

---

## 11. Créditos

- **[EmulatorJS](https://emulatorjs.org)** ([GitHub](https://github.com/EmulatorJS/EmulatorJS)) —
  o motor de emulação em si (Libretro/WebAssembly), licenciado em GPLv3.
  Este projeto apenas integra e estiliza o EmulatorJS — todo o trabalho
  pesado de emulação é dele.
- Fonte "Press Start 2P" via Google Fonts, usada nos rótulos em estilo pixel.
