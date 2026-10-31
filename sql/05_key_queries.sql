-- =====================================================================
--  Smart Multi-Vendor Food Delivery & Logistics Management System
--  File 5 : Important queries (run after files 01-04)
-- =====================================================================
USE food_delivery;

-- The sample data is a snapshot taken on 25-Oct-2026 at 1:40 PM.
-- In the live system replace @now with NOW().
SET @now = TIMESTAMP('2026-10-25 13:40:00');

-- ---------------------------------------------------------------------
-- Q1. Find available restaurants and menu items matching what the
--     customer wants (city, cuisine/category, budget, veg, rating, open)
-- ---------------------------------------------------------------------
SET @city = 'Bengaluru', @max_price = 300, @veg_only = TRUE, @min_rating = 4.0;

SELECT r.name AS restaurant, r.cuisine_type, r.rating,
       m.name AS item, m.category, m.price
FROM Restaurant r
JOIN Pincode pc  ON pc.pincode = r.pincode
JOIN Menu_Item m ON m.restaurant_id = r.restaurant_id
WHERE pc.city = @city
  AND r.status = 'OPEN'
  AND TIME(@now) BETWEEN r.opening_time AND r.closing_time
  AND r.rating >= @min_rating
  AND m.is_available = TRUE
  AND m.price <= @max_price
  AND (@veg_only = FALSE OR m.is_veg = TRUE)
ORDER BY r.rating DESC, m.price;

-- Restaurants serving a given cuisine, with how many items are available
SELECT r.name, r.cuisine_type, r.rating,
       COUNT(m.item_id)             AS available_items,
       MIN(m.price)                 AS cheapest,
       ROUND(AVG(m.price), 2)       AS avg_price
FROM Restaurant r
JOIN Pincode pc  ON pc.pincode = r.pincode
JOIN Menu_Item m ON m.restaurant_id = r.restaurant_id AND m.is_available = TRUE
WHERE pc.city = @city AND r.status = 'OPEN' AND r.cuisine_type IN ('North Indian', 'Biryani')
GROUP BY r.restaurant_id, r.name, r.cuisine_type, r.rating;

-- ---------------------------------------------------------------------
-- Q2. Track an order from placement to delivery
-- ---------------------------------------------------------------------
SET @order_id = 22;

-- (a) current snapshot
SELECT o.order_id, c.full_name AS customer, r.name AS restaurant,
       o.order_status, p.payment_status, p.method,
       dp.full_name AS delivery_partner, dp.phone AS partner_phone,
       d.delivery_status, d.distance_km,
       CONCAT(a.address_line, ', ', pc.city) AS deliver_to,
       o.total_amount
FROM Orders o
JOIN Address a          ON a.address_id    = o.address_id
JOIN Pincode pc         ON pc.pincode      = a.pincode
JOIN Customer c         ON c.customer_id   = a.customer_id
JOIN Restaurant r       ON r.restaurant_id = o.restaurant_id
LEFT JOIN Payment p     ON p.order_id      = o.order_id
LEFT JOIN Delivery d    ON d.order_id      = o.order_id
LEFT JOIN Delivery_Partner dp ON dp.partner_id = d.partner_id
WHERE o.order_id = @order_id;

-- (b) timeline (detailed events and live GPS come from MongoDB)
SELECT * FROM (
    SELECT o.order_time AS event_time, 'ORDER PLACED' AS event FROM Orders o WHERE o.order_id = @order_id
    UNION ALL SELECT p.paid_at,       CONCAT('PAYMENT ', p.payment_status) FROM Payment p  WHERE p.order_id = @order_id
    UNION ALL SELECT d.assigned_at,   'PARTNER ASSIGNED'  FROM Delivery d WHERE d.order_id = @order_id
    UNION ALL SELECT d.picked_up_at,  'PICKED UP'         FROM Delivery d WHERE d.order_id = @order_id
    UNION ALL SELECT d.delivered_at,  'DELIVERED'         FROM Delivery d WHERE d.order_id = @order_id
) t
WHERE event_time IS NOT NULL
ORDER BY event_time;

-- ---------------------------------------------------------------------
-- Q3. Restaurant revenue and popular menu items for a time period
-- ---------------------------------------------------------------------
SET @from = DATE('2026-10-01'), @to = DATE('2026-10-25');

