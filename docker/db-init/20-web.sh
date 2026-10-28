#!/bin/bash
# The website's database users. Runs once when MariaDB starts with an empty data folder, after 10-l2j.sh.
# Safe to re-run on an existing database:
#   docker compose exec db bash /docker-entrypoint-initdb.d/20-web.sh
#
#   web    reads the game database; creates accounts and changes their password / email (registration, resets)
#   l2web  owns the website's own database (admins, sessions, the item database, the game action queue)
#   the L2J user reads and updates l2web, where the WebBridge script inside the game server takes its queue
set -euo pipefail

if [ -z "${WEB_DB_PASSWORD:-}" ] || [ -z "${L2WEB_DB_PASSWORD:-}" ]; then
	echo "Website: WEB_DB_PASSWORD or L2WEB_DB_PASSWORD not set, skipping the website database users."
	exit 0
fi

db="${L2J_DB_NAME:-l2jmobiusessence}"
web_pass=${WEB_DB_PASSWORD//\'/\'\'}
l2web_pass=${L2WEB_DB_PASSWORD//\'/\'\'}

mariadb -uroot -p"${MARIADB_ROOT_PASSWORD}" <<SQL
CREATE USER IF NOT EXISTS 'web'@'%' IDENTIFIED BY '${web_pass}';
ALTER USER 'web'@'%' IDENTIFIED BY '${web_pass}';
GRANT SELECT ON \`${db}\`.* TO 'web'@'%';
GRANT INSERT (login, password, email, accessLevel) ON \`${db}\`.accounts TO 'web'@'%';
GRANT UPDATE (password, email) ON \`${db}\`.accounts TO 'web'@'%';

CREATE DATABASE IF NOT EXISTS \`l2web\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'l2web'@'%' IDENTIFIED BY '${l2web_pass}';
ALTER USER 'l2web'@'%' IDENTIFIED BY '${l2web_pass}';
GRANT ALL PRIVILEGES ON \`l2web\`.* TO 'l2web'@'%';

GRANT SELECT, UPDATE ON \`l2web\`.* TO '${MARIADB_USER}'@'%';
FLUSH PRIVILEGES;
SQL
echo "Website: database users 'web' and 'l2web' and database 'l2web' are ready."
