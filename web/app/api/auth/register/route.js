// Customer sign-up: Customer + first Address in one transaction.
import { route, readJson, text, fail } from '@/lib/api';
import { transaction } from '@/lib/db';
import { hashPassword, createSession } from '@/lib/auth';
import { logActivity } from '@/lib/realtime';

export const POST = route(async req => {
  const b = await readJson(req);
  const name = text(b.full_name, 'Name', { max: 100 });
  const email = text(b.email, 'Email', { max: 100 }).toLowerCase();
  const phone = text(b.phone, 'Phone', { max: 15 });
  const password = text(b.password, 'Password', { max: 100 });
  const line = text(b.address_line, 'Address', { max: 200 });
  const pincode = text(b.pincode, 'Pincode', { max: 6 });
  if (!/^\S+@\S+\.\S+$/.test(email)) fail(400, 'Enter a valid email');
  if (!/^[6-9]\d{9}$/.test(phone)) fail(400, 'Enter a valid 10-digit mobile number');
  if (password.length < 8) fail(400, 'Password must be at least 8 characters');
  const hash = await hashPassword(password);

  const id = await transaction(async conn => {
    // place the address at the centre of known points in that pincode
    const [[c]] = await conn.query(
      `SELECT AVG(lat) AS lat, AVG(lng) AS lng FROM (
         SELECT latitude AS lat, longitude AS lng FROM Address WHERE pincode = ?
         UNION ALL SELECT latitude, longitude FROM Restaurant WHERE pincode = ?) p`, [pincode, pincode]);
    if (c.lat == null) fail(400, 'We do not deliver to this pincode yet');
    const [ins] = await conn.query(
      'INSERT INTO Customer (full_name, email, phone, password_hash) VALUES (?, ?, ?, ?)', [name, email, phone, hash]);
    await conn.query(
      `INSERT INTO Address (customer_id, label, address_line, pincode, latitude, longitude, is_default)
       VALUES (?, 'HOME', ?, ?, ?, ?, TRUE)`, [ins.insertId, line, pincode, c.lat, c.lng]);
    return ins.insertId;
  });
  const user = { role: 'customer', id, name };
  await createSession(user);
  await logActivity({ type: 'CUSTOMER', id }, 'SIGNED_UP');
  return user;
});
