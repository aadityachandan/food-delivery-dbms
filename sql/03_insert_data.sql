-- =====================================================================
--  Smart Multi-Vendor Food Delivery & Logistics Management System
--  File 3 : Sample data (minimum 10 rows per table) - run after 02_alter_schema.sql
--  Snapshot of the platform on 25-Oct-2026 around 1:40 PM.
--  Every user's demo password is  Demo@123  (stored only as a salted bcrypt hash).
-- =====================================================================
USE food_delivery;

-- ---------------------------------------------------------------------
-- ADMIN (10)
-- ---------------------------------------------------------------------
INSERT INTO Admin (admin_id, full_name, email, password_hash, role, created_at) VALUES
(1,  'Suresh Kumar',   'suresh.kumar@foodhub.in',   '$2b$10$GA3MbjsKZeYonDaOVpgoW..QoWX4jphUVJt0Wx4OkDP2i89.2d3bm',  'SUPER_ADMIN', '2025-01-10 09:00:00'),
(2,  'Lakshmi Iyer',   'lakshmi.iyer@foodhub.in',   '$2b$10$gu5CYCpP7vIl5A2tHjV60.s.8VR6Bf1MJW49VH8SfkSTqxU2n4ZVe',  'OPERATIONS',  '2025-02-01 09:00:00'),
(3,  'Arjun Rao',      'arjun.rao@foodhub.in',      '$2b$10$w.iqkRhWCs4hTBH1fgggPuYZ2yk/tc1R8N8sQlpUjQtusEynzfxXW',  'SUPPORT',     '2025-03-15 09:00:00'),
(4,  'Pooja Bhat',     'pooja.bhat@foodhub.in',     '$2b$10$YS.aopF9JqGo4csJt8MI3.T2vVI0D0BminV/1NPXg3OKFLjNwb2gW',  'FINANCE',     '2025-04-01 09:00:00'),
(5,  'Ramesh Babu',    'ramesh.babu@foodhub.in',    '$2b$10$skIqXWXWsLhHlwAQfV9NW.Sl3fj4KNXeKVWkLAdn0EXiNl5KvSH8G',  'SUPPORT',     '2025-05-20 09:00:00'),
(6,  'Farhan Ali',     'farhan.ali@foodhub.in',     '$2b$10$v5Hp9P27F8TAcK8l6CeNjunZWnlXOxQFpNtwY4oo8IQzJpbPUOLzi',  'OPERATIONS',  '2025-06-11 09:00:00'),
(7,  'Neha Joshi',     'neha.joshi@foodhub.in',     '$2b$10$4ElAz6pkDYwMzvnXaYn0a.GJXzbZGkWqh9s8AKGkgw2EYkGBvujMG',  'SUPPORT',     '2025-08-05 09:00:00'),
(8,  'Sachin Pawar',   'sachin.pawar@foodhub.in',   '$2b$10$2S3tu0QsscRKnK7mlgBNXu.1sOiVWB0UmSZzWs8W51mACle.wjNIe',  'FINANCE',     '2025-09-09 09:00:00'),
(9,  'Amit Malhotra',  'amit.malhotra@foodhub.in',  '$2b$10$m2TlMPb29.UbN7dliWIb1O5hsbttvMjlnifwXB7EA5PdOJP3IFfVq',  'OPERATIONS',  '2025-11-30 09:00:00'),
(10, 'Soumya Ghosh',   'soumya.ghosh@foodhub.in',   '$2b$10$P6WhtlIG5UJlMl/vJFOL9e2BXZzlHmHjOXkE9d2kBeO3TErmgqNxy', 'SUPPORT',     '2026-01-04 09:00:00');

-- ---------------------------------------------------------------------
-- PINCODE (14)
-- ---------------------------------------------------------------------
INSERT INTO Pincode (pincode, city, state) VALUES
('560003', 'Bengaluru', 'Karnataka'),
('560004', 'Bengaluru', 'Karnataka'),
('560011', 'Bengaluru', 'Karnataka'),
('560034', 'Bengaluru', 'Karnataka'),
('560037', 'Bengaluru', 'Karnataka'),
('560038', 'Bengaluru', 'Karnataka'),
('560066', 'Bengaluru', 'Karnataka'),
('560071', 'Bengaluru', 'Karnataka'),
('560076', 'Bengaluru', 'Karnataka'),
('560095', 'Bengaluru', 'Karnataka'),
('560102', 'Bengaluru', 'Karnataka'),
('560103', 'Bengaluru', 'Karnataka'),
('570009', 'Mysuru',    'Karnataka'),
('570017', 'Mysuru',    'Karnataka');

