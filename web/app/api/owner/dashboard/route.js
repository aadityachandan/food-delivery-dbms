// Key query 3 for one outlet, built on the views v_restaurant_daily_sales
// and v_menu_popularity, plus live orders, menu and stock.
import { route, int, round2 } from '@/lib/api';
import { query, one } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { assertOwnsRestaurant } from '@/lib/access';

export const dynamic = 'force-dynamic';

export const GET = route(async req => {
  const s = await requireRole('owner');
  const p = new URL(req.url).searchParams;
  const id = int(p.get('restaurantId'), 'restaurant');
  await assertOwnsRestaurant(s, id);
  const from = p.get('from') || '2026-10-01', to = p.get('to') || '2099-12-31';
  const restaurant = await one('SELECT restaurant_id, name, status, commission_pct, rating FROM Restaurant WHERE restaurant_id = ?', [id]);
  const summary = await one(
    `SELECT COALESCE(SUM(delivered_orders), 0) AS delivered_orders, COALESCE(SUM(food_sales), 0) AS food_sales,
            COALESCE(SUM(restaurant_discounts), 0) AS restaurant_discounts, COALESCE(SUM(commission), 0) AS commission
     FROM v_restaurant_daily_sales WHERE restaurant_id = ? AND sale_date BETWEEN ? AND ?`, [id, from, to]);
  summary.net_payout = round2(summary.food_sales - summary.restaurant_discounts - summary.commission);
  const daily = await query(
    `SELECT sale_date, food_sales FROM v_restaurant_daily_sales
     WHERE restaurant_id = ? AND sale_date BETWEEN ? AND ? ORDER BY sale_date`, [id, from, to]);
  const topItems = await query(
    `SELECT item_name AS name, units_sold AS units, sales FROM v_menu_popularity
     WHERE restaurant_id = ? AND units_sold > 0 ORDER BY units_sold DESC, sales DESC LIMIT 5`, [id]);
  const liveOrders = await query(
    `SELECT v.order_id, v.order_time, v.order_status, v.total_amount, v.customer_name, v.payment_method,
            v.partner_name, v.delivery_status, o.special_instructions,
            (SELECT GROUP_CONCAT(CONCAT(m.name, ' x', oi.quantity) ORDER BY m.name SEPARATOR ', ')
             FROM Order_Item oi JOIN Menu_Item m ON m.item_id = oi.item_id WHERE oi.order_id = v.order_id) AS items
     FROM v_order_summary v JOIN Orders o ON o.order_id = v.order_id
     WHERE v.restaurant_id = ? AND v.order_status NOT IN ('DELIVERED', 'CANCELLED')
     ORDER BY v.order_time`, [id]);
  const menu = await query(
    `SELECT m.item_id, m.name, m.description, m.category, m.price, m.is_veg, m.is_available,
            (SELECT COUNT(*) FROM Order_Item oi WHERE oi.item_id = m.item_id) AS times_ordered
     FROM Menu_Item m WHERE m.restaurant_id = ? ORDER BY m.category, m.name`, [id]);
  const inventory = await query(
    `SELECT ingredient_name, unit, quantity, reorder_level, last_updated, quantity <= reorder_level AS low
     FROM Inventory WHERE restaurant_id = ? ORDER BY low DESC, ingredient_name`, [id]);
  return { restaurant, summary, daily, topItems, liveOrders, menu, inventory, from, to };
});
