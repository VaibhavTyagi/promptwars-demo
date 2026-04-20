import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Users, RefreshCw, Plus, UserCheck, Send, Clock, CheckCircle, MapPin } from 'lucide-react';

const deptColors = {
  operations: 'var(--primary)',
  security: 'var(--danger)',
  concessions: 'var(--warning)',
  maintenance: 'var(--info)',
  medical: '#ef4444',
  parking: 'var(--accent)',
  guest_services: 'var(--success)',
};

const assignStatusBadges = {
  pending: 'badge-warning',
  acknowledged: 'badge-info',
  in_progress: 'badge-primary',
  completed: 'badge-success',
  cancelled: 'badge-muted',
};

export default function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('staff');
  const [showAssign, setShowAssign] = useState(false);
  const [assignForm, setAssignForm] = useState({ staffId: '', taskDescription: '', priority: 'normal' });

  useEffect(() => {
    api.getEvents('upcoming=true').then(evts => {
      setEvents(evts);
      if (evts.length > 0) setSelectedEvent(evts[0].event_id);
      else setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => { if (selectedEvent) loadData(); }, [selectedEvent]);

  const loadData = async () => {
    try {
      const [staffData, assignData] = await Promise.all([
        api.getStaff(),
        api.getAssignments(selectedEvent)
      ]);
      setStaff(staffData);
      setAssignments(assignData);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleAssign = async () => {
    if (!assignForm.staffId || !assignForm.taskDescription) return alert('Staff and task required');
    try {
      await api.assignStaff({ ...assignForm, eventId: selectedEvent });
      setShowAssign(false);
      setAssignForm({ staffId: '', taskDescription: '', priority: 'normal' });
      loadData();
    } catch (err) { alert(err.message); }
  };

  const handleAssignmentStatus = async (id, status) => {
    try { await api.updateAssignment(id, status); loadData(); }
    catch (err) { alert(err.message); }
  };

  const onDutyStaff = staff.filter(s => s.is_on_duty);
  const activeAssignments = assignments.filter(a => !['completed', 'cancelled'].includes(a.status));

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Staff</h1>
          <p className="subtitle">Staff management and task assignments</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {events.length > 1 && (
            <select className="form-select" style={{ width: 'auto' }} value={selectedEvent}
              onChange={e => { setSelectedEvent(e.target.value); setLoading(true); }}>
              {events.map(e => <option key={e.event_id} value={e.event_id}>{e.name}</option>)}
            </select>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => setShowAssign(true)}>
            <Send size={14} /> Assign Task
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Summary */}
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-icon primary"><Users size={20} /></div>
            <div className="stat-label">Total Staff</div>
            <div className="stat-value">{staff.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon success"><UserCheck size={20} /></div>
            <div className="stat-label">On Duty</div>
            <div className="stat-value">{onDutyStaff.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon warning"><Send size={20} /></div>
            <div className="stat-label">Active Tasks</div>
            <div className="stat-value">{activeAssignments.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon info"><CheckCircle size={20} /></div>
            <div className="stat-label">Completed Tasks</div>
            <div className="stat-value">{assignments.filter(a => a.status === 'completed').length}</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          <button className={`btn btn-sm ${tab === 'staff' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setTab('staff')}>Staff ({staff.length})</button>
          <button className={`btn btn-sm ${tab === 'assignments' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setTab('assignments')}>Assignments ({assignments.length})</button>
        </div>

        {/* Staff list */}
        {tab === 'staff' && (
          staff.length === 0 ? (
            <div className="empty-state">
              <Users size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
              <h3>No Staff Records</h3>
              <p>Staff will appear here when registered in the system.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {staff.map(s => (
                <div key={s.staff_id} className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 'var(--radius-full)',
                      background: `linear-gradient(135deg, ${deptColors[s.department] || 'var(--primary)'}, var(--bg-elevated))`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, color: 'white', fontSize: 14
                    }}>
                      {s.first_name?.[0]}{s.last_name?.[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{s.first_name} {s.last_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.position}</div>
                    </div>
                    <div style={{ marginLeft: 'auto' }}>
                      <span className={`badge ${s.is_on_duty ? 'badge-success' : 'badge-muted'}`}>
                        {s.is_on_duty ? 'On Duty' : 'Off Duty'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                    <span style={{
                      padding: '4px 8px', borderRadius: 'var(--radius-sm)',
                      background: `${deptColors[s.department] || 'var(--primary)'}15`,
                      color: deptColors[s.department] || 'var(--primary)',
                      fontWeight: 600, textTransform: 'capitalize'
                    }}>
                      {s.department.replace(/_/g, ' ')}
                    </span>
                    {s.email && <span>{s.email}</span>}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Assignments list */}
        {tab === 'assignments' && (
          assignments.length === 0 ? (
            <div className="empty-state">
              <Send size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
              <h3>No Assignments</h3>
              <p>Create task assignments for staff from the button above.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {assignments.map(a => (
                <div key={a.assignment_id} className="card" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{a.task_description || 'Unnamed Task'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Assigned to: {a.first_name} {a.last_name}
                        {a.department && ` · ${a.department}`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <span className={`badge ${a.priority === 'urgent' ? 'badge-danger' : a.priority === 'high' ? 'badge-warning' : 'badge-muted'}`}>
                        {a.priority}
                      </span>
                      <span className={`badge ${assignStatusBadges[a.status]}`}>{a.status}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                    <span>Created: {new Date(a.assigned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {a.acknowledged_at && <span>Acknowledged: {new Date(a.acknowledged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                    {a.completed_at && <span>Completed: {new Date(a.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                  </div>
                  {!['completed', 'cancelled'].includes(a.status) && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      {a.status === 'pending' && (
                        <button className="btn btn-sm btn-info" onClick={() => handleAssignmentStatus(a.assignment_id, 'acknowledged')}>
                          Acknowledge
                        </button>
                      )}
                      {(a.status === 'acknowledged' || a.status === 'pending') && (
                        <button className="btn btn-sm btn-primary" onClick={() => handleAssignmentStatus(a.assignment_id, 'in_progress')}>
                          Start
                        </button>
                      )}
                      {a.status === 'in_progress' && (
                        <button className="btn btn-sm btn-success" onClick={() => handleAssignmentStatus(a.assignment_id, 'completed')}>
                          <CheckCircle size={14} /> Complete
                        </button>
                      )}
                      <button className="btn btn-sm btn-ghost" onClick={() => handleAssignmentStatus(a.assignment_id, 'cancelled')}>
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        {/* Assign Task Modal */}
        {showAssign && (
          <div className="modal-overlay" onClick={() => setShowAssign(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Assign Task</h2>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowAssign(false)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Staff Member</label>
                  <select className="form-select" value={assignForm.staffId} onChange={e => setAssignForm({ ...assignForm, staffId: e.target.value })}>
                    <option value="">Select staff...</option>
                    {staff.filter(s => s.is_on_duty).map(s => (
                      <option key={s.staff_id} value={s.staff_id}>{s.first_name} {s.last_name} ({s.department})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Task Description</label>
                  <textarea className="form-textarea" value={assignForm.taskDescription}
                    onChange={e => setAssignForm({ ...assignForm, taskDescription: e.target.value })} placeholder="Describe the task..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-select" value={assignForm.priority} onChange={e => setAssignForm({ ...assignForm, priority: e.target.value })}>
                    {['low', 'normal', 'high', 'urgent'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setShowAssign(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleAssign}>Assign Task</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
