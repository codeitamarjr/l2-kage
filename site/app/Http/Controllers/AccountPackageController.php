<?php

namespace App\Http\Controllers;

use App\Models\Game\Account;
use App\Services\ClassPackages;
use App\Services\Orders;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Buys a class package for one of the signed-in player's characters (see App\Services\ClassPackages): the store
 * page's checkout. Emails the order confirmation, then shows the order in the player area's Orders tab.
 */
class AccountPackageController extends Controller
{
    public function store(Request $request, ClassPackages $packages, Orders $orders): RedirectResponse
    {
        /** @var Account|null $account */
        $account = Auth::guard('player')->user();

        if ($account === null) {
            return redirect()->route('account');
        }

        $data = $request->validate(
            ['character_id' => ['required', 'integer'], 'tier' => ['required', 'string'], 'archetype' => ['required', 'string']],
            ['character_id.*' => __('Choose one of your characters.'), 'tier.*' => __('Choose one of the packages.'), 'archetype.*' => __('Choose one of the packages.')],
        );
        $claim = $packages->claim($account, (int) $data['character_id'], $data['tier'], $data['archetype']);
        $orders->confirm(
            $account,
            config("l2j.packages.archetypes.{$data['archetype']}.name.en").' Package ('.config("l2j.packages.tiers.{$data['tier']}.name.en").')',
            (int) config("l2j.packages.tiers.{$data['tier']}.price"),
            $claim->character_name,
            $claim->gameAction,
        );

        return redirect()->route('account.orders')->with('status', 'order-placed');
    }
}
