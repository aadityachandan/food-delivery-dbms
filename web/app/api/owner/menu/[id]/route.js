import { route, int, readJson, fail } from '@/lib/api';
import { query, one } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { logActivity } from '@/lib/realtime';

async function ownedItem(s, id) {
  const m = await one(
    `SELECT m.item_id, m.name, m.price FROM Menu_Item m JOIN Restaurant r ON r.restaurant_id = m.restaurant_id
     WHERE m.item_id = ? AND r.owner_id = ?`, [id, s.id]);
  if (!m) fail(404, 'Item not found');
  return m;
}

// UPDATE availability and/or price
export const PATCH = route(async (req, { params }) => {
  const s = await requireRole('owner');
  const id = int((await params).id, 'item');
  const m = await ownedItem(s, id);
  const b = await readJson(req);
  if (b.is_available !== undefined) {
    await query('UPDATE Menu_Item SET is_available = ? WHERE item_id = ?', [!!b.is_available, id]);
    await logActivity({ type: 'OWNER', id: s.id }, b.is_available ? 'ITEM_ENABLED' : 'ITEM_DISABLED', { item_id: id }, { name: m.name });
  }
  if (b.price !== undefined) {
    await query('UPDATE Menu_Item SET price = ? WHERE item_id = ?', [Number(b.price), id]);
    await logActivity({ type: 'OWNER', id: s.id }, 'PRICE_UPDATED', { item_id: id }, { old_price: m.price, new_price: Number(b.price) });
  }
  return { ok: true };
});

// DELETE an item. Items that appear in past orders are protected by the
// foreign key from Order_Item (ON DELETE RESTRICT).
export const DELETE = route(async (req, { params }) => {
  const s = await requireRole('owner');
  const id = int((await params).id, 'item');
  const m = await ownedItem(s, id);
  await query('DELETE FROM Menu_Item WHERE item_id = ?', [id]);
  await logActivity({ type: 'OWNER', id: s.id }, 'ITEM_DELETED', { item_id: id }, { name: m.name });
  return { ok: true };
});
