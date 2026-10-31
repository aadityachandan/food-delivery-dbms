'use client';
// Admin control room: KPIs, partner assignment (key query 4), approvals, logs
import { Fragment, useCallback, useEffect, useState } from 'react';
import { api, money, fmtTime, Chip, Src, title, today } from '@/components/kit';
import { useApp, useRequireRole } from '@/components/Shell';

export default function AdminPage() {
  const user = useRequireRole('admin');
  const { toast } = useApp();
  const [range, setRange] = useState({ from: '2026-10-01', to: today() });
  const [d, setD] = useState(null);
  const [open, setOpen] = useState(null);       // order id whose candidates are shown
  const [cand, setCand] = useState(null);
  const load = useCallback(() => api(`/admin/overview?from=${range.from}&to=${range.to}`).then(setD).catch(e => toast(e.message, 'err')), [range, toast]);
  useEffect(() => { if (user) load(); }, [user, load]);
  if (!user || !d) return <div className="loading">Loading…</div>;
  const k = d.kpi;

  async function findPartners(orderId) {
    setOpen(orderId); setCand(null);
    try { setCand(await api(`/orders/${orderId}/candidates`)); } catch (e) { toast(e.message, 'err'); setOpen(null); }
  }
  async function assign(orderId, partnerId) {
    try { await api(`/orders/${orderId}/assign`, { method: 'POST', body: { partnerId } }); toast(`Partner assigned to order #${orderId}`); setOpen(null); load(); }
    catch (e) { toast(e.message, 'err'); }
  }
  async function approve(id) {
    try { await api(`/admin/restaurants/${id}/approve`, { method: 'POST' }); toast('Restaurant approved and now live'); load(); }
    catch (e) { toast(e.message, 'err'); }
  }

  return (
    <>
      <div className="row between"><h1>Platform control room</h1>
        <div className="row">
          <label className="field" style={{ flexDirection: 'row', alignItems: 'center' }}>From <input type="date" value={range.from} onChange={e => setRange({ ...range, from: e.target.value })} /></label>
          <label className="field" style={{ flexDirection: 'row', alignItems: 'center' }}>To <input type="date" value={range.to} onChange={e => setRange({ ...range, to: e.target.value })} /></label>
          <button className="btn" onClick={load}>Refresh</button></div></div>
      <div className="grid cols-4" style={{ marginTop: 18 }}>
        <div className="card kpi"><span className="label">Orders</span><span className="value">{k.orders}</span><span className="hint">{k.delivered} delivered</span></div>
        <div className="card kpi"><span className="label">Gross order value</span><span className="value">{money(k.gross_value)}</span><span className="hint">delivered orders</span></div>
        <div className="card kpi accent"><span className="label">Commission earned</span><span className="value">{money(k.commission)}</span><span className="hint">platform revenue</span></div>
        <div className="card kpi"><span className="label">Partners</span><span className="value">{d.partners.available} <span className="small muted">free</span> · {d.partners.busy} <span className="small muted">busy</span></span><span className="hint">active accounts</span></div>
      </div>

      <div className="section-title"><h2>Orders waiting for a delivery partner</h2><Src db="MySQL" /></div>
      <div className="card"><div className="table-wrap"><table className="data">
        <thead><tr><th>Order</th><th>Restaurant</th><th>City</th><th>Status</th><th className="r">Waiting</th><th></th></tr></thead>
        <tbody>{d.waiting.map(w => (
          <Fragment key={w.order_id}>
            <tr><td>#{w.order_id}</td><td>{w.restaurant_name}</td><td>{w.city}</td><td><Chip s={w.order_status} /></td>
              <td className="r num">{w.waiting_minutes > 120 ? Math.round(w.waiting_minutes / 60) + ' h' : w.waiting_minutes + ' min'}</td>
              <td className="r"><button className="btn sm primary" onClick={() => findPartners(w.order_id)}>Find partners</button></td></tr>
            {open === w.order_id && (
              <tr className="candidates"><td colSpan={6}>
                {!cand ? <div className="muted">Looking for partners…</div> : (
                  <div className="stack" style={{ gap: 10, padding: '6px 0' }}>
                    <div className="row between"><b>Partners near {cand.order.restaurant_name} ({cand.order.city})</b>
                      <span className="small muted">Trip {cand.tripKm} km · partner earns {money(cand.earning)} · ranked by {cand.usedMongo ? 'distance (MongoDB $geoNear), then ' : ''}workload and rating</span></div>
                    {cand.candidates.length ? (
                      <table className="data"><thead><tr><th>Partner</th><th>Vehicle</th><th className="r">Rating</th><th className="r">Deliveries today</th><th className="r">Distance <Src db="MongoDB" /></th><th></th></tr></thead>
                        <tbody>{cand.candidates.map((p, i) => (
                          <tr key={p.partner_id}><td>{i === 0 ? '⭐ ' : ''}{p.full_name}</td><td>{title(p.vehicle_type)}</td><td className="r num">{p.rating ?? '–'}</td>
                            <td className="r num">{p.deliveries_today}</td><td className="r num">{p.distance_km == null ? '–' : p.distance_km + ' km'}</td>
                            <td className="r"><button className={`btn sm ${i === 0 ? 'primary' : ''}`} onClick={() => assign(w.order_id, p.partner_id)}>Assign</button></td></tr>))}</tbody></table>
                    ) : <div className="notice">No partner is available in this city right now.</div>}
                    <div className="small muted">Assigning calls the stored procedure <code className="inline">sp_assign_partner</code> (transaction + row locks).</div>
                  </div>)}
              </td></tr>)}
          </Fragment>))}
          {!d.waiting.length && <tr><td colSpan={6} className="muted">Every active order has a partner 🎉</td></tr>}</tbody>
      </table></div></div>

      {d.pending.length > 0 && (<>
        <div className="section-title"><h2>Restaurants awaiting approval</h2></div>
        <div className="card"><div className="table-wrap"><table className="data">
          <thead><tr><th>Restaurant</th><th>Cuisine</th><th>City</th><th>Owner</th><th>Applied</th><th></th></tr></thead>
          <tbody>{d.pending.map(r => <tr key={r.restaurant_id}><td>{r.name}</td><td>{r.cuisine_type}</td><td>{r.city}</td><td>{r.owner_name}</td><td>{fmtTime(r.created_at)}</td>
            <td className="r"><button className="btn sm primary" onClick={() => approve(r.restaurant_id)}>Approve</button></td></tr>)}</tbody>
        </table></div></div></>)}

      <div className="grid cols-2" style={{ marginTop: 28 }}>
        <div className="card pad"><div className="row between" style={{ marginBottom: 6 }}><h2>Revenue by restaurant</h2><Src db="MySQL" /></div>
          <div className="table-wrap"><table className="data"><thead><tr><th>Restaurant</th><th className="r">Orders</th><th className="r">Food sales</th><th className="r">Commission</th></tr></thead>
            <tbody>{d.revenue.map(r => <tr key={r.name}><td>{r.name}</td><td className="r num">{r.orders}</td><td className="r num">{money(r.food_sales)}</td><td className="r num">{money(r.commission)}</td></tr>)}</tbody></table></div></div>
        <div className="card pad"><div className="row between" style={{ marginBottom: 6 }}><h2>Most popular items</h2><Src db="MySQL" /></div>
          <div className="bars">{d.topItems.map(t => (
            <div className="bar" key={t.name}><span>{t.name}<br /><span className="small muted">{t.restaurant}</span></span>
              <span className="track"><span className="fill" style={{ width: `${t.units / Math.max(1, d.topItems[0].units) * 100}%` }} /></span><b className="num">{t.units}</b></div>))}</div></div>
      </div>

      <div className="card pad" style={{ marginTop: 18 }}><div className="row between"><h2>Activity log</h2><Src db="MongoDB" /></div>
        {d.activity ? <ul className="feed">{d.activity.map((a, i) => (
          <li key={i}><span><b>{title(a.action)}</b> <span className="small muted">by {title(a.actor?.type || '')}{a.actor?.id ? ' #' + a.actor.id : ''}
            {a.target ? ' · ' + Object.entries(a.target).map(([kk, v]) => `${kk.replace('_id', '')} #${v}`).join(', ') : ''}</span></span>
            <span className="small muted">{fmtTime(a.at)}</span></li>))}</ul> : <p className="muted">MongoDB is not connected.</p>}
      </div>
    </>
  );
}
