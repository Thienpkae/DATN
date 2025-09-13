/* global proj4, ol */

// Đăng ký EPSG:3405 (VN-2000 / UTM zone 48N)
// Lưu ý: VN-2000 có nhiều biến thể 7 tham số; nếu cần độ chính xác cao so với WGS84,
// cập nhật towgs84 phù hợp khu vực Hà Nội. Ở đây dùng 0,0,0 để hiển thị tương đối.
proj4.defs(
  'EPSG:3405',
  '+proj=utm +zone=48 +ellps=WGS84 +units=m +no_defs +type=crs'
);
ol.proj.proj4.register(proj4);

const projectionVN2000 = ol.proj.get('EPSG:3405');

// Bảng màu tuần tự cho dc1..dc27 (xoay vòng nếu thiếu)
const palette = [
  ['#e74c3c', 'rgba(231, 76, 60, 0.35)'],
  ['#27ae60', 'rgba(39, 174, 96, 0.35)'],
  ['#2980b9', 'rgba(41, 128, 185, 0.35)'],
  ['#8e44ad', 'rgba(142, 68, 173, 0.30)'],
  ['#d35400', 'rgba(211, 84, 0, 0.30)'],
  ['#16a085', 'rgba(22, 160, 133, 0.30)'],
  ['#2c3e50', 'rgba(44, 62, 80, 0.22)'],
  ['#c0392b', 'rgba(192, 57, 43, 0.28)'],
  ['#7f8c8d', 'rgba(127, 140, 141, 0.22)']
];

function makeStyleByIndex(index) {
  const [strokeColor, fillColor] = palette[index % palette.length];
  return new ol.style.Style({
    // Dùng fill siêu trong suốt để bắt sự kiện hit bên trong polygon
    // (alpha rất nhỏ nên mắt thường coi như không tô màu)
    fill: new ol.style.Fill({ color: 'rgba(0,0,0,0.001)' }),
    stroke: new ol.style.Stroke({ color: strokeColor, width: 1.4 }),
  });
}

function createVectorLayer(url, style) {
  const format = new ol.format.GeoJSON();
  const source = new ol.source.Vector({
    loader: (extent, resolution, projection) => {
      fetch(url)
        .then((r) => r.json())
        .then((data) => {
          // Ép dữ liệu đầu vào là EPSG:3405 bất kể trường crs bên trong
          const features = format.readFeatures(data, {
            dataProjection: 'EPSG:3405',
            featureProjection: 'EPSG:3405',
          });
          source.addFeatures(features);
        })
        .catch((e) => console.error('Load vector failed:', url, e));
    },
  });
  return new ol.layer.Vector({
    source,
    style,
  });
}

// Tạo danh sách lớp dc1..dc27
const layers = [];
for (let i = 1; i <= 27; i += 1) {
  const style = makeStyleByIndex(i - 1);
  layers.push(createVectorLayer(`data/dc${i}.geojson`, style));
}

// Map view: dùng EPSG:3405 để hiển thị đúng toạ độ VN-2000 (không có nền OSM)
const map = new ol.Map({
  target: 'map',
  layers,
  view: new ol.View({
    projection: projectionVN2000,
    center: [568000, 2334800],
    zoom: 14,
  }),
});

map.addControl(new ol.control.ScaleLine());
map.addControl(new ol.control.ZoomSlider());

// Tooltip hover
const infoEl = document.createElement('div');
infoEl.style.position = 'absolute';
infoEl.style.pointerEvents = 'none';
infoEl.style.background = 'rgba(255,255,255,0.95)';
infoEl.style.border = '1px solid #ddd';
infoEl.style.borderRadius = '6px';
infoEl.style.padding = '6px 8px';
infoEl.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
infoEl.style.fontSize = '12px';
infoEl.style.display = 'none';
document.body.appendChild(infoEl);

function formatInfo(properties) {
  const thua = properties.thua ?? properties.THUA ?? properties.id ?? '';
  const dt = properties.dien_tich ?? properties.Dien_tich ?? properties.area ?? '';
  const loai = properties.loai_dat ?? properties.Loai_dat ?? '';
  const mdsd = properties.mdsd2003 ?? properties.MDSD2003 ?? '';
  const chu = properties.chu_su_dung ?? properties.Chu_su_dung ?? '';
  return `<div><b>Thửa:</b> ${thua}</div>
          <div><b>Diện tích:</b> ${dt}</div>
          <div><b>Loại đất:</b> ${loai}</div>
          <div><b>MDSD2003:</b> ${mdsd}</div>
          <div><b>Chủ SD:</b> ${chu}</div>`;
}

map.on('pointermove', (evt) => {
  const pixel = evt.pixel;
  let shown = false;
  map.forEachFeatureAtPixel(pixel, (feature) => {
    const props = feature.getProperties();
    infoEl.innerHTML = formatInfo(props);
    infoEl.style.left = `${pixel[0] + 12}px`;
    infoEl.style.top = `${pixel[1] + 12}px`;
    infoEl.style.display = 'block';
    shown = true;
    return true; // only first feature
  });
  if (!shown) infoEl.style.display = 'none';
});

// Fit extent sau khi tất cả lớp nạp xong
function whenSourcesReady(sources, callback) {
  let remaining = sources.length;
  sources.forEach((src) => {
    if (src.getState() === 'ready') {
      remaining -= 1;
      if (remaining === 0) callback();
    } else {
      const onChange = () => {
        if (src.getState() === 'ready') {
          src.un('change', onChange);
          remaining -= 1;
          if (remaining === 0) callback();
        }
      };
      src.on('change', onChange);
    }
  });
}

whenSourcesReady(
  layers.map((l) => l.getSource()),
  () => {
    const extents = layers
      .map((l) => l.getSource().getExtent())
      .filter((e) => e && !ol.extent.isEmpty(e));
    if (extents.length) {
      const union = extents.reduce((acc, cur) => (acc ? ol.extent.extend(acc, cur) : cur), null);
      map.getView().fit(union, { size: map.getSize(), padding: [20, 20, 20, 20], maxZoom: 18 });
    }
  }
);
