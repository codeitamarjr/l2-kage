<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The queue of changes the website asks the game server to make. The website only inserts rows;
     * the WebBridge script inside the L2J game server picks up pending rows, applies them with the
     * game's own code and writes back the status and result.
     */
    public function up(): void
    {
        Schema::create('game_actions', function (Blueprint $table) {
            $table->id();
            $table->string('action', 32)->index();
            $table->unsignedInteger('character_id');
            $table->string('character_name', 35);
            $table->unsignedInteger('item_id')->nullable();
            $table->string('item_name')->nullable();
            $table->unsignedBigInteger('count')->default(1);
            $table->unsignedSmallInteger('enchant')->default(0);
            $table->string('note')->nullable();
            $table->string('status', 16)->default('pending')->index();
            $table->text('result')->nullable();
            $table->string('requested_by')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_actions');
    }
};
