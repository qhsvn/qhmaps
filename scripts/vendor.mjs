// Chép MapLibre GL và PMTiles từ node_modules vào demo/vendor để trang demo không cần CDN.
// Chạy sau khi đổi phiên bản trong package.json: npm install && npm run vendor
import { copyFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = `${root}demo/vendor/`;
mkdirSync(out, { recursive: true });

for (const [from, to] of [
  ['maplibre-gl/dist/maplibre-gl.js', 'maplibre-gl.js'],
  ['maplibre-gl/dist/maplibre-gl.css', 'maplibre-gl.css'],
  ['maplibre-gl/LICENSE.txt', 'maplibre-gl.LICENSE.txt'],
  ['pmtiles/dist/pmtiles.js', 'pmtiles.js'],
]) {
  copyFileSync(`${root}node_modules/${from}`, out + to);
  console.log(`demo/vendor/${to}`);
}
