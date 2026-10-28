import { Form, Link, usePage } from '@inertiajs/react';
import { AuthCard, Notice } from '@/components/auth-card';
import { Turnstile } from '@/components/turnstile';
import { useT } from '@/i18n';
import type { SharedProps } from '@/types';

export default function ForgotPassword() {
    const { flash, emailReady } = usePage<SharedProps>().props;
    const t = useT();

    return (
        <>
            <AuthCard kicker={t('Account recovery', 'Recuperação de conta')} title={t('Forgot Password', 'Esqueci a Senha')}>
                {flash.status === 'reset-sent' ? (
                    <Notice>
                        {t(
                            <>If a game account uses <strong>{flash.sentTo}</strong>, we sent it a link to choose a new password. It expires in 60 minutes; check your spam folder too.</>,
                            <>Se alguma conta do jogo usa <strong>{flash.sentTo}</strong>, enviamos um link para escolher uma nova senha. Ele expira em 60 minutos; confira também a pasta de spam.</>,
                        )}
                    </Notice>
                ) : null}
                {flash.status === 'link-invalid' ? <Notice tone="error">{t('That link has expired or was already used. Ask for a new one below.', 'Esse link expirou ou já foi usado. Peça um novo abaixo.')}</Notice> : null}
                {!emailReady ? <Notice>
                        {t(
                            'Password resets by email open very soon. Until then, contact the staff and they can reset it for you.',
                            'A redefinição de senha por e-mail abre em breve. Até lá, fale com a equipe e ela pode redefini-la para você.',
                        )}
                    </Notice> : null}
                <Form action="/forgot-password" method="post" className="auth-form" options={{ preserveScroll: true }}>
                    {({ errors, processing }) => (
                        <>
                            <label className="field">
                                <span className="field-label">{t('Email of your account', 'E-mail da sua conta')}</span>
                                <input name="email" type="email" autoComplete="email" required maxLength={255} autoFocus />
                            </label>
                            {errors.email ? <Notice tone="error">{errors.email}</Notice> : null}
                            <Turnstile resetKey={errors} />
                            {errors['cf-turnstile-response'] ? <Notice tone="error">{errors['cf-turnstile-response']}</Notice> : null}
                            <button className="btn btn-primary signin-submit" type="submit" disabled={processing || !emailReady}>
                                {t('Send Reset Link', 'Enviar Link')}
                            </button>
                        </>
                    )}
                </Form>
                <p className="signin-note">
                    {t('Your account has no email yet? Contact the staff, they can reset it for you.', 'Sua conta ainda não tem e-mail? Fale com a equipe, ela pode redefinir a senha para você.')}{' '}
                    <Link href="/account" className="text-link">{t('Back to sign in', 'Voltar para o login')}</Link>
                </p>
            </AuthCard>
        </>
    );
}
