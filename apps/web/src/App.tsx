import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './components/Layout';
import Home from './pages/Home';
import Medallero from './pages/Medallero';
import Records from './pages/Records';
import Athletes from './pages/Athletes';
import AthleteProfile from './pages/AthleteProfile';
import Clubs from './pages/Clubs';
import ClubProfile from './pages/ClubProfile';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Login from './pages/Login';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminClubs from './pages/admin/AdminClubs';
import AdminAthletes from './pages/admin/AdminAthletes';
import AdminCategories from './pages/admin/AdminCategories';
import AdminEvents from './pages/admin/AdminEvents';
import AdminEventConfig from './pages/admin/AdminEventConfig';
import AdminResults from './pages/admin/AdminResults';
import ProtectedRoute from './components/ProtectedRoute';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="medallero" element={<Medallero />} />
        <Route path="records" element={<Records />} />
        <Route path="atletas" element={<Athletes />} />
        <Route path="atletas/:id" element={<AthleteProfile />} />
        <Route path="clubes" element={<Clubs />} />
        <Route path="clubes/:id" element={<ClubProfile />} />
        <Route path="eventos" element={<Events />} />
        <Route path="eventos/:id" element={<EventDetail />} />
      </Route>

      {/* Auth Routes */}
      <Route path="/admin/login" element={<Login />} />

      {/* Admin Routes (Protected) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="clubes" element={<AdminClubs />} />
        <Route path="atletas" element={<AdminAthletes />} />
        <Route path="categorias" element={<AdminCategories />} />
        <Route path="eventos" element={<AdminEvents />} />
        <Route path="eventos/:id" element={<AdminEventConfig />} />
        <Route path="resultados" element={<AdminResults />} />
      </Route>
      </Routes>
    </>
  );
}

export default App;