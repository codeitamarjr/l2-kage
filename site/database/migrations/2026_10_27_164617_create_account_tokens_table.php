<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * One-time links emailed to players: confirm a registration (the game account is created only then), reset a
     * password, confirm a new email. Only a hash of each token is stored, so a database leak can't be used to click
     * them; a pending registration keeps the chosen password already hashed the L2J way.
     */
    public function up(): void
    {
        Schema::create('account_tokens', function (Blueprint $table) {
            $table->id();
            $table->string('type', 16);
            $table->string('login', 45)->index();
            $table->string('email')->nullable()->index();
            $table->string('password_hash', 45)->nullable();
            $table->string('token_hash', 64)->unique();
            $table->timestamp('expires_at')->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('account_tokens');
    }
};
