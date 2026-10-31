-- =====================================================================
--  Smart Multi-Vendor Food Delivery & Logistics Management System
--  File 4 : Views, stored functions, stored procedures and triggers
--  Run after 03_insert_data.sql. The web app uses all of these.
-- =====================================================================
USE food_delivery;

-- =====================================================================
-- VIEWS
-- =====================================================================
DROP VIEW IF EXISTS v_order_summary;
DROP VIEW IF EXISTS v_restaurant_daily_sales;
DROP VIEW IF EXISTS v_menu_popularity;
DROP VIEW IF EXISTS v_partner_stats;
DROP VIEW IF EXISTS v_low_stock;

-- One row per order with everything a screen needs to show it
CREATE VIEW v_order_summary AS
SELECT o.order_id, o.order_time, o.order_status, o.total_amount,
       c.customer_id, c.full_name AS customer_name,
       r.restaurant_id, r.name AS restaurant_name, r.cuisine_type, pc.city,
       p.method AS payment_method, p.payment_status,
       d.delivery_id, d.delivery_status, dp.partner_id, dp.full_name AS partner_name,
       rv.review_id
FROM Orders o
JOIN Address a      ON a.address_id = o.address_id
JOIN Customer c     ON c.customer_id = a.customer_id
JOIN Restaurant r   ON r.restaurant_id = o.restaurant_id
JOIN Pincode pc     ON pc.pincode = r.pincode
LEFT JOIN Payment p ON p.order_id = o.order_id
LEFT JOIN Delivery d ON d.order_id = o.order_id
LEFT JOIN Delivery_Partner dp ON dp.partner_id = d.partner_id
LEFT JOIN Review rv ON rv.order_id = o.order_id;

-- Delivered sales per restaurant per day (dashboards sum a date range)
CREATE VIEW v_restaurant_daily_sales AS
SELECT r.restaurant_id, r.name AS restaurant_name, DATE(o.order_time) AS sale_date,
       COUNT(*)                                                    AS delivered_orders,
       SUM(o.subtotal)                                             AS food_sales,
       SUM(IF(cp.restaurant_id IS NOT NULL, o.discount_amount, 0)) AS restaurant_discounts,
       ROUND(SUM(o.subtotal) * r.commission_pct / 100, 2)          AS commission
FROM Orders o
JOIN Restaurant r   ON r.restaurant_id = o.restaurant_id
LEFT JOIN Coupon cp ON cp.coupon_id = o.coupon_id
WHERE o.order_status = 'DELIVERED'
GROUP BY r.restaurant_id, r.name, r.commission_pct, DATE(o.order_time);

-- Units sold per menu item (delivered orders only)
CREATE VIEW v_menu_popularity AS
SELECT m.item_id, m.restaurant_id, r.name AS restaurant_name, m.name AS item_name, m.category,
       COALESCE(SUM(oi.quantity), 0)                AS units_sold,
       COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS sales
FROM Menu_Item m
JOIN Restaurant r ON r.restaurant_id = m.restaurant_id
LEFT JOIN Order_Item oi ON oi.item_id = m.item_id
     AND oi.order_id IN (SELECT order_id FROM Orders WHERE order_status = 'DELIVERED')
GROUP BY m.item_id, m.restaurant_id, r.name, m.name, m.category;

-- Delivery partner performance (total_earnings is the derived attribute)
CREATE VIEW v_partner_stats AS
SELECT dp.partner_id, dp.full_name, dp.city, dp.vehicle_type, dp.availability, dp.account_status, dp.rating,
       COUNT(d.delivery_id)                       AS deliveries_done,
       COALESCE(SUM(d.partner_earning), 0)        AS total_earnings,
       ROUND(AVG(TIMESTAMPDIFF(MINUTE, d.assigned_at, d.delivered_at)), 1) AS avg_minutes
FROM Delivery_Partner dp
LEFT JOIN Delivery d ON d.partner_id = dp.partner_id AND d.delivery_status = 'DELIVERED'
GROUP BY dp.partner_id, dp.full_name, dp.city, dp.vehicle_type, dp.availability, dp.account_status, dp.rating;

