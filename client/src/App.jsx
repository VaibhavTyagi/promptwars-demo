import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
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

function ProtectedLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-spinner" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/wait-times" element={<WaitTimesPage />} />
          <Route path="/crowd-density" element={<CrowdDensityPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/incidents" element={<IncidentsPage />} />
          <Route path="/staff" element={<StaffPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
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
