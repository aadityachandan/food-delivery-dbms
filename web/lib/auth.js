// Login sessions: a signed JWT in an httpOnly cookie. Passwords are checked
// against bcrypt hashes stored in MySQL (never in plain text).
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { one, query } from './db';
import { ApiError } from './api';

const COOKIE = 'fh_session';

// role -> table that stores its users
export const ROLES = {
  customer: { table: 'Customer', id: 'customer_id', active: "status = 'ACTIVE'", label: 'Customer' },
  owner: { table: 'Restaurant_Owner', id: 'owner_id', active: "status = 'ACTIVE'", label: 'Restaurant owner' },
  partner: { table: 'Delivery_Partner', id: 'partner_id', active: "account_status <> 'SUSPENDED'", label: 'Delivery partner' },
  admin: { table: 'Admin', id: 'admin_id', active: '1 = 1', label: 'Admin' },
};

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) throw new ApiError(500, 'JWT_SECRET is not set in web/.env.local');
  return new TextEncoder().encode(s);
}

export async function verifyLogin(role, email, password) {
  const r = ROLES[role];
  if (!r) throw new ApiError(400, 'Choose a role');
  const user = await one(
    `SELECT ${r.id} AS id, full_name, password_hash, ${r.active} AS is_active FROM ${r.table} WHERE email = ?`, [email]);
  // same message for unknown email and wrong password
  if (!user || !user.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
    throw new ApiError(401, 'Wrong email or password');
  }
  if (!user.is_active) throw new ApiError(403, 'This account is blocked or suspended');
  await query(`UPDATE ${r.table} SET last_login = NOW() WHERE ${r.id} = ?`, [user.id]);
  return { role, id: user.id, name: user.full_name };
}

export const hashPassword = pw => bcrypt.hash(pw, 10);

export async function createSession(user) {
  const token = await new SignJWT({ role: user.role, id: user.id, name: user.name })
    .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('8h').sign(secret());
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 8 * 3600 });
}

export async function getSession() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try { return (await jwtVerify(token, secret())).payload; } catch { return null; }
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}

// Authorization: every API route calls this with the roles it allows
export async function requireRole(...roles) {
  const s = await getSession();
  if (!s) throw new ApiError(401, 'Please log in');
  if (!roles.includes(s.role)) throw new ApiError(403, 'Your role cannot do this');
  return s;
}
