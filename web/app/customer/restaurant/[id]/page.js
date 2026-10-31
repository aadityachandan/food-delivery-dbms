'use client';
// Customer: menu, cart, coupon, bill preview and checkout (stored procedure)
import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, money, look, bannerStyle, Rating, Veg } from '@/components/kit';
import { useApp, useRequireRole } from '@/components/Shell';

const METHODS = [['UPI', 'UPI'], ['CARD', 'Credit / debit card'], ['NET_BANKING', 'Net banking'], ['WALLET', 'Wallet'], ['COD', 'Cash on delivery']];

export default function RestaurantPage({ params }) {
  const { id } = use(params);
  const rid = Number(id);
  const user = useRequireRole('customer');
  const { toast, cart, setCart, EMPTY_CART } = useApp();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState(null);
  const [coupon, setCoupon] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [payment, setPayment] = useState('UPI');
  const [note, setNote] = useState('');
  const [quote, setQuote] = useState(null);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (!user) return;
    api('/restaurants/' + rid).then(setData).catch(e => toast(e.message, 'err'));
    api('/customer/addresses').then(a => { setAddresses(a); setAddressId(a[0]?.address_id ?? null); }).catch(() => {});
  }, [user, rid, toast]);

  const inThisCart = cart.restaurantId === rid;
  const items = inThisCart ? Object.entries(cart.items) : [];

  // bill preview: same stored functions the order procedure uses
  const refreshQuote = useCallback(async () => {
    if (!items.length) { setQuote(null); return; }
    const body = { restaurantId: rid, items: items.map(([itemId, it]) => ({ itemId: Number(itemId), qty: it.qty })) };
    try {
      setQuote(await api('/orders/quote', { method: 'POST', body: { ...body, couponCode: coupon || undefined } }));
      setCouponError('');
    } catch (e) {
      setCouponError(e.message);
      if (coupon) { try { setQuote(await api('/orders/quote', { method: 'POST', body })); } catch { setQuote(null); } }
    }
  }, [JSON.stringify(items), coupon, rid]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { refreshQuote(); }, [refreshQuote]);

  if (!user || !data) return <div className="loading">Loading…</div>;
  const r = data.restaurant;
  const cats = [...new Set(data.menu.map(m => m.category))];

  function change(m, delta) {
    if (delta > 0 && cart.restaurantId && cart.restaurantId !== rid && Object.keys(cart.items).length) {
      if (!confirm(`Your cart has items from ${cart.restaurantName}. Start a new cart from ${r.name}?`)) return;
      setCoupon('');
    }
    setCart(prev => {
      const base = prev.restaurantId === rid ? prev : { ...EMPTY_CART, restaurantId: rid, restaurantName: r.name };
      const itemsNext = { ...base.items };
      const cur = itemsNext[m.item_id] || { name: m.name, price: m.price, is_veg: m.is_veg, qty: 0 };
      const qty = cur.qty + delta;
      if (qty <= 0) delete itemsNext[m.item_id]; else itemsNext[m.item_id] = { ...cur, qty };
      return Object.keys(itemsNext).length
        ? { restaurantId: rid, restaurantName: r.name, isOpen: !!r.is_open_now, items: itemsNext }
        : EMPTY_CART;
    });
  }

  async function placeOrder() {
    if (!addressId) return toast('Add a delivery address first', 'err');
    setPlacing(true);
    try {
      const res = await api('/orders', {
        method: 'POST', body: {
          restaurantId: rid, addressId, paymentMethod: payment, instructions: note,
          couponCode: quote?.coupon_code || undefined,
          items: items.map(([itemId, it]) => ({ itemId: Number(itemId), qty: it.qty })),
        },
      });
      setCart(EMPTY_CART);
      toast('Order placed!');
      router.push('/customer/orders/' + res.orderId);
    } catch (e) { toast(e.message, 'err'); setPlacing(false); }
  }

  const qtyOf = itemId => (inThisCart && cart.items[itemId]?.qty) || 0;
  const Stepper = ({ m }) => (
    <span className="stepper">
      <button onClick={() => change(m, -1)} aria-label={`Remove one ${m.name}`}>−</button>
      <span>{qtyOf(m.item_id)}</span>
      <button onClick={() => change(m, 1)} aria-label={`Add one ${m.name}`}>+</button>
    </span>
  );

  return (
    <div className="rest-layout">
      <div className="stack">
        <Link href="/customer" className="muted small">← All restaurants</Link>
        <div className="card rest-head">
          <div className="banner" style={bannerStyle(r.cuisine_type)}>{look(r.cuisine_type)[0]}</div>
          <div className="info">
            <div className="row between"><h1>{r.name}</h1><Rating r={r.rating} /></div>
            <div className="muted">{r.cuisine_type} · {r.address_line}, {r.city}</div>
            <div className="row">{r.is_open_now ? <span className="chip green">Open now</span> : <span className="chip red">Closed now</span>}
              <span className="small muted">Hours {r.opening_time}–{r.closing_time}</span></div>
          </div>
        </div>
        {data.coupons.length > 0 && (
          <div><h3 style={{ marginBottom: 8 }}>Offers</h3>
            <div className="coupons">{data.coupons.map(c => (
              <button key={c.code} className="coupon" onClick={() => { setCoupon(c.code); setCouponInput(c.code); }}>
                <b>{c.code}</b><div>{c.description}{c.min_order_value > 0 ? ` · min ${money(c.min_order_value)}` : ''}</div>
              </button>))}</div>
          </div>
        )}
        <div className="card pad">
          {cats.map(cat => (
            <div className="menu-cat" key={cat}><h3>{cat}</h3>
              {data.menu.filter(m => m.category === cat).map(m => (
                <div key={m.item_id} className={`menu-item ${m.is_available ? '' : 'off'}`}>
                  <Veg v={m.is_veg} />
                  <div className="grow"><b>{m.name}</b><span className="small muted">{m.description}</span><span className="num">{money(m.price)}</span></div>
                  {!m.is_available ? <span className="chip">Out of stock</span>
                    : qtyOf(m.item_id) ? <Stepper m={m} />
                    : <button className="btn sm" onClick={() => change(m, 1)}>Add</button>}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <aside className="card pad cart">
        {!items.length ? (
          <><h2>Your cart</h2><p className="muted">{cart.restaurantId && cart.restaurantId !== rid
            ? <>Your cart has items from <Link href={`/customer/restaurant/${cart.restaurantId}`}>{cart.restaurantName}</Link>.</>
            : 'Add dishes from the menu to start an order.'}</p></>
        ) : (
          <div className="stack">
            <div><h2>Your cart</h2><div className="small muted">from {r.name}</div></div>
            <div>{items.map(([itemId, it]) => (
              <div className="cart-line" key={itemId}><Veg v={it.is_veg} />
                <div className="grow">{it.name}<div className="small muted">{money(it.price)} each</div></div>
                <Stepper m={{ item_id: Number(itemId), name: it.name, price: it.price, is_veg: it.is_veg }} />
              </div>))}</div>
            <label className="field">Deliver to
              {addresses.length ? (
                <select value={addressId ?? ''} onChange={e => setAddressId(Number(e.target.value))}>
                  {addresses.map(a => <option key={a.address_id} value={a.address_id}>{a.label} · {a.address_line}, {a.city}</option>)}
                </select>
              ) : <Link href="/customer/addresses">Add an address</Link>}
            </label>
            <div className="field"><span>Coupon</span>
              <div className="row" style={{ flexWrap: 'nowrap' }}>
                <input type="text" placeholder="Enter code" value={couponInput} onChange={e => setCouponInput(e.target.value.toUpperCase())}
                  onKeyDown={e => { if (e.key === 'Enter') setCoupon(couponInput.trim()); }} style={{ flex: 1, minWidth: 0 }} />
                <button className="btn sm" onClick={() => setCoupon(couponInput.trim())}>Apply</button>
                {coupon && <button className="btn sm danger" onClick={() => { setCoupon(''); setCouponInput(''); }}>Remove</button>}
              </div>
              {couponError && <div className="error-text">{couponError}</div>}
            </div>
            <label className="field">Payment
              <select value={payment} onChange={e => setPayment(e.target.value)}>{METHODS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select>
            </label>
            <label className="field">Note for the restaurant<textarea value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. less spicy" maxLength={255} /></label>
            {quote ? (
              <div className="bill">
                <div><span>Item total</span><span className="num">{money(quote.subtotal)}</span></div>
                {quote.discount_amount > 0 && <div className="save"><span>Coupon {quote.coupon_code}</span><span className="num">−{money(quote.discount_amount)}</span></div>}
                <div><span>Delivery fee</span><span className="num">{quote.delivery_fee ? money(quote.delivery_fee) : <span className="save">Free</span>}</span></div>
                <div><span>GST (5%)</span><span className="num">{money(quote.tax_amount)}</span></div>
                <div className="total"><span>To pay</span><span className="num">{money(quote.total_amount)}</span></div>
                {quote.delivery_fee > 0 && <div className="small muted">Add {money(500 - quote.subtotal)} more for free delivery</div>}
              </div>
            ) : <div className="bill"><div className="muted">Calculating bill…</div></div>}
            <button className="btn primary block" onClick={placeOrder} disabled={placing || !r.is_open_now}>{placing ? 'Placing order…' : 'Place order'}</button>
            {!r.is_open_now && <div className="notice">This restaurant is closed right now.</div>}
            <div className="small muted">Placed by the stored procedure <code className="inline">sp_place_order</code> in one transaction.</div>
          </div>
        )}
      </aside>
    </div>
  );
}
