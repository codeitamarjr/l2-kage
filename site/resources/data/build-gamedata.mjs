// Builds site/resources/data/gamedata.json from the L2J Mobius Essence datapack (dist/game/data of the chapter):
//   items:   id -> [name, type, grade]   (stats/items/*.xml)
//   classes: id -> name                  (stats/players/classList.xml)
//   exp:     level -> total XP needed    (stats/players/experience.xml; strings, they pass 2^53)
//   bosses:  npc id -> [name, level]     raid and grand bosses (stats/npcs/*.xml)
//   huntPass: per step [freeId, freeCount, premiumId, premiumCount]   the Hunt Pass rewards (HuntPass.xml)
// Re-run after updating the datapack (from site/):  node resources/data/build-gamedata.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const dp = path.join(root, 'L2J_Mobius_Essence_10.1_SamuraiCrow/dist/game/data');
const out = path.join(root, 'site/resources/data/gamedata.json');

const decode = (s) => s
	.replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const attr = (tag, name) => tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
const xmlFiles = (dir) => fs.readdirSync(dir).filter((f) => f.endsWith('.xml')).sort().map((f) => fs.readFileSync(path.join(dir, f), 'utf8'));

const items = {};
for (const xml of xmlFiles(path.join(dp, 'stats/items'))) {
	// <item id=".." name=".." type="..">...</item>, or self-closing for simple items.
	for (const m of xml.matchAll(/<item\s+([^>]*?)(?:\/>|>([\s\S]*?)<\/item>)/g)) {
		const [, head, body = ''] = m;
		const id = attr(head, 'id');
		const grade = body.match(/<set name="crystal_type" val="(\w+)"/)?.[1] ?? 'NONE';
		const name = decode(attr(head, 'name') ?? '');
		const type = attr(head, 'type') ?? 'EtcItem';
		items[id] = grade === 'NONE' ? [name, type] : [name, type, grade];
	}
}

const classes = {};
const classXml = fs.readFileSync(path.join(dp, 'stats/players/classList.xml'), 'utf8');
for (const m of classXml.matchAll(/<class classId="(\d+)" name="([^"]*)"/g)) classes[m[1]] = decode(m[2]);

const exp = {};
const expXml = fs.readFileSync(path.join(dp, 'stats/players/experience.xml'), 'utf8');
for (const m of expXml.matchAll(/<experience level="(\d+)" tolevel="(\d+)"/g)) exp[m[1]] = m[2];

const bosses = {};
for (const xml of xmlFiles(path.join(dp, 'stats/npcs'))) {
	for (const m of xml.matchAll(/<npc\s+([^>]*)>/g)) {
		const type = attr(m[1], 'type');
		if (type === 'RaidBoss' || type === 'GrandBoss') {
			bosses[attr(m[1], 'id')] = [decode(attr(m[1], 'name') ?? ''), Number(attr(m[1], 'level') ?? 0)];
		}
	}
}

const huntPass = [];
const huntXml = fs.readFileSync(path.join(dp, 'HuntPass.xml'), 'utf8');
for (const m of huntXml.matchAll(/<item\s+([^>]*?)\/>/g)) {
	huntPass.push([Number(attr(m[1], 'id')), Number(attr(m[1], 'count')), Number(attr(m[1], 'premiumId')), Number(attr(m[1], 'premiumCount'))]);
}

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify({ items, classes, exp, bosses, huntPass }));
console.log(`Wrote ${path.relative(root, out)}: ${Object.keys(items).length} items, ${Object.keys(classes).length} classes, ${Object.keys(exp).length} levels, ${Object.keys(bosses).length} bosses, ${huntPass.length} Hunt Pass steps (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`);
