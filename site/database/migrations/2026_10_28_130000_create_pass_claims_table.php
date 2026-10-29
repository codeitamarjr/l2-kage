<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Kage Pass claims (see App\Services\KagePass). The unique (account, season) key guarantees one pass per game
     * account per season, even if the claim button is pressed twice at the same moment; a claim whose L-Coin charge
     * failed in game is deleted before the player tries again.
     */
    public function up(): void
    {
        Schema::create('pass_claims', function (Blueprint $table) {
            $table->id();
            $table->string('account', 45);
            $table->string('season', 32);
            $table->unsignedInteger('character_id');
            $table->string('character_name', 35);
            $table->foreignId('game_action_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();

            $table->unique(['account', 'season']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pass_claims');
    }
};
