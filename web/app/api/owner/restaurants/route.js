import { route } from '@/lib/api';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const GET = route(async () => {
  const s = await requireRole('owner');
  return query(
    `SELECT r.restaurant_id, r.name, r.status, pc.city FROM Restaurant r JOIN Pincode pc ON pc.pincode = r.pincode
     WHERE r.owner_id = ? ORDER BY r.restaurant_id`, [s.id]);
});
