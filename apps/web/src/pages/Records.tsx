import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { recordsApi, RecordEntry, mediaUrl } from '../api/client';
import Loading from '../components/Loading';

// ─── Orden fijo de secciones ────────────────────────────
const SECTION_ORDER: Array<{ bowType: string; gender: string }> = [
  { bowType: 'RECURVE',  gender: 'M' },
  { bowType: 'RECURVE',  gender: 'F' },
  { bowType: 'COMPOUND', gender: 'M' },
  { bowType: 'COMPOUND', gender: 'F' },
  { bowType: 'BAREBOW',  gender: 'M' },
  { bowType: 'BAREBOW',  gender: 'F' },
];

// ─── Colores por tipo de arco + género ─────────────────
// Alineados con el RankingGrid del home
const SECTION_COLORS: Record<string, { main: string; glow: string; bg: string }> = {
  'RECURVE-M':  { main: '#4F85FF', glow: 'rgba(79,133,255,0.18)',  bg: 'rgba(79,133,255,0.07)'  },
  'RECURVE-F':  { main: '#FF6FCF', glow: 'rgba(255,111,207,0.18)', bg: 'rgba(255,111,207,0.07)' },
  'COMPOUND-M': { main: '#F0A500', glow: 'rgba(240,165,0,0.18)',   bg: 'rgba(240,165,0,0.07)'   },
  'COMPOUND-F': { main: '#A855F7', glow: 'rgba(168,85,247,0.18)',  bg: 'rgba(168,85,247,0.07)'  },
  'BAREBOW-M':  { main: '#8BA4BC', glow: 'rgba(139,164,188,0.18)', bg: 'rgba(139,164,188,0.07)' },
  'BAREBOW-F':  { main: '#D4D4D4', glow: 'rgba(212,212,212,0.18)', bg: 'rgba(212,212,212,0.07)' },
};

const BOW_LABELS: Record<string, string> = {
  RECURVE:  'Recurvo',
  COMPOUND: 'Compuesto',
  BAREBOW:  'Barebow',
};

const GENDER_LABELS: Record<string, string> = {
  M: 'Masculino',
  F: 'Femenino',
};

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
    <svg width="52" height="52" viewBox="0 0 64 64" style={{ opacity: 0.14, flexShrink: 0 }}>
      {[30, 22, 14, 8, 4].map((r, i) => (
        <circle key={i} cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth={i === 4 ? 5 : 1.5} />
      ))}
      <line x1="32" y1="4"  x2="32" y2="60" stroke={color} strokeWidth="1" />
      <line x1="4"  y1="32" x2="60" y2="32" stroke={color} strokeWidth="1" />
    </svg>
  );
}

