'use client';
// Customer: search restaurants (key query 1, MySQL full-text search)
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, money, look, bannerStyle, Rating } from '@/components/kit';
import { useApp, useRequireRole } from '@/components/Shell';

export default function Browse() {
  const user = useRequireRole('customer');
  const { toast } = useApp();
  const [meta, setMeta] = useState(null);
  const [f, setF] = useState({ city: 'Bengaluru', cuisine: '', q: '', maxPrice: '', minRating: '', veg: false, openNow: false });
  const [rows, setRows] = useState(null);

  useEffect(() => { if (user) api('/meta').then(setMeta).catch(e => toast(e.message, 'err')); }, [user, toast]);

  useEffect(() => {
    if (!user) return;
    const t = setTimeout(() => {
      const p = new URLSearchParams();
      for (const [k, v] of Object.entries(f)) if (v) p.set(k, v === true ? '1' : v);
      api('/restaurants?' + p).then(setRows).catch(e => toast(e.message, 'err'));
    }, 250);
    return () => clearTimeout(t);
  }, [user, f, toast]);

  if (!user || !meta) return <div className="loading">Loading…</div>;
  const set = k => e => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  return (
    <>
      <section className="hero">
        <div><h1>Hungry, {user.name.split(' ')[0]}? Good food is minutes away.</h1>
          <p>Search dishes or restaurants – try “paneer”, “biryani” or “dosa”. Powered by MySQL full-text search.</p></div>
        <div className="search"><input type="text" placeholder="Search dishes, restaurants or cuisines…" value={f.q} onChange={set('q')} aria-label="Search" /></div>
      </section>
      <div className="filters">
        <select value={f.city} onChange={set('city')} aria-label="City">{meta.cities.map(c => <option key={c}>{c}</option>)}</select>
        <select value={f.cuisine} onChange={set('cuisine')} aria-label="Cuisine"><option value="">All cuisines</option>{meta.cuisines.map(c => <option key={c}>{c}</option>)}</select>
        <select value={f.maxPrice} onChange={set('maxPrice')} aria-label="Maximum item price">
          {[['', 'Any price'], [100, 'Items under ₹100'], [200, 'Under ₹200'], [300, 'Under ₹300'], [500, 'Under ₹500']].map(([v, t]) => <option key={v} value={v}>{t}</option>)}
        </select>
        <select value={f.minRating} onChange={set('minRating')} aria-label="Minimum rating">
          {[['', 'Any rating'], [3.5, '3.5+ ★'], [4, '4.0+ ★'], [4.5, '4.5+ ★']].map(([v, t]) => <option key={v} value={v}>{t}</option>)}
        </select>
        <label className="switch"><input type="checkbox" checked={f.veg} onChange={set('veg')} />Veg only</label>
        <label className="switch"><input type="checkbox" checked={f.openNow} onChange={set('openNow')} />Open now</label>
      </div>
      <div className="results-meta">{rows ? `${rows.length} restaurant${rows.length === 1 ? '' : 's'} in ${f.city}` : 'Searching…'}</div>
      <div className="rest-grid">
        {rows?.map(r => (
          <Link key={r.restaurant_id} className={`card rest-card ${r.is_open_now ? '' : 'closed'}`} href={`/customer/restaurant/${r.restaurant_id}`}>
            <div className="banner" style={bannerStyle(r.cuisine_type)}>{look(r.cuisine_type)[0]}
              {r.is_open_now ? <span className="chip green">Open now</span> : <span className="chip">Closed</span>}</div>
            <div className="body">
              <div className="row between"><h3>{r.name}</h3><Rating r={r.rating} /></div>
              <div className="meta"><span>{r.cuisine_type} · {r.address_line.split(',').pop().trim()}</span><span>{r.opening_time}–{r.closing_time}</span></div>
              {r.matched_dishes && <div className="small" style={{ color: 'var(--accent-ink)' }}>Matches: {r.matched_dishes}</div>}
              <div className="meta"><span>{r.matching_items} item{r.matching_items === 1 ? '' : 's'} match</span><span>from <b>{money(r.from_price)}</b></span></div>
            </div>
          </Link>
        ))}
        {rows && !rows.length && <div className="empty card">No restaurants match. Try removing a filter.</div>}
      </div>
    </>
  );
}
