import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  AlertTriangle, Plus, RefreshCw, Shield, Wrench, Heart,
  Search, MessageSquare, Eye, Clock, CheckCircle, X
} from 'lucide-react';

const severityBadges = { low: 'badge-info', medium: 'badge-warning', high: 'badge-danger', critical: 'badge-danger' };
const statusBadges = { reported: 'badge-warning', assigned: 'badge-info', in_progress: 'badge-primary', resolved: 'badge-success', closed: 'badge-muted', escalated: 'badge-danger' };

const typeIcons = {
  medical: Heart, security: Shield, maintenance: Wrench,
  lost_item: Search, complaint: MessageSquare, safety: Shield,
  crowd: AlertTriangle, other: AlertTriangle
};

export default function IncidentsPage() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [form, setForm] = useState({ incidentType: 'maintenance', severity: 'low', title: '', description: '' });

  useEffect(() => {
    api.getEvents('upcoming=true').then(evts => {
      setEvents(evts);
      if (evts.length > 0) setSelectedEvent(evts[0].event_id);
      else setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => { if (selectedEvent) loadIncidents(); }, [selectedEvent]);

  const loadIncidents = async () => {
    try { setIncidents(await api.getIncidents(`eventId=${selectedEvent}`)); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const createIncident = async () => {
    if (!form.title) return alert('Title is required');
    try {
      await api.createIncident({ ...form, eventId: selectedEvent });
      setShowCreate(false);
      setForm({ incidentType: 'maintenance', severity: 'low', title: '', description: '' });
      loadIncidents();
    } catch (err) { alert(err.message); }
  };

  const updateIncident = async (id, data) => {
    try { await api.updateIncident(id, data); loadIncidents(); }
    catch (err) { alert(err.message); }
  };

  const activeStatuses = ['reported', 'assigned', 'in_progress', 'escalated'];
  const filtered = filter === 'active' ? incidents.filter(i => activeStatuses.includes(i.status))
    : filter === 'resolved' ? incidents.filter(i => ['resolved', 'closed'].includes(i.status))
    : incidents;

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Incidents</h1>
          <p className="subtitle">Track and manage venue incidents</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {events.length > 1 && (
            <select className="form-select" style={{ width: 'auto' }} value={selectedEvent}
              onChange={e => { setSelectedEvent(e.target.value); setLoading(true); }}>
              {events.map(e => <option key={e.event_id} value={e.event_id}>{e.name}</option>)}
            </select>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
            <Plus size={14} /> Report Incident
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Summary */}
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-icon danger"><AlertTriangle size={20} /></div>
            <div className="stat-label">Active Incidents</div>
            <div className="stat-value">{incidents.filter(i => activeStatuses.includes(i.status)).length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon warning"><Clock size={20} /></div>
            <div className="stat-label">Critical/High</div>
            <div className="stat-value">
              {incidents.filter(i => ['critical', 'high'].includes(i.severity) && activeStatuses.includes(i.status)).length}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon success"><CheckCircle size={20} /></div>
            <div className="stat-label">Resolved Today</div>
            <div className="stat-value">{incidents.filter(i => i.status === 'resolved' || i.status === 'closed').length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon primary"><Shield size={20} /></div>
            <div className="stat-label">Total Reported</div>
            <div className="stat-value">{incidents.length}</div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {['active', 'resolved', 'all'].map(f => (
            <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>
              {f}
            </button>
          ))}
        </div>

        {/* Incident list */}
        {filtered.length === 0 ? (
          <div className="empty-state">
            <Shield size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
            <h3>No Incidents</h3>
            <p>{filter === 'active' ? 'No active incidents. The venue is running smoothly!' : 'No incidents match the current filter.'}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(incident => {
              const TypeIcon = typeIcons[incident.incident_type] || AlertTriangle;
              return (
                <div key={incident.incident_id} className="card" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 'var(--radius-sm)',
                      background: incident.severity === 'critical' ? 'var(--danger-bg)' : incident.severity === 'high' ? 'var(--warning-bg)' : 'var(--info-bg)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: incident.severity === 'critical' ? 'var(--danger)' : incident.severity === 'high' ? 'var(--warning)' : 'var(--info)',
                      flexShrink: 0
                    }}>
                      <TypeIcon size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700 }}>{incident.title}</h3>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <span className={`badge ${severityBadges[incident.severity]}`}>{incident.severity}</span>
                          <span className={`badge ${statusBadges[incident.status]}`}>{incident.status.replace(/_/g, ' ')}</span>
                        </div>
                      </div>
                      {incident.description && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>{incident.description}</p>}
                      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                        <span>Type: {incident.incident_type.replace(/_/g, ' ')}</span>
                        <span>Reported by: {incident.reporter_name}</span>
                        {incident.assignee_name && <span>Assigned to: {incident.assignee_name}</span>}
                        <span>{new Date(incident.reported_time).toLocaleString()}</span>
                      </div>

                      {activeStatuses.includes(incident.status) && (
                        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                          {incident.status === 'reported' && (
                            <button className="btn btn-sm btn-info" onClick={() => updateIncident(incident.incident_id, { status: 'in_progress' })}>
                              Start Working
                            </button>
                          )}
                          {(incident.status === 'in_progress' || incident.status === 'assigned') && (
                            <button className="btn btn-sm btn-success" onClick={() => updateIncident(incident.incident_id, { status: 'resolved' })}>
                              <CheckCircle size={14} /> Resolve
                            </button>
                          )}
                          {incident.severity !== 'critical' && (
                            <button className="btn btn-sm btn-danger" onClick={() => updateIncident(incident.incident_id, { severity: 'critical' })}>
                              Escalate
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create Incident Modal */}
        {showCreate && (
          <div className="modal-overlay" onClick={() => setShowCreate(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Report Incident</h2>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowCreate(false)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Incident Type</label>
                  <select className="form-select" value={form.incidentType} onChange={e => setForm({ ...form, incidentType: e.target.value })}>
                    {['medical', 'security', 'maintenance', 'lost_item', 'complaint', 'safety', 'crowd', 'other'].map(t => (
                      <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Severity</label>
                  <select className="form-select" value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}>
                    {['low', 'medium', 'high', 'critical'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Brief title" />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Detailed description" />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={createIncident}>Report Incident</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
