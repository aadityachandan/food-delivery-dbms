import { route, readJson, text } from '@/lib/api';
import { verifyLogin, createSession } from '@/lib/auth';
import { logActivity } from '@/lib/realtime';

export const POST = route(async req => {
  const b = await readJson(req);
  const user = await verifyLogin(b.role, text(b.email, 'Email', { max: 100 }).toLowerCase(), text(b.password, 'Password', { max: 100 }));
  await createSession(user);
  await logActivity({ type: user.role.toUpperCase(), id: user.id }, 'LOGIN');
  return user;
});
