// INSERT a review. trg_review_before_insert allows it only for delivered
// orders; trg_review_after_insert refreshes the restaurant rating.
import { route, int, readJson, fail } from '@/lib/api';
import { query, one } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { loadOrderFor } from '@/lib/access';

export const POST = route(async (req, { params }) => {
  const s = await requireRole('customer');
  const id = int((await params).id, 'order');
  await loadOrderFor(s, id);
  const b = await readJson(req);
  if (await one('SELECT review_id FROM Review WHERE order_id = ?', [id])) fail(409, 'You have already rated this order');
  await query('INSERT INTO Review (order_id, food_rating, delivery_rating, comment) VALUES (?, ?, ?, ?)',
    [id, Number(b.food_rating), b.delivery_rating ? Number(b.delivery_rating) : null, b.comment ? String(b.comment).slice(0, 500) : null]);
  return { ok: true };
});
