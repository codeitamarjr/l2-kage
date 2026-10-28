<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The public item database (/items), filled from resources/data/itemdb.ndjson.gz by `php artisan itemdb:import`.
     * Generated data only: the importer replaces every row, so nothing here is edited by hand.
     */
    public function up(): void
    {
        Schema::create('itemdb_items', function (Blueprint $table) {
            $table->unsignedInteger('id')->primary();
            $table->string('name')->index();
            $table->string('type', 16);
            $table->string('kind', 48);
            $table->string('category', 16)->index();
            $table->string('grade', 4)->nullable()->index();
            $table->string('icon')->nullable();
            $table->unsignedInteger('weight')->default(0);
            $table->unsignedBigInteger('price')->default(0);
            $table->unsignedInteger('crystals')->nullable();
            $table->json('details');
        });

        Schema::create('itemdb_npcs', function (Blueprint $table) {
            $table->unsignedInteger('id')->primary();
            $table->string('name');
            $table->string('title')->nullable();
            $table->unsignedSmallInteger('level');
            $table->string('type', 32);
        });

        Schema::create('itemdb_drops', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('group_id')->index();
            $table->unsignedInteger('npc_id')->index();
            $table->unsignedInteger('item_id')->index();
            $table->string('kind', 8);
            $table->unsignedBigInteger('min');
            $table->unsignedBigInteger('max');
            $table->double('chance');
            $table->double('group_chance');
        });

        Schema::create('itemdb_shop_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('npc_id');
            $table->unsignedInteger('item_id')->index();
        });

        Schema::create('itemdb_recipes', function (Blueprint $table) {
            $table->unsignedInteger('id')->primary();
            $table->unsignedInteger('recipe_item_id')->index();
            $table->string('name');
            $table->unsignedTinyInteger('level');
            $table->boolean('dwarven');
            $table->unsignedTinyInteger('success_rate');
            $table->unsignedInteger('mp_cost');
            $table->unsignedInteger('product_id')->index();
            $table->unsignedBigInteger('product_count');
            $table->json('rare')->nullable();
            $table->json('ingredients');
        });

        Schema::create('itemdb_recipe_ingredients', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('recipe_id')->index();
            $table->unsignedInteger('item_id')->index();
            $table->unsignedBigInteger('count');
        });

        Schema::create('itemdb_meta', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->string('value');
        });
    }

    public function down(): void
    {
        foreach (['itemdb_meta', 'itemdb_recipe_ingredients', 'itemdb_recipes', 'itemdb_shop_items', 'itemdb_drops', 'itemdb_npcs', 'itemdb_items'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
