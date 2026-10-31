import { route, int, readJson, fail, text } from '@/lib/api';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { assertOwnsRestaurant } from '@/lib/access';

// UPDATE the stock of one ingredient (weak entity: key = restaurant + ingredient)
export const PATCH = route(async req => {
  const s = await requireRole('owner');
  const b = await readJson(req);
  const rid = int(b.restaurantId, 'restaurant');
  await assertOwnsRestaurant(s, rid);
  const res = await query('UPDATE Inventory SET quantity = ? WHERE restaurant_id = ? AND ingredient_name = ?',
    [Number(b.quantity), rid, text(b.ingredient_name, 'Ingredient', { max: 60 })]);
  if (!res.affectedRows) fail(404, 'Ingredient not found');
  return { ok: true };
});
