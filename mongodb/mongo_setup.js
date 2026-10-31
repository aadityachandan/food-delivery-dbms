// =====================================================================
//  Smart Multi-Vendor Food Delivery & Logistics Management System
//  MongoDB (secondary database) - real-time tracking, notifications,
//  activity logs.   Run with:  mongosh mongo_setup.js
// =====================================================================
// MySQL keeps the transactional master data (orders, payments, ...).
// MongoDB keeps fast-changing / high-volume / flexible data and links
// back to MySQL through order_id, partner_id, customer_id, restaurant_id.

db = db.getSiblingDB("food_delivery");
db.dropDatabase();

const T = s => new Date(s + "+05:30");                 // IST timestamps
const pt = (lng, lat) => ({ type: "Point", coordinates: [lng, lat] });

// ---------------------------------------------------------------------
// 1. partner_locations : latest GPS position of every partner
//    (updated every few seconds by the partner app -> upsert)
// ---------------------------------------------------------------------
db.partner_locations.insertMany([
  { partner_id: 1,  city: "Bengaluru", availability: "AVAILABLE", location: pt(77.6200, 12.9350), updated_at: T("2026-10-25T13:39:40") },
  { partner_id: 2,  city: "Bengaluru", availability: "BUSY",      location: pt(77.6080, 12.9205), updated_at: T("2026-10-25T13:39:55"), current_order_id: 22 },
  { partner_id: 3,  city: "Bengaluru", availability: "AVAILABLE", location: pt(77.7300, 12.9800), updated_at: T("2026-10-25T13:39:30") },
  { partner_id: 4,  city: "Bengaluru", availability: "AVAILABLE", location: pt(77.5740, 12.9420), updated_at: T("2026-10-25T13:38:10") },
  { partner_id: 5,  city: "Bengaluru", availability: "OFFLINE",   location: pt(77.6400, 12.9780), updated_at: T("2026-10-24T22:10:00") },
  { partner_id: 6,  city: "Bengaluru", availability: "BUSY",      location: pt(77.6255, 12.9338), updated_at: T("2026-10-25T13:39:50"), current_order_id: 23 },
  { partner_id: 7,  city: "Bengaluru", availability: "AVAILABLE", location: pt(77.6100, 12.9160), updated_at: T("2026-10-25T13:39:05") },
  { partner_id: 9,  city: "Bengaluru", availability: "AVAILABLE", location: pt(77.7000, 12.9560), updated_at: T("2026-10-25T13:39:45") },
  { partner_id: 10, city: "Bengaluru", availability: "AVAILABLE", location: pt(77.6450, 12.9120), updated_at: T("2026-10-25T13:37:20") },
  { partner_id: 11, city: "Mysuru",    availability: "AVAILABLE", location: pt(76.6300, 12.3100), updated_at: T("2026-10-25T13:36:00") }
]);
db.partner_locations.createIndex({ location: "2dsphere" });
db.partner_locations.createIndex({ partner_id: 1 }, { unique: true });

// ---------------------------------------------------------------------
// 2. order_tracking_events : every status change of an order, with the
//    GPS point at that moment (append-only event stream)
// ---------------------------------------------------------------------
db.order_tracking_events.insertMany([
  // Order 22 : Pizza Piazza (HSR) -> Jayanagar, currently on the way
  { order_id: 22, status: "PLACED",     actor: "customer:1",   at: T("2026-10-25T12:40:00") },
  { order_id: 22, status: "ACCEPTED",   actor: "restaurant:4", at: T("2026-10-25T12:42:00"), eta_minutes: 35 },
  { order_id: 22, status: "ASSIGNED",   actor: "system",       at: T("2026-10-25T12:45:00"), partner_id: 2 },
  { order_id: 22, status: "READY",      actor: "restaurant:4", at: T("2026-10-25T13:02:00") },
  { order_id: 22, status: "PICKED_UP",  actor: "partner:2",    at: T("2026-10-25T13:05:00"), location: pt(77.6474, 12.9116) },
  { order_id: 22, status: "LOCATION",   actor: "partner:2",    at: T("2026-10-25T13:20:00"), location: pt(77.6250, 12.9150) },
  { order_id: 22, status: "LOCATION",   actor: "partner:2",    at: T("2026-10-25T13:39:55"), location: pt(77.6080, 12.9205), eta_minutes: 6 },
  // Order 23 : Sweet Tooth, being prepared
  { order_id: 23, status: "PLACED",     actor: "customer:2",   at: T("2026-10-25T13:05:00") },
  { order_id: 23, status: "ACCEPTED",   actor: "restaurant:9", at: T("2026-10-25T13:07:00"), eta_minutes: 25 },
  { order_id: 23, status: "ASSIGNED",   actor: "system",       at: T("2026-10-25T13:10:00"), partner_id: 6 },
  { order_id: 23, status: "PREPARING",  actor: "restaurant:9", at: T("2026-10-25T13:12:00") },
  // Order 24 : accepted, waiting for a partner
  { order_id: 24, status: "PLACED",     actor: "customer:5",   at: T("2026-10-25T13:20:00") },
  { order_id: 24, status: "ACCEPTED",   actor: "restaurant:6", at: T("2026-10-25T13:24:00"), eta_minutes: 40 },
  // Order 15 : cancelled by the restaurant
  { order_id: 15, status: "PLACED",     actor: "customer:5",   at: T("2026-10-17T13:10:00") },
  { order_id: 15, status: "CANCELLED",  actor: "restaurant:1", at: T("2026-10-17T13:18:00"), reason: "Mutton out of stock" }
]);
db.order_tracking_events.createIndex({ order_id: 1, at: 1 });

