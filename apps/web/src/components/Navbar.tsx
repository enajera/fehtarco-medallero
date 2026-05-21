import { NavLink, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useState } from 'react';

/** Honduras flag SVG (simplified) */
function HnFlag({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 34 21"
      className={cn('inline-block', className)}
      style={{ borderRadius: 3, border: '1px solid rgba(255,255,255,0.10)' }}
      aria-label="Bandera de Honduras"
    >
      <rect width="34" height="7"  fill="#002D9C" />
      <rect y="7"  width="34" height="7"  fill="#FFFFFF" />
      <rect y="14" width="34" height="7"  fill="#002D9C" />
      {[
        [17, 10.5],
        [10, 7.5], [24, 7.5],
        [10, 13.5], [24, 13.5],
      ].map(([cx, cy], i) => (
        <polygon
          key={i}
          points="0,-1.1 0.26,-0.36 1.05,-0.36 0.42,0.14 0.65,0.9 0,-0.45 -0.65,0.9 -0.42,0.14 -1.05,-0.36 -0.26,-0.36"
          transform={`translate(${cx},${cy}) scale(1.4)`}
          fill="#6090FF"
        />
      ))}
    </svg>
  );
}

const links = [
  { to: '/',          label: 'Inicio',    exact: true  },
  { to: '/medallero', label: 'Medallero', exact: false },
  { to: '/records',   label: 'Records',   exact: false },
  { to: '/atletas',   label: 'Atletas',   exact: false },
  { to: '/clubes',    label: 'Clubes',    exact: false },
  { to: '/eventos',   label: 'Eventos',   exact: false },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-[300] h-[62px] flex items-center px-5 md:px-[52px]"
      style={{
        background: 'rgba(5,10,28,0.90)',
        backdropFilter: 'blur(28px) saturate(160%)',
        borderBottom: '1px solid rgba(45,107,255,0.15)',
      }}
    >
      {/* Hamburger button — LEFT, visible only on mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden w-[32px] h-[32px] flex flex-col items-center justify-center gap-[5px] rounded-[8px] transition-all duration-200 shrink-0"
        style={{
          background: isOpen ? 'rgba(45,107,255,0.14)' : 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.10)',
          cursor: 'pointer',
        }}
        aria-label="Toggle menu"
      >
        <span
          style={{
            width: '18px',
            height: '2px',
            background: '#8892AA',
            borderRadius: '1px',
            transition: 'all 0.3s ease',
            transform: isOpen ? 'rotate(45deg) translateY(7px)' : 'none',
          }}
        />
        <span
          style={{
            width: '18px',
            height: '2px',
            background: '#8892AA',
            borderRadius: '1px',
            opacity: isOpen ? 0 : 1,
            transition: 'opacity 0.3s ease',
          }}
        />
        <span
          style={{
            width: '18px',
            height: '2px',
            background: '#8892AA',
            borderRadius: '1px',
            transition: 'all 0.3s ease',
            transform: isOpen ? 'rotate(-45deg) translateY(-7px)' : 'none',
          }}
        />
      </button>

      {/* Brand — pendiente de diseño */}
      <div className="shrink-0 w-[40px] md:w-[40px]" />

      {/* Nav links — HIDDEN on mobile, visible on desktop */}
      <div className="hidden md:flex items-center gap-[2px] flex-1 justify-center md:ml-[140px]">
        {links.map(({ to, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            style={{ textDecoration: 'none' }}
            className={({ isActive }) =>
              cn(
                'px-[14px] py-[7px] rounded-[9px] text-[13px] font-semibold transition-all duration-150 shrink-0',
                isActive
                  ? 'bg-[rgba(45,107,255,0.14)] text-[#4F85FF]'
                  : 'text-[#6B7699] hover:bg-[var(--surface2)] hover:text-[#EDF0FF]'
              )
            }
          >
            {label}
          </NavLink>
        ))}
      </div>

      {/* Right side — buttons */}
      <div className="flex items-center gap-[6px] md:gap-[10px] shrink-0 ml-auto">
        <Link
          to="/seleccion-nacional"
          style={{
            textDecoration: 'none',
            background: '#2D6BFF',
            color: '#fff',
          }}
          className="px-[10px] md:px-[16px] py-[6px] md:py-[7px] rounded-[9px] text-[9px] md:text-[12px] font-bold
                     hover:bg-[#4F85FF]
                     transition-all duration-150 inline-flex whitespace-nowrap"
        >
          <span className="md:hidden">Selección</span>
          <span className="hidden md:inline">Selección Nacional</span>
        </Link>
        <Link
          to="/admin/login"
          style={{
            textDecoration: 'none',
            background: 'rgba(255,255,255,0.07)',
            color: '#8892AA',
          }}
          className="px-[10px] md:px-[14px] py-[7px] rounded-[9px] text-[10px] md:text-[12px] font-semibold
                     border border-[rgba(255,255,255,0.10)]
                     hover:text-[#EDF0FF] hover:border-[rgba(255,255,255,0.18)]
                     transition-all duration-150"
        >
          Admin
        </Link>
      </div>

      {/* Mobile menu — slides in from top */}
      {isOpen && (
        <div
          className="fixed top-[62px] left-0 right-0 md:hidden"
          style={{
            background: 'rgba(5,10,28,0.95)',
            backdropFilter: 'blur(28px)',
            borderBottom: '1px solid rgba(45,107,255,0.15)',
            maxHeight: 'calc(100vh - 62px)',
            overflowY: 'auto',
            zIndex: 299,
          }}
        >
          <div className="flex flex-col px-5 py-4 gap-2">
            {links.map(({ to, label, exact }) => (
              <NavLink
                key={to}
                to={to}
                end={exact}
                onClick={() => setIsOpen(false)}
                style={{ textDecoration: 'none' }}
                className={({ isActive }) =>
                  cn(
                    'px-4 py-3 rounded-[9px] text-[12px] font-semibold transition-all duration-150 block',
                    isActive
                      ? 'bg-[rgba(45,107,255,0.14)] text-[#4F85FF]'
                      : 'text-[#6B7699] hover:bg-[var(--surface2)] hover:text-[#EDF0FF]'
                  )
                }
              >
                {label}
              </NavLink>
            ))}
            <hr style={{ borderColor: 'rgba(255,255,255,0.10)', margin: '8px 0' }} />
            <Link
              to="/seleccion-nacional"
              onClick={() => setIsOpen(false)}
              style={{
                textDecoration: 'none',
                background: '#2D6BFF',
                color: '#fff',
                textAlign: 'center',
              }}
              className="px-4 py-3 rounded-[9px] text-[12px] font-bold
                         hover:bg-[#4F85FF]
                         transition-all duration-150 block"
            >
              Selección Nacional
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
