/**
 * ============================================================================
 *  APP.JS — lógica do site
 * ============================================================================
 * Este arquivo faz 5 coisas:
 *
 *   1. Desenha a "prateleira" de jogos na tela inicial (a partir de games.js)
 *   2. Quando um cartucho é clicado, configura e inicia o EmulatorJS
 *   3. Cuida do save automático: carrega o progresso salvo ao iniciar,
 *      e salva sozinho em intervalos e ao sair
 *   4. Mostra/some o controle virtual dependendo de ter um controle físico
 *      conectado (Gamepad API)
 *   5. Cuida de tela cheia / aviso de "gire o aparelho" no celular
 *
 * Se você quer mudar CORES, TEMPO DE AUTO-SAVE ou o NOME DO SITE, isso é
 * em js/config.js, não aqui. Se você quer ADICIONAR UM JOGO, isso é em
 * js/games.js. Este arquivo raramente precisa ser editado — mas está
 * comentado por completo para quando precisar.
 * ============================================================================
 */

// Mapa de extensão de arquivo -> núcleo do EmulatorJS. Só é usado no botão
// "Carregar ROM do aparelho" (quando não há uma entrada em games.js dizendo
// explicitamente qual núcleo usar). Baseado na própria lógica de detecção
// usada na demo oficial do EmulatorJS.
//
// Quer suportar uma extensão nova? Adicione uma linha aqui, no formato
//   "extensao": "nome_do_nucleo",
var EXTENSION_CORE_MAP = {
  // Nintendo
  nes: "nes", fds: "nes", unif: "nes", unf: "nes",
  smc: "snes", sfc: "snes", fig: "snes", swc: "snes", bs: "snes",
  gb: "gb", gbc: "gb",
  gba: "gba",
  n64: "n64", z64: "n64",
  nds: "nds",
  // Sega
  md: "segaMD", gen: "segaMD", smd: "segaMD", sg: "segaMD",
  // Formatos de disco — o mais comum de longe é PlayStation, então é o
  // palpite padrão. Se for outro sistema baseado em CD, troque o núcleo
  // manualmente adicionando o jogo em games.js em vez de usar o upload.
  cue: "psx", bin: "psx",
};

// Nomes de sistema "bonitos" para mostrar no cartucho, por núcleo.
var CORE_SYSTEM_LABEL = {
  nes: "NES", snes: "SNES", gb: "Game Boy", gba: "GBA",
  n64: "N64", nds: "DS", segaMD: "Mega Drive", psx: "PlayStation",
};

// --------------------------------------------------------------------------
// Estado interno (preenchido em cacheDomRefs / usado pelas funções abaixo)
// --------------------------------------------------------------------------
var libraryScreenEl, playerScreenEl, shelfEl, emptyStateEl,
    playerTitleEl, backButtonEl, loadingOverlayEl, loadingTitleEl,
    playerErrorEl, siteNameEls;

var autoSaveTimerId = null;

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================

document.addEventListener("DOMContentLoaded", init);

function init() {
  cacheDomRefs();
  applySiteName();
  warnIfFileProtocol();
  setupGamepadWatcher();
  backButtonEl.addEventListener("click", handleBackButton);

  var games = window.GAME_LIBRARY || [];

  // Link direto para um jogo específico: seusite.com/?jogo=id-do-jogo
  var startedFromLink = checkDeepLink(games);
  if (!startedFromLink) {
    renderLibrary(games);
  }
}

// Detecta a causa nº 1 de "não carrega" em projetos assim: o navegador
// bloqueia esse tipo de requisição quando a página é aberta direto do
// disco (clicando duas vezes no index.html) em vez de servida por HTTP.
// Em vez de deixar a pessoa descobrir isso só depois de tentar jogar (o
// erro que aparece nesse caso não deixa isso óbvio), avisamos de cara.
function warnIfFileProtocol() {
  if (window.location.protocol !== "file:") return;

  var warning = document.createElement("div");
  warning.className = "file-protocol-warning";
  warning.innerHTML =
    "<strong>Este arquivo foi aberto direto do disco (\u201cfile://\u201d).</strong>" +
    "<p>Por uma restrição de segurança do navegador, jogos cadastrados em " +
    "<code>games.js</code> não conseguem carregar assim, mesmo que o " +
    "arquivo exista (só o botão \u201cCarregar ROM\u201d funciona nesse modo). " +
    "Inicie um servidor local — no VS Code, clique com o botão direito em " +
    "<code>index.html</code> → \u201cOpen with Live Server\u201d — e use a aba que " +
    "abrir com endereço <code>http://</code>, não esta. Veja o README.md, " +
    "seção 1.</p>";
  document.body.insertBefore(warning, document.body.firstChild);
}

