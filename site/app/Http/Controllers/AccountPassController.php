<?php

namespace App\Http\Controllers;

use App\Models\Game\Account;
use App\Services\KagePass;
use App\Services\Orders;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Claims this season's Kage Pass for one of the signed-in player's characters (see App\Services\KagePass): the store
 * page's checkout. Emails the order confirmation, then shows the order in the player area's Orders tab.
 */
class AccountPassController extends Controller
{
    public function store(Request $request, KagePass $pass, Orders $orders): RedirectResponse
    {
        /** @var Account|null $account */
        $account = Auth::guard('player')->user();

        if ($account === null) {
            return redirect()->route('account');
        }

        $data = $request->validate(['character_id' => ['required', 'integer']], ['character_id.*' => __('Choose one of your characters.')]);
        $claim = $pass->claim($account, (int) $data['character_id']);
        $orders->confirm($account, (string) config('l2j.pass.name'), (int) config('l2j.pass.price.count'), $claim->character_name, $claim->gameAction);

        return redirect()->route('account.orders')->with('status', 'order-placed');
    }
}
