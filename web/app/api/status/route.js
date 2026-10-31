import { status } from '@/lib/db';
import { route } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const GET = route(() => status());
