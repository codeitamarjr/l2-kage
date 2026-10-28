# L2 Kage — Lineage II Essence (Samurai Crow) on Docker

L2 Kage is a Lineage II **Essence: Samurai Crow** server (client protocol **542**, EU) built on
[L2J Mobius](https://gitlab.com/MobiusDevelopment/L2J_Mobius), with its website. Everything runs in Docker: MariaDB,
the login server, the game server, the website (Laravel + Inertia + React + Filament) and, on the Pi, a Cloudflare
Tunnel for the public site.

`README.md` in this folder is L2J Mobius' own; this file is about L2 Kage.

| Where | Website | Login / game ports | Folder |
|---|---|---|---|
| Raspberry Pi (public) | https://l2-kage.itjunior.dev (LAN: http://192.168.0.195:8082) | 2107 / 7778 | `~/l2-kage` on `junior@server.local` |
| This Mac (development) | http://192.168.0.247:8082 | 2106 / 7777 | `~/Downloads/L2jmobius` |

The Pi also runs the High Five server **Bartz** (`~/l2-server`, ports 2106 / 7777 / 8080, https://l2-bartz.itjunior.dev).
The two stacks are separate: their own folders, databases, ports and tunnels.

## Layout

```
L2jmobius/
├── L2J_Mobius_Essence_10.1_SamuraiCrow/   L2J Mobius sources (git sparse checkout of this chapter only)
├── Dockerfile                  server image: Ant + JDK 27 build -> runtime (login + game in one image)
├── docker/entrypoint.sh        `l2j login | game`: writes DB/ports/address into the configs, copies overrides
├── docker/db-init/             run once on an empty database: 10 tables, 20 website users, 30 announcements
├── docker-compose.yml          db, login, game, site, tunnel (tunnel only with COMPOSE_PROFILES=public)
├── overrides/game/             copied over the server files at every start (survives source updates)
│   ├── config/Custom/ScreenWelcomeMessage.ini     "Welcome to L2 Kage!" on screen at login
│   ├── data/stats/players/initialEquipment.xml    starting items + 1,000 L-Coin for every new character
│   └── data/scripts/custom/WebBridge/             delivers website gifts and admin items in game
├── site/                       the website (see site/README.md)
├── build-pi.sh                 builds the arm64 images and dist/ for the Pi
├── data/                       MariaDB data, logs, geodata (not in the images, never copied by build-pi.sh)
├── .env.example                every setting, documented: copy to .env
└── .env                        passwords and settings (never copied by build-pi.sh, never committed)
```

`.gitignore` keeps `.env` (and its `.env.backup-*` copies), `data/` and `dist/` out of git; the website's own secrets
and dependencies are in `site/.gitignore`. `.dockerignore` keeps them, and `site/`, out of the server image build.

## Settings (`.env`)

Start from the example and replace every `change-me` with a random value (`openssl rand -hex 16`):

```bash
cp .env.example .env
docker run --rm --entrypoint php l2jmobius-site:latest artisan key:generate --show   # SITE_APP_KEY (after the first build)
```

| Key | What | Mac | Pi |
|---|---|---|---|
| `PUBLIC_HOST` | Address the login server sends game clients to | `192.168.0.247` | `play.l2-bartz.itjunior.dev` (home IP) |
| `LOGIN_PORT` / `GAME_PORT` | Ports players connect to (the game server really listens on `GAME_PORT`) | 2106 / 7777 (default) | 2107 / 7778 |
| `SITE_PORT` | Website port on the host | 8082 | 8082 |
| `DB_*`, `WEB_DB_PASSWORD`, `L2WEB_DB_PASSWORD` | Database passwords, baked into the database on first start | random | random |
| `SITE_APP_KEY` | Laravel key (changing it signs everyone out) | random | random |
| `GAME_JAVA_OPTS` | Game server memory | `-Xms2g -Xmx6g` (with geodata) | `-Xms1g -Xmx3g` (no geodata) |
| `COMPOSE_PROFILES=public`, `CF_TUNNEL_TOKEN` | Starts the Cloudflare Tunnel | — | set |
| `WEBSITE_URL` | Public site address (links in emails, canonical URLs) | — | `https://l2-kage.itjunior.dev` |
| `TRUSTED_PROXIES` | Trust https / client IP headers from the tunnel only | — | `172.16.0.0/12` |
| `MAIL_*` | Email for registration and password resets (Amazon SES, SMTP) | `log` (off) | SES eu-west-1 |
| `AUTO_CREATE_ACCOUNTS` | Logging in with a new name creates the account | `True` | `True` |

Never put `L2WEB_DB_PASSWORD` or the DB passwords out of step with the database: they are set when the database is
first created. Edit `.env`, then `docker compose up -d` to apply it.

## Run on the Mac

```bash
cp .env.example .env           # first time only; fill it in (see Settings)
docker compose up -d --build
docker compose logs -f game        # ready at "Registered on login as Server 2"
```

The first start creates the database (`docker/db-init/`), so the game server's first start takes a little longer.
Geodata is in `data/geodata/` (224 regions, 2.2 GB, from `geodata_542.zip`): it needs the 6 GB game server and
about 6.5 GB of Docker Desktop's memory in total; give Docker Desktop ~10 GB (Settings → Resources).

## Deploy and update the Pi

The Pi (`junior@server.local`, 192.168.0.195, Raspberry Pi 5, 8 GB) runs Kage next to Bartz. It has an 8 GB swap file
(`/swapfile`, in `/etc/fstab`) because both game servers don't fit in memory; Kage runs **without geodata** at 3 GB.

```bash
./build-pi.sh                                         # arm64 images + dist/
rsync -a dist/ junior@server.local:l2-kage/           # never touches .env or data/
ssh junior@server.local 'cd ~/l2-kage && docker load -i l2jmobius-arm64.tar.gz && docker compose up -d'
```

`dist/` holds the images, `docker-compose.yml`, `docker/`, `overrides/` and the parts of the sources the containers
read at run time (database scripts, default config, seasonal events). The game server takes ~3 minutes to start on
the Pi.

First install (already done): copy `dist/`, `cp .env.example .env` and fill it in with the Pi's values (ports
2107 / 7778, 3 GB, the tunnel and mail keys; see Settings), `docker compose up -d db` (creates the database, the
website users and the announcements), then `docker compose up -d`.

### Public website (Cloudflare Tunnel)

In Cloudflare Zero Trust → Tunnels, the Kage tunnel has the public hostname `l2-kage.itjunior.dev` → `HTTP` →
`site:80`. Its token is `CF_TUNNEL_TOKEN` in the Pi's `.env`, with `COMPOSE_PROFILES=public`. No web port is opened on
the router; HTTPS is Cloudflare's.

### Router

Only for players outside the home network: forward TCP **2107** and **7778** to the Pi (Bartz uses 2106 and 7777).

### Email

Amazon SES (eu-west-1) over SMTP, from `no-reply@mail.itjunior.dev`: `MAIL_MAILER=smtp` and the `MAIL_*` keys in the Pi's
`.env`. With `MAIL_MAILER=log` (the Mac), website registration and "forgot password" stay closed; players create
accounts by logging in to the game.

## Connect the game client

1. Download a **clean, unmodified** Essence: Samurai Crow EU 542 client:
   https://www.lineage2.org.uk/download/lineage-ii-essence-samurai-crow-eu-542/ (also linked on the About page).
   Repacked clients from other servers can carry altered files or malware.
2. Apply a private-server **system patch** for protocol 542 (the official client only talks to 4game).
3. In the patched `system/L2.ini`: `ServerAddr=<address>` and, for the Pi, `ServerPort=2107`.
   The hosts-file trick (`<address> l2authd.lineage2.com`) only works on port 2106, so on the Pi use `L2.ini`.
4. Start `system/l2.exe` (not the 4game launcher) and log in with any new name and password: the account is created.

| Server | Address | Port |
|---|---|---|
| Pi, from the internet | `play.l2-bartz.itjunior.dev` | 2107 |
| Pi, from the home network | `192.168.0.195` | 2107 |
| Mac | `192.168.0.247` | 2106 |

## Accounts, GMs and admins

- **Game accounts** are created by logging in (`AUTO_CREATE_ACCOUNTS=True`) or on the website (when email is on).
- **GM rights** belong to the character (`characters.accesslevel`; 100 = Master). Set them while the character is
  **offline**, or the game server writes the old value back on logout:
  ```bash
  docker compose exec db sh -c 'mariadb -uroot -p"$MARIADB_ROOT_PASSWORD" l2jmobiusessence -e "UPDATE characters SET accesslevel = 100 WHERE char_name = \"jR\" AND online = 0"'
  ```
  In game, `//admin` opens the admin panel.
- **Website admins** (Filament, `/admin`) are separate from game accounts:
  ```bash
  docker compose exec site php artisan make:filament-user
  ```

## What L2 Kage changes

| What | Where | Applied |
|---|---|---|
| Screen welcome "Welcome to L2 Kage!" | `overrides/game/config/Custom/ScreenWelcomeMessage.ini` | game restart |
| Chat announcements at login | `docker/db-init/30-kage.sh` (first start); in game: `//announces` | game restart |
| 1,000 L-Coin for every new character | `overrides/game/data/stats/players/initialEquipment.xml` | game restart |
| Weekly gift box: 1,000 L-Coin guaranteed | `site/config/l2j.php` (`gift_box`) | site rebuild |
| Website gifts / admin items delivered in game | `overrides/game/data/scripts/custom/WebBridge/WebBridge.java` | game restart |

Any file in `overrides/game` (or `overrides/login`) is copied over the server's own at every start: to change a config,
copy it from `L2J_Mobius_Essence_10.1_SamuraiCrow/dist/game/config/` into `overrides/game/config/` and edit it there.
If an upstream update changes `initialEquipment.xml`, merge it into the override by hand.

### L-Coin

L-Coin is item 91663. Players get 1,000 on character creation and in every weekly gift box. GMs can give more:
`//create_item 91663 1000` or `//give_item_target 91663 1000`, or the website admin (Send Item). Monster and raid boss
L-Coin drops are off by default (`LCoinDropEnable`, `BossDropEnable` in `Rates.ini`; override them to turn them on).

### Seasonal events

L2J Mobius ships events with long date ranges: **Leona's Dungeon** and **Legend of the Water Temple** (NPCs in Giran
and Aden, until 2034) and **Letter Collector** (word packs from monsters level 40+, until 2029). The website reads the
same `config.xml` files, so the "Happening now" cards follow the server.

## Updating the sources

```bash
git -C . pull                  # L2J Mobius (only this chapter is checked out: git sparse-checkout)
docker compose up -d --build   # Mac
./build-pi.sh && ...           # Pi, as above
```

After a datapack update, rebuild the website's game data too (`site/README.md`, "Game data").

## Troubleshooting

- **Client stays on "loading"**: it isn't reaching the login server. Check the address and port in `L2.ini`, that
  `Test-NetConnection <address> -Port <login port>` succeeds, and that the account appears in the database.
- **`OutOfMemoryError` in the game log**: the game server needs more heap (`GAME_JAVA_OPTS`); with geodata at least 6 GB.
- **Site works elsewhere but not on this Mac after DNS changes**: flush the Mac's DNS cache:
  `sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder`.
- **Port already in use**: another program has 8081/8082 or 2106/7777; change `SITE_PORT`, `LOGIN_PORT`, `GAME_PORT`.
- **Logs**: `docker compose logs -f game|login|site|tunnel`, and `data/logs/` for the servers' own log files.