-- (a) revenue per restaurant: food sales, commission and payout
--     (restaurant coupons are funded by the restaurant,
--      platform coupons are funded by the platform)
SELECT r.name AS restaurant,
       COUNT(o.order_id)                                   AS delivered_orders,
       SUM(o.subtotal)                                     AS food_sales,
       SUM(IF(cp.restaurant_id IS NOT NULL, o.discount_amount, 0)) AS restaurant_discounts,
       ROUND(SUM(o.subtotal) * r.commission_pct / 100, 2)  AS platform_commission,
       ROUND(SUM(o.subtotal)
             - SUM(IF(cp.restaurant_id IS NOT NULL, o.discount_amount, 0))
             - SUM(o.subtotal) * r.commission_pct / 100, 2) AS net_payout
FROM Restaurant r
JOIN Orders o       ON o.restaurant_id = r.restaurant_id
LEFT JOIN Coupon cp ON cp.coupon_id = o.coupon_id
WHERE o.order_status = 'DELIVERED'
  AND DATE(o.order_time) BETWEEN @from AND @to
GROUP BY r.restaurant_id, r.name, r.commission_pct
ORDER BY food_sales DESC;

-- (b) top 5 most popular menu items on the platform
SELECT m.name AS item, r.name AS restaurant,
       SUM(oi.quantity)                 AS units_sold,
       SUM(oi.quantity * oi.unit_price) AS sales
FROM Order_Item oi
JOIN Orders o     ON o.order_id = oi.order_id
JOIN Menu_Item m  ON m.item_id  = oi.item_id
JOIN Restaurant r ON r.restaurant_id = m.restaurant_id
WHERE o.order_status = 'DELIVERED'
  AND DATE(o.order_time) BETWEEN @from AND @to
GROUP BY m.item_id, m.name, r.name
ORDER BY units_sold DESC, sales DESC
LIMIT 5;

-- (c) best-selling item of every restaurant (window function)
SELECT restaurant, item, units_sold
FROM (
    SELECT r.name AS restaurant, m.name AS item, SUM(oi.quantity) AS units_sold,
           RANK() OVER (PARTITION BY r.restaurant_id ORDER BY SUM(oi.quantity) DESC) AS rnk
    FROM Order_Item oi
    JOIN Orders o     ON o.order_id = oi.order_id AND o.order_status = 'DELIVERED'
    JOIN Menu_Item m  ON m.item_id  = oi.item_id
    JOIN Restaurant r ON r.restaurant_id = m.restaurant_id
    GROUP BY r.restaurant_id, r.name, m.item_id, m.name
) ranked
WHERE rnk = 1
ORDER BY restaurant;

