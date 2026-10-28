<?php

namespace App\Http\Controllers;

use App\Rules\Turnstile;
use App\Services\GameAccounts;
use App\Services\Seo;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Creating a game account on the website: the form, then the link in the confirmation email creates the account.
 */
class RegistrationController extends Controller
{
    public function create(): Response|RedirectResponse
    {
        if (Auth::guard('player')->check()) {
            return redirect()->route('account');
        }

        return Inertia::render('register', [
            'seo' => Seo::make(
                __('Create Account'),
                __('Create your free :brand game account: choose an account name and password, confirm your email, and play Lineage II Essence.', ['brand' => Seo::brand()]),
            ),
        ]);
    }

    public function store(Request $request, GameAccounts $accounts): RedirectResponse
    {
        abort_unless(GameAccounts::emailReady(), 503, 'Email is not set up yet.');

        $request->merge(['email' => Str::lower(trim((string) $request->input('email')))]);
        $data = $request->validate([
            'login' => ['required', 'string', 'min:4', 'max:14', 'regex:/^[A-Za-z0-9]+$/'],
            'email' => ['required', 'string', 'max:255', 'email:rfc'],
            'password' => AccountPasswordRules::rules(),
            'cf-turnstile-response' => [new Turnstile($request->ip())],
        ], [
            'login.min' => __('Account names have 4 to 14 letters or digits.'),
            'login.max' => __('Account names have 4 to 14 letters or digits.'),
            'login.regex' => __('Use only letters and digits (no spaces or symbols).'),
            ...AccountPasswordRules::messages(),
        ]);

        $accounts->register($data['login'], $data['email'], $data['password']);

        return redirect()->route('register')->with('status', 'registration-sent')->with('sentTo', $data['email']);
    }

    public function confirm(string $token, Request $request, GameAccounts $accounts): RedirectResponse
    {
        $account = $accounts->confirmRegistration($token);

        if ($account === null) {
            return redirect()->route('register')->with('status', 'link-invalid');
        }

        Auth::guard('player')->login($account);
        $request->session()->regenerate();

        return redirect()->route('account')->with('status', 'account-created');
    }
}
