'use client';
// Restaurant owner: sales (views), live order board, menu CRUD, stock
import { useCallback, useEffect, useState } from 'react';
import { api, money, fmtClock, Chip, Veg, payLabel, title, today } from '@/components/kit';
import { useApp, useRequireRole } from '@/components/Shell';

const NEXT = {
  PLACED: [['ACCEPTED', 'Accept', 'primary'], ['CANCELLED', 'Reject', 'danger']],
  ACCEPTED: [['PREPARING', 'Start preparing', 'primary'], ['CANCELLED', 'Reject', 'danger']],
  PREPARING: [['READY', 'Mark ready', 'primary']],
};
const COLS = [['New', ['PLACED']], ['Accepted', ['ACCEPTED']], ['Preparing', ['PREPARING']], ['Ready / out', ['READY', 'PICKED_UP']]];

export default function RestaurantDashboard() {
  const user = useRequireRole('owner');
  const { toast } = useApp();
  const [outlets, setOutlets] = useState(null);
  const [outletId, setOutletId] = useState(null);
  const [range, setRange] = useState({ from: '2026-10-01', to: today() });
  const [d, setD] = useState(null);
  const [newItem, setNewItem] = useState({ name: '', category: '', price: '', description: '', is_veg: true });
  const [prices, setPrices] = useState({});
  const [stock, setStock] = useState({});

  useEffect(() => {
    if (!user) return;
    api('/owner/restaurants').then(o => { setOutlets(o); setOutletId(o[0]?.restaurant_id ?? null); }).catch(e => toast(e.message, 'err'));
  }, [user, toast]);

  const load = useCallback(() => {
    if (!outletId) return;
    return api(`/owner/dashboard?restaurantId=${outletId}&from=${range.from}&to=${range.to}`).then(setD).catch(e => toast(e.message, 'err'));
  }, [outletId, range, toast]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setInterval(() => { if (!document.hidden) load(); }, 6000);
    return () => clearInterval(t);
  }, [load]);

  if (!user || !outlets) return <div className="loading">Loading…</div>;
  if (!outlets.length) return <div className="empty card">You have no restaurants yet.</div>;
  if (!d) return <div className="loading">Loading…</div>;

  const call = async (fn, ok) => { try { await fn(); if (ok) toast(ok); load(); } catch (e) { toast(e.message, 'err'); } };
  const setStatus = (o, s) => {
    if (s === 'CANCELLED' && !confirm(`Reject order #${o.order_id}? The customer will be refunded.`)) return;
    call(() => api(`/orders/${o.order_id}/status`, { method: 'POST', body: { status: s } }), `Order #${o.order_id}: ${title(s)}`);
  };
  const s = d.summary, maxUnits = Math.max(1, ...d.topItems.map(t => t.units));

  return (
    <>
      <div className="row between">
        <div className="row"><h1>{d.restaurant.name}</h1><Chip s={d.restaurant.status} /></div>
        <div className="row">
          {outlets.length > 1 && <select value={outletId} onChange={e => setOutletId(Number(e.target.value))} aria-label="Outlet">
            {outlets.map(o => <option key={o.restaurant_id} value={o.restaurant_id}>{o.name} · {o.city}</option>)}</select>}
          <label className="field" style={{ flexDirection: 'row', alignItems: 'center' }}>From <input type="date" value={range.from} onChange={e => setRange({ ...range, from: e.target.value })} /></label>
          <label className="field" style={{ flexDirection: 'row', alignItems: 'center' }}>To <input type="date" value={range.to} onChange={e => setRange({ ...range, to: e.target.value })} /></label>
        </div>
      </div>
      {d.restaurant.status === 'PENDING_APPROVAL' && <div className="notice" style={{ marginTop: 14 }}>Waiting for admin approval. Customers can’t see this outlet yet.</div>}

      <div className="grid cols-4" style={{ marginTop: 18 }}>
        <div className="card kpi"><span className="label">Delivered orders</span><span className="value">{s.delivered_orders}</span><span className="hint">from view v_restaurant_daily_sales</span></div>
        <div className="card kpi"><span className="label">Food sales</span><span className="value">{money(s.food_sales)}</span><span className="hint">sum of item totals</span></div>
        <div className="card kpi"><span className="label">Platform commission</span><span className="value">{money(s.commission)}</span><span className="hint">{d.restaurant.commission_pct}% of sales</span></div>
        <div className="card kpi accent"><span className="label">Your payout</span><span className="value">{money(s.net_payout)}</span><span className="hint">after commission and {money(s.restaurant_discounts)} of your coupons</span></div>
      </div>

      <div className="section-title"><h2>Live orders</h2><span className="small muted">refreshes every 6 s · status rules enforced by a trigger</span></div>
      <div className="board">{COLS.map(([name, sts]) => {
        const list = d.liveOrders.filter(o => sts.includes(o.order_status));
        return (
          <div className="board-col" key={name}><h4>{name}<span>{list.length}</span></h4>
            {list.map(o => (
              <div className="ticket" key={o.order_id}>
                <div className="row between"><b>#{o.order_id}</b><span className="small muted">{fmtClock(o.order_time)}</span></div>
                <div>{o.customer_name} · <b className="num">{money(o.total_amount)}</b> <span className="small muted">{payLabel(o.payment_method)}</span></div>
                <div className="items">{o.items}</div>
                {o.special_instructions && <div className="small" style={{ color: 'var(--amber)' }}>“{o.special_instructions}”</div>}
                <div className="small muted">{o.partner_name ? `🛵 ${o.partner_name} · ${title(o.delivery_status)}` : 'No delivery partner yet'}</div>
                <div className="row">{(NEXT[o.order_status] || []).map(([st, label, cls]) =>
                  <button key={st} className={`btn sm ${cls}`} onClick={() => setStatus(o, st)}>{label}</button>)}
                  {o.order_status === 'READY' && <span className="chip amber">Waiting for pickup</span>}
                  {o.order_status === 'PICKED_UP' && <Chip s="PICKED_UP" />}</div>
              </div>))}
            {!list.length && <div className="small muted">Nothing here</div>}
          </div>);
      })}</div>

      <div className="grid cols-2" style={{ marginTop: 28 }}>
        <div className="card pad"><div className="row between" style={{ marginBottom: 12 }}><h2>Top sellers</h2><span className="small muted">view v_menu_popularity</span></div>
          {d.topItems.length ? <div className="bars">{d.topItems.map(t => (
            <div className="bar" key={t.name}><span>{t.name}</span><span className="track"><span className="fill" style={{ width: `${t.units / maxUnits * 100}%` }} /></span><b className="num">{t.units}</b></div>))}</div>
            : <p className="muted">No delivered orders yet.</p>}
        </div>
        <div className="card pad"><div className="row between" style={{ marginBottom: 6 }}><h2>Stock</h2><span className="small muted">Inventory (weak entity)</span></div>
          <div className="table-wrap"><table className="data"><thead><tr><th>Ingredient</th><th className="r">In stock</th><th className="r">Reorder at</th><th></th></tr></thead>
            <tbody>{d.inventory.map(i => (
              <tr key={i.ingredient_name} className={i.low ? 'low-row' : ''}>
                <td>{i.ingredient_name} {i.low ? <span className="chip red">Low</span> : null}</td>
                <td className="r"><input className="qty-input" type="number" min="0" step="0.5" aria-label={`Quantity of ${i.ingredient_name}`}
                  value={stock[i.ingredient_name] ?? i.quantity} onChange={e => setStock({ ...stock, [i.ingredient_name]: e.target.value })} /> {i.unit}</td>
                <td className="r num">{i.reorder_level} {i.unit}</td>
                <td><button className="btn sm" onClick={() => call(() => api('/owner/inventory', { method: 'PATCH',
                  body: { restaurantId: outletId, ingredient_name: i.ingredient_name, quantity: Number(stock[i.ingredient_name] ?? i.quantity) } }), 'Stock updated')}>Save</button></td>
              </tr>))}</tbody></table></div>
          {!d.inventory.length && <p className="muted">No ingredients tracked.</p>}
        </div>
      </div>

      <div className="card pad" style={{ marginTop: 18 }}>
        <div className="row between" style={{ marginBottom: 6 }}><h2>Menu</h2><span className="small muted">items in past orders can be switched off but not deleted (foreign key)</span></div>
        <div className="table-wrap"><table className="data"><thead><tr><th>Item</th><th>Category</th><th className="r">Price</th><th className="r">Ordered</th><th>Available</th><th></th></tr></thead>
          <tbody>{d.menu.map(m => (
            <tr key={m.item_id}>
              <td><Veg v={m.is_veg} /> {m.name}</td><td>{m.category}</td>
              <td className="r"><input className="qty-input" type="number" min="1" step="1" aria-label={`Price of ${m.name}`}
                value={prices[m.item_id] ?? m.price} onChange={e => setPrices({ ...prices, [m.item_id]: e.target.value })} />
                {prices[m.item_id] !== undefined && Number(prices[m.item_id]) !== m.price &&
                  <button className="btn sm" style={{ marginLeft: 6 }} onClick={() => call(async () => {
                    await api('/owner/menu/' + m.item_id, { method: 'PATCH', body: { price: Number(prices[m.item_id]) } });
                    setPrices(p => { const n = { ...p }; delete n[m.item_id]; return n; });
                  }, 'Price updated')}>Save</button>}</td>
              <td className="r num">{m.times_ordered}×</td>
              <td><label className="switch"><input type="checkbox" checked={!!m.is_available}
                onChange={e => call(() => api('/owner/menu/' + m.item_id, { method: 'PATCH', body: { is_available: e.target.checked } }), e.target.checked ? 'Back on the menu' : 'Marked out of stock')} />
                <span className="small">{m.is_available ? 'On' : 'Off'}</span></label></td>
              <td className="r"><button className="btn sm danger" onClick={() => { if (confirm(`Delete ${m.name}?`)) call(() => api('/owner/menu/' + m.item_id, { method: 'DELETE' }), 'Item deleted'); }}>Delete</button></td>
            </tr>))}</tbody></table></div>
        <form className="inline-form" style={{ marginTop: 16 }} onSubmit={e => {
          e.preventDefault();
          call(async () => { await api('/owner/menu', { method: 'POST', body: { ...newItem, restaurantId: outletId } }); setNewItem({ name: '', category: '', price: '', description: '', is_veg: true }); }, 'Item added');
        }}>
          <label className="field" style={{ flex: 1 }}>New item<input type="text" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} required /></label>
          <label className="field">Category<input type="text" value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })} required /></label>
          <label className="field">Price<input type="number" min="1" value={newItem.price} onChange={e => setNewItem({ ...newItem, price: e.target.value })} required style={{ width: 100 }} /></label>
          <label className="field" style={{ flex: 1 }}>Description<input type="text" value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} /></label>
          <label className="switch"><input type="checkbox" checked={newItem.is_veg} onChange={e => setNewItem({ ...newItem, is_veg: e.target.checked })} />Veg</label>
          <button className="btn primary">Add item</button>
        </form>
      </div>
    </>
  );
}
