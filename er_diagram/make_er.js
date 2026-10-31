// Generates the Chen-notation ER diagram:  node make_er.js  ->  er_diagram.svg
const fs = require("fs");
const path = require("path");

const W = 4050, H = 3420, OY = 150;            // canvas + vertical offset for the title
const charW = 8.2;                              // approx width of one 15px character
const tw = s => s.length * charW;

// attrs: [label, angle(deg, 0 = right, 90 = up), radius, kind?, children?]
// kind: "pk" | "partial" | "derived" | "composite"
const E = {
  PINCODE:          { x: 350,  y: 350,  attrs: [["pincode", 90, 190, "pk"], ["city", 150, 220], ["state", 35, 220]] },
  ADDRESS:          { x: 350,  y: 1500, attrs: [["address_id", 130, 220, "pk"], ["label", 165, 230], ["address_line", 200, 250], ["latitude", 235, 240], ["longitude", 312, 240], ["is_default", 42, 230]] },
  CUSTOMER:         { x: 350,  y: 2550, attrs: [["customer_id", 130, 220, "pk"], ["full_name", 165, 230], ["email", 200, 240], ["phone", 235, 240], ["password_hash", 270, 220], ["created_at", 310, 240], ["status", 345, 230]] },
  COUPON:           { x: 850,  y: 850,  attrs: [["coupon_id", 92, 210, "pk"], ["code", 62, 240], ["description", 120, 300], ["discount_type", 148, 240], ["discount_value", 175, 330], ["max_discount", 200, 240], ["min_order_value", 225, 330], ["valid_from", 250, 240], ["valid_to", 275, 330], ["usage_limit", 32, 300], ["status", 296, 230]] },
  INVENTORY:        { x: 1650, y: 330,  weak: true, attrs: [["ingredient_name", 90, 190, "partial"], ["unit", 145, 210], ["quantity", 190, 230], ["reorder_level", 240, 220], ["last_updated", 30, 240]] },
  RESTAURANT:       { x: 2450, y: 800,  attrs: [["restaurant_id", 96, 210, "pk"], ["name", 133, 230], ["cuisine_type", 60, 230], ["opening_time", 28, 240], ["rating", 45, 410], ["status", 113, 400], ["commission_pct", 12, 420], ["created_at", 202, 240], ["closing_time", 296, 250],
                       ["address", 78, 560, "composite", [["address_line", 150, 190], ["latitude", 90, 150], ["longitude", 30, 190]]]] },
  RESTAURANT_OWNER: { x: 3500, y: 800,  attrs: [["owner_id", 90, 210, "pk"], ["full_name", 45, 240], ["email", 0, 240], ["phone", 315, 240], ["password_hash", 268, 220], ["status", 135, 230]] },
  ORDERS:           { x: 1600, y: 1500, attrs: [["order_id", 95, 205, "pk"], ["order_status", 55, 240], ["subtotal", 122, 240], ["order_time", 160, 250], ["special_instructions", 76, 430], ["discount_amount", 230, 330], ["delivery_fee", 257, 300], ["tax_amount", 290, 300], ["total_amount", 335, 260, "derived"]] },
  MENU_ITEM:        { x: 2450, y: 1500, attrs: [["item_id", 35, 230, "pk"], ["name", 2, 230], ["description", 330, 250], ["category", 300, 240], ["price", 270, 220], ["is_veg", 240, 230], ["is_available", 212, 250], ["image_url", 65, 240]] },
  ADMIN:            { x: 3500, y: 1650, attrs: [["admin_id", 90, 200, "pk"], ["full_name", 40, 240], ["email", 0, 230], ["password_hash", 320, 250], ["role", 220, 220], ["created_at", 182, 240]] },
  DELIVERY:         { x: 2350, y: 2500, attrs: [["delivery_id", 85, 200, "pk"], ["assigned_at", 160, 250], ["picked_up_at", 195, 260], ["delivered_at", 230, 250], ["distance_km", 268, 220], ["delivery_status", 305, 250], ["partner_earning", 338, 260]] },
  DELIVERY_PARTNER: { x: 3500, y: 2500, attrs: [["partner_id", 112, 250, "pk"], ["full_name", 135, 370], ["phone", 158, 250], ["email", 200, 250], ["vehicle_type", 222, 370], ["vehicle_number", 244, 250], ["license_no", 266, 370], ["city", 288, 250], ["availability", 310, 370], ["rating", 332, 250], ["joined_at", 354, 370], ["account_status", 16, 250], ["total_earnings", 40, 330, "derived"]] },
  PAYMENT:          { x: 900,  y: 2900, attrs: [["payment_id", 105, 210, "pk"], ["method", 145, 230], ["amount", 185, 230], ["transaction_ref", 225, 250], ["payment_status", 275, 220], ["paid_at", 320, 230]] },
  REVIEW:           { x: 1650, y: 2950, attrs: [["review_id", 140, 220, "pk"], ["food_rating", 190, 240], ["delivery_rating", 245, 230], ["comment", 300, 220], ["created_at", 350, 240]] },
};

