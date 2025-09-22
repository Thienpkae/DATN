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

// Biến cho chức năng tách thửa đất
let isSplitMode = false;
let selectedPoints = [];
let selectedFeature = null;
let splitLayer = null;

// Bảng màu theo MDSD2003 (đầy đủ theo thống kê data)
const defaultBorderColor = '#2c3e50'; // Màu viền đồng nhất cho tất cả
const mdsdColors = {
  // Các loại chính (số lượng lớn) - màu tô trong đồng nhất (alpha = 1)
  'LUC': [defaultBorderColor, 'rgba(241, 196, 15, 1)'], // Đất chuyên trồng lúa nước (2983 thửa) - vàng lúa
  'ONT': [defaultBorderColor, 'rgba(39, 174, 96, 1)'], // Đất ở tại nông thôn (2402 thửa) - xanh lá đậm
  'BHK': [defaultBorderColor, 'rgba(46, 204, 113, 1)'], // Đất bằng trồng cây hàng năm khác (1348 thửa) - xanh non
  'SKC': [defaultBorderColor, 'rgba(230, 126, 34, 1)'], // Đất cơ sở sản xuất phi nông nghiệp (962 thửa) - cam đất
  'DTL': [defaultBorderColor, 'rgba(52, 152, 219, 1)'], // Đất thủy lợi (277 thửa) - xanh nước
  'DGT': [defaultBorderColor, 'rgba(149, 165, 166, 1)'], // Đất giao thông (142 thửa) - xám bê tông
  'LNQ': [defaultBorderColor, 'rgba(155, 89, 182, 1)'], // Đất trồng cây ăn quả lâu năm (62 thửa) - tím nhạt
  'NTS': [defaultBorderColor, 'rgba(26, 188, 156, 1)'], // Đất nuôi trồng thủy sản (38 thửa) - xanh ngọc
  'TIN': [defaultBorderColor, 'rgba(192, 57, 43, 1)'], // Đất tín ngưỡng (30 thửa) - đỏ gạch, màu tâm linh
  'NTD': [defaultBorderColor, 'rgba(127, 140, 141, 1)'], // Nghĩa trang dân (17 thửa)
  'BCS': [defaultBorderColor, 'rgba(243, 156, 18, 1)'], // Bằng cấp sở (15 thửa)
  'MNC': [defaultBorderColor, 'rgba(142, 68, 173, 1)'], // Mặt nước (10 thửa)
  'DVH': [defaultBorderColor, 'rgba(211, 84, 0, 1)'], // Dịch vụ (6 thửa)
  'DYT': [defaultBorderColor, 'rgba(192, 57, 43, 1)'], // Đất y tế (5 thửa)
  'TSK': [defaultBorderColor, 'rgba(44, 62, 80, 1)'], // Thủy sản (3 thửa)
  'TSC': [defaultBorderColor, 'rgba(127, 140, 141, 1)'], // Thủy sản (3 thửa)
  'DNL': [defaultBorderColor, 'rgba(22, 160, 133, 1)'], // Đất nông lâm (3 thửa)
  'DGD': [defaultBorderColor, 'rgba(241, 196, 15, 1)'], // Đất giáo dục (3 thửa)
  'DCH': [defaultBorderColor, 'rgba(231, 76, 60, 1)'], // Đất chuyên (3 thửa)
  'SON': [defaultBorderColor, 'rgba(52, 152, 219, 1)'], // Sông (1 thửa)
  'DRA': [defaultBorderColor, 'rgba(155, 89, 182, 1)'], // Đất rau (1 thửa)
  'default': [defaultBorderColor, 'rgba(189, 195, 199, 1)'] // Mặc định
};

function getStyleByMDSD(mdsd) {
  // Tô màu theo mdsd2003
  let [_, fillColor] = mdsdColors[mdsd] || mdsdColors.default; // Bỏ qua strokeColor từ mdsdColors
  return new ol.style.Style({
    fill: new ol.style.Fill({ color: fillColor }), // Tô màu bên trong
    stroke: new ol.style.Stroke({ color: defaultBorderColor, width: 2.5 }), // Viền đồng nhất màu đậm
  });
}

