// Sinh styles/google-like.json từ các bảng màu và biểu thức dùng chung bên dưới.
// Chạy: npm run build
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../styles/google-like.json', import.meta.url));

// Bảng màu lấy theo Google Maps (chế độ sáng, bản 2024+).
const C = {
  land: '#f5f1e6',
  landUrban: '#f2ecdc',
  landCommercial: '#f6e8dd',
  landIndustrial: '#ece9e4',
  landHospital: '#fbe3e1',
  landSchool: '#f5ecd2',
  park: '#bde4a7',
  parkDark: '#a8d891',
  wood: '#c4e4b0',
  sand: '#f6eecb',
  water: '#90c8f8',
  waterLabel: '#3a76b8',
  building: '#e9e5db',
  buildingOutline: '#dcd6c8',
  roadMinor: '#ffffff',
  roadCasing: '#dcd8cf',
  roadMajor: '#ffffff',
  roadMajorCasing: '#d2cdc2',
  highway: '#fde29a',
  highwayCasing: '#f3c454',
  path: '#d9d4c9',
  rail: '#b8b5ae',
  boundary: '#9e9ca0',
  text: '#3c4043',
  textRoad: '#5f6368',
  textPlace: '#202124',
  halo: '#ffffff',
};

// Màu chữ/biểu tượng theo nhóm POI (giống cách Google tô màu).
export const POI_COLORS = {
  culture: '#5c7ba3',   // bảo tàng, di tích, nhà hát
  worship: '#7a7a7a',   // nhà thờ, chùa
  park: '#2e8b3e',      // công viên, vườn
  shopping: '#7b4fd1',  // chợ, TTTM
  food: '#e2711d',      // nhà hàng, cafe
  lodging: '#d9468b',   // khách sạn
  health: '#d93025',    // bệnh viện, nhà thuốc
  education: '#8a6a3c', // trường học
  transit: '#1a73e8',   // bến xe, ga
  civic: '#607d8b',     // UBND, bưu điện, ngân hàng
  generic: '#70757a',
};

const name = ['coalesce', ['get', 'name:vi'], ['get', 'name']];

// Google viết tắt "Đường" -> "Đ." trên nhãn đường.
const roadName = [
  'let', 'n', name,
  ['case',
    ['==', ['slice', ['var', 'n'], 0, 6], 'Đường '], ['concat', 'Đ. ', ['slice', ['var', 'n'], 6]],
    ['var', 'n'],
  ],
];

// Phân loại POI của lược đồ OpenMapTiles thành các nhóm ở POI_COLORS.
const poiCategory = [
  'match', ['get', 'class'],
  ['museum', 'art_gallery', 'attraction', 'castle', 'monument', 'theatre', 'cinema', 'music', 'library'], 'culture',
  ['place_of_worship'], 'worship',
  ['park', 'garden', 'zoo', 'playground', 'golf', 'campsite', 'stadium', 'swimming'], 'park',
  ['shop', 'grocery', 'clothing_store', 'marketplace', 'alcohol_shop', 'bakery', 'jewelry', 'furniture', 'hardware', 'mobile_phone'], 'shopping',
  ['restaurant', 'fast_food', 'cafe', 'bar', 'beer', 'ice_cream', 'food_court'], 'food',
  ['lodging'], 'lodging',
  ['hospital', 'pharmacy', 'doctors', 'dentist', 'veterinary'], 'health',
  ['school', 'college', 'university', 'kindergarten'], 'education',
  ['bus', 'railway', 'ferry_terminal', 'harbor', 'aerialway', 'airport'], 'transit',
  ['town_hall', 'post', 'bank', 'atm', 'police', 'fire_station', 'embassy', 'office'], 'civic',
  'generic',
];

const poiColor = ['match', poiCategory, ...Object.entries(POI_COLORS).flatMap(([k, v]) => [k, v]).slice(0, -2), POI_COLORS.generic];

const zoomInterp = (...stops) => ['interpolate', ['exponential', 1.5], ['zoom'], ...stops];

