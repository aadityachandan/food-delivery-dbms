'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/components/kit';
import { useApp } from '@/components/Shell';

export default function Register() {
  const { setUser, toast } = useApp();
  const router = useRouter();
  const [pincodes, setPincodes] = useState([]);
  const [f, setF] = useState({ full_name: '', email: '', phone: '', password: '', address_line: '', pincode: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = k => e => setF({ ...f, [k]: e.target.value });

  useEffect(() => { api('/meta').then(m => setPincodes(m.pincodes)).catch(() => {}); }, []);

  async function submit(e) {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const u = await api('/auth/register', { method: 'POST', body: f });
      setUser(u);
      toast('Account created');
      router.replace('/customer');
    } catch (err) { setError(err.message); }
    setBusy(false);
  }

  return (
    <div className="auth-wrap">
      <form className="card auth-card" style={{ width: 'min(560px, 100%)' }} onSubmit={submit}>
        <div><h1>Create a customer account</h1><p className="muted" style={{ margin: '6px 0 0' }}>Your password is stored only as a bcrypt hash.</p></div>
        <div className="form-grid">
          <label className="field full">Full name<input type="text" value={f.full_name} onChange={set('full_name')} required /></label>
          <label className="field">Email<input type="text" value={f.email} onChange={set('email')} required /></label>
          <label className="field">Mobile<input type="text" value={f.phone} onChange={set('phone')} placeholder="10 digits" required /></label>
          <label className="field full">Password (8+ characters)<input type="password" value={f.password} onChange={set('password')} required minLength={8}
            style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '8px 11px' }} /></label>
          <label className="field full">Delivery address<input type="text" value={f.address_line} onChange={set('address_line')} placeholder="House, street, area" required /></label>
          <label className="field full">Pincode
            <select value={f.pincode} onChange={set('pincode')} required>
              <option value="">Choose…</option>
              {pincodes.map(p => <option key={p.pincode} value={p.pincode}>{p.pincode} · {p.city}</option>)}
            </select>
          </label>
        </div>
        {error && <div className="error-text">{error}</div>}
        <button className="btn primary block" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
        <div className="small muted">Already have an account? <Link href="/login">Log in</Link></div>
      </form>
    </div>
  );
}
