#!/usr/bin/env bash

set -euo pipefail

# Usage:
#   ./scripts/extract_parcels.sh                # process dc1..dc27
#   ./scripts/extract_parcels.sh 4 27           # process dc4..dc27
#   ./scripts/extract_parcels.sh 2 2            # process dc2 only

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DGN_DIR="$BASE_DIR/1-Ban Do dia chinh"
OUT_DIR="$BASE_DIR/final-output"
FE_DATA_DIR="$BASE_DIR/geogis-frontend/data"

START=${1:-1}
END=${2:-27}

mkdir -p "$OUT_DIR" "$FE_DATA_DIR"

echo "[INFO] Extracting polygons (Type=6, Level=53) EPSG:3405 from dc${START}..dc${END}"

for ((i=START; i<=END; i++)); do
  DGN_PATH="$DGN_DIR/dc${i}.dgn"
  OUT_PATH="$OUT_DIR/dc${i}_exact.geojson"
  FE_PATH="$FE_DATA_DIR/dc${i}.geojson"

  if [[ ! -f "$DGN_PATH" ]]; then
    echo "[WARN] Missing DGN: $DGN_PATH — skipping"
    continue
  fi

  echo "[INFO] Processing dc${i} …"

  # Extract only polygon features (Type=6) at Level 53. Assign VN-2000 / UTM 48N.
  # If some sheets also use Level 63 for parcel fill/outer ring, it can be added later.
  ogr2ogr -f GeoJSON "$OUT_PATH" "$DGN_PATH" \
    -dialect SQLite \
    -sql "SELECT geometry FROM elements WHERE Type=6 AND Level IN (53)" \
    -a_srs EPSG:3405 1>/dev/null

  # Quick sanity: show feature count
  COUNT=$(ogrinfo "$OUT_PATH" -so -al | awk '/Feature Count/ {print $3; exit}')
  echo "[OK] dc${i}: $COUNT features => $(realpath --relative-to="$BASE_DIR" "$OUT_PATH")"

  # Copy to frontend data for quick viewing
  cp -f "$OUT_PATH" "$FE_PATH"
done

echo "[DONE] Extraction finished. Files are in: $OUT_DIR and mirrored to $FE_DATA_DIR"


