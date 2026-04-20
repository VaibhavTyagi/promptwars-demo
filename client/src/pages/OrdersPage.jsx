import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { ShoppingBag, RefreshCw, CheckCircle, Clock, Flame, Package, XCircle, Eye } from 'lucide-react';

const statusBadges = {
  pending: 'badge-muted',
  confirmed: 'badge-info',
  preparing: 'badge-warning',
  ready: 'badge-success',
  completed: 'badge-primary',
  cancelled: 'badge-danger',
  refunded: 'badge-danger',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    api.getEvents('upcoming=true').then(evts => {
      setEvents(evts);
      if (evts.length > 0) setSelectedEvent(evts[0].event_id);
      else setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => { if (selectedEvent) loadOrders(); }, [selectedEvent]);

  const loadOrders = async () => {
    try { setOrders(await api.getVenueOrders(selectedEvent)); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleStatusChange = async (orderId, status) => {
    try {
      await api.updateOrderStatus(orderId, status);
      loadOrders();
      if (selectedOrder?.order_id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status }));
      }
    } catch (err) { alert(err.message); }
  };

  const viewOrder = async (orderId) => {
    setDetailLoading(true);
    try {
      const detail = await api.getOrder(orderId);
      setSelectedOrder(detail);
    } catch (err) { alert(err.message); }
    finally { setDetailLoading(false); }
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const statusIcon = (status) => {
    const icons = { pending: Clock, confirmed: CheckCircle, preparing: Flame, ready: Package, completed: CheckCircle, cancelled: XCircle };
    const Icon = icons[status] || Clock;
    return <Icon size={14} />;
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Orders</h1>
          <p className="subtitle">Mobile order management and fulfillment</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {events.length > 1 && (
            <select className="form-select" style={{ width: 'auto' }} value={selectedEvent}
              onChange={e => { setSelectedEvent(e.target.value); setLoading(true); }}>
              {events.map(e => <option key={e.event_id} value={e.event_id}>{e.name}</option>)}
            </select>
          )}
          <button className="btn btn-secondary btn-sm" onClick={() => { setLoading(true); loadOrders(); }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Summary stats */}
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-icon primary"><ShoppingBag size={20} /></div>
            <div className="stat-label">Total Orders</div>
            <div className="stat-value">{orders.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon warning"><Flame size={20} /></div>
            <div className="stat-label">In Progress</div>
            <div className="stat-value">{orders.filter(o => ['confirmed', 'preparing'].includes(o.status)).length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon success"><Package size={20} /></div>
            <div className="stat-label">Ready for Pickup</div>
            <div className="stat-value">{orders.filter(o => o.status === 'ready').length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon info"><CheckCircle size={20} /></div>
            <div className="stat-label">Revenue</div>
            <div className="stat-value">
              ${orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.total || 0), 0).toFixed(0)}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
          {['all', 'pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'].map(f => (
            <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>
              {f} ({f === 'all' ? orders.length : orders.filter(o => o.status === f).length})
            </button>
          ))}
        </div>

        {/* Orders table */}
        {filtered.length === 0 ? (
          <div className="empty-state">
            <ShoppingBag size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
            <h3>No Orders</h3>
            <p>Orders will appear here as attendees place mobile orders.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Vendor</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => (
                  <tr key={order.order_id}>
                    <td style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: 13 }}>{order.order_number}</td>
                    <td>{order.first_name} {order.last_name}</td>
                    <td>{order.amenity_name}</td>
                    <td style={{ fontWeight: 700 }}>${order.total?.toFixed(2)}</td>
                    <td>
                      <span className={`badge ${statusBadges[order.status]}`}>
                        {statusIcon(order.status)} {order.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(order.order_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => viewOrder(order.order_id)} title="View Details">
                          <Eye size={14} />
                        </button>
                        {order.status === 'confirmed' && (
                          <button className="btn btn-warning btn-sm" onClick={() => handleStatusChange(order.order_id, 'preparing')}>
                            Prepare
                          </button>
                        )}
                        {order.status === 'preparing' && (
                          <button className="btn btn-success btn-sm" onClick={() => handleStatusChange(order.order_id, 'ready')}>
                            Ready
                          </button>
                        )}
                        {order.status === 'ready' && (
                          <button className="btn btn-primary btn-sm" onClick={() => handleStatusChange(order.order_id, 'completed')}>
                            Complete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Order detail modal */}
        {selectedOrder && (
          <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Order {selectedOrder.order_number}</h2>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedOrder(null)}>✕</button>
              </div>
              <div className="modal-body">
                {detailLoading ? <div className="loading-spinner"><div className="spinner" /></div> : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                      <span className={`badge ${statusBadges[selectedOrder.status]}`}>{selectedOrder.status}</span>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        {new Date(selectedOrder.order_time).toLocaleString()}
                      </span>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Vendor</div>
                      <div style={{ fontWeight: 600 }}>{selectedOrder.amenity_name}</div>
                    </div>

                    {selectedOrder.items && selectedOrder.items.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Items</div>
                        {selectedOrder.items.map((item, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                            <span>{item.quantity}x {item.name}</span>
                            <span style={{ fontWeight: 600 }}>${(item.unit_price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ borderTop: '2px solid var(--border)', paddingTop: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span>Subtotal</span><span>${selectedOrder.subtotal?.toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span>Tax</span><span>${selectedOrder.tax?.toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16 }}>
                        <span>Total</span><span>${selectedOrder.total?.toFixed(2)}</span>
                      </div>
                    </div>

                    {selectedOrder.special_instructions && (
                      <div className="alert alert-info" style={{ marginTop: 16, marginBottom: 0 }}>
                        <strong>Note:</strong> {selectedOrder.special_instructions}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
