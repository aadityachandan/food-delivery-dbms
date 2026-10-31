'use client';
// Customer: live order tracking (key query 2: MySQL + MongoDB)
import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api, money, fmtTime, fmtClock, Chip, Src, Veg, payLabel, title } from '@/components/kit';
import MapView from '@/components/MapView';
import { useApp, useRequireRole } from '@/components/Shell';

const STEPS = [['PLACED', 'Placed'], ['ACCEPTED', 'Accepted'], ['PREPARING', 'Preparing'], ['READY', 'Ready'], ['PICKED_UP', 'On the way'], ['DELIVERED', 'Delivered']];
const EVENT_TEXT = {
  PLACED: 'Order placed', ACCEPTED: 'Restaurant accepted the order', PREPARING: 'Food is being prepared', READY: 'Packed and ready for pickup',
  ASSIGNED: 'Delivery partner assigned', PICKED_UP: 'Picked up from the restaurant', LOCATION: 'Live location update',
  DELIVERED: 'Delivered', CANCELLED: 'Order cancelled',
};

function Stepper({ status }) {
  if (status === 'CANCELLED') return <div className="notice red">This order was cancelled. Any payment has been refunded.</div>;
  const idx = STEPS.findIndex(s => s[0] === status);
  return (
    <div className="stepper-track">{STEPS.map(([, label], i) => {
      const done = i < idx || status === 'DELIVERED';
      return <div key={label} className={`step ${done ? 'done' : i === idx ? 'current' : ''}`}><span className="circle">{done ? '✓' : i + 1}</span>{label}</div>;
    })}</div>
  );
}

function Review({ id, onDone }) {
  const { toast } = useApp();
  const [food, setFood] = useState(0), [delivery, setDelivery] = useState(0), [comment, setComment] = useState('');
  const Stars = ({ value, set, label }) => (
    <span className="stars" aria-label={label}>{[1, 2, 3, 4, 5].map(n =>
      <button type="button" key={n} className={n <= value ? 'on' : ''} onClick={() => set(n)} aria-label={`${n} star`}>★</button>)}</span>
  );
  async function submit() {
    if (!food) return toast('Pick a food rating', 'err');
    try { await api(`/orders/${id}/review`, { method: 'POST', body: { food_rating: food, delivery_rating: delivery || null, comment } }); toast('Thanks for rating!'); onDone(); }
    catch (e) { toast(e.message, 'err'); }
  }
  return (
    <div className="card pad stack"><h3>Rate this order</h3>
      <div className="row between"><span>Food</span><Stars value={food} set={setFood} label="Food rating" /></div>
      <div className="row between"><span>Delivery</span><Stars value={delivery} set={setDelivery} label="Delivery rating" /></div>
      <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Tell others what you liked" maxLength={500} />
      <button className="btn primary" onClick={submit}>Submit rating</button>
      <div className="small muted">Saving a review fires a trigger that recalculates the restaurant’s rating.</div>
    </div>
  );
}

