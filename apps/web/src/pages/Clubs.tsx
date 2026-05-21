import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { clubsApi, Club } from '../api/client';
import Loading from '../components/Loading';

function ClubAvatar({ club }: { club: Club }) {
  const initials = club.name.substring(0, 2).toUpperCase();
  return (
    <div className="club-avatar club-avatar--2xl">
      {club.hasLogo ? (
        <img
          src={`/api/clubs/${club.id}/logo`}
          alt={club.name}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        initials
      )}
    </div>
  );
}

export default function Clubs() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [query, setQuery] = useState('');
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        setLoading(true);
        const params: Record<string, any> = { page, limit };
        if (query) params.q = query;
        const response = await clubsApi.getAll(params);
        setClubs(response.data.data);
        const meta = response.data.meta;
        if (meta) {
          setTotalPages(meta.totalPages || 1);
        }
      } catch (error) {
        console.error('Error fetching clubs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchClubs();
  }, [page, limit, query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(inputValue);
    setPage(1);
  };

  return (
    <>
      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <p className="page-eyebrow">Federación Hondureña de Tiro con Arco</p>
        <h1 className="page-title">Clubes</h1>
        <p style={{ fontSize: 14, color: 'var(--subtle)', margin: '6px 0 0' }}>
          Clubes afiliados a la federación en todo el país.
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 10, maxWidth: 480 }}>
          <input
            className="dinput"
            placeholder="Buscar clubes por nombre o ciudad..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button type="submit" className="dbtn dbtn-primary" style={{ flexShrink: 0 }}>
            Buscar
          </button>
        </div>
      </form>

      {loading ? (
        <Loading />
      ) : clubs.length > 0 ? (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 20,
            }}
          >
            {clubs.map((club) => (
              <div
                key={club.id}
                className="dcard"
                style={{
                  padding: '36px 28px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 16,
                  textAlign: 'center',
                }}
              >
                <ClubAvatar club={club} />
                <div>
                  <Link
                    to={`/clubes/${club.id}`}
                    style={{
                      textDecoration: 'none',
                      color: 'var(--text)',
                      fontWeight: 700,
                      fontSize: 17,
                      display: 'block',
                    }}
                  >
                    {club.name}
                  </Link>
                  {club.city && (
                    <p style={{ fontSize: 13, color: 'var(--subtle)', margin: '3px 0 0' }}>
                      {club.city}
                    </p>
                  )}
                </div>
                <span className="chip chip-muted">
                  {club._count?.athletes || 0} atletas
                </span>
                <Link
                  to={`/clubes/${club.id}`}
                  style={{ textDecoration: 'none', width: '100%' }}
                  className="dbtn dbtn-ghost dbtn-sm"
                >
                  Ver Club
                </Link>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 28,
            }}
          >
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
            No hay clubes registrados
          </p>
        </div>
      )}
    </>
  );
}
