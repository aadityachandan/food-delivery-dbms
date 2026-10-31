// Coupons: list (SELECT with a subquery for usage) and create (INSERT).
// CHECK constraints in MySQL reject bad dates and percentages over 100.
import { route, readJson, text } from '@/lib/api';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { logActivity } from '@/lib/realtime';

export const dynamic = 'force-dynamic';

export const GET = route(async () => {
  await requireRole('admin');
  const coupons = await query(
    `SELECT c.coupon_id, c.code, c.description, c.discount_type, c.discount_value, c.max_discount, c.min_order_value,
            c.valid_from, c.valid_to, c.usage_limit, c.status, r.name AS restaurant_name,
            (SELECT COUNT(*) FROM Orders o WHERE o.coupon_id = c.coupon_id) AS times_used
     FROM Coupon c LEFT JOIN Restaurant r ON r.restaurant_id = c.restaurant_id
     ORDER BY c.status, c.code`);
  const restaurants = await query("SELECT restaurant_id, name FROM Restaurant WHERE status <> 'PENDING_APPROVAL' ORDER BY name");
  return { coupons, restaurants };
});

export const POST = route(async req => {
  const s = await requireRole('admin');
  const b = await readJson(req);
  const code = text(b.code, 'Code', { max: 20 }).toUpperCase();
  const res = await query(
    `INSERT INTO Coupon (code, description, discount_type, discount_value, max_discount, min_order_value,
                         valid_from, valid_to, usage_limit, restaurant_id, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
    [code, text(b.description, 'Description', { max: 150 }), b.discount_type === 'FLAT' ? 'FLAT' : 'PERCENT',
     Number(b.discount_value), b.max_discount ? Number(b.max_discount) : null, Number(b.min_order_value || 0),
     b.valid_from, b.valid_to, Number(b.usage_limit || 1000), b.restaurant_id ? Number(b.restaurant_id) : null]);
  await logActivity({ type: 'ADMIN', id: s.id }, 'COUPON_CREATED', { coupon_id: res.insertId }, { code });
  return { couponId: res.insertId };
});
