// System architecture diagram:  node make_architecture.js -> architecture.svg
const fs = require('fs');
const path = require('path');

const W = 1600, H = 900;
const box = (x, y, w, h, fill, stroke, title, lines, titleColor = '#1B2430') => `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
  <text x="${x + 24}" y="${y + 40}" font-size="24" font-weight="700" fill="${titleColor}">${title}</text>
  ${lines.map((l, i) => `<text x="${x + 24}" y="${y + 78 + i * 30}" font-size="18" fill="#3D4450">${l}</text>`).join('')}`;
const arrow = (x1, y1, x2, y2, label, lx, ly) => `
  <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#1B2430" stroke-width="3" marker-end="url(#a)" marker-start="url(#b)"/>
  <rect x="${lx - 6}" y="${ly - 22}" width="${label.length * 9.2 + 12}" height="30" rx="6" fill="#FFFFFF" stroke="#E7E0D4"/>
  <text x="${lx}" y="${ly}" font-size="16" font-weight="600" fill="#B93D18">${label}</text>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="Segoe UI, Arial, sans-serif">
<defs>
  <marker id="a" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto"><path d="M0,0 L12,6 L0,12 z" fill="#1B2430"/></marker>
  <marker id="b" markerWidth="12" markerHeight="12" refX="2" refY="6" orient="auto"><path d="M12,0 L0,6 L12,12 z" fill="#1B2430"/></marker>
</defs>
<rect width="100%" height="100%" fill="#FAF7F2"/>
<text x="40" y="52" font-size="30" font-weight="700" fill="#1B2430">FoodHub – system architecture</text>
<text x="40" y="84" font-size="18" fill="#5B6472">Three tiers: browser (Next.js React pages) → Next.js API layer (Route Handlers) → MySQL + MongoDB</text>

${box(40, 120, 1520, 170, '#FFFFFF', '#1B2430', 'Browser – Next.js pages (React client components)', [
  'Login / sign-up · Customer: search, menu, cart, checkout, live tracking, history, addresses',
  'Restaurant: sales dashboard, live order board, menu add/edit/delete, stock · Partner: deliveries, GPS',
  'Admin: control room, partner assignment, approvals, coupons, Query lab (SQL + MongoDB results)'])}

${box(40, 380, 1520, 200, '#1B2430', '#1B2430', 'Next.js server – API layer (app/api/**/route.js)', [
  '<tspan fill="#D5DAE1">Authentication: bcrypt password check · signed JWT in an httpOnly cookie · role check on every route</tspan>',
  '<tspan fill="#D5DAE1">Validation + row-level access (an owner sees only their restaurant\'s orders) · friendly database errors</tspan>',
  '<tspan fill="#D5DAE1">lib/db.js: mysql2 connection pool + MongoDB client · settings only from environment variables (.env.local)</tspan>',
  '<tspan fill="#D5DAE1">Every SQL statement uses ? placeholders (no SQL injection) · MongoDB written after the MySQL COMMIT</tspan>'], '#F29E7C')}

${box(40, 670, 900, 200, '#FFFFFF', '#2457A6', 'MySQL 8 – primary, transactional (source of truth)', [
  '15 tables in BCNF · PK, FK, UNIQUE, CHECK, generated column',
  'Views (5) · stored functions (4) · procedures sp_place_order, sp_assign_partner',
  'Triggers (6): status rules, refunds, delivery sync, review rules, rating',
  'Indexes + FULLTEXT (restaurant, menu) · transactions with row locks'], '#2457A6')}

${box(980, 670, 580, 200, '#FFFFFF', '#1F8A4C', 'MongoDB 8 – real-time data', [
  'partner_locations (2dsphere index, $geoNear)',
  'order_tracking_events (timeline)',
  'notifications · activity_logs',
  'aggregation pipelines for analytics'], '#1F8A4C')}

${arrow(800, 290, 800, 380, 'fetch() JSON over HTTP', 820, 345)}
${arrow(490, 580, 490, 670, 'SQL: SELECT / INSERT / UPDATE / DELETE / CALL', 510, 635)}
${arrow(1270, 580, 1270, 670, 'MongoDB: insert, find, aggregate', 1290, 635)}
</svg>`;
fs.writeFileSync(path.join(__dirname, 'architecture.svg'), svg);
console.log('wrote architecture.svg');
