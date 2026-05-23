import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { recordsApi, RecordEntry, mediaUrl } from '../api/client';
import Loading from '../components/Loading';

// ─── Mapeos de etiquetas ────────────────────────────
const BOW_LABEL: Record<string, string> = {
  RECURVE: 'Recurvo',
  COMPOUND: 'Compuesto',
  BAREBOW: 'Barebow',
};
const BOW_COLOR: Record<string, string> = {
  RECURVE: 'var(--accent)',
  COMPOUND: 'var(--gold)',
  BAREBOW: 'var(--silver)',
};
const GENDER_LABEL: Record<string, string> = { M: 'Masculino', F: 'Femenino' };
const DISTANCE_LABEL: Record<string, string> = {
  FIVE_METERS:    '5 m',
  TEN_METERS:     '10 m',
  THIRTY_METERS:  '30 m',
  FIFTY_METERS:   '50 m',
  SEVENTY_METERS: '70 m',
  INDOOR:         'Indoor 18 m',
};
const PHASE_LABEL: Record<string, string> = {
  QUALIFICATION: 'Clasificación',
  FINAL:         'Final',
  BRONZE_MATCH:  'Bronce',
};
const MODALITY_LABEL: Record<string, string> = {
  INDIVIDUAL: 'Individual',
  TEAM:       'Equipo',
  MIXED:      'Mixto',
};

// ─── SVG Target decorativo ──────────────────────────
function TargetDeco({ color }: { color: string }) {
  return (
    <svg width="60" height="60" viewBox="0 0 64 64" style={{ opacity: 0.12, flexShrink: 0 }}>
      {[30, 22, 14, 8, 4].map((r, i) => (
        <circle key={i} cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth={i === 4 ? 5 : 1.5} />
      ))}
      <line x1="32" y1="4" x2="32" y2="60" stroke={color} strokeWidth="1" />
      <line x1="4"  y1="32" x2="60" y2="32" stroke={color} strokeWidth="1" />
    </svg>
  );
}