-- ---------------------------------------------------------------------
-- CUSTOMER (12) - customer 12 has not ordered yet
-- ---------------------------------------------------------------------
INSERT INTO Customer (customer_id, full_name, email, phone, password_hash, created_at, status) VALUES
(1,  'Aarav Sharma',     'aarav.sharma@gmail.com',   '9845012345', '$2b$10$pm65apfoLQQ6iXMeUHEFa.CrpgWSFQkegkqCXBi/u8aRkBRxRTyea',  '2026-01-12 10:20:00', 'ACTIVE'),
(2,  'Priya Nair',       'priya.nair@gmail.com',     '9845023456', '$2b$10$nHYyorirVPWpm6VjCu8rSuuQlxzaaCI6OlrRavDCHhUUeLHmMeIpO',  '2026-02-03 14:05:00', 'ACTIVE'),
(3,  'Karthik Raman',    'karthik.raman@gmail.com',  '9840034567', '$2b$10$eO1KmM/h.leDOj8SW2j6xOOycpcIhM2/cbfY23wlX7nvy4Wh9Eqzu',  '2026-02-18 09:45:00', 'ACTIVE'),
(4,  'Sneha Reddy',      'sneha.reddy@yahoo.com',    '9849045678', '$2b$10$rJGMutPxNSHnIoAL5mXERuhxdIZxHb0CWI8S9srE5axP1QNTTvIlu',  '2026-03-07 11:30:00', 'ACTIVE'),
(5,  'Rohan Mehta',      'rohan.mehta@yahoo.com',    '9820056789', '$2b$10$Nn.CJ/2CXZ9yGi2wqubu.exDTRBrRSQb1txhBmmls2Aus/GA08Amu',  '2026-03-22 16:10:00', 'ACTIVE'),
(6,  'Ananya Kulkarni',  'ananya.k@outlook.com',     '9822067890', '$2b$10$TQAQn7Giw8YwMEA6Mh1VauDrAKq6bfmrrT0A3JRzQctwEtPVOv30O',  '2026-04-09 12:00:00', 'ACTIVE'),
(7,  'Vikram Singh',     'vikram.singh@outlook.com', '9811078901', '$2b$10$dKC8p12aw5UrYbr4NzEpre/vCqE1r3tg03OkHZLTkf8choonkrah6',  '2026-04-28 18:25:00', 'ACTIVE'),
(8,  'Ishita Banerjee',  'ishita.b@gmail.com',       '9830089012', '$2b$10$imJ.WKPNh.EaA4tLDPMwVuwncTkRPqTWrpIH2SUzv3P1wlpTN9jSW',  '2026-05-15 08:50:00', 'ACTIVE'),
(9,  'Harsh Patel',      'harsh.patel@gmail.com',    '9825090123', '$2b$10$77NBIitE3dquNC1mw.bwreb7ZKUIKD5RDeDRgO3Kf/SvGtvRfbBUm',  '2026-06-01 10:00:00', 'ACTIVE'),
(10, 'Meghana Gowda',    'meghana.gowda@gmail.com',  '9886001234', '$2b$10$ZDyJcLYVVPOTQAz/wXTdRep6kBqwdD3uFE9qD30rNtd37eL17a7c2', '2026-07-19 13:40:00', 'ACTIVE'),
(11, 'Rahul Verma',      'rahul.verma@gmail.com',    '9880012345', '$2b$10$6V7trPsZbc701XawlXgxI.3BSo..R3XgdXuqJD2t9qcscuNZuEygq', '2026-08-05 09:15:00', 'ACTIVE'),
(12, 'Divya Shetty',     'divya.shetty@gmail.com',   '9845123456', '$2b$10$04ycTxl8BGuVd/e6gNo7jOPF4mtpLUr8nSZGLDSijpbyVhpBtfWlm', '2026-09-10 17:30:00', 'BLOCKED');

-- ---------------------------------------------------------------------
-- ADDRESS (15) - customers 1, 2 and 5 have home + work addresses
-- ---------------------------------------------------------------------
INSERT INTO Address (address_id, customer_id, label, address_line, pincode, latitude, longitude, is_default) VALUES
(1,  1,  'HOME', '24, 5th Cross, Jayanagar 4th Block',     '560011', 12.925000, 77.593800, TRUE),
(2,  1,  'WORK', 'Embassy Golf Links, Domlur',             '560071', 12.953900, 77.641300, FALSE),
(3,  2,  'HOME', '18, 1st Main, Koramangala 5th Block',    '560095', 12.934500, 77.619000, TRUE),
(4,  2,  'WORK', 'Prestige Tech Park, Marathahalli',       '560103', 12.935200, 77.695000, FALSE),
(5,  3,  'HOME', '7, 9th Main, Indiranagar',               '560038', 12.978400, 77.640800, TRUE),
(6,  4,  'HOME', '45, 27th Main, HSR Layout Sector 1',     '560102', 12.912100, 77.644600, TRUE),
(7,  5,  'HOME', 'Flat 302, Brigade Lakefront, Whitefield','560066', 12.975000, 77.727000, TRUE),
(8,  5,  'WORK', 'ITPL Main Road, Whitefield',             '560066', 12.986600, 77.737000, FALSE),
(9,  6,  'HOME', '12, 16th Main, BTM 2nd Stage',           '560076', 12.915000, 77.610000, TRUE),
(10, 7,  'HOME', '56, Sampige Road, Malleshwaram',         '560003', 13.006000, 77.570000, TRUE),
(11, 8,  'HOME', '3, Gandhi Bazaar Main Road, Basavanagudi','560004', 12.943000, 77.573000, TRUE),
(12, 9,  'HOME', '88, Outer Ring Road, Marathahalli',      '560037', 12.956000, 77.700000, TRUE),
(13, 10, 'HOME', '33, Vijayanagar 2nd Stage',              '570017', 12.320000, 76.622000, TRUE),
(14, 11, 'HOME', '21, 4th Block, Jayanagar',               '560011', 12.927000, 77.583000, TRUE),
(15, 12, 'HOME', '9, 2nd Cross, Malleshwaram',             '560003', 13.004000, 77.568000, TRUE);

-- ---------------------------------------------------------------------
-- RESTAURANT_OWNER (10) - owners 1 and 3 run two outlets each
-- ---------------------------------------------------------------------
INSERT INTO Restaurant_Owner (owner_id, full_name, email, phone, password_hash, status) VALUES
(1,  'Imran Qureshi',     'imran@spiceroute.in',     '9900200001', '$2b$10$56cEBNQPySV.qbMUE8zOzuvI6JcWklBxzPi.rtdRWMnP6eV5Wn.sm',  'ACTIVE'),
(2,  'Gopal Upadhya',     'gopal@udupiupahar.in',    '9900200002', '$2b$10$4dOdfmF6EANpIRUixHYHb.mhyKwAf7iksXF8gliqV9ilGsI3SnsQ2',  'ACTIVE'),
(3,  'Kevin Lobo',        'kevin@dragonwok.in',      '9900200003', '$2b$10$J6v94P1A9UkK/11ZeylJzODIZVqn2PHivFEj.3FGVJphawTt7ZFLO',  'ACTIVE'),
(4,  'Marco D''Souza',    'marco@pizzapiazza.in',    '9900200004', '$2b$10$ndIDN/1J0dBgBDbQwfiL8eQ5T1LHu4RAUqQu6W/YDeM8j5cPwwTFG',  'ACTIVE'),
(5,  'Harpreet Kaur',     'harpreet@punjabdhaba.in', '9900200005', '$2b$10$8PpgwM3nst03yDz/c.3KBuwkC8tVjq7douXzXj3UJCF61wvWYlRdO',  'ACTIVE'),
(6,  'Nisha Agarwal',     'nisha@greenbowl.in',      '9900200006', '$2b$10$LlrPgBw2HmDbrxKOP5GD8.NuclOPuNZXVmhpg3iZXDL6Gqma4uF1.',  'ACTIVE'),
(7,  'Rakesh Jain',       'rakesh@burgerbarn.in',    '9900200007', '$2b$10$kinEXswyxA.UibK0Cc0slechXqnBsCZfIBmqXvhQRie3RH3tqTXP2',  'ACTIVE'),
(8,  'Ashwin Kamath',     'ashwin@coastalcatch.in',  '9900200008', '$2b$10$e4D7BnS1EE6y2mn8QpbKGu2OYGu0tWAIKROUIc9FzuhbEG/GLGj..',  'ACTIVE'),
(9,  'Shalini Menon',     'shalini@sweettooth.in',   '9900200009', '$2b$10$Co9TwdPrCzYDYJxhCWdl7OsZxMqldINo0eI5gpUaHwf5dCIPudoL6',  'ACTIVE'),
(10, 'Nagaraj Hegde',     'nagaraj@mysurumess.in',   '9900200010', '$2b$10$1goeCMvFzUvhFDSdQLk1ZezIEu4Iq2pjfZ0DDx5WyYScrvKYnG4s2', 'ACTIVE');

