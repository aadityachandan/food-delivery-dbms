# Functional Dependencies and Normalisation

**Project:** Smart Multi-Vendor Food Delivery & Logistics Management System

A **functional dependency (FD)** X → Y means that any two rows with the same X must have the same Y.

This document does three things:
1. lists the FDs of every table,
2. finds the candidate keys,
3. checks each table against 1NF, 2NF, 3NF and BCNF, and shows the three decompositions the FD analysis led to.

**Result:** all 15 tables are in **BCNF**.

---

## 1. Three problems the FD analysis found, and how they were fixed

### Fix 1: `pincode → city, state` (transitive dependency)

**Before:** `Address(address_id, customer_id, label, address_line, city, pincode, latitude, longitude, is_default)`. Restaurant had the same city and pincode columns.

FDs: `address_id → pincode` and `pincode → city`. So `address_id → pincode → city` is a **transitive dependency**. The determinant `pincode` is not a key, and `city` is a non-prime attribute, which violates 3NF.

| Anomaly | Example |
|---|---|
| Update | Renaming "Bangalore" to "Bengaluru" means updating every Address and Restaurant row with a 560xxx pincode. Missing one leaves two names for the same pincode. |
| Insertion | You can't record which city a pincode belongs to until some customer or restaurant uses it |
| Deletion | Deleting the last address in 570017 loses the fact that 570017 is in Mysuru |

**After (decomposition):**
- `Pincode(pincode, city, state)`
- `Address(address_id, customer_id, label, address_line, pincode, latitude, longitude, is_default)`
- `Restaurant(…, address_line, pincode, latitude, longitude, …)`

- **Lossless join:** Address ∩ Pincode = {pincode}, and pincode is the key of Pincode. So `Address ⋈ Pincode` gives back exactly the original rows with no extra (spurious) tuples.
- **Dependency preserving:** `pincode → city, state` is checked inside Pincode, and `address_id → …` inside Address.
- **Why state is not split out further:** `city → state` is **not** an FD. City names repeat across states (Aurangabad is in Bihar and in Maharashtra), so Pincode is in BCNF.

### Fix 2: `address_id → customer_id` inside Orders (transitive dependency)

**Before:** `Orders(order_id, customer_id, restaurant_id, address_id, …)`

An order is delivered to one of the customer's saved addresses, and each address belongs to exactly one customer. So `address_id → customer_id` holds inside Orders, and `order_id → address_id → customer_id` is transitive, which violates 3NF.

| Anomaly | Example |
|---|---|
| Inconsistency | An order could be stored with `customer_id = 5` but the address of customer 1. Nothing in the old table prevents it. |
| Redundancy | The customer is stored twice, once in Address and again in every order |

**After:** `customer_id` is removed from Orders. The customer of an order is found with `Orders ⋈ Address`.
- **Lossless:** Orders ∩ Address = {address_id}, which is the key of Address.
- **Dependency preserving:** `address_id → customer_id` lives in Address.

### Fix 3: the order total (a derived attribute)

`{subtotal, discount_amount, delivery_fee, tax_amount} → total_amount`, because `total = subtotal − discount + fee + tax`. If total were an ordinary column, an update to the discount without the total would leave the bill inconsistent.

**After:** `total_amount` is a **generated column**:
```sql
total_amount DECIMAL(10,2) GENERATED ALWAYS AS
    (subtotal - discount_amount + delivery_fee + tax_amount) STORED
```
MySQL computes it and refuses any direct write to it, so it can never disagree with its parts. For normalisation it is a computed attribute, not an independently stored fact. The base relation Orders without it is in BCNF, and no update anomaly is possible.

### Fixed earlier (in the review of the first draft)

| Old table | FD that broke 3NF | Fix |
|---|---|---|
| Review(review_id, order_id, customer_id, restaurant_id, …) | order_id → customer_id, restaurant_id | Review keeps only order_id |
| Inventory(inventory_id, restaurant_id, item_id, …) | item_id → restaurant_id | Inventory is now ingredient stock, keyed by (restaurant_id, ingredient_name) |
| Orders(…, payment_status) next to Payment(…, status) | the same fact stored twice | payment status is stored only in Payment |

---

## 2. Dependencies that look like FDs but are not

Normalisation only covers rules that must **always** hold. These look like FDs in the sample data but are deliberately **not** treated as FDs:

| Looks like | Why it is not an FD |
|---|---|
| `item_id → unit_price` in Order_Item | Menu prices change (the activity log shows Farmhouse Pizza going from ₹379 to ₹399). `unit_price` is the price **when that order was placed**, so it depends on the whole key (order_id, item_id). This is what keeps Order_Item in 2NF. |
| `subtotal → delivery_fee`, `{subtotal, discount} → tax_amount` | Fee and tax rules change over time (surge fees, GST rate changes). These columns record what was **actually charged** on that order. |
| `distance_km → partner_earning` in Delivery | The pay formula (₹25 + ₹8/km) changes with incentives and surge pay. The column records what was actually paid. |
| `ingredient_name → unit` in Inventory | Different restaurants buy the same ingredient in different units (paneer by kg or by block). |
| `city → state` in Pincode | City names repeat across states (Aurangabad). |
| `name → restaurant_id` in Restaurant | Chains have several outlets with the same name. |

---

## 3. FDs, candidate keys and normal form of every table

**Notation:**
- **CK** means candidate key, and the primary key is marked (PK).
- "all" means every other attribute of the table.
- A key is shown in **bold**.

