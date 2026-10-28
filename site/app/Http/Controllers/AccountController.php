<?php

namespace App\Http\Controllers;

use App\Models\Game\Account;
use App\Services\GiftBox;
use App\Services\L2j\CharacterSheet;
use App\Services\Seo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The player area: sign-in form for guests; for signed-in players two tabs, Characters (weekly gift box, characters,
 * status and items) and Security (/account/security: account details, recovery email, password).
 */
class AccountController extends Controller
{
    public function show(Request $request, CharacterSheet $sheet, GiftBox $giftBox, string $tab = 'characters'): Response
    {
        /** @var Account|null $account */
        $account = Auth::guard('player')->user();

        if ($account === null) {
            return Inertia::render('account', ['account' => null, 'tab' => $tab, 'seo' => Seo::private(__('Sign In'))]);
        }

        $details = [
            'login' => $account->login,
            'gm' => $account->isGameMaster(),
            'created' => $account->created_time?->toIso8601String(),
            'email' => $account->email,
        ];

        if ($tab === 'security') {
            return Inertia::render('account', ['account' => $details, 'tab' => 'security', 'seo' => Seo::private(__('Security'))]);
        }

        $characters = $sheet->characters($account);
        $selectedId = $request->integer('character') ?: ($characters[0]['id'] ?? null);

        return Inertia::render('account', [
            'account' => $details,
            'tab' => 'characters',
            'seo' => Seo::private(__('Welcome, :login', ['login' => $account->login])),
            'characters' => $characters,
            'gift' => fn (): array => $giftBox->status($account),
            'character' => fn (): ?array => $selectedId ? $sheet->character($account, $selectedId) : null,
        ]);
    }
}
