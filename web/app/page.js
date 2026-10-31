'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp, HOME } from '@/components/Shell';

export default function Home() {
  const { user, ready } = useApp();
  const router = useRouter();
  useEffect(() => { if (ready) router.replace(user ? HOME[user.role] : '/login'); }, [ready, user, router]);
  return <div className="loading">Loading…</div>;
}
