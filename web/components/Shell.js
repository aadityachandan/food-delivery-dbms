'use client';
// App frame: header (role navigation, user, DB status), toasts, login state
// and the customer's cart.
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api } from './kit';

const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

export const HOME = { customer: '/customer', owner: '/restaurant', partner: '/partner', admin: '/admin' };
const ROLE_LABEL = { customer: 'Customer', owner: 'Restaurant owner', partner: 'Delivery partner', admin: 'Admin' };
const NAV = {
  customer: [['/customer', 'Browse'], ['/customer/orders', 'My orders'], ['/customer/addresses', 'Addresses']],
  owner: [['/restaurant', 'Dashboard']],
  partner: [['/partner', 'My deliveries']],
  admin: [['/admin', 'Control room'], ['/admin/coupons', 'Coupons'], ['/admin/reports', 'Query lab']],
};
const EMPTY_CART = { restaurantId: null, restaurantName: '', isOpen: true, items: {} };

// Pages call this to require a role; it redirects to /login otherwise.
export function useRequireRole(role) {
  const { user, ready } = useApp();
  const router = useRouter();
  useEffect(() => {
    if (ready && (!user || user.role !== role)) router.replace(user ? HOME[user.role] : '/login');
  }, [ready, user, role, router]);
  return ready && user?.role === role ? user : null;
}

export default function Shell({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [db, setDb] = useState({});
  const [cart, setCartState] = useState(EMPTY_CART);
  const pathname = usePathname();
  const router = useRouter();

  const toast = useCallback((msg, kind = 'ok') => {
    const id = Math.random();
    setToasts(t => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4200);
  }, []);

  const refreshUser = useCallback(async () => {
    try { setUser(await api('/auth/me')); } catch { setUser(null); }
    setReady(true);
  }, []);

  useEffect(() => { refreshUser(); }, [refreshUser]);

  // the cart is kept per customer in this browser only
  const cartKey = user?.role === 'customer' ? `foodhub.cart.${user.id}` : null;
  useEffect(() => {
    if (!cartKey) return;
    try { setCartState(JSON.parse(localStorage.getItem(cartKey)) || EMPTY_CART); } catch { setCartState(EMPTY_CART); }
  }, [cartKey]);
  const setCart = useCallback(next => {
    setCartState(prev => {
      const value = typeof next === 'function' ? next(prev) : next;
      try { if (cartKey) localStorage.setItem(cartKey, JSON.stringify(value)); } catch { /* private mode */ }
      return value;
    });
  }, [cartKey]);

  useEffect(() => {
    const check = () => api('/status').then(setDb).catch(() => setDb({ mysql: false, mongodb: false }));
    check();
    const t = setInterval(check, 15000);
    return () => clearInterval(t);
  }, []);

  async function logout() {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
    router.replace('/login');
  }

  const cartCount = Object.values(cart.items).reduce((s, i) => s + i.qty, 0);
  const dot = ok => <span className={`dot ${ok === undefined ? '' : ok ? 'ok' : 'down'}`} />;

  return (
    <AppCtx.Provider value={{ user, setUser, ready, refreshUser, toast, cart, setCart, EMPTY_CART }}>
      <header className="topbar">
        <Link className="brand" href={user ? HOME[user.role] : '/login'} aria-label="FoodHub home">
          <span className="brand-mark">F</span>
          <span className="brand-text"><b>FoodHub</b><small>Multi-vendor food delivery</small></span>
        </Link>
        {user && (
          <nav className="links" aria-label="Main">
            {NAV[user.role].map(([href, label]) => (
              <Link key={href} href={href}
                className={pathname === href || (href !== HOME[user.role] && pathname.startsWith(href)) ? 'active' : ''}>{label}</Link>
            ))}
            {user.role === 'customer' && cartCount > 0 && (
              <Link href={`/customer/restaurant/${cart.restaurantId}`} className="chip accent" style={{ alignSelf: 'center' }}>
                🛒 {cartCount} · {cart.restaurantName}
              </Link>
            )}
          </nav>
        )}
        <div className="topbar-right">
          {user && (
            <div className="who">
              <div style={{ textAlign: 'right' }}><div className="role">{ROLE_LABEL[user.role]}</div><b>{user.name}</b></div>
              <button className="btn sm" onClick={logout}>Log out</button>
            </div>
          )}
          <div className="db-status" title="Database connections">{dot(db.mysql)}MySQL {dot(db.mongodb)}MongoDB</div>
        </div>
      </header>
      <main className="view">{children}</main>
      <div className="toasts" aria-live="polite">
        {toasts.map(t => <div key={t.id} className={`toast ${t.kind === 'err' ? 'err' : ''}`}>{t.msg}</div>)}
      </div>
    </AppCtx.Provider>
  );
}
