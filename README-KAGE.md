# L2J Mobius Essence on Docker

This repository provides a Docker deployment for an **L2J Mobius Essence:
Samurai Crow** server (client protocol 542), together with an optional Laravel
website.

The stack runs the following services:

- MariaDB
- L2J Mobius login server
- L2J Mobius game server
- Optional Laravel website
- Optional Cloudflare Tunnel for publishing the website without opening an
  HTTP port

The repository contains server code and functional configuration only. It does
not include a game client or copyrighted client assets. Obtain and use the
client according to its applicable license and terms.

## Requirements

For a local deployment:

- Docker Desktop or Docker Engine with Docker Compose v2
- At least 8 GB of available memory when using geodata
- The source and data files required by the selected L2J Mobius chapter

For an ARM64 deployment such as a Raspberry Pi:

- A 64-bit ARM operating system
- Docker with Buildx support
- Enough memory and swap for the selected Java heap size

## Repository layout

```text
L2jmobius/
├── L2J_Mobius_Essence_10.1_SamuraiCrow/   L2J Mobius server sources
├── Dockerfile                              Login/game server image
├── docker-compose.yml                      Complete service stack
├── docker/                                 Entrypoint and database setup
├── overrides/game/                         Custom server files
├── site/                                   Optional Laravel website
├── build-pi.sh                             ARM64 image export script
├── .env.example                            Documented configuration template
└── data/                                   Local database, logs and geodata
```

The `data/` directory contains runtime state and is intentionally excluded from
Git. The `.env` file contains passwords and deployment-specific settings and
must never be committed.

## Configuration

Create the environment file before starting the stack:

```bash
cp .env.example .env
```

Replace every `change-me` value with a strong, unique value. For example:

```bash
openssl rand -hex 16
```

Important settings:

| Variable | Description |
|---|---|
| `SERVER_NAME` | Name shown by the website |
| `PUBLIC_HOST` | Hostname or IP address sent to game clients |
| `LOGIN_PORT` | External login-server port; defaults to `2106` |
| `GAME_PORT` | External game-server port; defaults to `7777` |
| `SITE_PORT` | Website port on the Docker host; defaults to `8082` |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD` | L2J game database settings |
| `DB_ROOT_PASSWORD` | MariaDB root password |
| `WEB_DB_PASSWORD`, `L2WEB_DB_PASSWORD` | Read-only game and website database passwords |
| `SITE_APP_KEY` | Laravel application key |
| `GAME_JAVA_OPTS` | Java options and heap size for the game server |
| `AUTO_CREATE_ACCOUNTS` | Whether a new game login creates an account |
| `WEBSITE_URL` | Canonical public URL for the website |
| `MAIL_*` | Optional SMTP settings for registration and password resets |
| `COMPOSE_PROFILES` | Set to `public` to enable the Cloudflare Tunnel |
| `CF_TUNNEL_TOKEN` | Cloudflare Tunnel token when the public profile is enabled |
| `TRUSTED_PROXIES` | Proxy networks trusted by the website |

Database passwords are used when MariaDB initializes its data directory. If
you change them after the first startup, update the existing database users
manually or remove the local database and initialize it again. Removing
`data/mariadb` permanently deletes the local game and website databases.

Generate a Laravel key after building the website image if needed:

```bash
docker compose build site
docker run --rm --entrypoint php l2jmobius-site:latest artisan key:generate --show
```

Copy the generated value into `SITE_APP_KEY` in `.env`.

## Start the stack

Build and start all standard services:

```bash
docker compose up -d --build
```

Follow the game-server logs:

```bash
docker compose logs -f game
```

The first startup creates the MariaDB schema and website database users. It
may take longer than subsequent startups. The game server is ready when it
reports that it has registered with the login server.

Useful commands:

```bash
docker compose ps
docker compose logs -f login
docker compose logs -f site
docker compose restart game
docker compose down
```

The website is available at:

```text
http://<host>:<SITE_PORT>
```

The login and game ports must be reachable by players. If the server is behind
a router, forward `LOGIN_PORT` and `GAME_PORT` to the Docker host. Do not
expose the MariaDB port publicly.

## Public website with Cloudflare Tunnel

The website can be published through Cloudflare without opening an HTTP port
on the router:

1. Create a Cloudflare Tunnel.
2. Configure its public hostname to route HTTP traffic to `http://site:80`.
3. Set the tunnel token in `.env`:

   ```dotenv
   COMPOSE_PROFILES=public
   CF_TUNNEL_TOKEN=<your-token>
   WEBSITE_URL=https://your-domain.example
   TRUSTED_PROXIES=172.16.0.0/12
   ```

4. Start or recreate the stack:

   ```bash
   docker compose up -d
   ```

Keep the tunnel token and all mail credentials private. Configure
`TRUSTED_PROXIES` to match the networks from which the proxy sends requests;
do not blindly trust arbitrary client-supplied proxy headers.

## ARM64 deployment

`build-pi.sh` builds both images for Linux ARM64 and creates a `dist/` folder
containing the images and runtime files. It does not copy `.env` or `data/`.

On an ARM64-capable build machine:

```bash
./build-pi.sh
```

Copy `dist/` to the target host using your preferred secure method. On the
target host:

```bash
cp .env.example .env
# Edit .env for the target host
docker load -i l2jmobius-arm64.tar.gz
docker compose up -d
```

Adjust `GAME_JAVA_OPTS` to match the available memory. Running without
geodata requires less memory, but disables geodata-dependent functionality.

## Connect a game client

Use a clean, legally obtained client compatible with the server protocol.
Configure its server address and login port according to the deployment:

```text
ServerAddr=<PUBLIC_HOST>
ServerPort=<LOGIN_PORT>
```

Some clients use a hosts-file entry or a client-specific configuration file
instead. Follow the documentation for the client and patch format you are
using. Do not distribute client files, private-server patches, or copyrighted
game assets from this repository.

When `AUTO_CREATE_ACCOUNTS=True`, a new game login can create an account
automatically. Otherwise, create accounts through the website or the relevant
database administration process.

## Accounts and GM access

Game accounts are stored in the L2J Mobius database. GM access belongs to a
character and should be changed while that character is offline:

```bash
docker compose exec db sh -c \
  'mariadb -uroot -p"$MARIADB_ROOT_PASSWORD" "$L2J_DB_NAME" \
  -e "UPDATE characters SET accesslevel = 100 WHERE char_name = \"CharacterName\" AND online = 0"'
```

In game, `//admin` opens the administrator panel for an authorized character.
Grant GM access only to trusted administrators.

## Updates and backups

Back up the following before updating:

- `data/mariadb/`
- `data/geodata/`
- `data/logs/`
- `.env`
- Any local files under `overrides/`

To update the server source or this deployment:

```bash
docker compose down
# Update the repository and review .env and overrides/
docker compose up -d --build
```

Do not delete `data/mariadb` unless you intentionally want to destroy the
databases. Test updates on a backup or separate environment first.

## Licensing and responsibility

The upstream L2J Mobius files retain their original license headers. The
upstream project notes that files may be covered by MIT or GPLv3 depending on
whether they have been rewritten; verify the header of each file you
redistribute or modify.

This repository does not provide legal advice. You are responsible for
complying with applicable laws, software licenses, game terms of service,
privacy rules, and hosting-provider policies in your jurisdiction.
