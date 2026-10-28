#!/usr/bin/env bash
# Rebuilds the world map assets from aden-world-map.jpg (1977 x 2620, the High Five world map). Needs Docker.
#  - public/assets/map/aden-world-map.webp: the image the site shows.
#  - aden-world-map-land.pbm: a land mask, 1 cell per 20 px (1 = land, 0 = blank parchment), so WorldMap can tell
#    spawns drawn on land from those that only land on the parchment (instance zones, Hellbound's interior...).
set -euo pipefail
cd "$(dirname "$0")"
docker run --rm -v "$PWD":/w -v "$PWD/../../../public/assets/map":/out -w /w alpine:3.22 sh -c '
	apk add -q imagemagick imagemagick-jpeg imagemagick-webp >/dev/null
	magick aden-world-map.jpg -quality 80 -define webp:method=6 /out/aden-world-map.webp
	# Parchment is light (HSL lightness ~57-73%), land dark (~15-39%): blur, shrink and split at 48%.
	magick aden-world-map.jpg -colorspace HSL -channel B -separate +channel -blur 0x6 -resize 99x131\! \
		-threshold 48% -compress none aden-world-map-land.pbm
'
echo "aden-world-map.webp and aden-world-map-land.pbm rebuilt"
