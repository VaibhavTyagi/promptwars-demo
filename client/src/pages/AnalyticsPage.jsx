import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { BarChart3, RefreshCw, TrendingUp, Clock, DollarSign, Users } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const chartTooltipStyle = {
  background: '#1a1a3e',
  border: '1px solid rgba(148,163,184,0.1)',
  borderRadius: 12,
  color: '#f1f5f9',
  fontSize: 13
};

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [revenue, setRevenue] = useState(null);
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

  useEffect(() => { if (selectedEvent) loadAnalytics(); }, [selectedEvent]);

  const loadAnalytics = async () => {
    try {
      const [analyticsData, revenueData] = await Promise.all([
        api.getAnalytics(selectedEvent),
        api.getRevenue(selectedEvent)
      ]);
      setAnalytics(analyticsData);
      setRevenue(revenueData);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  if (!analytics) {
    return (
      <>
        <div className="page-header">
          <h1>Analytics</h1>
          <p className="subtitle">No analytics data available yet.</p>
        </div>
        <div className="page-body">
          <div className="empty-state">
            <BarChart3 size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
            <h3>No Data Available</h3>
            <p>Analytics will populate as events run and data is collected.</p>
          </div>
        </div>
      </>
    );
  }

  // Process wait time trends grouped by amenity type
  const waitByType = {};
  (analytics.waitTrends || []).forEach(w => {
    const key = w.amenity_type;
    if (!waitByType[key]) waitByType[key] = [];
    waitByType[key].push({ time: new Date(w.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), wait: w.estimated_wait_minutes, name: w.amenity_name });
  });

  // Process density trends
  const densityByZone = {};
  (analytics.densityTrends || []).forEach(d => {
    const key = d.zone_name;
    if (!densityByZone[key]) densityByZone[key] = [];
    densityByZone[key].push({ time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), count: d.person_count, density: d.density });
  });

  // Revenue by vendor
  const revenueByVendor = revenue?.byAmenity || [];

  // Feedback summary
  const feedbackData = (analytics.feedback || []).map(f => ({
    name: f.type, rating: +(f.avg_rating || 0).toFixed(1), count: f.count
  }));

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Analytics</h1>
          <p className="subtitle">Event intelligence and performance insights</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {events.length > 1 && (
            <select className="form-select" style={{ width: 'auto' }} value={selectedEvent}
              onChange={e => { setSelectedEvent(e.target.value); setLoading(true); }}>
              {events.map(e => <option key={e.event_id} value={e.event_id}>{e.name}</option>)}
            </select>
          )}
          <button className="btn btn-secondary btn-sm" onClick={() => { setLoading(true); loadAnalytics(); }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Revenue section */}
        <div className="grid-2" style={{ marginBottom: 24 }}>
          {/* Revenue by vendor */}
          <div className="card">
            <div className="card-header">
              <span className="card-title"><DollarSign size={16} style={{ marginRight: 4, verticalAlign: -2 }} />Revenue by Vendor</span>
            </div>
            <div className="card-body">
              {revenueByVendor.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={revenueByVendor} layout="vertical" margin={{ left: 20 }}>
                    <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={120} />
                    <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => [`$${v.toFixed(2)}`, 'Revenue']} />
                    <Bar dataKey="total_revenue" fill="#6366f1" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state"><p>No revenue data yet</p></div>
              )}
            </div>
          </div>

          {/* Orders by vendor (pie) */}
          <div className="card">
            <div className="card-header">
              <span className="card-title"><Users size={16} style={{ marginRight: 4, verticalAlign: -2 }} />Orders by Vendor</span>
            </div>
            <div className="card-body">
              {revenueByVendor.length > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <ResponsiveContainer width="55%" height={280}>
                    <PieChart>
                      <Pie data={revenueByVendor} cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                        dataKey="order_count" paddingAngle={3} nameKey="name">
                        {revenueByVendor.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={chartTooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                    {revenueByVendor.map((v, i) => (
                      <div key={v.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                        <span style={{ color: 'var(--text-secondary)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.name}</span>
                        <span style={{ fontWeight: 700 }}>{v.order_count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="empty-state"><p>No order data yet</p></div>
              )}
            </div>
          </div>
        </div>

        {/* Wait time trends */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <span className="card-title"><Clock size={16} style={{ marginRight: 4, verticalAlign: -2 }} />Wait Time Trends</span>
            <span className="badge badge-info">{(analytics.waitTrends || []).length} data points</span>
          </div>
          <div className="card-body">
            {(analytics.waitTrends || []).length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={(analytics.waitTrends || []).slice(0, 50).reverse().map(w => ({
                  time: new Date(w.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  wait: w.estimated_wait_minutes,
                  amenity: w.amenity_name
                }))}>
                  <defs>
                    <linearGradient id="waitGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} unit=" min" />
                  <Tooltip contentStyle={chartTooltipStyle} labelFormatter={(l) => `Time: ${l}`} />
                  <Area type="monotone" dataKey="wait" stroke="#6366f1" strokeWidth={2} fill="url(#waitGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state"><p>No wait time trend data available</p></div>
            )}
          </div>
        </div>

        {/* Density trends & Feedback */}
        <div className="grid-2">
          {/* Density trends */}
          <div className="card">
            <div className="card-header">
              <span className="card-title"><TrendingUp size={16} style={{ marginRight: 4, verticalAlign: -2 }} />Crowd Density Trends</span>
            </div>
            <div className="card-body">
              {(analytics.densityTrends || []).length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={(analytics.densityTrends || []).slice(0, 50).reverse().map(d => ({
                    time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    count: d.person_count,
                    zone: d.zone_name
                  }))}>
                    <defs>
                      <linearGradient id="densityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Area type="monotone" dataKey="count" stroke="#06b6d4" strokeWidth={2} fill="url(#densityGradient)" name="People" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state"><p>No density trend data</p></div>
              )}
            </div>
          </div>

          {/* Feedback summary */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Feedback & Ratings</span>
            </div>
            <div className="card-body">
              {feedbackData.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {feedbackData.map(f => (
                    <div key={f.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                        <span style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{f.name}</span>
                        <span style={{ fontWeight: 700 }}>
                          {'★'.repeat(Math.round(f.rating))}{'☆'.repeat(5 - Math.round(f.rating))} {f.rating}
                        </span>
                      </div>
                      <div className="density-bar" style={{ height: 6 }}>
                        <div className="density-fill normal" style={{ width: `${(f.rating / 5) * 100}%` }} />
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{f.count} reviews</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state" style={{ padding: 24 }}>
                  <p>No feedback data yet</p>
                  <p style={{ fontSize: 12, marginTop: 8 }}>Feedback will appear as attendees submit reviews.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
