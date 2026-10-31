// "Query Lab": important SQL queries run live, shown with their SQL text.
// The list is fixed in code - users cannot send their own SQL.
import { route } from '@/lib/api';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const REPORTS = [
  {
    id: 'having', title: 'Busy restaurants and their ratings', concept: 'JOIN · GROUP BY · HAVING · ORDER BY · aggregates',
    sql: `SELECT r.name, COUNT(o.order_id) AS delivered_orders,
       ROUND(AVG(rv.food_rating), 2) AS avg_food_rating
FROM Restaurant r
JOIN Orders o ON o.restaurant_id = r.restaurant_id AND o.order_status = 'DELIVERED'
LEFT JOIN Review rv ON rv.order_id = o.order_id
GROUP BY r.restaurant_id, r.name
HAVING COUNT(o.order_id) >= 2
ORDER BY delivered_orders DESC, avg_food_rating DESC`,
  },
  {
    id: 'not-exists', title: 'Customers who have never ordered', concept: 'NOT EXISTS subquery',
    sql: `SELECT c.customer_id, c.full_name, c.email
FROM Customer c
WHERE NOT EXISTS (SELECT 1 FROM Orders o JOIN Address a ON a.address_id = o.address_id
                  WHERE a.customer_id = c.customer_id)`,
  },
  {
    id: 'not-in', title: 'Menu items never ordered', concept: 'NOT IN subquery',
    sql: `SELECT m.name AS item, r.name AS restaurant, m.price
FROM Menu_Item m JOIN Restaurant r ON r.restaurant_id = m.restaurant_id
WHERE m.item_id NOT IN (SELECT DISTINCT item_id FROM Order_Item)
ORDER BY r.name, m.name`,
  },
  {
    id: 'correlated', title: 'Dishes priced above their restaurant’s average', concept: 'Correlated subquery',
    sql: `SELECT r.name AS restaurant, m.name AS item, m.price
FROM Menu_Item m JOIN Restaurant r ON r.restaurant_id = m.restaurant_id
WHERE m.price > (SELECT AVG(m2.price) FROM Menu_Item m2
                 WHERE m2.restaurant_id = m.restaurant_id)
ORDER BY r.name, m.price DESC`,
  },
  {
    id: 'window', title: 'Partner leaderboard in each city', concept: 'View + window function (RANK OVER PARTITION BY)',
    sql: `SELECT city, full_name, deliveries_done, total_earnings,
       RANK() OVER (PARTITION BY city ORDER BY total_earnings DESC) AS rank_in_city
FROM v_partner_stats
ORDER BY city, rank_in_city`,
  },
  {
    id: 'view-sales', title: 'Revenue by restaurant (from a view)', concept: 'VIEW v_restaurant_daily_sales · SUM · GROUP BY',
    sql: `SELECT restaurant_name, SUM(delivered_orders) AS orders,
       SUM(food_sales) AS food_sales, SUM(commission) AS commission
FROM v_restaurant_daily_sales
GROUP BY restaurant_id, restaurant_name
ORDER BY food_sales DESC`,
  },
  {
    id: 'functions', title: 'Stored functions in action', concept: 'User-defined functions',
    sql: `SELECT fn_delivery_fee(450) AS fee_below_500,
       fn_delivery_fee(650) AS fee_from_500,
       fn_coupon_check('PIZZA150', 2, 800) AS wrong_restaurant,
       fn_coupon_check('DOSA10', 2, 100) AS below_minimum,
       fn_coupon_discount(4, 300) AS dosa10_on_300,
       fn_partner_earning(3.5) AS pay_for_3_5_km`,
  },
  {
    id: 'fulltext', title: 'Full-text search for “paneer chicken”', concept: 'FULLTEXT index · MATCH … AGAINST (BOOLEAN MODE)',
    sql: `SELECT m.name, r.name AS restaurant,
       ROUND(MATCH(m.name, m.description) AGAINST ('paneer* chicken*' IN BOOLEAN MODE), 3) AS relevance
FROM Menu_Item m JOIN Restaurant r ON r.restaurant_id = m.restaurant_id
WHERE MATCH(m.name, m.description) AGAINST ('paneer* chicken*' IN BOOLEAN MODE)
ORDER BY relevance DESC`,
  },
  {
    id: 'low-stock', title: 'Ingredients to reorder', concept: 'VIEW v_low_stock',
    sql: `SELECT restaurant_name, ingredient_name, quantity, unit, reorder_level
FROM v_low_stock
ORDER BY restaurant_name`,
  },
];

export const GET = route(async () => {
  await requireRole('admin');
  const out = [];
  for (const r of REPORTS) {
    try { out.push({ ...r, rows: await query(r.sql) }); }
    catch (e) { out.push({ ...r, rows: [], error: e.sqlMessage || e.message }); }
  }
  return out;
});