-- Ingredients at or below their reorder level
CREATE VIEW v_low_stock AS
SELECT i.restaurant_id, r.name AS restaurant_name, i.ingredient_name, i.quantity, i.unit, i.reorder_level
FROM Inventory i JOIN Restaurant r ON r.restaurant_id = i.restaurant_id
WHERE i.quantity <= i.reorder_level;

-- =====================================================================
-- STORED FUNCTIONS
-- =====================================================================
DROP FUNCTION IF EXISTS fn_delivery_fee;
DROP FUNCTION IF EXISTS fn_coupon_check;
DROP FUNCTION IF EXISTS fn_coupon_discount;
DROP FUNCTION IF EXISTS fn_partner_earning;

DELIMITER //

-- Rs 30 delivery, free from Rs 500
CREATE FUNCTION fn_delivery_fee(p_subtotal DECIMAL(10,2)) RETURNS DECIMAL(8,2)
DETERMINISTIC
BEGIN
  RETURN IF(p_subtotal >= 500, 0, 30);
END//

-- Returns NULL if the coupon can be used, otherwise the reason it cannot
CREATE FUNCTION fn_coupon_check(p_code VARCHAR(20), p_restaurant_id INT, p_subtotal DECIMAL(10,2)) RETURNS VARCHAR(120)
READS SQL DATA
BEGIN
  DECLARE v_id INT;
  DECLARE v_status VARCHAR(10);
  DECLARE v_from, v_to DATE;
  DECLARE v_rest INT;
  DECLARE v_min DECIMAL(8,2);
  DECLARE v_limit INT;
  DECLARE v_used INT;
  SELECT coupon_id, status, valid_from, valid_to, restaurant_id, min_order_value, usage_limit
    INTO v_id, v_status, v_from, v_to, v_rest, v_min, v_limit
  FROM Coupon WHERE code = UPPER(TRIM(p_code));
  IF v_id IS NULL THEN RETURN 'Coupon code not found'; END IF;
  IF v_status <> 'ACTIVE' OR CURDATE() NOT BETWEEN v_from AND v_to THEN
    RETURN CONCAT(UPPER(p_code), ' has expired');
  END IF;
  IF v_rest IS NOT NULL AND v_rest <> p_restaurant_id THEN
    RETURN CONCAT(UPPER(p_code), ' is not valid at this restaurant');
  END IF;
  IF p_subtotal < v_min THEN
    RETURN CONCAT(UPPER(p_code), ' needs a minimum order of Rs ', v_min);
  END IF;
  SELECT COUNT(*) INTO v_used FROM Orders WHERE coupon_id = v_id AND order_status <> 'CANCELLED';
  IF v_used >= v_limit THEN RETURN CONCAT(UPPER(p_code), ' has reached its usage limit'); END IF;
  RETURN NULL;
END//

-- Discount in rupees for a coupon on a given subtotal
CREATE FUNCTION fn_coupon_discount(p_coupon_id INT, p_subtotal DECIMAL(10,2)) RETURNS DECIMAL(10,2)
READS SQL DATA
BEGIN
  DECLARE v_type VARCHAR(10);
  DECLARE v_value, v_max DECIMAL(8,2);
  DECLARE v_disc DECIMAL(12,4);
  IF p_coupon_id IS NULL THEN RETURN 0; END IF;
  SELECT discount_type, discount_value, max_discount INTO v_type, v_value, v_max
  FROM Coupon WHERE coupon_id = p_coupon_id;
  SET v_disc = IF(v_type = 'PERCENT', p_subtotal * v_value / 100, v_value);
  IF v_max IS NOT NULL THEN SET v_disc = LEAST(v_disc, v_max); END IF;
  RETURN ROUND(LEAST(v_disc, p_subtotal), 2);
END//

-- Partner pay: Rs 25 + Rs 8 per km
CREATE FUNCTION fn_partner_earning(p_km DECIMAL(5,2)) RETURNS DECIMAL(8,2)
DETERMINISTIC
BEGIN
  RETURN ROUND(25 + 8 * p_km, 2);
