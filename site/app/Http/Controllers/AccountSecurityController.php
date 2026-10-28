<?php

namespace App\Http\Controllers;

use App\Models\Game\Account;
use App\Services\GameAccounts;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

/**
 * Player area security: change the password, add or change the recovery email (confirmed by a link).
 */
class AccountSecurityController extends Controller
{
    public function password(Request $request, GameAccounts $accounts): RedirectResponse
    {
        $account = $this->account();
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => AccountPasswordRules::rules(),
        ], AccountPasswordRules::messages());

        $accounts->changePassword($account, $data['current_password'], $data['password']);

        return back()->with('status', 'password-changed');
    }

    public function email(Request $request, GameAccounts $accounts): RedirectResponse
    {
        abort_unless(GameAccounts::emailReady(), 503, 'Email is not set up yet.');
        $account = $this->account();
        $request->merge(['email' => Str::lower(trim((string) $request->input('email')))]);
        $data = $request->validate([
            'email' => ['required', 'string', 'max:255', 'email:rfc'],
            'email_password' => ['required', 'string'],
        ], ['email_password.required' => __('Enter your current password.')]);

        $accounts->requestEmailChange($account, $data['email'], $data['email_password']);

        return back()->with('status', 'email-sent')->with('sentTo', $data['email']);
    }

    /**
     * From the confirmation email: works whether or not the player is signed in on this browser.
     */
    public function confirmEmail(string $token, GameAccounts $accounts): RedirectResponse
    {
        $login = $accounts->confirmEmail($token);

        return redirect()->route('account.security')->with('status', $login ? 'email-confirmed' : 'link-invalid');
    }

    private function account(): Account
    {
        /** @var Account|null $account */
        $account = Auth::guard('player')->user();
        abort_if($account === null, 403);

        return $account;
    }
}
