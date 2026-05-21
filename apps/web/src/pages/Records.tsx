import { useState } from 'react';

type RecordScope = 'NACIONAL' | 'INTERNACIONAL';
type BowType = '' | 'RECURVE' | 'COMPOUND' | 'BAREBOW';
type Gender = '' | 'M' | 'F';

// Placeholder type for when the API is connected
interface NationalRecord {
  id: number;
  category: string;
  bowType: string;
  gender: string;
  division: string;
  distance: string;
  athleteName: string;
  clubName: string;
  score: number;
  eventName: string;
  eventDate: string;
  scope: RecordScope;
}

function EmptyState({ scope }: { scope: RecordScope }) {
  return (
    <div
      style={{
        padding: '64px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}
    >
      {/* Target icon */}
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="30" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
        <circle cx="32" cy="32" r="22" stroke="rgba(255,255,255,0.07)" strokeWidth="2" />
        <circle cx="32" cy="32" r="14" stroke="rgba(45,107,255,0.18)" strokeWidth="2" />
        <circle cx="32" cy="32" r="6" fill="rgba(45,107,255,0.20)" />
        <circle cx="32" cy="32" r="2.5" fill="var(--accent)" />
      </svg>
      <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
        Sin records registrados
      </p>
      <p style={{ fontSize: 13, color: 'var(--subtle)', margin: 0, textAlign: 'center', maxWidth: 340 }}>
        Los records {scope === 'NACIONAL' ? 'nacionales' : 'internacionales'} aparecerán aquí
        cuando sean registrados desde el panel de administración.
      </p>
    </div>
  );
}

const BOW_LABELS: Record<string, string> = {
  RECURVE: 'Recurvo',
  COMPOUND: 'Compuesto',
  BAREBOW: 'Barebow',
};

export default function Records() {
  const [scope, setScope] = useState<RecordScope>('NACIONAL');
  const [bowFilter, setBowFilter] = useState<BowType>('');
  const [genderFilter, setGenderFilter] = useState<Gender>('');

  // Placeholder — replace with actual API call when endpoint exists
  const records: NationalRecord[] = [];

  const filtered = records.filter((r) => {
    if (r.scope !== scope) return false;
    if (bowFilter && r.bowType !== bowFilter) return false;
    if (genderFilter && r.gender !== genderFilter) return false;
    return true;
  });

  return (
    <>
      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <p className="page-eyebrow">Federación Hondureña de Tiro con Arco</p>
        <h1 className="page-title">Records Nacionales</h1>
        <p style={{ fontSize: 14, color: 'var(--subtle)', margin: '6px 0 0', lineHeight: 1.6 }}>
          Máximas marcas históricas registradas en competencias oficiales dentro y fuera del país.
        </p>
      </div>

      {/* Tabs Nacional / Internacional */}
      <div className="dcard" style={{ marginBottom: 24 }}>
        <div className="dtabs" style={{ padding: '0 20px' }}>
          <button
            className={`dtab${scope === 'NACIONAL' ? ' active' : ''}`}
            onClick={() => setScope('NACIONAL')}
          >
            Records Nacionales
          </button>
          <button
            className={`dtab${scope === 'INTERNACIONAL' ? ' active' : ''}`}
            onClick={() => setScope('INTERNACIONAL')}
          >
            Records Internacionales
          </button>
        </div>

        {/* Filters */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: '1 1 160px', minWidth: 140 }}>
            <select
              className="dselect"
              value={bowFilter}
              onChange={(e) => setBowFilter(e.target.value as BowType)}
            >
              <option value="">Todos los arcos</option>
              <option value="RECURVE">Recurvo</option>
              <option value="COMPOUND">Compuesto</option>
              <option value="BAREBOW">Barebow</option>
            </select>
          </div>
          <div style={{ flex: '1 1 160px', minWidth: 140 }}>
            <select
              className="dselect"
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value as Gender)}
            >
              <option value="">Todos</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {filtered.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="dtable">
              <thead>
                <tr>
                  <th>Categoría</th>
                  <th>Distancia</th>
                  <th>Atleta</th>
                  <th>Club</th>
                  <th className="tc">Puntaje</th>
                  <th>Evento</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((rec) => (
                  <tr key={rec.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          className={`chip chip-${
                            rec.bowType === 'RECURVE'
                              ? 'accent'
                              : rec.bowType === 'COMPOUND'
                              ? 'gold'
                              : 'muted'
                          }`}
                        >
                          {BOW_LABELS[rec.bowType] || rec.bowType}
                        </span>
                        <span style={{ color: 'var(--subtle)', fontSize: 12 }}>
                          {rec.gender === 'M' ? 'Masculino' : 'Femenino'} · {rec.division}
                        </span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--subtle)', fontSize: 13 }}>{rec.distance}</td>
                    <td style={{ fontWeight: 700 }}>{rec.athleteName}</td>
                    <td style={{ color: 'var(--subtle)', fontSize: 13 }}>{rec.clubName}</td>
                    <td className="tc">
                      <span
                        style={{
                          fontFamily: "'Space Mono', monospace",
                          fontWeight: 700,
                          fontSize: 16,
                          color: 'var(--gold2)',
                        }}
                      >
                        {rec.score}
                      </span>
                    </td>
                    <td style={{ fontSize: 13 }}>{rec.eventName}</td>
                    <td style={{ color: 'var(--subtle)', fontSize: 13 }}>
                      {new Date(rec.eventDate).toLocaleDateString('es-HN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState scope={scope} />
        )}
      </div>

      {/* Info note */}
      <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8, lineHeight: 1.7 }}>
        * Los records se actualizan automáticamente cuando se registra un puntaje superior
        al record vigente en competencias oficiales con nivel WA_STANDARD o INDOOR_STANDARD.
      </p>
    </>
  );
}
