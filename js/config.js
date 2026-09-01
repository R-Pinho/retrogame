/**
 * ============================================================================
 *  CONFIGURAÇÃO GERAL DO SITE
 * ============================================================================
 * Este é o painel de controle do projeto. Praticamente todo ajuste de
 * comportamento (sem mexer em lógica) pode ser feito aqui.
 *
 * Depois de editar este arquivo, basta salvar e recarregar a página —
 * não precisa mexer em mais nada.
 * ============================================================================
 */
window.APP_CONFIG = {

    // --------------------------------------------------------------------
    // IDENTIDADE DO SITE
    // --------------------------------------------------------------------

    // Nome exibido no topo da tela e na aba do navegador.
    siteName: "Retro Play",

    // Se true, a tela inicial não mostra nenhum jogo clicável (nem o
    // cartucho de "Carregar ROM") — vira uma tela praticamente vazia, só
    // com o logo. A única forma de abrir um jogo é pelo link direto dele
    // (?jogo=id — veja o ícone 🔗 em cada cartucho quando isso estiver
    // como false, ou o README.md, seção 3). Útil pra usar com tags NFC
    // como "links secretos": quem não tem a tag/link não vê nada jogável.
    hideLibraryByDefault: true,

    // --------------------------------------------------------------------
    // EMULATORJS — MOTOR DE EMULAÇÃO
    // --------------------------------------------------------------------
    // O EmulatorJS é carregado a partir do CDN público oficial por padrão.
    // Isso é o que permite o site "funcionar online" sem você precisar
    // hospedar ~centenas de MB de núcleos (cores) de emulador.
    //
    // Versões disponíveis:
    //   "stable"  -> recomendado (código e núcleos testados)
    //   "latest"  -> código mais novo, núcleos estáveis
    //   "nightly" -> tudo em desenvolvimento (pode quebrar)
    emulatorVersion: "stable",

    // Monta a URL final a partir da versão acima. Você não precisa editar isso.
    get pathToData() {
        return `https://cdn.emulatorjs.org/${this.emulatorVersion}/data/`;
    },

    // Quer AUTO-HOSPEDAR o EmulatorJS (funciona offline depois do 1º load,
    // não depende do CDN deles)? Veja o passo a passo no README.md
    // ("Auto-hospedando o EmulatorJS") e troque a linha abaixo, por ex:
    //   pathToDataOverride: "emulatorjs-data/data/",
    pathToDataOverride: null,

    // --------------------------------------------------------------------
    // SALVAMENTO AUTOMÁTICO (save state)
    // --------------------------------------------------------------------

    // De quanto em quanto tempo o progresso é salvo sozinho, em milissegundos.
    // 30000 = 30 segundos. Não recomendo descer de ~10000 (10s): salvar
    // demais em pouco tempo pode deixar o jogo levemente engasgado.
    autoSaveIntervalMs: 30000,

    // "Gaveta" reservada para o save automático (1 a 9). Não é o mesmo slot
    // usado pelo menu de save manual do próprio EmulatorJS (F2/F4), então
    // os dois convivem sem conflito.
    autoSaveSlot: 1,

    // --------------------------------------------------------------------
    // APARÊNCIA
    // --------------------------------------------------------------------

    // Cor de destaque usada pela INTERFACE DO EMULATORJS (barra de menu,
    // botões, barra de progresso). O resto do site é estilizado em css/style.css.
    accentColor: "#8b7fc9",

    // Cor de fundo atrás da tela do jogo (letterboxing).
    backgroundColor: "#120f19",

    // --------------------------------------------------------------------
    // TELA CHEIA E ORIENTAÇÃO
    // --------------------------------------------------------------------

    // Tenta entrar em tela cheia automaticamente assim que o jogo inicia.
    // Recomendado para celular. Se o navegador bloquear (alguns bloqueiam
    // fora de um toque direto do usuário), o botão de tela cheia do próprio
    // EmulatorJS continua disponível como alternativa manual.
    fullscreenOnStart: true,

    // Tenta travar a orientação em paisagem ao entrar em tela cheia.
    // Funciona na maioria dos navegadores Android; iOS Safari ainda não
    // suporta essa API, então lá o usuário gira o aparelho manualmente
    // (o aviso de "gire seu aparelho" cuida disso — ver css/style.css).
    lockLandscapeOnFullscreen: true,
};
