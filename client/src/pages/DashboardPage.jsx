import { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  Users, Clock, AlertTriangle, DollarSign, TrendingUp, ShieldAlert,
  Activity, Zap, ArrowUpRight, ArrowDownRight, RefreshCw
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function DashboardPage() {
  const [overview, setOverview] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    api.getEvents('upcoming=true').then(evts => {
      setEvents(evts);
      if (evts.length > 0) setSelectedEvent(evts[0].event_id);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedEvent) { setLoading(false); return; }
    loadOverview();
  }, [selectedEvent]);

  const loadOverview = async () => {
    try {
      const data = await api.getDashboardOverview(selectedEvent);
      setOverview(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refresh = () => { setRefreshing(true); loadOverview(); };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  if (!overview) {
    return (
      <>
        <div className="page-header">
          <h1>Dashboard</h1>
          <p className="subtitle">No events available. Create an event to get started.</p>
        </div>
        <div className="page-body">
          <div className="empty-state">
            <Activity size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
            <h3>No Active Events</h3>
            <p>Head to Events to create or manage your venue events.</p>
          </div>
        </div>
      </>
    );
  }

  const { event, attendance, incidents, orders, waitTimes, crowdDensity, staff } = overview;
  const attendancePercent = attendance.expected > 0 ? Math.round((attendance.entered / attendance.expected) * 100) : 0;
  const totalStaff = staff.reduce((s, d) => s + d.count, 0);
  const activeIncidents = incidents.total || 0;

  const densityData = (crowdDensity || []).map(d => ({
    name: d.alert_level,
    value: d.zone_count
  }));

  const waitTimeData = (waitTimes || []).map(w => ({
    name: w.amenity_type === 'concession' ? 'Food' : 'Restroom',
    avg: Math.round(w.avg_wait || 0),
    max: Math.round(w.max_wait || 0)
  }));

  const statusBadge = (status) => {
    const map = {
      scheduled: 'badge-info',
      gates_open: 'badge-warning',
      in_progress: 'badge-success',
      halftime: 'badge-warning',
      completed: 'badge-muted',
      cancelled: 'badge-danger',
    };
    return <span className={`badge ${map[status] || 'badge-muted'}`}>{status.replace(/_/g, ' ')}</span>;
  };

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Dashboard</h1>
          <p className="subtitle">Real-time venue operations overview</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {events.length > 1 && (
            <select className="form-select" style={{ width: 'auto', minWidth: 200 }}
              value={selectedEvent} onChange={e => { setSelectedEvent(e.target.value); setLoading(true); }}>
              {events.map(e => <option key={e.event_id} value={e.event_id}>{e.name}</option>)}
            </select>
          )}
          <button className="btn btn-secondary btn-sm" onClick={refresh} disabled={refreshing}>
            <RefreshCw size={14} className={refreshing ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Event info bar */}
        <div className="card" style={{ marginBottom: 24, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{event.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{event.venue_name} · {new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
          </div>
          {statusBadge(event.status)}
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Gates: {event.gates_open_time ? new Date(event.gates_open_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
            {' · '}Start: {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* Stat cards */}
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-icon primary"><Users size={20} /></div>
            <div className="stat-label">Attendance</div>
            <div className="stat-value">{attendance.entered.toLocaleString()}</div>
            <div className="stat-change up">
              <ArrowUpRight size={14} /> {attendancePercent}% of expected ({attendance.expected?.toLocaleString()})
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon success"><DollarSign size={20} /></div>
            <div className="stat-label">Revenue</div>
            <div className="stat-value">${(orders.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
            <div className="stat-change up">
              <TrendingUp size={14} /> From {(orders.byStatus || []).reduce((s, o) => s + o.count, 0)} orders
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon warning"><Clock size={20} /></div>
            <div className="stat-label">Avg Wait Time</div>
            <div className="stat-value">{waitTimes?.length ? Math.round(waitTimes.reduce((s, w) => s + (w.avg_wait || 0), 0) / waitTimes.length) : 0} min</div>
            <div className="stat-change">
              <Zap size={14} style={{ color: 'var(--accent)' }} /> Max: {waitTimes?.length ? Math.round(Math.max(...waitTimes.map(w => w.max_wait || 0))) : 0} min
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon danger"><AlertTriangle size={20} /></div>
            <div className="stat-label">Active Incidents</div>
            <div className="stat-value">{activeIncidents}</div>
            <div className="stat-change">
              <ShieldAlert size={14} style={{ color: 'var(--text-muted)' }} /> {(incidents.active || []).filter(i => i.severity === 'critical' || i.severity === 'high').reduce((s, i) => s + i.count, 0)} high/critical
            </div>
          </div>
        </div>

        {/* Charts row */}
        <div className="grid-2" style={{ marginBottom: 24 }}>
          {/* Wait Times Bar Chart */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Wait Times by Type</span>
              <span className="badge badge-info">Live</span>
            </div>
            <div className="card-body">
              {waitTimeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={waitTimeData} barGap={8}>
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} unit=" min" />
                    <Tooltip contentStyle={{ background: '#1a1a3e', border: '1px solid rgba(148,163,184,0.1)', borderRadius: 12, color: '#f1f5f9' }} />
                    <Bar dataKey="avg" name="Average" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="max" name="Maximum" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="empty-state"><p>No wait time data</p></div>}
            </div>
          </div>

          {/* Crowd Density Pie */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Crowd Density by Zone Alert</span>
              <span className="badge badge-info">Live</span>
            </div>
            <div className="card-body">
              {densityData.length > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                  <ResponsiveContainer width="60%" height={220}>
                    <PieChart>
                      <Pie data={densityData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                        {densityData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#1a1a3e', border: '1px solid rgba(148,163,184,0.1)', borderRadius: 12, color: '#f1f5f9' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {densityData.map((d, i) => (
                      <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: COLORS[i % COLORS.length] }} />
                        <span style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{d.name}</span>
                        <span style={{ fontWeight: 700, marginLeft: 'auto' }}>{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : <div className="empty-state"><p>No density data</p></div>}
            </div>
          </div>
        </div>

        {/* Staff & Orders row */}
        <div className="grid-2">
          {/* Staff on Duty */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Staff on Duty</span>
              <span className="badge badge-success">{totalStaff} active</span>
            </div>
            <div className="card-body">
              {staff.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {staff.map(dept => (
                    <div key={dept.department} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)', flex: 1, textTransform: 'capitalize' }}>
                        {dept.department.replace(/_/g, ' ')}
                      </span>
                      <div style={{ flex: 2 }}>
                        <div className="density-bar" style={{ height: 6 }}>
                          <div className="density-fill normal" style={{ width: `${Math.min((dept.count / totalStaff) * 100, 100)}%` }} />
                        </div>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 14, width: 30, textAlign: 'right' }}>{dept.count}</span>
                    </div>
                  ))}
                </div>
              ) : <div className="empty-state"><p>No staff on duty</p></div>}
            </div>
          </div>

          {/* Order Status */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Order Status</span>
              <span className="badge badge-primary">{(orders.byStatus || []).reduce((s, o) => s + o.count, 0)} total</span>
            </div>
            <div className="card-body">
              {(orders.byStatus || []).length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(orders.byStatus || []).map((s, i) => (
                    <div key={s.status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < (orders.byStatus.length - 1) ? '1px solid var(--border)' : 'none' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className={`badge badge-${s.status === 'completed' ? 'success' : s.status === 'cancelled' ? 'danger' : s.status === 'preparing' ? 'warning' : 'info'}`}>
                          {s.status}
                        </span>
                      </span>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700 }}>{s.count}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>${(s.revenue || 0).toFixed(0)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <div className="empty-state"><p>No orders yet</p></div>}
            </div>
          </div>
        </div>
      </div>

      <style>{`.spin { animation: spin 1s linear infinite; }`}</style>
    </>
  );
}
