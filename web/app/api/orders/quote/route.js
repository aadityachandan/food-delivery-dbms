// Bill preview. Uses the same stored functions as sp_place_order, so the
// preview and the real bill can never disagree.
import { route, readJson, int, fail, round2 } from '@/lib/api';
import { query, one } from '@/lib/db';
import { requireRole } from '@/lib/auth';

export const POST = route(async req => {
  await requireRole('customer');
  const b = await readJson(req);
  const rid = int(b.restaurantId, 'restaurant');
  const items = Array.isArray(b.items) ? b.items : [];
  if (!items.length) fail(400, 'Your cart is empty');
  const ids = items.map(i => int(i.itemId, 'item'));
  const rows = await query('SELECT item_id, name, price, is_available, restaurant_id FROM Menu_Item WHERE item_id IN (?)', [ids]);
  const byId = new Map(rows.map(r => [r.item_id, r]));
  let subtotal = 0;
  for (const i of items) {
    const m = byId.get(Number(i.itemId));
    if (!m || m.restaurant_id !== rid) fail(400, 'All items must come from one restaurant');
    if (!m.is_available) fail(400, `${m.name} is out of stock`);
    subtotal += m.price * int(i.qty, 'quantity');
  }
  let coupon = null;
  if (b.couponCode) {
    const { msg } = await one('SELECT fn_coupon_check(?, ?, ?) AS msg', [b.couponCode, rid, subtotal]);
    if (msg) fail(400, msg);
    coupon = await one('SELECT coupon_id, code, description FROM Coupon WHERE code = UPPER(TRIM(?))', [b.couponCode]);
  }
  subtotal = round2(subtotal);
  const f = await one('SELECT fn_coupon_discount(?, ?) AS discount, fn_delivery_fee(?) AS fee',
    [coupon?.coupon_id ?? null, subtotal, subtotal]);
  const tax = round2((subtotal - f.discount) * 0.05);
  return {
    subtotal, discount_amount: f.discount, delivery_fee: f.fee, tax_amount: tax,
    total_amount: round2(subtotal - f.discount + f.fee + tax), coupon_code: coupon?.code ?? null,
  };
});
