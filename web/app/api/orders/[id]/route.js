// Key query 2: track an order (MySQL snapshot + MongoDB timeline and live location)
import { route, int } from '@/lib/api';
import { query, one, mongo } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { loadOrderFor } from '@/lib/access';

export const dynamic = 'force-dynamic';

export const GET = route(async (req, { params }) => {
  const s = await requireRole('customer', 'owner', 'partner', 'admin');
  const id = int((await params).id, 'order');
  await loadOrderFor(s, id);
  const order = await one(
    `SELECT o.*, c.customer_id, c.full_name AS customer_name, c.phone AS customer_phone,
            a.address_line, apc.city AS address_city, a.latitude AS address_lat, a.longitude AS address_lng, a.label AS address_label,
            r.name AS restaurant_name, r.address_line AS restaurant_address, r.latitude AS restaurant_lat, r.longitude AS restaurant_lng,
            cp.code AS coupon_code, p.method AS payment_method, p.payment_status, p.transaction_ref, p.paid_at,
            d.delivery_id, d.delivery_status, d.assigned_at, d.picked_up_at, d.delivered_at, d.distance_km,
            dp.partner_id, dp.full_name AS partner_name, dp.phone AS partner_phone, dp.vehicle_type, dp.vehicle_number, dp.rating AS partner_rating,
            rv.review_id, rv.food_rating, rv.delivery_rating, rv.comment AS review_comment
     FROM Orders o
     JOIN Address a      ON a.address_id = o.address_id
     JOIN Pincode apc    ON apc.pincode = a.pincode
     JOIN Customer c     ON c.customer_id = a.customer_id
     JOIN Restaurant r   ON r.restaurant_id = o.restaurant_id
     LEFT JOIN Coupon cp ON cp.coupon_id = o.coupon_id
     LEFT JOIN Payment p ON p.order_id = o.order_id
     LEFT JOIN Delivery d ON d.order_id = o.order_id
     LEFT JOIN Delivery_Partner dp ON dp.partner_id = d.partner_id
     LEFT JOIN Review rv ON rv.order_id = o.order_id
     WHERE o.order_id = ?`, [id]);
  const items = await query(
    `SELECT m.name, m.is_veg, oi.quantity, oi.unit_price, oi.quantity * oi.unit_price AS line_total
     FROM Order_Item oi JOIN Menu_Item m ON m.item_id = oi.item_id WHERE oi.order_id = ?`, [id]);
  const events = await mongo(db => db.collection('order_tracking_events')
    .find({ order_id: id }, { projection: { _id: 0 } }).sort({ at: 1 }).toArray(), null);
  const location = order.partner_id && !['DELIVERED', 'FAILED'].includes(order.delivery_status)
    ? await mongo(db => db.collection('partner_locations').findOne({ partner_id: order.partner_id }, { projection: { _id: 0 } }))
    : null;
  return { order, items, events, location };
});
