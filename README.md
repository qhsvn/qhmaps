# qhmaps

Style bản đồ OpenStreetMap (tile vector MapTiler, lược đồ OpenMapTiles) cho MapLibre GL, giao diện giống Google Maps: nền be nhạt, công viên xanh lá, nước xanh dương, đường trắng, ghim POI có màu theo nhóm, nhãn tiếng Việt, lớp giao thông có công tắc và chú giải "Nhanh → Chậm".

![Xem trước (dữ liệu giả lập)](docs/preview.png)

*Ảnh trên được render từ dữ liệu giả lập vì môi trường build không gọi được MapTiler; với key thật bản đồ dùng dữ liệu OSM thật.*

## Cấu trúc

| Đường dẫn | Nội dung |
| --- | --- |
| `styles/google-like.json` | Style MapLibre (sinh ra, đừng sửa tay) |
| `scripts/build-style.mjs` | Nguồn của style: bảng màu, nhóm POI, độ rộng đường |
| `scripts/validate-style.mjs` | Kiểm tra style theo đặc tả MapLibre |
| `demo/` | Trang demo: ghim POI, lớp giao thông, nút Vệ tinh, ghim đỏ địa điểm |

## Chạy thử

1. Lấy API key miễn phí ở [cloud.maptiler.com](https://cloud.maptiler.com/account/keys/).
2. `npm run serve` rồi mở `http://localhost:8080/demo/?key=KEY_CỦA_BẠN` (hoặc mở không có `?key=` và nhập key vào ô hiện ra).

## Sửa style

```sh
npm install
npm run build      # sinh lại styles/google-like.json
npm run validate
```

Đổi màu trong object `C` và `POI_COLORS` ở `scripts/build-style.mjs`.

## Dùng style trong ứng dụng khác

Style chứa chỗ giữ `{key}` trong URL tile và font. Thay bằng key của bạn trước khi đưa vào `new maplibregl.Map({ style })` (xem `loadStyle` trong `demo/app.js`).

Biểu tượng POI không nằm trong sprite mà được vẽ bằng canvas: gọi `registerPoiIcons(map)` từ `demo/icons.js` sau sự kiện `load` và trong `styleimagemissing`.

## Lớp giao thông

OpenStreetMap và MapTiler **không có dữ liệu kẹt xe thời gian thực**. Bản demo mô phỏng (`demo/traffic.js`): cắt các đường chính thành đoạn ~150 m và gán mức 0–4, đổi mỗi 2 phút. Để dùng dữ liệu thật (TomTom, HERE, GPS riêng...), đổ GeoJSON vào nguồn `traffic`:

```js
import { setTrafficData } from './traffic.js';
setTrafficData(map, {
  type: 'FeatureCollection',
  features: [{ type: 'Feature', properties: { level: 3 }, geometry: { type: 'LineString', coordinates: [...] } }],
});
```

`level`: 0 thông thoáng, 1 khá nhanh, 2 trung bình, 3 chậm, 4 kẹt xe.
