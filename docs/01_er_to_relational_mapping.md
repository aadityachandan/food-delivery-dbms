# Mapping the ER Diagram to the Relational Schema

**Project:** Smart Multi-Vendor Food Delivery & Logistics Management System

This document applies the standard **7-step ER-to-relational mapping algorithm** (Elmasri & Navathe) to our ER diagram (`er_diagram/er_diagram.png`). Every table in `sql/01_create_schema.sql` comes from one of these steps.

**Notation:** **bold** is the primary key, *italic* is a foreign key (→ the table it references).

---

## The ER diagram at a glance

| Kind | Items |
|---|---|
| **Strong entities (13)** | ADMIN, PINCODE, CUSTOMER, ADDRESS, RESTAURANT_OWNER, RESTAURANT, MENU_ITEM, COUPON, ORDERS, PAYMENT, DELIVERY_PARTNER, DELIVERY, REVIEW |
| **Weak entity (1)** | INVENTORY, owned by RESTAURANT through the identifying relationship *stocks* |
| **1:1 relationships (3)** | *paid via* (Orders–Payment), *fulfilled by* (Orders–Delivery), *rated by* (Orders–Review) |
| **Identifying 1:N relationship (1)** | *stocks* (Restaurant–Inventory) |
| **Other 1:N relationships (12)** | *has*, *delivered to*, *receives*, *serves*, *owns*, *offers*, *applied to*, *delivers*, *approves*, *verifies*, *located in* (×2: Address and Restaurant) |
| **M:N relationship (1)** | *contains* (Orders–Menu_Item), with attributes `quantity` and `unit_price` |
| **Composite attribute** | RESTAURANT.address = {address_line, latitude, longitude} |
| **Derived attributes** | DELIVERY_PARTNER.total_earnings, ORDERS.total_amount |
| **Multivalued attributes** | none |
| **n-ary relationships (n > 2)** | none |

---

## Step 1: Strong (regular) entity types

Each strong entity becomes its own table, holding all its simple attributes. Its key attribute becomes the primary key. Composite attributes are flattened into their parts.

| Entity | Table | Primary key | Notes |
|---|---|---|---|
| ADMIN | Admin | **admin_id** | `email` is UNIQUE, a second candidate key |
| PINCODE | Pincode | **pincode** | city and state of a postal area |
| CUSTOMER | Customer | **customer_id** | `email` and `phone` are UNIQUE |
| ADDRESS | Address | **address_id** | |
| RESTAURANT_OWNER | Restaurant_Owner | **owner_id** | |
| RESTAURANT | Restaurant | **restaurant_id** | composite `address` → columns `address_line`, `latitude`, `longitude` |
| MENU_ITEM | Menu_Item | **item_id** | (restaurant_id, name) is UNIQUE |
| COUPON | Coupon | **coupon_id** | `code` is UNIQUE |
| ORDERS | Orders | **order_id** | derived `total_amount` → a **generated column** |
| PAYMENT | Payment | **payment_id** | |
| DELIVERY_PARTNER | Delivery_Partner | **partner_id** | derived `total_earnings` is **not stored**; it is computed as `SUM(Delivery.partner_earning)` |
| DELIVERY | Delivery | **delivery_id** | |
| REVIEW | Review | **review_id** | |

**How derived attributes are handled:**
- `total_earnings` is never stored, because it would go stale every time a delivery finishes.
- `total_amount` is stored for speed, but as `GENERATED ALWAYS AS (subtotal − discount_amount + delivery_fee + tax_amount) STORED`. MySQL computes it, so it can never disagree with the bill columns.

---

## Step 2: Weak entity types

A weak entity's table holds its own attributes plus the primary key of its owner. The primary key is the owner's key plus the partial key. Deleting the owner deletes the weak rows (`ON DELETE CASCADE`).

| Weak entity | Owner | Partial key | Table |
|---|---|---|---|
| INVENTORY | RESTAURANT | ingredient_name | **Inventory**(***restaurant_id*→Restaurant, ingredient_name**, unit, quantity, reorder_level, last_updated) |

A stock entry such as "Paneer, 4 kg" means nothing on its own. It only has meaning for one particular restaurant, so it is a weak entity.

---

## Step 3: Binary 1:1 relationships

We use the **foreign-key approach**. The foreign key goes in the table on the **total-participation** side, and is declared `UNIQUE NOT NULL`. UNIQUE keeps the relationship 1:1, and NOT NULL enforces total participation. Putting it on the other side would leave NULLs in Orders for orders that aren't paid, delivered or reviewed yet.

| Relationship | Total side | Mapping |
|---|---|---|
| ORDERS *paid via* PAYMENT | PAYMENT (every payment is for an order) | `Payment.order_id` → Orders, UNIQUE NOT NULL |
| ORDERS *fulfilled by* DELIVERY | DELIVERY | `Delivery.order_id` → Orders, UNIQUE NOT NULL |
| ORDERS *rated by* REVIEW | REVIEW | `Review.order_id` → Orders, UNIQUE NOT NULL |

---

## Step 4: Binary 1:N relationships

The primary key of the "1" side becomes a foreign key in the table on the "N" side. It is NOT NULL when the N side has total participation, and NULL is allowed when participation is partial.