// ---------------------------------------------------------------------
// 3. notifications : push / SMS / e-mail sent to any user type
// ---------------------------------------------------------------------
db.notifications.insertMany([
  { user_type: "CUSTOMER",   user_id: 1, order_id: 22, channel: "PUSH",  title: "Order picked up",         body: "Ravi is on the way with your pizza.",          read: false, created_at: T("2026-10-25T13:05:10") },
  { user_type: "CUSTOMER",   user_id: 2, order_id: 23, channel: "PUSH",  title: "Order accepted",          body: "Sweet Tooth Desserts is preparing your order.", read: true,  created_at: T("2026-10-25T13:07:05") },
  { user_type: "CUSTOMER",   user_id: 5, order_id: 24, channel: "SMS",   title: "Order accepted",          body: "Green Bowl Salads accepted order #24.",        read: false, created_at: T("2026-10-25T13:24:05") },
  { user_type: "CUSTOMER",   user_id: 5, order_id: 15, channel: "EMAIL", title: "Order cancelled",         body: "Refund of Rs 714 initiated for order #15.",    read: true,  created_at: T("2026-10-17T13:19:00") },
  { user_type: "CUSTOMER",   user_id: 9, order_id: 20, channel: "PUSH",  title: "Payment failed",          body: "Your payment for order #20 failed.",           read: true,  created_at: T("2026-10-22T19:01:00") },
  { user_type: "CUSTOMER",   user_id: 3, order_id: 25, channel: "PUSH",  title: "Order placed",            body: "Dragon Wok has received your order.",          read: false, created_at: T("2026-10-25T13:30:10") },
  { user_type: "RESTAURANT", user_id: 6, order_id: 24, channel: "PUSH",  title: "New order #24",           body: "Grilled Chicken Bowl x1, Fruit Smoothie x1",   read: true,  created_at: T("2026-10-25T13:20:05") },
  { user_type: "RESTAURANT", user_id: 3, order_id: 25, channel: "PUSH",  title: "New order #25",           body: "Veg Hakka Noodles x2",                          read: false, created_at: T("2026-10-25T13:30:05") },
  { user_type: "RESTAURANT", user_id: 1, channel: "EMAIL", title: "Low stock alert",  body: "Mutton is at 0 kg (reorder level 10 kg).",  read: false, created_at: T("2026-10-25T09:00:30") },
  { user_type: "PARTNER",    user_id: 2, order_id: 22, channel: "PUSH",  title: "New delivery assigned",   body: "Pick up from Pizza Piazza, HSR Layout.",       read: true,  created_at: T("2026-10-25T12:45:05") },
  { user_type: "PARTNER",    user_id: 6, order_id: 23, channel: "PUSH",  title: "New delivery assigned",   body: "Pick up from Sweet Tooth, Koramangala.",       read: true,  created_at: T("2026-10-25T13:10:05") },
  { user_type: "ADMIN",      user_id: 2, channel: "EMAIL", title: "Restaurant awaiting approval", body: "Tandoor Tales (Mysuru) submitted documents.", read: false, created_at: T("2026-10-20T10:05:00") }
]);
db.notifications.createIndex({ user_type: 1, user_id: 1, created_at: -1 });

