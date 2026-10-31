import { route, readJson, text, fail } from '@/lib/api';
import { query, one } from '@/lib/db';
import { requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const GET = route(async () => {
  const s = await requireRole('customer');
  return query(
    `SELECT a.address_id, a.label, a.address_line, a.pincode, pc.city, a.is_default,
            (SELECT COUNT(*) FROM Orders o WHERE o.address_id = a.address_id) AS orders_count
     FROM Address a JOIN Pincode pc ON pc.pincode = a.pincode
     WHERE a.customer_id = ? ORDER BY a.is_default DESC, a.address_id`, [s.id]);
});

// INSERT a new saved address
export const POST = route(async req => {
  const s = await requireRole('customer');
  const b = await readJson(req);
  const label = ['HOME', 'WORK', 'OTHER'].includes(b.label) ? b.label : 'OTHER';
  const line = text(b.address_line, 'Address', { max: 200 });
  const pincode = text(b.pincode, 'Pincode', { max: 6 });
  const c = await one(
    `SELECT AVG(lat) AS lat, AVG(lng) AS lng FROM (
       SELECT latitude AS lat, longitude AS lng FROM Address WHERE pincode = ?
       UNION ALL SELECT latitude, longitude FROM Restaurant WHERE pincode = ?) p`, [pincode, pincode]);
  if (c.lat == null) fail(400, 'We do not deliver to this pincode yet');
  await query(
    'INSERT INTO Address (customer_id, label, address_line, pincode, latitude, longitude, is_default) VALUES (?, ?, ?, ?, ?, ?, FALSE)',
    [s.id, label, line, pincode, c.lat, c.lng]);
  return { ok: true };
});
