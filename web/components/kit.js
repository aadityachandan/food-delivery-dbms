'use client';
// Small shared helpers for the pages: API calls, formatting, badges.

export async function api(path, opts = {}) {
  const res = await fetch('/api' + path, {
    method: opts.method || 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const money = n => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: Number(n) % 1 ? 2 : 0, maximumFractionDigits: 2 });
const toDate = d => (typeof d === 'string' && /^\d{4}-\d\d-\d\d \d/.test(d)) ? new Date(d.replace(' ', 'T')) : new Date(d);
export const fmtTime = d => d ? toDate(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }) : '';
export const fmtClock = d => d ? toDate(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
export const fmtDate = d => d ? toDate(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
export const title = s => String(s || '').replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());
const PAY = { UPI: 'UPI', CARD: 'Card', NET_BANKING: 'Net banking', WALLET: 'Wallet', COD: 'Cash on delivery' };
export const payLabel = m => PAY[m] || m || '';
export const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

const STATUS_CHIP = {
  PLACED: 'blue', ACCEPTED: 'blue', PREPARING: 'amber', READY: 'amber', PICKED_UP: 'accent', DELIVERED: 'green', CANCELLED: 'red',
  SUCCESS: 'green', PENDING: 'amber', FAILED: 'red', REFUNDED: 'blue', ASSIGNED: 'blue',
  AVAILABLE: 'green', BUSY: 'accent', OFFLINE: '', ACTIVE: 'green', SUSPENDED: 'red', PENDING_APPROVAL: 'amber',
  OPEN: 'green', CLOSED: '', EXPIRED: '', DISABLED: 'red',
};
export function Chip({ s }) {
  if (!s) return null;
  return <span className={`chip ${STATUS_CHIP[s] || ''}`}>{title(s === 'PICKED_UP' ? 'ON_THE_WAY' : s)}</span>;
}
export const Src = ({ db }) => <span className={`chip src ${db === 'MongoDB' ? 'green' : 'blue'}`}>{db}</span>;
export const Veg = ({ v }) => <span className={`veg ${v ? '' : 'non'}`} title={v ? 'Veg' : 'Non-veg'} />;
export const Rating = ({ r }) => r ? <span className="rating">★ {Number(r).toFixed(1)}</span> : <span className="rating none">New</span>;

const LOOK = {
  'Biryani': ['🍛', '#F8DDB0', '#E9A85B'], 'South Indian': ['🥞', '#FCEBC0', '#F2C14E'], 'Chinese': ['🥡', '#FAD2C8', '#E4572E'],
  'Italian': ['🍕', '#FDDDBE', '#F08A4B'], 'North Indian': ['🍲', '#F7D3AE', '#C8693A'], 'Healthy': ['🥗', '#DAF0CF', '#7CB86A'],
  'Fast Food': ['🍔', '#FFE6B0', '#F2A541'], 'Seafood': ['🐟', '#D3E8F3', '#5B9BC4'], 'Desserts': ['🍰', '#F9D8E6', '#D97AA5'],
  'Street Food': ['🌮', '#FBE3BF', '#D9822B'],
};
export const look = c => LOOK[c] || ['🍽️', '#EFE8DC', '#C9BBA4'];
export const bannerStyle = c => ({ background: `linear-gradient(135deg, ${look(c)[1]}, ${look(c)[2]})` });

// Plain table for query results of any shape
export function DataTable({ rows, empty = 'No rows' }) {
  if (!rows || !rows.length) return <p className="muted small">{empty}</p>;
  const cols = Object.keys(rows[0]);
  const show = v => v === null ? <span className="muted">NULL</span> : typeof v === 'object' ? JSON.stringify(v) : String(v);
  return (
    <div className="table-wrap"><table className="data">
      <thead><tr>{cols.map(c => <th key={c}>{c}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i}>{cols.map(c => <td key={c} className="num">{show(r[c])}</td>)}</tr>)}</tbody>
    </table></div>
  );
}
