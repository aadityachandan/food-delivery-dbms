// Assign a partner with the stored procedure sp_assign_partner
// (transaction + SELECT ... FOR UPDATE row locks).
import { route, int, readJson } from '@/lib/api';
import { query, one, mongo } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { trackEvent, notify, logActivity } from '@/lib/realtime';

export const POST = route(async (req, { params }) => {
  const s = await requireRole('admin');
  const id = int((await params).id, 'order');
  const pid = int((await readJson(req)).partnerId, 'partner');
  await query('CALL sp_assign_partner(?, ?)', [id, pid]);
  const info = await one(
    `SELECT v.customer_id, v.restaurant_name, v.partner_name FROM v_order_summary v WHERE v.order_id = ?`, [id]);
  await trackEvent(id, 'ASSIGNED', `admin:${s.id}`, { partner_id: pid });
  await mongo(db => db.collection('partner_locations').updateOne(
    { partner_id: pid }, { $set: { availability: 'BUSY', current_order_id: id, updated_at: new Date() } }));
  await notify('PARTNER', pid, 'New delivery assigned', `Pick up order #${id} from ${info.restaurant_name}.`, id);
  await notify('CUSTOMER', info.customer_id, 'Delivery partner assigned', `${info.partner_name} will deliver your order.`, id);
  await logActivity({ type: 'ADMIN', id: s.id }, 'ORDER_ASSIGNED', { order_id: id }, { partner_id: pid });
  return { ok: true };
});
