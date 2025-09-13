#!/usr/bin/env bash

set -euo pipefail

# Join thuộc tính từ dcX.txt vào polygon dcX_exact.geojson bằng cách dùng tâm (Tâm X/Y)
# Các bước mỗi tờ (dc1..dc27):
# 1) Chuyển txt dạng bảng '|' thành CSV utf-8 đơn giản
# 2) Tạo lớp điểm từ CSV (EPSG:3405) theo cặp cột tam_x/tam_y
# 3) Spatial join (ST_Contains) điểm vào polygon → dcX_with_attrs.geojson
# 4) Đồng bộ sang geogis-frontend/data/dcX.geojson

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TXT_DIR="$BASE_DIR/1-Ban Do dia chinh"
OUT_DIR="$BASE_DIR/final-output"
FE_DATA_DIR="$BASE_DIR/geogis-frontend/data"

START=${1:-1}
END=${2:-27}

mkdir -p "$OUT_DIR" "$FE_DATA_DIR"

for ((i=START; i<=END; i++)); do
  SHEET="dc${i}"
  TXT_PATH="$TXT_DIR/${SHEET}.txt"
  POLY_GJ="$OUT_DIR/${SHEET}_exact.geojson"
  CSV_PATH="$OUT_DIR/${SHEET}_attrs.csv"
  PTS_GJ="$OUT_DIR/${SHEET}_centroids.geojson"
  JOIN_GJ="$OUT_DIR/${SHEET}_with_attrs.geojson"

  if [[ ! -f "$TXT_PATH" || ! -f "$POLY_GJ" ]]; then
    echo "[WARN] Skip $SHEET (missing: TXT or polygons)"; continue
  fi

  echo "[INFO] Building attributes for $SHEET …"

  # 1) Parse TXT → CSV
  # - Bỏ dòng tiêu đề/đường kẻ, chỉ lấy các dòng có dấu '|' và số thứ tự thửa ở cột 2
  # - Tách trường theo '|', trim khoảng trắng 2 đầu
  awk -F'\|' 'BEGIN{OFS=","; print "thua,tam_x,tam_y,dien_tich,dt_pl,loai_dat,mdsd2003,chu_su_dung,dia_chi,sh_tam,xu_dong"}
    NR>3 && $0 ~ /\|/ {
      # Các cột theo bố cục: [1]=blank [2]=Thửa [3]=Tâm X [4]=Tâm Y [5]=Diện tích [6]=D/tích PL
      # [7]=Loại đất [8]=MDSD2003 [9]=Tên chủ [10]=Địa chỉ [11]=Sh Tam [12]=Xu dong
      for (i=1;i<=NF;i++){gsub(/^ +| +$/, "", $i)}
      if ($2 ~ /^[0-9]+$/) {
        # Escape dấu phẩy trong văn bản bằng thay thế tạm
        gsub(/,/, " ", $9); gsub(/,/, " ", $10); gsub(/,/, " ", $12);
        print $2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12
      }
    }' "$TXT_PATH" > "$CSV_PATH"

  # 2) CSV → điểm GeoJSON (VN2000 / UTM 48N)
  ogr2ogr -f GeoJSON "$PTS_GJ" "$CSV_PATH" \
    -oo X_POSSIBLE_NAMES=tam_x -oo Y_POSSIBLE_NAMES=tam_y \
    -oo KEEP_GEOM_COLUMNS=NO -a_srs EPSG:3405 -nln centroids 1>/dev/null

  # 3) Spatial join: polygon chứa điểm
  ogr2ogr -f GeoJSON "$JOIN_GJ" "$POLY_GJ" \
    -dialect SQLite \
    -sql "SELECT p.geometry, p.*, c.thua, c.dien_tich, c.dt_pl, c.loai_dat, c.mdsd2003, c.chu_su_dung, c.dia_chi FROM 'SELECT' AS p LEFT JOIN '$PTS_GJ'.centroids AS c ON ST_Contains(p.geometry, c.geometry)" 1>/dev/null

  # 4) Đồng bộ sang frontend
  cp -f "$JOIN_GJ" "$FE_DATA_DIR/${SHEET}.geojson"
  echo "[OK] $SHEET joined → $(realpath --relative-to="$BASE_DIR" "$JOIN_GJ")" 
done

echo "[DONE] Attribute integration finished."


