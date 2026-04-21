import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth, getHomeForRole } from '../context/AuthContext';
import { Building2, Eye, EyeOff } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@venue.com', description: 'Full access — all pages' },
  { label: 'Manager', email: 'jennifer@example.com', description: 'Dashboard, events, monitoring' },
  { label: 'Security', email: 'david@example.com', description: 'Wait times, crowd, incidents' },
  { label: 'Vendor', email: 'alex@example.com', description: 'Orders only' },
  { label: 'Attendee', email: 'sarah@example.com', description: 'Orders only' },
];

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@venue.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Already logged in — redirect to role home
  if (!loading && user) {
    return <Navigate to={getHomeForRole(user.role)} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const loggedInUser = await login(email, password);
      navigate(getHomeForRole(loggedInUser.role), { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick-login: fill AND immediately submit
  const quickLogin = async (demoEmail) => {
    setError('');
    setEmail(demoEmail);
    setPassword('password123');
    setSubmitting(true);
    try {
      const loggedInUser = await login(demoEmail, 'password123');
      navigate(getHomeForRole(loggedInUser.role), { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="logo-area">
          <div className="logo-icon"><Building2 size={30} /></div>
          <h1>VenueFlow</h1>
          <p className="login-subtitle">Venue Experience Enhancement Platform</p>
        </div>

        {error && <div className="alert alert-danger login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', padding: 0, display: 'flex'
                }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 8 }}
            disabled={submitting}
          >
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {/* Demo accounts */}
        <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
            Quick Login — Demo Accounts
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {DEMO_ACCOUNTS.map(u => (
              <button
                key={u.email}
                className="btn btn-ghost btn-sm"
                onClick={() => quickLogin(u.email)}
                disabled={submitting}
                style={{ justifyContent: 'space-between', textAlign: 'left', padding: '8px 12px' }}
              >
                <span style={{ fontWeight: 600 }}>{u.label}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.description}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
