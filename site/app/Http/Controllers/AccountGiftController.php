<?php

namespace App\Http\Controllers;

use App\Models\Game\Account;
use App\Services\GiftBox;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Opens the signed-in player's weekly gift box (see App\Services\GiftBox).
 */
class AccountGiftController extends Controller
{
    public function store(Request $request, GiftBox $giftBox): RedirectResponse
    {
        /** @var Account|null $account */
        $account = Auth::guard('player')->user();

        if ($account === null) {
            return redirect()->route('account');
        }

        $data = $request->validate(['character_id' => ['required', 'integer']], ['character_id.*' => __('Choose a character to receive the box.')]);
        $giftBox->claim($account, (int) $data['character_id']);

        return redirect()->route('account');
    }
}
