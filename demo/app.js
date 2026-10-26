import { registerPoiIcons } from './icons.js';
import { startSimulatedTraffic } from './traffic.js';

// Mọi thứ (style, tile, font, thư viện) đều nằm trong repo; không gọi API bên ngoài.
// {base} trong style = thư mục gốc của repo trên web server.
const BASE = new URL('..', location.href).href.replace(/\/$/, '');
const STYLE_URL = `${BASE}/styles/google-like.json`;

async function loadStyle() {
  const text = await (await fetch(STYLE_URL)).text();
  const style = JSON.parse(text.replaceAll('{base}', BASE));
  // ?tiles=data/khac.pmtiles để thử file tile khác.
  const tiles = new URLSearchParams(location.search).get('tiles');
  if (tiles) style.sources.openmaptiles.url = `pmtiles://${new URL(tiles, `${BASE}/`).href}`;
  return style;
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

async function start() {
  const protocol = new pmtiles.Protocol();
  maplibregl.addProtocol('pmtiles', protocol.tile);

  const map = new maplibregl.Map({
    container: 'map',
    style: await loadStyle(),
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
    startSimulatedTraffic(map);
    addPlaceMarker(map, [106.6953, 10.7770], 'Dinh Độc Lập');
  });
}

start();
