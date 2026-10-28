#!/bin/bash
# Runs once, when MariaDB starts with an empty data folder: creates the L2J database and loads the
# login and game tables (the same files the DatabaseInstaller uses). The scripts drop and recreate their
# tables, so they are never run again on an existing database.
set -euo pipefail

db="${L2J_DB_NAME:-l2jmobiusessence}"

mariadb -uroot -p"${MARIADB_ROOT_PASSWORD}" <<SQL
CREATE DATABASE IF NOT EXISTS \`${db}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON \`${db}\`.* TO '${MARIADB_USER}'@'%';
FLUSH PRIVILEGES;
SQL

for part in login game; do
	for f in $(ls /l2j-sql/"$part"/*.sql | sort -f); do
		echo "L2J: loading $part/$(basename "$f")"
		mariadb -uroot -p"${MARIADB_ROOT_PASSWORD}" "$db" < "$f"
	done
done
echo "L2J: database ${db} installed"
