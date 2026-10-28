import { Form, usePoll } from '@inertiajs/react';
import { useEffect } from 'react';
import { span } from '@/components/happening';
import { useNow } from '@/hooks/use-page-effects';
import { languageTag, pick, useLocale, useT, type Localized } from '@/i18n';
import type { GiftBoxStatus } from '@/types';

const DELIVERY: Record<NonNullable<GiftBoxStatus['claim']>['status'], Localized> = {
    pending: { en: 'On its way to your in-game mailbox…', pt: 'A caminho da sua caixa de correio no jogo…' },
    processing: { en: 'On its way to your in-game mailbox…', pt: 'A caminho da sua caixa de correio no jogo…' },
    done: {
        en: 'Delivered! Open your mailbox in game (the envelope icon) and take the attachments within 15 days.',
        pt: 'Entregue! Abra sua caixa de correio no jogo (o ícone de envelope) e retire os anexos em até 15 dias.',
    },
    failed: { en: 'The delivery failed. Contact the staff and we will send it again.', pt: 'A entrega falhou. Fale com a equipe e enviaremos de novo.' },
};

/** A gift chest, drawn in the site's gold line style. */
function Chest() {
    return (
        <svg viewBox="0 0 64 64" aria-hidden="true">
            <path d="M8 28h48v26a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2z" />
            <path d="M6 20h52v8H6z" />
            <path d="M28 20v36m8-36v36" />
            <path d="M32 20c-4-9-16-12-16-5 0 4 8 5 16 5zm0 0c4-9 16-12 16-5 0 4-8 5-16 5z" />
        </svg>
    );
}

function Contents({ contents }: { contents: GiftBoxStatus['contents'] }) {
    const locale = useLocale();
    const t = useT();
    const fmt = (n: number) => n.toLocaleString(languageTag(locale));

    return (
        <details className="gift-contents">
            <summary>{t('What’s inside', 'O que tem dentro')}</summary>
            <div className="gift-contents-body">
                <h3>{t('Every box', 'Toda caixa')}</h3>
                <ul>
                    {contents.guaranteed.map((item) => (
                        <li key={item.name}>
                            {fmt(item.count)} × {item.name}
                        </li>
                    ))}
                </ul>
                <h3>{t('Plus one bonus', 'Mais um bônus')}</h3>
                <table className="gift-odds">
                    <tbody>
                        {contents.bonus.map((item) => (
                            <tr key={`${item.name}-${item.count}`}>
                                <td>
                                    {fmt(item.count)} × {item.name}
                                </td>
                                <td className="num">{item.chance}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <p className="gift-note">
                    {t(
                        '“Your grade” scrolls match the receiving character’s level: D from 20, C from 40, B from 52, A from 61, S from 76.',
                        'Os pergaminhos “do seu grau” seguem o nível do personagem que recebe: D a partir do 20, C do 40, B do 52, A do 61, S do 76.',
                    )}
                </p>
            </div>
        </details>
    );
}

/**
 * The weekly gift box: pick a character, open the box, and it arrives by in-game mail. While the mail is on its
 * way, the box polls for the delivery status.
 */
export function GiftBoxPanel({ gift }: { gift: GiftBoxStatus }) {
    const now = useNow(30_000);
    const locale = useLocale();
    const t = useT();
    const fmt = (n: number) => n.toLocaleString(languageTag(locale));
    const claim = gift.claim;
    const travelling = claim?.status === 'pending' || claim?.status === 'processing';
    const { start, stop } = usePoll(4_000, { only: ['gift'] }, { autoStart: false });
    // Freshly opened: reveal the items one by one.
    const fresh = claim ? now - Date.parse(claim.claimedAt) < 120_000 : false;

    useEffect(() => {
        if (travelling) {
            start();
        } else {
            stop();
        }

        return stop;
    }, [travelling, start, stop]);

    return (
        <section className={`gift-box${claim ? ' is-claimed' : ' is-ready'}`} aria-labelledby="gift-box-title">
            <div className="gift-box-art">
                <Chest />
            </div>
            <div className="gift-box-body">
                <p className="gift-box-kicker">{t('Every week, on the house', 'Toda semana, por conta da casa')}</p>
                <h2 id="gift-box-title" className="gift-box-title text-gold">
                    {t('Weekly Gift Box', 'Caixa de Presente Semanal')}
                </h2>

                {claim ? (
                    <>
                        <p className="gift-box-text">
                            {t(
                                <>Opened for <strong>{claim.characterName}</strong>. This week’s box held:</>,
                                <>Aberta para <strong>{claim.characterName}</strong>. A caixa desta semana trazia:</>,
                            )}
                        </p>
                        <ul className={`gift-items${fresh ? ' is-fresh' : ''}`}>
                            {claim.items.map((item, i) => (
                                <li key={`${item.id}-${i}`} className={item.bonus ? 'is-bonus' : undefined} style={{ animationDelay: `${i * 140}ms` }}>
                                    <span className="gift-item-count">{fmt(item.count)} ×</span> {item.name}
                                    {item.bonus ? <span className="gift-bonus-tag">{t('Bonus', 'Bônus')}</span> : null}
                                </li>
                            ))}
                        </ul>
                        <p className={`gift-delivery is-${claim.status}`} role="status">
                            {pick(locale, DELIVERY[claim.status])}
                        </p>
                        <p className="gift-next">
                            {t('Next box in', 'Próxima caixa em')} {span(Date.parse(gift.nextAt) - now)}
                        </p>
                    </>
                ) : !gift.enabled ? (
                    <p className="gift-box-text">{t('The gift box is closed for now. Check back soon.', 'A caixa de presente está fechada por enquanto. Volte em breve.')}</p>
                ) : gift.eligible.length === 0 ? (
                    <p className="gift-box-text">
                        {t(
                            `Reach level ${gift.minLevel} with any character to unlock your weekly gift box.`,
                            `Chegue ao nível ${gift.minLevel} com qualquer personagem para liberar sua caixa de presente semanal.`,
                        )}
                    </p>
                ) : (
                    <>
                        <p className="gift-box-text">
                            {t(
                                'Your box for this week is ready. Choose who receives it: it arrives by in-game mail.',
                                'Sua caixa desta semana está pronta. Escolha quem vai recebê-la: ela chega pelo correio do jogo.',
                            )}
                        </p>
                        <Form action="/account/gift" method="post" className="gift-form" options={{ preserveScroll: true }}>
                            {({ errors, processing }) => (
                                <>
                                    <label className="field">
                                        <span className="field-label">{t('Send it to', 'Enviar para')}</span>
                                        <select name="character_id" defaultValue={gift.eligible[0].id}>
                                            {gift.eligible.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name} (Lv {c.level})
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <button className="btn btn-primary" type="submit" disabled={processing}>
                                        {t('Open the Gift Box', 'Abrir a Caixa de Presente')}
                                    </button>
                                    {errors.character_id ? (
                                        <p className="form-error" role="alert">
                                            {errors.character_id}
                                        </p>
                                    ) : null}
                                </>
                            )}
                        </Form>
                        <p className="gift-next">
                            {t('One box per account each week. A new one arrives every Monday.', 'Uma caixa por conta a cada semana. Uma nova chega toda segunda-feira.')}
                        </p>
                    </>
                )}

                <Contents contents={gift.contents} />
            </div>
        </section>
    );
}
