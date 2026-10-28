<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Weekly gift boxes claimed by players. The unique (account, week_start) key is what guarantees one box per
     * game account per week, even if the claim button is pressed twice at the same moment.
     */
    public function up(): void
    {
        Schema::create('gift_claims', function (Blueprint $table) {
            $table->id();
            $table->string('account', 45);
            $table->date('week_start');
            $table->unsignedInteger('character_id');
            $table->string('character_name', 35);
            $table->json('items');
            $table->foreignId('game_action_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();

            $table->unique(['account', 'week_start']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gift_claims');
    }
};
