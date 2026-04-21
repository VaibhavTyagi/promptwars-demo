import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth, canAccess, ROLES } from '../context/AuthContext';
import {
  LayoutDashboard, Calendar, MapPin, Clock, ShoppingBag,
  AlertTriangle, Users, BarChart3, LogOut, Building2, Menu, X
} from 'lucide-react';
import { useState } from 'react';

const ALL_NAV_ITEMS = [
  { section: 'Overview', items: [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/events', icon: Calendar, label: 'Events' },
  ]},
  { section: 'Monitoring', items: [
    { path: '/wait-times', icon: Clock, label: 'Wait Times' },
    { path: '/crowd-density', icon: MapPin, label: 'Crowd Density' },
  ]},
  { section: 'Operations', items: [
    { path: '/orders', icon: ShoppingBag, label: 'Orders' },
    { path: '/incidents', icon: AlertTriangle, label: 'Incidents' },
    { path: '/staff', icon: Users, label: 'Staff' },
  ]},
  { section: 'Intelligence', items: [
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  ]},
];

// Role badge colors
const ROLE_COLORS = {
  admin: '#6366f1',
  manager: '#06b6d4',
  security: '#ef4444',
  vendor: '#f59e0b',
  attendee: '#10b981',
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Filter nav sections to only show accessible routes for this user's role
  const visibleSections = ALL_NAV_ITEMS.map(section => ({
    ...section,
    items: section.items.filter(item => canAccess(user?.role, item.path)),
  })).filter(section => section.items.length > 0);

  const roleColor = ROLE_COLORS[user?.role] || 'var(--primary)';
  const roleLabel = ROLES[user?.role]?.label || user?.role;

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="btn btn-ghost btn-icon"
        onClick={() => setOpen(!open)}
        style={{ position: 'fixed', top: 12, left: 12, zIndex: 200, display: 'none' }}
        id="sidebar-toggle"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Backdrop for mobile */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 149, display: 'none'
          }}
          id="sidebar-backdrop"
        />
      )}

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo"><Building2 size={20} /></div>
          <div>
            <div className="sidebar-title">VenueFlow</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Operations Hub</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {visibleSections.map(section => (
            <div className="nav-section" key={section.section}>
              <div className="nav-section-label">{section.section}</div>
              {section.items.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setOpen(false)}
                >
                  <item.icon className="nav-icon" size={18} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* User + logout */}
        <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', marginBottom: 8 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 'var(--radius-full)', flexShrink: 0,
              background: `linear-gradient(135deg, ${roleColor}, ${roleColor}88)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: 'white'
            }}>
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.first_name} {user?.last_name}
              </div>
              <div style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <span style={{
                  background: `${roleColor}22`, color: roleColor,
                  padding: '1px 6px', borderRadius: 4, fontWeight: 600, fontSize: 10,
                  textTransform: 'uppercase', letterSpacing: '0.05em'
                }}>
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>
          <button
            className="nav-item"
            onClick={handleLogout}
            style={{ color: 'var(--danger)', width: '100%' }}
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      <style>{`
        @media (max-width: 1024px) {
          #sidebar-toggle { display: flex !important; }
          #sidebar-backdrop { display: block !important; }
        }
      `}</style>
    </>
  );
}
