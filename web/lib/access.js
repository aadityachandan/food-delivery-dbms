// Row-level authorization: who may see or change a given order.
import { one } from './db';
import { ApiError } from './api';

export async function loadOrderFor(session, orderId) {
  const o = await one(
    `SELECT o.order_id, o.order_status, o.restaurant_id, r.owner_id, r.name AS restaurant_name,
            a.customer_id, d.delivery_id, d.partner_id
     FROM Orders o
     JOIN Restaurant r ON r.restaurant_id = o.restaurant_id
     JOIN Address a    ON a.address_id = o.address_id
     LEFT JOIN Delivery d ON d.order_id = o.order_id
     WHERE o.order_id = ?`, [orderId]);
  if (!o) throw new ApiError(404, 'Order not found');
  const allowed =
    session.role === 'admin' ||
    (session.role === 'customer' && o.customer_id === session.id) ||
    (session.role === 'owner' && o.owner_id === session.id) ||
    (session.role === 'partner' && o.partner_id === session.id);
  if (!allowed) throw new ApiError(403, 'This order is not yours');
  return o;
}

export async function assertOwnsRestaurant(session, restaurantId) {
  const r = await one('SELECT restaurant_id, name FROM Restaurant WHERE restaurant_id = ? AND owner_id = ?', [restaurantId, session.id]);
  if (!r) throw new ApiError(403, 'This restaurant is not yours');
  return r;
}
