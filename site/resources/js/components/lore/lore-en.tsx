import { Divider } from '@/components/decor';
import PageHero from '@/components/page-hero';

/** The Lore page in English (resources/js/pages/lore.tsx). The Portuguese version, lore-pt.tsx, has the same structure and ids. */
export default function LoreEn() {
	return (
		<>
			<PageHero
				className="history-hero"
				kicker="The History of the World"
				title="Lore of Aden"
				tagline="Before the castles and the clans, before the dragons slept beneath the earth, there was only a single sphere that held everything and nothing at all."
			/>

			<div className="lore-layout">
				<nav className="lore-toc" aria-label="Chapters">
					<p className="lore-toc-title">Chapters</p>
					<ol>
						<li><a href="#creation">The Shattered Sphere</a></li>
						<li><a href="#gods">Children of the Gods</a></li>
						<li><a href="#giants">The Fall of the Giants</a></li>
						<li><a href="#shilen">Shilen's Betrayal</a></li>
						<li><a href="#empire">The Empire of Elmoreden</a></li>
						<li><a href="#baium">The Tower of Insolence</a></li>
						<li><a href="#chaos">The Chaotic Era</a></li>
						<li><a href="#gracia">Beyond the Sea</a></li>
						<li><a href="#essence">A World Distilled</a></li>
						<li><a href="#frost">Frost and Wind</a></li>
						<li><a href="#saints">Saints and Seals</a></li>
						<li><a href="#wolves">Wolves and Roses</a></li>
						<li><a href="#samurai">The Samurai Crow</a></li>
					</ol>
					<a href="#chronicles" className="lore-toc-extra">Timeline of the Chronicles</a>
					<a href="#pantheon" className="lore-toc-extra">The Pantheon</a>
				</nav>

				<article className="lore-chapters">
					<section id="creation" className="chapter reveal">
						<p className="chapter-num">Chapter I</p>
						<h2 className="chapter-title text-gold">The Shattered Sphere</h2>
						<p>In the beginning there was no Aden and no Elmore, no Humans, Elves, Dwarves or Orcs. All that would ever exist lay together inside one sphere. Within it, two powers slowly became aware of themselves: a white light that took the form of a woman and named herself <strong>Einhasad</strong>, and a darkness that took the form of a man and named himself <strong>Gran Kain</strong>.</p>
						<p>Together they broke free of the sphere, and in breaking it they made the world. The shards that fell became the ground, the shards that rose became the sky, and the spirits that had slept inside became every beast and every growing thing.</p>
						<p>The greatest and wisest of those spirits were the <strong>Giants</strong>. They looked up to Einhasad and Gran Kain as parents and swore to keep faith with them forever, and the two gods, pleased, made them lords over all living creatures.</p>
					</section>

					<section id="gods" className="chapter reveal">
						<p className="chapter-num">Chapter II</p>
						<h2 className="chapter-title text-gold">Children of the Gods</h2>
						<p>Einhasad and Gran Kain also had children of their own. The first five were <strong>Shilen</strong>, goddess of water; <strong>Paagrio</strong>, god of fire; <strong>Maphr</strong>, goddess of earth; <strong>Sayha</strong>, god of wind; and <strong>Eva</strong>, whose songs accompanied the other gods as they worked. Each shaped a people in the image of their element:</p>
						<ul className="lore-list">
							<li><strong>The Elves</strong>, born of Shilen's water, wise and gifted in magic, served the Giants in politics and sorcery.</li>
							<li><strong>The Orcs</strong>, into whom Paagrio breathed fire, gained endless strength and will and became the Giants' warriors.</li>
							<li><strong>The Dwarves</strong>, shaped by Maphr, could build and calculate like no one else and ran the Giants' industry and trade.</li>
							<li><strong>The Arteias</strong>, children of Sayha's wind, wandered the world bringing news back to the Giants, until they vanished from it.</li>
						</ul>
						<p>Humans came last, and not from love. Gran Kain gathered what his children had thrown away (stagnant water, dying fire, barren earth and wild wind) and pieced together the first people. Weak and despised, they were handed to the Giants as servants. Yet of all the races, it was the one made from leftovers that would one day rule the continent.</p>
						<blockquote className="lore-quote">Since humans are made of the refuse of the gods, they are naturally restless. Give them no enemy and they will make one of their neighbour.</blockquote>
					</section>

					<section id="giants" className="chapter reveal">
						<p className="chapter-num">Chapter III</p>
						<h2 className="chapter-title text-gold">The Fall of the Giants</h2>
						<p>Over the ages the Giants built a civilization so advanced that it began to rival the gods. Their capital, <strong>Grandferion</strong>, was a city of wonders, and their scholars learned to bend nature, forge impossible weapons and, at last, to create life itself: the one power Einhasad kept for herself alone.</p>
						<p>In their laboratories they made the <strong>Kamael</strong>, a race of living weapons that divine power could barely touch. To Einhasad this was rebellion. She sent her angels against the Giants, and a war broke out that shook heaven and earth.</p>
						<p>When the Giants would not yield, Einhasad borrowed Gran Kain's <strong>Star Hammer</strong>, the Hammer of Despair, a weapon even its owner feared to use. It fell on Grandferion. Stars rained from the sky, cities vanished and the greatest civilization the world had known was gone in a single day. The survivors were hunted across the continent, and the Kamael were sealed away on the distant <strong>Isle of Souls</strong>.</p>
					</section>

					<section id="shilen" className="chapter reveal">
						<p className="chapter-num">Chapter IV</p>
						<h2 className="chapter-title text-gold">Shilen's Betrayal</h2>
						<p>Shilen did not stand with her mother. For her part in the age of the Giants she was cast down: her waters were given to her sister Eva, and Shilen became the goddess of <strong>death</strong>, ruling from a realm at the bottom of the abyss.</p>
						<p>Her Elves were torn apart. Those who stayed loyal to the light followed Eva and remained the Elves of the forests. Those who followed their fallen mother into the dark became the <strong>Dark Elves</strong>, masters of forbidden magic, the Children of Shilen.</p>
						<p>From the union of Shilen and Gran Kain came the great <strong>dragons</strong>, mightiest among them <strong>Antharas</strong> of the earth and <strong>Valakas</strong> of fire. When Shilen was defeated they went to ground: Antharas in the lair beneath Dragon Valley near Giran, Valakas in the flames of the Forge of the Gods. There they sleep and wait for her return. Shilen left behind her most beloved daughter, <strong>Lilith</strong>, cursed with endless life, to prepare the way.</p>
					</section>

					<section id="empire" className="chapter reveal">
						<p className="chapter-num">Chapter V</p>
						<h2 className="chapter-title text-gold">The Empire of Elmoreden</h2>
						<p>With the Giants gone, Elves, Orcs and Humans fought for the continent for generations. Humans, dying in their thousands, prayed for a god who would promise them something after death, and many turned to Shilen. When the wars finally burned out, it was Humankind that stood on the ashes.</p>
						<p>The emperor <strong>Shunaiman</strong> united the lands of Aden and Elmore into the <strong>Empire of Elmoreden</strong>. At his crowning a winged girl wreathed in holy fire descended from the sky: <strong>Anakim</strong>, envoy of Einhasad. Shunaiman declared Einhasad the only true faith, struck Gran Kain from the story of humanity's creation, and outlawed the worship of darkness.</p>
						<p>The Children of Shilen refused to kneel. Under Lilith they raised the <strong>Necropolis</strong> and the <strong>Catacombs</strong> and an elite army, the <strong>Lilim</strong>. Against them Anakim led the <strong>Nephilim</strong>, giant armored warriors of light. Their war never truly ended: it still echoes in the <strong>Seven Signs</strong>, where the Lords of Dawn and the Revolutionaries of Dusk fight over the seals.</p>
					</section>

					<section id="baium" className="chapter reveal">
						<p className="chapter-num">Chapter VI</p>
						<h2 className="chapter-title text-gold">The Tower of Insolence</h2>
						<p>Generations later, Emperor <strong>Baium</strong> sat on the throne of Elmoreden and wanted more than an empire. Whispered on by dark powers, he ordered a tower raised high enough to reach the gods themselves: the <strong>Tower of Insolence</strong>.</p>
						<p>The gods answered his arrogance by sealing him inside it, frozen for eternity at the top of his own monument, where he waits for anyone foolish enough to wake him. His heirs, his daughter Solina and his son <strong>Frintezza</strong>, fought over what was left. The empire split in two, into the <strong>Kingdom of Aden</strong> in the south and the <strong>Kingdom of Elmore</strong> in the north, and within a few decades Elmoreden was only a memory. Frintezza's restless spirit still haunts the Imperial Tomb.</p>
					</section>

					<section id="chaos" className="chapter reveal">
						<p className="chapter-num">Chapter VII</p>
						<h2 className="chapter-title text-gold">The Chaotic Era</h2>
						<p>The kings of Aden kept their crowns but lost their grip on the land. The turning point came at the <strong>Battle for Giran Castle</strong>, where an adventurer of common birth took a castle and, by the old rules of siege, became its rightful lord. From that day on, anyone with enough sword-arms behind them could rule.</p>
						<p>Adventurers bound by friendship or blood formed <strong>clans</strong>, clans formed <strong>alliances</strong>, and the seven castles of Aden (Gludio, Dion, Giran, Oren, Aden, Innadril and Goddard, later joined by Rune and Schuttgart) changed hands in endless sieges. The bravest learned the secrets of the Giants, rose as <strong>Noblesse</strong> and fought in the <strong>Grand Olympiad</strong> for the right to be called <strong>Hero</strong>.</p>
					</section>

					<section id="gracia" className="chapter reveal">
						<p className="chapter-num">Chapter VIII</p>
						<h2 className="chapter-title text-gold">Beyond the Sea</h2>
						<p>The past would not stay buried. The <strong>Kamael</strong>, the Giants' living weapons, returned from the Isle of Souls, called by Eva to defend Aden rather than destroy it. But tipping the balance toward the light came at a price.</p>
						<p>On the cursed island of <strong>Hellbound</strong>, demons ruled over enslaved natives until adventurers broke their hold. Across the sea, the forgotten continent of <strong>Gracia</strong> was found again, and with it the <strong>Seeds</strong>, monstrous growths spreading from the land. In the far north beyond Schuttgart, <strong>Freya</strong>, the Ice Queen, woke in her frozen castle, and in Dragon Valley the earth trembled where Antharas slept.</p>
						<p>That was the age of <strong>High Five</strong>, the last great chapter of the old chronicle. It was not the end of the story.</p>
					</section>

					<section id="essence" className="chapter reveal">
						<p className="chapter-num">Chapter IX</p>
						<h2 className="chapter-title text-gold">A World Distilled</h2>
						<p>With <strong>Lineage II Essence</strong> the story returns to the continent of Aden, its old towns and battlefields brought back and sharpened. Adventurers walk under <strong>Sayha's Grace</strong>, the blessing of the wind god that speeds their growth, and new paths open even to the oldest races: Humans, Elves and Dark Elves can now rise as <strong>Death Knights</strong>, warriors who answer death itself.</p>
						<p>In the age called <strong>Dwelling of Spirits</strong>, new lands were opened to the hunt: the Dwelling of Spirits itself, the Bee Hive, and the <strong>Sel Mahum Base</strong>, burning with fire near the Abandoned Camp. Clans gathered for the first time against <strong>Frintezza</strong> in a raid of their own, and the lair beneath Dragon Valley opened to all of Aden: <strong>Antharas</strong> no longer waited for a chosen few.</p>
					</section>

					<section id="frost" className="chapter reveal">
						<p className="chapter-num">Chapter X</p>
						<h2 className="chapter-title text-gold">Frost and Wind</h2>
						<p>Then the cold came. In the age of the <strong>Frost Lord</strong>, a frozen fortress rose: <strong>Frost Lord's Castle</strong>, open only to the strongest, where the world boss <strong>Glakias</strong> commands the ice. On Primeval Isle the land changed again, and adventurers learned that its creatures guarded something other than gold.</p>
						<p>The wars of the clans took a new shape. Only two castles are fought over now: <strong>Giran</strong> and <strong>Goddard</strong>, and when a siege ends the <strong>Victory Herald</strong> comes to honour the clan that holds the throne. Beside them, the <strong>Orc Fortress</strong> became a battlefield of its own.</p>
						<p>And a new people came to Aden: the <strong>Sylphs</strong>, swift and sure-eyed, who fight with firearms and the power of the elemental spirits.</p>
					</section>

					<section id="saints" className="chapter reveal">
						<p className="chapter-num">Chapter XI</p>
						<h2 className="chapter-title text-gold">Saints and Seals</h2>
						<p>In the age of the <strong>Crusader</strong>, the Hierophants learned to take the form of a crusader in battle, and the bards of Aden found new songs and dances: Amadeus and Flamenco. Old terrors returned stronger than before. <strong>Immortal Baium</strong> stirred, the <strong>Temple of Valakas</strong> opened its gates, and at nine each evening <strong>Gorde</strong> walks Gorde Canyon in the lands of Goddard.</p>
						<p>The age of the <strong>Seven Signs</strong> brought back the old war of Dawn and Dusk in the <strong>Seven Signs Dungeons</strong>, while fairies spread across invaded lands. Then came the <strong>Guardians</strong>: the <strong>Seal of Shillien</strong> broke open with chaotic bosses roaming inside, and <strong>Fafurion's Underwater Canyon</strong> rose and fell with the tide. At the top of the Celestial Tower, Celestial Emperor <strong>Ferion</strong> waits for those strong enough to climb.</p>
					</section>

					<section id="wolves" className="chapter reveal">
						<p className="chapter-num">Chapter XII</p>
						<h2 className="chapter-title text-gold">Wolves and Roses</h2>
						<p>With the <strong>Warg</strong> came a new kind of hunter: Human men who fight with bare fists and sigils, and who, once they have proven themselves, take the shape of a <strong>wolf</strong>. Their kin gather around the Warg Settlement, where the <strong>Wolfmen Camp</strong> waits.</p>
						<p>With <strong>Rose Vain</strong>, the Dark Elves gave Aden the <strong>Blood Rose</strong>, a dagger fighter whose magic blooms like crimson flowers. The power of the great dragons was forged into <strong>Dragon Weapons</strong> of Valakas, Lindvior, Fafurion and Antharas. In the <strong>Source of Evil</strong>, adventurers fight through three sealed rooms to face one of its masters: Shatan, Belpher, Leviathan or Beelzebub. And Aden's Royal Cemetery opened its gates to the hunt.</p>
					</section>

					<section id="samurai" className="chapter reveal">
						<p className="chapter-num">Chapter XIII</p>
						<h2 className="chapter-title text-gold">The Samurai Crow</h2>
						<p>The Kamael were made as weapons. Now one of them chooses his own blade. In the age of the <strong>Samurai Crow</strong>, a new path opens to Kamael men: the <strong>Samurai</strong>, a melee fighter who carries no shield and fights with the <strong>katana</strong>. He rises as <strong>Ashigaru</strong>, then <strong>Hatamoto</strong>, then <strong>Ronin</strong>, until he is a Samurai at last.</p>
						<p>He strikes with Single Flash, Pursuit and Maneuver, and calls on the powers of <strong>Wind</strong>, <strong>Forest</strong> and <strong>Fire</strong> to strengthen himself. Beside him, the Titans of the Orcs grow fiercer with Hyper Rush, the bards answer with Cantabile and Vivace, and a new Dragon Weapon, the <strong>Staff</strong>, joins the dragons' arsenal.</p>
						<p>This is where the story of Aden stands today, and where this server stands with it. The dragons are awake, two thrones wait for their lords, and a new blade has been drawn. The rest of the story is yours to write.</p>
						<div className="chapter-cta">
							<a href="/#join" className="btn btn-primary">Start Your Journey</a>
							<a href="/#races" className="btn btn-outline">Choose Your Race</a>
						</div>
					</section>
				</article>
			</div>

			<section id="chronicles" className="chronicles">
				<div className="container">
					<div className="section-head">
						<p className="reveal kicker">From Prelude to Samurai Crow</p>
						<h2 className="reveal section-title text-gold">The Chronicles</h2>
						<Divider />
					</div>
					<ol className="timeline">
						<li className="reveal"><span className="timeline-saga">The Chaotic Chronicle</span><h3>Prelude</h3><p>The world opens. Humans, Elves, Dark Elves, Orcs and Dwarves set out from their villages.</p></li>
						<li className="reveal"><h3>Harbingers of War</h3><p>Chronicle 1. Castle sieges begin with the battle for Giran.</p></li>
						<li className="reveal"><h3>Age of Splendor</h3><p>Chronicle 2. Clan halls and new lands across Aden.</p></li>
						<li className="reveal"><h3>Rise of Darkness</h3><p>Chronicle 3. The Seven Signs, Lilith, Anakim and the Necropolis.</p></li>
						<li className="reveal"><h3>Scions of Destiny</h3><p>Chronicle 4. Subclasses, Noblesse and the heirs of the Giants.</p></li>
						<li className="reveal"><h3>Oath of Blood</h3><p>Chronicle 5. Clans, cabals, Heroes and the Grand Olympiad.</p></li>
						<li className="reveal"><span className="timeline-saga">The Chaotic Throne</span><h3>Interlude</h3><p>Rune and Schuttgart, territory wars and the age of clans.</p></li>
						<li className="reveal"><h3>The Kamael</h3><p>The Giants' living weapons return from the Isle of Souls.</p></li>
						<li className="reveal"><h3>Hellbound</h3><p>The cursed island and its demon masters.</p></li>
						<li className="reveal"><h3>Gracia</h3><p>Parts 1 and 2, Final and Epilogue. The lost continent and its Seeds.</p></li>
						<li className="reveal"><h3>Freya</h3><p>The Ice Queen wakes in the frozen north.</p></li>
						<li className="reveal"><h3>High Five</h3><p>The last chapter of the old chronicle. The dragons stir and the Seeds still burn.</p></li>
						<li className="reveal"><span className="timeline-saga">Lineage II Essence</span><h3>Essence</h3><p>Aden returns, sharpened. Sayha's Grace and the Death Knights.</p></li>
						<li className="reveal"><h3>Dwelling of Spirits</h3><p>Sel Mahum Base, the Frintezza clan raid and Antharas' Lair open to all.</p></li>
						<li className="reveal"><h3>Frost Lord</h3><p>Frost Lord's Castle and Glakias. The Sylphs arrive with firearms.</p></li>
						<li className="reveal"><h3>Crusader</h3><p>The Hierophant's crusader form, Immortal Baium and the Temple of Valakas.</p></li>
						<li className="reveal"><h3>Seven Signs</h3><p>The Seven Signs Dungeons and the fairy-invaded lands.</p></li>
						<li className="reveal"><h3>Guardians</h3><p>The Seal of Shillien and Fafurion's Underwater Canyon.</p></li>
						<li className="reveal"><h3>Warg</h3><p>Human hunters who fight as wolves.</p></li>
						<li className="reveal"><h3>Rose Vain</h3><p>The Blood Rose, Dragon Weapons and the Source of Evil.</p></li>
						<li className="reveal is-current"><h3>Samurai Crow</h3><p>Where this server stands. The Kamael Samurai takes up the katana.</p></li>
					</ol>
				</div>
			</section>

			<section id="pantheon" className="pantheon">
				<div className="container">
					<div className="section-head">
						<p className="reveal kicker">Gods of Aden</p>
						<h2 className="reveal section-title text-gold">The Pantheon</h2>
						<Divider />
					</div>
					<div className="pantheon-grid">
						<div className="reveal god"><p className="god-domain">Light &amp; Creation</p><h3>Einhasad</h3><p>Mother of the gods, worshipped by Humankind and the Empire.</p></div>
						<div className="reveal god"><p className="god-domain">Darkness &amp; Destruction</p><h3>Gran Kain</h3><p>Father of the gods and maker of Humans, whom he then abandoned.</p></div>
						<div className="reveal god"><p className="god-domain">Water, then Death</p><h3>Shilen</h3><p>Mother of the Elves, fallen to the abyss. Worshipped by the Dark Elves.</p></div>
						<div className="reveal god"><p className="god-domain">Water &amp; Song</p><h3>Eva</h3><p>Took Shilen's waters. Goddess of the Elves of the forest.</p></div>
						<div className="reveal god"><p className="god-domain">Fire</p><h3>Paagrio</h3><p>Breathed fire into the Orcs, whose fallen join his flames.</p></div>
						<div className="reveal god"><p className="god-domain">Earth</p><h3>Maphr</h3><p>Maker of the Dwarves, patron of craft and trade.</p></div>
						<div className="reveal god"><p className="god-domain">Wind</p><h3>Sayha</h3><p>Father of the wandering Arteias. In Essence, Sayha's Grace speeds every adventurer.</p></div>
					</div>
				</div>
			</section>
		</>
	);
}
