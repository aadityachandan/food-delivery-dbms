// Change an order's status. The trigger trg_orders_before_update enforces
// the allowed path; trg_orders_after_update refunds and frees the partner
// when an order is cancelled.
import { route, int, readJson, fail } from '@/lib/api';
import { query, mongo } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { loadOrderFor } from '@/lib/access';
import { trackEvent, notify } from '@/lib/realtime';

const ALLOWED = { customer: ['CANCELLED'], owner: ['ACCEPTED', 'PREPARING', 'READY', 'CANCELLED'] };
const MESSAGES = {
  ACCEPTED: r => `${r} accepted your order.`,
  PREPARING: r => `${r} is preparing your food.`,
  READY: () => 'Your food is packed and waiting for pickup.',
  CANCELLED: () => 'Your order was cancelled. Any payment will be refunded.',
};

export const POST = route(async (req, { params }) => {
  const s = await requireRole('customer', 'owner');
  const id = int((await params).id, 'order');
  const { status } = await readJson(req);
  if (!ALLOWED[s.role].includes(status)) fail(403, 'Your role cannot set this status');
  const o = await loadOrderFor(s, id);
  if (s.role === 'customer' && o.order_status !== 'PLACED') fail(400, 'You can cancel only before the restaurant accepts the order');

  await query('UPDATE Orders SET order_status = ? WHERE order_id = ?', [status, id]);

  await trackEvent(id, status, `${s.role === 'customer' ? 'customer' : 'restaurant'}:${s.role === 'customer' ? s.id : o.restaurant_id}`);
  await notify('CUSTOMER', o.customer_id, `Order #${id}: ${status.toLowerCase()}`, MESSAGES[status](o.restaurant_name), id);
  if (status === 'CANCELLED' && o.partner_id) {
    await notify('PARTNER', o.partner_id, `Order #${id} cancelled`, 'You are free for a new delivery.', id);
    await mongo(db => db.collection('partner_locations').updateOne(
      { partner_id: o.partner_id }, { $set: { availability: 'AVAILABLE' }, $unset: { current_order_id: '' } }));
  }
  return { ok: true };
});