END//

DELIMITER ;

-- =====================================================================
-- STORED PROCEDURES
-- =====================================================================
DROP PROCEDURE IF EXISTS sp_place_order;
DROP PROCEDURE IF EXISTS sp_assign_partner;

DELIMITER //

-- Places an order in ONE transaction: Orders + Order_Item + Payment.
-- p_items is a JSON array like [{"item_id": 5, "qty": 2}, ...]
CREATE PROCEDURE sp_place_order(
  IN  p_customer_id    INT,
  IN  p_address_id     INT,
  IN  p_restaurant_id  INT,
  IN  p_items          JSON,
  IN  p_coupon_code    VARCHAR(20),
  IN  p_payment_method VARCHAR(20),
  IN  p_instructions   VARCHAR(255),
  OUT p_order_id       INT)
BEGIN
  DECLARE v_lines, v_found, v_bad INT DEFAULT 0;
  DECLARE v_subtotal DECIMAL(10,2) DEFAULT 0;
  DECLARE v_coupon_id INT DEFAULT NULL;
  DECLARE v_discount DECIMAL(10,2) DEFAULT 0;
  DECLARE v_msg VARCHAR(120);
  DECLARE v_total DECIMAL(10,2);
  DECLARE v_cod BOOLEAN DEFAULT (p_payment_method = 'COD');

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  IF NOT EXISTS (SELECT 1 FROM Customer WHERE customer_id = p_customer_id AND status = 'ACTIVE') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'This customer account is not active';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM Address WHERE address_id = p_address_id AND customer_id = p_customer_id) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'That address does not belong to this customer';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM Restaurant WHERE restaurant_id = p_restaurant_id AND status = 'OPEN'
                 AND CURTIME() BETWEEN opening_time AND closing_time) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'The restaurant is closed right now';
  END IF;

  SET v_lines = JSON_LENGTH(p_items);
  IF v_lines IS NULL OR v_lines = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'The cart is empty';
  END IF;

  -- price the cart from the database (never from the browser)
  SELECT COUNT(*), COALESCE(SUM(m.price * j.qty), 0),
         SUM(m.restaurant_id <> p_restaurant_id OR m.is_available = FALSE OR j.qty < 1)
    INTO v_found, v_subtotal, v_bad
  FROM JSON_TABLE(p_items, '$[*]' COLUMNS (item_id INT PATH '$.item_id', qty INT PATH '$.qty')) j
  JOIN Menu_Item m ON m.item_id = j.item_id;
  IF v_found <> v_lines OR v_bad > 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Some items are unavailable or not from this restaurant';
  END IF;

  IF p_coupon_code IS NOT NULL AND p_coupon_code <> '' THEN
    SET v_msg = fn_coupon_check(p_coupon_code, p_restaurant_id, v_subtotal);
    IF v_msg IS NOT NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
    END IF;
    SELECT coupon_id INTO v_coupon_id FROM Coupon WHERE code = UPPER(TRIM(p_coupon_code));
    SET v_discount = fn_coupon_discount(v_coupon_id, v_subtotal);
  END IF;

  START TRANSACTION;
    INSERT INTO Orders (address_id, restaurant_id, coupon_id, order_time, subtotal, discount_amount,
                        delivery_fee, tax_amount, special_instructions)
    VALUES (p_address_id, p_restaurant_id, v_coupon_id, NOW(), v_subtotal, v_discount,
            fn_delivery_fee(v_subtotal), ROUND((v_subtotal - v_discount) * 0.05, 2), NULLIF(p_instructions, ''));
    SET p_order_id = LAST_INSERT_ID();

    INSERT INTO Order_Item (order_id, item_id, quantity, unit_price)
    SELECT p_order_id, m.item_id, j.qty, m.price
    FROM JSON_TABLE(p_items, '$[*]' COLUMNS (item_id INT PATH '$.item_id', qty INT PATH '$.qty')) j
    JOIN Menu_Item m ON m.item_id = j.item_id;

    SELECT total_amount INTO v_total FROM Orders WHERE order_id = p_order_id;

    INSERT INTO Payment (order_id, method, amount, transaction_ref, payment_status, paid_at)
    VALUES (p_order_id, p_payment_method, v_total,
            IF(v_cod, NULL, CONCAT(LEFT(p_payment_method, 3), DATE_FORMAT(NOW(), '%y%m%d'), LPAD(p_order_id, 6, '0'))),
            IF(v_cod, 'PENDING', 'SUCCESS'), IF(v_cod, NULL, NOW()));
  COMMIT;
