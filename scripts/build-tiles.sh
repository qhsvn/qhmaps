#!/usr/bin/env bash
# Tạo tile vector tự host từ dữ liệu OpenStreetMap.
#
#   npm run tiles                      # TP.HCM -> data/hcmc.pmtiles
#   BOUNDS=world AREA=vietnam npm run tiles
#   OSM_FILE=~/vn.osm.pbf npm run tiles  # dùng file OSM có sẵn
#
# Dùng Planetiler (lược đồ OpenMapTiles, khớp với styles/google-like.json).
# Chỉ cần mạng ở lần chạy đầu để tải dữ liệu; sau đó bản đồ chạy hoàn toàn từ file
# PMTiles, không cần API hay key nào. Cần Java 21+ (hoặc Docker, đặt USE_DOCKER=1).
set -euo pipefail

cd "$(dirname "$0")/.."
mkdir -p data/sources

AREA=${AREA:-vietnam}
# Khung bao TP.HCM (lon/lat: tây,nam,đông,bắc). BOUNDS=world để lấy cả file OSM.
BOUNDS=${BOUNDS:-106.35,10.35,107.05,11.20}
OUTPUT=${OUTPUT:-data/hcmc.pmtiles}
OSM_FILE=${OSM_FILE:-data/sources/$AREA.osm.pbf}
PLANETILER_VERSION=${PLANETILER_VERSION:-0.10.2}
JAR=data/sources/planetiler-$PLANETILER_VERSION.jar

args=(
  --osm-path="$OSM_FILE"
  --output="$OUTPUT"
  --download_dir=data/sources
  --download             # tải water polygons, Natural Earth, lake centerlines nếu thiếu
  --languages=vi,en      # giữ name:vi cho nhãn tiếng Việt
  --maxzoom=14
  --force
)
[[ "$BOUNDS" != world ]] && args+=(--bounds="$BOUNDS")

if [[ ! -f "$OSM_FILE" ]]; then
  echo "Tải dữ liệu OSM $AREA từ Geofabrik..."
  curl -fL -o "$OSM_FILE" "https://download.geofabrik.de/asia/$AREA-latest.osm.pbf"
fi

if [[ "${USE_DOCKER:-0}" == 1 ]]; then
  docker run --rm -v "$PWD/data:/data" "ghcr.io/onthegomap/planetiler:$PLANETILER_VERSION" \
    "${args[@]//data\//\/data\/}"
else
  if [[ ! -f "$JAR" ]]; then
    curl -fL -o "$JAR" "https://github.com/onthegomap/planetiler/releases/download/v$PLANETILER_VERSION/planetiler.jar"
  fi
  java -Xmx${JAVA_MEM:-4g} -jar "$JAR" "${args[@]}"
fi

echo "Xong: $OUTPUT"