-- ---------------------------------------------------------------------
-- RESTAURANT (12)
-- ---------------------------------------------------------------------
INSERT INTO Restaurant (restaurant_id, owner_id, name, cuisine_type, address_line, pincode, latitude, longitude,
                        opening_time, closing_time, commission_pct, rating, status, approved_by, created_at) VALUES
(1,  1,  'Spice Route Biryani',  'Biryani',      '80 Feet Road, Koramangala 4th Block', '560034', 12.935200, 77.624500, '11:00', '23:00', 18.00, 4.4, 'OPEN',   2, '2025-03-01 10:00:00'),
(2,  2,  'Udupi Upahar',         'South Indian', '11th Main, Jayanagar 4th Block',      '560011', 12.926000, 77.585000, '07:00', '22:00', 15.00, 4.6, 'OPEN',   2, '2025-03-10 10:00:00'),
(3,  3,  'Dragon Wok',           'Chinese',      '100 Feet Road, Indiranagar',          '560038', 12.971900, 77.641200, '12:00', '23:30', 20.00, 4.1, 'OPEN',   6, '2025-04-02 10:00:00'),
(4,  4,  'Pizza Piazza',         'Italian',      '27th Main, HSR Layout Sector 2',      '560102', 12.911600, 77.647400, '11:00', '23:59', 20.00, 4.3, 'OPEN',   6, '2025-05-12 10:00:00'),
(5,  5,  'Punjab Da Dhaba',      'North Indian', 'Outer Ring Road, Marathahalli',       '560037', 12.956900, 77.701100, '12:00', '23:00', 18.00, 4.2, 'OPEN',   2, '2025-06-20 10:00:00'),
(6,  6,  'Green Bowl Salads',    'Healthy',      'ITPL Main Road, Whitefield',          '560066', 12.969800, 77.750000, '09:00', '21:00', 15.00, 4.5, 'OPEN',   9, '2025-07-07 10:00:00'),
(7,  7,  'Burger Barn',          'Fast Food',    '16th Main, BTM Layout 2nd Stage',     '560076', 12.916600, 77.610100, '11:00', '23:00', 20.00, 3.9, 'OPEN',   9, '2025-08-15 10:00:00'),
(8,  8,  'Coastal Catch',        'Seafood',      'Sampige Road, Malleshwaram',          '560003', 13.003500, 77.570900, '12:00', '22:30', 18.00, 4.4, 'OPEN',   2, '2025-09-01 10:00:00'),
(9,  9,  'Sweet Tooth Desserts', 'Desserts',     '5th Block, Koramangala',              '560095', 12.934000, 77.626000, '10:00', '23:59', 15.00, 4.7, 'OPEN',   6, '2025-10-10 10:00:00'),
(10, 3,  'Chaat Corner',         'Street Food',  'DVG Road, Basavanagudi',              '560004', 12.942600, 77.573800, '16:00', '22:00', 12.00, 4.0, 'CLOSED', 9, '2026-01-05 10:00:00'),
(11, 10, 'Mysuru Mess',          'South Indian', 'Saraswathipuram Main Road',           '570009', 12.310000, 76.630000, '07:00', '21:30', 12.00, 4.5, 'OPEN',   6, '2026-02-14 10:00:00'),
(12, 1,  'Tandoor Tales',        'North Indian', 'Vijayanagar 1st Stage',               '570017', 12.322000, 76.618000, '12:00', '23:00', 18.00, NULL,'PENDING_APPROVAL', NULL, '2026-10-20 10:00:00');

