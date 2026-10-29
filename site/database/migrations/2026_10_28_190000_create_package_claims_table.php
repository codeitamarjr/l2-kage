<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Class package purchases (see App\Services\ClassPackages). The unique (account, season, package) key guarantees
     * each package once per game account per season, even if the buy button is pressed twice at the same moment; a
     * purchase whose L-Coin charge failed in game is deleted before the player tries again.
     */
    public function up(): void
    {
        Schema::create('package_claims', function (Blueprint $table) {
            $table->id();
            $table->string('account', 45);
            $table->string('season', 32);
            // "tier:archetype", e.g. "elite:knight"
            $table->string('package', 48);
            $table->unsignedInteger('character_id');
            $table->string('character_name', 35);
            $table->foreignId('game_action_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();

            $table->unique(['account', 'season', 'package']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('package_claims');
    }
};
