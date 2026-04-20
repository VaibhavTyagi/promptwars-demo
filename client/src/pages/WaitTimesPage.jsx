import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Clock, RefreshCw, Utensils, Droplets, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function WaitTimesPage() {
  const [waitTimes, setWaitTimes] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.getEvents('upcoming=true').then(evts => {
      setEvents(evts);
      if (evts.length > 0) setSelectedEvent(evts[0].event_id);
      else setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedEvent) loadWaitTimes();
  }, [selectedEvent]);

  const loadWaitTimes = async () => {
    try {
      const data = await api.getWaitTimes(selectedEvent);
      setWaitTimes(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const getWaitColor = (mins) => mins <= 5 ? 'green' : mins <= 10 ? 'yellow' : 'red';
  const getWaitLabel = (mins) => mins <= 5 ? 'Short' : mins <= 10 ? 'Moderate' : 'Long';

  const filtered = filter === 'all' ? waitTimes : waitTimes.filter(w => w.amenity_type === filter);

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Wait Times</h1>
          <p className="subtitle">Real-time queue monitoring across all amenities</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {events.length > 1 && (
            <select className="form-select" style={{ width: 'auto' }} value={selectedEvent}
              onChange={e => { setSelectedEvent(e.target.value); setLoading(true); }}>
              {events.map(e => <option key={e.event_id} value={e.event_id}>{e.name}</option>)}
            </select>
          )}
          <button className="btn btn-secondary btn-sm" onClick={() => { setLoading(true); loadWaitTimes(); }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Summary cards */}
        <div className="stat-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-icon success"><Clock size={20} /></div>
            <div className="stat-label">Average Wait</div>
            <div className="stat-value">
              {waitTimes.length > 0 ? Math.round(waitTimes.reduce((s, w) => s + w.estimated_wait_minutes, 0) / waitTimes.length) : 0} min
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon danger"><TrendingUp size={20} /></div>
            <div className="stat-label">Longest Wait</div>
            <div className="stat-value">
              {waitTimes.length > 0 ? Math.max(...waitTimes.map(w => w.estimated_wait_minutes)) : 0} min
            </div>
            <div className="stat-change" style={{ color: 'var(--text-muted)' }}>
              {waitTimes.length > 0 && waitTimes.reduce((max, w) => w.estimated_wait_minutes > max.estimated_wait_minutes ? w : max, waitTimes[0]).amenity_name}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon warning"><Utensils size={20} /></div>
            <div className="stat-label">Concessions</div>
            <div className="stat-value">
              {waitTimes.filter(w => w.amenity_type === 'concession').length} active
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon info"><Droplets size={20} /></div>
            <div className="stat-label">Restrooms</div>
            <div className="stat-value">
              {waitTimes.filter(w => w.amenity_type === 'restroom').length} active
            </div>
          </div>
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {['all', 'concession', 'restroom'].map(f => (
            <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>
              {f === 'all' ? 'All' : f + 's'}
            </button>
          ))}
        </div>

        {/* Wait time cards */}
        {filtered.length === 0 ? (
          <div className="empty-state">
            <Clock size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
            <h3>No Wait Time Data</h3>
            <p>Wait times will appear here during active events.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {filtered.sort((a, b) => b.estimated_wait_minutes - a.estimated_wait_minutes).map(wt => {
              const color = getWaitColor(wt.estimated_wait_minutes);
              return (
                <div key={wt.record_id} className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{wt.amenity_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{wt.section} · {wt.amenity_type}</div>
                    </div>
                    <div className="wait-indicator">
                      <div className={`wait-dot ${color}`} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: color === 'green' ? 'var(--success)' : color === 'yellow' ? 'var(--warning)' : 'var(--danger)' }}>
                        {getWaitLabel(wt.estimated_wait_minutes)}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 12 }}>
                    <span style={{ fontSize: 36, fontWeight: 900, lineHeight: 1 }}>{wt.estimated_wait_minutes}</span>
                    <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>min</span>
                  </div>

                  <div className="density-bar" style={{ marginBottom: 12 }}>
                    <div className={`density-fill ${color === 'green' ? 'normal' : color === 'yellow' ? 'moderate' : 'high'}`}
                      style={{ width: `${Math.min((wt.estimated_wait_minutes / 20) * 100, 100)}%` }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                    <span>Queue: {wt.queue_length} people</span>
                    <span>Rate: {wt.service_rate}/min</span>
                  </div>

                  {wt.amenity_status !== 'open' && (
                    <div className="alert alert-warning" style={{ marginTop: 12, marginBottom: 0, padding: '8px 12px', fontSize: 12 }}>
                      Status: {wt.amenity_status}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
