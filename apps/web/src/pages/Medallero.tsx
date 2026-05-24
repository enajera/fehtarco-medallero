import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { medalsApi, ClubMedalCount, mediaUrl } from '../api/client';
import Loading from '../components/Loading';

function ClubAvatar({ club }: { club: ClubMedalCount }) {
  const initials = club.clubName.substring(0, 2).toUpperCase();
  return (
    <div className="club-avatar">
      {club.hasLogo ? (
        <img
          src={mediaUrl(`/api/clubs/${club.clubId}/logo`)}
          alt={club.clubName}
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

export default function Medallero() {
  const [medalleros, setMedalleros] = useState<Record<number, ClubMedalCount[]>>({});
  const [allTimeMedallero, setAllTimeMedallero] = useState<ClubMedalCount[] | null>(null);
  const [allTimeLoading, setAllTimeLoading] = useState(false);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [historicalView, setHistoricalView] = useState(false);

  useEffect(() => {
    const fetchAvailableYears = async () => {
      try {
        const response = await medalsApi.getAvailableYears();
        const years = response.data.data;
        setAvailableYears(years);
        if (years.length > 0) setSelectedYear(years[0]);
      } catch (error) {
        console.error('Error fetching available years:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAvailableYears();
  }, []);

  // Fetch año seleccionado
  useEffect(() => {
    if (!selectedYear) return;
    if (medalleros[selectedYear]) return;
    const fetchMedallero = async () => {
      try {
        const response = await medalsApi.getClubMedallero({ year: selectedYear });
        setMedalleros((prev) => ({ ...prev, [selectedYear]: response.data.data }));
      } catch (error) {
        console.error('Error fetching medallero for year', selectedYear, ':', error);
      }
    };
    fetchMedallero();
  }, [selectedYear]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch todos los tiempos cuando se activa la vista histórica
  useEffect(() => {
    if (!historicalView || allTimeMedallero !== null) return;
    setAllTimeLoading(true);
    medalsApi.getClubMedallero({})  // sin year → todos los años
      .then(res => setAllTimeMedallero(res.data.data))
      .catch(() => setAllTimeMedallero([]))
      .finally(() => setAllTimeLoading(false));
  }, [historicalView]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <Loading />;

  const currentMedallero = selectedYear ? medalleros[selectedYear] || [] : [];

  const totalMedals = currentMedallero.reduce(
    (acc, club) => ({
      gold: acc.gold + club.gold,
      silver: acc.silver + club.silver,
      bronze: acc.bronze + club.bronze,
    }),
    { gold: 0, silver: 0, bronze: 0 }
  );

  const historicalTotals = allTimeMedallero ?? [];

  const historicalTotalMedals = historicalTotals.reduce(
    (acc, club) => ({
      gold: acc.gold + club.gold,
      silver: acc.silver + club.silver,
      bronze: acc.bronze + club.bronze,
    }),
    { gold: 0, silver: 0, bronze: 0 }
  );

  const displayMedallero = historicalView ? historicalTotals : currentMedallero;
  const displayTotals = historicalView ? historicalTotalMedals : totalMedals;

  return (
    <>
      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <p className="page-eyebrow">Federación Hondureña de Tiro con Arco</p>
        <h1 className="page-title">
          {historicalView ? 'Medallero Histórico' : `Medallero Nacional ${selectedYear}`}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--subtle)', margin: '6px 0 0' }}>
          Ranking de clubes por medallas obtenidas en competencias oficiales.
        </p>
      </div>

      {/* Filters card */}
      <div className="dcard" style={{ padding: '18px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 180px', minWidth: 140 }}>
            <label
              style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--subtle)',
                marginBottom: 6,
              }}
            >
              Año
            </label>
            <select
              className="dselect"
              value={selectedYear || ''}
              disabled={historicalView}
              onChange={(e) => {
                setSelectedYear(Number(e.target.value));
                setHistoricalView(false);
              }}
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 20 }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                color: historicalView ? 'var(--accent2)' : 'var(--subtle)',
                userSelect: 'none',
              }}
            >
              <div
                onClick={() => setHistoricalView((v) => !v)}
                style={{
                  width: 40,
                  height: 22,
                  borderRadius: 11,
                  background: historicalView ? 'var(--accent)' : 'var(--surface3)',
                  border: `1px solid ${historicalView ? 'var(--accent)' : 'var(--border2)'}`,
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: historicalView ? 20 : 2,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: '#fff',
                    transition: 'left 0.2s',
                  }}
                />
              </div>
              Ver Histórico (Todos los Tiempos)
            </label>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 12,
          marginBottom: 20,
        }}
      >
        {[
          {
            label: 'Oros',
            value: displayTotals.gold,
            cls: 'mbadge mbadge-gold',
            color: 'var(--gold)',
          },
          {
            label: 'Platas',
            value: displayTotals.silver,
            cls: 'mbadge mbadge-silver',
            color: 'var(--silver)',
          },
          {
            label: 'Bronces',
            value: displayTotals.bronze,
            cls: 'mbadge mbadge-bronze',
            color: 'var(--bronze)',
          },
          {
            label: 'Clubes',
            value: displayMedallero.length,
            cls: '',
            color: 'var(--text)',
          },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="dcard"
            style={{ padding: '18px 20px', textAlign: 'center' }}
          >
            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                fontFamily: "'Space Mono', monospace",
                color,
                lineHeight: 1,
                marginBottom: 6,
              }}
            >
              {value}
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--subtle)',
              }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Main table */}
      <div className="dcard">
        {allTimeLoading && historicalView ? (
          <div style={{ padding: '52px 24px', textAlign: 'center' }}>
            <Loading />
          </div>
        ) : displayMedallero.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="dtable">
              <thead>
                <tr>
                  <th style={{ width: 54 }}>Pos.</th>
                  <th>Club</th>
                  <th className="tc" style={{ width: 70 }}>Oro</th>
                  <th className="tc" style={{ width: 70 }}>Plata</th>
                  <th className="tc" style={{ width: 70 }}>Bronce</th>
                  <th className="tc" style={{ width: 80 }}>Total</th>
                  <th className="tc" style={{ width: 80 }}>Puntos</th>
                </tr>
              </thead>
              <tbody>
                {displayMedallero.map((club, index) => (
                  <tr key={club.clubId}>
                    <td>
                      {index < 3 ? (
                        <span
                          className={`mbadge ${
                            index === 0
                              ? 'mbadge-gold'
                              : index === 1
                              ? 'mbadge-silver'
                              : 'mbadge-bronze'
                          }`}
                          style={{ fontSize: 11 }}
                        >
                          {index + 1}
                        </span>
                      ) : (
                        <span className="rank-num">{index + 1}</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <ClubAvatar club={club} />
                        <Link
                          to={`/clubes/${club.clubId}`}
                          style={{
                            textDecoration: 'none',
                            color: 'var(--text)',
                            fontWeight: 700,
                            fontSize: 14,
                          }}
                        >
                          {club.clubName}
                        </Link>
                      </div>
                    </td>
                    <td className="tc">
                      {club.gold > 0 && <span className="mbadge mbadge-gold">{club.gold}</span>}
                      {club.gold === 0 && (
                        <span style={{ color: 'var(--muted)', fontSize: 13 }}>—</span>
                      )}
                    </td>
                    <td className="tc">
                      {club.silver > 0 && (
                        <span className="mbadge mbadge-silver">{club.silver}</span>
                      )}
                      {club.silver === 0 && (
                        <span style={{ color: 'var(--muted)', fontSize: 13 }}>—</span>
                      )}
                    </td>
                    <td className="tc">
                      {club.bronze > 0 && (
                        <span className="mbadge mbadge-bronze">{club.bronze}</span>
                      )}
                      {club.bronze === 0 && (
                        <span style={{ color: 'var(--muted)', fontSize: 13 }}>—</span>
                      )}
                    </td>
                    <td className="tc">
                      <span
                        style={{
                          fontWeight: 800,
                          fontFamily: "'Space Mono', monospace",
                          fontSize: 14,
                        }}
                      >
                        {club.total}
                      </span>
                    </td>
                    <td className="tc">
                      <span style={{ fontSize: 13, color: 'var(--subtle)' }}>{club.points}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '52px 24px', textAlign: 'center' }}>
            <p style={{ color: 'var(--subtle)', margin: 0, fontSize: 14 }}>
              No hay medallas registradas para{' '}
              {historicalView ? 'ningún año' : `${selectedYear}`}.
            </p>
          </div>
        ) }
      </div>

      {/* Note */}
      <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 12, lineHeight: 1.8 }}>
        * Solo se incluyen eventos oficiales con nivel técnico WA_STANDARD o INDOOR_STANDARD.
        <br />
        * Los puntos se calculan considerando la distancia y el tipo de arco (70m, 50m, 30m, Indoor, Recurvo, Compuesto).
        <br />
        * En vista histórica se muestran los puntos totales de todos los tiempos.
      </p>
    </>
  );
}