// ---------------------------------------------------------------------
// 4. activity_logs : audit trail of actions on the platform
//    (each action has different details -> flexible schema)
// ---------------------------------------------------------------------
db.activity_logs.insertMany([
  { actor: { type: "ADMIN", id: 2 },      action: "RESTAURANT_APPROVED", target: { restaurant_id: 9 },  at: T("2025-10-10T10:00:00") },
  { actor: { type: "ADMIN", id: 7 },      action: "PARTNER_SUSPENDED",   target: { partner_id: 8 },     details: { reason: "3 customer complaints" }, at: T("2026-09-30T11:00:00") },
  { actor: { type: "ADMIN", id: 4 },      action: "COMMISSION_CHANGED",  target: { restaurant_id: 10 }, details: { old_pct: 15, new_pct: 12 }, at: T("2026-03-01T12:00:00") },
  { actor: { type: "OWNER", id: 1 },      action: "ITEM_DISABLED",       target: { item_id: 2 },        details: { reason: "Out of mutton" }, at: T("2026-10-17T13:17:00") },
  { actor: { type: "OWNER", id: 7 },      action: "ITEM_DISABLED",       target: { item_id: 27 },       details: { reason: "Milk not delivered" }, at: T("2026-10-25T10:05:00") },
  { actor: { type: "OWNER", id: 4 },      action: "PRICE_UPDATED",       target: { item_id: 14 },       details: { old_price: 379, new_price: 399 }, at: T("2026-09-01T09:00:00") },
  { actor: { type: "CUSTOMER", id: 1 },   action: "LOGIN",               details: { device: "Android", ip: "49.207.x.x" }, at: T("2026-10-25T12:35:00") },
  { actor: { type: "CUSTOMER", id: 5 },   action: "COUPON_APPLIED",      target: { order_id: 15 },      details: { code: "BIRYANI20", discount: 80 }, at: T("2026-10-17T13:09:30") },
  { actor: { type: "CUSTOMER", id: 12 },  action: "ACCOUNT_BLOCKED",     details: { by_admin: 3, reason: "Repeated COD refusals" }, at: T("2026-10-01T15:00:00") },
  { actor: { type: "PARTNER", id: 2 },    action: "WENT_ONLINE",         details: { shift: "lunch" }, at: T("2026-10-25T11:30:00") },
  { actor: { type: "PARTNER", id: 3 },    action: "WENT_ONLINE",         details: { shift: "lunch" }, at: T("2026-10-25T11:45:00") },
  { actor: { type: "SYSTEM" },            action: "PAYMENT_FAILED",      target: { order_id: 20 },      details: { gateway: "Razorpay", error: "Card declined" }, at: T("2026-10-22T19:00:50") }
]);
db.activity_logs.createIndex({ "actor.type": 1, at: -1 });

// ---------------------------------------------------------------------
// Sample queries
// ---------------------------------------------------------------------
print("\nQ2: full tracking timeline of order 22:");
printjson(db.order_tracking_events.find({ order_id: 22 }, { _id: 0, status: 1, at: 1, eta_minutes: 1 }).sort({ at: 1 }).toArray());

print("\nQ2: live location of the partner carrying order 22:");
printjson(db.partner_locations.findOne({ current_order_id: 22 }, { _id: 0, partner_id: 1, location: 1, updated_at: 1 }));

print("\nQ4: nearest available partners within 5 km of Green Bowl Salads (order 24):");
printjson(db.partner_locations.aggregate([
  { $geoNear: { near: pt(77.7500, 12.9698), distanceField: "distance_m", maxDistance: 5000,
                query: { availability: "AVAILABLE" }, spherical: true } },
  { $project: { _id: 0, partner_id: 1, distance_km: { $round: [{ $divide: ["$distance_m", 1000] }, 2] } } }
]).toArray());

print("\nUnread notifications per user type:");
printjson(db.notifications.aggregate([
  { $match: { read: false } },
  { $group: { _id: "$user_type", unread: { $sum: 1 } } }
]).toArray());

print("\nDocument counts:");
["partner_locations", "order_tracking_events", "notifications", "activity_logs"].forEach(c =>
  print(`  ${c}: ${db.getCollection(c).countDocuments()}`));
