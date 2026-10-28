/**
 * Named places on the world map (public/assets/map/aden-world-map.webp, 1977 x 2620 px), used to tell where a raid
 * boss stands ("Near Cruma Tower") and to add the story of the place. Positions are the map's own icons, in pixels.
 * Lore is consistent with /lore (the history of Aden up to Essence: Samurai Crow).
 */
import { pick, type Locale, type Localized } from '@/i18n';

export const MAP_SIZE = { width: 1977, height: 2620 };

export type Landmark = { name: string; px: [number, number]; lore?: Localized };

export const LANDMARKS: Landmark[] = [
    // Towns and villages
    { name: 'Talking Island Village', px: [400, 2510], lore: { en: 'Where young humans take their first steps, under the gaze of the Obelisk of Victory.', pt: 'Onde os jovens humanos dão seus primeiros passos, sob o olhar do Obelisco da Vitória.' } },
    { name: 'Gludin Village', px: [405, 2063] },
    { name: 'Town of Gludio', px: [742, 1900] },
    { name: 'Town of Dion', px: [905, 2030] },
    { name: 'Floran Village', px: [900, 2140] },
    { name: 'Town of Giran', px: [1250, 2040], lore: { en: 'The richest trading city in Aden, living in the shadow of Dragon Valley.', pt: 'A cidade comercial mais rica de Aden, vivendo à sombra do Vale do Dragão.' } },
    { name: 'Town of Oren', px: [1240, 1550] },
    { name: 'Town of Aden', px: [1550, 1418], lore: { en: 'The royal capital, seat of the Kingdom of Aden since the fall of Baium’s empire.', pt: 'A capital real, sede do Reino de Aden desde a queda do império de Baium.' } },
    { name: 'Heine', px: [1380, 2410], lore: { en: 'The city on the water, heart of the Innadril territory.', pt: 'A cidade sobre as águas, coração do território de Innadril.' } },
    { name: 'Hunters Village', px: [1402, 1665] },
    { name: 'Town of Goddard', px: [1563, 1008] },
    { name: 'Rune Township', px: [1000, 1058] },
    { name: 'Town of Schuttgart', px: [1270, 585] },
    { name: 'Dark Elven Village', px: [868, 1385], lore: { en: 'Home of the Dark Elves, children of Shilen, hidden in a forest that never sees the sun.', pt: 'Lar dos Elfos Negros, filhos de Shilen, escondido numa floresta que nunca vê o sol.' } },
    { name: 'Elven Village', px: [1050, 1560], lore: { en: 'Home of the Elves, sheltered by the Mother Tree, the last gift of Eva.', pt: 'Lar dos Elfos, protegido pela Árvore Mãe, o último presente de Eva.' } },
    { name: 'Orc Village', px: [590, 725], lore: { en: 'The Orcs keep the fire of Pa’agrio burning in the frozen north-west.', pt: 'Os Orcs mantêm o fogo de Pa’agrio aceso no noroeste congelado.' } },
    { name: 'Dwarven Village', px: [1410, 390], lore: { en: 'The Dwarves dig, build and trade from the snowy mountains of the north.', pt: 'Os Anões escavam, constroem e negociam nas montanhas nevadas do norte.' } },
    { name: 'Kamael Village', px: [232, 1540], lore: { en: 'The Kamael, the Giants’ living weapons, sealed away on the Isle of Souls and now returned to defend Aden.', pt: 'Os Kamael, armas vivas dos Gigantes, selados na Ilha das Almas e agora de volta para defender Aden.' } },

    // Dungeons, towers and wild lands
    { name: 'Ivory Tower', px: [1250, 1380], lore: { en: 'The tower of the magi of Oren. Beleth was once held in a dungeon beneath it, until he escaped to Hellbound.', pt: 'A torre dos magos de Oren. Beleth já foi mantido numa masmorra sob ela, até fugir para Hellbound.' } },
    { name: 'Tower of Insolence', px: [1395, 1375], lore: { en: 'Emperor Baium built it to reach the gods. They sealed him at its summit, frozen in his own monument.', pt: 'O Imperador Baium a construiu para alcançar os deuses. Eles o selaram no topo, congelado em seu próprio monumento.' } },
    { name: 'Cruma Tower', px: [905, 1870], lore: { en: 'A relic of an older age, still humming with machines that obey no living master.', pt: 'Uma relíquia de uma era antiga, ainda zumbindo com máquinas que não obedecem a nenhum mestre vivo.' } },
    { name: 'The Ant Nest', px: [735, 2140], lore: { en: 'A vast hive beneath the fields of Dion, where Queen Ant breeds an endless brood.', pt: 'Uma vasta colmeia sob os campos de Dion, onde a Queen Ant gera uma cria sem fim.' } },
    { name: 'Sea of Spores', px: [1085, 1410], lore: { en: 'A poisoned land near Oren where Orfen, the Spore Mistress, drifts through the haze.', pt: 'Uma terra envenenada perto de Oren, onde Orfen, a Senhora dos Esporos, flutua pela névoa.' } },
    { name: 'Dragon Valley', px: [1305, 1882], lore: { en: 'The domain of Antharas, the Earth Dragon. Its creatures grow stronger the closer you get to his lair.', pt: 'O domínio de Antharas, o Dragão da Terra. Suas criaturas ficam mais fortes quanto mais perto do covil você chega.' } },
    { name: "Antharas' Lair", px: [1550, 1880], lore: { en: 'Beneath Dragon Valley the Earth Dragon waits. His lair is now open to every adventurer brave enough to enter.', pt: 'Sob o Vale do Dragão, o Dragão da Terra aguarda. Seu covil agora está aberto a todo aventureiro corajoso o bastante para entrar.' } },
    { name: "Antharas' Nest", px: [1720, 1870], lore: { en: 'Beneath Dragon Valley the Earth Dragon waits. His lair is now open to every adventurer brave enough to enter.', pt: 'Sob o Vale do Dragão, o Dragão da Terra aguarda. Seu covil agora está aberto a todo aventureiro corajoso o bastante para entrar.' } },
    { name: 'Forge of the Gods', px: [1720, 735], lore: { en: 'A land of volcanoes and molten rock. Valakas, the Fire Dragon, sleeps in its flames.', pt: 'Uma terra de vulcões e rocha derretida. Valakas, o Dragão do Fogo, dorme em suas chamas.' } },
    { name: "Valakas' Lair", px: [1895, 712], lore: { en: 'The deepest heart of the Forge of the Gods. In the age of the Crusader, the Temple of Valakas opened its gates.', pt: 'O coração mais profundo da Forja dos Deuses. Na era do Crusader, o Templo de Valakas abriu seus portões.' } },
    { name: 'The Four Sepulchers', px: [1695, 885], lore: { en: 'The guarded tombs before the Imperial Tomb of Emperor Shunaiman, founder of the Elmoreden empire.', pt: 'Os túmulos guardados diante da Tumba Imperial do Imperador Shunaiman, fundador do império de Elmoreden.' } },
    { name: 'Imperial Tomb', px: [1755, 905], lore: { en: 'The resting place of Emperor Shunaiman, founder of the Elmoreden empire.', pt: 'O local de descanso do Imperador Shunaiman, fundador do império de Elmoreden.' } },
    { name: 'Monastery of Silence', px: [1390, 880], lore: { en: 'A silent order of monks keeps old secrets in the mountains above Goddard.', pt: 'Uma ordem silenciosa de monges guarda antigos segredos nas montanhas acima de Goddard.' } },
    { name: 'Valley of Saints', px: [1220, 895] },
    { name: 'Beast Farm', px: [1075, 885] },
    { name: 'Ketra Orc Outpost', px: [1563, 935], lore: { en: 'The Ketra Orcs wage an endless war with the Varka Silenos. Adventurers can swear alliance to either.', pt: 'Os Orcs Ketra travam uma guerra sem fim contra os Varka Silenos. Aventureiros podem jurar aliança a qualquer um dos lados.' } },
    { name: 'Varka Silenos Outpost', px: [1400, 1065], lore: { en: 'The Varka Silenos wage an endless war with the Ketra Orcs. Adventurers can swear alliance to either.', pt: 'Os Varka Silenos travam uma guerra sem fim contra os Orcs Ketra. Aventureiros podem jurar aliança a qualquer um dos lados.' } },
    { name: 'Stakato Nest', px: [1275, 1095] },
    { name: 'Forest of the Dead', px: [1105, 1070] },
    { name: 'Hot Springs', px: [1590, 780] },
    { name: "Ice Queen's Castle", px: [1360, 655], lore: { en: 'Freya, the Ice Queen, rules a frozen court near Schuttgart.', pt: 'Freya, a Rainha do Gelo, governa uma corte congelada perto de Schuttgart.' } },
    { name: 'Crypts of Disgrace', px: [1070, 690] },
    { name: 'Den of Evil', px: [1185, 690] },
    { name: 'Mithril Mines', px: [1715, 425] },
    { name: 'Primeval Isle', px: [930, 1240], lore: { en: 'An island lost in time, where dinosaurs still roam. Ships sail there from Rune.', pt: 'Uma ilha perdida no tempo, onde dinossauros ainda vagam. Navios partem de Rune para lá.' } },
    { name: 'Olympiad Stadium', px: [715, 1200], lore: { en: 'Where the Noblesse of Aden fight one on one for the title of Hero.', pt: 'Onde os Noblesse de Aden lutam um contra um pelo título de Herói.' } },
    { name: 'Coliseum', px: [1568, 1530], lore: { en: 'The great arena of Aden, where crowds gather to watch champions clash.', pt: 'A grande arena de Aden, onde multidões se reúnem para ver campeões se enfrentarem.' } },
    { name: "Devil's Isle", px: [1070, 2365], lore: { en: 'A pirate haunt off the coast of Giran, where the cursed captain Zaken holds court.', pt: 'Um refúgio pirata na costa de Giran, onde o capitão amaldiçoado Zaken comanda.' } },
    { name: 'Garden of Eva', px: [1240, 2565], lore: { en: 'A sanctuary of Eva, goddess of water, in the far south of Innadril.', pt: 'Um santuário de Eva, deusa da água, no extremo sul de Innadril.' } },
    { name: 'Wasteland', px: [712, 2250], lore: { en: 'A barren land south of Dion. A warp gate at its southern edge leads to Hellbound.', pt: 'Uma terra árida ao sul de Dion. Um portal em sua borda sul leva a Hellbound.' } },
    { name: 'Blazing Swamp', px: [1550, 1225] },
    { name: 'Forest of Mirrors', px: [1580, 1720] },
    { name: "The Giant's Cave", px: [1750, 1610], lore: { en: 'Ruins of the Giants, whose forbidden knowledge brought down the wrath of the gods.', pt: 'Ruínas dos Gigantes, cujo conhecimento proibido atraiu a ira dos deuses.' } },
    { name: 'Hellbound', px: [800, 2525], lore: { en: 'A cursed island behind a magic barrier beyond the southern sea. Warp gates in Heine and at the edge of the Wasteland lead there.', pt: 'Uma ilha amaldiçoada atrás de uma barreira mágica além do mar do sul. Portais em Heine e na borda das Terras Devastadas levam até lá.' } },
];

/** The closest landmark to a map point (in percent), within about 4% of the map width. */
export function nearestLandmark(x: number, y: number): Landmark | null {
    let best: Landmark | null = null;
    let bestDistance = Infinity;

    for (const landmark of LANDMARKS) {
        const dx = ((landmark.px[0] / MAP_SIZE.width) * 100 - x) * MAP_SIZE.width;
        const dy = ((landmark.px[1] / MAP_SIZE.height) * 100 - y) * MAP_SIZE.height;
        const distance = Math.hypot(dx, dy) / 100;

        if (distance < bestDistance) {
            best = landmark;
            bestDistance = distance;
        }
    }

    return bestDistance <= MAP_SIZE.width * 0.04 ? best : null;
}

/** The lore for a named spot, e.g. an event's map point. */
export function landmarkLore(name: string, locale: Locale = 'en'): string | undefined {
    const lore = LANDMARKS.find((landmark) => landmark.name === name)?.lore;

    return lore ? pick(locale, lore) : undefined;
}
