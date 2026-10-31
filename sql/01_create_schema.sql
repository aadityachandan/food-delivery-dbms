-- =====================================================================
--  Smart Multi-Vendor Food Delivery & Logistics Management System
--  File 1 : Database and table creation (DDL)              -- MySQL 8.0+
--  All 15 tables are in BCNF (see docs/03_functional_dependencies.md)
-- =====================================================================

DROP DATABASE IF EXISTS food_delivery;
CREATE DATABASE food_delivery CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE food_delivery;

-- ---------------------------------------------------------------------
-- 1. ADMIN : platform administrators
-- ---------------------------------------------------------------------
CREATE TABLE Admin (
    admin_id       INT           PRIMARY KEY AUTO_INCREMENT,
    full_name      VARCHAR(100)  NOT NULL,
    email          VARCHAR(100)  NOT NULL UNIQUE,
    password_hash  CHAR(64)      NOT NULL,
    role           ENUM('SUPER_ADMIN','OPERATIONS','SUPPORT','FINANCE') NOT NULL,
    created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 2. PINCODE : postal area -> city, state.
--    Split out because pincode -> city would otherwise be a transitive
--    dependency inside Address and Restaurant.
--    (city alone does not determine state: e.g. Aurangabad exists in
--     both Bihar and Maharashtra, so city -> state is NOT an FD.)
-- ---------------------------------------------------------------------
CREATE TABLE Pincode (
    pincode  CHAR(6)      PRIMARY KEY,
    city     VARCHAR(60)  NOT NULL,
    state    VARCHAR(60)  NOT NULL,
    CONSTRAINT chk_pincode_format CHECK (pincode REGEXP '^[1-9][0-9]{5}$')
);

-- ---------------------------------------------------------------------
-- 3. CUSTOMER
-- ---------------------------------------------------------------------
CREATE TABLE Customer (
    customer_id    INT           PRIMARY KEY AUTO_INCREMENT,
    full_name      VARCHAR(100)  NOT NULL,
    email          VARCHAR(100)  NOT NULL UNIQUE,
    phone          VARCHAR(15)   NOT NULL UNIQUE,
    password_hash  CHAR(64)      NOT NULL,
    created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status         ENUM('ACTIVE','BLOCKED') NOT NULL DEFAULT 'ACTIVE'
);

-- ---------------------------------------------------------------------
-- 4. ADDRESS : a customer's saved delivery addresses
-- ---------------------------------------------------------------------
CREATE TABLE Address (
    address_id    INT           PRIMARY KEY AUTO_INCREMENT,
    customer_id   INT           NOT NULL,
    label         ENUM('HOME','WORK','OTHER') NOT NULL DEFAULT 'HOME',
    address_line  VARCHAR(200)  NOT NULL,
    pincode       CHAR(6)       NOT NULL,
    latitude      DECIMAL(9,6)  NOT NULL,
    longitude     DECIMAL(9,6)  NOT NULL,
    is_default    BOOLEAN       NOT NULL DEFAULT FALSE,
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (pincode)     REFERENCES Pincode(pincode)
);

-- ---------------------------------------------------------------------
-- 5. RESTAURANT_OWNER
-- ---------------------------------------------------------------------
CREATE TABLE Restaurant_Owner (
    owner_id       INT           PRIMARY KEY AUTO_INCREMENT,
    full_name      VARCHAR(100)  NOT NULL,
    email          VARCHAR(100)  NOT NULL UNIQUE,
    phone          VARCHAR(15)   NOT NULL UNIQUE,
    password_hash  CHAR(64)      NOT NULL,
    status         ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE'
);

-- ---------------------------------------------------------------------
-- 6. RESTAURANT : one owner can run several outlets.
--    rating is a cached average of reviews (refreshed by a trigger in
--    phase 2); commission_pct is what the platform keeps per order.
-- ---------------------------------------------------------------------
CREATE TABLE Restaurant (
    restaurant_id   INT           PRIMARY KEY AUTO_INCREMENT,
    owner_id        INT           NOT NULL,
    name            VARCHAR(100)  NOT NULL,
    cuisine_type    VARCHAR(50)   NOT NULL,
    address_line    VARCHAR(200)  NOT NULL,
    pincode         CHAR(6)       NOT NULL,
    latitude        DECIMAL(9,6)  NOT NULL,
    longitude       DECIMAL(9,6)  NOT NULL,
    opening_time    TIME          NOT NULL,
    closing_time    TIME          NOT NULL,
    commission_pct  DECIMAL(4,2)  NOT NULL DEFAULT 15.00,
    rating          DECIMAL(2,1),
    status          ENUM('PENDING_APPROVAL','OPEN','CLOSED','SUSPENDED') NOT NULL DEFAULT 'PENDING_APPROVAL',
    approved_by     INT,
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id)    REFERENCES Restaurant_Owner(owner_id),
    FOREIGN KEY (pincode)     REFERENCES Pincode(pincode),
    FOREIGN KEY (approved_by) REFERENCES Admin(admin_id),
    CONSTRAINT chk_rest_commission CHECK (commission_pct BETWEEN 0 AND 40),
    CONSTRAINT chk_rest_rating     CHECK (rating IS NULL OR rating BETWEEN 1.0 AND 5.0),
    CONSTRAINT chk_rest_hours      CHECK (closing_time > opening_time)
);

