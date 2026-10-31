'use client';
// Delivery partner: availability, current delivery, GPS (MongoDB), earnings
import { useCallback, useEffect, useState } from 'react';
import { api, money, fmtTime, Chip, Src, payLabel, title } from '@/components/kit';
import MapView from '@/components/MapView';
import { useApp, useRequireRole } from '@/components/Shell';

export default function PartnerPage() {
  const user = useRequireRole('partner');
  const { toast } = useApp();
  const [d, setD] = useState(null);
  const load = useCallback(() => api('/partner/me').then(setD).catch(e => toast(e.message, 'err')), [toast]);
  useEffect(() => { if (user) load(); }, [user, load]);
  useEffect(() => {
    if (!user) return;
    const t = setInterval(() => { if (!document.hidden) load(); }, 5000);
    return () => clearInterval(t);
  }, [user, load]);
  if (!user || !d) return <div className="loading">Loading…</div>;

  const { partner: p, today, active: a, activeItems, history, location } = d;
  const loc = location?.location?.coordinates;
  const act = async (path, ok, body) => {
    try { const r = await api(path, { method: 'POST', body }); toast(typeof ok === 'function' ? ok(r) : ok); load(); }
    catch (e) { toast(e.message, 'err'); }
  };

  return (
    <>
      <div className="row between">
        <div className="row"><span style={{ fontSize: 40 }}>🛵</span><div><h1>{p.full_name}</h1>
          <div className="muted">{title(p.vehicle_type)}{p.vehicle_number ? ' · ' + p.vehicle_number : ''} · {p.city}{p.rating ? ` · ★ ${p.rating}` : ''}</div></div></div>
        <div className="row">
          {p.account_status !== 'ACTIVE' ? <><Chip s={p.account_status} /><span className="small muted">An admin must verify your account</span></>
            : p.availability === 'BUSY' ? <Chip s="BUSY" />
            : <label className="switch"><input type="checkbox" checked={p.availability === 'AVAILABLE'}
                onChange={e => act('/partner/availability', e.target.checked ? 'You are online' : 'You are offline', { availability: e.target.checked ? 'AVAILABLE' : 'OFFLINE' })} />
                {p.availability === 'AVAILABLE' ? 'Online' : 'Offline'}</label>}
        </div>
      </div>
      <div className="grid cols-4" style={{ marginTop: 18 }}>
        <div className="card kpi"><span className="label">Deliveries today</span><span className="value">{today.deliveries}</span></div>
        <div className="card kpi"><span className="label">Earned today</span><span className="value">{money(today.earnings)}</span></div>
        <div className="card kpi"><span className="label">Total deliveries</span><span className="value">{p.total_deliveries}</span><span className="hint">avg {p.avg_minutes ?? '–'} min each</span></div>
        <div className="card kpi accent"><span className="label">Total earnings</span><span className="value">{money(p.total_earnings)}</span><span className="hint">derived attribute, view v_partner_stats</span></div>
      </div>

      <div className="section-title"><h2>Current delivery</h2>{a && <Chip s={a.delivery_status} />}</div>
      {a ? (
        <div className="track-layout">
          <div className="card pad stack">
            <div className={`stop ${a.delivery_status === 'ASSIGNED' ? 'active' : ''}`}><span className="n">1</span><div><b>Pick up · {a.restaurant_name}</b>
              <div className="small muted">{a.restaurant_address}</div>
              <div className="small">Order #{a.order_id}: {activeItems.map(i => `${i.name} ×${i.quantity}`).join(', ')}</div>
              <div className="small">Kitchen status: <Chip s={a.order_status} /></div></div></div>
            <div className={`stop ${a.delivery_status === 'PICKED_UP' ? 'active' : ''}`}><span className="n">2</span><div><b>Drop · {a.customer_name}</b>
              <div className="small muted">{a.address_line}, {a.address_city} · {a.customer_phone}</div>
              {a.payment_method === 'COD' && a.payment_status === 'PENDING'
                ? <div className="notice" style={{ marginTop: 6 }}>Collect {money(a.total_amount)} in cash</div>
                : <div className="small" style={{ color: 'var(--green)' }}>Paid online ({payLabel(a.payment_method)})</div>}
              {a.special_instructions && <div className="small muted">Note: {a.special_instructions}</div>}</div></div>
            <div className="small muted">{a.distance_km} km · you earn {money(a.partner_earning)}</div>
            <div className="row">
              <button className="btn" onClick={() => act(`/deliveries/${a.delivery_id}/gps`, r => `Location shared · ${r.eta_minutes} min to ${r.heading_to}`)}>📍 Send GPS update</button>
              {a.delivery_status === 'ASSIGNED' && <button className="btn primary" disabled={a.order_status !== 'READY'} onClick={() => act(`/deliveries/${a.delivery_id}/pickup`, 'Picked up – drive safe!')}>Mark picked up</button>}
              {a.delivery_status === 'PICKED_UP' && <button className="btn primary" onClick={() => act(`/deliveries/${a.delivery_id}/deliver`, 'Delivered! Earnings added.')}>Mark delivered</button>}
            </div>
            {a.delivery_status === 'ASSIGNED' && a.order_status !== 'READY' && <div className="small muted">You can pick up once the restaurant marks the order ready.</div>}
          </div>
          <div className="card pad"><div className="row between" style={{ marginBottom: 8 }}><h3>Map</h3><Src db="MongoDB" /></div>
            <MapView restaurant={{ lat: a.restaurant_lat, lng: a.restaurant_lng }} home={{ lat: a.address_lat, lng: a.address_lng }}
              partner={loc ? { lat: loc[1], lng: loc[0] } : null} />
            <div className="small muted" style={{ marginTop: 8 }}>{loc ? `Location updated ${fmtTime(location.updated_at)}` : 'No GPS yet'}</div></div>
        </div>
      ) : <div className="card empty">{p.availability === 'AVAILABLE' ? 'You are online. New deliveries assigned by the admin will appear here.' : 'Go online to receive deliveries.'}</div>}

      <div className="section-title"><h2>Recent deliveries</h2></div>
      <div className="card"><div className="table-wrap"><table className="data">
        <thead><tr><th>Order</th><th>Restaurant</th><th>Delivered</th><th className="r">Distance</th><th className="r">Earned</th></tr></thead>
        <tbody>{history.map(h => <tr key={h.order_id}><td>#{h.order_id}</td><td>{h.restaurant_name}</td><td>{fmtTime(h.delivered_at)}</td><td className="r num">{h.distance_km} km</td><td className="r num">{money(h.partner_earning)}</td></tr>)}
          {!history.length && <tr><td colSpan={5} className="muted">No deliveries yet</td></tr>}</tbody>
      </table></div></div>
    </>
  );
}
