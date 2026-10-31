import { route, int, fail } from '@/lib/api';
import { query, transaction } from '@/lib/db';
import { requireRole } from '@/lib/auth';

// DELETE an address. If past orders use it, the foreign key
// (ON DELETE RESTRICT) refuses and the user sees why.
export const DELETE = route(async (req, { params }) => {
  const s = await requireRole('customer');
  const id = int((await params).id, 'address');
  const res = await query('DELETE FROM Address WHERE address_id = ? AND customer_id = ?', [id, s.id]);
  if (!res.affectedRows) fail(404, 'Address not found');
  return { ok: true };
});

// UPDATE: make this the default address (one transaction, two updates)
export const PATCH = route(async (req, { params }) => {
  const s = await requireRole('customer');
  const id = int((await params).id, 'address');
  await transaction(async conn => {
    const [res] = await conn.query('UPDATE Address SET is_default = TRUE WHERE address_id = ? AND customer_id = ?', [id, s.id]);
    if (!res.affectedRows) fail(404, 'Address not found');
    await conn.query('UPDATE Address SET is_default = FALSE WHERE customer_id = ? AND address_id <> ?', [s.id, id]);
  });
  return { ok: true };
});
