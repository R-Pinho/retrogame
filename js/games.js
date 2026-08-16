/**
 * ============================================================================
 *  BIBLIOTECA DE JOGOS
 * ============================================================================
 * Cada objeto na lista abaixo vira um "cartucho" clicável na tela inicial.
 *
 *   - Se a lista tiver 1 jogo só  -> o site pula direto para a tela de
 *     "toque para jogar" daquele jogo (sem prateleira/menu).
 *   - Se tiver 2 ou mais          -> aparece a prateleira para escolher.
 *   - Se estiver vazia (padrão)   -> aparece uma tela explicando como
 *     adicionar o primeiro jogo (e o botão de carregar ROM avulsa
 *     continua funcionando normalmente).
 *
 * COMO ADICIONAR UM JOGO NOVO:
 *   1. Copie o arquivo da ROM para dentro de  /roms/<sistema>/
 *   2. Duplique um dos objetos abaixo e ajuste os campos (veja a lista
 *      de campos logo abaixo).
 *   3. Salve o arquivo e recarregue a página. Pronto.
 *
 * CAMPOS DE CADA JOGO:
 *   id     String única, sem espaços/acentos. Usada no link direto
 *          (ex: seusite.com/?jogo=chrono-trigger).
 *   title  Nome mostrado no cartucho.
 *   system Nome do sistema mostrado no cartucho (livre, ex: "SNES").
 *   core   Núcleo do EmulatorJS que roda esse sistema. Veja a tabela
 *          completa em README.md ("Sistemas suportados"). Os mais comuns:
 *              snes    -> Super Nintendo
 *              nes     -> Nintendo (NES)
 *              gba     -> Game Boy Advance
 *              gb      -> Game Boy / Game Boy Color
 *              n64     -> Nintendo 64
 *              psx     -> PlayStation 1
 *              segaMD  -> Mega Drive / Genesis
 *   file   Caminho da ROM dentro do projeto (relativo, sem "/" no início).
 *   image  (opcional) Caminho de uma imagem de capa. Deixe "" para usar
 *          o cartucho ilustrado padrão.
 *   bios   (opcional) Só para sistemas que exigem BIOS (ex: PlayStation).
 *          Caminho do arquivo de BIOS. Deixe de fora se não precisar.
 * ============================================================================
 */
window.GAME_LIBRARY = [

    {
        id: "SMALLSTARS",
        title: "Super Mario All Stars",
        system: "SNES",
        core: "snes",
        file: "roms/snes/SMALLSTARS.smc",
        image: "capas/smallstars.png",
    },

    {
        id: "SMK",
        title: "Super Mario Kart",
        system: "SNES",
        core: "snes",
        file: "roms/snes/SMK.smc",
        image: "capas/smk.png",
    },

    // {
    //     id: "bbegins",
    //     title: "Batman Begins",
    //    system: "GBA",
    //   core: "mGBA",
    //     file: "roms/gba/bbegins.gba",
    //     image: "",
    //},

    {
        id: "Doom64",
        title: "Doom 64",
        system: "N64",
        core: "n64",
        file: "roms/n64/Doom64.z64",
        image: "capas/Doom64.png",
    },

    {
        id: "TMNT",
        title: "Teenage Mutant Ninja Turtle",
        system: "nes",
        core: "nes",
        file: "roms/nes/TMNT.nes",
        image: "capas/tmnt.png",
    },

    //  {
    //      id: "Pandemonium",
    //      title: "Pandemonium",
    //      system: "ps1",
    //      core: "psx",
    //      file: "roms/psx/Pandemonium.bin",
    //      image: "capas/Pandemonium.jpg",
    //  },
];