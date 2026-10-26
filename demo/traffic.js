// Dữ liệu giao thông cho lớp "traffic" của style.
//
// MapTiler/OSM không có dữ liệu kẹt xe thời gian thực, nên bản demo tự MÔ PHỎNG:
// lấy các đường chính đang hiển thị, cắt thành đoạn ~150 m và gán mức 0..4.
// Khi có nguồn thật (TomTom, HERE, dữ liệu GPS riêng...), chỉ cần gọi
// setTrafficData(map, geojson) với mỗi feature là LineString có thuộc tính "level".

const ROAD_CLASSES = ['motorway', 'trunk', 'primary', 'secondary', 'tertiary'];
const SEGMENT_M = 150;
// Xác suất cộng dồn cho các mức 0 (thông thoáng) .. 4 (kẹt).
const LEVEL_CDF = [0.3, 0.6, 0.8, 0.94, 1];

export function setTrafficData(map, geojson) {
  map.getSource('traffic')?.setData(geojson);
}

function hash(a, b, seed) {
  let h = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b ^ seed, 0xc2b2ae35);
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d);
  h ^= h >>> 12;
  return (h >>> 0) / 4294967296;
}

function levelAt([lng, lat], seed, roadClass) {
  // Làm tròn ~200 m để cùng một chỗ luôn ra cùng mức, dù đường bị cắt qua nhiều tile.
  // Đường lớn hơi dễ kẹt hơn: dồn r về phía mức cao.
  const bias = roadClass === 'primary' || roadClass === 'trunk' ? 0.1 : 0;
  const r = hash(Math.round(lng * 500), Math.round(lat * 500), seed) * (1 - bias) + bias;
  return LEVEL_CDF.findIndex((p) => r < p);
}

function metres([lng1, lat1], [lng2, lat2]) {
  const k = 111320;
  const dx = (lng2 - lng1) * k * Math.cos((lat1 * Math.PI) / 180);
  const dy = (lat2 - lat1) * k;
  return Math.hypot(dx, dy);
}

// Cắt đường thành các đoạn dài SEGMENT_M, nội suy điểm cắt trên cạnh dài.
function splitLine(coords, roadClass, seed, out) {
  const push = (segment) => out.push({
    type: 'Feature',
    properties: { level: levelAt(segment[0], seed, roadClass), class: roadClass },
    geometry: { type: 'LineString', coordinates: segment },
  });
  let segment = [coords[0]];
  let left = SEGMENT_M;
  for (let i = 1; i < coords.length; i++) {
    let a = coords[i - 1];
    const b = coords[i];
    let d = metres(a, b);
    while (d > left) {
      const t = left / d;
      const cut = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      segment.push(cut);
      push(segment);
      segment = [cut];
      a = cut;
      d -= left;
      left = SEGMENT_M;
    }
    segment.push(b);
    left -= d;
  }
  if (segment.length > 1) push(segment);
}

function simulate(map, seed) {
  const features = [];
  const roads = map.querySourceFeatures('openmaptiles', {
    sourceLayer: 'transportation',
    filter: ['in', ['get', 'class'], ['literal', ROAD_CLASSES]],
  });
  for (const f of roads) {
    const g = f.geometry;
    const lines = g.type === 'LineString' ? [g.coordinates] : g.type === 'MultiLineString' ? g.coordinates : [];
    for (const line of lines) if (line.length > 1) splitLine(line, f.properties.class, seed, features);
  }
  setTrafficData(map, { type: 'FeatureCollection', features });
}

// Bật mô phỏng: cập nhật khi bản đồ dừng di chuyển và đổi "tình hình" mỗi 2 phút.
export function startSimulatedTraffic(map) {
  const seedNow = () => Math.floor(Date.now() / 120000);
  let timer;
  const refresh = () => {
    clearTimeout(timer);
    timer = setTimeout(() => simulate(map, seedNow()), 200);
  };
  map.on('moveend', refresh);
  map.on('sourcedata', (e) => {
    if (e.sourceId === 'openmaptiles' && e.isSourceLoaded) refresh();
  });
  setInterval(refresh, 120000);
  refresh();
}