END//

-- Assigns a delivery partner in ONE transaction. Row locks (FOR UPDATE)
-- stop two admins from giving the same partner two orders at once.
-- The trip distance is computed in SQL with ST_Distance_Sphere.
CREATE PROCEDURE sp_assign_partner(IN p_order_id INT, IN p_partner_id INT)
BEGIN
  DECLARE v_status VARCHAR(20);
  DECLARE v_city, v_pcity VARCHAR(60);
  DECLARE v_avail, v_account VARCHAR(20);
  DECLARE v_km DECIMAL(5,2);

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
    SELECT o.order_status, pc.city,
           ROUND(GREATEST(0.3, ST_Distance_Sphere(POINT(r.longitude, r.latitude), POINT(a.longitude, a.latitude)) / 1000 * 1.3), 2)
      INTO v_status, v_city, v_km
    FROM Orders o
    JOIN Restaurant r ON r.restaurant_id = o.restaurant_id
    JOIN Pincode pc   ON pc.pincode = r.pincode
    JOIN Address a    ON a.address_id = o.address_id
    WHERE o.order_id = p_order_id
    FOR UPDATE;

    IF v_status IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Order not found';
    END IF;
    IF v_status IN ('DELIVERED', 'CANCELLED') THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'This order is already finished';
    END IF;
    IF EXISTS (SELECT 1 FROM Delivery WHERE order_id = p_order_id) THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'This order already has a delivery partner';
    END IF;

    SELECT availability, account_status, city INTO v_avail, v_account, v_pcity
    FROM Delivery_Partner WHERE partner_id = p_partner_id
    FOR UPDATE;

    IF v_avail IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Delivery partner not found';
    END IF;
    IF v_account <> 'ACTIVE' OR v_avail <> 'AVAILABLE' THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'This partner is not available any more';
    END IF;
    IF v_pcity <> v_city THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'This partner works in a different city';
    END IF;

    INSERT INTO Delivery (order_id, partner_id, assigned_at, distance_km, delivery_status, partner_earning)
    VALUES (p_order_id, p_partner_id, NOW(), v_km, 'ASSIGNED', fn_partner_earning(v_km));
    UPDATE Delivery_Partner SET availability = 'BUSY' WHERE partner_id = p_partner_id;
  COMMIT;
END//

DELIMITER ;

-- =====================================================================
-- TRIGGERS (data validation and automatic updates inside the database)
-- =====================================================================
DROP TRIGGER IF EXISTS trg_order_item_before_insert;
DROP TRIGGER IF EXISTS trg_orders_before_update;
DROP TRIGGER IF EXISTS trg_orders_after_update;
DROP TRIGGER IF EXISTS trg_delivery_after_update;
DROP TRIGGER IF EXISTS trg_review_before_insert;
DROP TRIGGER IF EXISTS trg_review_after_insert;

DELIMITER //

-- 1. An order line must be an available item of the order's restaurant
CREATE TRIGGER trg_order_item_before_insert
BEFORE INSERT ON Order_Item FOR EACH ROW
BEGIN
  IF NOT EXISTS (SELECT 1 FROM Menu_Item m JOIN Orders o ON o.restaurant_id = m.restaurant_id
                 WHERE m.item_id = NEW.item_id AND o.order_id = NEW.order_id AND m.is_available = TRUE) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Item is unavailable or belongs to another restaurant';
  END IF;
END//

