// Key query 4: available partners (MySQL) ranked by distance (MongoDB $geoNear)
import { route, int, fail, round2 } from '@/lib/api';
import { query, one, mongo } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { point, distanceKm } from '@/lib/realtime';

export const dynamic = 'force-dynamic';

export const GET = route(async (req, { params }) => {
  await requireRole('admin');
  const id = int((await params).id, 'order');
  const o = await one(
    `SELECT o.order_id, r.name AS restaurant_name, r.latitude, r.longitude, pc.city,
            a.latitude AS address_lat, a.longitude AS address_lng
     FROM Orders o JOIN Restaurant r ON r.restaurant_id = o.restaurant_id JOIN Pincode pc ON pc.pincode = r.pincode
     JOIN Address a ON a.address_id = o.address_id WHERE o.order_id = ?`, [id]);
  if (!o) fail(404, 'Order not found');
  const candidates = await query(
    `SELECT dp.partner_id, dp.full_name, dp.vehicle_type, dp.rating,
            COUNT(d.delivery_id) AS deliveries_today, COALESCE(SUM(d.partner_earning), 0) AS earned_today
     FROM Delivery_Partner dp
     LEFT JOIN Delivery d ON d.partner_id = dp.partner_id AND DATE(d.assigned_at) = CURDATE()
     WHERE dp.city = ? AND dp.account_status = 'ACTIVE' AND dp.availability = 'AVAILABLE'
     GROUP BY dp.partner_id, dp.full_name, dp.vehicle_type, dp.rating`, [o.city]);
  const near = await mongo(db => db.collection('partner_locations').aggregate([
    { $geoNear: { near: point(o.latitude, o.longitude), distanceField: 'distance_m', spherical: true,
                  query: { partner_id: { $in: candidates.map(c => c.partner_id) } } } },
    { $project: { _id: 0, partner_id: 1, distance_m: 1 } },
  ]).toArray(), []);
  const dist = new Map(near.map(n => [n.partner_id, Math.round(n.distance_m / 10) / 100]));
  const ranked = candidates.map(c => ({ ...c, distance_km: dist.has(c.partner_id) ? dist.get(c.partner_id) : null }))
    .sort((a, b) => (a.distance_km ?? 1e9) - (b.distance_km ?? 1e9) || a.deliveries_today - b.deliveries_today || b.rating - a.rating);
  const tripKm = round2(Math.max(0.3, distanceKm(o.latitude, o.longitude, o.address_lat, o.address_lng) * 1.3));
  return { order: o, tripKm, earning: round2(25 + 8 * tripKm), candidates: ranked, usedMongo: near.length > 0 };
});