function cacheDomRefs() {
  libraryScreenEl = document.getElementById("screen-library");
  playerScreenEl = document.getElementById("screen-player");
  shelfEl = document.getElementById("game-shelf");
  emptyStateEl = document.getElementById("empty-state");
  playerTitleEl = document.getElementById("player-title");
  backButtonEl = document.getElementById("back-button");
  loadingOverlayEl = document.getElementById("loading-overlay");
  loadingTitleEl = document.getElementById("loading-title");
  playerErrorEl = document.getElementById("player-error");
  siteNameEls = document.querySelectorAll("[data-site-name]");
}

function applySiteName() {
  document.title = window.APP_CONFIG.siteName;
  for (var i = 0; i < siteNameEls.length; i++) {
    siteNameEls[i].textContent = window.APP_CONFIG.siteName;
  }
}

// ============================================================================
// PRATELEIRA DE JOGOS (tela inicial)
// ============================================================================

function renderLibrary(games) {
  shelfEl.innerHTML = "";

  if (window.APP_CONFIG.hideLibraryByDefault) {
    // "Modo secreto": ninguém vê jogo nenhum aqui. Só dá pra jogar
    // acessando o link direto de um jogo específico (?jogo=id), que já
    // foi checado antes desta função rodar (ver checkDeepLink/init).
    emptyStateEl.hidden = true;
    showScreen("library");
    return;
  }

  shelfEl.classList.toggle("shelf--single", games.length === 1);
  emptyStateEl.hidden = games.length !== 0;

  games.forEach(function (game) {
    shelfEl.appendChild(buildCartridgeCard(game));
  });

  // O cartucho de "carregar ROM do aparelho" sempre aparece — assim dá
  // pra testar o site mesmo antes de configurar qualquer jogo em games.js.
  shelfEl.appendChild(buildUploadCard());

  showScreen("library");
}

function buildCartridgeCard(game) {
  // Envolvemos o cartucho num <div> porque o botão de "copiar link" fica
  // por cima, como um irmão dele — colocar um <button> dentro de outro
  // <button> não é válido em HTML e causa comportamento imprevisível de
  // clique/teclado.
  var wrap = document.createElement("div");
  wrap.className = "cart-card-wrap";

  var card = document.createElement("button");
  card.type = "button";
  card.className = "cart-card";
  card.setAttribute("aria-label", "Jogar " + game.title + " (" + game.system + ")");

  var labelStyle = game.image ? ' style="background-image:url(\'' + game.image + '\')"' : "";
  var glyph = game.image ? "" : '<span class="cart-card__glyph">' + escapeHtml((game.title || "?").charAt(0)) + "</span>";

  card.innerHTML =
    '<span class="cart-card__label"' + labelStyle + ">" + glyph + "</span>" +
    '<span class="cart-card__stripe" aria-hidden="true"></span>' +
    '<span class="cart-card__body">' +
      '<span class="cart-card__title">' + escapeHtml(game.title) + "</span>" +
      '<span class="cart-card__system">' + escapeHtml(game.system) + "</span>" +
    "</span>";

  card.addEventListener("click", function () {
    startGame({
      title: game.title,
      system: game.system,
      core: game.core,
      source: game.file,
      bios: game.bios,
    });
  });

  var linkBtn = document.createElement("button");
  linkBtn.type = "button";
  linkBtn.className = "cart-card__link";
  linkBtn.setAttribute("aria-label", "Copiar link direto de " + game.title + " (útil para gravar numa tag NFC)");
  linkBtn.innerHTML = "🔗";
  linkBtn.addEventListener("click", function () {
    copyDeepLink(game.id, linkBtn);
  });

  wrap.appendChild(card);
  wrap.appendChild(linkBtn);
  return wrap;
}

/**
 * Copia pra área de transferência o link direto de um jogo
 * (seusite.com/?jogo=ID) — pensado pra gravar em tags NFC: tocar a tag
 * abre o jogo especificado direto, sem passar pela prateleira.
 */
function copyDeepLink(gameId, buttonEl) {
  var url = window.location.origin + window.location.pathname + "?jogo=" + encodeURIComponent(gameId);

  function showCopiedFeedback() {
    var original = buttonEl.innerHTML;
    buttonEl.innerHTML = "✓";
    buttonEl.classList.add("cart-card__link--copied");
    window.setTimeout(function () {
      buttonEl.innerHTML = original;
      buttonEl.classList.remove("cart-card__link--copied");
    }, 1500);
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(showCopiedFeedback, function () {
      // Alguns contextos negam a permissão de área de transferência —
      // como alternativa, mostra o link pra copiar manualmente.
      window.prompt("Copie o link manualmente:", url);
    });
  } else {
    window.prompt("Copie o link manualmente:", url);
  }
}