-- ---------------------------------------------------------------------
-- MENU_ITEM (40)
-- ---------------------------------------------------------------------
INSERT INTO Menu_Item (item_id, restaurant_id, name, description, category, price, is_veg, is_available, image_url) VALUES
(1,  1,  'Chicken Dum Biryani',   'Slow-cooked Hyderabadi style',     'Biryani',    280.00, FALSE, TRUE,  '/img/1.jpg'),
(2,  1,  'Mutton Biryani',        'Tender mutton, saffron rice',      'Biryani',    380.00, FALSE, FALSE, '/img/2.jpg'),
(3,  1,  'Veg Biryani',           'Seasonal vegetables, raita',       'Biryani',    220.00, TRUE,  TRUE,  '/img/3.jpg'),
(4,  1,  'Chicken 65',            'Spicy deep-fried chicken',         'Starters',   240.00, FALSE, TRUE,  '/img/4.jpg'),
(5,  2,  'Masala Dosa',           'Crispy dosa with potato masala',   'Breakfast',   90.00, TRUE,  TRUE,  '/img/5.jpg'),
(6,  2,  'Idli Vada',             '2 idli + 1 vada with chutney',     'Breakfast',   70.00, TRUE,  TRUE,  '/img/6.jpg'),
(7,  2,  'Rava Idli',             'Semolina idli with sagu',          'Breakfast',   80.00, TRUE,  TRUE,  '/img/7.jpg'),
(8,  2,  'Filter Coffee',         'Traditional South Indian coffee',  'Beverages',   40.00, TRUE,  TRUE,  '/img/8.jpg'),
(9,  3,  'Veg Hakka Noodles',     'Wok-tossed noodles',               'Mains',      180.00, TRUE,  TRUE,  '/img/9.jpg'),
(10, 3,  'Chicken Fried Rice',    'Egg and chicken fried rice',       'Mains',      220.00, FALSE, TRUE,  '/img/10.jpg'),
(11, 3,  'Chilli Paneer',         'Indo-Chinese dry paneer',          'Starters',   230.00, TRUE,  TRUE,  '/img/11.jpg'),
(12, 3,  'Chicken Manchurian',    'Gravy Manchurian',                 'Starters',   250.00, FALSE, TRUE,  '/img/12.jpg'),
(13, 4,  'Margherita Pizza',      'Tomato, mozzarella, basil',        'Pizza',      299.00, TRUE,  TRUE,  '/img/13.jpg'),
(14, 4,  'Farmhouse Pizza',       'Capsicum, onion, mushroom, corn',  'Pizza',      399.00, TRUE,  TRUE,  '/img/14.jpg'),
(15, 4,  'Pepperoni Pizza',       'Classic pork pepperoni',           'Pizza',      449.00, FALSE, TRUE,  '/img/15.jpg'),
(16, 4,  'Garlic Bread',          'Cheesy garlic bread sticks',       'Sides',      149.00, TRUE,  TRUE,  '/img/16.jpg'),
(17, 5,  'Butter Chicken',        'Creamy tomato gravy',              'Mains',      320.00, FALSE, TRUE,  '/img/17.jpg'),
(18, 5,  'Paneer Butter Masala',  'Cottage cheese in butter gravy',   'Mains',      280.00, TRUE,  TRUE,  '/img/18.jpg'),
(19, 5,  'Dal Makhani',           'Black lentils, slow cooked',       'Mains',      220.00, TRUE,  TRUE,  '/img/19.jpg'),
(20, 5,  'Butter Naan',           'Tandoor bread with butter',        'Breads',      50.00, TRUE,  TRUE,  '/img/20.jpg'),
(21, 6,  'Quinoa Salad',          'Quinoa, greens, feta',             'Salads',     260.00, TRUE,  TRUE,  '/img/21.jpg'),
(22, 6,  'Grilled Chicken Bowl',  'Brown rice, grilled chicken',      'Bowls',      320.00, FALSE, TRUE,  '/img/22.jpg'),
(23, 6,  'Fruit Smoothie',        'Banana, berries, yogurt',          'Beverages',  150.00, TRUE,  TRUE,  '/img/23.jpg'),
(24, 7,  'Classic Veg Burger',    'Aloo tikki patty',                 'Burgers',    129.00, TRUE,  TRUE,  '/img/24.jpg'),
(25, 7,  'Chicken Zinger Burger', 'Crispy chicken fillet',            'Burgers',    179.00, FALSE, TRUE,  '/img/25.jpg'),
(26, 7,  'French Fries',          'Salted fries',                     'Sides',       99.00, TRUE,  TRUE,  '/img/26.jpg'),
(27, 7,  'Cold Coffee',           'Iced coffee with ice cream',       'Beverages',  119.00, TRUE,  FALSE, '/img/27.jpg'),
(28, 8,  'Fish Curry Meals',      'Rice, fish curry, sides',          'Meals',      299.00, FALSE, TRUE,  '/img/28.jpg'),
(29, 8,  'Prawn Ghee Roast',      'Mangalorean style',                'Starters',   420.00, FALSE, TRUE,  '/img/29.jpg'),
(30, 8,  'Neer Dosa',             '3 soft rice crepes',               'Breads',      80.00, TRUE,  TRUE,  '/img/30.jpg'),
(31, 9,  'Chocolate Brownie',     'Warm fudge brownie',               'Desserts',   140.00, TRUE,  TRUE,  '/img/31.jpg'),
(32, 9,  'Gulab Jamun',           '2 pieces',                         'Desserts',    90.00, TRUE,  TRUE,  '/img/32.jpg'),
(33, 9,  'Red Velvet Pastry',     'Cream cheese frosting',            'Desserts',   160.00, TRUE,  TRUE,  '/img/33.jpg'),
(34, 10, 'Pani Puri',             '6 pieces',                         'Chaat',       60.00, TRUE,  TRUE,  '/img/34.jpg'),
(35, 10, 'Masala Puri',           'Puri in peas gravy',               'Chaat',       70.00, TRUE,  TRUE,  '/img/35.jpg'),
(36, 10, 'Dahi Papdi Chaat',      'Curd, chutneys, sev',              'Chaat',       90.00, TRUE,  TRUE,  '/img/36.jpg'),
(37, 11, 'Mysore Masala Dosa',    'Red chutney masala dosa',          'Breakfast',  110.00, TRUE,  TRUE,  '/img/37.jpg'),
(38, 11, 'Set Dosa',              '3 soft dosas with sagu',           'Breakfast',   90.00, TRUE,  TRUE,  '/img/38.jpg'),
(39, 12, 'Tandoori Chicken',      'Half, charcoal grilled',           'Starters',   340.00, FALSE, TRUE,  '/img/39.jpg'),
(40, 12, 'Paneer Tikka',          'Charcoal grilled paneer',          'Starters',   280.00, TRUE,  TRUE,  '/img/40.jpg');

-- ---------------------------------------------------------------------
-- INVENTORY (22) - weak entity; rows below reorder_level = low stock
-- ---------------------------------------------------------------------
INSERT INTO Inventory (restaurant_id, ingredient_name, unit, quantity, reorder_level, last_updated) VALUES
(1,  'Basmati Rice',      'kg',    45.00,  20.00, '2026-10-25 09:00:00'),
(1,  'Chicken',           'kg',    18.00,  15.00, '2026-10-25 09:00:00'),
(1,  'Mutton',            'kg',     0.00,  10.00, '2026-10-25 09:00:00'),
(2,  'Dosa Batter',       'litre', 30.00,  15.00, '2026-10-25 06:30:00'),
(2,  'Coffee Powder',     'kg',     3.00,   5.00, '2026-10-25 06:30:00'),
(3,  'Noodles',           'kg',    12.00,   8.00, '2026-10-25 11:00:00'),
(3,  'Paneer',            'kg',     4.00,   5.00, '2026-10-25 11:00:00'),
(4,  'Pizza Dough',       'kg',    25.00,  10.00, '2026-10-25 10:30:00'),
(4,  'Mozzarella Cheese', 'kg',     9.00,   8.00, '2026-10-25 10:30:00'),
(4,  'Pepperoni',         'kg',     2.00,   3.00, '2026-10-25 10:30:00'),
(5,  'Paneer',            'kg',    10.00,   6.00, '2026-10-25 11:30:00'),
(5,  'Butter',            'kg',     7.00,   5.00, '2026-10-25 11:30:00'),
(5,  'Wheat Flour',       'kg',    40.00,  15.00, '2026-10-25 11:30:00'),
(6,  'Quinoa',            'kg',     8.00,   4.00, '2026-10-25 08:30:00'),
(6,  'Fresh Fruits',      'kg',    15.00,  10.00, '2026-10-25 08:30:00'),
(7,  'Burger Buns',       'pcs',  120.00,  60.00, '2026-10-25 10:00:00'),
(7,  'Potatoes',          'kg',    30.00,  15.00, '2026-10-25 10:00:00'),
(7,  'Milk',              'litre',  0.00,  10.00, '2026-10-25 10:00:00'),
(8,  'Prawns',            'kg',     5.00,   4.00, '2026-10-25 11:00:00'),
(9,  'Cocoa Powder',      'kg',     3.00,   2.00, '2026-10-25 09:30:00'),
(10, 'Puri',              'pcs',  400.00, 200.00, '2026-10-24 15:00:00'),
(11, 'Dosa Batter',       'litre', 25.00,  10.00, '2026-10-25 06:00:00');

