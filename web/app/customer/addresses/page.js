'use client';
// Customer: saved addresses - INSERT, UPDATE (default) and DELETE
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/components/kit';
import { useApp, useRequireRole } from '@/components/Shell';

export default function Addresses() {
  const user = useRequireRole('customer');
  const { toast } = useApp();
  const [rows, setRows] = useState(null);
  const [pincodes, setPincodes] = useState([]);
  const [f, setF] = useState({ label: 'HOME', address_line: '', pincode: '' });
  const load = useCallback(() => api('/customer/addresses').then(setRows).catch(e => toast(e.message, 'err')), [toast]);

  useEffect(() => { if (user) { load(); api('/meta').then(m => setPincodes(m.pincodes)).catch(() => {}); } }, [user, load]);
  if (!user || !rows) return <div className="loading">Loading…</div>;

  async function add(e) {
    e.preventDefault();
    try { await api('/customer/addresses', { method: 'POST', body: f }); toast('Address saved'); setF({ label: 'HOME', address_line: '', pincode: '' }); load(); }
    catch (err) { toast(err.message, 'err'); }
  }
  async function remove(a) {
    if (!confirm(`Delete "${a.address_line}"?`)) return;
    try { await api('/customer/addresses/' + a.address_id, { method: 'DELETE' }); toast('Address deleted'); load(); }
    catch (err) { toast(err.message, 'err'); }
  }
  async function makeDefault(a) {
    try { await api('/customer/addresses/' + a.address_id, { method: 'PATCH' }); load(); }
    catch (err) { toast(err.message, 'err'); }
  }

  return (
    <>
      <div className="section-title"><h1>Saved addresses</h1></div>
      <div className="card"><div className="table-wrap"><table className="data">
        <thead><tr><th>Label</th><th>Address</th><th>City</th><th className="r">Orders</th><th></th></tr></thead>
        <tbody>{rows.map(a => (
          <tr key={a.address_id}>
            <td><b>{a.label}</b> {a.is_default ? <span className="chip green">Default</span> : null}</td>
            <td>{a.address_line}</td><td>{a.city} {a.pincode}</td><td className="r num">{a.orders_count}</td>
            <td className="r"><div className="row" style={{ justifyContent: 'flex-end' }}>
              {!a.is_default && <button className="btn sm" onClick={() => makeDefault(a)}>Make default</button>}
              <button className="btn sm danger" onClick={() => remove(a)}>Delete</button></div></td>
          </tr>))}</tbody>
      </table></div></div>
      <p className="small muted">An address used by past orders cannot be deleted: the foreign key from Orders (ON DELETE RESTRICT) protects order history.</p>
      <div className="section-title"><h2>Add an address</h2></div>
      <form className="card pad inline-form" onSubmit={add}>
        <label className="field">Label<select value={f.label} onChange={e => setF({ ...f, label: e.target.value })}>{['HOME', 'WORK', 'OTHER'].map(l => <option key={l}>{l}</option>)}</select></label>
        <label className="field" style={{ flex: 1 }}>Address<input type="text" value={f.address_line} onChange={e => setF({ ...f, address_line: e.target.value })} required /></label>
        <label className="field">Pincode<select value={f.pincode} onChange={e => setF({ ...f, pincode: e.target.value })} required>
          <option value="">Choose…</option>{pincodes.map(p => <option key={p.pincode} value={p.pincode}>{p.pincode} · {p.city}</option>)}</select></label>
        <button className="btn primary">Save address</button>
      </form>
    </>
  );
}
