#!/bin/bash
# L2 Kage's login announcements, replacing L2J Mobius' stock ones. Runs once on first start, after 10-l2j.sh;
# safe to re-run (docker compose exec db bash /docker-entrypoint-initdb.d/30-kage.sh), then restart the game server.
set -euo pipefail

mariadb -uroot -p"${MARIADB_ROOT_PASSWORD}" "${L2J_DB_NAME:-l2jmobiusessence}" <<'SQL'
DELETE FROM announcements WHERE author IN ('L2jMobius', 'L2 Kage');
INSERT INTO announcements (type, author, content) VALUES
(0, 'L2 Kage', 'Welcome to L2 Kage!'),
(0, 'L2 Kage', 'Have fun and good hunting, warrior.');
SQL
echo "L2 Kage: announcements set"
