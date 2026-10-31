import { route } from '@/lib/api';
import { query, one, mongo } from '@/lib/db';
import { requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const GET = route(async () => {
  const s = await requireRole('partner');
  const id = s.id;
  // total_earnings / deliveries_done come from the v_partner_stats view
  const partner = await one(
    `SELECT dp.partner_id, dp.full_name, dp.phone, dp.vehicle_type, dp.vehicle_number, dp.city, dp.availability,
            dp.rating, dp.account_status, v.deliveries_done AS total_deliveries, v.total_earnings, v.avg_minutes
     FROM Delivery_Partner dp JOIN v_partner_stats v ON v.partner_id = dp.partner_id WHERE dp.partner_id = ?`, [id]);
  const today = await one(
    `SELECT COUNT(*) AS deliveries, COALESCE(SUM(partner_earning), 0) AS earnings
     FROM Delivery WHERE partner_id = ? AND delivery_status = 'DELIVERED' AND DATE(delivered_at) = CURDATE()`, [id]);
  const active = await one(
    `SELECT d.delivery_id, d.order_id, d.delivery_status, d.assigned_at, d.picked_up_at, d.distance_km, d.partner_earning,
            o.order_status, o.total_amount, o.special_instructions,
            r.name AS restaurant_name, r.address_line AS restaurant_address, r.latitude AS restaurant_lat, r.longitude AS restaurant_lng,
            c.full_name AS customer_name, c.phone AS customer_phone,
            a.address_line, apc.city AS address_city, a.latitude AS address_lat, a.longitude AS address_lng,
            p.method AS payment_method, p.payment_status
     FROM Delivery d
     JOIN Orders o     ON o.order_id = d.order_id
     JOIN Restaurant r ON r.restaurant_id = o.restaurant_id
     JOIN Address a    ON a.address_id = o.address_id
     JOIN Pincode apc  ON apc.pincode = a.pincode
     JOIN Customer c   ON c.customer_id = a.customer_id
     LEFT JOIN Payment p ON p.order_id = o.order_id
     WHERE d.partner_id = ? AND d.delivery_status IN ('ASSIGNED', 'PICKED_UP')
     ORDER BY d.assigned_at LIMIT 1`, [id]);
  const activeItems = active
    ? await query('SELECT m.name, oi.quantity FROM Order_Item oi JOIN Menu_Item m ON m.item_id = oi.item_id WHERE oi.order_id = ?', [active.order_id])
    : [];
  const history = await query(
    `SELECT d.order_id, r.name AS restaurant_name, d.distance_km, d.partner_earning, d.delivered_at
     FROM Delivery d JOIN Orders o ON o.order_id = d.order_id JOIN Restaurant r ON r.restaurant_id = o.restaurant_id
     WHERE d.partner_id = ? AND d.delivery_status = 'DELIVERED' ORDER BY d.delivered_at DESC LIMIT 10`, [id]);
  const location = await mongo(db => db.collection('partner_locations').findOne({ partner_id: id }, { projection: { _id: 0 } }));
  return { partner, today, active, activeItems, history, location };
});
