import { Form } from '@inertiajs/react';
import { AuthCard, Notice } from '@/components/auth-card';
import { useT } from '@/i18n';

export default function ResetPassword({ token, login }: { token: string; login: string }) {
    const t = useT();

    return (
        <>
            <AuthCard kicker={`${t('Account', 'Conta')} ${login}`} title={t('New Password', 'Nova Senha')}>
                <Form action={`/reset-password/${token}`} method="post" className="auth-form" resetOnError>
                    {({ errors, processing }) => (
                        <>
                            <label className="field">
                                <span className="field-label">{t('New password', 'Nova senha')}</span>
                                <input name="password" type="password" autoComplete="new-password" required minLength={6} maxLength={16} autoFocus />
                                <span className="field-hint">{t('6 to 16 characters, no spaces.', 'De 6 a 16 caracteres, sem espaços.')}</span>
                            </label>
                            <label className="field">
                                <span className="field-label">{t('Repeat password', 'Repita a senha')}</span>
                                <input name="password_confirmation" type="password" autoComplete="new-password" required minLength={6} maxLength={16} />
                            </label>
                            {errors.password ? <Notice tone="error">{errors.password}</Notice> : null}
                            <button className="btn btn-primary signin-submit" type="submit" disabled={processing}>
                                {t('Save Password', 'Salvar Senha')}
                            </button>
                            <p className="signin-note">{t('It works in the game right away, the next time you log in.', 'Ela vale no jogo na hora, na próxima vez que você entrar.')}</p>
                        </>
                    )}
                </Form>
            </AuthCard>
        </>
    );
}
