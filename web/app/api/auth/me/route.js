import { route, fail } from '@/lib/api';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const GET = route(async () => (await getSession()) || fail(401, 'Not logged in'));
