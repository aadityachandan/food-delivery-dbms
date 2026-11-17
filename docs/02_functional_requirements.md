# Functional Requirements

**Project:** Smart Multi-Vendor Food Delivery & Logistics Management System

Each requirement has an ID, the data it uses, and where it is implemented. **UI** means it works in the web app (`app/`). **SQL** means it is demonstrated in `sql/03_key_queries.sql`. **Phase 2** means it is planned.

---

## 1. Users of the system

| Actor | Goal |
|---|---|
| Customer | Find food, order, pay, track the delivery, give feedback |
| Restaurant owner | Run outlets: menu, stock, incoming orders, sales |
| Delivery partner | Accept and complete deliveries, earn money |
| Admin | Keep the platform running: approvals, partner assignment, monitoring, revenue |

---

## 2. Customer module

| ID | Requirement | Data used | Where |
|---|---|---|---|
| FR-C1 | Search restaurants by **city, cuisine or name**. Filter by **veg only, maximum item price, minimum rating, open now**. (Key query 1) | Restaurant, Pincode, Menu_Item | UI, SQL |
| FR-C2 | View a restaurant's menu grouped by category, with veg/non-veg marks and availability | Menu_Item | UI |
| FR-C3 | Add or remove items in a cart. A cart holds items from one restaurant only. | (browser) | UI |
| FR-C4 | Apply a coupon. The system checks that it is active, within its dates, above the minimum order value, valid for this restaurant, and under its usage limit. | Coupon, Orders | UI |
| FR-C5 | See the bill before paying: subtotal, discount, delivery fee (₹30, free at ₹500 and above), 5% GST, total | Orders | UI |
| FR-C6 | Choose one of the customer's saved addresses and a payment method (UPI, Card, Net banking, Wallet, COD) | Address, Payment | UI |
| FR-C7 | Place an order **atomically**: Orders, Order_Item and Payment are written in one transaction. A tracking event and notifications are written to MongoDB. | Orders, Order_Item, Payment · MongoDB | UI |
| FR-C8 | Track an order: a status stepper, a timeline of events, the delivery partner's details and live location on a map (Key query 2) | Orders, Delivery, Delivery_Partner · `order_tracking_events`, `partner_locations` | UI, SQL |
| FR-C9 | See order history with items, amount, payment status and delivery status | Orders, Order_Item, Payment, Delivery | UI, SQL |
| FR-C10 | Cancel an order while it is still PLACED. The payment is refunded. | Orders, Payment | UI |
| FR-C11 | Rate a delivered order once: food rating 1–5, delivery rating 1–5, comment | Review | UI |
| FR-C12 | Manage saved addresses (add or edit) | Address | Phase 2 |
| FR-C13 | Sign up and log in with a hashed password | Customer | Phase 2 |

## 3. Restaurant owner module

| ID | Requirement | Data used | Where |
|---|---|---|---|
| FR-R1 | Pick one of the owner's outlets | Restaurant | UI |
| FR-R2 | Sales dashboard for a date range: delivered orders, food sales, platform commission, restaurant-funded discounts, net payout (Key query 3) | Orders, Coupon, Restaurant | UI, SQL |
| FR-R3 | Top-selling items of the outlet | Order_Item, Menu_Item | UI, SQL |
| FR-R4 | Live order board. Move an order PLACED → ACCEPTED → PREPARING → READY, or reject it (cancel and refund). Each step notifies the customer. | Orders, Payment · MongoDB | UI |
| FR-R5 | Turn a menu item on or off (out of stock) | Menu_Item | UI |
| FR-R6 | Inventory: see stock, highlight items at or below the reorder level, update quantities | Inventory | UI |
| FR-R7 | Add or edit menu items and prices | Menu_Item | Phase 2 |
| FR-R8 | Create restaurant coupons | Coupon | Phase 2 |

## 4. Delivery partner module

| ID | Requirement | Data used | Where |
|---|---|---|---|
| FR-P1 | Go online or offline (availability) | Delivery_Partner · `partner_locations` | UI |
| FR-P2 | See the current delivery: restaurant, customer address, items, amount to collect for COD | Delivery, Orders, Address | UI |
| FR-P3 | Mark **picked up** (only when the order is READY) and **delivered**. On delivery, a COD payment becomes paid and the partner becomes available again. | Delivery, Orders, Payment, Delivery_Partner | UI |
| FR-P4 | Send a GPS update. It updates the live location and adds a tracking event. | `partner_locations`, `order_tracking_events` | UI |
| FR-P5 | Earnings today, total earnings (derived) and delivery history | Delivery | UI |

## 5. Admin module

| ID | Requirement | Data used | Where |
|---|---|---|---|
| FR-A1 | Platform overview: orders, gross order value, commission earned, partners online | all | UI |
| FR-A2 | List orders that are waiting for a delivery partner | Orders, Delivery | UI, SQL |
| FR-A3 | For a waiting order, list candidate partners: same city, account ACTIVE, AVAILABLE, today's workload, and **distance from the restaurant using MongoDB `$geoNear`** (Key query 4) | Delivery_Partner, Delivery · `partner_locations` | UI, SQL |
| FR-A4 | Assign a partner in **one transaction with a row lock** (`SELECT … FOR UPDATE`), so two admins can't give the same partner two orders | Delivery, Delivery_Partner | UI, SQL |
| FR-A5 | Approve restaurants that are waiting for approval | Restaurant | UI |
| FR-A6 | Revenue by restaurant across the platform | Orders, Restaurant | UI, SQL |
| FR-A7 | Activity log and recent notifications | `activity_logs`, `notifications` | UI |
| FR-A8 | Suspend partners, block customers, change commission | Delivery_Partner, Customer, Restaurant | Phase 2 |

## 6. System requirements

| ID | Requirement | How |
|---|---|---|
| FR-S1 | Reject invalid data | PK, FK, UNIQUE, NOT NULL, CHECK, ENUM constraints |
| FR-S2 | The bill total always matches its parts | `total_amount` is a generated column |
| FR-S3 | Multi-step operations are all-or-nothing | transactions (`BEGIN … COMMIT / ROLLBACK`) |
| FR-S4 | MySQL is the source of truth. If MongoDB is down, ordering still works and only tracking, notifications and logs are skipped. | MongoDB writes happen after the MySQL commit, wrapped in try/catch |
| FR-S5 | No SQL injection | every query uses parameter placeholders (`?`) |

---

## 7. Non-functional requirements

| Area | Requirement |
|---|---|
| Performance | Key queries use indexes (Pincode.city, Restaurant.cuisine_type, Menu_Item(category, price), Orders(restaurant_id, order_time), Delivery_Partner(city, availability)) and a 2dsphere index in MongoDB |
| Consistency | ACID transactions; normalised schema (BCNF); a generated column for the total |
| Security | Passwords stored as hashes (SHA-256 in the demo data, bcrypt planned); parameterised queries; role-based screens |
| Usability | Clean, responsive web UI that works on laptop and mobile widths; clear order-status stepper |
| Availability | Live data (GPS, events) stays in MongoDB, so heavy writes don't slow down orders in MySQL |
| Maintainability | SQL scripts can be re-run to rebuild the database (`DROP DATABASE IF EXISTS`); the MongoDB script resets its collections |
