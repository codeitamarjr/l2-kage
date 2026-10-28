// Builds site/resources/data/itemdb.ndjson.gz, the item database the website imports (php artisan itemdb:import),
// from the L2J Mobius Essence datapack (dist/game/data of the chapter). One JSON record per line:
//   {"t":"item",   id, name, type, kind, category, grade, icon, weight, price, crystals, ss, sps, mp, flags, stats}
//   {"t":"npc",    id, name, title, level, type}                       only NPCs that drop, spoil or sell something
//   {"t":"drop",   g, npc, item, kind: "drop"|"spoil", min, max, chance, gchance}
//                  g groups the items of one drop group; an item outside a group is a group of its own (gchance 100)
//   {"t":"shop",   npc, item}                                           buylists/*.xml (<npcs> that sell each list)
//   {"t":"recipe", id, recipe, name, level, dwarven, success, mp, product, count, rare, ingredients}
// The server's rates are applied by the website, from the live config. Re-run after updating the datapack
// (from site/):  node resources/data/build-itemdb.mjs
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const dp = path.join(root, 'L2J_Mobius_Essence_10.1_SamuraiCrow/dist/game/data');
const out = path.join(root, 'site/resources/data/itemdb.ndjson.gz');

const decode = (s) => s
	.replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const xmlFiles = (dir) => fs.readdirSync(dir).filter((f) => f.endsWith('.xml')).sort().map((f) => fs.readFileSync(path.join(dir, f), 'utf8'));
const attr = (tag, name) => tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
const records = [];

// Items
const JEWELRY = new Set(['neck', 'rear;lear', 'rfinger;lfinger']);
const ACCESSORY = new Set(['hair', 'hair2', 'hairall', 'deco1', 'talisman', 'lbracelet', 'rbracelet', 'waist', 'back', 'underwear', 'alldress',
	'agathion', 'brooch']);
const STATS = new Set(['pAtk', 'mAtk', 'pAtkSpd', 'critRate', 'accCombat', 'pDef', 'mDef', 'maxMp', 'sDef', 'rEvas', 'rShld', 'pAtkRange',
	'fireRes', 'waterRes', 'windRes', 'earthRes', 'holyRes', 'darkRes', 'holyPower', 'magicSuccRes']);
const items = new Map();

for (const xml of xmlFiles(path.join(dp, 'stats/items'))) {
	// <item id=".." name=".." type="..">...</item>, or self-closing for simple items.
	for (const m of xml.matchAll(/<item\s+([^>]*?)(?:\/>|>([\s\S]*?)<\/item>)/g)) {
		const [, head, body = ''] = m;
		const id = attr(head, 'id');
		const type = attr(head, 'type') ?? 'EtcItem';
		const name = attr(head, 'name') ?? '';
		const set = (key) => body.match(new RegExp(`<set name="${key}" val="([^"]*)"`))?.[1];
		const num = (key) => (set(key) === undefined ? null : Number(set(key)));
		const flag = (key, fallback) => (set(key) === undefined ? fallback : set(key) === 'true' || set(key) === '1');
		const bodypart = set('bodypart');

		let kind = 'other';
		let category = 'etc';
		if (type === 'Weapon') {
			kind = (set('weapon_type') ?? 'ETC').toLowerCase();
			category = 'weapon';
		} else if (type === 'Armor') {
			kind = bodypart ?? 'other';
			category = JEWELRY.has(kind) ? 'jewelry' : ACCESSORY.has(kind) ? 'accessory' : 'armor';
			if (kind === 'lhand') kind = set('armor_type') === 'SIGIL' ? 'sigil' : 'shield';
		} else {
			kind = (set('etcitem_type') ?? 'other').toLowerCase();
			if (Number(id) === 57) kind = 'adena';
		}

		// Base stats: <stats><stat type="pAtk">8</stat>...</stats> (the item's own values, not enchant bonuses).
		const stats = {};
		const statsBody = body.match(/<stats>([\s\S]*?)<\/stats>/)?.[1] ?? '';
		for (const s of statsBody.matchAll(/<stat\s+type="(\w+)"\s*>(-?[\d.]+)<\/stat>/g)) {
			if (STATS.has(s[1])) stats[s[1]] = { op: 'set', val: Number(s[2]) };
		}

		const grade = set('crystal_type');
		const item = {
			t: 'item', id: Number(id), name: decode(name), type, kind, category,
			grade: grade && grade !== 'NONE' ? grade : null,
			icon: set('icon') ?? null,
			weight: num('weight') ?? 0,
			price: num('price') ?? 0,
			crystals: num('crystal_count'),
			ss: num('soulshots'), sps: num('spiritshots'), mp: num('mp_consume'),
			flags: {
				stackable: flag('is_stackable', false),
				tradable: flag('is_tradable', true),
				droppable: flag('is_droppable', true),
				sellable: flag('is_sellable', true),
				quest: flag('is_questitem', false),
				magic: flag('is_magic_weapon', false),
				herb: kind === 'herb' || flag('ex_immediate_effect', false), // herbs use the herb drop rate
				limited: num('time') ?? num('duration'),
			},
			stats,
		};
		items.set(item.id, item);
		records.push(item);
	}
}

