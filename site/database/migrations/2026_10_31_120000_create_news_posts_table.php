<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('news_posts', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('category', 20)->index();
            $table->string('title_en');
            $table->string('title_pt');
            $table->string('summary_en');
            $table->string('summary_pt');
            $table->text('body_en');
            $table->text('body_pt');
            $table->string('image')->nullable();
            $table->dateTime('published_at')->nullable()->index();
            $table->boolean('is_featured')->default(false);
            $table->dateTime('featured_until')->nullable();
            $table->string('banner_theme', 20)->default('gold');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('news_posts');
    }
};
