#!/usr/bin/env bash
# Builds the L2 Kage images for linux/arm64 (Raspberry Pi 5) and exports them, with everything else the Pi needs,
# to dist/ for copying to the Pi:
#   ./build-pi.sh && rsync -a dist/ junior@server.local:l2-kage/
#   ssh junior@server.local 'cd ~/l2-kage && docker load -i l2jmobius-arm64.tar.gz && docker compose up -d'
# The Pi's .env and data/ are never overwritten (dist/ has neither).
set -euo pipefail
cd "$(dirname "$0")"

CHAPTER=L2J_Mobius_Essence_10.1_SamuraiCrow

docker buildx build --platform linux/arm64 -t l2jmobius-essence:latest --load .
docker buildx build --platform linux/arm64 -t l2jmobius-site:latest --load site

rm -rf dist
mkdir -p dist
# One archive with both images: on the Pi, `docker load -i l2jmobius-arm64.tar.gz` loads them together.
docker save l2jmobius-essence:latest l2jmobius-site:latest | gzip > dist/l2jmobius-arm64.tar.gz
cp docker-compose.yml README-KAGE.md .env.example dist/
cp -R docker overrides dist/
# The parts of the sources the containers read at run time: the database scripts (first start), the default config
# (the website's rates) and the seasonal events (the website's "Happening now").
mkdir -p "dist/$CHAPTER/dist/db_installer" "dist/$CHAPTER/dist/game/data/scripts"
cp -R "$CHAPTER/dist/db_installer/sql" "dist/$CHAPTER/dist/db_installer/"
cp -R "$CHAPTER/dist/game/config" "dist/$CHAPTER/dist/game/"
cp -R "$CHAPTER/dist/game/data/scripts/events" "dist/$CHAPTER/dist/game/data/scripts/"
echo "Done: dist/ is ready to copy to the Pi"
ls -lh dist/l2jmobius-arm64.tar.gz
