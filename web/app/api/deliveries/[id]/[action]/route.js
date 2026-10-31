// Partner actions on a delivery: pickup, deliver, gps.
// pickup/deliver only UPDATE the Delivery row; the trigger
// trg_delivery_after_update moves the order, marks COD paid and frees the
// partner, and trg_orders_before_update blocks pickup before READY.
import { route, int, fail } from '@/lib/api';
import { query, one, mongo } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { trackEvent, notify, point, distanceKm } from '@/lib/realtime';

export const POST = route(async (req, { params }) => {
  const s = await requireRole('partner');
  const { id: rawId, action } = await params;
  const id = int(rawId, 'delivery');
  const d = await one(
    `SELECT d.*, o.order_status, a.customer_id, a.latitude AS address_lat, a.longitude AS address_lng,
            r.latitude AS restaurant_lat, r.longitude AS restaurant_lng, r.name AS restaurant_name
     FROM Delivery d JOIN Orders o ON o.order_id = d.order_id JOIN Address a ON a.address_id = o.address_id
     JOIN Restaurant r ON r.restaurant_id = o.restaurant_id WHERE d.delivery_id = ?`, [id]);
  if (!d) fail(404, 'Delivery not found');
  if (d.partner_id !== s.id) fail(403, 'This delivery is not yours');

  if (action === 'pickup') {
    if (d.delivery_status !== 'ASSIGNED') fail(400, 'This delivery was already picked up');
    if (d.order_status !== 'READY') fail(400, `The restaurant has not marked the order ready yet (it is ${d.order_status})`);
    await query("UPDATE Delivery SET delivery_status = 'PICKED_UP', picked_up_at = NOW() WHERE delivery_id = ?", [id]);
    const loc = point(d.restaurant_lat, d.restaurant_lng);
    await trackEvent(d.order_id, 'PICKED_UP', `partner:${s.id}`, { location: loc });
    await mongo(db => db.collection('partner_locations').updateOne(
      { partner_id: s.id }, { $set: { location: loc, updated_at: new Date() } }, { upsert: true }));
    await notify('CUSTOMER', d.customer_id, 'Order picked up', `Your order from ${d.restaurant_name} is on the way.`, d.order_id);
    return { ok: true };
  }

  if (action === 'deliver') {
    if (d.delivery_status !== 'PICKED_UP') fail(400, 'Pick up the order first');
    await query("UPDATE Delivery SET delivery_status = 'DELIVERED', delivered_at = NOW() WHERE delivery_id = ?", [id]);
    const loc = point(d.address_lat, d.address_lng);
    await trackEvent(d.order_id, 'DELIVERED', `partner:${s.id}`, { location: loc });
    await mongo(db => db.collection('partner_locations').updateOne(
      { partner_id: s.id },
      { $set: { location: loc, availability: 'AVAILABLE', updated_at: new Date() }, $unset: { current_order_id: '' } }));
    await notify('CUSTOMER', d.customer_id, 'Order delivered', 'Enjoy your meal! Tap to rate your order.', d.order_id);
    return { ok: true };
  }

  if (action === 'gps') {
    // simulated GPS ping: move part of the way to the next stop (MongoDB only)
    if (!['ASSIGNED', 'PICKED_UP'].includes(d.delivery_status)) fail(400, 'This delivery is finished');
    const toRestaurant = d.delivery_status === 'ASSIGNED';
    const target = toRestaurant ? [d.restaurant_lat, d.restaurant_lng] : [d.address_lat, d.address_lng];
    const current = await mongo(db => db.collection('partner_locations').findOne({ partner_id: s.id }), false);
    if (current === false) fail(503, 'MongoDB is not connected, so live location is unavailable');
    const [lng, lat] = current?.location?.coordinates || [target[1] + 0.02, target[0] + 0.02];
    const nLat = lat + (target[0] - lat) * 0.4, nLng = lng + (target[1] - lng) * 0.4;
    const eta = Math.max(1, Math.round(distanceKm(nLat, nLng, target[0], target[1]) / 20 * 60));
    const loc = point(nLat, nLng);
    await mongo(db => db.collection('partner_locations').updateOne(
      { partner_id: s.id }, { $set: { location: loc, updated_at: new Date(), current_order_id: d.order_id } }, { upsert: true }));
    await trackEvent(d.order_id, 'LOCATION', `partner:${s.id}`, { location: loc, eta_minutes: eta });
    return { ok: true, eta_minutes: eta, heading_to: toRestaurant ? 'restaurant' : 'customer' };
  }

  fail(404, 'Unknown action');
});
