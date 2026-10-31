'use client';
// Customer: order history (from the v_order_summary view)
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, money, fmtTime, look, bannerStyle, Chip, payLabel, title } from '@/components/kit';
import { useApp, useRequireRole } from '@/components/Shell';

export default function Orders() {
  const user = useRequireRole('customer');
  const { toast } = useApp();
  const [rows, setRows] = useState(null);
  useEffect(() => { if (user) api('/orders').then(setRows).catch(e => toast(e.message, 'err')); }, [user, toast]);
  if (!user || !rows) return <div className="loading">Loading…</div>;
  return (
    <>
      <div className="section-title"><h1>My orders</h1><span className="muted">{rows.length} order{rows.length === 1 ? '' : 's'}</span></div>
      {rows.length ? (
        <div className="stack">{rows.map(o => (
          <Link key={o.order_id} className="card pad" href={`/customer/orders/${o.order_id}`}
            style={{ textDecoration: 'none', display: 'grid', gridTemplateColumns: '64px 1fr auto', gap: 16, alignItems: 'center' }}>
            <div className="banner" style={{ ...bannerStyle(o.cuisine_type), height: 64, borderRadius: 12, fontSize: 30 }}>{look(o.cuisine_type)[0]}</div>
            <div><div className="row"><h3>{o.restaurant_name}</h3><Chip s={o.order_status} /></div>
              <div className="small muted">#{o.order_id} · {fmtTime(o.order_time)} · {o.items}</div></div>
            <div style={{ textAlign: 'right' }}><b className="num">{money(o.total_amount)}</b>
              <div className="small muted">{payLabel(o.payment_method)} · {title(o.payment_status)}</div>
              {o.order_status === 'DELIVERED' && !o.review_id && <span className="chip amber">Rate order</span>}</div>
          </Link>))}
        </div>
      ) : <div className="empty card">No orders yet. <Link href="/customer">Find something to eat</Link>.</div>}
    </>
  );
}
