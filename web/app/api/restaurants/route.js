// Key query 1: restaurants and dishes that match the customer's filters.
// The search box uses MySQL FULL-TEXT search (MATCH ... AGAINST) over
// restaurant name/cuisine and dish name/description.
import { route } from '@/lib/api';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function fullTextTerms(q) {
  const words = (q || '').toLowerCase().match(/[a-z0-9]+/g) || [];
  return words.filter(w => w.length >= 3).map(w => `${w}*`).join(' ');
}

export const GET = route(async req => {
  await requireRole('customer', 'admin', 'owner', 'partner');
  const p = new URL(req.url).searchParams;
  const itemConds = ['m.is_available = TRUE'];
  const itemParams = [];
  if (p.get('maxPrice')) { itemConds.push('m.price <= ?'); itemParams.push(Number(p.get('maxPrice'))); }
  if (p.get('veg') === '1') itemConds.push('m.is_veg = TRUE');

  const where = ["r.status IN ('OPEN','CLOSED')"];
  const params = [];
  if (p.get('city')) { where.push('pc.city = ?'); params.push(p.get('city')); }
  if (p.get('cuisine')) { where.push('r.cuisine_type = ?'); params.push(p.get('cuisine')); }
  if (p.get('minRating')) { where.push('r.rating >= ?'); params.push(Number(p.get('minRating'))); }

  const terms = fullTextTerms(p.get('q'));
  let matchSelect = 'NULL AS matched_dishes';
  const matchParams = [];
  if (terms) {
    where.push(`(MATCH(r.name, r.cuisine_type) AGAINST (? IN BOOLEAN MODE)
                 OR EXISTS (SELECT 1 FROM Menu_Item mx WHERE mx.restaurant_id = r.restaurant_id
                            AND MATCH(mx.name, mx.description) AGAINST (? IN BOOLEAN MODE)))`);
    params.push(terms, terms);
    matchSelect = `(SELECT GROUP_CONCAT(mx.name ORDER BY mx.name SEPARATOR ', ') FROM Menu_Item mx
                    WHERE mx.restaurant_id = r.restaurant_id AND MATCH(mx.name, mx.description) AGAINST (? IN BOOLEAN MODE)) AS matched_dishes`;
    matchParams.push(terms);
  } else if (p.get('q')) {
    where.push('r.name LIKE ?');
    params.push(`%${p.get('q')}%`);
  }

  return query(
    `SELECT r.restaurant_id, r.name, r.cuisine_type, r.rating, r.address_line, pc.city,
            TIME_FORMAT(r.opening_time, '%H:%i') AS opening_time, TIME_FORMAT(r.closing_time, '%H:%i') AS closing_time,
            (r.status = 'OPEN' AND CURTIME() BETWEEN r.opening_time AND r.closing_time) AS is_open_now,
            COUNT(m.item_id) AS matching_items, MIN(m.price) AS from_price, ${matchSelect}
     FROM Restaurant r
     JOIN Pincode pc  ON pc.pincode = r.pincode
     JOIN Menu_Item m ON m.restaurant_id = r.restaurant_id AND ${itemConds.join(' AND ')}
     WHERE ${where.join(' AND ')}
     GROUP BY r.restaurant_id, r.name, r.cuisine_type, r.rating, r.address_line, pc.city, r.opening_time, r.closing_time, r.status
     ${p.get('openNow') === '1' ? 'HAVING is_open_now = 1' : ''}
     ORDER BY is_open_now DESC, r.rating DESC`,
    [...matchParams, ...itemParams, ...params]);
});
