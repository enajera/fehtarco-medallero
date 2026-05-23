import { Link } from 'react-router-dom';
import type { ClubHistoryEntry } from '@/api/client';

interface Props {
  clubHistory: ClubHistoryEntry[];
  currentClub: { id: number; name: string } | null;
}

function formatYear(dateStr: string | null | undefined): string {
  if (!dateStr) return '?';
  return new Date(dateStr).getFullYear().toString();
}

export default function ClubTimeline({ clubHistory, currentClub }: Props) {
  // Combinar historial con club actual si no está en el historial
  const entries = [...clubHistory].sort((a, b) => {
    const af = a.from ? new Date(a.from).getTime() : 0;
    const bf = b.from ? new Date(b.from).getTime() : 0;
    return bf - af; // más reciente primero
  });

  // Si no hay historial o solo 1 entrada (club actual), no mostrar timeline
  if (entries.length === 0 && !currentClub) return null;
  if (entries.length <= 1 && !entries[0]?.to) return null; // solo club actual, nada que mostrar

  return (
    <div>
      <div style={{ position: 'relative', paddingLeft: 24 }}>
        {/* Línea vertical */}
        <div style={{
          position: 'absolute', left: 7, top: 8, bottom: 8,
          width: 2, background: 'rgba(255,255,255,0.08)', borderRadius: 1,
        }} />

        {entries.map((entry, i) => {
          const isCurrent = !entry.to;
          return (
            <div key={i} style={{ position: 'relative', marginBottom: 20, paddingLeft: 20 }}>
              {/* Dot */}
              <div style={{
                position: 'absolute', left: -1, top: 4,
                width: 10, height: 10, borderRadius: '50%',
                background: isCurrent ? 'var(--accent)' : 'var(--border)',
                border: `2px solid ${isCurrent ? 'var(--accent)' : 'rgba(255,255,255,0.15)'}`,
                boxShadow: isCurrent ? '0 0 8px rgba(45,107,255,0.5)' : 'none',
              }} />

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 14, fontWeight: 600,
                  color: isCurrent ? 'var(--text)' : 'var(--subtle)',
                }}>
                  {entry.clubId ? (
                    <Link
                      to={`/clubes/${entry.clubId}`}
                      style={{ color: 'inherit', textDecoration: 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                      onMouseLeave={e => (e.currentTarget.style.color = isCurrent ? 'var(--text)' : 'var(--subtle)')}
                    >
                      {entry.clubName || `Club #${entry.clubId}`}
                    </Link>
                  ) : (
                    entry.clubName || 'Independiente'
                  )}
                </span>

                <span style={{ fontSize: 11, color: 'var(--subtle)', fontFamily: 'Space Mono, monospace' }}>
                  {formatYear(entry.from)}
                  {isCurrent ? ' → presente' : ` → ${formatYear(entry.to)}`}
                </span>

                {isCurrent && (
                  <span style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 10,
                    background: 'rgba(45,107,255,0.15)', color: 'var(--accent)',
                    fontWeight: 600,
                  }}>
                    actual
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
