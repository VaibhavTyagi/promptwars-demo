import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Building2 } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@venue.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (email) => {
    setEmail(email);
    setPassword('password123');
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
            <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required />
          </div>
          <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>Quick Login (Demo Accounts)</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {[
              { label: 'Admin', email: 'admin@venue.com' },
              { label: 'Manager', email: 'jennifer@example.com' },
              { label: 'Security', email: 'david@example.com' },
              { label: 'Attendee', email: 'sarah@example.com' },
            ].map(u => (
              <button key={u.email} className="btn btn-ghost btn-sm" onClick={() => quickLogin(u.email)}>
                {u.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
