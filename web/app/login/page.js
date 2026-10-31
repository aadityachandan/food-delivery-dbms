'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/components/kit';
import { useApp, HOME } from '@/components/Shell';

const ROLES = [
  ['customer', 'Customer', 'Order food'],
  ['owner', 'Restaurant', 'Run your outlet'],
  ['partner', 'Delivery partner', 'Deliver orders'],
  ['admin', 'Admin', 'Run the platform'],
];
const DEMO = {
  customer: 'aarav.sharma@gmail.com', owner: 'gopal@udupiupahar.in',
  partner: 'ravi.s@gmail.com', admin: 'lakshmi.iyer@foodhub.in',
};

export default function Login() {
  const { user, ready, setUser, toast } = useApp();
  const router = useRouter();
  const [role, setRole] = useState('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (ready && user) router.replace(HOME[user.role]); }, [ready, user, router]);

  async function submit(e) {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const u = await api('/auth/login', { method: 'POST', body: { role, email, password } });
      setUser(u);
      toast(`Welcome, ${u.name}`);
      router.replace(HOME[u.role]);
    } catch (err) { setError(err.message); }
    setBusy(false);
  }

  return (
    <div className="auth-wrap">
      <form className="card auth-card" onSubmit={submit}>
        <div><h1>Log in to FoodHub</h1><p className="muted" style={{ margin: '6px 0 0' }}>Choose how you use the platform.</p></div>
        <div className="role-pick" role="radiogroup" aria-label="Role">
          {ROLES.map(([v, label, hint]) => (
            <button type="button" key={v} className={role === v ? 'on' : ''} onClick={() => setRole(v)} aria-pressed={role === v}>
              {label}<small>{hint}</small>
            </button>
          ))}
        </div>
        <label className="field">Email<input type="text" value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" required /></label>
        <label className="field">Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required
          style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '8px 11px' }} /></label>
        {error && <div className="error-text">{error}</div>}
        <button className="btn primary block" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
        {role === 'customer' && <div className="small muted">New here? <Link href="/register">Create a customer account</Link></div>}
        <div className="demo-box">
          Demo account for this role: <button type="button" className="btn sm" style={{ marginLeft: 4 }}
            onClick={() => { setEmail(DEMO[role]); setPassword('Demo@123'); }}>Fill demo login</button>
          <div style={{ marginTop: 6 }}><code>{DEMO[role]}</code> · password <code>Demo@123</code></div>
        </div>
      </form>
    </div>
  );
}
