import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { eventsApi, resultsApi } from '../api/client';
import Loading from '../components/Loading';
import { formatDistance } from '../utils/format';

interface EventDetail {
  id: number;
  name: string;
  organizer: string;
  location: string;
  country: string;
  startDate: string;
  endDate: string;
  eventScope: string;
  technicalLevel: string;
  official: boolean;
  clubMedalsEnabled: boolean;
  eventCategories: Array<{
    id: number;
    category: { id: number; bowType: string; gender: string; division: string };
    modality: { id: number; name: string };
    distance?: string;
    _count: { results: number };
  }>;
}

interface Result {
  id: number;
  score: number;
  position: number;
  medal: 'GOLD' | 'SILVER' | 'BRONZE' | null;
  eventCategoryId: number;
  phase: { id: number; name: string };
  athlete: {
    id: number;
    firstName: string;
    lastName: string;
    club: { id: number; name: string } | null;
  };
}

const SCOPE_LABELS: Record<string, string> = {
  NATIONAL_FEDERATION:         'Nacional Federativo',
  NATIONAL_INTERNATIONALIZED:  'Nacional Internacionalizado',
  INTERNATIONAL_NATIONAL_TEAM: 'Internacional (Selección)',
};

const TECH_LABELS: Record<string, string> = {
  WA_STANDARD:     'WA Standard',
  INDOOR_STANDARD: 'Indoor',
  REDUCED:         'Reducido',
  DEVELOPMENT:     'Desarrollo',
};

const MEDAL_COLORS = {
  GOLD:   { bg: 'rgba(240,165,0,0.15)',   color: 'var(--gold)',   label: 'Oro'    },
  SILVER: { bg: 'rgba(139,172,196,0.15)', color: 'var(--silver)', label: 'Plata'  },
  BRONZE: { bg: 'rgba(196,113,58,0.15)',  color: 'var(--bronze)', label: 'Bronce' },
};

