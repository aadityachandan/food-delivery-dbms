import { route, int, fail } from '@/lib/api';
import { query, one } from '@/lib/db';
import { requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const GET = route(async (req, { params }) => {
  await requireRole('customer', 'admin', 'owner', 'partner');
  const id = int((await params).id, 'restaurant');
  const r = await one(
    `SELECT r.restaurant_id, r.name, r.cuisine_type, r.address_line, r.rating, r.status, pc.city,
            TIME_FORMAT(r.opening_time, '%H:%i') AS opening_time, TIME_FORMAT(r.closing_time, '%H:%i') AS closing_time,
            (r.status = 'OPEN' AND CURTIME() BETWEEN r.opening_time AND r.closing_time) AS is_open_now
     FROM Restaurant r JOIN Pincode pc ON pc.pincode = r.pincode WHERE r.restaurant_id = ?`, [id]);
  if (!r) fail(404, 'Restaurant not found');
  const menu = await query(
    'SELECT item_id, name, description, category, price, is_veg, is_available FROM Menu_Item WHERE restaurant_id = ? ORDER BY category, price', [id]);
  const coupons = await query(
    `SELECT code, description, min_order_value FROM Coupon
     WHERE status = 'ACTIVE' AND CURDATE() BETWEEN valid_from AND valid_to AND (restaurant_id IS NULL OR restaurant_id = ?)
     ORDER BY restaurant_id IS NULL, code`, [id]);
  return { restaurant: r, menu, coupons };
});
