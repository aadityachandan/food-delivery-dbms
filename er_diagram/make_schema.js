// Relational schema diagram in textbook style (one row of attribute boxes per
// table, primary keys underlined, arrows from each foreign key to the key it
// references):  node make_schema.js  ->  relational_schema.svg
const fs = require('fs');
const path = require('path');

// [table, [[attribute, isPrimaryKey, referencedTable?, referencedAttribute?], ...]]
const T = [
  ['ADMIN', [['admin_id', 1], ['full_name'], ['email'], ['password_hash'], ['role'], ['created_at']]],
  ['PINCODE', [['pincode', 1], ['city'], ['state']]],
  ['CUSTOMER', [['customer_id', 1], ['full_name'], ['email'], ['phone'], ['password_hash'], ['created_at'], ['status']]],
  ['ADDRESS', [['address_id', 1], ['customer_id', 0, 'CUSTOMER', 'customer_id'], ['label'], ['address_line'],
    ['pincode', 0, 'PINCODE', 'pincode'], ['latitude'], ['longitude'], ['is_default']]],
  ['RESTAURANT_OWNER', [['owner_id', 1], ['full_name'], ['email'], ['phone'], ['password_hash'], ['status']]],
  ['RESTAURANT', [['restaurant_id', 1], ['owner_id', 0, 'RESTAURANT_OWNER', 'owner_id'], ['name'], ['cuisine_type'], ['address_line'],
    ['pincode', 0, 'PINCODE', 'pincode'], ['latitude'], ['longitude'], ['opening_time'], ['closing_time'], ['commission_pct'],
    ['rating'], ['status'], ['approved_by', 0, 'ADMIN', 'admin_id'], ['created_at']]],
  ['MENU_ITEM', [['item_id', 1], ['restaurant_id', 0, 'RESTAURANT', 'restaurant_id'], ['name'], ['description'], ['category'],
    ['price'], ['is_veg'], ['is_available'], ['image_url']]],
  ['INVENTORY', [['restaurant_id', 1, 'RESTAURANT', 'restaurant_id'], ['ingredient_name', 1], ['unit'], ['quantity'], ['reorder_level'], ['last_updated']]],
  ['COUPON', [['coupon_id', 1], ['code'], ['description'], ['discount_type'], ['discount_value'], ['max_discount'], ['min_order_value'],
    ['valid_from'], ['valid_to'], ['usage_limit'], ['restaurant_id', 0, 'RESTAURANT', 'restaurant_id'], ['status']]],
  ['ORDERS', [['order_id', 1], ['address_id', 0, 'ADDRESS', 'address_id'], ['restaurant_id', 0, 'RESTAURANT', 'restaurant_id'],
    ['coupon_id', 0, 'COUPON', 'coupon_id'], ['order_time'], ['subtotal'], ['discount_amount'], ['delivery_fee'], ['tax_amount'],
    ['total_amount'], ['order_status'], ['special_instructions']]],
  ['ORDER_ITEM', [['order_id', 1, 'ORDERS', 'order_id'], ['item_id', 1, 'MENU_ITEM', 'item_id'], ['quantity'], ['unit_price']]],
  ['PAYMENT', [['payment_id', 1], ['order_id', 0, 'ORDERS', 'order_id'], ['method'], ['amount'], ['transaction_ref'], ['payment_status'], ['paid_at']]],
  ['DELIVERY_PARTNER', [['partner_id', 1], ['full_name'], ['phone'], ['email'], ['vehicle_type'], ['vehicle_number'], ['license_no'],
    ['city'], ['availability'], ['rating'], ['joined_at'], ['account_status'], ['verified_by', 0, 'ADMIN', 'admin_id']]],
  ['DELIVERY', [['delivery_id', 1], ['order_id', 0, 'ORDERS', 'order_id'], ['partner_id', 0, 'DELIVERY_PARTNER', 'partner_id'],
    ['assigned_at'], ['picked_up_at'], ['delivered_at'], ['distance_km'], ['delivery_status'], ['partner_earning']]],
  ['REVIEW', [['review_id', 1], ['order_id', 0, 'ORDERS', 'order_id'], ['food_rating'], ['delivery_rating'], ['comment'], ['created_at']]],
];

const FONT = 15, CHAR = 8.1, PADX = 9, ROW_H = 32, LABEL_H = 24, LANE = 10, CH_GAP = 12;
const textW = s => s.length * CHAR;