// links: [entity, cardinality, total participation?]
const R = [
  { name: "has",          x: 350,  y: 2025, links: [["CUSTOMER", "1", false], ["ADDRESS", "N", true]] },
  { name: "delivered to", x: 975,  y: 1500, links: [["ADDRESS", "1", false], ["ORDERS", "N", true]] },
  { name: "located in",   x: 350,  y: 925,  links: [["PINCODE", "1", false], ["ADDRESS", "N", true]] },
  { name: "located in",   x: 1250, y: 543,  links: [["PINCODE", "1", false], ["RESTAURANT", "N", true]] },
  { name: "applied to",   x: 1225, y: 1175, links: [["COUPON", "1", false], ["ORDERS", "N", false]] },
  { name: "offers",       x: 1650, y: 825,  links: [["RESTAURANT", "1", false], ["COUPON", "N", false]] },
  { name: "stocks",       x: 2050, y: 565,  identifying: true, links: [["RESTAURANT", "1", false], ["INVENTORY", "N", true]] },
  { name: "receives",     x: 2025, y: 1150, links: [["RESTAURANT", "1", false], ["ORDERS", "N", true]] },
  { name: "serves",       x: 2450, y: 1150, links: [["RESTAURANT", "1", false], ["MENU_ITEM", "N", true]] },
  { name: "contains",     x: 2025, y: 1500, links: [["ORDERS", "M", true], ["MENU_ITEM", "N", false]],
    attrs: [["quantity", 62, 150], ["unit_price", 298, 150]] },
  { name: "owns",         x: 2975, y: 800,  links: [["RESTAURANT_OWNER", "1", false], ["RESTAURANT", "N", true]] },
  { name: "approves",     x: 2975, y: 1225, links: [["ADMIN", "1", false], ["RESTAURANT", "N", false]] },
  { name: "verifies",     x: 3500, y: 2075, links: [["ADMIN", "1", false], ["DELIVERY_PARTNER", "N", false]] },
  { name: "paid via",     x: 1250, y: 2200, links: [["ORDERS", "1", false], ["PAYMENT", "1", true]] },
  { name: "rated by",     x: 1625, y: 2225, links: [["ORDERS", "1", false], ["REVIEW", "1", true]] },
  { name: "fulfilled by", x: 1975, y: 2000, links: [["ORDERS", "1", false], ["DELIVERY", "1", true]] },
  { name: "delivers",     x: 2925, y: 2500, links: [["DELIVERY_PARTNER", "1", false], ["DELIVERY", "N", true]] },
];

// ---------------- drawing ----------------
const out = [];
const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const rad = d => d * Math.PI / 180;
const pos = (cx, cy, ang, r) => [cx + r * Math.cos(rad(ang)), cy - r * Math.sin(rad(ang))];
for (const k in E) E[k].y += OY;
for (const r of R) r.y += OY;

const C = { ent: "#dce8f7", entS: "#1f3f6e", rel: "#fde7c4", relS: "#9a6512", att: "#e8f4e3", attS: "#3f6f33", pk: "#fff3bf", line: "#333" };

function poly(points, total) {
  const d = "M" + points.map(p => p.map(v => v.toFixed(1)).join(",")).join(" L");
  if (total) {
    out.push(`<path d="${d}" fill="none" stroke="${C.line}" stroke-width="7"/>`);
    out.push(`<path d="${d}" fill="none" stroke="#fff" stroke-width="3"/>`);
  } else out.push(`<path d="${d}" fill="none" stroke="${C.line}" stroke-width="1.8"/>`);
}

