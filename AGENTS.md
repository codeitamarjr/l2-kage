# L2 Kage: AI handoff

Lineage II Essence private server (L2J Mobius, Samurai Crow, protocol 542) with a Laravel website.
This is a short current-state note. Details live in `README-KAGE.md` (server) and `site/README.md` (website).
`site/AGENTS.md` holds the Laravel rules for work inside `site/`.

Last updated: 31 Oct 2026. Check anything below against the code before relying on it.

## Layout

| Path | Purpose |
|---|---|
| `L2J_Mobius_Essence_10.1_SamuraiCrow/` | Upstream server. Do not edit; use `overrides/` |
| `overrides/game/` | Files copied over the game server each time it starts |
| `site/` | Laravel 13, Inertia, React 19, Filament 5 |
| `LISTING-KIT.md` | Text and site list for server toplists |

Production is the Raspberry Pi. The Mac runs a second copy of the stack. Website: https://l2-kage.itjunior.dev

## Current state

**Rates** (`overrides/game/config/Rates.ini`, a full copy of the default file with these values changed):

| Setting | Value |
|---|---|
| XP and SP, solo and party | x5 |
| Adena (`DropAmountMultiplierByItemId = 57,3`) | x3 |
| Drop and Spoil chance | x2 |
| Raid, herbs, quest rewards | x1 |
| Premium (`Custom/PremiumSystem.ini`) | Doubles XP, SP, Adena; drop and spoil amount x2 |

The website reads these files through `ServerStatus::rates()`, so it needs no change when rates change.
Rates moved from x1 to these values on 31 Oct 2026 because x1 is the most crowded rate on l2list (30 of 88 Essence listings).
That count is of listings, not players: l2list publishes no player numbers.

**Home page**
- Weekly Gift Box corner banner: `GiftBanner` in `site/resources/js/pages/home.tsx`, styled by `.gift-banner` in `site/resources/css/app.css`. Closing it is stored in `localStorage` under `gift-banner-closed`. Hidden below 768px.
- l2list button: in the footer of `site/resources/js/layouts/site-layout.tsx`. The image is a local copy, `site/public/assets/l2list-button.png`.

**Halloween event: Pumpkin Harvest** (31 Oct to 14 Nov 2026; the config's end date, `15 11 2026`, closes it at 00:00 UTC on the 15th)

Upstream's `SquashEvent`, reactivated through `overrides/game/data/scripts/events/SquashEvent/`:

| File | Change from upstream |
|---|---|
| `config.xml` | New dates and join and end messages |
| `SquashEvent.java` | Large pumpkins can drop the Halloween Kit (item 72074): chance 60 if ripe, 30 if withered. The script halves these rolls |
| `31860.htm` | Halloween text; the NPC is named Puss the Cat |
| `overrides/game/data/multisell/90318600.xml` | Now sells squash seeds. Upstream sold watermelon seeds, which this event can't use |

- Play: monsters drop Nectar (50% per kill). Puss the Cat, in 13 towns, trades it for seeds (10 or 20 Nectar) or a chrono instrument (100 to 300). Nectar grows a planted pumpkin. Large pumpkins can only be broken with a chrono instrument.
- Website: `SEASONAL` in `site/app/Services/L2j/EventFeed.php`, `lang/pt_BR.json`, `resources/js/data/event-lore.ts` and `event-lore-pt.ts`. `EventFeed` now reads `/l2j/events-overrides` over `/l2j/events`; this mount is in `docker-compose.yml`.
- Map: the event's 13 markers are pumpkins (`PUMPKIN_EVENT` in `site/resources/js/components/world-map.tsx`, `.is-pumpkin` in `app.css`), and each marks a real Puss the Cat. Player-planted pumpkins aren't shown, because the website can't see them.
- Home page: its banner is the seeded post `halloween-pumpkin-harvest` (`site/database/seeders/HalloweenNewsSeeder.php`), which ends by itself on 14 Nov.
- Status: loads on both servers with no errors in the logs. Not yet played through in the game client, so the NPC spawns, trades, planting and drops are unconfirmed.

**News**
- **Writing a post: read [docs/NEWS-WRITING-GUIDE.md](docs/NEWS-WRITING-GUIDE.md) first.** It covers voice, lore, fact-checking, both languages and publishing.
- Posts are in `news_posts` (`site/app/Models/NewsPost.php`), edited in the admin panel under News (`site/app/Filament/Resources/NewsPosts/`). Each has English and Portuguese text in Markdown. No publish date means draft; a future date schedules it.
- Pages: `/news` and `/news/{slug}` (`NewsController`, `resources/js/pages/news/`). Shared pieces are in `resources/js/components/news.tsx`.
- Home page: the section after Happening Now shows the 3 latest posts, hidden when there are none. `FeaturedBanner` shows the latest post marked as featured until its "Until" date.
- Uploaded images are in `data/site-uploads` on each host, mounted at `storage/app/public`. They aren't in git, so back them up with the database. The hosts have separate databases and uploads, so a post made in the Mac's admin panel doesn't reach the Pi.

**Toplists**

| Site | Status |
|---|---|
| l2list | The owner chose to submit it themselves; submission not confirmed. Free listing requires the button on the home page. A moderator could reject the footer position, because their own code uses a fixed corner. If so, move it back to a corner |
| Others in `LISTING-KIT.md` | Not started. Each needs the owner to create an account or get past a check first |

## Apply a change

- **Website:** rebuild the `site` image and run `docker compose up -d --no-deps site` on the Mac. For the Pi, build for `linux/arm64`, `docker save`, copy it over, `docker load`, then `docker compose up -d site` in `~/l2-kage`.
- **Game config or scripts:** copy the file to the same path under `~/l2-kage/` on the Pi, then `docker compose restart game` on each host. A restart disconnects players, so check who is online first and tell the owner.
- **Java scripts:** compile-check first. A failed script can stop features such as website deliveries. Copy the file into the game container, then run `javac -proc:none -nowarn -d /tmp/x -cp /opt/l2j/libs/GameServer.jar <file>`.
- **Verify rates:** `grep RateXp /opt/l2j/game/config/Rates.ini` in the game container, and read `rates` on the home page's Inertia data.

## Rules for AI agents

- This repository is public. Never commit IP addresses, usernames, `.env` values or other access details.
- Commit or push only when the owner asks. The default branch is `master`.
- The repository uses a cone-mode sparse checkout (`L2J_Mobius_Essence_10.1_SamuraiCrow`, `docker`, `overrides`, `site`). Use `git add --sparse`. After switching branches, confirm those folders are still there.
- `~/l2-server` on the Pi is a different server (Bartz). Do not read or change its data.
- All user-facing website text needs English and Portuguese: `t(en, pt)` in React, `__()` with `lang/pt_BR.json` in PHP.
- Cloudflare caches assets for 7 days. When replacing a file, use a new name or bump `?v=N`, and do not request the new URL until the new page is deployed.
- Do not create third-party accounts or solve CAPTCHAs on toplists. The owner does those. Only tick form options that are true of the server.
- Keep `LISTING-KIT.md` in line with the live rates, and update this file when the state above changes.