// ─── Tarjeta de record ──────────────────────────────
function RecordCard({ record, index }: { record: RecordEntry; index: number }) {
  const color = BOW_COLOR[record.bowType] || 'var(--accent)';
  const [imgError, setImgError] = useState(false);

  const categoryLabel = [
    BOW_LABEL[record.bowType] || record.bowType,
    GENDER_LABEL[record.gender] || record.gender,
    record.division,
    MODALITY_LABEL[record.modality] || record.modality,
  ].join(' · ');

  const distLabel = record.distance ? (DISTANCE_LABEL[record.distance] || record.distance) : null;
  const eventDate = new Date(record.event.date).toLocaleDateString('es-HN', {
    month: 'short', year: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Franja de color superior */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${color}, transparent)`,
      }} />

      {/* Header: categoría + target deco */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color,
            textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {categoryLabel}
          </div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {distLabel && (
              <span style={{
                fontSize: 11, padding: '2px 9px', borderRadius: 20,
                background: `${color}18`, color, border: `1px solid ${color}30`, fontWeight: 600,
              }}>
                {distLabel}
              </span>
            )}
            <span style={{
              fontSize: 11, padding: '2px 9px', borderRadius: 20,
              background: 'rgba(255,255,255,0.04)', color: 'var(--subtle)',
              border: '1px solid var(--border)',
            }}>
              {PHASE_LABEL[record.phase] || record.phase}
            </span>
          </div>
        </div>
        <TargetDeco color={color} />
      </div>

      {/* Score grande — el puntaje a vencer */}
      <div style={{ textAlign: 'center', padding: '4px 0 8px' }}>
        <div style={{
          fontFamily: 'Space Mono, monospace',
          fontSize: 'clamp(44px, 6vw, 64px)',
          fontWeight: 700,
          color,
          lineHeight: 1,
          letterSpacing: '-2px',
        }}>
          {record.score}
        </div>
        <div style={{
          fontSize: 10, color: 'var(--subtle)', marginTop: 6,
          fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em',
        }}>
          puntaje a vencer
        </div>
      </div>

      {/* Atleta poseedor */}
      <Link
        to={`/atletas/${record.athlete.id}`}
        style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}
      >
        <div style={{
          width: 38, height: 38, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
          background: `${color}18`, border: `2px solid ${color}35`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, color,
        }}>
          {record.athlete.hasPhoto && !imgError ? (
            <img
              src={mediaUrl(`/api/athletes/${record.athlete.id}/photo`)}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={() => setImgError(true)}
            />
          ) : (
            `${record.athlete.firstName[0]}${record.athlete.lastName[0]}`
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 700, color: 'var(--text)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {record.athlete.firstName} {record.athlete.lastName}
          </div>
          {record.athlete.club && (
            <div style={{
              fontSize: 11, color: 'var(--subtle)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {record.athlete.club.name}
            </div>
          )}
        </div>
      </Link>

      {/* Evento donde se estableció */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        paddingTop: 10, borderTop: '1px solid var(--border)',
      }}>
        <Link
          to={`/eventos/${record.event.id}`}
          style={{
            fontSize: 11, color: 'var(--subtle)', flex: 1,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            textDecoration: 'none',
          }}
          title={record.event.name}
        >
          {record.event.name}
        </Link>
        <span style={{
          fontSize: 11, fontFamily: 'Space Mono, monospace',
          color: 'var(--subtle)', opacity: 0.6, flexShrink: 0,
        }}>
          {eventDate}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Filtros ─────────────────────────────────────────
type BowFilter    = 'ALL' | 'RECURVE' | 'COMPOUND' | 'BAREBOW';
type GenderFilter = 'ALL' | 'M' | 'F';
type PhaseFilter  = 'ALL' | 'QUALIFICATION' | 'FINAL';

// ─── Página principal ────────────────────────────────
export default function RecordsPage() {
  const [records, setRecords] = useState<RecordEntry[]>([]);
  const [loading, setLoading]  = useState(true);
  const [bow,    setBow]       = useState<BowFilter>('ALL');
  const [gender, setGender]    = useState<GenderFilter>('ALL');
  const [phase,  setPhase]     = useState<PhaseFilter>('QUALIFICATION');

  useEffect(() => {
    setLoading(true);
    recordsApi.getAll({
      bowType: bow    !== 'ALL' ? bow    : undefined,
      gender:  gender !== 'ALL' ? gender : undefined,
      phase:   phase  !== 'ALL' ? phase  : undefined,
    })
      .then(res => setRecords(res.data.data || []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [bow, gender, phase]);

  // Agrupar por bowType para secciones visuales
  const grouped = useMemo(() => {
    const map = new Map<string, RecordEntry[]>();
    for (const r of records) {
      if (!map.has(r.bowType)) map.set(r.bowType, []);
      map.get(r.bowType)!.push(r);
    }
    return map;
  }, [records]);

  const pill = (active: boolean, color = 'var(--accent)'): React.CSSProperties => ({
    padding: '6px 16px', borderRadius: 20, cursor: 'pointer',
    border: `1px solid ${active ? color : 'var(--border)'}`,
    background: active ? `${color}18` : 'transparent',
    color: active ? color : 'var(--subtle)',
    fontSize: 13, fontFamily: 'Manrope, sans-serif',
    fontWeight: active ? 700 : 400, transition: 'all 0.15s',
  });

  return (
    <div style={{ padding: 'clamp(20px, 4vw, 48px) clamp(16px, 4vw, 40px)', maxWidth: 1200, margin: '0 auto' }}>

      {/* Título */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
          FEHTARCO · Histórico
        </div>
        <h1 style={{
          fontFamily: 'Clash Display, sans-serif',
          fontSize: 'clamp(28px, 5vw, 48px)',
          fontWeight: 700, color: 'var(--text)',
          margin: '0 0 10px', lineHeight: 1.1,
        }}>
          Records Nacionales
        </h1>
        <p style={{ color: 'var(--subtle)', fontSize: 14, margin: 0, maxWidth: 520 }}>
          El mejor puntaje registrado en competencias oficiales por categoría, distancia y modalidad.
          ¿Puedes superarlo?
        </p>
      </div>

      {/* Filtros */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '14px 18px', marginBottom: 32,
        display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center',
      }}>
        {/* Arco */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['ALL', 'RECURVE', 'COMPOUND', 'BAREBOW'] as BowFilter[]).map(b => (
            <button key={b} onClick={() => setBow(b)}
              style={pill(bow === b, BOW_COLOR[b] || 'var(--accent)')}>
              {b === 'ALL' ? 'Todos' : BOW_LABEL[b]}
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 22, background: 'var(--border)', flexShrink: 0 }} />

        {/* Género */}
        <div style={{ display: 'flex', gap: 6 }}>
          {(['ALL', 'M', 'F'] as GenderFilter[]).map(g => (
            <button key={g} onClick={() => setGender(g)} style={pill(gender === g)}>
              {g === 'ALL' ? 'M + F' : GENDER_LABEL[g]}
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 22, background: 'var(--border)', flexShrink: 0 }} />

        {/* Fase */}
        <div style={{ display: 'flex', gap: 6 }}>
          {([['QUALIFICATION', 'Clasificación'], ['FINAL', 'Final'], ['ALL', 'Todas las fases']] as [PhaseFilter, string][])
            .map(([p, label]) => (
              <button key={p} onClick={() => setPhase(p)} style={pill(phase === p)}>
                {label}
              </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      {loading ? (
        <Loading />
      ) : records.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--subtle)' }}>
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.25 }}>🎯</div>
          <p style={{ margin: 0, fontSize: 15 }}>No hay records con estos filtros todavía.</p>
          <p style={{ margin: '8px 0 0', fontSize: 13, opacity: 0.7 }}>
            Los records se generan automáticamente desde resultados de eventos oficiales.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 44 }}>
          {Array.from(grouped.entries()).map(([bowType, entries]) => (
            <section key={bowType}>
              {/* Encabezado de sección */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                <div style={{ width: 4, height: 26, borderRadius: 2, background: BOW_COLOR[bowType] || 'var(--accent)' }} />
                <h2 style={{
                  fontFamily: 'Clash Display, sans-serif', fontSize: 22,
                  fontWeight: 700, color: 'var(--text)', margin: 0,
                }}>
                  {BOW_LABEL[bowType] || bowType}
                </h2>
                <span style={{
                  fontSize: 12, padding: '2px 10px', borderRadius: 20,
                  background: 'rgba(255,255,255,0.04)', color: 'var(--subtle)',
                  border: '1px solid var(--border)',
                }}>
                  {entries.length} {entries.length === 1 ? 'record' : 'records'}
                </span>
              </div>

              {/* Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: 16,
              }}>
                {entries.map((record, i) => (
                  <RecordCard
                    key={`${record.bowType}-${record.gender}-${record.division}-${record.modality}-${record.distance ?? 'null'}-${record.phase}`}
                    record={record}
                    index={i}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
