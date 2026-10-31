import { route } from '@/lib/api';
import { query, one, mongo } from '@/lib/db';
import { requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const GET = route(async req => {
  await requireRole('admin');
  const p = new URL(req.url).searchParams;
  const from = p.get('from') || '2026-10-01', to = p.get('to') || '2099-12-31';
  const kpi = await one(
    `SELECT COUNT(*) AS orders, COALESCE(SUM(o.order_status = 'DELIVERED'), 0) AS delivered,
            COALESCE(SUM(IF(o.order_status = 'DELIVERED', o.total_amount, 0)), 0) AS gross_value,
            COALESCE(ROUND(SUM(IF(o.order_status = 'DELIVERED', o.subtotal * r.commission_pct / 100, 0)), 2), 0) AS commission
     FROM Orders o JOIN Restaurant r ON r.restaurant_id = o.restaurant_id
     WHERE DATE(o.order_time) BETWEEN ? AND ?`, [from, to]);
  const partners = await one(
    `SELECT COALESCE(SUM(availability = 'AVAILABLE'), 0) AS available, COALESCE(SUM(availability = 'BUSY'), 0) AS busy
     FROM Delivery_Partner WHERE account_status = 'ACTIVE'`);
  const revenue = await query(
    `SELECT restaurant_name AS name, SUM(delivered_orders) AS orders, SUM(food_sales) AS food_sales, SUM(commission) AS commission
     FROM v_restaurant_daily_sales WHERE sale_date BETWEEN ? AND ?
     GROUP BY restaurant_id, restaurant_name ORDER BY food_sales DESC`, [from, to]);
  const topItems = await query(
    'SELECT item_name AS name, restaurant_name AS restaurant, units_sold AS units FROM v_menu_popularity ORDER BY units_sold DESC LIMIT 5');
  const waiting = await query(
    `SELECT v.order_id, v.restaurant_name, v.city, v.order_status, v.order_time, v.total_amount,
            TIMESTAMPDIFF(MINUTE, v.order_time, NOW()) AS waiting_minutes
     FROM v_order_summary v WHERE v.delivery_id IS NULL AND v.order_status NOT IN ('DELIVERED', 'CANCELLED')
     ORDER BY v.order_time`);
  const pending = await query(
    `SELECT r.restaurant_id, r.name, r.cuisine_type, pc.city, ro.full_name AS owner_name, r.created_at
     FROM Restaurant r JOIN Pincode pc ON pc.pincode = r.pincode JOIN Restaurant_Owner ro ON ro.owner_id = r.owner_id
     WHERE r.status = 'PENDING_APPROVAL' ORDER BY r.created_at`);
  const activity = await mongo(db => db.collection('activity_logs').find({}, { projection: { _id: 0 } })
    .sort({ at: -1 }).limit(12).toArray(), null);
  return { kpi, partners, revenue, topItems, waiting, pending, activity, from, to };
});