// NPCs and their drops / spoils
const npcs = new Map();
const used = new Set();
let group = 0;

for (const xml of xmlFiles(path.join(dp, 'stats/npcs'))) {
	for (const m of xml.matchAll(/<npc\s+([^>]*?)(?:\/>|>([\s\S]*?)<\/npc>)/g)) {
		const [, head, body = ''] = m;
		const npc = {
			t: 'npc', id: Number(attr(head, 'id')), name: decode(attr(head, 'name') ?? ''), title: attr(head, 'title') ? decode(attr(head, 'title')) : null,
			level: Number(attr(head, 'level') ?? 0), type: attr(head, 'type') ?? 'Npc',
		};
		npcs.set(npc.id, npc);

		for (const [tag, kind] of [['drop', 'drop'], ['spoil', 'spoil']]) {
			const list = body.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`))?.[1];
			if (!list) continue;
			const push = (itemTag, g, gchance) => {
				const itemId = Number(attr(itemTag, 'id'));
				if (!items.has(itemId)) return;
				records.push({ t: 'drop', g, npc: npc.id, item: itemId, kind, min: Number(attr(itemTag, 'min')), max: Number(attr(itemTag, 'max')), chance: Number(attr(itemTag, 'chance')), gchance });
				used.add(npc.id);
			};
			for (const gm of list.matchAll(/<group\s+chance="([\d.]+)"\s*>([\s\S]*?)<\/group>/g)) {
				group++;
				for (const im of gm[2].matchAll(/<item\s[^>]*\/>/g)) push(im[0], group, Number(gm[1]));
			}
			for (const im of list.replace(/<group[\s\S]*?<\/group>/g, '').matchAll(/<item\s[^>]*\/>/g)) push(im[0], ++group, 100);
		}
	}
}

// Merchants: buylists/*.xml list the items, and <npcs><npc>id</npc></npcs> the NPCs that sell them.
let shops = 0;
for (const xml of xmlFiles(path.join(dp, 'buylists'))) {
	const npcIds = [...(xml.match(/<npcs>([\s\S]*?)<\/npcs>/)?.[1] ?? '').matchAll(/<npc>(\d+)<\/npc>/g)].map((n) => Number(n[1]));
	const itemIds = [...new Set([...xml.replace(/<npcs>[\s\S]*?<\/npcs>/, '').matchAll(/<item\s+id="(\d+)"/g)].map((i) => Number(i[1])))]
		.filter((itemId) => items.has(itemId));
	for (const npcId of npcIds) {
		for (const itemId of itemIds) {
			records.push({ t: 'shop', npc: npcId, item: itemId });
			shops++;
		}
		used.add(npcId);
	}
}

for (const id of used) {
	if (npcs.has(id)) records.push(npcs.get(id));
}

// Recipes
const recipeXml = fs.readFileSync(path.join(dp, 'Recipes.xml'), 'utf8');
let recipes = 0;
for (const m of recipeXml.matchAll(/<item\s+([^>]*recipeId="\d+"[^>]*)>([\s\S]*?)<\/item>/g)) {
	const [, head, body] = m;
	const production = body.match(/<production\s[^>]*\/>/)?.[0];
	const rare = body.match(/<productionRare\s[^>]*\/>/)?.[0];
	records.push({
		t: 'recipe', id: Number(attr(head, 'id')), recipe: Number(attr(head, 'recipeId')), name: attr(head, 'name'),
		level: Number(attr(head, 'craftLevel')), dwarven: attr(head, 'type') === 'dwarven', success: Number(attr(head, 'successRate')),
		mp: Number(body.match(/<statUse name="MP" value="(\d+)"/)?.[1] ?? 0),
		product: Number(attr(production, 'id')), count: Number(attr(production, 'count')),
		rare: rare ? { id: Number(attr(rare, 'id')), count: Number(attr(rare, 'count')), rarity: Number(attr(rare, 'rarity')) } : null,
		ingredients: [...body.matchAll(/<ingredient\s+id="(\d+)"\s+count="(\d+)"/g)].map((i) => [Number(i[1]), Number(i[2])]),
	});
	recipes++;
}

fs.writeFileSync(out, zlib.gzipSync(records.map((r) => JSON.stringify(r)).join('\n') + '\n', { level: 9 }));
const count = (t) => records.filter((r) => r.t === t).length;
console.log(`Wrote ${path.relative(root, out)}: ${count('item')} items, ${count('npc')} npcs, ${count('drop')} drops, ${shops} shop entries, ${recipes} recipes (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`);
