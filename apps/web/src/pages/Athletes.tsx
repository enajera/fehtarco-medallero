import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { athletesApi, Athlete } from '../api/client';
import Loading from '../components/Loading';

const BOW_LABELS: Record<string, string> = {
  RECURVE: 'Recurvo',
  COMPOUND: 'Compuesto',
  BAREBOW: 'Barebow',
};

function AthAvatar({ athlete }: { athlete: Athlete }) {
  const initials = `${athlete.firstName[0]}${athlete.lastName[0]}`.toUpperCase();
  return (
    <div className="ath-avatar">
      {athlete.hasPhoto ? (
        <img
          src={`/api/athletes/${athlete.id}/photo`}
          alt={`${athlete.firstName} ${athlete.lastName}`}
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

export default function Athletes() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [bowType, setBowType] = useState('');
  const [gender, setGender] = useState('');

  useEffect(() => {
    const fetchAthletes = async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = {};
        if (search) params.q = search;
        if (bowType) params.bowType = bowType;
        if (gender) params.gender = gender;
        const response = await athletesApi.getAll(params);
        setAthletes(response.data.data);
      } catch (error) {
        console.error('Error fetching athletes:', error);
      } finally {
        setLoading(false);
      }
    };
    const debounce = setTimeout(fetchAthletes, 300);
    return () => clearTimeout(debounce);
  }, [search, bowType, gender]);

  return (
    <>
      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <p className="page-eyebrow">Federación Hondureña de Tiro con Arco</p>
        <h1 className="page-title">Atletas</h1>
        <p style={{ fontSize: 14, color: 'var(--subtle)', margin: '6px 0 0' }}>
          Directorio de atletas registrados en la federación.
        </p>
      </div>

      {/* Filters */}
      <div className="dcard" style={{ padding: '18px 20px', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: '2 1 240px', minWidth: 180, position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: 13,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--subtle)',
                fontSize: 15,
                pointerEvents: 'none',
              }}
            >
              ⌕
            </span>
            <input
              className="dinput"
              style={{ paddingLeft: 34 }}
              placeholder="Buscar por nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ flex: '1 1 160px', minWidth: 130 }}>
            <select
              className="dselect"
              value={bowType}
              onChange={(e) => setBowType(e.target.value)}
            >
              <option value="">Todos los arcos</option>
              <option value="RECURVE">Recurvo</option>
              <option value="COMPOUND">Compuesto</option>
              <option value="BAREBOW">Barebow</option>
            </select>
          </div>
          <div style={{ flex: '1 1 140px', minWidth: 120 }}>
            <select
              className="dselect"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : athletes.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {athletes.map((athlete) => (
            <div
              key={athlete.id}
              className="dcard"
              style={{
                padding: '20px 22px',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              {/* Card top: avatar + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <AthAvatar athlete={athlete} />
                <div style={{ minWidth: 0 }}>
                  <Link
                    to={`/atletas/${athlete.id}`}
                    style={{
                      textDecoration: 'none',
                      color: 'var(--text)',
                      fontWeight: 700,
                      fontSize: 15,
                      display: 'block',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {athlete.firstName} {athlete.lastName}
                  </Link>
                  <span style={{ fontSize: 12, color: 'var(--subtle)' }}>
                    {athlete.club?.name || 'Independiente'}
                  </span>
                </div>
              </div>

              {/* Tags */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {athlete.bowType && (
                  <span
                    className={`chip chip-${
                      athlete.bowType === 'RECURVE'
                        ? 'accent'
                        : athlete.bowType === 'COMPOUND'
                        ? 'gold'
                        : 'muted'
                    }`}
                  >
                    {BOW_LABELS[athlete.bowType] || athlete.bowType}
                  </span>
                )}
                {athlete.gender && (
                  <span className="chip chip-muted">
                    {athlete.gender === 'M' ? 'Masculino' : 'Femenino'}
                  </span>
                )}
              </div>

              {/* CTA */}
              <Link
                to={`/atletas/${athlete.id}`}
                style={{ textDecoration: 'none' }}
                className="dbtn dbtn-ghost dbtn-sm"
              >
                Ver Perfil
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: '64px 24px', textAlign: 'center' }}>
          <p style={{ color: 'var(--subtle)', margin: 0, fontSize: 14 }}>
            No se encontraron atletas
          </p>
        </div>
      )}
    </>
  );
}
