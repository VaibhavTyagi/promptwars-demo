import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { MapPin, RefreshCw, AlertTriangle, Shield, Users, Activity } from 'lucide-react';

const alertConfig = {
  normal: { color: 'var(--success)', bg: 'var(--success-bg)', label: 'Normal', cssClass: 'normal' },
  moderate: { color: 'var(--warning)', bg: 'var(--warning-bg)', label: 'Moderate', cssClass: 'moderate' },
  high: { color: 'var(--danger)', bg: 'rgba(239,68,68,0.12)', label: 'High', cssClass: 'high' },
  critical: { color: '#dc2626', bg: 'rgba(220,38,38,0.15)', label: 'Critical', cssClass: 'critical' },
};

export default function CrowdDensityPage() {
  const [density, setDensity] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getEvents('upcoming=true').then(evts => {
      setEvents(evts);
      if (evts.length > 0) setSelectedEvent(evts[0].event_id);
      else setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedEvent) loadDensity();
  }, [selectedEvent]);

  const loadDensity = async () => {
    try { setDensity(await api.getCrowdDensity(selectedEvent)); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const totalPeople = density.reduce((s, d) => s + d.person_count, 0);
  const totalCapacity = density.reduce((s, d) => s + (d.zone_capacity || 0), 0);
  const criticalZones = density.filter(d => d.alert_level === 'critical' || d.alert_level === 'high').length;

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Crowd Density</h1>
          <p className="subtitle">Live crowd monitoring across venue zones</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {events.length > 1 && (
            <select className="form-select" style={{ width: 'auto' }} value={selectedEvent}
              onChange={e => { setSelectedEvent(e.target.value); setLoading(true); }}>
              {events.map(e => <option key={e.event_id} value={e.event_id}>{e.name}</option>)}
            </select>
          )}
          <button className="btn btn-secondary btn-sm" onClick={() => { setLoading(true); loadDensity(); }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Summary */}
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-icon primary"><Users size={20} /></div>
            <div className="stat-label">Total in Venue</div>
            <div className="stat-value">{totalPeople.toLocaleString()}</div>
            <div className="stat-change" style={{ color: 'var(--text-muted)' }}>
              of {totalCapacity.toLocaleString()} capacity ({totalCapacity > 0 ? Math.round((totalPeople / totalCapacity) * 100) : 0}%)
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon success"><Activity size={20} /></div>
            <div className="stat-label">Zones Monitored</div>
            <div className="stat-value">{density.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon danger"><AlertTriangle size={20} /></div>
            <div className="stat-label">High/Critical Zones</div>
            <div className="stat-value">{criticalZones}</div>
            {criticalZones > 0 && <div className="stat-change down">Needs attention</div>}
          </div>
          <div className="stat-card">
            <div className="stat-icon info"><Shield size={20} /></div>
            <div className="stat-label">Safety Status</div>
            <div className="stat-value" style={{ fontSize: 20 }}>
              {criticalZones === 0 ? '✅ Clear' : '⚠️ Alert'}
            </div>
          </div>
        </div>

        {/* Zone grid */}
        {density.length === 0 ? (
          <div className="empty-state">
            <MapPin size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
            <h3>No Density Data</h3>
            <p>Crowd density data will appear here during active events.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {density.sort((a, b) => b.density - a.density).map(zone => {
              const cfg = alertConfig[zone.alert_level] || alertConfig.normal;
              const fillPct = Math.min((zone.person_count / (zone.zone_capacity || 1)) * 100, 100);
              return (
                <div key={zone.record_id} className="card" style={{ padding: 20, borderLeft: `3px solid ${cfg.color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{zone.zone_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{zone.zone_type}</div>
                    </div>
                    <span className="badge" style={{ background: cfg.bg, color: cfg.color }}>
                      {cfg.label}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Occupancy</span>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{zone.person_count.toLocaleString()} / {(zone.zone_capacity || 0).toLocaleString()}</span>
                  </div>

                  <div className="density-bar" style={{ height: 10, marginBottom: 12 }}>
                    <div className={`density-fill ${cfg.cssClass}`} style={{ width: `${fillPct}%` }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                    <span>{Math.round(fillPct)}% full</span>
                    <span>Density: {zone.density} p/m²</span>
                  </div>

                  {(zone.alert_level === 'high' || zone.alert_level === 'critical') && (
                    <div className="alert alert-danger" style={{ marginTop: 12, marginBottom: 0, padding: '8px 12px', fontSize: 12 }}>
                      <AlertTriangle size={14} /> {zone.alert_level === 'critical' ? 'Critical density! Consider redirecting crowd.' : 'High density. Monitor closely.'}
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
