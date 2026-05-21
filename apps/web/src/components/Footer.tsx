export default function Footer() {
  return (
    <footer
      className="flex flex-col items-center justify-center gap-6 px-5 md:px-[52px] py-10
                 border-t border-[rgba(255,255,255,0.065)]"
      style={{ background: 'var(--surface)' }}
    >
      {/* Main footer content */}
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex items-center gap-1">
          {/* Target icon */}
          <svg width="24" height="24" viewBox="0 0 34 34" fill="none" aria-hidden>
            <circle cx="17" cy="17" r="16" stroke="rgba(255,255,255,0.1)"  strokeWidth="1.5"/>
            <circle cx="17" cy="17" r="12" stroke="#4AADE8" strokeWidth="1.5" opacity="0.6"/>
            <circle cx="17" cy="17" r="8"  stroke="#E8302A" strokeWidth="1.5" opacity="0.6"/>
            <circle cx="17" cy="17" r="4"  fill="#F5C800" opacity="0.7"/>
          </svg>
          <span className="text-[12px] max-w-sm" style={{ color: 'var(--muted)' }}>
            Federación Hondureña de Tiro con Arco · Sistema Medallero Federativo © 2026
          </span>
        </div>
      </div>

      {/* Powered by Club de Arquería Fenix */}
      <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--muted)' }}>
        <span>Powered by Club de Arquería</span>
        <img 
          src={new URL('/src/assets/logos/fenix.png', import.meta.url).href}
          alt="Fenix Logo"
          style={{ 
            height: '20px', 
            width: 'auto', 
            display: 'inline-block',
            filter: 'brightness(0) invert(1) opacity(0.8)',
          }}
        />
      </div>

      {/* Copyright */}
      <span className="text-[10px] opacity-40" style={{ color: 'var(--muted)' }}>
        © {new Date().getFullYear()} World Archery Honduras. Todos los derechos reservados.
      </span>
    </footer>
  );
}