-- ---------------------------------------------------------------------
-- 7. MENU_ITEM
-- ---------------------------------------------------------------------
CREATE TABLE Menu_Item (
    item_id        INT            PRIMARY KEY AUTO_INCREMENT,
    restaurant_id  INT            NOT NULL,
    name           VARCHAR(100)   NOT NULL,
    description    VARCHAR(255),
    category       VARCHAR(50)    NOT NULL,
    price          DECIMAL(8,2)   NOT NULL CHECK (price > 0),
    is_veg         BOOLEAN        NOT NULL,
    is_available   BOOLEAN        NOT NULL DEFAULT TRUE,
    image_url      VARCHAR(255),
    UNIQUE KEY uq_item_per_restaurant (restaurant_id, name),
    FOREIGN KEY (restaurant_id) REFERENCES Restaurant(restaurant_id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 8. INVENTORY : WEAK ENTITY - raw-material stock of a restaurant,
--    identified by (restaurant_id, ingredient_name)
-- ---------------------------------------------------------------------
CREATE TABLE Inventory (
    restaurant_id    INT           NOT NULL,
    ingredient_name  VARCHAR(60)   NOT NULL,
    unit             ENUM('kg','litre','pcs') NOT NULL,
    quantity         DECIMAL(10,2) NOT NULL CHECK (quantity >= 0),
    reorder_level    DECIMAL(10,2) NOT NULL CHECK (reorder_level >= 0),
    last_updated     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (restaurant_id, ingredient_name),
    FOREIGN KEY (restaurant_id) REFERENCES Restaurant(restaurant_id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 9. COUPON : restaurant_id NULL = platform-wide coupon
-- ---------------------------------------------------------------------
CREATE TABLE Coupon (
    coupon_id        INT           PRIMARY KEY AUTO_INCREMENT,
    code             VARCHAR(20)   NOT NULL UNIQUE,
    description      VARCHAR(150)  NOT NULL,
    discount_type    ENUM('PERCENT','FLAT') NOT NULL,
    discount_value   DECIMAL(8,2)  NOT NULL CHECK (discount_value > 0),
    max_discount     DECIMAL(8,2),
    min_order_value  DECIMAL(8,2)  NOT NULL DEFAULT 0,
    valid_from       DATE          NOT NULL,
    valid_to         DATE          NOT NULL,
    usage_limit      INT           NOT NULL DEFAULT 1000,
    restaurant_id    INT,
    status           ENUM('ACTIVE','EXPIRED','DISABLED') NOT NULL DEFAULT 'ACTIVE',
    FOREIGN KEY (restaurant_id) REFERENCES Restaurant(restaurant_id),
    CONSTRAINT chk_coupon_dates   CHECK (valid_to >= valid_from),
    CONSTRAINT chk_coupon_percent CHECK (discount_type = 'FLAT' OR discount_value <= 100)
);

-- ---------------------------------------------------------------------
-- 10. ORDERS  ("ORDER" is a reserved word in SQL, so the table is ORDERS)
--     * The customer is reached through the delivery address
--       (address_id -> customer_id), so customer_id is not repeated here.
--     * subtotal, discount, delivery fee and tax are a snapshot of the
--       bill when the order was placed.
--     * total_amount is a GENERATED column: MySQL computes it, so the
--       dependency {subtotal, discount, fee, tax} -> total can never be
--       broken by an update.
-- ---------------------------------------------------------------------
CREATE TABLE Orders (
    order_id              INT           PRIMARY KEY AUTO_INCREMENT,
    address_id            INT           NOT NULL,
    restaurant_id         INT           NOT NULL,
    coupon_id             INT,
    order_time            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    subtotal              DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
    discount_amount       DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    delivery_fee          DECIMAL(8,2)  NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
    tax_amount            DECIMAL(8,2)  NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    total_amount          DECIMAL(10,2) GENERATED ALWAYS AS
                              (subtotal - discount_amount + delivery_fee + tax_amount) STORED,
    order_status          ENUM('PLACED','ACCEPTED','PREPARING','READY','PICKED_UP',
                               'DELIVERED','CANCELLED') NOT NULL DEFAULT 'PLACED',
    special_instructions  VARCHAR(255),
    FOREIGN KEY (address_id)    REFERENCES Address(address_id),
    FOREIGN KEY (restaurant_id) REFERENCES Restaurant(restaurant_id),
    FOREIGN KEY (coupon_id)     REFERENCES Coupon(coupon_id),
    CONSTRAINT chk_order_discount CHECK (discount_amount <= subtotal)
);

-- ---------------------------------------------------------------------
-- 11. ORDER_ITEM : M:N between Orders and Menu_Item.
--     unit_price is the price at order time (prices change later), so it
--     depends on the whole key (order_id, item_id), not on item_id alone.
-- ---------------------------------------------------------------------
CREATE TABLE Order_Item (
    order_id    INT           NOT NULL,
    item_id     INT           NOT NULL,
    quantity    SMALLINT      NOT NULL CHECK (quantity > 0),
    unit_price  DECIMAL(8,2)  NOT NULL CHECK (unit_price > 0),
    PRIMARY KEY (order_id, item_id),
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id)  REFERENCES Menu_Item(item_id)
);

-- ---------------------------------------------------------------------
-- 12. PAYMENT : exactly one payment record per order (1:1)
-- ---------------------------------------------------------------------
CREATE TABLE Payment (
    payment_id       INT           PRIMARY KEY AUTO_INCREMENT,
    order_id         INT           NOT NULL UNIQUE,
    method           ENUM('UPI','CARD','NET_BANKING','WALLET','COD') NOT NULL,
    amount           DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    transaction_ref  VARCHAR(30)   UNIQUE,
    payment_status   ENUM('PENDING','SUCCESS','FAILED','REFUNDED') NOT NULL DEFAULT 'PENDING',
    paid_at          DATETIME,
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 13. DELIVERY_PARTNER : live GPS location is kept in MongoDB
-- ---------------------------------------------------------------------
CREATE TABLE Delivery_Partner (
    partner_id      INT           PRIMARY KEY AUTO_INCREMENT,
    full_name       VARCHAR(100)  NOT NULL,
    phone           VARCHAR(15)   NOT NULL UNIQUE,
    email           VARCHAR(100)  NOT NULL UNIQUE,
    vehicle_type    ENUM('BICYCLE','BIKE','SCOOTER') NOT NULL,
    vehicle_number  VARCHAR(15)   UNIQUE,
    license_no      VARCHAR(20)   UNIQUE,
    city            VARCHAR(60)   NOT NULL,
    availability    ENUM('AVAILABLE','BUSY','OFFLINE') NOT NULL DEFAULT 'OFFLINE',
    rating          DECIMAL(2,1),
    joined_at       DATE          NOT NULL,
    account_status  ENUM('PENDING','ACTIVE','SUSPENDED') NOT NULL DEFAULT 'PENDING',
    verified_by     INT,
    FOREIGN KEY (verified_by) REFERENCES Admin(admin_id),
    CONSTRAINT chk_partner_vehicle CHECK (vehicle_type = 'BICYCLE'
                                         OR (vehicle_number IS NOT NULL AND license_no IS NOT NULL))
);

-- ---------------------------------------------------------------------
-- 14. DELIVERY : one delivery per order (1:1), done by one partner
-- ---------------------------------------------------------------------
CREATE TABLE Delivery (
    delivery_id      INT           PRIMARY KEY AUTO_INCREMENT,
    order_id         INT           NOT NULL UNIQUE,
    partner_id       INT           NOT NULL,
    assigned_at      DATETIME      NOT NULL,
    picked_up_at     DATETIME,
    delivered_at     DATETIME,
    distance_km      DECIMAL(5,2)  NOT NULL CHECK (distance_km > 0),
    delivery_status  ENUM('ASSIGNED','PICKED_UP','DELIVERED','FAILED') NOT NULL DEFAULT 'ASSIGNED',
    partner_earning  DECIMAL(8,2)  NOT NULL CHECK (partner_earning >= 0),
    FOREIGN KEY (order_id)   REFERENCES Orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (partner_id) REFERENCES Delivery_Partner(partner_id),
    CONSTRAINT chk_delivery_times CHECK (
        (picked_up_at IS NULL OR picked_up_at >= assigned_at) AND
        (delivered_at IS NULL OR delivered_at >= picked_up_at))
);

-- ---------------------------------------------------------------------
-- 15. REVIEW : one review per delivered order. Customer and restaurant
--     are reached through the order (storing them again would be a
--     transitive dependency).
-- ---------------------------------------------------------------------
CREATE TABLE Review (
    review_id        INT           PRIMARY KEY AUTO_INCREMENT,
    order_id         INT           NOT NULL UNIQUE,
    food_rating      TINYINT       NOT NULL CHECK (food_rating BETWEEN 1 AND 5),
    delivery_rating  TINYINT       CHECK (delivery_rating BETWEEN 1 AND 5),
    comment          VARCHAR(500),
    created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE
);

-- Indexes that back the key queries
CREATE INDEX idx_pincode_city           ON Pincode(city);
CREATE INDEX idx_restaurant_cuisine     ON Restaurant(cuisine_type);
CREATE INDEX idx_menu_category_price    ON Menu_Item(category, price);
CREATE INDEX idx_orders_restaurant_time ON Orders(restaurant_id, order_time);
CREATE INDEX idx_partner_city_avail     ON Delivery_Partner(city, availability);

SHOW TABLES;