function buildUploadCard() {
  var card = document.createElement("label");
  card.className = "cart-card cart-card--upload";
  card.innerHTML =
    '<span class="cart-card__upload-icon" aria-hidden="true">+</span>' +
    '<span class="cart-card__body">' +
      '<span class="cart-card__title">Carregar ROM</span>' +
      '<span class="cart-card__system">do aparelho</span>' +
    "</span>" +
    '<input type="file" class="cart-card__file-input" accept="' +
      Object.keys(EXTENSION_CORE_MAP).map(function (ext) { return "." + ext; }).join(",") +
    '" />';

  var input = card.querySelector("input");
  input.addEventListener("change", function () {
    if (input.files && input.files[0]) {
      handleFileUpload(input.files[0]);
    }
    input.value = ""; // permite escolher o mesmo arquivo de novo depois
  });

  return card;
}

function handleFileUpload(file) {
  var ext = file.name.split(".").pop().toLowerCase();
  var core = EXTENSION_CORE_MAP[ext];

  if (!core) {
    window.alert(
      'Não reconheci a extensão ".' + ext + '".\n\n' +
      "Adicione essa extensão em EXTENSION_CORE_MAP no topo de js/app.js, " +
      "ou cadastre esse jogo em js/games.js informando o núcleo manualmente."
    );
    return;
  }

  startGame({
    title: file.name.replace(/\.[^/.]+$/, ""),
    system: CORE_SYSTEM_LABEL[core] || core.toUpperCase(),
    core: core,
    source: file,
  });
}

function checkDeepLink(games) {
  var params = new URLSearchParams(window.location.search);
  var slug = params.get("jogo");
  if (!slug) return false;

  var found = games.find(function (g) { return g.id === slug; });
  if (!found) return false;

  startGame({
    title: found.title,
    system: found.system,
    core: found.core,
    source: found.file,
    bios: found.bios,
  });
  return true;
}

function escapeHtml(str) {
  var div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}

// ============================================================================
// TROCA DE TELA (prateleira <-> jogador)
// ============================================================================

function showScreen(name) {
  libraryScreenEl.hidden = name !== "library";
  playerScreenEl.hidden = name !== "player";
}

function handleBackButton() {
  saveProgressNow(); // última tentativa de salvar antes de sair

  // Recarrega a página do zero, sem parâmetros de URL. É a forma mais
  // segura de "desligar" o emulador: o EmulatorJS/WebAssembly não foi
  // desenhado para ser destruído e reiniciado dentro da mesma página,
  // então em vez de tentar desmontar tudo manualmente (arriscado, pode
  // vazar memória ou travar o áudio), simplesmente recomeçamos a página.
  window.location.href = window.location.pathname;
}

// ============================================================================
// INICIAR UM JOGO (configura e carrega o EmulatorJS)
// ============================================================================

/**
 * descriptor = {
 *   title:  String,               nome mostrado pro jogador
 *   system: String,               nome do sistema (só exibição)
 *   core:   String,                núcleo do EmulatorJS (ex: "snes")
 *   source: String ou File,       caminho da ROM ou arquivo escolhido no upload
 *   bios:   String (opcional),    caminho do arquivo de BIOS, se o sistema exigir
 * }
 */
function startGame(descriptor) {
  showScreen("player");
  playerTitleEl.textContent = descriptor.title;
  document.title = descriptor.title + " · " + window.APP_CONFIG.siteName;
  playerErrorEl.hidden = true;
  showLoadingOverlay(descriptor.title);
  triggerCrtFlicker();

  // Quando a ROM vem de um caminho cadastrado em games.js (diferente de
  // um upload, que já é garantidamente um arquivo local válido), a gente
  // confirma primeiro que o arquivo existe DE VERDADE naquele endereço.
  // Sem essa checagem, um caminho errado em games.js só aparece como o
  // erro genérico "Network error" do próprio EmulatorJS, que não diz
  // qual arquivo ele tentou (e não conseguiu) buscar.
  if (typeof descriptor.source === "string") {
    checkRomExists(descriptor.source).then(function (exists) {
      if (exists) {
        bootEmulator(descriptor);
      } else {
        showFatalError(
          'Não encontrei a ROM em "' + descriptor.source + '".\n\n' +
          "Causas mais comuns:\n" +
          "1) O caminho em js/games.js não bate exatamente com o nome/local " +
          'do arquivo — maiúsculas e minúsculas contam ("Jogo.sfc" ≠ "jogo.sfc").\n' +
          "2) O site foi aberto direto pelo index.html (duplo clique) em vez " +
          "de por um servidor local — veja o README.md, seção 1."
        );
      }
    });
  } else {
    // Veio do cartucho "Carregar ROM do aparelho": já é um File local
    // de verdade, não precisa de checagem nenhuma.
    bootEmulator(descriptor);
  }
}

