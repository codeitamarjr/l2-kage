<?php

namespace App\Http\Controllers;

use App\Rules\Turnstile;
use App\Services\GameAccounts;
use App\Services\Seo;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Forgot password?": request a reset link by email, then choose a new password from the link.
 */
class PasswordResetController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('forgot-password', ['seo' => Seo::private(__('Forgot Password'))]);
    }

    public function store(Request $request, GameAccounts $accounts): RedirectResponse
    {
        abort_unless(GameAccounts::emailReady(), 503, 'Email is not set up yet.');

        $request->merge(['email' => Str::lower(trim((string) $request->input('email')))]);
        $data = $request->validate([
            'email' => ['required', 'string', 'max:255', 'email:rfc'],
            'cf-turnstile-response' => [new Turnstile($request->ip())],
        ]);

        $accounts->sendPasswordReset($data['email']);

        // The same answer whether or not the address has accounts, so addresses can't be probed.
        return redirect()->route('password.request')->with('status', 'reset-sent')->with('sentTo', $data['email']);
    }

    public function edit(string $token, GameAccounts $accounts): Response|RedirectResponse
    {
        $login = $accounts->resetLogin($token);

        if ($login === null) {
            return redirect()->route('password.request')->with('status', 'link-invalid');
        }

        return Inertia::render('reset-password', ['token' => $token, 'login' => $login, 'seo' => Seo::private(__('New Password'))]);
    }

    public function update(string $token, Request $request, GameAccounts $accounts): RedirectResponse
    {
        $data = $request->validate(['password' => AccountPasswordRules::rules()], AccountPasswordRules::messages());

        $login = $accounts->resetPassword($token, $data['password']);

        if ($login === null) {
            return redirect()->route('password.request')->with('status', 'link-invalid');
        }

        return redirect()->route('account')->with('status', 'password-reset')->with('login', $login);
    }
}
