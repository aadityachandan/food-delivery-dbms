'use client';
// Admin: Query lab - important SQL queries (live results) and MongoDB aggregations
import { useEffect, useState } from 'react';
import { api, DataTable } from '@/components/kit';
import { useApp, useRequireRole } from '@/components/Shell';

export default function ReportsPage() {
  const user = useRequireRole('admin');
  const { toast } = useApp();
  const [sql, setSql] = useState(null);
  const [mongo, setMongo] = useState(null);
  const [tab, setTab] = useState('sql');
  const [pick, setPick] = useState(0);

  useEffect(() => {
    if (!user) return;
    api('/admin/reports').then(setSql).catch(e => toast(e.message, 'err'));
    api('/admin/analytics').then(setMongo).catch(e => toast(e.message, 'err'));
  }, [user, toast]);
  if (!user || !sql) return <div className="loading">Loading…</div>;
  const list = tab === 'sql' ? sql : (mongo?.results || []);
  const cur = list[Math.min(pick, list.length - 1)];

  return (
    <>
      <div className="section-title"><h1>Query lab</h1><span className="muted">live results from the databases</span></div>
      <div className="tabs">
        <button className={tab === 'sql' ? 'on' : ''} onClick={() => { setTab('sql'); setPick(0); }}>MySQL queries ({sql.length})</button>
        <button className={tab === 'mongo' ? 'on' : ''} onClick={() => { setTab('mongo'); setPick(0); }}>MongoDB aggregations ({mongo?.results.length ?? 0})</button>
      </div>
      {tab === 'mongo' && mongo && !mongo.connected && <div className="notice red">MongoDB is not connected.</div>}
      {cur && (
        <div className="grid" style={{ gridTemplateColumns: '280px 1fr', alignItems: 'start' }}>
          <div className="card" style={{ padding: 8 }}>
            {list.map((q, i) => (
              <button key={q.id} onClick={() => setPick(i)} className="btn block"
                style={{ justifyContent: 'flex-start', textAlign: 'left', border: 0, background: i === pick ? 'var(--accent-soft)' : 'transparent', color: i === pick ? 'var(--accent-ink)' : 'inherit', marginBottom: 2 }}>
                <span><b>{q.title}</b><br /><span className="small muted">{q.concept || q.collection}</span></span>
              </button>))}
          </div>
          <div className="card pad stack">
            <div><h2>{cur.title}</h2><div className="small muted">{cur.concept || `collection: ${cur.collection}`}</div></div>
            <pre className="sql">{tab === 'sql' ? cur.sql : `db.${cur.collection}.aggregate(${JSON.stringify(cur.pipeline, null, 2)})`}</pre>
            {cur.error ? <div className="error-text">{cur.error}</div> : <>
              <div className="small muted">{cur.rows.length} row{cur.rows.length === 1 ? '' : 's'}</div>
              <DataTable rows={cur.rows} />
            </>}
          </div>
        </div>
      )}
    </>
  );
}