| # | Table | Functional dependencies | Candidate keys | Highest NF |
|---|---|---|---|---|
| 1 | Admin | admin_id → all; email → admin_id | **{admin_id}** (PK), {email} | BCNF |
| 2 | Pincode | pincode → city, state | **{pincode}** | BCNF |
| 3 | Customer | customer_id → all; email → customer_id; phone → customer_id | **{customer_id}**, {email}, {phone} | BCNF |
| 4 | Address | address_id → customer_id, label, address_line, pincode, latitude, longitude, is_default | **{address_id}** | BCNF |
| 5 | Restaurant_Owner | owner_id → all; email → owner_id; phone → owner_id | **{owner_id}**, {email}, {phone} | BCNF |
| 6 | Restaurant | restaurant_id → all | **{restaurant_id}** | BCNF |
| 7 | Menu_Item | item_id → all; {restaurant_id, name} → item_id | **{item_id}**, {restaurant_id, name} | BCNF |
| 8 | Inventory | {restaurant_id, ingredient_name} → unit, quantity, reorder_level, last_updated | **{restaurant_id, ingredient_name}** | BCNF |
| 9 | Coupon | coupon_id → all; code → coupon_id | **{coupon_id}**, {code} | BCNF |
| 10 | Orders | order_id → address_id, restaurant_id, coupon_id, order_time, subtotal, discount_amount, delivery_fee, tax_amount, order_status, special_instructions (total_amount is generated) | **{order_id}** | BCNF |
| 11 | Order_Item | {order_id, item_id} → quantity, unit_price | **{order_id, item_id}** | BCNF |
| 12 | Payment | payment_id → all; order_id → payment_id; transaction_ref → payment_id (when not NULL) | **{payment_id}**, {order_id} | BCNF |
| 13 | Delivery_Partner | partner_id → all; phone → partner_id; email → partner_id; vehicle_number → partner_id; license_no → partner_id (the last two when not NULL) | **{partner_id}**, {phone}, {email} | BCNF |
| 14 | Delivery | delivery_id → all; order_id → delivery_id | **{delivery_id}**, {order_id} | BCNF |
| 15 | Review | review_id → all; order_id → review_id | **{review_id}**, {order_id} | BCNF |

`transaction_ref`, `vehicle_number` and `license_no` are UNIQUE but can be NULL (COD payments, bicycle riders). So they are not candidate keys, but whenever they have a value they still identify a single row.

---

## 4. Checking each normal form

### 1NF: atomic values, no repeating groups
- Every column holds one value: one phone, one email, one price.
- What would have been a repeating group is its own table:
  - the items of an order → **Order_Item**
  - a customer's addresses → **Address**
  - a restaurant's stock → **Inventory**
- Every table has a primary key.

**All 15 tables are in 1NF.**

### 2NF: no partial dependency on part of a composite key
Only tables with a composite key can break 2NF:

| Table | Key | Check |
|---|---|---|
| Inventory | (restaurant_id, ingredient_name) | `unit`, `quantity`, `reorder_level` and `last_updated` describe **this restaurant's** stock of **this** ingredient, so they need both parts. ingredient_name ↛ unit (section 2). |
| Order_Item | (order_id, item_id) | `quantity` needs both parts. `unit_price` is the order-time price, so item_id alone does not determine it (section 2). |

Every other table has a single-attribute primary key, so a partial dependency is impossible. **All 15 tables are in 2NF.**

### 3NF: no transitive dependency (non-key → non-key)
After Fixes 1–3, no non-key attribute determines another non-key attribute in any table:
- pincode → city lives only in Pincode, where pincode is the key.
- address_id → customer_id lives only in Address, where address_id is the key.
- The total is a generated column.

**All 15 tables are in 3NF.**

### BCNF: every determinant is a candidate key
Look at the left side of every FD in the table in section 3. Each one is a candidate key of its table: admin_id, email, pincode, customer_id, phone, address_id, owner_id, restaurant_id, item_id, {restaurant_id, name}, {restaurant_id, ingredient_name}, coupon_id, code, order_id, {order_id, item_id}, payment_id, partner_id, delivery_id and review_id.

**All 15 tables are in BCNF.**

---

## 5. Worked examples (attribute closure)

**Is {restaurant_id, name} a key of Menu_Item?**
1. {restaurant_id, name}⁺ starts as {restaurant_id, name}.
2. Using {restaurant_id, name} → item_id, add item_id.
3. Using item_id → description, category, price, is_veg, is_available, image_url, add all of those.
4. The closure now contains every attribute of Menu_Item, so it is a superkey.

Neither {restaurant_id}⁺ nor {name}⁺ covers everything, so the pair is minimal. It is a **candidate key**, enforced by `UNIQUE (restaurant_id, name)`.

**Old Orders: is it in 3NF?** (before Fix 2)
1. F = { order_id → customer_id, address_id, restaurant_id, …;  address_id → customer_id }
2. {address_id}⁺ = {address_id, customer_id}, which is not all attributes. So address_id is **not** a superkey of Orders.
3. customer_id is not part of any candidate key (the only key is order_id), so it is non-prime.
4. An FD whose left side is not a superkey and whose right side is non-prime breaks **3NF**. Hence Fix 2.

**Old Address: 3NF test** (before Fix 1)
1. F includes pincode → city.
2. {pincode}⁺ = {pincode, city}, not a superkey, and city is non-prime.
3. Therefore it is not in 3NF. Hence Fix 1.

---

## 6. Controlled redundancy we keep on purpose

| Data | Why it is kept | How it stays correct |
|---|---|---|
| `Restaurant.rating` (an average of reviews) | It is shown on every search result, so it's cheaper than averaging reviews each time | Refreshed by an AFTER INSERT trigger on Review (phase 2) |
| `Payment.amount` (equals the order total today) | A payment is a financial record of what was charged, and can differ after partial refunds | Written in the same transaction as the order |

These values are copied from other tables, not facts determined by attributes within the same table, so normal forms don't cover them. They are listed here so the redundancy is a conscious choice.