// Checagem leve para confirmar que uma ROM cadastrada em games.js existe
// no caminho informado. Importante: usa GET (não HEAD) e cancela a
// leitura do corpo assim que a resposta chega — alguns servidores de
// desenvolvimento leves (por exemplo, a extensão Live Server do VS Code)
// não lidam bem com requisições HEAD e retornam erro mesmo quando o
// arquivo existe, então GET é a opção mais compatível. O `.cancel()`
// evita baixar o arquivo inteiro só pra checar se ele existe.
function checkRomExists(url) {
  return fetch(url)
    .then(function (res) {
      if (res.body && typeof res.body.cancel === "function") {
        res.body.cancel();
      }
      return res.ok;
    })
    .catch(function () {
      return false;
    });
}

/**
 * Configura e efetivamente inicia o EmulatorJS. Só chega até aqui depois
 * que já sabemos (quando aplicável) que o arquivo da ROM existe de verdade.
 */
function bootEmulator(descriptor) {
  var cfg = window.APP_CONFIG;

  // ---- Variáveis globais do EmulatorJS ----
  // IMPORTANTE: precisam ser definidas ANTES de carregar o loader.js,
  // porque ele lê essas variáveis no exato momento em que é executado.
  window.EJS_player = "#game";
  window.EJS_core = descriptor.core;
  window.EJS_gameUrl = descriptor.source;
  window.EJS_gameName = descriptor.title;
  window.EJS_pathtodata = cfg.pathToDataOverride || cfg.pathToData;
  window.EJS_startOnLoaded = true; // sem precisar clicar em "Start" de novo
  window.EJS_color = cfg.accentColor;
  window.EJS_backgroundColor = cfg.backgroundColor;
  window.EJS_backgroundBlur = true;
  window.EJS_alignStartButton = "center";
  window.EJS_startButtonName = "Jogar";
  window.EJS_fullscreenOnLoaded = !!cfg.fullscreenOnStart;
  window.EJS_volume = 0.5;

  if (descriptor.bios) {
    window.EJS_biosUrl = descriptor.bios;
  } else {
    delete window.EJS_biosUrl;
  }

  // Passa ?debug=1 na URL pra ativar o modo debug do EmulatorJS (mostra
  // mais informação no console — útil se algo não carregar).
  var debugParam = new URLSearchParams(window.location.search).get("debug");
  window.EJS_DEBUG_XX = debugParam === "1";

  // ---- Eventos do ciclo de vida do EmulatorJS ----
  // (ver README.md > "Como o save automático funciona" para mais detalhes)

  window.EJS_ready = function () {
    // A interface do EmulatorJS já existe — a partir daqui ele mesmo
    // cuida da tela, então escondemos nosso overlay de carregamento.
    hideLoadingOverlay();
  };

  window.EJS_onGameStart = function () {
    attemptAutoResume();
    startAutoSaveTimer();
    attemptLandscapeLock();
  };

  // ---- Injeta o loader.js, que dispara o download do núcleo + da ROM ----
  var script = document.createElement("script");
  script.src = window.EJS_pathtodata + "loader.js";
  script.onerror = function () {
    showFatalError(
      "Não foi possível carregar o emulador. Verifique sua conexão com a " +
      "internet — este site precisa estar online para jogar (só o " +
      "progresso salvo funciona offline)."
    );
  };
  document.body.appendChild(script);
}

function showLoadingOverlay(title) {
  loadingTitleEl.textContent = title;
  loadingOverlayEl.hidden = false;
}

function hideLoadingOverlay() {
  loadingOverlayEl.hidden = true;
}

function showFatalError(message) {
  hideLoadingOverlay();
  playerErrorEl.textContent = message;
  playerErrorEl.hidden = false;
}

function triggerCrtFlicker() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  playerScreenEl.classList.remove("crt-flicker");
  void playerScreenEl.offsetWidth; // força o navegador a "esquecer" a animação anterior
  playerScreenEl.classList.add("crt-flicker");
}

