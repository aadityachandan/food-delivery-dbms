// INSERT a new menu item (UNIQUE (restaurant_id, name) and CHECK (price > 0)
// are enforced by MySQL)
import { route, int, readJson, text } from '@/lib/api';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { assertOwnsRestaurant } from '@/lib/access';
import { logActivity } from '@/lib/realtime';

export const POST = route(async req => {
  const s = await requireRole('owner');
  const b = await readJson(req);
  const rid = int(b.restaurantId, 'restaurant');
  await assertOwnsRestaurant(s, rid);
  const name = text(b.name, 'Item name', { max: 100 });
  const res = await query(
    `INSERT INTO Menu_Item (restaurant_id, name, description, category, price, is_veg, is_available)
     VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
    [rid, name, text(b.description, 'Description', { max: 255, required: false }) || null,
     text(b.category, 'Category', { max: 50 }), Number(b.price), !!b.is_veg]);
  await logActivity({ type: 'OWNER', id: s.id }, 'ITEM_ADDED', { item_id: res.insertId }, { name, price: Number(b.price) });
  return { itemId: res.insertId };
});
