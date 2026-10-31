import { route, int, fail } from '@/lib/api';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { logActivity } from '@/lib/realtime';

export const POST = route(async (req, { params }) => {
  const s = await requireRole('admin');
  const id = int((await params).id, 'restaurant');
  const res = await query(
    "UPDATE Restaurant SET status = 'OPEN', approved_by = ? WHERE restaurant_id = ? AND status = 'PENDING_APPROVAL'", [s.id, id]);
  if (!res.affectedRows) fail(400, 'Restaurant is not waiting for approval');
  await logActivity({ type: 'ADMIN', id: s.id }, 'RESTAURANT_APPROVED', { restaurant_id: id });
  return { ok: true };
});