| Relationship | 1 side | N side | Foreign key added | NULL allowed? |
|---|---|---|---|---|
| *has* | Customer | Address | `Address.customer_id` | no (total) |
| *delivered to* | Address | Orders | `Orders.address_id` | no |
| *receives* | Restaurant | Orders | `Orders.restaurant_id` | no |
| *serves* | Restaurant | Menu_Item | `Menu_Item.restaurant_id` | no |
| *owns* | Restaurant_Owner | Restaurant | `Restaurant.owner_id` | no |
| *offers* | Restaurant | Coupon | `Coupon.restaurant_id` | **yes**: NULL means a platform-wide coupon |
| *applied to* | Coupon | Orders | `Orders.coupon_id` | **yes**: an order without a coupon |
| *delivers* | Delivery_Partner | Delivery | `Delivery.partner_id` | no |
| *approves* | Admin | Restaurant | `Restaurant.approved_by` | **yes**: pending restaurants |
| *verifies* | Admin | Delivery_Partner | `Delivery_Partner.verified_by` | **yes**: pending partners |
| *located in* | Pincode | Address | `Address.pincode` | no |
| *located in* | Pincode | Restaurant | `Restaurant.pincode` | no |

**Why Orders has no `customer_id`:** an order is *delivered to* one of the customer's own saved addresses, and every address *belongs to* exactly one customer. So the customer of an order is already determined by its address (`address_id → customer_id`). A separate *places* relationship (Customer–Orders) would repeat the same fact. In the table it would create a transitive dependency (see `03_functional_dependencies.md`), so the ER diagram reaches the customer through ADDRESS.

---

## Step 5: Binary M:N relationships

The relationship becomes a new table. Its primary key is made of the foreign keys to both participating tables, and the relationship's own attributes become columns.

| Relationship | Table |
|---|---|
| ORDERS *contains* MENU_ITEM (quantity, unit_price) | **Order_Item**(***order_id*→Orders, *item_id*→Menu_Item**, quantity, unit_price) |

`unit_price` belongs to the relationship, not to MENU_ITEM. It is the price **at the time of that order**, so a later price change doesn't alter old bills.

---

## Step 6: Multivalued attributes

There are none. Where an attribute could have been multivalued, we modelled it as an entity instead:
- A customer's many delivery addresses are the **ADDRESS** entity (1:N), not a multivalued attribute of CUSTOMER, because each address has its own attributes (label, pincode, coordinates) and orders refer to it.

---

## Step 7: n-ary relationships (degree > 2)

There are none. A delivery involves an order, a partner and a time, which could be drawn as a ternary relationship. Instead it is modelled as the entity **DELIVERY**, because it has its own lifecycle and attributes (assigned_at, picked_up_at, delivered_at, distance_km, status, earning). It is linked by the two binary relationships *fulfilled by* and *delivers*.

---

## Result: the final relational schema (15 tables)

1. **Admin**(**admin_id**, full_name, email, password_hash, role, created_at)
2. **Pincode**(**pincode**, city, state)
3. **Customer**(**customer_id**, full_name, email, phone, password_hash, created_at, status)
4. **Address**(**address_id**, *customer_id*, label, address_line, *pincode*, latitude, longitude, is_default)
5. **Restaurant_Owner**(**owner_id**, full_name, email, phone, password_hash, status)
6. **Restaurant**(**restaurant_id**, *owner_id*, name, cuisine_type, address_line, *pincode*, latitude, longitude, opening_time, closing_time, commission_pct, rating, status, *approved_by*, created_at)
7. **Menu_Item**(**item_id**, *restaurant_id*, name, description, category, price, is_veg, is_available, image_url)
8. **Inventory**(***restaurant_id*, ingredient_name**, unit, quantity, reorder_level, last_updated)
9. **Coupon**(**coupon_id**, code, description, discount_type, discount_value, max_discount, min_order_value, valid_from, valid_to, usage_limit, *restaurant_id*, status)
10. **Orders**(**order_id**, *address_id*, *restaurant_id*, *coupon_id*, order_time, subtotal, discount_amount, delivery_fee, tax_amount, total_amount *(generated)*, order_status, special_instructions)
11. **Order_Item**(***order_id*, *item_id***, quantity, unit_price)
12. **Payment**(**payment_id**, *order_id* UNIQUE, method, amount, transaction_ref, payment_status, paid_at)
13. **Delivery_Partner**(**partner_id**, full_name, phone, email, vehicle_type, vehicle_number, license_no, city, availability, rating, joined_at, account_status, *verified_by*)
14. **Delivery**(**delivery_id**, *order_id* UNIQUE, *partner_id*, assigned_at, picked_up_at, delivered_at, distance_km, delivery_status, partner_earning)
15. **Review**(**review_id**, *order_id* UNIQUE, food_rating, delivery_rating, comment, created_at)

### Summary: ER construct → relational construct

| ER construct | Count | Becomes |
|---|---|---|
| Strong entity | 13 | 13 tables |
| Weak entity + identifying relationship | 1 | 1 table with a composite PK and FK `ON DELETE CASCADE` |
| 1:1 relationship | 3 | `UNIQUE NOT NULL` FK on the total side |
| 1:N relationship | 12 | 12 FK columns on the N side |
| M:N relationship | 1 | 1 new table (Order_Item) |
| Composite attribute | 1 | its component columns |
| Derived attribute | 2 | one generated column, one computed in queries |
| **Total tables** | | **15** |

### Referential actions chosen

| Foreign key | On delete | Why |
|---|---|---|
| Address.customer_id | CASCADE | an address is meaningless without its customer |
| Inventory, Menu_Item → Restaurant | CASCADE | owned data of the restaurant |
| Order_Item, Payment, Delivery, Review → Orders | CASCADE | they describe the order |
| everything else | RESTRICT (default) | history must not disappear, e.g. you can't delete a restaurant that has orders |