function makeStyleByIndex(index) {
  // Tạm thời dùng màu mặc định, sẽ được cập nhật khi load dữ liệu
  const [_, fillColor] = mdsdColors.default; // Bỏ qua strokeColor từ mdsdColors
  return new ol.style.Style({
    fill: new ol.style.Fill({ color: fillColor }),
    stroke: new ol.style.Stroke({ color: defaultBorderColor, width: 2.5 }), // Viền đồng nhất màu đậm
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
    style: function(feature) {
      // Tô màu theo mdsd2003
      const mdsd = feature.get('mdsd2003') || feature.get('MDSD2003') || '';
      return getStyleByMDSD(mdsd);
    },
  });
}

// Tạo danh sách lớp dc1..dc27
const layers = [];
for (let i = 1; i <= 27; i += 1) {
  const style = makeStyleByIndex(i - 1);
  const layer = createVectorLayer(`data/dc${i}.geojson`, style);
  layer.set('name', `dc${i}`); // Đặt tên layer để có thể lấy số tờ
  layers.push(layer);
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

// Hiển thị tọa độ ở góc dưới phải
const coordsEl = document.createElement('div');
coordsEl.id = 'coords';
coordsEl.style.cssText = `
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(0,0,0,0.7);
  color: white;
  padding: 5px 10px;
  border-radius: 3px;
  font-family: monospace;
  font-size: 12px;
  z-index: 1000;
`;
document.body.appendChild(coordsEl);

function formatInfo(properties, layerName) {
  // Lấy số tờ từ tên layer (dc1 -> tờ 1, dc2 -> tờ 2, ...)
  const soTo = layerName ? layerName.replace('dc', '') : '';
  const soThua = properties.thua ?? properties.THUA ?? properties.id ?? '';
  const dienTich = properties.dien_tich ?? properties.Dien_tich ?? properties.area ?? '';
  const loaiDat = properties.loai_dat ?? properties.Loai_dat ?? '';
  const mdsd2003 = properties.mdsd2003 ?? properties.MDSD2003 ?? '';
  const chuSuDung = properties.chu_su_dung ?? properties.Chu_su_dung ?? properties.ten_chu ?? '';
  const diaChi = properties.dia_chi ?? properties.Dia_chi ?? '';
  const dienTichPhapLy = properties.dien_tich_phap_ly ?? properties.Dien_tich_phap_ly ?? '';
  const trangThaiPhapLy = properties.trang_thai_phap_ly ?? properties.Trang_thai_phap_ly ?? '';
  
  let info = '';
  if (soTo) info += `<div><b>Số tờ bản đồ:</b> ${soTo}</div>`;
  if (soThua) info += `<div><b>Số thửa:</b> ${soThua}</div>`;
  if (dienTich) info += `<div><b>Diện tích:</b> ${dienTich} m²</div>`;
  if (loaiDat) info += `<div><b>Loại đất:</b> ${loaiDat}</div>`;
  if (mdsd2003) info += `<div><b>MDSD2003:</b> ${mdsd2003}</div>`;
  if (chuSuDung) info += `<div><b>Chủ sử dụng:</b> ${chuSuDung}</div>`;
  if (diaChi) info += `<div><b>Địa chỉ:</b> ${diaChi}</div>`;
  
  // Hiển thị dữ liệu pháp lý
  const hasLegalData = (dienTichPhapLy && dienTichPhapLy !== '' && dienTichPhapLy !== '0') || 
                      (trangThaiPhapLy && trangThaiPhapLy !== '');
  
  if (hasLegalData) {
    info += `<div class="legal-info"><b>📋 Thông tin pháp lý:</b>`;
    if (dienTichPhapLy && dienTichPhapLy !== '' && dienTichPhapLy !== '0') {
      info += `<div><b>Diện tích pháp lý:</b> ${dienTichPhapLy} m²</div>`;
    }
    if (trangThaiPhapLy && trangThaiPhapLy !== '') {
      info += `<div><b>Trạng thái pháp lý:</b> ${trangThaiPhapLy}</div>`;
    }
    info += `</div>`;
  } else {
    info += `<div style="margin-top: 10px; padding: 8px; background-color: #f8f9fa; border-left: 4px solid #6c757d; border-radius: 4px; color: #6c757d; font-size: 12px;">
      <b>📋 Thông tin pháp lý:</b> Chưa có dữ liệu
    </div>`;
  }
  
  return info || '<div>Không có thông tin</div>';
}

map.on('pointermove', (evt) => {
  const pixel = evt.pixel;
  const coords = evt.coordinate;
  const lon = coords[0].toFixed(2);
  const lat = coords[1].toFixed(2);
  
  // Hiển thị tọa độ ở góc dưới trái
  coordsEl.textContent = `X: ${lon} | Y: ${lat}`;
  
  let shown = false;
  map.forEachFeatureAtPixel(pixel, (feature) => {
    const props = feature.getProperties();
    // Tìm layer chứa feature này để lấy tên layer
    let layerName = '';
    layers.forEach((layer) => {
      if (layer.getSource().getFeatures().includes(feature)) {
        layerName = layer.get('name') || layer.get('title') || '';
      }
    });
    infoEl.innerHTML = formatInfo(props, layerName);
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

// ===== CHỨC NĂNG TÁCH THỬA ĐẤT =====

// Tạo layer để hiển thị điểm đã chọn và đường tách
function createSplitLayer() {
  const source = new ol.source.Vector();
  const layer = new ol.layer.Vector({
    source: source,
    style: function(feature) {
      const geometry = feature.getGeometry();
      if (geometry instanceof ol.geom.Point) {
        // Style cho điểm đã chọn - làm to và nổi bật hơn
        const pointCoords = feature.getGeometry().getCoordinates();
        const pointIndex = selectedPoints.findIndex(p => 
          Math.abs(p[0] - pointCoords[0]) < 0.1 && Math.abs(p[1] - pointCoords[1]) < 0.1
        );
        
        return new ol.style.Style({
          image: new ol.style.Circle({
            radius: 12,
            fill: new ol.style.Fill({ color: '#e74c3c' }),
            stroke: new ol.style.Stroke({ color: '#fff', width: 3 })
          }),
          text: new ol.style.Text({
            text: (pointIndex + 1).toString(),
            font: 'bold 14px Arial',
            fill: new ol.style.Fill({ color: '#fff' }),
            stroke: new ol.style.Stroke({ color: '#000', width: 2 }),
            offsetY: -25
          })
        });
      } else if (geometry instanceof ol.geom.LineString) {
        // Style cho đường tách
        return new ol.style.Style({
          stroke: new ol.style.Stroke({ 
            color: '#e74c3c', 
            width: 4,
            lineDash: [8, 8]
          })
        });
      }
    }
  });
  return layer;
}

// Tìm điểm gần nhất trên đường viền của feature
function findNearestPointOnBoundary(feature, clickCoordinate) {
  const geometry = feature.getGeometry();
  if (!geometry) return null;
  
  const coordinates = geometry.getCoordinates()[0]; // Lấy coordinates của polygon
  let nearestPoint = null;
  let minDistance = Infinity;
  
  // Tìm điểm gần nhất trên đường viền
  for (let i = 0; i < coordinates.length - 1; i++) {
    const segmentStart = coordinates[i];
    const segmentEnd = coordinates[i + 1];
    
    // Tính điểm gần nhất trên đoạn thẳng này
    const segment = new ol.geom.LineString([segmentStart, segmentEnd]);
    const closestPoint = segment.getClosestPoint(clickCoordinate);
    
    const distance = ol.coordinate.distance(clickCoordinate, closestPoint);
    if (distance < minDistance) {
      minDistance = distance;
      nearestPoint = closestPoint;
    }
  }
  
  console.log('Tìm thấy điểm gần nhất:', nearestPoint, 'khoảng cách:', minDistance);
  return nearestPoint;
}

// Tách thửa đất
function splitParcel(feature, point1, point2) {
  const geometry = feature.getGeometry();
  if (!geometry || !(geometry instanceof ol.geom.Polygon)) {
    console.error('Không thể tách thửa: geometry không hợp lệ');
    return;
  }
  
  const coordinates = geometry.getCoordinates()[0];
  console.log('Tọa độ polygon gốc:', coordinates.length, 'điểm');
  
  // Tìm vị trí gần nhất của 2 điểm trên đường viền
  let index1 = -1, index2 = -1;
  let minDist1 = Infinity, minDist2 = Infinity;
  
  // Tìm điểm gần nhất trên từng cạnh
  for (let i = 0; i < coordinates.length - 1; i++) {
    const segmentStart = coordinates[i];
    const segmentEnd = coordinates[i + 1];
    
    // Tính khoảng cách từ point1 đến cạnh này
    const segment1 = new ol.geom.LineString([segmentStart, segmentEnd]);
    const closestPoint1 = segment1.getClosestPoint(point1);
    const dist1 = ol.coordinate.distance(point1, closestPoint1);
    
    if (dist1 < minDist1) {
      minDist1 = dist1;
      index1 = i;
    }
    
    // Tính khoảng cách từ point2 đến cạnh này
    const closestPoint2 = segment1.getClosestPoint(point2);
    const dist2 = ol.coordinate.distance(point2, closestPoint2);
    
    if (dist2 < minDist2) {
      minDist2 = dist2;
      index2 = i;
    }
  }
  
  console.log('Vị trí điểm 1:', index1, 'khoảng cách:', minDist1);
  console.log('Vị trí điểm 2:', index2, 'khoảng cách:', minDist2);
  
  if (index1 === -1 || index2 === -1) {
    console.error('Không tìm thấy vị trí điểm trên đường viền');
    return;
  }
  
  // Đảm bảo index1 < index2
  if (index1 > index2) {
    [index1, index2] = [index2, index1];
    [point1, point2] = [point2, point1];
  }
  
  console.log('Sau sắp xếp - index1:', index1, 'index2:', index2);
  
  // Tạo 2 polygon mới
  const coords1 = [point1];
  const coords2 = [point2];
  
  // Polygon 1: từ point1, qua các điểm từ index1 đến index2, về point1
  for (let i = index1; i <= index2; i++) {
    coords1.push(coordinates[i]);
  }
  coords1.push(point1); // Đóng polygon
  
  // Polygon 2: từ point2, qua các điểm từ index2 đến cuối, từ đầu đến index1, về point2
  for (let i = index2; i < coordinates.length - 1; i++) {
    coords2.push(coordinates[i]);
  }
  for (let i = 0; i <= index1; i++) {
    coords2.push(coordinates[i]);
  }
  coords2.push(point2); // Đóng polygon
  
  console.log('Polygon 1 có', coords1.length, 'điểm');
  console.log('Polygon 2 có', coords2.length, 'điểm');
  
  // Tạo 2 feature mới
  const newFeature1 = new ol.Feature({
    geometry: new ol.geom.Polygon([coords1]),
    properties: feature.getProperties()
  });
  
  const newFeature2 = new ol.Feature({
    geometry: new ol.geom.Polygon([coords2]),
    properties: feature.getProperties()
  });
  
  // Thêm vào layer gốc và xóa feature cũ
  const source = feature.get('source');
  if (source) {
    source.addFeatures([newFeature1, newFeature2]);
    source.removeFeature(feature);
  }
  
  return [newFeature1, newFeature2];
}

// Xử lý click khi ở chế độ tách thửa
function handleSplitClick(evt) {
  if (!isSplitMode) return;
  
  console.log('Click trong chế độ tách thửa');
  const coordinate = evt.coordinate;
  let clickedFeature = null;
  
  // Tìm feature được click
  map.forEachFeatureAtPixel(evt.pixel, (feature) => {
    if (feature.getGeometry() instanceof ol.geom.Polygon) {
      clickedFeature = feature;
      return true;
    }
  });
  
  if (!clickedFeature) {
    alert('Vui lòng click vào thửa đất cần tách');
    return;
  }
  
  console.log('Đã click vào feature:', clickedFeature);
  
  // Nếu chưa chọn feature, chọn feature này
  if (!selectedFeature) {
    selectedFeature = clickedFeature;
    console.log('Chọn feature để tách:', selectedFeature);
    // Highlight feature được chọn
    selectedFeature.setStyle(new ol.style.Style({
      fill: new ol.style.Fill({ color: 'rgba(255, 255, 0, 0.3)' }),
      stroke: new ol.style.Stroke({ color: '#ff0000', width: 3 })
    }));
    alert('Đã chọn thửa đất. Bây giờ click 2 điểm trên đường viền để tách.');
    return;
  }
  
  // Chỉ cho phép click vào feature đã chọn
  if (clickedFeature !== selectedFeature) {
    alert('Vui lòng click vào thửa đất đã chọn (có viền đỏ)');
    return;
  }
  
  // Tìm điểm gần nhất trên đường viền
  const nearestPoint = findNearestPointOnBoundary(selectedFeature, coordinate);
  if (!nearestPoint) {
    alert('Không thể xác định điểm trên đường viền');
    return;
  }
  
  console.log('Điểm được chọn:', nearestPoint);
  
  // Thêm điểm vào danh sách
  selectedPoints.push(nearestPoint);
  
  // Cập nhật UI
  const pointStatus = document.getElementById(`point${selectedPoints.length}-status`);
  if (pointStatus) {
    pointStatus.textContent = `Đã chọn (${nearestPoint[0].toFixed(1)}, ${nearestPoint[1].toFixed(1)})`;
  }
  
  // Thêm điểm vào split layer
  const pointFeature = new ol.Feature({
    geometry: new ol.geom.Point(nearestPoint)
  });
  splitLayer.getSource().addFeature(pointFeature);
  
  // Vẽ đường nối giữa các điểm đã chọn
  if (selectedPoints.length >= 1) {
    // Xóa đường nối cũ
    const source = splitLayer.getSource();
    const features = source.getFeatures();
    features.forEach(feature => {
      if (feature.getGeometry() instanceof ol.geom.LineString) {
        source.removeFeature(feature);
      }
    });
    
    // Vẽ đường nối mới
    if (selectedPoints.length === 1) {
      // Vẽ đường từ điểm 1 đến điểm hiện tại
      const lineFeature = new ol.Feature({
        geometry: new ol.geom.LineString([selectedPoints[0], nearestPoint])
      });
      source.addFeature(lineFeature);
    } else if (selectedPoints.length === 2) {
      // Vẽ đường nối 2 điểm
      const lineFeature = new ol.Feature({
        geometry: new ol.geom.LineString([selectedPoints[0], selectedPoints[1]])
      });
      source.addFeature(lineFeature);
    }
  }
  
  console.log('Đã thêm điểm vào split layer. Tổng số điểm:', selectedPoints.length);
  
  // Nếu đã chọn đủ 2 điểm, hiển thị preview và xác nhận
  if (selectedPoints.length === 2) {
    // Hiển thị preview đường tách
    const previewLine = new ol.Feature({
      geometry: new ol.geom.LineString([selectedPoints[0], selectedPoints[1]])
    });
    splitLayer.getSource().addFeature(previewLine);
    
    // Xác nhận trước khi tách
    const confirm = confirm(`Đã chọn 2 điểm để tách thửa đất.\n\nĐiểm 1: (${selectedPoints[0][0].toFixed(1)}, ${selectedPoints[0][1].toFixed(1)})\nĐiểm 2: (${selectedPoints[1][0].toFixed(1)}, ${selectedPoints[1][1].toFixed(1)})\n\nBạn có muốn thực hiện tách thửa đất?`);
    
    if (confirm) {
      try {
        const newFeatures = splitParcel(selectedFeature, selectedPoints[0], selectedPoints[1]);
        if (newFeatures) {
          alert('Tách thửa đất thành công!');
          resetSplitMode();
        }
      } catch (error) {
        console.error('Lỗi khi tách thửa:', error);
        alert('Có lỗi xảy ra khi tách thửa đất');
      }
    } else {
      // Hủy tách, xóa điểm cuối và đường preview
      selectedPoints.pop();
      splitLayer.getSource().removeFeature(previewLine);
      document.getElementById('point2-status').textContent = 'Chưa chọn';
      alert('Đã hủy tách thửa đất. Bạn có thể chọn lại điểm thứ 2.');
    }
  } else {
    alert(`Đã chọn điểm ${selectedPoints.length}/2. Click thêm 1 điểm nữa trên đường viền.`);
  }
}

// Reset chế độ tách
function resetSplitMode() {
  isSplitMode = false;
  selectedPoints = [];
  selectedFeature = null;
  
  // Reset UI
  document.getElementById('split-parcel-btn').style.display = 'inline-block';
  document.getElementById('cancel-split-btn').style.display = 'none';
  document.getElementById('split-instructions').style.display = 'none';
  document.getElementById('point1-status').textContent = 'Chưa chọn';
  document.getElementById('point2-status').textContent = 'Chưa chọn';
  
  // Xóa split layer
  if (splitLayer) {
    splitLayer.getSource().clear();
  }
  
  // Reset style của feature được chọn
  if (selectedFeature) {
    selectedFeature.setStyle(null);
  }
}

// Event listeners cho các nút
document.addEventListener('DOMContentLoaded', function() {
  const splitBtn = document.getElementById('split-parcel-btn');
  const cancelBtn = document.getElementById('cancel-split-btn');
  
  splitBtn.addEventListener('click', function() {
    isSplitMode = true;
    splitBtn.style.display = 'none';
    cancelBtn.style.display = 'inline-block';
    document.getElementById('split-instructions').style.display = 'block';
    
    // Tạo split layer nếu chưa có
    if (!splitLayer) {
      splitLayer = createSplitLayer();
      map.addLayer(splitLayer);
    }
  });
  
  cancelBtn.addEventListener('click', function() {
    resetSplitMode();
  });
});

// Thêm event listener cho map click
map.on('click', handleSplitClick);
