import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Calendar, MapPin, Clock, ShoppingBag,
  AlertTriangle, Users, BarChart3, Settings, LogOut, Building2,
  Menu, X, ChevronDown
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
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

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button className="btn btn-ghost btn-icon" onClick={() => setOpen(!open)}
        style={{ position: 'fixed', top: 12, left: 12, zIndex: 200, display: 'none' }}
        id="sidebar-toggle">
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo"><Building2 size={20} /></div>
          <div>
            <div className="sidebar-title">VenueFlow</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Operations Hub</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(section => (
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

        <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', marginBottom: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: 'white'
            }}>
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.first_name} {user?.last_name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user?.role}</div>
            </div>
          </div>
          <button className="nav-item" onClick={logout} style={{ color: 'var(--danger)' }}>
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      <style>{`
        @media (max-width: 1024px) {
          #sidebar-toggle { display: flex !important; }
        }
      `}</style>
    </>
  );
}