// ─── Tarjeta de record ──────────────────────────────
function RecordCard({ record, index, colors }: { record: RecordEntry; index: number; colors: typeof SECTION_COLORS[string] }) {
  const [imgError, setImgError] = useState(false);

  const distLabel   = record.distance ? (DISTANCE_LABEL[record.distance] || record.distance) : null;
  const phaseLabel  = PHASE_LABEL[record.phase] || record.phase;
  const modalLabel  = MODALITY_LABEL[record.modality] || record.modality;
  const divLabel    = record.division;
  const eventDate   = new Date(record.event.date).toLocaleDateString('es-HN', {
    month: 'short', year: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      style={{
        background: 'var(--surface)',
        border: `1px solid var(--border)`,
        borderRadius: 14,
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Franja superior con el color de la categoría */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${colors.main}, transparent)`,
      }} />

      {/* Header: división + modalidad + target deco */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: colors.main, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
            {divLabel} · {modalLabel}
          </div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {distLabel && (
              <span style={{
                fontSize: 11, padding: '2px 9px', borderRadius: 20, fontWeight: 600,
                background: colors.bg, color: colors.main, border: `1px solid ${colors.glow}`,
              }}>
                {distLabel}
              </span>
            )}
            <span style={{
              fontSize: 11, padding: '2px 9px', borderRadius: 20,
              background: 'rgba(255,255,255,0.04)', color: 'var(--subtle)',
              border: '1px solid var(--border)',
            }}>
              {phaseLabel}
            </span>
          </div>
        </div>
        <TargetDeco color={colors.main} />
      </div>

      {/* Score */}
      <div style={{ textAlign: 'center', padding: '2px 0 6px' }}>
        <div style={{
          fontFamily: 'Space Mono, monospace',
          fontSize: 'clamp(40px, 6vw, 60px)',
          fontWeight: 700,
          color: colors.main,
          lineHeight: 1,
          letterSpacing: '-2px',
          textShadow: `0 0 24px ${colors.glow}`,
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

      {/* Atleta */}
      <Link
        to={`/atletas/${record.athlete.id}`}
        style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
          background: colors.bg, border: `2px solid ${colors.glow}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, color: colors.main,
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
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {record.athlete.firstName} {record.athlete.lastName}
          </div>
          {record.athlete.club && (
            <div style={{ fontSize: 11, color: 'var(--subtle)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {record.athlete.club.name}
            </div>
          )}
        </div>
      </Link>

      {/* Evento */}
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
          color: 'var(--subtle)', opacity: 0.55, flexShrink: 0,
        }}>
          {eventDate}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Filtros ─────────────────────────────────────────
type PhaseFilter = 'ALL' | 'QUALIFICATION' | 'FINAL';

// ─── Página principal ────────────────────────────────
export default function RecordsPage() {
  const [records, setRecords]   = useState<RecordEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [phase,   setPhase]     = useState<PhaseFilter>('QUALIFICATION');

  useEffect(() => {
    setLoading(true);
    recordsApi.getAll({ phase: phase !== 'ALL' ? phase : undefined })
      .then(res => setRecords(res.data.data || []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [phase]);

  // Agrupar por "bowType-gender" con orden fijo
  const sections = useMemo(() => {
    return SECTION_ORDER
      .map(({ bowType, gender }) => {
        const key    = `${bowType}-${gender}`;
        const colors = SECTION_COLORS[key];
        const entries = records.filter(r => r.bowType === bowType && r.gender === gender);
        return { key, bowType, gender, colors, entries };
      })
      .filter(s => s.entries.length > 0);
  }, [records]);

  const pillStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 16px',
    borderRadius: 20,
    cursor: 'pointer',
    border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
    background: active ? 'rgba(45,107,255,0.12)' : 'transparent',
    color: active ? 'var(--accent)' : 'var(--subtle)',
    fontSize: 13,
    fontFamily: 'Manrope, sans-serif',
    fontWeight: active ? 700 : 400,
    transition: 'all 0.15s',
  });

  return (
    <>
      {/* ── Encabezado ── */}
      <div style={{ marginBottom: 32 }}>
        <p className="page-eyebrow">Federación Hondureña de Tiro con Arco</p>
        <h1 className="page-title">Records Nacionales</h1>
        <p style={{ fontSize: 14, color: 'var(--subtle)', margin: '6px 0 0', maxWidth: 520 }}>
          El mejor puntaje registrado en competencias oficiales por categoría, distancia y modalidad.
        </p>
      </div>

      {/* ── Filtro de fase ── */}
      <div className="dcard" style={{ padding: '14px 18px', marginBottom: 28 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{
            fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: 'var(--subtle)', marginRight: 4,
          }}>
            Fase
          </span>
          {([
            ['QUALIFICATION', 'Clasificación'],
            ['FINAL',         'Final'],
            ['ALL',           'Todas'],
          ] as [PhaseFilter, string][]).map(([p, label]) => (
            <button key={p} onClick={() => setPhase(p)} style={pillStyle(phase === p)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Contenido ── */}
      {loading ? (
        <Loading />
      ) : records.length === 0 ? (
        <div className="dcard" style={{ padding: '64px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.2 }}>🎯</div>
          <p style={{ color: 'var(--subtle)', margin: 0, fontSize: 14 }}>
            No hay records con estos filtros todavía.
          </p>
          <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--subtle)', opacity: 0.7 }}>
            Los records se generan automáticamente desde resultados de eventos oficiales.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          {sections.map(({ key, bowType, gender, colors, entries }) => (
            <section key={key}>

              {/* ── Encabezado de sección ── */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                {/* Barra de color */}
                <div style={{
                  width: 4, height: 28, borderRadius: 2,
                  background: colors.main,
                  boxShadow: `0 0 8px ${colors.glow}`,
                }} />
                <div>
                  <h2 style={{
                    fontFamily: 'Clash Display, sans-serif',
                    fontSize: 20,
                    fontWeight: 700,
                    color: 'var(--text)',
                    margin: 0,
                    lineHeight: 1.1,
                  }}>
                    {BOW_LABELS[bowType] || bowType}
                    <span style={{ color: colors.main, marginLeft: 8 }}>
                      {GENDER_LABELS[gender] || gender}
                    </span>
                  </h2>
                </div>
                <span style={{
                  fontSize: 12, padding: '2px 10px', borderRadius: 20,
                  background: colors.bg,
                  color: colors.main,
                  border: `1px solid ${colors.glow}`,
                  fontWeight: 600,
                }}>
                  {entries.length} {entries.length === 1 ? 'record' : 'records'}
                </span>
              </div>

              {/* ── Grid de cards ── */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
                gap: 14,
              }}>
                {entries.map((record, i) => (
                  <RecordCard
                    key={`${record.bowType}-${record.gender}-${record.division}-${record.modality}-${record.distance ?? 'null'}-${record.phase}`}
                    record={record}
                    index={i}
                    colors={colors}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
