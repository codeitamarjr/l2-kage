import { Form, Link, usePage } from '@inertiajs/react';
import { AuthCard, Notice } from '@/components/auth-card';
import { Turnstile } from '@/components/turnstile';
import { useT } from '@/i18n';
import type { SharedProps } from '@/types';

export default function Register() {
    const { flash, serverName, emailReady } = usePage<SharedProps>().props;
    const t = useT();

    if (flash.status === 'registration-sent') {
        return (
            <>
                <AuthCard kicker={t('One more step', 'Só mais um passo')} title={t('Check your inbox', 'Confira seu e-mail')}>
                    <Notice>
                        {t(
                            <>We sent a confirmation link to <strong>{flash.sentTo}</strong>. Click it to create your account, then log in to the game with your account name and password.</>,
                            <>Enviamos um link de confirmação para <strong>{flash.sentTo}</strong>. Clique nele para criar sua conta e depois entre no jogo com seu nome de conta e senha.</>,
                        )}
                    </Notice>
                    <p className="signin-note">
                        {t(
                            'The link expires in 24 hours. Nothing there? Check your spam folder, or register again.',
                            'O link expira em 24 horas. Não chegou? Confira a pasta de spam ou cadastre-se de novo.',
                        )}
                    </p>
                    <Link href="/register" className="btn btn-outline signin-submit">
                        {t('Register again', 'Cadastrar de novo')}
                    </Link>
                </AuthCard>
            </>
        );
    }

    if (!emailReady) {
        return (
            <>
                <AuthCard kicker={`${t('Join', 'Junte-se a')} ${serverName}`} title={t('Create Account', 'Criar Conta')}>
                    <Notice>
                        {t(
                            'Account registration on the website opens very soon. Until then, log in to the game with a new account name and password: the account is created for you.',
                            'O cadastro de contas pelo site abre em breve. Até lá, entre no jogo com um novo nome de conta e senha: a conta é criada para você.',
                        )}
                    </Notice>
                    <p className="signin-note">
                        {t('Already have an account?', 'Já tem uma conta?')} <Link href="/account" className="text-link">{t('Sign in', 'Entrar')}</Link>
                    </p>
                </AuthCard>
            </>
        );
    }

    return (
        <>
            <AuthCard kicker={`${t('Join', 'Junte-se a')} ${serverName}`} title={t('Create Account', 'Criar Conta')}>
                {flash.status === 'link-invalid' ? (
                    <Notice tone="error">{t('That link has expired or was already used. Please register again.', 'Esse link expirou ou já foi usado. Cadastre-se de novo.')}</Notice>
                ) : null}
                <Form action="/register" method="post" className="auth-form" resetOnError={['password', 'password_confirmation']} options={{ preserveScroll: true }}>
                    {({ errors, processing }) => (
                        <>
                            <label className="field">
                                <span className="field-label">{t('Account name', 'Nome da conta')}</span>
                                <input name="login" autoComplete="username" required minLength={4} maxLength={14} pattern="[A-Za-z0-9]+" spellCheck={false} autoCapitalize="none" autoFocus />
                                <span className="field-hint">{t('4 to 14 letters or digits. This is what you type in the game.', 'De 4 a 14 letras ou números. É o que você digita no jogo.')}</span>
                            </label>
                            {errors.login ? <Notice tone="error">{errors.login}</Notice> : null}
                            <label className="field">
                                <span className="field-label">{t('Email', 'E-mail')}</span>
                                <input name="email" type="email" autoComplete="email" required maxLength={255} />
                                <span className="field-hint">{t('To confirm your account and reset your password if you forget it.', 'Para confirmar sua conta e redefinir a senha se você esquecer.')}</span>
                            </label>
                            {errors.email ? <Notice tone="error">{errors.email}</Notice> : null}
                            <label className="field">
                                <span className="field-label">{t('Password', 'Senha')}</span>
                                <input name="password" type="password" autoComplete="new-password" required minLength={6} maxLength={16} />
                                <span className="field-hint">{t('6 to 16 characters, no spaces (the game client allows no more).', 'De 6 a 16 caracteres, sem espaços (o cliente do jogo não aceita mais).')}</span>
                            </label>
                            <label className="field">
                                <span className="field-label">{t('Repeat password', 'Repita a senha')}</span>
                                <input name="password_confirmation" type="password" autoComplete="new-password" required minLength={6} maxLength={16} />
                            </label>
                            {errors.password ? <Notice tone="error">{errors.password}</Notice> : null}
                            <Turnstile resetKey={errors} />
                            {errors['cf-turnstile-response'] ? <Notice tone="error">{errors['cf-turnstile-response']}</Notice> : null}
                            <button className="btn btn-primary signin-submit" type="submit" disabled={processing}>
                                {t('Create Account', 'Criar Conta')}
                            </button>
                        </>
                    )}
                </Form>
                <p className="signin-note">
                    {t('Already have an account?', 'Já tem uma conta?')} <Link href="/account" className="text-link">{t('Sign in', 'Entrar')}</Link>
                </p>
            </AuthCard>
        </>
    );
}