const attrShapes = [];
function attr(cx, cy, [label, ang, r, kind, children]) {
  const [x, y] = pos(cx, cy, ang, r);
  out.push(`<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#555" stroke-width="1.3"/>`);
  attrShapes.push({ x, y, label, kind });
  for (const ch of children || []) attr(x, y, ch);
}

for (const k in E) for (const a of E[k].attrs) attr(E[k].x, E[k].y, a);
for (const r of R) for (const a of r.attrs || []) attr(r.x, r.y, a);

const labels = [];
for (const r of R) for (const [ent, card, total] of r.links) {
  const e = E[ent];
  poly([[r.x, r.y], [e.x, e.y]], total);
  const len = Math.hypot(e.x - r.x, e.y - r.y), ux = (e.x - r.x) / len, uy = (e.y - r.y) / len;
  const d = Math.min(80, len / 2);
  labels.push([r.x + ux * d - uy * 16, r.y + uy * d + ux * 16, card]);
}

for (const a of attrShapes) {
  const rx = Math.max(48, tw(a.label) / 2 + 16), ry = 22;
  const fill = a.kind === "pk" ? C.pk : C.att;
  const dash = a.kind === "derived" ? ` stroke-dasharray="7 5"` : "";
  out.push(`<ellipse cx="${a.x.toFixed(1)}" cy="${a.y.toFixed(1)}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${C.attS}" stroke-width="1.6"${dash}/>`);
  const weight = a.kind === "pk" || a.kind === "partial" ? "700" : "400";
  out.push(`<text x="${a.x.toFixed(1)}" y="${(a.y + 5).toFixed(1)}" text-anchor="middle" font-size="15" font-weight="${weight}">${esc(a.label)}</text>`);
  if (a.kind === "pk" || a.kind === "partial") {
    const half = tw(a.label) / 2 + 1;
    out.push(`<line x1="${(a.x - half).toFixed(1)}" y1="${(a.y + 9).toFixed(1)}" x2="${(a.x + half).toFixed(1)}" y2="${(a.y + 9).toFixed(1)}" stroke="#000" stroke-width="1.4"${a.kind === "partial" ? ' stroke-dasharray="5 3"' : ""}/>`);
  }
}
for (const r of R) {
  const hw = tw(r.name) / 2 + 38, hh = 36;
  const pts = (w, h) => `${r.x - w},${r.y} ${r.x},${r.y - h} ${r.x + w},${r.y} ${r.x},${r.y + h}`;
  out.push(`<polygon points="${pts(hw, hh)}" fill="${C.rel}" stroke="${C.relS}" stroke-width="2"/>`);
  if (r.identifying) out.push(`<polygon points="${pts(hw - 11, hh - 8)}" fill="none" stroke="${C.relS}" stroke-width="2"/>`);
  out.push(`<text x="${r.x}" y="${r.y + 5}" text-anchor="middle" font-size="15" font-style="italic" font-weight="600">${esc(r.name)}</text>`);
}
for (const k in E) {
  const e = E[k], w = tw(k) * 1.12 + 44, h = 54;
  out.push(`<rect x="${e.x - w / 2}" y="${e.y - h / 2}" width="${w}" height="${h}" fill="${C.ent}" stroke="${C.entS}" stroke-width="2.4"/>`);
  if (e.weak) out.push(`<rect x="${e.x - w / 2 + 6}" y="${e.y - h / 2 + 6}" width="${w - 12}" height="${h - 12}" fill="none" stroke="${C.entS}" stroke-width="2"/>`);
  out.push(`<text x="${e.x}" y="${e.y + 6}" text-anchor="middle" font-size="17" font-weight="700" fill="${C.entS}">${k}</text>`);
}
for (const [x, y, t] of labels)
  out.push(`<text x="${x.toFixed(1)}" y="${(y + 6).toFixed(1)}" text-anchor="middle" font-size="19" font-weight="700" fill="#b3261e">${t}</text>`);

