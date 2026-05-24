import { useState } from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import fenixLogo from '../assets/logos/fenix.png';

const NAV_ITEMS = [
  { to: '/admin/clubes',      label: 'Clubes' },
  { to: '/admin/categorias',  label: 'Categorías' },
  { to: '/admin/atletas',     label: 'Atletas' },
  { to: '/admin/eventos',     label: 'Eventos' },
  { to: '/admin/resultados',  label: 'Resultados' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8f9fb' }}>

      {/* ── Navbar ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto',
          padding: '0 20px',
          display: 'flex', alignItems: 'center', height: 56, gap: 0,
        }}>
          {/* Brand */}
          <Link to="/admin" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            textDecoration: 'none', marginRight: 32, flexShrink: 0,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 6,
              background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14,
            }}>
              🛠️
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#111827', fontFamily: 'system-ui, sans-serif' }}>
              Admin
            </span>
          </Link>

          {/* Nav links — desktop */}
          <nav style={{ display: 'flex', gap: 2, flex: 1 }} className="admin-nav-desktop">
            {NAV_ITEMS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                style={({ isActive }) => ({
                  padding: '6px 12px',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#2563eb' : '#4b5563',
                  background: isActive ? '#eff6ff' : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 0.12s',
                  fontFamily: 'system-ui, sans-serif',
                })}
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flexShrink: 0 }}>
            <Link
              to="/"
              style={{
                fontSize: 12, color: '#6b7280', textDecoration: 'none', fontFamily: 'system-ui, sans-serif',
                padding: '5px 10px', borderRadius: 6, border: '1px solid #e5e7eb',
              }}
            >
              ← Ver sitio
            </Link>
            <span style={{ fontSize: 12, color: '#9ca3af', fontFamily: 'system-ui, sans-serif', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </span>
            <button
              onClick={handleLogout}
              style={{
                padding: '5px 12px', borderRadius: 6, border: '1px solid #e5e7eb',
                background: 'transparent', color: '#374151', fontSize: 12, cursor: 'pointer',
                fontFamily: 'system-ui, sans-serif', fontWeight: 500,
              }}
            >
              Salir
            </button>

            {/* Hamburger — mobile */}
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="admin-nav-hamburger"
              style={{
                display: 'none', padding: '4px 8px', borderRadius: 6,
                border: '1px solid #e5e7eb', background: 'transparent',
                color: '#374151', fontSize: 18, cursor: 'pointer', lineHeight: 1,
              }}
            >
              ☰
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div style={{ borderTop: '1px solid #e5e7eb', padding: '8px 20px 12px', background: '#fff' }}>
            {NAV_ITEMS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                style={({ isActive }) => ({
                  display: 'block', padding: '8px 12px', borderRadius: 6, marginBottom: 2,
                  fontSize: 14, fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#2563eb' : '#374151',
                  background: isActive ? '#eff6ff' : 'transparent',
                  textDecoration: 'none',
                })}
              >
                {label}
              </NavLink>
            ))}
          </div>
        )}
      </header>

      {/* ── Main content ── */}
      <main style={{ flex: 1, padding: '28px 20px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid #e5e7eb', background: '#fff',
        padding: '12px 20px', textAlign: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#9ca3af' }}>
            © {new Date().getFullYear()} Federación Hondureña de Tiro con Arco · Powered by Club de Arquería
          </span>
          <img src={fenixLogo} alt="Fénix" style={{ height: 16, filter: 'grayscale(1) opacity(0.4)' }} />
        </div>
      </footer>

      {/* Responsive helper */}
      <style>{`
        /* ─ Bootstrap overrides for cleaner admin look ─ */
        .main-content, .bg-light { background: #f8f9fb !important; }
        /* Card */
        .card { border: 1px solid #e5e7eb !important; border-radius: 10px !important; box-shadow: 0 1px 3px rgba(0,0,0,0.04) !important; }
        .card-header { background: #f9fafb !important; border-bottom: 1px solid #e5e7eb !important; font-weight: 600 !important; font-size: 14px !important; color: #111827 !important; padding: 12px 16px !important; }
        .card-body { padding: 16px !important; }
        /* Table */
        .table th { background: #f9fafb; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 600; border-bottom: 1px solid #e5e7eb; padding: 10px 14px; }
        .table td { padding: 10px 14px; vertical-align: middle; font-size: 13px; border-color: #f3f4f6; color: #1f2937; }
        .table-hover tbody tr:hover td { background-color: #f9fafb; }
        /* Buttons */
        .btn { border-radius: 7px !important; font-size: 13px !important; font-weight: 500 !important; }
        .btn-primary { background: #2563eb !important; border-color: #2563eb !important; }
        .btn-primary:hover { background: #1d4ed8 !important; border-color: #1d4ed8 !important; }
        .btn-outline-primary { color: #2563eb !important; border-color: #2563eb !important; }
        .btn-outline-primary:hover { background: #2563eb !important; color: #fff !important; }
        .btn-sm { font-size: 12px !important; padding: 4px 10px !important; }
        /* Alert */
        .alert { border-radius: 8px !important; font-size: 13px !important; }
        /* Form */
        .form-control, .form-select { border-radius: 7px !important; font-size: 13px !important; border-color: #d1d5db !important; }
        .form-control:focus, .form-select:focus { border-color: #2563eb !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.12) !important; }
        .form-label { font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 4px; }
        /* Modal */
        .modal-content { border-radius: 12px !important; border: none !important; box-shadow: 0 20px 60px rgba(0,0,0,0.15) !important; }
        .modal-header { border-bottom: 1px solid #e5e7eb !important; padding: 16px 20px !important; }
        .modal-title { font-size: 16px !important; font-weight: 700 !important; color: #111827 !important; }
        .modal-body { padding: 20px !important; }
        .modal-footer { border-top: 1px solid #e5e7eb !important; padding: 12px 20px !important; }
        /* Badge */
        .badge { font-weight: 500 !important; font-size: 11px !important; border-radius: 5px !important; padding: 3px 8px !important; }
        /* h1 in admin pages */
        h1 { font-size: 22px !important; font-weight: 700 !important; color: #111827 !important; margin-bottom: 4px !important; }
        /* Nav pills for admin sub-sections */
        .nav-pills .nav-link { font-size: 13px !important; border-radius: 7px !important; }
        /* Pagination */
        .pagination { gap: 3px; }
        .page-link { border-radius: 6px !important; font-size: 13px !important; border-color: #e5e7eb !important; color: #374151 !important; }
        .page-item.active .page-link { background: #2563eb !important; border-color: #2563eb !important; color: #fff !important; }

        @media (max-width: 768px) {
          .admin-nav-desktop { display: none !important; }
          .admin-nav-hamburger { display: block !important; }
        }
        /* Tabla admin */
        .admin-table { width: 100%; border-collapse: collapse; font-size: 13px; font-family: system-ui, sans-serif; }
        .admin-table th { background: #f9fafb; padding: 10px 14px; text-align: left; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
        .admin-table td { padding: 10px 14px; border-bottom: 1px solid #f3f4f6; color: #1f2937; vertical-align: middle; }
        .admin-table tbody tr:hover { background: #f9fafb; }
        .admin-table tbody tr:last-child td { border-bottom: none; }
        /* Card */
        .admin-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; margin-bottom: 20px; }
        .admin-card-header { padding: 14px 18px; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between; }
        .admin-card-header h2 { margin: 0; font-size: 14px; font-weight: 600; color: #111827; font-family: system-ui, sans-serif; }
        .admin-card-body { padding: 16px 18px; }
        /* Badges */
        .abadge { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; }
        .abadge-blue  { background: #dbeafe; color: #1d4ed8; }
        .abadge-green { background: #dcfce7; color: #15803d; }
        .abadge-gray  { background: #f3f4f6; color: #4b5563; }
        .abadge-red   { background: #fee2e2; color: #b91c1c; }
        .abadge-gold  { background: #fef3c7; color: #92400e; }
        /* Buttons */
        .abtn { display: inline-flex; align-items: center; gap: 5px; padding: 6px 14px; border-radius: 7px; font-size: 13px; font-weight: 500; cursor: pointer; border: 1px solid transparent; transition: all 0.12s; font-family: system-ui, sans-serif; }
        .abtn-primary { background: #2563eb; color: #fff; border-color: #2563eb; }
        .abtn-primary:hover { background: #1d4ed8; }
        .abtn-secondary { background: #fff; color: #374151; border-color: #e5e7eb; }
        .abtn-secondary:hover { background: #f9fafb; }
        .abtn-danger { background: #fff; color: #dc2626; border-color: #fca5a5; }
        .abtn-danger:hover { background: #fef2f2; }
        .abtn-sm { padding: 4px 10px; font-size: 12px; }
        /* Page header */
        .admin-page-header { margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
        .admin-page-title { margin: 0; font-size: 22px; font-weight: 700; color: #111827; font-family: system-ui, sans-serif; }
        .admin-page-sub  { margin: 2px 0 0; font-size: 13px; color: #6b7280; }
        /* Back link */
        .admin-back { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: #6b7280; text-decoration: none; margin-bottom: 16px; }
        .admin-back:hover { color: #374151; }
        /* Form */
        .admin-form-label { font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 4px; display: block; font-family: system-ui, sans-serif; }
        .admin-input { width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 7px; font-size: 13px; color: #111827; font-family: system-ui, sans-serif; outline: none; background: #fff; }
        .admin-input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        /* Pagination */
        .admin-pagination { display: flex; align-items: center; justify-content: space-between; margin-top: 16px; }
        .admin-pagination-info { font-size: 12px; color: #6b7280; }
      `}</style>
    </div>
  );
}
