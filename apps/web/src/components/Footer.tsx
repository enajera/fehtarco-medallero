export default function Footer() {
  return (
    <footer
      className="border-t border-[rgba(255,255,255,0.065)] py-7"
      style={{ background: 'var(--surface)' }}
    >
      <div style={{
        maxWidth: 680,
        margin: '0 auto',
        padding: '0 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        textAlign: 'center',
      }}>
        {/* Branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="20" height="20" viewBox="0 0 34 34" fill="none" aria-hidden>
            <circle cx="17" cy="17" r="16" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5"/>
            <circle cx="17" cy="17" r="12" stroke="#4AADE8" strokeWidth="1.5" opacity="0.6"/>
            <circle cx="17" cy="17" r="8"  stroke="#E8302A" strokeWidth="1.5" opacity="0.6"/>
            <circle cx="17" cy="17" r="4"  fill="#F5C800" opacity="0.7"/>
          </svg>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>
            Federación Hondureña de Tiro con Arco · Sistema Medallero Federativo
          </span>
        </div>

        {/* Powered by */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--muted)', opacity: 0.7 }}>
          <span>Powered by Club de Arquería</span>
          <img
            src={new URL('/src/assets/logos/fenix.png', import.meta.url).href}
            alt="Fenix"
            style={{ height: 16, width: 'auto', filter: 'brightness(0) invert(1) opacity(0.6)' }}
          />
        </div>

        {/* Copyright */}
        <span style={{ fontSize: 10, color: 'var(--muted)', opacity: 0.35 }}>
          © {new Date().getFullYear()} World Archery Honduras. Todos los derechos reservados.
        </span>
      </div>
    </footer>
  );
}