export default function OrderPage({ params }) {
  const { id } = use(params);
  const user = useRequireRole('customer');
  const { toast } = useApp();
  const [d, setD] = useState(null);
  const load = useCallback(() => api('/orders/' + id).then(setD).catch(e => toast(e.message, 'err')), [id, toast]);

  useEffect(() => { if (user) load(); }, [user, load]);
  const live = d && !['DELIVERED', 'CANCELLED'].includes(d.order.order_status);
  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => { if (!document.hidden) load(); }, 5000);
    return () => clearInterval(t);
  }, [live, load]);

  if (!user || !d) return <div className="loading">Loading…</div>;
  const { order: o, items, events, location } = d;
  const timeline = events ? events.map(e => ({
    at: e.at, text: EVENT_TEXT[e.status] || title(e.status),
    extra: e.reason || (e.eta_minutes ? `ETA ${e.eta_minutes} min` : '') || (e.status === 'ASSIGNED' && e.partner_id ? `partner #${e.partner_id}` : ''),
  })) : [
    { at: o.order_time, text: 'Order placed' }, { at: o.paid_at, text: `Payment ${title(o.payment_status)}` },
    { at: o.assigned_at, text: 'Delivery partner assigned' }, { at: o.picked_up_at, text: 'Picked up' }, { at: o.delivered_at, text: 'Delivered' },
  ].filter(e => e.at);
  const loc = location?.location?.coordinates;

  async function cancel() {
    if (!confirm('Cancel this order?')) return;
    try { await api(`/orders/${id}/status`, { method: 'POST', body: { status: 'CANCELLED' } }); toast('Order cancelled'); load(); }
    catch (e) { toast(e.message, 'err'); }
  }

  return (
    <div className="stack">
      <Link href="/customer/orders" className="muted small">← My orders</Link>
      <div className="row between">
        <div><h1>Order #{o.order_id}</h1><div className="muted">{o.restaurant_name} · placed {fmtTime(o.order_time)}</div></div>
        <div className="row"><Chip s={o.order_status} />
          {o.order_status === 'PLACED' && <button className="btn danger" onClick={cancel}>Cancel order</button>}
          <button className="btn" onClick={load}>Refresh</button></div>
      </div>
      <div className="card pad"><Stepper status={o.order_status} /></div>
      <div className="track-layout">
        <div className="stack">
          <div className="card pad">
            <div className="row between" style={{ marginBottom: 8 }}><h3>Live tracking</h3><Src db="MongoDB" /></div>
            <MapView restaurant={{ lat: o.restaurant_lat, lng: o.restaurant_lng }} home={{ lat: o.address_lat, lng: o.address_lng }}
              partner={loc ? { lat: loc[1], lng: loc[0] } : null} />
            <div className="small muted" style={{ marginTop: 8 }}>
              {loc ? `Partner last seen ${fmtTime(location.updated_at)}` : o.partner_id ? 'Live location appears once the partner shares GPS.' : 'A delivery partner will be assigned soon.'}
            </div>
          </div>
          <div className="card pad">
            <div className="row between" style={{ marginBottom: 8 }}><h3>Timeline</h3><Src db={events ? 'MongoDB' : 'MySQL'} /></div>
            <ul className="timeline">{timeline.map((e, i) => (
              <li key={i}><span className="t">{fmtClock(e.at)}</span><span className="e">{e.text}{e.extra && <span className="small muted"> · {e.extra}</span>}</span></li>))}
            </ul>
          </div>
        </div>
        <div className="stack">
          {o.partner_id && (
            <div className="card pad stack" style={{ gap: 6 }}>
              <div className="row between"><h3>Your delivery partner</h3><Src db="MySQL" /></div>
              <div className="row"><span style={{ fontSize: 30 }}>🛵</span><div><b>{o.partner_name}</b> {o.partner_rating && <span className="small muted">★ {o.partner_rating}</span>}
                <div className="small muted">{title(o.vehicle_type)}{o.vehicle_number ? ' · ' + o.vehicle_number : ''} · {o.partner_phone}</div></div></div>
              <div className="small muted">{o.distance_km} km trip · <Chip s={o.delivery_status} /></div>
            </div>
          )}
          <div className="card pad">
            <div className="row between" style={{ marginBottom: 6 }}><h3>Bill</h3><Src db="MySQL" /></div>
            {items.map((i, k) => <div className="cart-line" key={k}><Veg v={i.is_veg} /><div className="grow">{i.name} <span className="muted">×{i.quantity}</span></div><span className="num">{money(i.line_total)}</span></div>)}
            <div className="bill">
              <div><span>Item total</span><span className="num">{money(o.subtotal)}</span></div>
              {o.discount_amount > 0 && <div className="save"><span>Coupon {o.coupon_code}</span><span className="num">−{money(o.discount_amount)}</span></div>}
              <div><span>Delivery fee</span><span className="num">{o.delivery_fee ? money(o.delivery_fee) : 'Free'}</span></div>
              <div><span>GST</span><span className="num">{money(o.tax_amount)}</span></div>
              <div className="total"><span>Total</span><span className="num">{money(o.total_amount)}</span></div>
            </div>
            <div className="small muted">{payLabel(o.payment_method)} · <Chip s={o.payment_status} />{o.transaction_ref && ` · ref ${o.transaction_ref}`}</div>
            <div className="small muted" style={{ marginTop: 6 }}>Deliver to {o.address_label}: {o.address_line}, {o.address_city}</div>
          </div>
          {o.order_status === 'DELIVERED' && (o.review_id
            ? <div className="card pad"><h3>Your rating</h3><p>Food {'★'.repeat(o.food_rating)}{o.delivery_rating ? ` · Delivery ${'★'.repeat(o.delivery_rating)}` : ''}</p>{o.review_comment && <p className="muted">“{o.review_comment}”</p>}</div>
            : <Review id={o.order_id} onDone={load} />)}
        </div>
      </div>
    </div>
  );
}