-- ---------------------------------------------------------------------
-- Q4. Find available delivery partners and assign a delivery
--     (nearest-partner ranking uses live GPS from MongoDB; MySQL ranks
--      by today's workload and rating)
-- ---------------------------------------------------------------------
SET @order_id = 24;

-- (a) candidate partners for the order's restaurant city
SELECT dp.partner_id, dp.full_name, dp.vehicle_type, dp.rating,
       COUNT(d.delivery_id)               AS deliveries_today,
       COALESCE(SUM(d.partner_earning),0) AS earned_today
FROM Orders o
JOIN Restaurant r        ON r.restaurant_id = o.restaurant_id
JOIN Pincode pc          ON pc.pincode = r.pincode
JOIN Delivery_Partner dp ON dp.city = pc.city
LEFT JOIN Delivery d     ON d.partner_id = dp.partner_id
                        AND DATE(d.assigned_at) = DATE(@now)
WHERE o.order_id = @order_id
  AND dp.account_status = 'ACTIVE'
  AND dp.availability   = 'AVAILABLE'
GROUP BY dp.partner_id, dp.full_name, dp.vehicle_type, dp.rating
ORDER BY deliveries_today, dp.rating DESC;

-- (b) orders that are waiting for a delivery partner
SELECT o.order_id, r.name AS restaurant, o.order_status, o.order_time,
       TIMESTAMPDIFF(MINUTE, o.order_time, @now) AS waiting_minutes
FROM Orders o
JOIN Restaurant r    ON r.restaurant_id = o.restaurant_id
LEFT JOIN Delivery d ON d.order_id = o.order_id
WHERE d.delivery_id IS NULL
  AND o.order_status NOT IN ('DELIVERED','CANCELLED');

-- (c) assign partner 3 to order 24 as one transaction
--     (rolled back here so the sample data stays unchanged;
--      the application will COMMIT)
START TRANSACTION;
INSERT INTO Delivery (order_id, partner_id, assigned_at, distance_km, partner_earning)
VALUES (@order_id, 3, @now, 2.60, 25 + 8 * 2.60);
UPDATE Delivery_Partner SET availability = 'BUSY' WHERE partner_id = 3;
SELECT d.order_id, dp.full_name, dp.availability, d.delivery_status
FROM Delivery d JOIN Delivery_Partner dp ON dp.partner_id = d.partner_id
WHERE d.order_id = @order_id;
ROLLBACK;

-- ---------------------------------------------------------------------
-- Q5. A customer's complete order history with payment and delivery
-- ---------------------------------------------------------------------
SELECT o.order_id, o.order_time, r.name AS restaurant,
       GROUP_CONCAT(CONCAT(m.name, ' x', oi.quantity) SEPARATOR ', ') AS items,
       o.total_amount, p.method, p.payment_status,
       o.order_status, d.delivered_at
FROM Orders o
JOIN Address a       ON a.address_id    = o.address_id
JOIN Restaurant r    ON r.restaurant_id = o.restaurant_id
JOIN Order_Item oi   ON oi.order_id = o.order_id
JOIN Menu_Item m     ON m.item_id   = oi.item_id
LEFT JOIN Payment p  ON p.order_id  = o.order_id
LEFT JOIN Delivery d ON d.order_id  = o.order_id
WHERE a.customer_id = 1
GROUP BY o.order_id, o.order_time, r.name, o.total_amount, p.method, p.payment_status, o.order_status, d.delivered_at
ORDER BY o.order_time DESC;

-- ---------------------------------------------------------------------
-- Extra: owner inventory alert and data consistency checks
-- ---------------------------------------------------------------------
-- Ingredients at or below reorder level
SELECT r.name AS restaurant, i.ingredient_name, i.quantity, i.unit, i.reorder_level
FROM Inventory i JOIN Restaurant r ON r.restaurant_id = i.restaurant_id
WHERE i.quantity <= i.reorder_level
ORDER BY r.name;

-- Every order's subtotal must equal the sum of its items and its total
-- must follow the billing formula (expect: empty result)
SELECT o.order_id, o.subtotal, SUM(oi.quantity * oi.unit_price) AS items_total
FROM Orders o JOIN Order_Item oi ON oi.order_id = o.order_id
GROUP BY o.order_id, o.subtotal, o.discount_amount, o.delivery_fee, o.tax_amount, o.total_amount
HAVING o.subtotal <> items_total
    OR o.total_amount <> o.subtotal - o.discount_amount + o.delivery_fee + o.tax_amount;

-- Payment amount must equal the order total (expect: empty result)
SELECT o.order_id, o.total_amount, p.amount
FROM Orders o JOIN Payment p ON p.order_id = o.order_id
WHERE o.total_amount <> p.amount;

-- =====================================================================
-- More important queries: HAVING, subqueries, views, functions,
-- full-text search and DELETE
-- =====================================================================

-- Q6. GROUP BY + HAVING: restaurants with at least 2 delivered orders
--     and their average food rating
SELECT r.name, COUNT(o.order_id) AS delivered_orders, ROUND(AVG(rv.food_rating), 2) AS avg_food_rating
FROM Restaurant r
JOIN Orders o       ON o.restaurant_id = r.restaurant_id AND o.order_status = 'DELIVERED'
LEFT JOIN Review rv ON rv.order_id = o.order_id
GROUP BY r.restaurant_id, r.name
HAVING COUNT(o.order_id) >= 2
ORDER BY delivered_orders DESC, avg_food_rating DESC;

-- Q7. NOT EXISTS subquery: customers who have never placed an order
SELECT c.customer_id, c.full_name, c.email
FROM Customer c
WHERE NOT EXISTS (SELECT 1 FROM Orders o JOIN Address a ON a.address_id = o.address_id
                  WHERE a.customer_id = c.customer_id);

-- Q8. NOT IN subquery: menu items that have never been ordered
SELECT m.item_id, m.name, r.name AS restaurant
FROM Menu_Item m JOIN Restaurant r ON r.restaurant_id = m.restaurant_id
WHERE m.item_id NOT IN (SELECT DISTINCT item_id FROM Order_Item)
ORDER BY r.name, m.name;

-- Q9. Correlated subquery: items priced above their restaurant's average
SELECT r.name AS restaurant, m.name AS item, m.price
FROM Menu_Item m JOIN Restaurant r ON r.restaurant_id = m.restaurant_id
WHERE m.price > (SELECT AVG(m2.price) FROM Menu_Item m2 WHERE m2.restaurant_id = m.restaurant_id)
ORDER BY r.name, m.price DESC;

-- Q10. Scalar subquery in SELECT: each customer's spend vs the platform average
SELECT c.full_name,
       SUM(o.total_amount) AS total_spent,
       ROUND((SELECT AVG(t.spent) FROM (SELECT SUM(o2.total_amount) AS spent
                                        FROM Orders o2 JOIN Address a2 ON a2.address_id = o2.address_id
                                        WHERE o2.order_status = 'DELIVERED' GROUP BY a2.customer_id) t), 2) AS platform_avg
FROM Customer c
JOIN Address a ON a.customer_id = c.customer_id
JOIN Orders o  ON o.address_id = a.address_id AND o.order_status = 'DELIVERED'
GROUP BY c.customer_id, c.full_name
ORDER BY total_spent DESC;

-- Q11. Views
SELECT * FROM v_partner_stats ORDER BY total_earnings DESC;
SELECT restaurant_name, SUM(delivered_orders) AS orders, SUM(food_sales) AS sales, SUM(commission) AS commission
FROM v_restaurant_daily_sales WHERE sale_date BETWEEN '2026-10-01' AND '2026-10-25'
GROUP BY restaurant_name ORDER BY sales DESC;
SELECT * FROM v_menu_popularity ORDER BY units_sold DESC LIMIT 5;
SELECT * FROM v_low_stock;

-- Q12. Stored functions
SELECT fn_delivery_fee(450) AS fee_below_500, fn_delivery_fee(650) AS fee_above_500,
       fn_coupon_check('PIZZA150', 2, 800) AS wrong_restaurant,
       fn_coupon_check('DOSA10', 2, 100)   AS below_minimum,
       fn_coupon_check('DOSA10', 2, 300)   AS ok_is_null,
       fn_coupon_discount(4, 300)          AS dosa10_on_300,
       fn_partner_earning(3.5)             AS earning_for_3_5_km;

-- Q13. Full-text search (FULLTEXT indexes from 02_alter_schema.sql)
SELECT m.name, m.description, r.name AS restaurant,
       MATCH(m.name, m.description) AGAINST ('paneer* chicken*' IN BOOLEAN MODE) AS relevance
FROM Menu_Item m JOIN Restaurant r ON r.restaurant_id = m.restaurant_id
WHERE MATCH(m.name, m.description) AGAINST ('paneer* chicken*' IN BOOLEAN MODE)
ORDER BY relevance DESC;

-- Q14. Window function: rank delivery partners by earnings in each city
SELECT city, full_name, total_earnings,
       RANK() OVER (PARTITION BY city ORDER BY total_earnings DESC) AS rank_in_city
FROM v_partner_stats;

-- Q15. DELETE (inside a transaction, rolled back to keep the sample data)
START TRANSACTION;
-- expired coupons that were never used can be removed
DELETE FROM Coupon
WHERE status = 'EXPIRED' AND coupon_id NOT IN (SELECT coupon_id FROM (SELECT DISTINCT coupon_id FROM Orders WHERE coupon_id IS NOT NULL) used);
SELECT ROW_COUNT() AS coupons_deleted;
ROLLBACK;
-- Deleting a menu item that appears in old orders is refused by the
-- foreign key (ON DELETE RESTRICT), which protects order history:
--   DELETE FROM Menu_Item WHERE item_id = 1;   -- ERROR 1451
