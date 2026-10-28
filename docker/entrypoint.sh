#!/bin/sh
# Writes the container settings into the server configs, then runs the login or game server in the foreground.
#   l2j login | l2j game
set -eu

DB_HOST="${DB_HOST:-db}"
DB_NAME="${DB_NAME:-l2jmobiusessence}"
DB_USER="${DB_USER:-l2j}"
DB_PASSWORD="${DB_PASSWORD:-}"
LOGIN_HOST="${LOGIN_HOST:-login}"
PUBLIC_HOST="${PUBLIC_HOST:-127.0.0.1}"

db_url="jdbc:mysql://${DB_HOST}/${DB_NAME}?useUnicode=true\&characterEncoding=utf-8\&allowPublicKeyRetrieval=true\&useSSL=false\&connectTimeout=10000\&interactiveClient=true\&sessionVariables=wait_timeout=600,interactive_timeout=600\&autoReconnect=true"

# set_ini FILE KEY VALUE — replaces "KEY = ..." in an .ini file.
set_ini() {
	sed -i "s|^\s*$2\s*=.*|$2 = $3|" "$1"
}

configure_common() {
	dir="$1"
	set_ini "$dir/config/Database.ini" URL "$db_url"
	set_ini "$dir/config/Database.ini" Login "$DB_USER"
	set_ini "$dir/config/Database.ini" Password "$DB_PASSWORD"
	set_ini "$dir/config/Interface.ini" EnableGUI False
}

# Copies ./overrides/<server> (mounted at /opt/l2j/overrides/<server>) over the server folder,
# so custom configs and html survive updates of the sources.
apply_overrides() {
	if [ -d "/opt/l2j/overrides/$1" ]; then
		cp -r "/opt/l2j/overrides/$1/." "/opt/l2j/$1/"
	fi
}

case "${1:-game}" in
	login)
		cd /opt/l2j/login
		apply_overrides login
		configure_common .
		# Listen for game servers on all interfaces: the game server runs in another container.
		set_ini config/Server.ini LoginHostname 0.0.0.0
		set_ini config/Server.ini AutoCreateAccounts "${AUTO_CREATE_ACCOUNTS:-True}"
		exec java ${LOGIN_JAVA_OPTS:-$(cat java.cfg)} -jar ../libs/LoginServer.jar
		;;
	game)
		cd /opt/l2j/game
		apply_overrides game
		configure_common .
		set_ini config/Server.ini LoginHost "$LOGIN_HOST"
		# The port clients connect to; the login server hands it out, so it must match the published port.
		set_ini config/Server.ini GameserverPort "${GAME_PORT:-7777}"
		# Address the login server hands to game clients: the host's address, not the container's.
		cat > config/ipconfig.xml <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<gameserver address="${PUBLIC_HOST}" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="../data/xsd/ipconfig.xsd">
	<define subnet="127.0.0.0/8" address="${PUBLIC_HOST}" />
</gameserver>
EOF
		exec java ${GAME_JAVA_OPTS:-$(cat java.cfg)} -jar ../libs/GameServer.jar
		;;
	*)
		exec "$@"
		;;
esac
