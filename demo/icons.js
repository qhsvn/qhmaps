// Vẽ biểu tượng POI kiểu ghim Google Maps (giọt nước màu + hình trắng) và nạp vào map.
// Style gọi ảnh "poi-<nhóm>"; tên nhóm và màu nằm trong metadata["qhmaps:poi-colors"].

const GLYPHS = {
  culture: 'M12 3 3 8v2h18V8zM5 11h2v6H5zm4 0h2v6H9zm4 0h2v6h-2zm4 0h2v6h-2zM3 18h18v2H3z',
  worship: 'M11 2h2v3h3v2h-3v3l5 3v9h-5v-5h-2v5H6v-9l5-3V7H8V5h3z',
  park: 'M12 2 6 11h3l-4 6h6v5h2v-5h6l-4-6h3z',
  shopping: 'M6 7h3a3 3 0 0 1 6 0h3l1 14H5zm5 0h2a1 1 0 0 0-2 0',
  food: 'M6 2h1.5v6H9V2h1.5v6H12V2h1v7a3 3 0 0 1-2.5 2.95V22h-2v-10.05A3 3 0 0 1 6 9zM17 2c1.7 0 3 2.2 3 5.5V13h-2v9h-2V2z',
  lodging: 'M3 6h2v8h5V8h7a4 4 0 0 1 4 4v2h0v6h-2v-3H5v3H3zm4 3.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4',
  health: 'M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z',
  education: 'M12 4 1 9l11 5 9-4.1V16h2V9zM5 13.2V17l7 3 7-3v-3.8l-7 3.2z',
  transit: 'M6 3h12a2 2 0 0 1 2 2v11a2 2 0 0 1-1 1.7V20h-3v-2H8v2H5v-2.3A2 2 0 0 1 4 16V5a2 2 0 0 1 2-2m0 3v5h12V6zm1.5 7a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3m9 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3',
  civic: 'M4 21V10l8-6 8 6v11h-6v-6h-4v6z',
  generic: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8',
};

const RATIO = 2;
const W = 26;
const H = 34;

function drawPin(color, glyph) {
  const canvas = document.createElement('canvas');
  canvas.width = W * RATIO;
  canvas.height = H * RATIO;
  const ctx = canvas.getContext('2d');
  ctx.scale(RATIO, RATIO);

  // Giọt nước: hình tròn bán kính 12 nối xuống mũi nhọn ở đáy.
  const r = 12;
  const cx = W / 2;
  const cy = r + 1;
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI * 0.8, Math.PI * 0.2);
  ctx.quadraticCurveTo(cx + 4, cy + r + 2, cx, H - 1);
  ctx.quadraticCurveTo(cx - 4, cy + r + 2, cx + r * Math.cos(Math.PI * 0.8), cy + r * Math.sin(Math.PI * 0.8));
  ctx.closePath();
  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.shadowBlur = 2;
  ctx.shadowOffsetY = 1;
  ctx.fillStyle = color;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  ctx.save();
  ctx.translate(cx - 7, cy - 7);
  ctx.scale(14 / 24, 14 / 24);
  ctx.fillStyle = '#ffffff';
  ctx.fill(new Path2D(glyph), 'evenodd');
  ctx.restore();

  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

export function registerPoiIcons(map) {
  const colors = map.getStyle().metadata?.['qhmaps:poi-colors'] ?? {};
  for (const [category, color] of Object.entries(colors)) {
    const id = `poi-${category}`;
    if (!map.hasImage(id)) {
      map.addImage(id, drawPin(color, GLYPHS[category] ?? GLYPHS.generic), { pixelRatio: RATIO });
    }
  }
}
