import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Calendar, MapPin, Users, Clock, Play, Pause, CheckCircle, XCircle, ChevronRight } from 'lucide-react';

const statusConfig = {
  scheduled: { badge: 'badge-info', icon: Calendar },
  gates_open: { badge: 'badge-warning', icon: Clock },
  in_progress: { badge: 'badge-success', icon: Play },
  halftime: { badge: 'badge-warning', icon: Pause },
  completed: { badge: 'badge-muted', icon: CheckCircle },
  cancelled: { badge: 'badge-danger', icon: XCircle },
  postponed: { badge: 'badge-danger', icon: Clock },
};

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { loadEvents(); }, []);

  const loadEvents = async () => {
    try {
      const data = await api.getEvents();
      setEvents(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const filtered = filter === 'all' ? events : events.filter(e => e.status === filter);

  const handleStatusChange = async (eventId, status) => {
    try {
      await api.updateEventStatus(eventId, status);
      loadEvents();
    } catch (err) { alert(err.message); }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Events</h1>
          <p className="subtitle">Manage venue events and their status</p>
        </div>
      </div>

      <div className="page-body">
        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
          {['all', 'scheduled', 'gates_open', 'in_progress', 'halftime', 'completed', 'cancelled'].map(f => (
            <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>
              {f.replace(/_/g, ' ')} {f === 'all' ? `(${events.length})` : `(${events.filter(e => e.status === f).length})`}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <Calendar size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
            <h3>No Events Found</h3>
            <p>No events match the current filter.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filtered.map(event => {
              const cfg = statusConfig[event.status] || statusConfig.scheduled;
              const StatusIcon = cfg.icon;
              const eventDate = new Date(event.event_date);
              return (
                <div key={event.event_id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'stretch' }}>
                    {/* Date accent */}
                    <div style={{
                      width: 80, minHeight: '100%',
                      background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      padding: 16, flexShrink: 0
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', opacity: 0.8 }}>
                        {eventDate.toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                      <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1 }}>
                        {eventDate.getDate()}
                      </div>
                      <div style={{ fontSize: 11, opacity: 0.7 }}>
                        {eventDate.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                    </div>

                    {/* Event details */}
                    <div style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700 }}>{event.name}</h3>
                        <span className={`badge ${cfg.badge}`}>
                          <StatusIcon size={12} style={{ marginRight: 4 }} />{event.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      {event.description && <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{event.description}</p>}
                      <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={14} /> {event.venue_name}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={14} /> {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {event.end_time && ` – ${new Date(event.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Users size={14} /> {event.expected_attendance?.toLocaleString() || '—'} expected
                        </span>
                      </div>

                      {/* Status controls */}
                      {event.status !== 'completed' && event.status !== 'cancelled' && (
                        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                          {event.status === 'scheduled' && (
                            <button className="btn btn-sm btn-success" onClick={() => handleStatusChange(event.event_id, 'gates_open')}>
                              Open Gates
                            </button>
                          )}
                          {event.status === 'gates_open' && (
                            <button className="btn btn-sm btn-success" onClick={() => handleStatusChange(event.event_id, 'in_progress')}>
                              <Play size={14} /> Start Event
                            </button>
                          )}
                          {event.status === 'in_progress' && (
                            <>
                              <button className="btn btn-sm btn-warning" onClick={() => handleStatusChange(event.event_id, 'halftime')}>
                                <Pause size={14} /> Halftime
                              </button>
                              <button className="btn btn-sm btn-secondary" onClick={() => handleStatusChange(event.event_id, 'completed')}>
                                <CheckCircle size={14} /> End Event
                              </button>
                            </>
                          )}
                          {event.status === 'halftime' && (
                            <button className="btn btn-sm btn-success" onClick={() => handleStatusChange(event.event_id, 'in_progress')}>
                              <Play size={14} /> Resume
                            </button>
                          )}
                          <button className="btn btn-sm btn-ghost" style={{ color: 'var(--danger)' }}
                            onClick={() => handleStatusChange(event.event_id, 'cancelled')}>
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
