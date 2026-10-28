import type { ReactNode } from 'react';

/** The page frame for account forms (register, forgot / reset password): a centred card below the header. */
export function AuthCard({ kicker, title, children }: { kicker: string; title: string; children: ReactNode }) {
    return (
        <section className="account-section auth-page">
            <div className="signin-card">
                <p className="auth-kicker">{kicker}</p>
                <h1 className="signin-title text-gold">{title}</h1>
                {children}
            </div>
        </section>
    );
}

/** A message box above a form: "info" for confirmations, "error" for problems. */
export function Notice({ tone = 'info', children }: { tone?: 'info' | 'error'; children: ReactNode }) {
    return (
        <p className={tone === 'error' ? 'form-error' : 'form-notice'} role={tone === 'error' ? 'alert' : 'status'}>
            {children}
        </p>
    );
}
