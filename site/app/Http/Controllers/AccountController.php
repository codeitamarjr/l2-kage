<?php

namespace App\Http\Controllers;

use App\Models\Game\Account;
use App\Services\GiftBox;
use App\Services\L2j\CharacterSheet;
use App\Services\Orders;
use App\Services\Seo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The player area: sign-in form for guests; for signed-in players three tabs, Characters (characters, status and
 * items), Orders (/account/orders: this week's gift box and the history of everything claimed or bought in the store)
 * and Security (/account/security: account details, recovery email, password).
 */
class AccountController extends Controller
{
    public function show(Request $request, CharacterSheet $sheet, GiftBox $giftBox, Orders $orders, string $tab = 'characters'): Response
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

        if ($tab === 'orders') {
            return Inertia::render('account', [
                'account' => $details,
                'tab' => 'orders',
                'seo' => Seo::private(__('Orders')),
                'gift' => fn (): array => $giftBox->status($account),
                'orders' => fn (): array => $orders->history($account),
            ]);
        }

        $characters = $sheet->characters($account);
        $selectedId = $request->integer('character') ?: ($characters[0]['id'] ?? null);

        return Inertia::render('account', [
            'account' => $details,
            'tab' => 'characters',
            'seo' => Seo::private(__('Welcome, :login', ['login' => $account->login])),
            'characters' => $characters,
            'character' => fn (): ?array => $selectedId ? $sheet->character($account, $selectedId) : null,
        ]);
    }
}
