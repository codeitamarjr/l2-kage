<?php

namespace Database\Seeders;

use App\Models\NewsPost;
use Illuminate\Database\Seeder;

/**
 * The first news post: the Halloween event, which also fills the home page banner until it ends.
 * Run once with php artisan db:seed --class=HalloweenNewsSeeder --force. Later posts are written in the admin panel.
 */
class HalloweenNewsSeeder extends Seeder
{
    public function run(): void
    {
        NewsPost::updateOrCreate(['slug' => 'halloween-pumpkin-harvest'], [
            'category' => 'event',
            'title_en' => 'The Pumpkins Are Hungry',
            'title_pt' => 'As Abóboras Estão com Fome',
            'summary_en' => 'Strange pumpkins are sprouting across Aden, and something inside them wants out. Feed them, break them and claim what they hide, until 14 November.',
            'summary_pt' => 'Abóboras estranhas estão brotando por toda Aden, e algo dentro delas quer sair. Alimente, quebre e leve o que elas escondem, até 14 de novembro.',
            'body_en' => <<<'MD'
                The fields of Aden smell of rot and honey this autumn. Gardener Fordson's magical seeds have grown strange, and his cat, Puss, is looking for someone brave or foolish enough to tend them. Are you?

                ## How to play

                1. **Hunt** monsters anywhere in Aden for Nectar, the pumpkins' favourite meal.
                2. **Find Puss the Cat** in town. Trade 10 Nectar for a seed, 20 for a large seed, or 100 or more for a chrono instrument.
                3. **Plant the seed** by double-clicking it, then feed the young pumpkin Nectar until it changes.
                4. **Break it open** before it vanishes. Ripe pumpkins hold better prizes than withered ones.

                The largest pumpkins laugh at ordinary weapons. Only a chrono instrument can crack them, and they can hold Halloween Kits.

                The harvest runs until 14 November, and any hero can join. No hero yet? [Create one](/register) and be in Aden tonight.

                So, hero: will you feed the harvest, or will the harvest feed on you?
                MD,
            'body_pt' => <<<'MD'
                Os campos de Aden cheiram a podridão e mel neste outono. As sementes mágicas do jardineiro Fordson cresceram estranhas, e seu gato, Puss, procura alguém corajoso, ou louco, o bastante para cuidar delas. Será você?

                ## Como jogar

                1. **Cace** monstros em qualquer lugar de Aden atrás de Néctar, o prato favorito das abóboras.
                2. **Encontre Puss the Cat** na cidade. Troque 10 Néctar por uma semente, 20 por uma semente grande, ou 100 ou mais por um instrumento chrono.
                3. **Plante a semente** com um clique duplo e alimente a abóbora jovem com Néctar até ela mudar.
                4. **Quebre a abóbora** antes que ela suma. As maduras guardam prêmios melhores que as murchas.

                As maiores abóboras riem de armas comuns. Só um instrumento chrono consegue rachá-las, e elas podem conter Halloween Kits.

                A colheita vai até 14 de novembro, e qualquer herói pode participar. Ainda não tem um herói? [Crie o seu](/register) e esteja em Aden hoje à noite.

                E então, herói: você vai alimentar a colheita, ou a colheita vai se alimentar de você?
                MD,
            'published_at' => '2026-10-31 00:00:00',
            'is_featured' => true,
            'featured_until' => '2026-11-14 23:59:59',
            'banner_theme' => 'halloween',
        ]);
    }
}
