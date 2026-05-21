import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { profileApi, athletesApi, AthleteProfile, Athlete, mediaUrl } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import AthleteAuthModal from '../components/AthleteAuthModal';
import PhotoUpload from '../components/PhotoUpload';

const BOW_LABELS: Record<string, string> = {
  RECURVE: 'Recurvo',
  COMPOUND: 'Compuesto',
  BAREBOW: 'Barebow',
};

const MEDAL_COLORS = {
  GOLD:   { bg: 'rgba(240,165,0,0.15)',   color: 'var(--gold)',   label: 'Oro'    },
  SILVER: { bg: 'rgba(139,172,196,0.15)', color: 'var(--silver)', label: 'Plata'  },
  BRONZE: { bg: 'rgba(196,113,58,0.15)',  color: 'var(--bronze)', label: 'Bronce' },
};

export default function AthleteProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<AthleteProfile | null>(null);
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const isOwnProfile = user && athlete && athlete.userId === user.id;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileResponse = await profileApi.getAthlete(Number(id));
        setProfile(profileResponse.data.data);
        const athleteResponse = await athletesApi.getById(Number(id));
        const athleteData = athleteResponse.data.data;
        setAthlete(athleteData);
        if (athleteData.hasPhoto) {
          setPhotoUrl(mediaUrl(`/api/athletes/${id}/photo`));
        } else {
          setPhotoUrl(profileResponse.data.data.photoUrl || null);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProfile();
  }, [id]);

  if (loading) return <Loading />;
  if (!profile) return (
    <div style={{ padding: '64px 24px', textAlign: 'center', color: 'var(--subtle)' }}>
      Atleta no encontrado
    </div>
  );

  const initials = `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();
  const bowLabel = BOW_LABELS[profile.bowType] || profile.bowType;

  return (
    <>
      {/* Profile header band */}
      <div className="profile-band">
        <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
          {/* Photo */}
          <div className="ath-avatar ath-avatar--xl">
            {photoUrl ? (
              <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              initials
            )}
          </div>

          {/* Name + info */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1
              style={{
                fontFamily: 'Manrope, sans-serif',
                fontSize: 'clamp(22px, 3vw, 32px)',
                fontWeight: 800,
                color: 'var(--text)',
                margin: '0 0 6px',
              }}
            >
              {profile.firstName} {profile.lastName}
            </h1>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {profile.bowType && (
                <span className={`chip chip-${
                  profile.bowType === 'RECURVE' ? 'accent' :
                  profile.bowType === 'COMPOUND' ? 'gold' : 'muted'
                }`}>
                  {bowLabel}
                </span>
              )}
              {profile.gender && (
                <span className="chip chip-muted">
                  {profile.gender === 'M' ? 'Masculino' : 'Femenino'}
                </span>
              )}
              {profile.club ? (
                <Link
                  to={`/clubes/${profile.club.id}`}
                  style={{ textDecoration: 'none', color: 'var(--subtle)', fontSize: 13 }}
                >
                  {profile.club.name}
                </Link>
              ) : (
                <span style={{ fontSize: 13, color: 'var(--subtle)', opacity: 0.7 }}>
                  Atleta Independiente
                </span>
              )}
            </div>
          </div>

          {/* Stats pills */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { value: profile.stats.totalGold,   label: 'Oro',     color: 'var(--gold)'  },
              { value: profile.stats.totalSilver,  label: 'Plata',   color: 'var(--silver)'},
              { value: profile.stats.totalBronze,  label: 'Bronce',  color: 'var(--bronze)'},
              { value: profile.stats.totalEvents,  label: 'Eventos', color: 'var(--text)'  },
            ].map(({ value, label, color }) => (
              <div key={label} className="stat-pill">
                <div className="stat-pill-value" style={{ color }}>{value}</div>
                <div className="stat-pill-label">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Auth / Photo upload */}
      {isOwnProfile ? (
        <PhotoUpload
          athleteId={athlete!.id}
          currentPhotoUrl={photoUrl || undefined}
          onPhotoUpdated={(newPhotoUrl) => setPhotoUrl(newPhotoUrl)}
        />
      ) : athlete && !isOwnProfile ? (
        <AthleteAuthModal
          athlete={athlete}
          onSuccess={() => { window.location.reload(); }}
        />
      ) : null}

      {/* Competition history */}
      <div className="dcard">
        <div className="dcard-header">Historial de Competencias</div>
        {profile.history.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="dtable">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Evento</th>
                  <th>Categoría</th>
                  <th>Fase</th>
                  <th className="tc" style={{ width: 70 }}>Posición</th>
                  <th className="tc" style={{ width: 80 }}>Puntaje</th>
                  <th className="tc" style={{ width: 80 }}>Medalla</th>
                </tr>
              </thead>
              <tbody>
                {profile.history.map((result, index) => {
                  const mc = result.medal ? MEDAL_COLORS[result.medal as keyof typeof MEDAL_COLORS] : null;
                  return (
                    <tr key={index}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: 12, color: 'var(--subtle)' }}>
                        {new Date(result.eventDate).toLocaleDateString('es-HN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </td>
                      <td>
                        <Link
                          to={`/eventos/${result.eventId}`}
                          style={{
                            textDecoration: 'none',
                            color: 'var(--text)',
                            fontWeight: 600,
                            fontSize: 13,
                          }}
                        >
                          {result.eventName}
                        </Link>
                      </td>
                      <td>
                        <span style={{ fontSize: 12, color: 'var(--subtle)' }}>
                          {result.categoryName}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`chip ${result.phase === 'FINAL' ? 'chip-accent' : 'chip-muted'}`}
                          style={{ fontSize: 11 }}
                        >
                          {result.phase.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="tc">
                        <span
                          style={{
                            fontFamily: "'Space Mono', monospace",
                            fontWeight: 800,
                            fontSize: 14,
                            color: 'var(--text)',
                          }}
                        >
                          {result.position}
                        </span>
                      </td>
                      <td className="tc">
                        <span
                          style={{
                            fontFamily: "'Space Mono', monospace",
                            fontSize: 13,
                            color: 'var(--subtle)',
                          }}
                        >
                          {result.score}
                        </span>
                      </td>
                      <td className="tc">
                        {mc ? (
                          <span
                            className="chip"
                            style={{ background: mc.bg, color: mc.color, fontSize: 11 }}
                          >
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
              No hay resultados registrados
            </p>
          </div>
        )}
      </div>
    </>
  );
}
