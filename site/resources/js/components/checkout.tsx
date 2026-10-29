import { Form } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { PackageContents } from '@/components/class-packages';
import { languageTag, useLocale, useT } from '@/i18n';
import type { CheckoutCharacter, PackageItem } from '@/types';

export type CartItem = {
    title: string;
    subtitle?: string;
    price: number;
    currency: string;
    items: PackageItem[];
    /** Where the order is posted (/account/pass, /account/package) and what goes with the character. */
    action: string;
    fields: Record<string, string>;
    /** The archetype the order is for, to put matching characters first. */
    archetype?: string;
};

/**
 * The store's checkout: what is being bought and its price, the character whose bag pays (only those with enough
 * L-Coin can be picked) and who receives the items by mail, then Buy. On success the server shows the order in the
 * player area's Orders tab and emails a confirmation; on an error (e.g. the L-Coin is gone) it stays open with it.
 */
export function Checkout({ cart, characters, onClose }: { cart: CartItem; characters: CheckoutCharacter[]; onClose: () => void }) {
    const locale = useLocale();
    const t = useT();
    const fmt = (n: number) => n.toLocaleString(languageTag(locale));
    const dialog = useRef<HTMLDialogElement>(null);
    // Characters suggested for this archetype first, then by level (the server's order).
    const sorted = [...characters].sort((a, b) => Number(b.archetype === cart.archetype) - Number(a.archetype === cart.archetype));
    const payable = sorted.filter((c) => c.coins >= cart.price);
    const [characterId, setCharacterId] = useState<number | undefined>(payable[0]?.id);

    useEffect(() => {
        dialog.current?.showModal();
    }, []);

    return (
        <dialog ref={dialog} className="checkout" aria-labelledby="checkout-title" onClose={onClose} onClick={(e) => e.target === dialog.current && dialog.current?.close()}>
            <div className="checkout-body">
                <header className="checkout-head">
                    <p className="checkout-kicker">{t('Checkout', 'Finalizar compra')}</p>
                    <h2 id="checkout-title" className="checkout-title text-gold">
                        {cart.title}
                    </h2>
                    {cart.subtitle ? <p className="checkout-subtitle">{cart.subtitle}</p> : null}
                    <button type="button" className="checkout-close" aria-label={t('Close', 'Fechar')} onClick={() => dialog.current?.close()}>
                        ×
                    </button>
                </header>

                <PackageContents items={cart.items} links={false} />

                <Form action={cart.action} method="post" className="checkout-form" options={{ preserveScroll: true }}>
                    {({ errors, processing }) => (
                        <>
                            {Object.entries(cart.fields).map(([name, value]) => (
                                <input key={name} type="hidden" name={name} value={value} />
                            ))}
                            <fieldset className="checkout-characters">
                                <legend className="field-label">{t('Pay with and send to', 'Pagar com e enviar para')}</legend>
                                {sorted.map((c) => {
                                    const short = c.coins < cart.price;

                                    return (
                                        <label key={c.id} className={`checkout-character${short ? ' is-short' : ''}`}>
                                            <input
                                                type="radio"
                                                name="character_id"
                                                value={c.id}
                                                checked={characterId === c.id}
                                                disabled={short}
                                                onChange={() => setCharacterId(c.id)}
                                            />
                                            <span className="checkout-character-name">
                                                {c.name} <span>Lv {c.level} {c.className}</span>
                                            </span>
                                            <span className="checkout-character-coins">
                                                {fmt(c.coins)} {cart.currency}
                                            </span>
                                        </label>
                                    );
                                })}
                            </fieldset>
                            {payable.length === 0 ? (
                                <p className="gift-next">
                                    {t(
                                        `None of your characters has ${fmt(cart.price)} ${cart.currency} in the bag yet. The site shows the last save: every 5 minutes while you play, and when you log out.`,
                                        `Nenhum dos seus personagens tem ${fmt(cart.price)} ${cart.currency} na bolsa ainda. O site mostra o último salvamento: a cada 5 minutos enquanto você joga, e ao sair.`,
                                    )}
                                </p>
                            ) : null}
                            {errors.character_id || errors.package ? (
                                <p className="form-error" role="alert">
                                    {errors.character_id ?? errors.package}
                                </p>
                            ) : null}
                            <div className="checkout-total">
                                <span>{t('Total', 'Total')}</span>
                                <strong>
                                    {fmt(cart.price)} {cart.currency}
                                </strong>
                            </div>
                            <p className="checkout-note">
                                {t(
                                    'The L-Coin is taken from the chosen character’s bag and the items arrive in its in-game mailbox. A confirmation is sent to your account’s email.',
                                    'Os L-Coins são cobrados da bolsa do personagem escolhido e os itens chegam na caixa de correio dele no jogo. Uma confirmação é enviada para o e-mail da sua conta.',
                                )}
                            </p>
                            <div className="checkout-actions">
                                <button type="button" className="btn btn-outline" onClick={() => dialog.current?.close()}>
                                    {t('Cancel', 'Cancelar')}
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={processing || characterId === undefined}>
                                    {t(`Buy for ${fmt(cart.price)} ${cart.currency}`, `Comprar por ${fmt(cart.price)} ${cart.currency}`)}
                                </button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </dialog>
    );
}
