export type SharedProps = {
    serverName: string;
    /** The visitor's language (see resources/js/i18n.ts). */
    locale: 'en' | 'pt_BR';
    player: { login: string; gm: boolean } | null;
    /** One-off message after a redirect (see HandleInertiaRequests). */
    flash: { status: string | null; sentTo: string | null; login: string | null };
    /** Cloudflare Turnstile site key, or null when the bot check is off. */
    turnstileSiteKey: string | null;
    /** False until an email service is configured: registration and password resets are closed. */
    emailReady: boolean;
};

export type EventState = 'live' | 'soon' | 'scheduled' | 'ready' | 'slain';

/** A spot on the world map, in percent of the map image (see app/Services/L2j/WorldMap.php). */
export type MapPoint = { x: number; y: number; name: string };

export type GameEvent = {
    id: string;
    category: 'epic' | 'raid' | 'siege' | 'olympiad' | 'event';
    title: string;
    level?: number | null;
    place?: string;
    state: EventState;
    headline: string;
    detail?: string;
    startsAt?: string | null;
    endsAt?: string | null;
    returnsAt?: string | null;
    at?: MapPoint[];
};

export type RaidPin = { id: number; name: string; level: number | null; x: number; y: number; alive: boolean; returnsAt: string | null };

/** Every raid boss on the map, plus how many spawn in lands the map doesn't show. */
export type WorldMapData = { raids: RaidPin[]; beyond: number };

export type EventFeed = {
    generatedAt: string;
    live: number;
    events: GameEvent[];
};

export type ServerStatus = {
    generatedAt: string;
    server: {
        name: string;
        chronicle: string;
        maxLevel: number;
        address: string | null;
        hostname: string | null;
        loginPort: number;
        gamePort: number;
        geodataRegions: number;
        autoCreateAccounts: boolean;
    };
    status: { login: boolean; game: boolean; database: boolean };
    rates: Record<'xp' | 'sp' | 'adena' | 'drop' | 'spoil' | 'raid' | 'questXp' | 'questAdena', number>;
    players?: { online: number };
    totals?: { accounts: number; characters: number; clans: number };
    races?: { name: string; count: number }[];
    top?: {
        level: { name: string; level: number; race: string }[];
        pvp: { name: string; pvp: number; level: number; race: string }[];
    };
    castles?: { name: string; owner: string | null }[];
};

export type CharacterSummary = {
    id: number;
    name: string;
    title: string | null;
    level: number;
    className: string;
    baseClassName: string | null;
    race: string;
    sex: string;
    online: boolean;
    clan: string | null;
    noblesse: boolean;
    gm: boolean;
    lastSeen: string | null;
    deleting: boolean;
};

export type CharacterItem = {
    id: number;
    itemId: number;
    name: string;
    type: 'Weapon' | 'Armor' | 'EtcItem';
    grade: string | null;
    kind: string;
    category: 'weapon' | 'armor' | 'jewelry' | 'accessory' | 'etc';
    icon: string | null;
    count: number;
    enchant: number;
    slot?: string;
};

export type CharacterDetail = CharacterSummary & {
    clanLevel: number | null;
    status: {
        hp: { current: number; max: number };
        mp: { current: number; max: number };
        cp: { current: number; max: number };
        exp: number;
        expPercent: number;
        sp: number;
        karma: number;
        fame: number;
        pvp: number;
        pk: number;
        vitality: number;
        onlineSeconds: number;
        created: string | null;
    };
    adena: number;
    items: { equipped: CharacterItem[]; inventory: CharacterItem[]; warehouse: CharacterItem[] };
};

/** The weekly gift box in the player area (app/Services/GiftBox.php). */
export type GiftBoxStatus = {
    enabled: boolean;
    minLevel: number;
    nextAt: string;
    contents: {
        guaranteed: { name: string; count: number }[];
        bonus: { name: string; count: number; chance: number }[];
    };
    eligible: { id: number; name: string; level: number }[];
    claim: {
        characterName: string;
        items: { id: number; name: string; count: number; bonus: boolean }[];
        claimedAt: string;
        status: 'pending' | 'processing' | 'done' | 'failed';
        result: string | null;
    } | null;
};

/** Item database (app/Services/L2j/ItemDatabase.php). */
export type ItemSummary = {
    id: number;
    name: string;
    type: 'Weapon' | 'Armor' | 'EtcItem';
    kind: string;
    category: 'weapon' | 'armor' | 'jewelry' | 'accessory' | 'etc';
    grade: string | null;
    /** A real icon from public/assets/icons, or null for the drawn placeholder. */
    icon: string | null;
};

export type ItemRef = { item: ItemSummary | { id: number; name: string }; count: number };

export type ItemSource = {
    npc: { id: number; name: string; title: string | null; level: number; type: string };
    chance: number;
    min: number;
    max: number;
};

export type ItemRecipe = {
    id: number;
    recipe: ItemSummary | { id: number; name: string };
    level: number;
    dwarven: boolean;
    successRate: number;
    mpCost: number;
    product: ItemRef;
    rare: (ItemRef & { chance: number }) | null;
    ingredients: ItemRef[];
};

export type ItemDetail = ItemSummary & {
    weight: number;
    price: number;
    crystals: number | null;
    soulshots: number | null;
    spiritshots: number | null;
    mpConsume: number | null;
    flags: { stackable: boolean; tradable: boolean; droppable: boolean; sellable: boolean; quest: boolean; magic: boolean; herb: boolean; limited: number | null };
    stats: Record<string, { op: 'set' | 'add' | 'mul'; val: number }>;
    drops: { rows: ItemSource[]; total: number };
    spoils: { rows: ItemSource[]; total: number };
    merchants: { id: number; name: string; title: string | null }[];
    craftedBy: ItemRecipe[];
    usedIn: ItemRecipe[];
    teaches: ItemRecipe[];
};
