import { registerPoiIcons } from './icons.js';
import { startSimulatedTraffic } from './traffic.js';

const STYLE_URL = '../styles/google-like.json';
const KEY_STORAGE = 'qhmaps:maptiler-key';

function readKey() {
  const fromUrl = new URLSearchParams(location.search).get('key');
  if (fromUrl) return fromUrl;
  try { return localStorage.getItem(KEY_STORAGE); } catch { return null; }
}

function askKey() {
  const form = document.getElementById('key-form');
  form.hidden = false;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const key = new FormData(form).get('key').trim();
    try { localStorage.setItem(KEY_STORAGE, key); } catch { /* chế độ ẩn danh */ }
    form.hidden = true;
    start(key);
  });
}

async function loadStyle(key) {
  const text = await (await fetch(STYLE_URL)).text();
  return JSON.parse(text.replaceAll('{key}', encodeURIComponent(key)));
}

function addPlaceMarker(map, lngLat, title) {
  const el = document.createElement('div');
  el.className = 'place-marker';
  el.innerHTML = `
    <svg width="27" height="41" viewBox="0 0 27 41" aria-hidden="true">
      <path d="M13.5 0C6 0 0 6 0 13.5 0 23.6 13.5 41 13.5 41S27 23.6 27 13.5C27 6 21 0 13.5 0z" fill="#ea4335"/>
      <path d="M13.5 0C6 0 0 6 0 13.5 0 23.6 13.5 41 13.5 41S27 23.6 27 13.5C27 6 21 0 13.5 0z" fill="none" stroke="#b31412" stroke-width="1"/>
      <circle cx="13.5" cy="13.5" r="5" fill="#b31412"/>
    </svg>
    <div class="place-label"></div>`;
  el.querySelector('.place-label').textContent = title;
  // Neo mũi ghim (đáy SVG) vào toạ độ; nhãn nằm phía dưới.
  return new maplibregl.Marker({ element: el, anchor: 'top', offset: [0, -41] }).setLngLat(lngLat).addTo(map);
}

function setupTrafficToggle(map) {
  const input = document.getElementById('traffic-toggle');
  const card = input.closest('.traffic-card');
  const apply = () => {
    map.setLayoutProperty('traffic', 'visibility', input.checked ? 'visible' : 'none');
    card.classList.toggle('off', !input.checked);
  };
  input.addEventListener('change', apply);
  apply();
}

function setupSatellite(map, key) {
  const button = document.getElementById('layer-switch');
  const label = button.querySelector('.label');
  map.addSource('satellite', {
    type: 'raster',
    tiles: [`https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=${encodeURIComponent(key)}`],
    tileSize: 512,
    maxzoom: 20,
    attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a>',
  });
  // Ảnh vệ tinh phủ lên nền, đường và nhãn vẫn nằm trên.
  map.addLayer({ id: 'satellite', type: 'raster', source: 'satellite', layout: { visibility: 'none' } }, 'road-tunnel');
  button.addEventListener('click', () => {
    const on = button.getAttribute('aria-pressed') !== 'true';
    button.setAttribute('aria-pressed', String(on));
    label.textContent = on ? 'Bản đồ' : 'Vệ tinh';
    map.setLayoutProperty('satellite', 'visibility', on ? 'visible' : 'none');
    for (const id of ['building', 'building-3d']) map.setLayoutProperty(id, 'visibility', on ? 'none' : 'visible');
  });
}

async function start(key) {
  const map = new maplibregl.Map({
    container: 'map',
    style: await loadStyle(key),
    hash: true,
    attributionControl: { compact: true },
  });
  window.map = map;

  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
  map.addControl(new maplibregl.GeolocateControl({ trackUserLocation: true }), 'top-right');
  map.addControl(new maplibregl.ScaleControl(), 'bottom-right');

  map.on('styleimagemissing', () => registerPoiIcons(map));
  map.once('load', () => {
    registerPoiIcons(map);
    setupTrafficToggle(map);
    setupSatellite(map, key);
    startSimulatedTraffic(map);
    addPlaceMarker(map, [106.6953, 10.7770], 'Dinh Độc Lập');
  });
}

const key = readKey();
if (key) start(key); else askKey();
