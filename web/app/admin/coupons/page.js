'use client';
// Admin: coupons - SELECT, INSERT, UPDATE (status) and DELETE
import { useCallback, useEffect, useState } from 'react';
import { api, money, fmtDate, Chip, today } from '@/components/kit';
import { useApp, useRequireRole } from '@/components/Shell';

const EMPTY = { code: '', description: '', discount_type: 'PERCENT', discount_value: '', max_discount: '', min_order_value: '', valid_from: '', valid_to: '', usage_limit: 1000, restaurant_id: '' };

export default function CouponsPage() {
  const user = useRequireRole('admin');
  const { toast } = useApp();
  const [d, setD] = useState(null);
  const [f, setF] = useState({ ...EMPTY, valid_from: today(), valid_to: today() });
  const load = useCallback(() => api('/admin/coupons').then(setD).catch(e => toast(e.message, 'err')), [toast]);
  useEffect(() => { if (user) load(); }, [user, load]);
  if (!user || !d) return <div className="loading">Loading…</div>;

  const call = async (fn, ok) => { try { await fn(); toast(ok); load(); } catch (e) { toast(e.message, 'err'); } };
  const set = k => e => setF({ ...f, [k]: e.target.value });

  return (
    <>
      <div className="section-title"><h1>Coupons</h1><span className="muted">{d.coupons.length} coupons</span></div>
      <div className="card"><div className="table-wrap"><table className="data">
        <thead><tr><th>Code</th><th>Offer</th><th>Restaurant</th><th>Valid</th><th className="r">Used</th><th>Status</th><th></th></tr></thead>
        <tbody>{d.coupons.map(c => (
          <tr key={c.coupon_id}>
            <td><b>{c.code}</b><div className="small muted">{c.description}</div></td>
            <td>{c.discount_type === 'PERCENT' ? `${c.discount_value}%${c.max_discount ? ` up to ${money(c.max_discount)}` : ''}` : money(c.discount_value)}
              <div className="small muted">min {money(c.min_order_value)}</div></td>
            <td>{c.restaurant_name || <span className="muted">All restaurants</span>}</td>
            <td className="small">{fmtDate(c.valid_from)} – {fmtDate(c.valid_to)}</td>
            <td className="r num">{c.times_used} / {c.usage_limit}</td>
            <td><Chip s={c.status} /></td>
            <td className="r"><div className="row" style={{ justifyContent: 'flex-end' }}>
              {c.status === 'ACTIVE'
                ? <button className="btn sm" onClick={() => call(() => api('/admin/coupons/' + c.coupon_id, { method: 'PATCH', body: { status: 'DISABLED' } }), 'Coupon disabled')}>Disable</button>
                : <button className="btn sm" onClick={() => call(() => api('/admin/coupons/' + c.coupon_id, { method: 'PATCH', body: { status: 'ACTIVE' } }), 'Coupon active')}>Activate</button>}
              <button className="btn sm danger" onClick={() => { if (confirm(`Delete ${c.code}?`)) call(() => api('/admin/coupons/' + c.coupon_id, { method: 'DELETE' }), 'Coupon deleted'); }}>Delete</button>
            </div></td>
          </tr>))}</tbody>
      </table></div></div>
      <p className="small muted">A coupon that any order has used cannot be deleted (foreign key from Orders) – disable it instead.</p>

      <div className="section-title"><h2>New coupon</h2></div>
      <form className="card pad form-grid" onSubmit={e => {
        e.preventDefault();
        call(async () => { await api('/admin/coupons', { method: 'POST', body: f }); setF({ ...EMPTY, valid_from: today(), valid_to: today() }); }, 'Coupon created');
      }}>
        <label className="field">Code<input type="text" value={f.code} onChange={e => setF({ ...f, code: e.target.value.toUpperCase() })} maxLength={20} required /></label>
        <label className="field">Description<input type="text" value={f.description} onChange={set('description')} maxLength={150} required /></label>
        <label className="field">Type<select value={f.discount_type} onChange={set('discount_type')}><option value="PERCENT">Percent off</option><option value="FLAT">Flat amount off</option></select></label>
        <label className="field">Value<input type="number" min="1" value={f.discount_value} onChange={set('discount_value')} required /></label>
        <label className="field">Max discount (optional)<input type="number" min="1" value={f.max_discount} onChange={set('max_discount')} /></label>
        <label className="field">Minimum order<input type="number" min="0" value={f.min_order_value} onChange={set('min_order_value')} /></label>
        <label className="field">Valid from<input type="date" value={f.valid_from} onChange={set('valid_from')} required /></label>
        <label className="field">Valid to<input type="date" value={f.valid_to} onChange={set('valid_to')} required /></label>
        <label className="field">Usage limit<input type="number" min="1" value={f.usage_limit} onChange={set('usage_limit')} /></label>
        <label className="field">Restaurant<select value={f.restaurant_id} onChange={set('restaurant_id')}><option value="">All restaurants</option>
          {d.restaurants.map(r => <option key={r.restaurant_id} value={r.restaurant_id}>{r.name}</option>)}</select></label>
        <div className="full"><button className="btn primary">Create coupon</button>
          <span className="small muted" style={{ marginLeft: 10 }}>MySQL CHECK constraints reject end dates before start dates and percentages over 100.</span></div>
      </form>
    </>
  );
}