const FONT = ['Noto Sans Regular'];
const FONT_MEDIUM = ['Noto Sans Bold'];

const src = 'openmaptiles';

const roadClasses = {
  highway: ['motorway', 'trunk'],
  major: ['primary', 'secondary'],
  medium: ['tertiary'],
  minor: ['minor', 'service', 'track', 'raceway'],
};
const isClass = (classes) => ['in', ['get', 'class'], ['literal', classes]];
const notTunnel = ['!=', ['get', 'brunnel'], 'tunnel'];

// Cặp [zoom, độ rộng]; scale() nhân độ rộng để làm phần lõi mảnh hơn viền.
const roadWidths = {
  highway: [6, 1, 10, 3, 14, 9, 18, 30],
  major: [8, 0.6, 12, 2.5, 14, 7, 18, 26],
  medium: [10, 0.5, 13, 2, 15, 6, 18, 20],
  minor: [12, 0.5, 14, 2, 16, 5, 18, 14],
};
const scale = (stops, k = 1) => zoomInterp(...stops.map((v, i) => (i % 2 ? +(v * k).toFixed(2) : v)));

function roadPair(id, classes, width, fill, casing, minzoom) {
  return [
    {
      id: `road-${id}-casing`, type: 'line', source: src, 'source-layer': 'transportation', minzoom,
      filter: ['all', isClass(classes), notTunnel, ['!=', ['get', 'brunnel'], 'ford']],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': casing, 'line-width': scale(width) },
    },
    {
      id: `road-${id}`, type: 'line', source: src, 'source-layer': 'transportation', minzoom,
      filter: ['all', isClass(classes), notTunnel],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': fill, 'line-width': scale(width, 0.82) },
    },
  ];
}

