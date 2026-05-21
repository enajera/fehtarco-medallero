import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventsApi, Event } from '../api/client';
import Loading from '../components/Loading';

const SCOPE_LABELS: Record<string, string> = {
  NATIONAL_FEDERATION:         'Nacional',
  NATIONAL_INTERNATIONALIZED:  'Nacional Int.',
  INTERNATIONAL_NATIONAL_TEAM: 'Internacional',
};

const SCOPE_CHIP: Record<string, string> = {
  NATIONAL_FEDERATION:         'chip-accent',
  NATIONAL_INTERNATIONALIZED:  'chip-gold',
  INTERNATIONAL_NATIONAL_TEAM: 'chip-green',
};

const TECH_LABELS: Record<string, string> = {
  WA_STANDARD:     'WA Standard',
  INDOOR_STANDARD: 'Indoor',
  REDUCED:         'Reducido',
  DEVELOPMENT:     'Desarrollo',
};

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [scope, setScope] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [query, setQuery] = useState('');

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const params: Record<string, any> = { year, page, limit };
        if (scope) params.scope = scope;
        if (query) params.q = query;
        const response = await eventsApi.getAll(params);
        setEvents(response.data.data);
        const meta = response.data.meta;
        if (meta) {
          setTotalPages(meta.totalPages || 1);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [year, scope, page]);

  return (
    <>
      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <p className="page-eyebrow">Federación Hondureña de Tiro con Arco</p>
        <h1 className="page-title">Eventos</h1>
        <p style={{ fontSize: 14, color: 'var(--subtle)', margin: '6px 0 0' }}>
          Competencias oficiales registradas en el sistema federativo.
        </p>
      </div>

      {/* Filters */}
      <div className="dcard" style={{ padding: '18px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 120px', minWidth: 100 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--subtle)', marginBottom: 6 }}>
              Año
            </label>
            <select className="dselect" value={year} onChange={(e) => { setYear(Number(e.target.value)); setPage(1); }}>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: '2 1 200px', minWidth: 160 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--subtle)', marginBottom: 6 }}>
              Ámbito
            </label>
            <select className="dselect" value={scope} onChange={(e) => { setScope(e.target.value); setPage(1); }}>
              <option value="">Todos</option>
              <option value="NATIONAL_FEDERATION">Nacional Federativo</option>
              <option value="NATIONAL_INTERNATIONALIZED">Nacional Internacionalizado</option>
              <option value="INTERNATIONAL_NATIONAL_TEAM">Internacional (Selección)</option>
            </select>
          </div>
          <div style={{ flex: '3 1 260px', minWidth: 200 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--subtle)', marginBottom: 6 }}>
              Buscar
            </label>
            <input
              className="dinput"
              placeholder="Buscar por nombre o ubicación..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <Loading />
      ) : events.length > 0 ? (
        <>
          <div className="dcard">
            <div style={{ overflowX: 'auto' }}>
              <table className="dtable">
                <thead>
                  <tr>
                    <th style={{ width: 110 }}>Fecha</th>
                    <th>Evento</th>
                    <th>Ubicación</th>
                    <th>Ámbito</th>
                    <th>Nivel</th>
                    <th className="tc" style={{ width: 90 }}>Categorías</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: 12, color: 'var(--subtle)', fontFamily: "'Space Mono', monospace" }}>
                          {new Date(event.startDate).toLocaleDateString('es-HN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <Link
                            to={`/eventos/${event.id}`}
                            style={{
                              textDecoration: 'none',
                              color: 'var(--text)',
                              fontWeight: 700,
                              fontSize: 14,
                            }}
                          >
                            {event.name}
                          </Link>
                          {event.official && (
                            <span className="chip chip-green" style={{ fontSize: 10 }}>Oficial</span>
                          )}
                          {event.clubMedalsEnabled && (
                            <span className="chip chip-gold" style={{ fontSize: 10 }}>Medallero</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: 12, color: 'var(--subtle)' }}>
                          {event.location}, {event.country}
                        </span>
                      </td>
                      <td>
                        <span className={`chip ${SCOPE_CHIP[event.eventScope] || 'chip-muted'}`}>
                          {SCOPE_LABELS[event.eventScope] || event.eventScope}
                        </span>
                      </td>
                      <td>
                        <span className="chip chip-muted" style={{ fontSize: 11 }}>
                          {TECH_LABELS[event.technicalLevel] || event.technicalLevel}
                        </span>
                      </td>
                      <td className="tc">
                        <span
                          style={{
                            fontFamily: "'Space Mono', monospace",
                            fontSize: 14,
                            fontWeight: 700,
                            color: 'var(--accent2)',
                          }}
                        >
                          {event._count?.eventCategories || 0}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
            <span style={{ fontSize: 13, color: 'var(--subtle)' }}>
              Página {page} / {totalPages}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="dbtn dbtn-ghost dbtn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </button>
              <button
                className="dbtn dbtn-ghost dbtn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Siguiente
              </button>
            </div>
          </div>
        </>
      ) : (
        <div style={{ padding: '64px 24px', textAlign: 'center' }}>
          <p style={{ color: 'var(--subtle)', margin: 0, fontSize: 14 }}>
            No hay eventos para {year}
          </p>
        </div>
      )}
    </>
  );
}
