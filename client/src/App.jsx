import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth, canAccess, getHomeForRole } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EventsPage from './pages/EventsPage';
import WaitTimesPage from './pages/WaitTimesPage';
import CrowdDensityPage from './pages/CrowdDensityPage';
import OrdersPage from './pages/OrdersPage';
import IncidentsPage from './pages/IncidentsPage';
import StaffPage from './pages/StaffPage';
import AnalyticsPage from './pages/AnalyticsPage';
import './App.css';

// Guards a single route — redirects to role home if user can't access it
function RoleRoute({ path, element }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!canAccess(user.role, path)) {
    return <Navigate to={getHomeForRole(user.role)} replace />;
  }
  return element;
}

function ProtectedLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-spinner" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<RoleRoute path="/" element={<DashboardPage />} />} />
          <Route path="/events" element={<RoleRoute path="/events" element={<EventsPage />} />} />
          <Route path="/wait-times" element={<RoleRoute path="/wait-times" element={<WaitTimesPage />} />} />
          <Route path="/crowd-density" element={<RoleRoute path="/crowd-density" element={<CrowdDensityPage />} />} />
          <Route path="/orders" element={<RoleRoute path="/orders" element={<OrdersPage />} />} />
          <Route path="/incidents" element={<RoleRoute path="/incidents" element={<IncidentsPage />} />} />
          <Route path="/staff" element={<RoleRoute path="/staff" element={<StaffPage />} />} />
          <Route path="/analytics" element={<RoleRoute path="/analytics" element={<AnalyticsPage />} />} />
          {/* Catch-all: send to role home */}
          <Route path="*" element={<Navigate to={getHomeForRole(user.role)} replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