const layers = [
  { id: 'background', type: 'background', paint: { 'background-color': C.land } },

  {
    id: 'landuse', type: 'fill', source: src, 'source-layer': 'landuse',
    paint: {
      'fill-color': ['match', ['get', 'class'],
        ['residential', 'suburb', 'neighbourhood'], C.landUrban,
        ['commercial', 'retail'], C.landCommercial,
        ['industrial', 'railway'], C.landIndustrial,
        'hospital', C.landHospital,
        ['school', 'university', 'college', 'kindergarten'], C.landSchool,
        ['cemetery', 'stadium', 'pitch', 'playground'], C.parkDark,
        C.land],
      'fill-opacity': 0.9,
    },
  },
  {
    id: 'landcover', type: 'fill', source: src, 'source-layer': 'landcover',
    paint: {
      'fill-color': ['match', ['get', 'class'],
        'wood', C.wood, 'grass', C.park, 'farmland', '#e4efcf',
        'wetland', '#cfe7d6', 'sand', C.sand, 'ice', '#ffffff', C.park],
      'fill-opacity': zoomInterp(0, 0.6, 12, 1),
    },
  },
  {
    id: 'park', type: 'fill', source: src, 'source-layer': 'park',
    paint: { 'fill-color': C.park },
  },
  {
    id: 'water', type: 'fill', source: src, 'source-layer': 'water',
    filter: ['!=', ['get', 'brunnel'], 'tunnel'],
    paint: { 'fill-color': C.water },
  },
  {
    id: 'waterway', type: 'line', source: src, 'source-layer': 'waterway',
    filter: notTunnel,
    paint: { 'line-color': C.water, 'line-width': zoomInterp(8, 0.5, 14, 2, 18, 8) },
  },
  {
    id: 'aeroway', type: 'fill', source: src, 'source-layer': 'aeroway', minzoom: 11,
    filter: ['==', ['geometry-type'], 'Polygon'],
    paint: { 'fill-color': '#e6e3df' },
  },
  {
    id: 'building', type: 'fill', source: src, 'source-layer': 'building', minzoom: 14,
    paint: {
      'fill-color': C.building,
      'fill-outline-color': C.buildingOutline,
      'fill-opacity': ['interpolate', ['linear'], ['zoom'], 14, 0, 15, 1],
    },
  },
  {
    id: 'building-3d', type: 'fill-extrusion', source: src, 'source-layer': 'building', minzoom: 17,
    paint: {
      'fill-extrusion-color': '#ece8df',
      'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 0],
      'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
      'fill-extrusion-opacity': 0.6,
    },
  },

  {
    id: 'road-tunnel', type: 'line', source: src, 'source-layer': 'transportation',
    filter: ['all', ['==', ['get', 'brunnel'], 'tunnel'], isClass([...roadClasses.highway, ...roadClasses.major, ...roadClasses.medium])],
    layout: { 'line-join': 'round' },
    paint: { 'line-color': '#ffffff', 'line-width': scale(roadWidths.major), 'line-opacity': 0.6, 'line-dasharray': [0.6, 0.4] },
  },
  {
    id: 'road-path', type: 'line', source: src, 'source-layer': 'transportation', minzoom: 15,
    filter: ['==', ['get', 'class'], 'path'],
    layout: { 'line-join': 'round' },
    paint: { 'line-color': C.path, 'line-width': zoomInterp(15, 0.8, 18, 2.5), 'line-dasharray': [2, 1] },
  },
  {
    id: 'rail', type: 'line', source: src, 'source-layer': 'transportation', minzoom: 11,
    filter: ['in', ['get', 'class'], ['literal', ['rail', 'transit']]],
    paint: { 'line-color': C.rail, 'line-width': zoomInterp(11, 0.6, 18, 2.5) },
  },
  ...roadPair('minor', roadClasses.minor, roadWidths.minor, C.roadMinor, C.roadCasing, 12),
  ...roadPair('medium', roadClasses.medium, roadWidths.medium, C.roadMajor, C.roadMajorCasing, 10),
  ...roadPair('major', roadClasses.major, roadWidths.major, C.roadMajor, C.roadMajorCasing, 7),
  ...roadPair('highway', roadClasses.highway, roadWidths.highway, C.highway, C.highwayCasing, 5),

  // Lớp giao thông. Nguồn "traffic" là GeoJSON, mỗi đoạn đường có thuộc tính
  // "level": 0 = thông thoáng ... 4 = kẹt xe. Ứng dụng tự đổ dữ liệu vào nguồn này.
  {
    id: 'traffic', type: 'line', source: 'traffic', minzoom: 10,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': ['match', ['get', 'level'],
        0, '#1e9e47', 1, '#6cc644', 2, '#f5c518', 3, '#f2711c', 4, '#d93025', '#6cc644'],
      'line-width': zoomInterp(10, 1, 14, 3, 18, 9),
      'line-offset': zoomInterp(12, 0, 18, 3),
    },
  },

  {
    id: 'boundary', type: 'line', source: src, 'source-layer': 'boundary',
    filter: ['all', ['<=', ['get', 'admin_level'], 8], ['!=', ['get', 'maritime'], 1]],
    paint: {
      'line-color': C.boundary,
      'line-width': ['match', ['get', 'admin_level'], 2, 1.5, 4, 1.2, 0.8],
      'line-dasharray': [3, 2],
      'line-opacity': 0.6,
    },
  },

  ...['point', 'line'].map((placement) => ({
    id: `water-name-${placement}`, type: 'symbol', source: src, 'source-layer': 'water_name',
    filter: ['==', ['geometry-type'], placement === 'line' ? 'LineString' : 'Point'],
    layout: { 'text-field': name, 'text-font': FONT, 'text-size': 13, 'symbol-placement': placement },
    paint: { 'text-color': C.waterLabel, 'text-halo-color': 'rgba(255,255,255,0.7)', 'text-halo-width': 1 },
  })),
  {
    id: 'road-label', type: 'symbol', source: src, 'source-layer': 'transportation_name', minzoom: 13,
    filter: ['has', 'name'],
    layout: {
      'symbol-placement': 'line',
      'text-field': roadName,
      'text-font': FONT,
      'text-size': ['interpolate', ['linear'], ['zoom'], 13, 10, 16, 12.5, 18, 14],
      'text-letter-spacing': 0.02,
      'text-max-angle': 30,
      'symbol-spacing': 300,
    },
    paint: { 'text-color': C.textRoad, 'text-halo-color': C.halo, 'text-halo-width': 1.6 },
  },
  {
    id: 'poi', type: 'symbol', source: src, 'source-layer': 'poi', minzoom: 14,
    filter: ['all', ['has', 'name'], ['<=', ['coalesce', ['get', 'rank'], 99], ['step', ['zoom'], 6, 15, 15, 16, 30, 17, 99]]],
    layout: {
      'icon-image': ['concat', 'poi-', poiCategory],
      'icon-size': 1,
      'icon-anchor': 'bottom',
      'text-field': name,
      'text-font': FONT,
      'text-size': 12.5,
      'text-anchor': 'top',
      'text-offset': [0, 0.3],
      'text-max-width': 8,
      'text-optional': true,
      'symbol-sort-key': ['coalesce', ['get', 'rank'], 99],
    },
    paint: { 'text-color': poiColor, 'text-halo-color': C.halo, 'text-halo-width': 1.5 },
  },
  {
    id: 'place-neighbourhood', type: 'symbol', source: src, 'source-layer': 'place', minzoom: 13,
    filter: ['in', ['get', 'class'], ['literal', ['neighbourhood', 'quarter', 'hamlet']]],
    layout: {
      'text-field': name, 'text-font': FONT, 'text-size': 12,
      'text-transform': 'uppercase', 'text-letter-spacing': 0.08, 'text-max-width': 7,
    },
    paint: { 'text-color': '#7d7f83', 'text-halo-color': C.halo, 'text-halo-width': 1.5 },
  },
  {
    id: 'place-suburb', type: 'symbol', source: src, 'source-layer': 'place', minzoom: 11,
    filter: ['in', ['get', 'class'], ['literal', ['suburb', 'village']]],
    layout: {
      'text-field': name, 'text-font': FONT_MEDIUM,
      'text-size': ['interpolate', ['linear'], ['zoom'], 11, 13, 15, 20],
      'text-max-width': 8,
    },
    paint: { 'text-color': C.textPlace, 'text-halo-color': C.halo, 'text-halo-width': 2 },
  },
  {
    id: 'place-city', type: 'symbol', source: src, 'source-layer': 'place', maxzoom: 14,
    filter: ['in', ['get', 'class'], ['literal', ['city', 'town']]],
    layout: {
      'text-field': name, 'text-font': FONT_MEDIUM,
      'text-size': ['interpolate', ['linear'], ['zoom'], 4, 12, 10, 18],
      'text-max-width': 8,
    },
    paint: { 'text-color': C.textPlace, 'text-halo-color': C.halo, 'text-halo-width': 2 },
  },
  {
    id: 'place-country', type: 'symbol', source: src, 'source-layer': 'place', maxzoom: 8,
    filter: ['==', ['get', 'class'], 'country'],
    layout: { 'text-field': name, 'text-font': FONT_MEDIUM, 'text-size': 14, 'text-transform': 'uppercase' },
    paint: { 'text-color': '#5f6368', 'text-halo-color': C.halo, 'text-halo-width': 2 },
  },
];

const style = {
  version: 8,
  name: 'QH Google-like',
  metadata: { 'qhmaps:poi-colors': POI_COLORS },
  center: [106.6966, 10.7766],
  zoom: 15.2,
  bearing: 0,
  pitch: 0,
  sources: {
    openmaptiles: {
      type: 'vector',
      url: 'https://api.maptiler.com/tiles/v3/tiles.json?key={key}',
      attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
    },
    traffic: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
  },
  glyphs: 'https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key={key}',
  layers,
};

writeFileSync(OUT, JSON.stringify(style, null, 2) + '\n');
console.log(`Đã ghi ${OUT} (${layers.length} lớp)`);