-- ---------------------------------------------------------------------
-- COUPON (10) - restaurant_id NULL means a platform-wide coupon
-- ---------------------------------------------------------------------
INSERT INTO Coupon (coupon_id, code, description, discount_type, discount_value, max_discount, min_order_value,
                    valid_from, valid_to, usage_limit, restaurant_id, status) VALUES
(1,  'WELCOME50', '50% off on first order',            'PERCENT', 50.00, 100.00, 199.00, '2026-01-01', '2026-12-31', 10000, NULL, 'ACTIVE'),
(2,  'FLAT100',   'Flat Rs 100 off above Rs 499',      'FLAT',   100.00,   NULL, 499.00, '2026-01-01', '2026-12-31',  5000, NULL, 'ACTIVE'),
(3,  'BIRYANI20', '20% off at Spice Route Biryani',    'PERCENT', 20.00,  80.00, 300.00, '2026-06-01', '2026-12-31',  2000, 1,    'ACTIVE'),
(4,  'DOSA10',    '10% off at Udupi Upahar',           'PERCENT', 10.00,  30.00, 150.00, '2026-06-01', '2026-12-31',  2000, 2,    'ACTIVE'),
(5,  'PIZZA150',  'Rs 150 off above Rs 699',           'FLAT',   150.00,   NULL, 699.00, '2026-07-01', '2026-12-31',  1500, 4,    'ACTIVE'),
(6,  'HEALTHY15', '15% off at Green Bowl',             'PERCENT', 15.00,  60.00, 250.00, '2026-07-01', '2026-12-31',  1000, 6,    'ACTIVE'),
(7,  'SWEET25',   '25% off on desserts',               'PERCENT', 25.00,  75.00, 200.00, '2026-08-01', '2026-12-31',  1000, 9,    'ACTIVE'),
(8,  'FREEDEL',   'Rs 40 off (free delivery)',         'FLAT',    40.00,   NULL, 149.00, '2026-01-01', '2026-12-31', 20000, NULL, 'ACTIVE'),
(9,  'DIWALI30',  'Diwali special 30% off',            'PERCENT', 30.00, 120.00, 399.00, '2026-10-15', '2026-11-15',  8000, NULL, 'ACTIVE'),
(10, 'SUMMER40',  'Summer sale 40% off',               'PERCENT', 40.00, 150.00, 299.00, '2026-04-01', '2026-06-30',  5000, NULL, 'EXPIRED');

-- ---------------------------------------------------------------------
-- DELIVERY_PARTNER (12) - partners 2 and 6 are on a delivery right now
-- ---------------------------------------------------------------------
INSERT INTO Delivery_Partner (partner_id, full_name, phone, email, password_hash, vehicle_type, vehicle_number, license_no, city,
                              availability, rating, joined_at, account_status, verified_by) VALUES
(1,  'Manjunath Gowda',  '9731000001', 'manjunath.g@gmail.com', '$2b$10$.5hL76y4XEMmU61o6HX.vuY8wRRxtDAUX0XB2bCxEXC5kAbgaxRPK', 'BIKE',    'KA01HX1234', 'KA0120150012345', 'Bengaluru', 'AVAILABLE', 4.7, '2025-04-01', 'ACTIVE',    3),
(2,  'Ravi Shankar',     '9731000002', 'ravi.s@gmail.com', '$2b$10$PxS3WLBoJTA3LhST4MHWXeNhdnT/0K/ShyViXE50Ust3p/jm6VGme',      'SCOOTER', 'KA05JK5678', 'KA0520170023456', 'Bengaluru', 'BUSY',      4.5, '2025-05-10', 'ACTIVE',    3),
(3,  'Basavaraj Patil',  '9731000003', 'basavaraj.p@gmail.com', '$2b$10$Y9yjTekBL.binv6gMzYqi.sTW0Hmg7H71h4FI9rrRrvxjGSLwwc4a', 'BIKE',    'KA03LM9012', 'KA0320180034567', 'Bengaluru', 'AVAILABLE', 4.8, '2025-06-15', 'ACTIVE',    5),
(4,  'Prakash Naik',     '9731000004', 'prakash.n@gmail.com', '$2b$10$b09FsX1EAFVnLijjwVrrCOUOzOtOqHr2jJXXYnB4jo4FeyqxYPfJq',   'BICYCLE', NULL,         NULL,              'Bengaluru', 'AVAILABLE', 4.2, '2025-07-01', 'ACTIVE',    5),
(5,  'Senthil Kumar',    '9731000005', 'senthil.k@gmail.com', '$2b$10$BeBBZBapYmAyMPog94vGI.0o3GbUz6v8aDVd3RbQQ7tRB1fx7tuqK',   'BIKE',    'KA51NP3456', 'KA5120160056789', 'Bengaluru', 'OFFLINE',   4.4, '2025-08-20', 'ACTIVE',    3),
(6,  'Mohammed Irfan',   '9731000006', 'irfan.m@gmail.com', '$2b$10$5KlKKSqaRfMM7YV9JsVEPuLlSl2wX3NU8xGp83kPHPth/cCobiLvi',     'SCOOTER', 'KA04QR7890', 'KA0420190067890', 'Bengaluru', 'BUSY',      4.6, '2025-09-05', 'ACTIVE',    7),
(7,  'Ganesh Jadhav',    '9731000007', 'ganesh.j@gmail.com', '$2b$10$lGQEGzcJ2mPFFI2pyuBwk.egtE/11ZjznUO4qCgTGZajmPVnJhb/S',    'BIKE',    'KA02ST2345', 'KA0220140078901', 'Bengaluru', 'AVAILABLE', 4.1, '2025-10-12', 'ACTIVE',    7),
(8,  'Sandeep Shinde',   '9731000008', 'sandeep.s@gmail.com', '$2b$10$4VRtPEqXX.sM.s5MqyBCieUj7JKBg74SlBEvd8/B8NPEuWcVmhdpG',   'BIKE',    'KA53UV6789', 'KA5320200089012', 'Bengaluru', 'OFFLINE',   3.9, '2025-12-01', 'SUSPENDED', 7),
(9,  'Gurpreet Singh',   '9731000009', 'gurpreet.s@gmail.com', '$2b$10$1XP6WfV0dwkW/.vscwIvQuhsvD21CYox/oXolGDsUmPOny7BTU0Zm',  'SCOOTER', 'KA01WX0123', 'KA0120160090123', 'Bengaluru', 'AVAILABLE', 4.3, '2026-01-20', 'ACTIVE',    3),
(10, 'Tapas Das',        '9731000010', 'tapas.d@gmail.com', '$2b$10$IW./gLHM80a2s9uk0r1haOhQxPWKBZlGZ8jTu5uXt3zaBbDihsNAW',     'BIKE',    'KA05YZ4567', 'KA0520210101234', 'Bengaluru', 'AVAILABLE', 4.0, '2026-09-28', 'ACTIVE',    5),
(11, 'Dinesh Shetty',    '9731000011', 'dinesh.s@gmail.com', '$2b$10$XzxLFBew01d/jR/91pmSCuZ9Mm0WgFrWI1z0e/QzzqXreDq6OZY62',    'BIKE',    'KA09AB1111', 'KA0920190112345', 'Mysuru',    'AVAILABLE', 4.6, '2026-02-20', 'ACTIVE',    5),
(12, 'Sunil Pawar',      '9731000012', 'sunil.p@gmail.com', '$2b$10$M16i.VYLsiAe8d30uXGgdO0m2ZAUua0TXFnXMJEQreCrI/OYLb.oe',     'SCOOTER', 'KA09CD2222', 'KA0920220123456', 'Mysuru',    'OFFLINE',   NULL,'2026-10-22', 'PENDING',   NULL);

