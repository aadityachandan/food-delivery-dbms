import { route } from '@/lib/api';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const GET = route(async () => {
  const cities = await query(
    'SELECT DISTINCT pc.city FROM Restaurant r JOIN Pincode pc ON pc.pincode = r.pincode ORDER BY pc.city');
  const cuisines = await query('SELECT DISTINCT cuisine_type FROM Restaurant ORDER BY cuisine_type');
  const pincodes = await query('SELECT pincode, city FROM Pincode ORDER BY city, pincode');
  return { cities: cities.map(c => c.city), cuisines: cuisines.map(c => c.cuisine_type), pincodes };
});
