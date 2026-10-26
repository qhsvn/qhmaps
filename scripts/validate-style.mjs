// Kiểm tra styles/google-like.json theo đặc tả style MapLibre.
import { readFileSync } from 'node:fs';
import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec';

const path = new URL('../styles/google-like.json', import.meta.url);
const errors = validateStyleMin(JSON.parse(readFileSync(path, 'utf8')));
if (errors.length) {
  for (const e of errors) console.error(e.message);
  process.exit(1);
}
console.log('Style hợp lệ.');