const BOW_LABELS: Record<string, string> = {
  RECURVE:  'Recurvo',
  COMPOUND: 'Compuesto',
  BAREBOW:  'Barebow',
};

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await eventsApi.getById(Number(id));
        setEvent(response.data.data as EventDetail);
        const cats = response.data.data.eventCategories || [];
        if (cats.length > 0) setSelectedCategory(cats[0].id);
      } catch (error) {
        console.error('Error fetching event:', error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchEvent();
  }, [id]);

  useEffect(() => {
    const fetchResults = async () => {
      if (!selectedCategory || !id) return;
      try {
        const allResultsResponse = await resultsApi.getByEvent(Number(id));
        const allResults = allResultsResponse.data.data as Result[];
        const filtered = allResults.filter((r) => r.eventCategoryId === selectedCategory);
        setResults(filtered);
      } catch (error) {
        console.error('Error fetching results:', error);
      }
    };
    fetchResults();
  }, [id, selectedCategory, event]);

  if (loading) return <Loading />;
  if (!event) return (
    <div style={{ padding: '64px 24px', textAlign: 'center', color: 'var(--subtle)' }}>
      Evento no encontrado
    </div>
  );

  const startDate = new Date(event.startDate).toLocaleDateString('es-HN', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  const endDate = new Date(event.endDate).toLocaleDateString('es-HN', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  return (
    <>
      {/* Event header band */}
      <div className="profile-band" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            {/* Breadcrumb */}
            <p style={{ fontSize: 12, color: 'var(--subtle)', margin: '0 0 10px' }}>
              Eventos / {new Date(event.startDate).getFullYear()}
            </p>
            <h1
              style={{
                fontFamily: 'Manrope, sans-serif',
                fontSize: 'clamp(20px, 3vw, 30px)',
                fontWeight: 800,
                color: 'var(--text)',
                margin: '0 0 12px',
                lineHeight: 1.2,
              }}
            >
              {event.name}
            </h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ fontSize: 13, color: 'var(--subtle)' }}>
                {event.location}, {event.country}
              </span>
              <span style={{ fontSize: 13, color: 'var(--subtle)' }}>
                {event.organizer}
              </span>
              <span style={{ fontSize: 13, color: 'var(--subtle)' }}>
                {startDate}
                {startDate !== endDate && ` — ${endDate}`}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <span className="chip chip-accent">
                {SCOPE_LABELS[event.eventScope] || event.eventScope}
              </span>
              <span className="chip chip-muted">
                {TECH_LABELS[event.technicalLevel] || event.technicalLevel}
              </span>
              {event.official && (
                <span className="chip chip-green">Oficial</span>
              )}
              {event.clubMedalsEnabled && (
                <span className="chip chip-gold">Cuenta Medallero</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Categories + Results */}
      {event.eventCategories.length > 0 ? (
        <div className="dcard">
          {/* Category tabs */}
          <div className="dtabs" style={{ padding: '0 20px', overflowX: 'auto' }}>
            {event.eventCategories.map((ec) => (
              <button
                key={ec.id}
                className={`dtab${selectedCategory === ec.id ? ' active' : ''}`}
                onClick={() => setSelectedCategory(ec.id)}
              >
                <span>
                  {BOW_LABELS[ec.category.bowType] || ec.category.bowType}{' '}
                  {ec.category.gender === 'M' ? 'Masc.' : 'Fem.'}{' '}
                  {ec.category.division}
                </span>
                {ec.distance && (
                  <span style={{ color: 'var(--subtle)', fontWeight: 400, fontSize: 11, marginLeft: 4 }}>
                    {formatDistance(ec.distance)}
                  </span>
                )}
                <span
                  style={{
                    marginLeft: 6,
                    background: 'var(--surface3)',
                    color: 'var(--subtle)',
                    borderRadius: 10,
                    padding: '1px 6px',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {ec._count.results}
                </span>
              </button>
            ))}
          </div>

          {/* Results table */}
          {results.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="dtable">
                <thead>
                  <tr>
                    <th style={{ width: 60 }}>Pos.</th>
                    <th>Atleta</th>
                    <th>Club</th>
                    <th>Fase</th>
                    <th className="tc" style={{ width: 90 }}>Puntaje</th>
                    <th className="tc" style={{ width: 90 }}>Medalla</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result) => {
                    const mc = result.medal ? MEDAL_COLORS[result.medal as keyof typeof MEDAL_COLORS] : null;
                    return (
                      <tr key={result.id}>
                        <td>
                          {result.position <= 3 ? (
                            <span
                              className={`mbadge ${
                                result.position === 1
                                  ? 'mbadge-gold'
                                  : result.position === 2
                                  ? 'mbadge-silver'
                                  : 'mbadge-bronze'
                              }`}
                              style={{ fontSize: 11 }}
                            >
                              {result.position}
                            </span>
                          ) : (
                            <span className="rank-num">{result.position}</span>
                          )}
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, fontSize: 14 }}>
                            {result.athlete.firstName} {result.athlete.lastName}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: 13, color: 'var(--subtle)' }}>
                            {result.athlete.club?.name || 'Independiente'}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`chip ${
                              result.phase.name === 'FINAL' ? 'chip-accent' : 'chip-muted'
                            }`}
                            style={{ fontSize: 11 }}
                          >
                            {result.phase.name.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="tc">
                          <span
                            style={{
                              fontFamily: "'Space Mono', monospace",
                              fontWeight: 800,
                              fontSize: 15,
                              color: 'var(--text)',
                            }}
                          >
                            {result.score}
                          </span>
                        </td>
                        <td className="tc">
                          {mc ? (
                            <span className="chip" style={{ background: mc.bg, color: mc.color, fontSize: 11 }}>
                              {mc.label}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '52px 24px', textAlign: 'center' }}>
              <p style={{ color: 'var(--subtle)', margin: 0, fontSize: 14 }}>
                No hay resultados cargados para esta categoría
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="dcard" style={{ padding: '52px 24px', textAlign: 'center' }}>
          <p style={{ color: 'var(--subtle)', margin: 0, fontSize: 14 }}>
            No hay categorías configuradas para este evento
          </p>
        </div>
      )}
    </>
  );
}
