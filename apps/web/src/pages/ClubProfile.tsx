import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { profileApi, ClubProfile } from '../api/client';
import Loading from '../components/Loading';

const MEDAL_COLORS = {
  GOLD:   { bg: 'rgba(240,165,0,0.15)',   color: 'var(--gold)',   label: 'Oro'    },
  SILVER: { bg: 'rgba(139,172,196,0.15)', color: 'var(--silver)', label: 'Plata'  },
  BRONZE: { bg: 'rgba(196,113,58,0.15)',  color: 'var(--bronze)', label: 'Bronce' },
};

export default function ClubProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<ClubProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await profileApi.getClub(Number(id));
        setProfile(response.data.data);
      } catch (error) {
        console.error('Error fetching club profile:', error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProfile();
  }, [id]);

  if (loading) return <Loading />;
  if (!profile) return (
    <div style={{ padding: '64px 24px', textAlign: 'center', color: 'var(--subtle)' }}>
      Club no encontrado
    </div>
  );

  const initials = profile.name.substring(0, 2).toUpperCase();

  return (
    <>
      {/* Profile header band */}
      <div className="profile-band">
        <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
          {/* Logo circle */}
          <div className="club-avatar club-avatar--xl">
            {profile.hasLogo ? (
              <img
                src={`/api/clubs/${profile.id}/logo`}
                alt={profile.name}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              initials
            )}
          </div>

          {/* Name + city */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1
              style={{
                fontFamily: 'Manrope, sans-serif',
                fontSize: 'clamp(22px, 3vw, 32px)',
                fontWeight: 800,
                color: 'var(--text)',
                margin: '0 0 4px',
              }}
            >
              {profile.name}
            </h1>
            {profile.city && (
              <p style={{ fontSize: 14, color: 'var(--subtle)', margin: 0 }}>
                {profile.city}
              </p>
            )}
          </div>

          {/* Stats pills */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { value: profile.stats.totalGold,    label: 'Oro',     color: 'var(--gold)'  },
              { value: profile.stats.totalSilver,   label: 'Plata',   color: 'var(--silver)'},
              { value: profile.stats.totalBronze,   label: 'Bronce',  color: 'var(--bronze)'},
              { value: profile.stats.totalAthletes, label: 'Atletas', color: 'var(--text)'  },
            ].map(({ value, label, color }) => (
              <div key={label} className="stat-pill">
                <div className="stat-pill-value" style={{ color }}>
                  {value}
                </div>
                <div className="stat-pill-label">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>
        {/* Athletes table */}
        <div className="dcard">
          <div className="dcard-header">Atletas del Club</div>
          {profile.athletes.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="dtable">
                <thead>
                  <tr>
                    <th>Atleta</th>
                    <th>Arco</th>
                    <th className="tc" style={{ width: 60 }}>Oro</th>
                    <th className="tc" style={{ width: 60 }}>Plata</th>
                    <th className="tc" style={{ width: 60 }}>Bronce</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.athletes.map((athlete) => (
                    <tr key={athlete.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="ath-avatar" style={{ width: 32, height: 32, fontSize: 11 }}>
                            {athlete.hasPhoto ? (
                              <img
                                src={`/api/athletes/${athlete.id}/photo`}
                                alt=""
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              `${athlete.firstName[0]}${athlete.lastName[0]}`
                            )}
                          </div>
                          <Link
                            to={`/atletas/${athlete.id}`}
                            style={{
                              textDecoration: 'none',
                              color: 'var(--text)',
                              fontWeight: 600,
                              fontSize: 13,
                            }}
                          >
                            {athlete.firstName} {athlete.lastName}
                          </Link>
                        </div>
                      </td>
                      <td>
                        <span className="chip chip-muted" style={{ fontSize: 11 }}>
                          {athlete.bowType === 'RECURVE'
                            ? 'Recurvo'
                            : athlete.bowType === 'COMPOUND'
                            ? 'Compuesto'
                            : athlete.bowType}
                        </span>
                      </td>
                      <td className="tc">
                        {athlete.medals.gold > 0 ? (
                          <span className="mbadge mbadge-gold" style={{ width: 24, height: 24, fontSize: 11 }}>
                            {athlete.medals.gold}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>
                        )}
                      </td>
                      <td className="tc">
                        {athlete.medals.silver > 0 ? (
                          <span className="mbadge mbadge-silver" style={{ width: 24, height: 24, fontSize: 11 }}>
                            {athlete.medals.silver}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>
                        )}
                      </td>
                      <td className="tc">
                        {athlete.medals.bronze > 0 ? (
                          <span className="mbadge mbadge-bronze" style={{ width: 24, height: 24, fontSize: 11 }}>
                            {athlete.medals.bronze}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '36px 24px', textAlign: 'center', color: 'var(--subtle)', fontSize: 14 }}>
              No hay atletas registrados
            </div>
          )}
        </div>

        {/* Yearly medals */}
        <div className="dcard">
          <div className="dcard-header">Medallas por Año</div>
          {profile.yearlyMedals.length > 0 ? (
            <table className="dtable">
              <thead>
                <tr>
                  <th>Año</th>
                  <th className="tc" style={{ width: 50 }}>Oro</th>
                  <th className="tc" style={{ width: 50 }}>Plata</th>
                  <th className="tc" style={{ width: 50 }}>Bronce</th>
                </tr>
              </thead>
              <tbody>
                {profile.yearlyMedals.map((year) => (
                  <tr key={year.year}>
                    <td>
                      <span
                        style={{
                          fontFamily: "'Space Mono', monospace",
                          fontWeight: 700,
                          fontSize: 13,
                          color: 'var(--accent2)',
                        }}
                      >
                        {year.year}
                      </span>
                    </td>
                    <td className="tc">
                      {year.gold > 0 ? (
                        <span className="mbadge mbadge-gold" style={{ width: 24, height: 24, fontSize: 11 }}>
                          {year.gold}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>
                      )}
                    </td>
                    <td className="tc">
                      {year.silver > 0 ? (
                        <span className="mbadge mbadge-silver" style={{ width: 24, height: 24, fontSize: 11 }}>
                          {year.silver}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>
                      )}
                    </td>
                    <td className="tc">
                      {year.bronze > 0 ? (
                        <span className="mbadge mbadge-bronze" style={{ width: 24, height: 24, fontSize: 11 }}>
                          {year.bronze}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '28px 24px', textAlign: 'center', color: 'var(--subtle)', fontSize: 13 }}>
              Sin datos
            </div>
          )}
        </div>
      </div>

      {/* Contributions table */}
      {profile.contributions && profile.contributions.length > 0 && (
        <div className="dcard" style={{ marginTop: 20 }}>
          <div className="dcard-header">Contribuciones Históricas</div>
          <div style={{ overflowX: 'auto' }}>
            <table className="dtable">
              <thead>
                <tr>
                  <th>Evento</th>
                  <th>Fecha</th>
                  <th>Atleta</th>
                  <th>Medalla</th>
                  <th>Fase</th>
                </tr>
              </thead>
              <tbody>
                {profile.contributions.map((c, i) => {
                  const mc = MEDAL_COLORS[c.medal as keyof typeof MEDAL_COLORS];
                  return (
                    <tr key={i}>
                      <td style={{ fontSize: 13, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.eventName || `#${c.eventId}`}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--subtle)', whiteSpace: 'nowrap' }}>
                        {new Date(c.eventDate).toLocaleDateString('es-HN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </td>
                      <td>
                        <Link
                          to={`/atletas/${c.athleteId}`}
                          style={{ textDecoration: 'none', color: 'var(--text)', fontWeight: 600, fontSize: 13 }}
                        >
                          {c.athleteName}
                        </Link>
                      </td>
                      <td>
                        {mc ? (
                          <span className="chip" style={{ background: mc.bg, color: mc.color }}>
                            {mc.label}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--subtle)', fontSize: 12 }}>{c.medal}</span>
                        )}
                      </td>
                      <td>
                        <span className="chip chip-muted" style={{ fontSize: 11 }}>
                          {c.phase.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
