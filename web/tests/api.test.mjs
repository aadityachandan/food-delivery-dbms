// End-to-end API tests. Run against a freshly loaded database:
//   npm test                      (app on http://localhost:3000)
//   BASE_URL=http://localhost:3311 npm test
// Results are printed and saved to tests/test-results.md
import { writeFileSync } from 'node:fs';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const PASSWORD = 'Demo@123';
const OWNER_EMAIL = {
  1: 'imran@spiceroute.in', 2: 'gopal@udupiupahar.in', 3: 'kevin@dragonwok.in', 4: 'marco@pizzapiazza.in',
  5: 'harpreet@punjabdhaba.in', 6: 'nisha@greenbowl.in', 7: 'rakesh@burgerbarn.in', 8: 'ashwin@coastalcatch.in',
  9: 'shalini@sweettooth.in',
};
const PARTNER_EMAIL = {
  1: 'manjunath.g@gmail.com', 2: 'ravi.s@gmail.com', 3: 'basavaraj.p@gmail.com', 4: 'prakash.n@gmail.com',
  5: 'senthil.k@gmail.com', 6: 'irfan.m@gmail.com', 7: 'ganesh.j@gmail.com', 9: 'gurpreet.s@gmail.com', 10: 'tapas.d@gmail.com',
};

