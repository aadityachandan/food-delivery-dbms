'use client';
// Small SVG map with the restaurant, the customer and the live partner position.
export default function MapView({ restaurant, home, partner }) {
  const pts = [
    restaurant && { kind: 'restaurant', ...restaurant },
    home && { kind: 'home', ...home },
    partner && { kind: 'partner', ...partner },
  ].filter(p => p && Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lng)))
    .map(p => ({ ...p, lat: Number(p.lat), lng: Number(p.lng) }));
  if (!pts.length) return null;
  const W = 560, H = 280, P = 48;
  const minLat = Math.min(...pts.map(p => p.lat)), maxLat = Math.max(...pts.map(p => p.lat));
  const minLng = Math.min(...pts.map(p => p.lng)), maxLng = Math.max(...pts.map(p => p.lng));
  const dLat = Math.max(maxLat - minLat, 0.01), dLng = Math.max(maxLng - minLng, 0.01);
  const k = Math.min((W - 2 * P) / dLng, (H - 2 * P) / dLat);
  const ox = (W - dLng * k) / 2, oy = (H - dLat * k) / 2;
  const xy = p => [ox + (p.lng - minLng) * k + ((dLng - (maxLng - minLng)) * k) / 2,
                   H - oy - (p.lat - minLat) * k - ((dLat - (maxLat - minLat)) * k) / 2];
  const at = Object.fromEntries(pts.map(p => [p.kind, xy(p)]));
  const Marker = ({ kind, fill, glyph, label }) => {
    if (!at[kind]) return null;
    const [x, y] = at[kind];
    return (
      <g>
        <circle cx={x} cy={y} r="17" fill={fill} stroke="#fff" strokeWidth="3" />
        <text x={x} y={y + 6} textAnchor="middle" fontSize="16">{glyph}</text>
        <text x={x} y={y + 34} textAnchor="middle" fontSize="12" fontWeight="700" fill="#1B2430">{label}</text>
      </g>
    );
  };
  return (
    <svg className="map" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Map of restaurant, delivery address and partner">
      <rect width={W} height={H} fill="#EEF1EC" />
      {[...Array(9)].map((_, i) => <line key={'v' + i} x1={i * 70} y1="0" x2={i * 70} y2={H} stroke="#E2E6DF" />)}
      {[...Array(5)].map((_, i) => <line key={'h' + i} x1="0" y1={i * 70} x2={W} y2={i * 70} stroke="#E2E6DF" />)}
      <path d={`M0,${H * 0.62} C${W * 0.3},${H * 0.5} ${W * 0.6},${H * 0.8} ${W},${H * 0.55}`} stroke="#fff" strokeWidth="10" fill="none" />
      <path d={`M${W * 0.35},0 C${W * 0.4},${H * 0.4} ${W * 0.3},${H * 0.7} ${W * 0.42},${H}`} stroke="#fff" strokeWidth="8" fill="none" />
      {at.restaurant && at.home && (
        <path d={`M${at.restaurant[0]},${at.restaurant[1]} Q${(at.restaurant[0] + at.home[0]) / 2},${Math.min(at.restaurant[1], at.home[1]) - 30} ${at.home[0]},${at.home[1]}`}
              fill="none" stroke="#1B2430" strokeWidth="3" strokeDasharray="7 7" opacity=".5" />
      )}
      <Marker kind="restaurant" fill="#E4572E" glyph="🍽️" label="Restaurant" />
      <Marker kind="home" fill="#1B2430" glyph="🏠" label="Customer" />
      <Marker kind="partner" fill="#1F8A4C" glyph="🛵" label="Partner" />
    </svg>
  );
}
