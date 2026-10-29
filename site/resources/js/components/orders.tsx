import { Link, usePoll } from '@inertiajs/react';
import { useEffect } from 'react';
import { languageTag, pick, useLocale, useT } from '@/i18n';
import type { Order } from '@/types';

/**
 * The Orders tab's history: every gift box, Kage Pass and class package the account claimed or bought, newest first,
 * with what was sent and its in-game delivery. While one is on its way the list polls for the result.
 */
export function OrdersList({ orders }: { orders: Order[] }) {
    const locale = useLocale();
    const t = useT();
    const tag = languageTag(locale);
    const fmt = (n: number) => n.toLocaleString(tag);
    const travelling = orders.some((o) => o.status === 'pending' || o.status === 'processing');
    const { start, stop } = usePoll(4_000, { only: ['orders'] }, { autoStart: false });

    useEffect(() => {
        if (travelling) {
            start();
        } else {
            stop();
        }

        return stop;
    }, [travelling, start, stop]);

    const kinds = {
        gift: t('Gift box', 'Caixa de presente'),
        pass: t('Season pass', 'Passe da temporada'),
        package: t('Class package', 'Pacote de classe'),
    };
    const statuses = {
        pending: t('On its way', 'A caminho'),
        processing: t('On its way', 'A caminho'),
        done: t('Delivered by mail', 'Entregue pelo correio'),
        failed: t('Failed, nothing taken', 'Falhou, nada cobrado'),
    };

    return (
        <section className="orders" aria-labelledby="orders-title">
            <div className="orders-head">
                <h2 id="orders-title" className="account-heading">
                    {t('Order history', 'Histórico de pedidos')}
                </h2>
                <Link href="/treasury" className="btn btn-outline btn-small">
                    {t('Visit the Treasury', 'Visitar o Tesouro')}
                </Link>
            </div>
            {orders.length === 0 ? (
                <p className="about-empty">
                    {t('No orders yet. Open your weekly gift box above, or buy a ', 'Nenhum pedido ainda. Abra sua caixa de presente semanal acima, ou compre um ')}
                    <Link href="/treasury" className="text-link">
                        {t('pass or package', 'passe ou pacote')}
                    </Link>
                    .
                </p>
            ) : (
                <ol className="orders-list">
                    {orders.map((order) => (
                        <li key={order.id} className={`order is-${order.type}`}>
                            <details>
                                <summary className="order-summary">
                                    <span className="order-kind">{kinds[order.type]}</span>
                                    <span className="order-name">{pick(locale, order.name)}</span>
                                    <span className="order-meta">
                                        {new Date(order.createdAt).toLocaleDateString(tag, { day: 'numeric', month: 'short', year: 'numeric' })} · {order.characterName}
                                    </span>
                                    <span className="order-price">{order.price ? `${fmt(order.price.count)} ${order.price.currency}` : t('Free', 'Grátis')}</span>
                                    <span className={`order-status is-${order.status}`}>{statuses[order.status]}</span>
                                </summary>
                                <ul className="pkg-items order-items">
                                    {order.items.map((item, i) => (
                                        <li key={`${item.name}-${i}`}>
                                            {item.enchant ? <span className="item-enchant">+{item.enchant}</span> : null} {item.name}
                                            {item.count > 1 ? <span className="gift-item-count"> × {fmt(item.count)}</span> : null}
                                        </li>
                                    ))}
                                </ul>
                            </details>
                        </li>
                    ))}
                </ol>
            )}
        </section>
    );
}
