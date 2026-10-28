<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * For the send_mail action: one in-game mail carrying several items (the weekly gift box).
     * items is "itemId:count:enchant" entries joined by ";" so the bridge can read it without a JSON parser.
     */
    public function up(): void
    {
        Schema::table('game_actions', function (Blueprint $table) {
            $table->text('items')->nullable()->after('enchant');
            $table->string('mail_subject', 128)->nullable()->after('items');
            $table->text('mail_text')->nullable()->after('mail_subject');
        });
    }

    public function down(): void
    {
        Schema::table('game_actions', function (Blueprint $table) {
            $table->dropColumn(['items', 'mail_subject', 'mail_text']);
        });
    }
};