// ============================================================================
// SAVE AUTOMÁTICO
// ============================================================================
// O EmulatorJS já guarda os saves no IndexedDB do navegador sozinho — a
// parte que fazemos aqui é: (1) tentar carregar o último save state assim
// que o jogo inicia, e (2) salvar de novo em intervalos e ao sair.
//
// Usamos um "slot" de save state dedicado (configurável em config.js,
// padrão = 1) só para esse auto-save, então ele não interfere com os
// saves manuais que o próprio menu do EmulatorJS oferece (tecla F2/F4).
// ============================================================================

function attemptAutoResume() {
  try {
    window.EJS_emulator.gameManager.quickLoad(window.APP_CONFIG.autoSaveSlot);
  } catch (err) {
    // Não existe save state ainda para este jogo, neste navegador — é
    // exatamente o esperado na primeira vez que alguém joga. Sem problema,
    // o jogo simplesmente começa do início.
  }
}

function startAutoSaveTimer() {
  stopAutoSaveTimer();
  autoSaveTimerId = window.setInterval(saveProgressNow, window.APP_CONFIG.autoSaveIntervalMs);
}

function stopAutoSaveTimer() {
  if (autoSaveTimerId !== null) {
    window.clearInterval(autoSaveTimerId);
    autoSaveTimerId = null;
  }
}

function saveProgressNow() {
  try {
    if (window.EJS_emulator && window.EJS_emulator.gameManager) {
      window.EJS_emulator.gameManager.quickSave(window.APP_CONFIG.autoSaveSlot);
    }
  } catch (err) {
    // Se der erro (ex: o core ainda não terminou de iniciar), não faz
    // nada — a próxima tentativa do timer resolve.
  }
}

// "visibilitychange" é o evento mais confiável pra detectar que o
// jogador saiu (trocou de app no celular, minimizou, fechou a aba) —
// bem mais confiável que "beforeunload" em navegadores mobile.
document.addEventListener("visibilitychange", function () {
  if (document.visibilityState === "hidden") {
    saveProgressNow();
  }
});
window.addEventListener("pagehide", saveProgressNow);

// ============================================================================
// CONTROLE FÍSICO x CONTROLE VIRTUAL
// ============================================================================
// O EmulatorJS já reconhece teclado e controles USB/Bluetooth (via
// Gamepad API) automaticamente — nenhum código extra é necessário pra isso.
// Ele também já desenha um controle virtual na tela em aparelhos touch.
//
// O que fazemos aqui é só a parte de "esconder o controle virtual quando
// um controle físico está conectado": ouvimos os eventos nativos de
// gamepad e ligamos uma classe no <body> que o css/style.css usa pra
// esconder o overlay. Se um controle físico for desconectado, o controle
// virtual volta a aparecer.
// ============================================================================

function setupGamepadWatcher() {
  window.addEventListener("gamepadconnected", function () {
    document.body.classList.add("physical-gamepad-connected");
  });

  window.addEventListener("gamepaddisconnected", function () {
    if (!anyGamepadStillConnected()) {
      document.body.classList.remove("physical-gamepad-connected");
    }
  });

  // Alguns navegadores/controles já estão "conectados" antes de qualquer
  // evento disparar (ex: controle pareado por Bluetooth antes de abrir
  // o site) — por isso essa checagem inicial.
  if (anyGamepadStillConnected()) {
    document.body.classList.add("physical-gamepad-connected");
  }
}

function anyGamepadStillConnected() {
  if (!navigator.getGamepads) return false;
  var pads = navigator.getGamepads();
  for (var i = 0; i < pads.length; i++) {
    if (pads[i]) return true;
  }
  return false;
}

// ============================================================================
// TELA CHEIA E ORIENTAÇÃO PAISAGEM
// ============================================================================
// O aviso "gire seu aparelho" (quando o celular está no modo retrato) é
// feito só em CSS — ver a regra @media (orientation: portrait) em
// css/style.css — e funciona em qualquer navegador, sem depender de JS.
//
// Aqui só tentamos, como bônus, travar a orientação em paisagem quando
// entra em tela cheia. Nem todo navegador suporta isso (o iOS Safari, por
// exemplo, não suporta) — por isso o aviso em CSS continua sendo a garantia
// principal, e isso aqui é só uma tentativa "a mais" quando disponível.
// ============================================================================

function attemptLandscapeLock() {
  if (!window.APP_CONFIG.lockLandscapeOnFullscreen) return;
  if (!screen.orientation || !screen.orientation.lock) return;

  document.addEventListener("fullscreenchange", function () {
    if (document.fullscreenElement) {
      screen.orientation.lock("landscape").catch(function () {
        // Recusado pelo navegador — sem problema, ver comentário acima.
      });
    }
  });
}
