import { Link } from '@inertiajs/react';
import { useState } from 'react';
import { PackageCatalog } from '@/components/class-packages';
import { Checkout, type CartItem } from '@/components/checkout';
import { Divider } from '@/components/decor';
import { PassArt, passEnds } from '@/components/kage-pass';
import PageHero from '@/components/page-hero';
import { languageTag, pick, useLocale, useT } from '@/i18n';
import type { PackageOffer, PassOffer, StoreCheckout } from '@/types';

type Reward = { name: string; count: number };

type Props = {
    pass: PassOffer;
    packages: PackageOffer;
    gift: { guaranteed: Reward[]; bonus: (Reward & { chance: number })[]; minLevel: number };
    hunt: {
        enabled: boolean;
        pointsForStep: number;
        premium: Reward;
        resetDay: number;
        steps: number;
        firstSteps: { free: Reward; premium: Reward }[];
    };
    lcoin: { welcome: number; giftBox: number };
    /** Signed in: the characters that can pay and what this season already holds; null for guests. */
    checkout: StoreCheckout | null;
};

/** The player area's Orders tab: the weekly gift box and the history of everything bought here. */
const ORDERS_TAB = '/account/orders';

/**
 * The store, explained: where L-Coin comes from, the weekly gift box, the Kage Pass (website), the in-game Hunt Pass
 * and the class packages. Every number comes from the server: the gift box template, the Kage Pass and package
 * config, HuntPass.ini and the datapack's HuntPass.xml. Signed-in players buy the Kage Pass and packages here (Buy opens
 * the checkout); guests are asked to sign in. The gift box is opened in the Orders tab.
 */