-- ---------------------------------------------------------------------
-- ORDERS (25)
--   discount  : from the coupon rules
--   delivery  : Rs 30, free when subtotal >= 500
--   tax       : 5% GST on (subtotal - discount)
--   total     : computed by MySQL (generated column)
-- ---------------------------------------------------------------------
INSERT INTO Orders (order_id, address_id, restaurant_id, coupon_id, order_time, subtotal, discount_amount,
                    delivery_fee, tax_amount, order_status, special_instructions) VALUES
(1, 1, 2,  4,    '2026-10-02 08:30:00',  260.00,  26.00, 30.00, 11.70, 'DELIVERED', 'Extra chutney please'),
(2, 3, 1,  3,    '2026-10-03 20:15:00',  800.00,  80.00,  0.00, 36.00, 'DELIVERED', NULL),
(3, 5, 3,  NULL, '2026-10-04 13:00:00',  410.00,   0.00, 30.00, 20.50, 'DELIVERED', 'Less spicy'),
(4, 6, 4,  5,    '2026-10-05 21:00:00',  997.00, 150.00,  0.00, 42.35, 'DELIVERED', NULL),
(5, 7, 6,  6,    '2026-10-06 12:45:00',  560.00,  60.00,  0.00, 25.00, 'DELIVERED', 'No onion'),
(6, 9, 7,  8,    '2026-10-07 19:30:00',  357.00,  40.00, 30.00, 15.85, 'DELIVERED', NULL),
(7, 10, 8, 2,    '2026-10-08 13:15:00',  678.00, 100.00,  0.00, 28.90, 'DELIVERED', NULL),
(8, 11, 10, NULL, '2026-10-09 18:10:00',  210.00,   0.00, 30.00, 10.50, 'DELIVERED', 'Pack chutneys separately'),
(9, 12, 5, NULL, '2026-10-10 21:20:00',  740.00,   0.00,  0.00, 37.00, 'DELIVERED', NULL),
(10, 2, 1,  NULL, '2026-10-12 13:30:00',  500.00,   0.00,  0.00, 25.00, 'DELIVERED', 'Deliver to reception'),
(11, 13, 11, NULL, '2026-10-13 08:00:00',  310.00,   0.00, 30.00, 15.50, 'DELIVERED', NULL),
(12, 14, 9, 7,    '2026-10-14 22:00:00',  440.00,  75.00, 30.00, 18.25, 'DELIVERED', 'Birthday - add candle'),
(13, 4, 5,  9,    '2026-10-15 13:00:00',  760.00, 120.00,  0.00, 32.00, 'DELIVERED', NULL),
(14, 5, 4,  5,    '2026-10-16 20:00:00',  747.00, 150.00,  0.00, 29.85, 'DELIVERED', NULL),
(15, 8, 1,  3,    '2026-10-17 13:10:00',  760.00,  80.00,  0.00, 34.00, 'CANCELLED', 'Cancelled by restaurant - mutton out of stock'),
(16, 6, 3,  2,    '2026-10-18 21:30:00',  690.00, 100.00,  0.00, 29.50, 'DELIVERED', NULL),
(17, 9, 9,  NULL, '2026-10-19 16:00:00',  270.00,   0.00, 30.00, 13.50, 'DELIVERED', NULL),
(18, 10, 2, 4,    '2026-10-20 08:15:00',  300.00,  30.00, 30.00, 13.50, 'DELIVERED', NULL),
(19, 11, 5, 9,    '2026-10-21 20:40:00',  940.00, 120.00,  0.00, 41.00, 'DELIVERED', 'House party order'),
(20, 12, 7, NULL, '2026-10-22 19:00:00',  556.00,   0.00,  0.00, 27.80, 'CANCELLED', 'Payment failed'),
(21, 14, 1, 3,    '2026-10-23 21:00:00', 1080.00,  80.00,  0.00, 50.00, 'DELIVERED', NULL),
(22, 1, 4,  NULL, '2026-10-25 12:40:00',  448.00,   0.00, 30.00, 22.40, 'PICKED_UP', NULL),
(23, 3, 9,  NULL, '2026-10-25 13:05:00',  370.00,   0.00, 30.00, 18.50, 'PREPARING', NULL),
(24, 7, 6,  NULL, '2026-10-25 13:20:00',  470.00,   0.00, 30.00, 23.50, 'ACCEPTED',  'Call on arrival'),
(25, 5, 3,  NULL, '2026-10-25 13:30:00',  360.00,   0.00, 30.00, 18.00, 'PLACED',    NULL);

