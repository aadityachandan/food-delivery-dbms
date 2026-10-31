import { route, readJson, fail } from '@/lib/api';
import { transaction, mongo } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { logActivity } from '@/lib/realtime';

export const POST = route(async req => {
  const s = await requireRole('partner');
  const { availability } = await readJson(req);
  if (!['AVAILABLE', 'OFFLINE'].includes(availability)) fail(400, 'Availability must be AVAILABLE or OFFLINE');
  await transaction(async conn => {
    const [[p]] = await conn.query('SELECT availability, account_status FROM Delivery_Partner WHERE partner_id = ? FOR UPDATE', [s.id]);
    if (p.account_status !== 'ACTIVE') fail(403, `Your account is ${p.account_status.toLowerCase()}; an admin must verify it first`);
    if (p.availability === 'BUSY') fail(400, 'Finish the current delivery first');
    await conn.query('UPDATE Delivery_Partner SET availability = ? WHERE partner_id = ?', [availability, s.id]);
  });
  await mongo(db => db.collection('partner_locations').updateOne(
    { partner_id: s.id }, { $set: { availability, updated_at: new Date() } }));
  await logActivity({ type: 'PARTNER', id: s.id }, availability === 'AVAILABLE' ? 'WENT_ONLINE' : 'WENT_OFFLINE');
  return { ok: true };
});