// foreign keys
const fks = [];
T.forEach(([name, attrs], ti) => attrs.forEach(([a, , rt, ra], ai) => {
  if (rt) fks.push({ ti, ai, tj: T.findIndex(t => t[0] === rt), aj: T.find(t => t[0] === rt)[1].findIndex(x => x[0] === ra), label: `${name}.${a}` });
}));

const X0 = 40 + fks.length * CH_GAP + 24;   // tables start right of the arrow channels

// cell geometry
const tables = T.map(([name, attrs]) => {
  let x = X0;
  const cells = attrs.map(([a, pk]) => { const w = Math.round(textW(a) + 2 * PADX); const c = { a, pk, x, w }; x += w; return c; });
  return { name, cells, right: x };
});

// lanes: every FK uses one lane in the gap below its source table and one in
// the gap below its target table; lanes are ordered left to right by cell x
const gapUse = tables.map(() => []);
fks.forEach((f, i) => {
  gapUse[f.ti].push({ i, end: 'src', x: tables[f.ti].cells[f.ai].x + tables[f.ti].cells[f.ai].w / 2 });
  gapUse[f.tj].push({ i, end: 'dst', x: tables[f.tj].cells[f.aj].x + tables[f.tj].cells[f.aj].w / 2 });
});
gapUse.forEach(list => list.sort((p, q) => p.x - q.x || (p.end === 'dst') - (q.end === 'dst')));

// vertical positions
let y = 70;
tables.forEach((t, k) => {
  t.labelY = y;
  t.rowY = y + LABEL_H;
  const below = t.rowY + ROW_H;
  gapUse[k].forEach((u, li) => { u.y = below + 14 + li * LANE; });
  y = below + 14 + gapUse[k].length * LANE + 22;
});
const H = y + 20;
const W = Math.max(...tables.map(t => t.right)) + 40;

// channels: longest arrows furthest left
const order = fks.map((f, i) => i).sort((a, b) => {
  const span = i => Math.abs(fks[i].tj - fks[i].ti);
  return span(b) - span(a);
});
order.forEach((fi, rank) => { fks[fi].cx = 40 + rank * CH_GAP; });

const out = [];
const esc = s => s.replace(/&/g, '&amp;');
// arrows first so boxes paint over line ends
fks.forEach((f, i) => {
  const s = gapUse[f.ti].find(u => u.i === i && u.end === 'src');
  const d = gapUse[f.tj].find(u => u.i === i && u.end === 'dst');
  const sBottom = tables[f.ti].rowY + ROW_H, dBottom = tables[f.tj].rowY + ROW_H;
  const pts = [[s.x, sBottom], [s.x, s.y], [f.cx, s.y], [f.cx, d.y], [d.x, d.y], [d.x, dBottom + 9]];
  out.push(`<polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="none" stroke="#1B2430" stroke-width="1.6"/>`);
  out.push(`<polygon points="${d.x},${dBottom + 1} ${d.x - 5.5},${dBottom + 11} ${d.x + 5.5},${dBottom + 11}" fill="#1B2430"/>`);
});
tables.forEach(t => {
  out.push(`<text x="${X0}" y="${t.labelY + 17}" font-size="15" font-weight="700" fill="#1B2430" letter-spacing="0.5">${t.name}</text>`);
  t.cells.forEach(c => {
    out.push(`<rect x="${c.x}" y="${t.rowY}" width="${c.w}" height="${ROW_H}" fill="${c.pk ? '#FFF6D6' : '#FFFFFF'}" stroke="#1B2430" stroke-width="1.4"/>`);
    out.push(`<text x="${c.x + c.w / 2}" y="${t.rowY + 21}" text-anchor="middle" font-size="${FONT}" fill="#111">${esc(c.a)}</text>`);
    if (c.pk) out.push(`<line x1="${c.x + PADX - 1}" y1="${t.rowY + 25}" x2="${c.x + c.w - PADX + 1}" y2="${t.rowY + 25}" stroke="#111" stroke-width="1.3"/>`);
  });
});

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="Arial, Helvetica, sans-serif">
<rect width="100%" height="100%" fill="#fff"/>
<text x="${X0}" y="36" font-size="22" font-weight="700" fill="#1B2430">Relational Schema – Smart Multi-Vendor Food Delivery &amp; Logistics Management System</text>
<text x="${X0}" y="58" font-size="14" fill="#555">Primary keys are underlined (shaded). Each arrow goes from a foreign key to the primary key it references.</text>
${out.join('\n')}
</svg>`;
fs.writeFileSync(path.join(__dirname, 'relational_schema.svg'), svg);
console.log(`wrote relational_schema.svg (${W} x ${H}), ${fks.length} foreign keys`);
