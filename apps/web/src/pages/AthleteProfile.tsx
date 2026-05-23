import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { profileApi, athletesApi, AthleteProfile, Athlete, mediaUrl } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import AthleteAuthModal from '../components/AthleteAuthModal';
import PhotoUpload from '../components/PhotoUpload';
import ScoreChart from '../components/athlete/ScoreChart';
import ClubTimeline from '../components/athlete/ClubTimeline';
import AthletePrivatePanel from '../components/athlete/AthletePrivatePanel';

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

const PHASE_LABELS: Record<string, string> = {
  QUALIFICATION: 'Clasificación',
  FINAL: 'Final',
  BRONZE_MATCH: 'Bronce',
};

const DISTANCE_LABEL: Record<string, string> = {
  FIVE_METERS:    '5 m',
  TEN_METERS:     '10 m',
  THIRTY_METERS:  '30 m',
  FIFTY_METERS:   '50 m',
  SEVENTY_METERS: '70 m',
  INDOOR:         'Indoor 18 m',
};

export default function AthleteProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<AthleteProfile | null>(null);
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const isOwnProfile = !!(user && athlete && athlete.userId === user.id);

  const fetchAll = async () => {
    try {
      const [profileRes, athleteRes] = await Promise.all([
        profileApi.getAthlete(Number(id)),
        athletesApi.getById(Number(id)),
      ]);
      const profileData = profileRes.data.data;
      const athleteData = athleteRes.data.data;
      setProfile(profileData);
      setAthlete(athleteData);
      if (athleteData.hasPhoto) {
        setPhotoUrl(mediaUrl(`/api/athletes/${id}/photo`));
      } else {
        setPhotoUrl(profileData.photoUrl || null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchAll();
  }, [id]);

  if (loading) return <Loading />;
  if (!profile) return (
    <div style={{ padding: '64px 24px', textAlign: 'center', color: 'var(--subtle)' }}>
      Atleta no encontrado
    </div>
  );

  const initials = `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();
  const bowLabel = BOW_LABELS[profile.bowType] || profile.bowType;
  const hasClubHistory = profile.clubHistory && profile.clubHistory.length > 1;
  const hasChart = profile.history.filter(h => h.score > 0).length >= 2;

  return (
    <>
      {/* ── Profile header ── */}
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

          {/* Name + tags */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{
              fontFamily: 'Manrope, sans-serif',
              fontSize: 'clamp(22px, 3vw, 32px)',
              fontWeight: 800,
              color: 'var(--text)',
              margin: '0 0 8px',
            }}>
              {profile.firstName} {profile.lastName}
            </h1>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {profile.bowType && (
                <span className={`chip chip-${profile.bowType === 'RECURVE' ? 'accent' : profile.bowType === 'COMPOUND' ? 'gold' : 'muted'}`}>
                  {bowLabel}
                </span>
              )}
              {profile.gender && (
                <span className="chip chip-muted">
                  {profile.gender === 'M' ? 'Masculino' : 'Femenino'}
                </span>
              )}
              {profile.club ? (
                <Link to={`/clubes/${profile.club.id}`} style={{ textDecoration: 'none', color: 'var(--subtle)', fontSize: 13 }}>
                  {profile.club.name}
                </Link>
              ) : (
                <span style={{ fontSize: 13, color: 'var(--subtle)', opacity: 0.7 }}>Atleta Independiente</span>
              )}
            </div>
          </div>

          {/* Stats pills */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { value: profile.stats.totalGold,   label: 'Oro',     color: 'var(--gold)'   },
              { value: profile.stats.totalSilver,  label: 'Plata',   color: 'var(--silver)' },
              { value: profile.stats.totalBronze,  label: 'Bronce',  color: 'var(--bronze)' },
              { value: profile.stats.totalEvents,  label: 'Eventos', color: 'var(--text)'   },
            ].map(({ value, label, color }) => (
              <div key={label} className="stat-pill">
                <div className="stat-pill-value" style={{ color }}>{value}</div>
                <div className="stat-pill-label">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Auth / Photo upload ── */}
      {isOwnProfile ? (
        <PhotoUpload
          athleteId={athlete!.id}
          currentPhotoUrl={photoUrl || undefined}
          onPhotoUpdated={(newPhotoUrl) => setPhotoUrl(newPhotoUrl)}
        />
      ) : athlete && !isOwnProfile ? (
        <AthleteAuthModal
          athlete={athlete}
          onSuccess={() => window.location.reload()}
        />
      ) : null}

      {/* ── Panel privado (solo dueño del perfil) ── */}
      {isOwnProfile && athlete && (
        <div className="dcard">
          <AthletePrivatePanel
            athlete={athlete}
            onUpdated={(updated) => setAthlete(updated)}
          />
        </div>
      )}

      {/* ── Progresión de scores ── */}
      {hasChart && (
        <div className="dcard">
          <div className="dcard-header">Progresión de Puntajes</div>
          <ScoreChart history={profile.history} />
        </div>
      )}

      {/* ── Historial de clubes ── */}
      {hasClubHistory && (
        <div className="dcard">
          <div className="dcard-header">Historial de Clubes</div>
          <ClubTimeline clubHistory={profile.clubHistory} currentClub={profile.club} />
        </div>
      )}

      {/* ── Historial de competencias ── */}
      <div className="dcard">
        <div className="dcard-header">Historial de Competencias</div>
        {profile.history.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="dtable">
              <thead>
                <tr style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--subtle)',
                }}>
                  <th>Fecha</th>
                  <th>Evento</th>
                  <th>Categoría</th>
                  <th>Distancia</th>
                  <th>Fase</th>
                  <th className="tc" style={{ width: 70 }}>Pos.</th>
                  <th className="tc" style={{ width: 80 }}>Score</th>
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
                        <Link to={`/eventos/${result.eventId}`} style={{ textDecoration: 'none', color: 'var(--text)', fontWeight: 600, fontSize: 13 }}>
                          {result.eventName}
                        </Link>
                      </td>
                      <td>
                        <span style={{ fontSize: 12, color: 'var(--subtle)' }}>{result.categoryName}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: 12, color: 'var(--subtle)', whiteSpace: 'nowrap' }}>
                          {result.distance ? (DISTANCE_LABEL[result.distance] || result.distance) : '—'}
                        </span>
                      </td>
                      <td>
                        <span className={`chip ${result.phase === 'FINAL' ? 'chip-accent' : result.phase === 'BRONZE_MATCH' ? 'chip-gold' : 'chip-muted'}`} style={{ fontSize: 11 }}>
                          {PHASE_LABELS[result.phase] || result.phase}
                        </span>
                      </td>
                      <td className="tc">
                        <span style={{ fontFamily: 'Space Mono, monospace', fontWeight: 800, fontSize: 14, color: 'var(--text)' }}>
                          {result.position}
                        </span>
                      </td>
                      <td className="tc">
                        <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 13, color: 'var(--subtle)' }}>
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
              No hay resultados registrados
            </p>
          </div>
        )}
      </div>
    </>
  );
}
