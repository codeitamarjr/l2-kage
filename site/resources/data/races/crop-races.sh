#!/usr/bin/env bash
# Re-cuts the race portraits (2:3) from races-guide.avif into site/public/assets/. macOS only (uses sips).
# Each line: race  x  y  width   (height = width * 1.5). Tweak and re-run.
set -euo pipefail
cd "$(dirname "$0")"
tmp=$(mktemp -d)
sips -s format png races-guide.avif --out "$tmp/races.png" >/dev/null
while read -r race x y w; do
	h=$(( w * 3 / 2 ))
	sips -s format jpeg -s formatOptions 90 -c "$h" "$w" --cropOffset "$y" "$x" "$tmp/races.png" \
		--out "../../../public/assets/race-$race.jpg" >/dev/null
	echo "race-$race.jpg ${w}x${h}"
done <<'CROPS'
human   12   378 246
elf     266  378 222
darkelf 496  400 242
orc     746  371 248
dwarf   1002 402 242
kamael  1258 378 262
CROPS
rm -rf "$tmp"
