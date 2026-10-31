-- =====================================================================
--  Smart Multi-Vendor Food Delivery & Logistics Management System
--  File 2 : ALTER TABLE - schema changes made for the web application
--  Run after 01_create_schema.sql and before 03_insert_data.sql
-- =====================================================================
USE food_delivery;

-- 1. Passwords move from SHA-256 (64 hex chars) to bcrypt (60 chars,
--    salted). Widen the columns so other hash formats also fit.
ALTER TABLE Admin            MODIFY password_hash VARCHAR(100) NOT NULL;
ALTER TABLE Customer         MODIFY password_hash VARCHAR(100) NOT NULL;
ALTER TABLE Restaurant_Owner MODIFY password_hash VARCHAR(100) NOT NULL;

-- 2. Delivery partners now log in to the app, so they need a password
ALTER TABLE Delivery_Partner ADD COLUMN password_hash VARCHAR(100) NULL AFTER email;

-- 3. Remember when each user last logged in
ALTER TABLE Admin            ADD COLUMN last_login DATETIME NULL;
ALTER TABLE Customer         ADD COLUMN last_login DATETIME NULL;
ALTER TABLE Restaurant_Owner ADD COLUMN last_login DATETIME NULL;
ALTER TABLE Delivery_Partner ADD COLUMN last_login DATETIME NULL;

-- 4. FULL-TEXT indexes for the search box (restaurant name / cuisine and
--    dish name / description)
ALTER TABLE Restaurant ADD FULLTEXT INDEX ft_restaurant (name, cuisine_type);
ALTER TABLE Menu_Item  ADD FULLTEXT INDEX ft_menu_item (name, description);

-- 5. Extra integrity rules
ALTER TABLE Address  ADD CONSTRAINT chk_addr_lat_lng
      CHECK (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180);
ALTER TABLE Review   ADD CONSTRAINT chk_review_comment_len
      CHECK (comment IS NULL OR CHAR_LENGTH(comment) <= 500);
ALTER TABLE Customer ADD CONSTRAINT chk_customer_email
      CHECK (email LIKE '%_@_%._%');

-- 6. DROP: replace an index with a better one for the order-history query
CREATE INDEX idx_orders_address ON Orders(address_id, order_time);
DROP INDEX idx_restaurant_cuisine ON Restaurant;
CREATE INDEX idx_restaurant_status_cuisine ON Restaurant(status, cuisine_type);

SHOW CREATE TABLE Delivery_Partner;