export default function Treasury({ pass, packages, gift, hunt, lcoin, checkout }: Props) {
    const locale = useLocale();
    const t = useT();
    const fmt = (n: number) => n.toLocaleString(languageTag(locale));
    const price = `${fmt(pass.price.count)} ${pass.price.name}`;
    const [cart, setCart] = useState<CartItem | null>(null);
    const signIn = (
        <Link href="/account" className="btn btn-outline btn-small">
            {t('Sign in to buy', 'Entre para comprar')}
        </Link>
    );
    const bought = <p className="pkg-bought">{t('Bought this season', 'Comprado nesta temporada')}</p>;

    const buyPass = () =>
        setCart({
            title: pass.name,
            subtitle: t('Season pass', 'Passe da temporada'),
            price: pass.price.count,
            currency: pass.price.name,
            items: pass.rewards.map((r) => ({ name: r.name, count: r.count, enchant: 0 })),
            action: '/account/pass',
            fields: {},
        });

    const packageAction = (tierKey: string, archetypeKey: string) => {
        if (!packages.enabled) {
            return null;
        }
        if (!checkout) {
            return signIn;
        }
        if (checkout.packagesBought.includes(`${tierKey}:${archetypeKey}`)) {
            return bought;
        }

        const tier = packages.tiers.find((x) => x.key === tierKey)!;
        const archetype = packages.archetypes.find((a) => a.key === archetypeKey)!;

        return (
            <button
                type="button"
                className="btn btn-primary btn-small"
                onClick={() =>
                    setCart({
                        title: `${pick(locale, archetype.name)} · ${pick(locale, tier.name)}`,
                        subtitle: `${t('Class package', 'Pacote de classe')} · ${pick(locale, archetype.role)}`,
                        price: tier.price,
                        currency: packages.currency,
                        items: archetype.contents[tierKey] ?? [],
                        action: '/account/package',
                        fields: { tier: tierKey, archetype: archetypeKey },
                        archetype: archetypeKey,
                    })
                }
            >
                {t('Buy', 'Comprar')}
            </button>
        );
    };
    const sections = [
        { href: '#lcoin', label: 'L-Coin' },
        { href: '#gift-box', label: t('Gift Box', 'Caixa de Presente') },
        { href: '#kage-pass', label: 'Kage Pass' },
        { href: '#hunt-pass', label: 'Hunt Pass' },
        { href: '#packages', label: t('Class Packages', 'Pacotes de Classe') },
    ];

    return (
        <>
            <PageHero
                className="treasury-hero"
                video={{ src: '/assets/video/treasury.mp4', poster: '/assets/packages-chest.webp' }}
                kicker={t('Gifts, passes & packages', 'Presentes, passes e pacotes')}
                title={t('The Treasury', 'O Tesouro')}
                tagline={t(
                    'A gift from Einhasad every week, the pacts of the season and arms forged for every calling of Aden.',
                    'Um presente de Einhasad toda semana, os pactos da temporada e armas forjadas para cada vocação de Aden.',
                )}
            >
                <nav className="store-nav" aria-label={t('Sections', 'Seções')}>
                    {sections.map((s) => (
                        <a key={s.href} href={s.href}>
                            {s.label}
                        </a>
                    ))}
                </nav>
            </PageHero>

            <section className="about-section" id="lcoin">
                <div className="container">
                    <div className="section-head">
                        <p className="reveal kicker">{t('The currency of passes and packages', 'A moeda dos passes e pacotes')}</p>
                        <h2 className="reveal section-title text-gold">L-Coin</h2>
                        <Divider />
                        <p className="reveal lead">
                            {t(
                                'The Kage Pass and the class packages are paid with L-Coin from a character’s bag (not the warehouse). The site shows the last save: every 5 minutes while you play, and when you log out.',
                                'O Kage Pass e os pacotes de classe são pagos com L-Coin da bolsa de um personagem (não do armazém). O site mostra o último salvamento: a cada 5 minutos enquanto você joga, e ao sair.',
                            )}
                        </p>
                    </div>
                    <div className="features-grid">
                        <div className="reveal feature">
                            <span className="feature-num">01</span>
                            <h3>{t('Welcome gift', 'Presente de boas-vindas')}</h3>
                            <p>
                                {t(
                                    `Every new character starts with ${fmt(lcoin.welcome)} L-Coin in the bag.`,
                                    `Todo personagem novo começa com ${fmt(lcoin.welcome)} L-Coin na bolsa.`,
                                )}
                            </p>
                        </div>
                        {lcoin.giftBox ? (
                            <div className="reveal feature">
                                <span className="feature-num">02</span>
                                <h3>{t('Weekly gift box', 'Caixa de presente semanal')}</h3>
                                <p>
                                    {t(
                                        `Every box brings ${fmt(lcoin.giftBox)} L-Coin more.`,
                                        `Toda caixa traz mais ${fmt(lcoin.giftBox)} L-Coin.`,
                                    )}
                                </p>
                            </div>
                        ) : null}
                        <div className="reveal feature">
                            <span className="feature-num">{lcoin.giftBox ? '03' : '02'}</span>
                            <h3>{t('What it buys', 'O que ela compra')}</h3>
                            <p>
                                {t(
                                    `The Kage Pass (${price}), the class packages, Hunt Pass Premium (${fmt(hunt.premium.count)} ${hunt.premium.name}) and the L-Coin shop in game.`,
                                    `O Kage Pass (${price}), os pacotes de classe, o Hunt Pass Premium (${fmt(hunt.premium.count)} ${hunt.premium.name}) e a loja de L-Coin no jogo.`,
                                )}
                            </p>
                        </div>
                    </div>
                    {checkout ? (
                        <p className="store-more">
                            <Link href={ORDERS_TAB} className="text-link">
                                {t('See your orders', 'Ver seus pedidos')}
                            </Link>
                        </p>
                    ) : null}
                </div>
            </section>

            <section className="about-section" id="gift-box">
                <div className="container">
                    <div className="section-head">
                        <p className="reveal kicker">{t('Every week, on the house', 'Toda semana, por conta da casa')}</p>
                        <h2 className="reveal section-title text-gold">{t('Weekly Gift Box', 'Caixa de Presente Semanal')}</h2>
                        <Divider />
                        <p className="reveal lead">
                            {t(
                                `Free, once per account every week, for a character of level ${gift.minLevel} or higher. It arrives by in-game mail.`,
                                `Grátis, uma vez por conta toda semana, para um personagem de nível ${gift.minLevel} ou mais. Chega pelo correio do jogo.`,
                            )}
                        </p>
                    </div>
                    <div className="store-gift">
                        <div>
                            <h3 className="about-subtitle">{t('Every box', 'Toda caixa')}</h3>
                            <ul className="gift-items">
                                {gift.guaranteed.map((item) => (
                                    <li key={item.name}>
                                        <span className="gift-item-count">{fmt(item.count)} ×</span> {item.name}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        {gift.bonus.length ? (
                            <div>
                                <h3 className="about-subtitle">{t('Plus one bonus', 'Mais um bônus')}</h3>
                                <ul className="gift-items">
                                    {gift.bonus.map((item) => (
                                        <li key={item.name}>
                                            <span className="gift-item-count">{fmt(item.count)} ×</span> {item.name}
                                            <span className="store-chance">{item.chance}%</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : null}
                    </div>
                    <div className="reveal actions passes-actions">
                        <a href={`${ORDERS_TAB}#gift-box`} className="btn btn-primary">
                            {t('Open your gift box', 'Abrir sua caixa de presente')}
                        </a>
                    </div>
                </div>
            </section>

            <section className="about-section" id="kage-pass">
                <span id="passes" className="store-anchor"></span>
                <div className="container">
                    <div className="section-head">
                        <p className="reveal kicker">
                            {t('Claim here', 'Resgate aqui')} · {pass.enabled ? `${t('until', 'até')} ${passEnds(pass.ends, languageTag(locale))}` : t('closed', 'fechado')}
                        </p>
                        <h2 className="reveal section-title text-gold">{pass.name}</h2>
                        <Divider />
                        <p className="reveal lead">
                            {t(
                                `A season bundle for ${price}, once per account each season. Buy it here and the rewards arrive by in-game mail.`,
                                `Um pacote da temporada por ${price}, uma vez por conta a cada temporada. Compre aqui e as recompensas chegam pelo correio do jogo.`,
                            )}
                        </p>
                    </div>

                    <div className="passes-art reveal">
                        <PassArt />
                    </div>
                    <h3 className="about-subtitle">{t('Rewards', 'Recompensas')}</h3>
                    <ul className="gift-items">
                        {pass.rewards.map((item) => (
                            <li key={item.name}>
                                <span className="gift-item-count">{fmt(item.count)} ×</span> {item.name}
                            </li>
                        ))}
                    </ul>
                    {pass.enabled ? (
                        <div className="reveal actions passes-actions">
                            {!checkout ? (
                                signIn
                            ) : checkout.passClaimed ? (
                                bought
                            ) : (
                                <button type="button" className="btn btn-primary" onClick={buyPass}>
                                    {t(`Buy for ${price}`, `Comprar por ${price}`)}
                                </button>
                            )}
                        </div>
                    ) : null}
                </div>
            </section>

            <section className="about-section" id="hunt-pass">
                <div className="container">
                    <div className="section-head">
                        <p className="reveal kicker">{t('In game', 'No jogo')}</p>
                        <h2 className="reveal section-title text-gold">Hunt Pass</h2>
                        <Divider />
                        <p className="reveal lead">
                            {t(
                                'Essence’s own season pass. Every monster you defeat moves it forward, and every step pays a reward.',
                                'O passe de temporada do próprio Essence. Cada monstro derrotado faz ele avançar, e cada etapa paga uma recompensa.',
                            )}
                        </p>
                    </div>

                    {!hunt.enabled ? <p className="about-empty">{t('The Hunt Pass is off on this server for now.', 'O Hunt Pass está desligado neste servidor por enquanto.')}</p> : null}

                    <div className="features-grid">
                        <div className="reveal feature">
                            <span className="feature-num">01</span>
                            <h3>{t('Points', 'Pontos')}</h3>
                            <p>
                                {t(
                                    'Each monster you defeat gives 1 point, and 2 inside timed hunting zones. Party kills count for the members too.',
                                    'Cada monstro derrotado dá 1 ponto, e 2 dentro das zonas de caça com tempo. Abates em grupo também contam para os membros.',
                                )}
                            </p>
                        </div>
                        <div className="reveal feature">
                            <span className="feature-num">02</span>
                            <h3>{t('Steps', 'Etapas')}</h3>
                            <p>
                                {t(
                                    `${fmt(hunt.pointsForStep)} points complete a step. There are ${fmt(hunt.steps)} steps, each with a free reward.`,
                                    `${fmt(hunt.pointsForStep)} pontos completam uma etapa. São ${fmt(hunt.steps)} etapas, cada uma com uma recompensa grátis.`,
                                )}
                            </p>
                        </div>
                        <div className="reveal feature">
                            <span className="feature-num">03</span>
                            <h3>Premium</h3>
                            <p>
                                {t(
                                    `Unlock it in the Hunt Pass window for ${fmt(hunt.premium.count)} ${hunt.premium.name}: every step then also pays a Premium reward, including the steps you already completed.`,
                                    `Desbloqueie na janela do Hunt Pass por ${fmt(hunt.premium.count)} ${hunt.premium.name}: toda etapa passa a pagar também uma recompensa Premium, inclusive as que você já completou.`,
                                )}
                            </p>
                        </div>
                        <div className="reveal feature">
                            <span className="feature-num">04</span>
                            <h3>{t('Season', 'Temporada')}</h3>
                            <p>
                                {t(
                                    `The pass starts over on day ${hunt.resetDay} of every month. Claim your rewards before then.`,
                                    `O passe recomeça no dia ${hunt.resetDay} de cada mês. Resgate suas recompensas antes disso.`,
                                )}
                            </p>
                        </div>
                    </div>

                    {hunt.firstSteps.length ? (
                        <>
                            <h3 className="about-subtitle">{t('The first steps', 'As primeiras etapas')}</h3>
                            <div className="items-table-wrap">
                                <table className="items-table">
                                    <thead>
                                        <tr>
                                            <th className="num">{t('Step', 'Etapa')}</th>
                                            <th>{t('Free', 'Grátis')}</th>
                                            <th>Premium</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {hunt.firstSteps.map((step, i) => (
                                            <tr key={i}>
                                                <td className="num">{i + 1}</td>
                                                <td>
                                                    {fmt(step.free.count)} × {step.free.name}
                                                </td>
                                                <td>
                                                    {fmt(step.premium.count)} × {step.premium.name}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p className="about-footnote">
                                {t(
                                    `Open the Hunt Pass window in the game to see all ${fmt(hunt.steps)} steps and collect your rewards.`,
                                    `Abra a janela do Hunt Pass no jogo para ver todas as ${fmt(hunt.steps)} etapas e retirar suas recompensas.`,
                                )}
                            </p>
                        </>
                    ) : null}
                </div>
            </section>

            <section className="about-section" id="packages">
                <div className="container">
                    <div className="section-head">
                        <p className="reveal kicker">{t('Full gear for your class', 'Equipamento completo para sua classe')}</p>
                        <h2 className="reveal section-title text-gold">{t('Class Packages', 'Pacotes de Classe')}</h2>
                        <Divider />
                        <p className="reveal lead">
                            {t(
                                'Weapon, armor and jewelry for one archetype, in three tiers. Each package once per account this season; the items are sealed (they can’t be traded) and arrive in two mails.',
                                'Arma, armadura e joias para um arquétipo, em três níveis. Cada pacote uma vez por conta nesta temporada; os itens são selados (não podem ser negociados) e chegam em dois correios.',
                            )}
                        </p>
                    </div>
                    {packages.enabled ? null : <p className="about-empty">{t('Class packages are closed for now.', 'Os pacotes de classe estão fechados por enquanto.')}</p>}
                    <PackageCatalog packages={packages} archetype={checkout?.characters[0]?.archetype} action={packageAction} />
                </div>
            </section>


            {cart && checkout ? <Checkout cart={cart} characters={checkout.characters} onClose={() => setCart(null)} /> : null}
        </>
    );
}
