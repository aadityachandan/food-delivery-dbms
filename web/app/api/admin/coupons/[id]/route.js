import { route, int, readJson, fail } from '@/lib/api';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { logActivity } from '@/lib/realtime';

// UPDATE the status (ACTIVE / DISABLED / EXPIRED)
export const PATCH = route(async (req, { params }) => {
  const s = await requireRole('admin');
  const id = int((await params).id, 'coupon');
  const { status } = await readJson(req);
  if (!['ACTIVE', 'DISABLED', 'EXPIRED'].includes(status)) fail(400, 'Invalid status');
  const res = await query('UPDATE Coupon SET status = ? WHERE coupon_id = ?', [status, id]);
  if (!res.affectedRows) fail(404, 'Coupon not found');
  await logActivity({ type: 'ADMIN', id: s.id }, 'COUPON_STATUS', { coupon_id: id }, { status });
  return { ok: true };
});

// DELETE a coupon. If any order used it, the foreign key refuses.
export const DELETE = route(async (req, { params }) => {
  const s = await requireRole('admin');
  const id = int((await params).id, 'coupon');
  const res = await query('DELETE FROM Coupon WHERE coupon_id = ?', [id]);
  if (!res.affectedRows) fail(404, 'Coupon not found');
  await logActivity({ type: 'ADMIN', id: s.id }, 'COUPON_DELETED', { coupon_id: id });
  return { ok: true };
});