-- 2. Order status can only move along the allowed path
--    PLACED -> ACCEPTED -> PREPARING -> READY -> PICKED_UP -> DELIVERED,
--    and PLACED / ACCEPTED -> CANCELLED
CREATE TRIGGER trg_orders_before_update
BEFORE UPDATE ON Orders FOR EACH ROW
BEGIN
  IF NEW.order_status <> OLD.order_status AND NOT (
       (OLD.order_status = 'PLACED'    AND NEW.order_status IN ('ACCEPTED', 'CANCELLED')) OR
       (OLD.order_status = 'ACCEPTED'  AND NEW.order_status IN ('PREPARING', 'CANCELLED')) OR
       (OLD.order_status = 'PREPARING' AND NEW.order_status = 'READY') OR
       (OLD.order_status = 'READY'     AND NEW.order_status = 'PICKED_UP') OR
       (OLD.order_status = 'PICKED_UP' AND NEW.order_status = 'DELIVERED')) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'This order status change is not allowed';
  END IF;
END//

-- 3. Cancelling an order refunds the payment and frees the partner
CREATE TRIGGER trg_orders_after_update
AFTER UPDATE ON Orders FOR EACH ROW
BEGIN
  IF NEW.order_status = 'CANCELLED' AND OLD.order_status <> 'CANCELLED' THEN
    UPDATE Payment SET payment_status = IF(payment_status = 'SUCCESS', 'REFUNDED', 'FAILED')
    WHERE order_id = NEW.order_id;
    UPDATE Delivery_Partner SET availability = 'AVAILABLE'
    WHERE partner_id = (SELECT partner_id FROM Delivery WHERE order_id = NEW.order_id);
    UPDATE Delivery SET delivery_status = 'FAILED' WHERE order_id = NEW.order_id;
  END IF;
END//

-- 4. Delivery progress drives the order: picked up / delivered.
--    On delivery a COD payment becomes paid and the partner is free again.
CREATE TRIGGER trg_delivery_after_update
AFTER UPDATE ON Delivery FOR EACH ROW
BEGIN
  IF NEW.delivery_status = 'PICKED_UP' AND OLD.delivery_status = 'ASSIGNED' THEN
    UPDATE Orders SET order_status = 'PICKED_UP' WHERE order_id = NEW.order_id;
  END IF;
  IF NEW.delivery_status = 'DELIVERED' AND OLD.delivery_status = 'PICKED_UP' THEN
    UPDATE Orders SET order_status = 'DELIVERED' WHERE order_id = NEW.order_id;
    UPDATE Payment SET payment_status = 'SUCCESS', paid_at = NOW()
    WHERE order_id = NEW.order_id AND payment_status = 'PENDING';
    UPDATE Delivery_Partner SET availability = 'AVAILABLE' WHERE partner_id = NEW.partner_id;
  END IF;
END//

-- 5. Only delivered orders can be reviewed
CREATE TRIGGER trg_review_before_insert
BEFORE INSERT ON Review FOR EACH ROW
BEGIN
  IF (SELECT order_status FROM Orders WHERE order_id = NEW.order_id) <> 'DELIVERED' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only delivered orders can be reviewed';
  END IF;
END//

-- 6. A new review refreshes the restaurant's cached rating
CREATE TRIGGER trg_review_after_insert
AFTER INSERT ON Review FOR EACH ROW
BEGIN
  DECLARE v_rest INT;
  SELECT restaurant_id INTO v_rest FROM Orders WHERE order_id = NEW.order_id;
  UPDATE Restaurant
  SET rating = (SELECT ROUND(AVG(rv.food_rating), 1)
                FROM Review rv JOIN Orders o ON o.order_id = rv.order_id
                WHERE o.restaurant_id = v_rest)
  WHERE restaurant_id = v_rest;
END//

DELIMITER ;

SHOW FULL TABLES WHERE Table_type = 'VIEW';
SHOW FUNCTION STATUS WHERE Db = 'food_delivery';
SHOW PROCEDURE STATUS WHERE Db = 'food_delivery';
SHOW TRIGGERS;