-- ---------------------------------------------------------------------
-- ORDER_ITEM (50)
-- ---------------------------------------------------------------------
INSERT INTO Order_Item (order_id, item_id, quantity, unit_price) VALUES
(1, 5, 2, 90.00),   (1, 8, 2, 40.00),
(2, 1, 2, 280.00),  (2, 4, 1, 240.00),
(3, 9, 1, 180.00),  (3, 11, 1, 230.00),
(4, 14, 1, 399.00), (4, 15, 1, 449.00), (4, 16, 1, 149.00),
(5, 21, 1, 260.00), (5, 23, 2, 150.00),
(6, 24, 2, 129.00), (6, 26, 1, 99.00),
(7, 28, 2, 299.00), (7, 30, 1, 80.00),
(8, 34, 2, 60.00),  (8, 36, 1, 90.00),
(9, 17, 1, 320.00), (9, 19, 1, 220.00), (9, 20, 4, 50.00),
(10, 1, 1, 280.00), (10, 3, 1, 220.00),
(11, 37, 2, 110.00),(11, 38, 1, 90.00),
(12, 31, 2, 140.00),(12, 33, 1, 160.00),
(13, 18, 2, 280.00),(13, 20, 4, 50.00),
(14, 13, 2, 299.00),(14, 16, 1, 149.00),
(15, 2, 2, 380.00),
(16, 10, 2, 220.00),(16, 12, 1, 250.00),
(17, 32, 3, 90.00),
(18, 6, 2, 70.00),  (18, 7, 1, 80.00),  (18, 8, 2, 40.00),
(19, 17, 2, 320.00),(19, 20, 6, 50.00),
(20, 25, 2, 179.00),(20, 26, 2, 99.00),
(21, 1, 3, 280.00), (21, 4, 1, 240.00),
(22, 13, 1, 299.00),(22, 16, 1, 149.00),
(23, 31, 2, 140.00),(23, 32, 1, 90.00),
(24, 22, 1, 320.00),(24, 23, 1, 150.00),
(25, 9, 2, 180.00);

-- ---------------------------------------------------------------------
-- PAYMENT (25) - one per order
-- ---------------------------------------------------------------------
INSERT INTO Payment (payment_id, order_id, method, amount, transaction_ref, payment_status, paid_at) VALUES
(1,  1,  'UPI',     275.70, 'UPI2610020001',  'SUCCESS',  '2026-10-02 08:31:00'),
(2,  2,  'CARD',    756.00, 'CRD2610030002',  'SUCCESS',  '2026-10-03 20:16:00'),
(3,  3,  'UPI',     460.50, 'UPI2610040003',  'SUCCESS',  '2026-10-04 13:01:00'),
(4,  4,  'CARD',    889.35, 'CRD2610050004',  'SUCCESS',  '2026-10-05 21:01:00'),
(5,  5,  'WALLET',  525.00, 'WAL2610060005',  'SUCCESS',  '2026-10-06 12:46:00'),
(6,  6,  'COD',     362.85, NULL,             'SUCCESS',  '2026-10-07 20:05:00'),
(7,  7,  'UPI',     606.90, 'UPI2610080007',  'SUCCESS',  '2026-10-08 13:16:00'),
(8,  8,  'UPI',     250.50, 'UPI2610090008',  'SUCCESS',  '2026-10-09 18:11:00'),
(9,  9,  'CARD',    777.00, 'CRD2610100009',  'SUCCESS',  '2026-10-10 21:21:00'),
(10, 10, 'UPI',     525.00, 'UPI2610120010',  'SUCCESS',  '2026-10-12 13:31:00'),
(11, 11, 'UPI',     355.50, 'UPI2610130011',  'SUCCESS',  '2026-10-13 08:01:00'),
(12, 12, 'UPI',     413.25, 'UPI2610140012',  'SUCCESS',  '2026-10-14 22:01:00'),
(13, 13, 'CARD',    672.00, 'CRD2610150013',  'SUCCESS',  '2026-10-15 13:01:00'),
(14, 14, 'UPI',     626.85, 'UPI2610160014',  'SUCCESS',  '2026-10-16 20:01:00'),
(15, 15, 'NET_BANKING', 714.00, 'NB26101700015', 'REFUNDED', '2026-10-17 13:11:00'),
(16, 16, 'CARD',    619.50, 'CRD2610180016',  'SUCCESS',  '2026-10-18 21:31:00'),
(17, 17, 'COD',     313.50, NULL,             'SUCCESS',  '2026-10-19 16:45:00'),
(18, 18, 'UPI',     313.50, 'UPI2610200018',  'SUCCESS',  '2026-10-20 08:16:00'),
(19, 19, 'UPI',     861.00, 'UPI2610210019',  'SUCCESS',  '2026-10-21 20:41:00'),
(20, 20, 'CARD',    583.80, 'CRD2610220020',  'FAILED',   NULL),
(21, 21, 'CARD',   1050.00, 'CRD2610230021',  'SUCCESS',  '2026-10-23 21:01:00'),
(22, 22, 'UPI',     500.40, 'UPI2610250022',  'SUCCESS',  '2026-10-25 12:41:00'),
(23, 23, 'CARD',    418.50, 'CRD2610250023',  'SUCCESS',  '2026-10-25 13:06:00'),
(24, 24, 'COD',     523.50, NULL,             'PENDING',  NULL),
(25, 25, 'UPI',     408.00, 'UPI2610250025',  'SUCCESS',  '2026-10-25 13:31:00');

-- ---------------------------------------------------------------------
-- DELIVERY (21) - earning = Rs 25 + Rs 8 per km
--   orders 15 and 20 were cancelled; orders 24 and 25 wait for a partner
-- ---------------------------------------------------------------------
INSERT INTO Delivery (delivery_id, order_id, partner_id, assigned_at, picked_up_at, delivered_at, distance_km,
                      delivery_status, partner_earning) VALUES
