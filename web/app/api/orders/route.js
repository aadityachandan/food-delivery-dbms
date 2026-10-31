import { route, readJson, int, text } from '@/lib/api';
import { query, withConnection } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { trackEvent, notify, logActivity } from '@/lib/realtime';

export const dynamic = 'force-dynamic';

// Order history (uses the v_order_summary view)
export const GET = route(async () => {
  const s = await requireRole('customer');
  return query(
    `SELECT v.order_id, v.order_time, v.order_status, v.total_amount, v.restaurant_name, v.cuisine_type,
            v.payment_method, v.payment_status, v.delivery_status, v.review_id,
            (SELECT GROUP_CONCAT(CONCAT(m.name, ' x', oi.quantity) ORDER BY m.name SEPARATOR ', ')
             FROM Order_Item oi JOIN Menu_Item m ON m.item_id = oi.item_id WHERE oi.order_id = v.order_id) AS items
     FROM v_order_summary v WHERE v.customer_id = ? ORDER BY v.order_time DESC`, [s.id]);
});

// Place an order: the stored procedure sp_place_order does all checks and
// writes Orders + Order_Item + Payment in one transaction.
export const POST = route(async req => {
  const s = await requireRole('customer');
  const b = await readJson(req);
  const rid = int(b.restaurantId, 'restaurant');
  const aid = int(b.addressId, 'address');
  const items = (Array.isArray(b.items) ? b.items : []).map(i => ({ item_id: int(i.itemId, 'item'), qty: int(i.qty, 'quantity') }));
  const method = text(b.paymentMethod, 'Payment method', { max: 20 });
  const orderId = await withConnection(async conn => {
    await conn.query('CALL sp_place_order(?, ?, ?, ?, ?, ?, ?, @order_id)',
      [s.id, aid, rid, JSON.stringify(items), b.couponCode || null, method, b.instructions ? String(b.instructions).slice(0, 255) : null]);
    const [[row]] = await conn.query('SELECT @order_id AS id');
    return row.id;
  });
  const [o] = await query('SELECT restaurant_name, total_amount FROM v_order_summary WHERE order_id = ?', [orderId]);
  // after COMMIT: real-time data in MongoDB
  await trackEvent(orderId, 'PLACED', `customer:${s.id}`);
  await notify('CUSTOMER', s.id, 'Order placed', `${o.restaurant_name} has received order #${orderId}.`, orderId);
  await notify('RESTAURANT', rid, `New order #${orderId}`, `Rs ${o.total_amount} - please accept`, orderId);
  if (b.couponCode) await logActivity({ type: 'CUSTOMER', id: s.id }, 'COUPON_APPLIED', { order_id: orderId }, { code: String(b.couponCode).toUpperCase() });
  return { orderId };
});