// tiny client with its own cookie (one per logged-in user)
function client() {
  let cookie = '';
  const call = async (method, path, body) => {
    const res = await fetch(BASE + '/api' + path, {
      method, headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const set = res.headers.get('set-cookie');
    if (set) cookie = set.split(';')[0];
    let data = null;
    try { data = await res.json(); } catch { /* empty */ }
    return { status: res.status, data };
  };
  return {
    get: p => call('GET', p), post: (p, b) => call('POST', p, b), patch: (p, b) => call('PATCH', p, b), del: p => call('DELETE', p),
    login: (role, email) => call('POST', '/auth/login', { role, email, password: PASSWORD }),
  };
}

const results = [];
async function test(id, area, name, expected, fn) {
  let ok = false, actual = '';
  try { const r = await fn(); ok = r.ok; actual = r.actual; } catch (e) { actual = 'ERROR: ' + e.message; }
  results.push({ id, area, name, expected, actual, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${name}  ->  ${actual}`);
}
const expectStatus = (r, code, extra = '') => ({ ok: r.status === code, actual: `${r.status}${r.data?.error ? ` "${r.data.error}"` : ''}${extra}` });

const anon = client(), cust = client(), admin = client(), other = client();
const ctx = {};

// ---------------- authentication & authorization ----------------
await test('TC01', 'Auth', 'Customer logs in with the correct password', '200 + session cookie', async () => {
  const r = await cust.login('customer', 'aarav.sharma@gmail.com');
  return expectStatus(r, 200, r.data?.name ? ` (${r.data.name})` : '');
});
await test('TC02', 'Auth', 'Login with a wrong password is refused', '401', async () =>
  expectStatus(await anon.post('/auth/login', { role: 'customer', email: 'aarav.sharma@gmail.com', password: 'wrong-pass' }), 401));
await test('TC03', 'Auth', 'Not logged in: order history is refused', '401', async () => expectStatus(await anon.get('/orders'), 401));
await test('TC04', 'Auth', 'Customer cannot open an admin API', '403', async () => expectStatus(await cust.get('/admin/overview'), 403));
await test('TC05', 'Auth', 'Blocked customer cannot log in', '403', async () => expectStatus(await anon.login('customer', 'divya.shetty@gmail.com'), 403));
const email = `test.user.${Date.now()}@example.com`;
await test('TC06', 'Auth', 'New customer can sign up (password stored as bcrypt)', '200', async () =>
  expectStatus(await other.post('/auth/register', { full_name: 'Test User', email, phone: '9' + String(Date.now()).slice(-9),
    password: 'Secret@123', address_line: '1 Test Street', pincode: '560011' }), 200));
await test('TC07', 'Validation', 'Sign-up with an existing email is refused (UNIQUE)', '409', async () =>
  expectStatus(await anon.post('/auth/register', { full_name: 'Dup', email, phone: '9876500000', password: 'Secret@123', address_line: 'x', pincode: '560011' }), 409));
await admin.login('admin', 'lakshmi.iyer@foodhub.in');

// ---------------- customer ----------------
await test('TC08', 'Customer', 'Full-text search “paneer” finds restaurants by dish', 'restaurants with matched dishes', async () => {
  const r = await cust.get('/restaurants?city=Bengaluru&q=paneer');
  const hits = (r.data || []).filter(x => x.matched_dishes);
  return { ok: r.status === 200 && hits.length > 0, actual: `${hits.length} restaurants: ${hits.map(h => `${h.name} (${h.matched_dishes})`).join('; ')}` };
});
const open = (await cust.get('/restaurants?city=Bengaluru&openNow=1')).data?.filter(r => OWNER_EMAIL[r.restaurant_id]) || [];
ctx.rest = open[0];
await test('TC09', 'Customer', 'Find an open restaurant for the order tests', 'at least one open', async () =>
  ({ ok: !!ctx.rest, actual: ctx.rest ? `${ctx.rest.name} (#${ctx.rest.restaurant_id})` : 'none open right now – run during 11:00–22:00' }));

if (ctx.rest) {
  const menu = (await cust.get('/restaurants/' + ctx.rest.restaurant_id)).data.menu.filter(m => m.is_available);
  ctx.items = [{ itemId: menu[0].item_id, qty: 2 }];
  const addresses = (await cust.get('/customer/addresses')).data;
  ctx.address = addresses[0].address_id;

  await test('TC10', 'Customer', 'Bill preview uses stored functions (fee + 5% GST)', 'total = subtotal − discount + fee + tax', async () => {
    const r = await cust.post('/orders/quote', { restaurantId: ctx.rest.restaurant_id, items: ctx.items });
    const q = r.data;
    const okSum = q && Math.abs(q.subtotal - q.discount_amount + q.delivery_fee + q.tax_amount - q.total_amount) < 0.01;
    return { ok: r.status === 200 && okSum, actual: q ? `subtotal ${q.subtotal}, fee ${q.delivery_fee}, tax ${q.tax_amount}, total ${q.total_amount}` : r.status };
  });
  await test('TC11', 'Validation', 'Coupon for another restaurant is rejected (fn_coupon_check)', '400 with reason', async () => {
    const code = ctx.rest.restaurant_id === 2 ? 'PIZZA150' : 'DOSA10';
    return expectStatus(await cust.post('/orders/quote', { restaurantId: ctx.rest.restaurant_id, items: ctx.items, couponCode: code }), 400);
  });
  await test('TC12', 'Validation', 'Ordering to another customer’s address is refused (procedure SIGNAL)', '400', async () =>
    expectStatus(await cust.post('/orders', { restaurantId: ctx.rest.restaurant_id, addressId: 3, items: ctx.items, paymentMethod: 'UPI' }), 400));
  await test('TC13', 'Transaction', 'Place a COD order with sp_place_order', '200 + order id', async () => {
    const r = await cust.post('/orders', { restaurantId: ctx.rest.restaurant_id, addressId: ctx.address, items: ctx.items, paymentMethod: 'COD', instructions: 'test order' });
    ctx.order = r.data?.orderId;
    return expectStatus(r, 200, ctx.order ? ` order #${ctx.order}` : '');
  });
  await test('TC14', 'Customer', 'Tracking shows MySQL data and the MongoDB timeline', 'status PLACED, payment PENDING, PLACED event', async () => {
    const r = await cust.get('/orders/' + ctx.order);
    const o = r.data?.order;
    return { ok: o?.order_status === 'PLACED' && o?.payment_status === 'PENDING' && r.data.events?.some(e => e.status === 'PLACED'),
             actual: `${o?.order_status}, payment ${o?.payment_status}, events: ${(r.data?.events || []).map(e => e.status).join(',')}` };
  });

  const owner = client(), wrongOwner = client();
  await owner.login('owner', OWNER_EMAIL[ctx.rest.restaurant_id]);
  await wrongOwner.login('owner', OWNER_EMAIL[ctx.rest.restaurant_id === 9 ? 1 : 9]);
  await test('TC15', 'Authorization', 'Another restaurant’s owner cannot change this order', '403', async () =>
    expectStatus(await wrongOwner.post(`/orders/${ctx.order}/status`, { status: 'ACCEPTED' }), 403));
  await test('TC16', 'Trigger', 'Skipping steps (PLACED → READY) is blocked by trg_orders_before_update', '400', async () =>
    expectStatus(await owner.post(`/orders/${ctx.order}/status`, { status: 'READY' }), 400));
  await test('TC17', 'Owner', 'Owner accepts and starts preparing', '200, 200', async () => {
    const a = await owner.post(`/orders/${ctx.order}/status`, { status: 'ACCEPTED' });
    const b = await owner.post(`/orders/${ctx.order}/status`, { status: 'PREPARING' });
    return { ok: a.status === 200 && b.status === 200, actual: `${a.status}, ${b.status}` };
  });
  await test('TC18', 'Validation', 'Customer cannot cancel once the kitchen accepted', '400', async () =>
    expectStatus(await cust.post(`/orders/${ctx.order}/status`, { status: 'CANCELLED' }), 400));

  await test('TC19', 'NoSQL', 'Candidate partners ranked by MongoDB $geoNear distance', 'list with distances', async () => {
    const r = await admin.get(`/orders/${ctx.order}/candidates`);
    ctx.partner = r.data?.candidates?.find(c => PARTNER_EMAIL[c.partner_id]);
    return { ok: r.status === 200 && r.data.usedMongo && !!ctx.partner,
             actual: (r.data?.candidates || []).slice(0, 3).map(c => `${c.full_name} ${c.distance_km} km`).join('; ') };
  });
  await test('TC20', 'Transaction', 'Assign partner with sp_assign_partner (row locks)', '200', async () =>
    expectStatus(await admin.post(`/orders/${ctx.order}/assign`, { partnerId: ctx.partner.partner_id }), 200));
  await test('TC21', 'Validation', 'Assigning a second partner is refused', '400', async () =>
    expectStatus(await admin.post(`/orders/${ctx.order}/assign`, { partnerId: ctx.partner.partner_id }), 400));

  const partner = client();
  await partner.login('partner', PARTNER_EMAIL[ctx.partner.partner_id]);
  const deliveryId = (await partner.get('/partner/me')).data?.active?.delivery_id;
  await test('TC22', 'Validation', 'Partner cannot pick up before the order is READY', '400', async () =>
    expectStatus(await partner.post(`/deliveries/${deliveryId}/pickup`), 400));
  await test('TC23', 'Trigger', 'Pickup → delivered: trigger sets order DELIVERED, COD paid, partner free', 'DELIVERED / SUCCESS / AVAILABLE', async () => {
    await owner.post(`/orders/${ctx.order}/status`, { status: 'READY' });
    await partner.post(`/deliveries/${deliveryId}/gps`);
    const p = await partner.post(`/deliveries/${deliveryId}/pickup`);
    const d = await partner.post(`/deliveries/${deliveryId}/deliver`);
    const o = (await cust.get('/orders/' + ctx.order)).data.order;
    const me = (await partner.get('/partner/me')).data.partner;
    return { ok: p.status === 200 && d.status === 200 && o.order_status === 'DELIVERED' && o.payment_status === 'SUCCESS' && me.availability === 'AVAILABLE',
             actual: `${o.order_status} / ${o.payment_status} / ${me.availability}` };
  });
  await test('TC24', 'Trigger', 'Review refreshes the restaurant rating (trg_review_after_insert)', '200, rating recalculated', async () => {
    const before = (await cust.get('/restaurants/' + ctx.rest.restaurant_id)).data.restaurant.rating;
    const r = await cust.post(`/orders/${ctx.order}/review`, { food_rating: 1, delivery_rating: 5, comment: 'test review' });
    const after = (await cust.get('/restaurants/' + ctx.rest.restaurant_id)).data.restaurant.rating;
    return { ok: r.status === 200 && after !== before, actual: `${r.status}, rating ${before} → ${after}` };
  });
  await test('TC25', 'Validation', 'Second review of the same order is refused', '409', async () =>
    expectStatus(await cust.post(`/orders/${ctx.order}/review`, { food_rating: 5 }), 409));

  await test('TC26', 'Integrity', 'Menu: duplicate name (UNIQUE) and price 0 (CHECK) are rejected', '409, 400', async () => {
    const name = menu[0].name;
    const a = await owner.post('/owner/menu', { restaurantId: ctx.rest.restaurant_id, name, category: 'Test', price: 10, is_veg: true });
    const b = await owner.post('/owner/menu', { restaurantId: ctx.rest.restaurant_id, name: 'Zero Price Test', category: 'Test', price: 0, is_veg: true });
    return { ok: a.status === 409 && b.status === 400, actual: `${a.status}, ${b.status}` };
  });
  await test('TC27', 'Integrity', 'Deleting an item used in past orders is refused (FK RESTRICT); a new item can be deleted', '409, 200', async () => {
    const a = await owner.del('/owner/menu/' + menu[0].item_id);
    const add = await owner.post('/owner/menu', { restaurantId: ctx.rest.restaurant_id, name: 'Temporary Test Dish', category: 'Test', price: 99, is_veg: true });
    const b = await owner.del('/owner/menu/' + add.data?.itemId);
    return { ok: a.status === 409 && b.status === 200, actual: `${a.status}, ${b.status}` };
  });
}

await test('TC28', 'Integrity', 'Deleting an address used by orders is refused (FK RESTRICT)', '409', async () =>
  expectStatus(await cust.del('/customer/addresses/1'), 409));
await test('TC29', 'Integrity', 'Coupon with end date before start date is rejected (CHECK)', '400', async () =>
  expectStatus(await admin.post('/admin/coupons', { code: 'BADDATES', description: 'x', discount_type: 'FLAT', discount_value: 10,
    valid_from: '2026-12-31', valid_to: '2026-01-01' }), 400));
await test('TC30', 'Integrity', 'Deleting a coupon already used by orders is refused (FK RESTRICT)', '409', async () =>
  expectStatus(await admin.del('/admin/coupons/3'), 409));
await test('TC31', 'Queries', 'Query lab runs all important queries without errors', '9 reports, 0 errors', async () => {
  const r = await admin.get('/admin/reports');
  const errs = (r.data || []).filter(x => x.error);
  return { ok: r.status === 200 && r.data.length === 9 && !errs.length, actual: `${r.data?.length} reports, ${errs.length} errors` };
});
await test('TC32', 'NoSQL', 'MongoDB aggregation pipelines return results', 'connected, 5 pipelines', async () => {
  const r = await admin.get('/admin/analytics');
  return { ok: r.data?.connected && r.data.results.length === 5, actual: `connected=${r.data?.connected}, ${r.data?.results?.length} pipelines` };
});

// ---------------- report ----------------
const passed = results.filter(r => r.ok).length;
console.log(`\n${passed}/${results.length} tests passed`);
const md = [
  `# API test results`, ``, `Run on ${new Date().toLocaleString('en-IN')} against ${BASE}. **${passed}/${results.length} passed.**`, ``,
  `| ID | Area | Test case | Expected | Actual | Result |`, `|---|---|---|---|---|---|`,
  ...results.map(r => `| ${r.id} | ${r.area} | ${r.name} | ${r.expected} | ${String(r.actual).replace(/\|/g, '/')} | ${r.ok ? 'PASS' : 'FAIL'} |`),
].join('\n');
writeFileSync(new URL('./test-results.md', import.meta.url), md + '\n');
process.exit(passed === results.length ? 0 : 1);