const title = `<text x="${W / 2}" y="62" text-anchor="middle" font-size="42" font-weight="700" fill="${C.entS}">Smart Multi-Vendor Food Delivery &amp; Logistics Management System</text>
<text x="${W / 2}" y="108" text-anchor="middle" font-size="25" fill="#444">Entity-Relationship Diagram (Chen notation)</text>`;
const lx = 3500, ly = 130;
const legend = `<g font-size="17">
<rect x="${lx}" y="${ly}" width="470" height="560" fill="#fafafa" stroke="#999"/>
<text x="${lx + 20}" y="${ly + 36}" font-size="21" font-weight="700">Legend</text>
<rect x="${lx + 20}" y="${ly + 60}" width="110" height="40" fill="${C.ent}" stroke="${C.entS}" stroke-width="2"/><text x="${lx + 150}" y="${ly + 86}">Strong entity</text>
<rect x="${lx + 20}" y="${ly + 115}" width="110" height="40" fill="${C.ent}" stroke="${C.entS}" stroke-width="2"/><rect x="${lx + 26}" y="${ly + 121}" width="98" height="28" fill="none" stroke="${C.entS}" stroke-width="2"/><text x="${lx + 150}" y="${ly + 141}">Weak entity</text>
<polygon points="${lx + 20},${ly + 190} ${lx + 75},${ly + 170} ${lx + 130},${ly + 190} ${lx + 75},${ly + 210}" fill="${C.rel}" stroke="${C.relS}" stroke-width="2"/><text x="${lx + 150}" y="${ly + 196}">Relationship</text>
<polygon points="${lx + 20},${ly + 245} ${lx + 75},${ly + 225} ${lx + 130},${ly + 245} ${lx + 75},${ly + 265}" fill="${C.rel}" stroke="${C.relS}" stroke-width="2"/><polygon points="${lx + 34},${ly + 245} ${lx + 75},${ly + 231} ${lx + 116},${ly + 245} ${lx + 75},${ly + 259}" fill="none" stroke="${C.relS}" stroke-width="2"/><text x="${lx + 150}" y="${ly + 251}">Identifying relationship</text>
<ellipse cx="${lx + 75}" cy="${ly + 300}" rx="55" ry="20" fill="${C.pk}" stroke="${C.attS}" stroke-width="1.6"/><text x="${lx + 75}" y="${ly + 305}" text-anchor="middle" font-weight="700" text-decoration="underline">key</text><text x="${lx + 150}" y="${ly + 306}">Primary key attribute</text>
<ellipse cx="${lx + 75}" cy="${ly + 350}" rx="55" ry="20" fill="${C.att}" stroke="${C.attS}" stroke-width="1.6"/><text x="${lx + 75}" y="${ly + 355}" text-anchor="middle" font-weight="700">partial</text><line x1="${lx + 47}" y1="${ly + 359}" x2="${lx + 103}" y2="${ly + 359}" stroke="#000" stroke-dasharray="5 3"/><text x="${lx + 150}" y="${ly + 356}">Partial key (weak entity)</text>
<ellipse cx="${lx + 75}" cy="${ly + 400}" rx="55" ry="20" fill="${C.att}" stroke="${C.attS}" stroke-width="1.6" stroke-dasharray="7 5"/><text x="${lx + 150}" y="${ly + 406}">Derived attribute</text>
<line x1="${lx + 20}" y1="${ly + 450}" x2="${lx + 130}" y2="${ly + 450}" stroke="#333" stroke-width="1.8"/><text x="${lx + 150}" y="${ly + 456}">Partial participation</text>
<line x1="${lx + 20}" y1="${ly + 495}" x2="${lx + 130}" y2="${ly + 495}" stroke="#333" stroke-width="7"/><line x1="${lx + 20}" y1="${ly + 495}" x2="${lx + 130}" y2="${ly + 495}" stroke="#fff" stroke-width="3"/><text x="${lx + 150}" y="${ly + 501}">Total participation</text>
<text x="${lx + 20}" y="${ly + 540}" fill="#b3261e" font-weight="700">1 / N / M</text><text x="${lx + 150}" y="${ly + 540}">Cardinality ratio</text>
</g>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="Segoe UI, Arial, sans-serif">
<rect width="100%" height="100%" fill="#fff"/>
${title}
${out.join("\n")}
${legend}
</svg>`;
fs.writeFileSync(path.join(__dirname, "er_diagram.svg"), svg);
console.log("wrote er_diagram.svg");
