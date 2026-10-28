import { usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import type { SharedProps } from '@/types';

type TurnstileApi = {
    render: (el: HTMLElement, options: { sitekey: string; theme?: string }) => string;
    reset: (id: string) => void;
    remove: (id: string) => void;
};

declare global {
    interface Window {
        turnstile?: TurnstileApi;
    }
}

const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let loading: Promise<void> | null = null;

function loadScript(): Promise<void> {
    loading ??= new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = SCRIPT;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Turnstile failed to load'));
        document.head.appendChild(script);
    });

    return loading;
}

/**
 * Cloudflare Turnstile bot check inside a form: it adds the hidden "cf-turnstile-response" field the server
 * verifies. Renders nothing when Turnstile isn't configured. Change `resetKey` (e.g. after a failed submit) to get
 * a fresh check, since each answer can only be used once.
 */
export function Turnstile({ resetKey = 0 }: { resetKey?: unknown }) {
    const { turnstileSiteKey } = usePage<SharedProps>().props;
    const box = useRef<HTMLDivElement>(null);
    const widget = useRef<string | null>(null);

    useEffect(() => {
        if (!turnstileSiteKey || !box.current) {
            return;
        }

        let cancelled = false;
        loadScript().then(() => {
            if (!cancelled && box.current && window.turnstile && widget.current === null) {
                widget.current = window.turnstile.render(box.current, { sitekey: turnstileSiteKey, theme: 'dark' });
            }
        }).catch(() => {});

        return () => {
            cancelled = true;

            if (widget.current && window.turnstile) {
                window.turnstile.remove(widget.current);
                widget.current = null;
            }
        };
    }, [turnstileSiteKey]);

    useEffect(() => {
        if (widget.current && window.turnstile) {
            window.turnstile.reset(widget.current);
        }
    }, [resetKey]);

    return turnstileSiteKey ? <div ref={box} className="turnstile"></div> : null;
}