(1,  1,  1, '2026-10-02 08:35:00', '2026-10-02 08:52:00', '2026-10-02 09:02:00',  1.20, 'DELIVERED',  34.60),
(2,  2,  2, '2026-10-03 20:20:00', '2026-10-03 20:40:00', '2026-10-03 20:55:00',  1.80, 'DELIVERED',  39.40),
(3,  3,  3, '2026-10-04 13:05:00', '2026-10-04 13:22:00', '2026-10-04 13:30:00',  0.90, 'DELIVERED',  32.20),
(4,  4,  6, '2026-10-05 21:05:00', '2026-10-05 21:25:00', '2026-10-05 21:33:00',  0.60, 'DELIVERED',  29.80),
(5,  5,  9, '2026-10-06 12:50:00', '2026-10-06 13:05:00', '2026-10-06 13:20:00',  2.60, 'DELIVERED',  45.80),
(6,  6,  7, '2026-10-07 19:35:00', '2026-10-07 19:52:00', '2026-10-07 20:02:00',  0.80, 'DELIVERED',  31.40),
(7,  7,  1, '2026-10-08 13:20:00', '2026-10-08 13:40:00', '2026-10-08 13:46:00',  0.40, 'DELIVERED',  28.20),
(8,  8,  4, '2026-10-09 18:15:00', '2026-10-09 18:28:00', '2026-10-09 18:35:00',  0.30, 'DELIVERED',  27.40),
(9,  9,  2, '2026-10-10 21:25:00', '2026-10-10 21:48:00', '2026-10-10 22:30:00',  0.50, 'DELIVERED',  29.00),
(10, 10, 3, '2026-10-12 13:35:00', '2026-10-12 13:55:00', '2026-10-12 14:12:00',  3.60, 'DELIVERED',  53.80),
(11, 11, 11,'2026-10-13 08:05:00', '2026-10-13 08:20:00', '2026-10-13 08:32:00',  1.50, 'DELIVERED',  37.00),
(12, 12, 9, '2026-10-14 22:05:00', '2026-10-14 22:18:00', '2026-10-14 22:40:00',  5.40, 'DELIVERED',  68.20),
(13, 13, 6, '2026-10-15 13:05:00', '2026-10-15 13:25:00', '2026-10-15 13:42:00',  2.30, 'DELIVERED',  43.40),
(14, 14, 3, '2026-10-16 20:05:00', '2026-10-16 20:30:00', '2026-10-16 21:25:00',  7.80, 'DELIVERED',  87.40),
(15, 16, 7, '2026-10-18 21:35:00', '2026-10-18 21:58:00', '2026-10-18 22:35:00',  8.20, 'DELIVERED',  90.60),
(16, 17, 2, '2026-10-19 16:05:00', '2026-10-19 16:20:00', '2026-10-19 16:38:00',  2.40, 'DELIVERED',  44.20),
(17, 18, 7, '2026-10-20 08:20:00', '2026-10-20 08:35:00', '2026-10-20 09:05:00',  7.50, 'DELIVERED',  85.00),
(18, 19, 1, '2026-10-21 20:45:00', '2026-10-21 21:10:00', '2026-10-21 21:55:00', 14.20, 'DELIVERED', 138.60),
(19, 21, 9, '2026-10-23 21:05:00', '2026-10-23 21:30:00', '2026-10-23 21:55:00',  4.10, 'DELIVERED',  57.80),
(20, 22, 2, '2026-10-25 12:45:00', '2026-10-25 13:05:00', NULL,                   6.30, 'PICKED_UP',  75.40),
(21, 23, 6, '2026-10-25 13:10:00', NULL,                  NULL,                   0.60, 'ASSIGNED',   29.80);

-- ---------------------------------------------------------------------
-- REVIEW (16) - only for delivered orders
-- ---------------------------------------------------------------------
INSERT INTO Review (review_id, order_id, food_rating, delivery_rating, comment, created_at) VALUES
(1,  1,  5, 5, 'Crispy dosa and hot coffee, loved it',        '2026-10-02 10:00:00'),
(2,  2,  4, 5, 'Biryani was great, slightly too spicy',       '2026-10-03 22:00:00'),
(3,  3,  4, 4, 'Good portion size',                           '2026-10-04 15:00:00'),
(4,  4,  5, 4, 'Pizzas arrived hot and fresh',                '2026-10-05 22:30:00'),
(5,  5,  5, 5, 'Healthy and tasty',                           '2026-10-06 14:00:00'),
(6,  6,  3, 4, 'Burger was a bit cold',                       '2026-10-07 21:00:00'),
(7,  7,  5, 5, 'Authentic coastal taste',                     '2026-10-08 15:00:00'),
(8,  9,  4, 3, 'Food was good but delivery was late',         '2026-10-10 23:00:00'),
(9,  10, 4, 5, 'Chicken biryani excellent, veg one average',  '2026-10-12 15:00:00'),
(10, 11, 5, 5, 'Best Mysore masala dosa in town',             '2026-10-13 09:30:00'),
(11, 12, 5, 4, 'Brownies were heavenly',                      '2026-10-14 23:10:00'),
(12, 13, 4, 4, 'Paneer was soft, naan a little hard',         '2026-10-15 15:00:00'),
(13, 14, 4, 2, 'Delivery took almost 90 minutes',             '2026-10-16 22:00:00'),
(14, 16, 3, 3, 'Fried rice was oily',                         '2026-10-18 23:00:00'),
(15, 18, 5, 5, 'Perfect breakfast',                           '2026-10-20 10:00:00'),
(16, 19, 4, 5, 'Butter chicken was a hit at the party',       '2026-10-21 23:30:00');

-- Row counts per table
SELECT 'Admin' AS table_name, COUNT(*) AS row_count FROM Admin
UNION ALL SELECT 'Pincode',          COUNT(*) FROM Pincode
UNION ALL SELECT 'Customer',         COUNT(*) FROM Customer
UNION ALL SELECT 'Address',          COUNT(*) FROM Address
UNION ALL SELECT 'Restaurant_Owner', COUNT(*) FROM Restaurant_Owner
UNION ALL SELECT 'Restaurant',       COUNT(*) FROM Restaurant
UNION ALL SELECT 'Menu_Item',        COUNT(*) FROM Menu_Item
UNION ALL SELECT 'Inventory',        COUNT(*) FROM Inventory
UNION ALL SELECT 'Coupon',           COUNT(*) FROM Coupon
UNION ALL SELECT 'Delivery_Partner', COUNT(*) FROM Delivery_Partner
UNION ALL SELECT 'Orders',           COUNT(*) FROM Orders
UNION ALL SELECT 'Order_Item',       COUNT(*) FROM Order_Item
UNION ALL SELECT 'Payment',          COUNT(*) FROM Payment
UNION ALL SELECT 'Delivery',         COUNT(*) FROM Delivery
UNION ALL SELECT 'Review',           COUNT(*) FROM Review;
