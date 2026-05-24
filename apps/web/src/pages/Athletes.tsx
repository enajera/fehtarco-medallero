import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { rankingApi, RankingEntry, mediaUrl } from '../api/client';
import Loading from '../components/Loading';

// ─── Constants ──────────────────────────────────────────────────────────────

const BOW_TABS = [
  { key: 'RECURVE',  label: 'Recurvo'   },
  { key: 'COMPOUND', label: 'Compuesto' },
  { key: 'BAREBOW',  label: 'Barebow'   },
] as const;

type BowKey = 'RECURVE' | 'COMPOUND' | 'BAREBOW';

// Tab accent color (shared between M and F for the tab pill)
const BOW_COLOR: Record<BowKey, string> = {
  RECURVE:  '#4F85FF',
  COMPOUND: '#F0A500',
  BAREBOW:  '#8BA4BC',
};

// Per-gender row colors
const GENDER_COLOR: Record<BowKey, { M: string; F: string }> = {
  RECURVE:  { M: '#4F85FF', F: '#FF6FCF' },
  COMPOUND: { M: '#F0A500', F: '#A855F7' },
  BAREBOW:  { M: '#8BA4BC', F: '#D4D4D4' },
};

const RANK_COLORS = {
  1: 'rgba(240,165,0,1)',    // gold
  2: 'rgba(192,192,192,1)',  // silver
  3: 'rgba(205,127,50,1)',   // bronze
} as Record<number, string>;

const DISTANCE_LABEL: Record<string, string> = {
  FIVE_METERS:    '5 m',
  TEN_METERS:     '10 m',
  THIRTY_METERS:  '30 m',
  FIFTY_METERS:   '50 m',
  SEVENTY_METERS: '70 m',
  INDOOR:         'Indoor 18 m',
};

// ─── Cache per bow type ──────────────────────────────────────────────────────

type CacheEntry = { M: RankingEntry[]; F: RankingEntry[] };
const rankCache: Partial<Record<BowKey, CacheEntry>> = {};

// ─── Avatar ──────────────────────────────────────────────────────────────────

function Avatar({ entry, color }: { entry: RankingEntry; color: string }) {
  const [imgError, setImgError] = useState(false);
  const initials = `${entry.firstName[0]}${entry.lastName[0]}`.toUpperCase();

  return (
    <div
      style={{
        width: 56,
        height: 56,
        borderRadius: '50%',
        flexShrink: 0,
        overflow: 'hidden',
        border: `2px solid ${color}`,
        background: `${color}18`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 16,
        fontWeight: 700,
        color,
      }}
    >
      {entry.hasPhoto && !imgError ? (
        <img
          src={mediaUrl(`/api/athletes/${entry.athleteId}/photo`)}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setImgError(true)}
        />
      ) : (
        initials
      )}
    </div>
  );
}

// ─── Rank badge ───────────────────────────────────────────────────────────────

function RankBadge({ rank, color }: { rank: number; color: string }) {
  const medalColor = RANK_COLORS[rank];
  const size = rank <= 3 ? 36 : 32;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Space Mono, monospace',
        fontWeight: 700,
        fontSize: rank <= 3 ? 14 : 13,
        background: medalColor
          ? `${medalColor.replace('1)', '0.12)')}`
          : `${color}12`,
        border: `2px solid ${medalColor || color}`,
        color: medalColor || color,
      }}
    >
      {rank}
    </div>
  );
}

// ─── Athlete row ─────────────────────────────────────────────────────────────

function AthleteRow({
  entry,
  color,
  index,
}: {
  entry: RankingEntry;
  color: string;
  index: number;
}) {
  const distLabel = DISTANCE_LABEL[entry.topDistance] || entry.topDistance;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.25 }}
    >
      <Link
        to={`/atletas/${entry.athleteId}`}
        style={{ textDecoration: 'none' }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '12px 16px',
            borderRadius: 12,
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            transition: 'background 0.15s, border-color 0.15s',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.background = `${color}0A`;
            (e.currentTarget as HTMLDivElement).style.borderColor = `${color}40`;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.background = 'var(--surface)';
            (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
          }}
        >
          {/* Rank */}
          <RankBadge rank={entry.rank} color={color} />

          {/* Avatar */}
          <Avatar entry={entry} color={color} />

          {/* Name + club */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 14,
                color: 'var(--text)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {entry.firstName} {entry.lastName}
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--subtle)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                marginTop: 1,
              }}
            >
              {entry.club?.name || 'Independiente'}
            </div>
          </div>

          {/* Distance chip */}
          <span
            style={{
              flexShrink: 0,
              fontSize: 11,
              padding: '3px 10px',
              borderRadius: 20,
              background: `${color}18`,
              color,
              border: `1px solid ${color}40`,
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            {distLabel}
          </span>

          {/* Stats group */}
          <div
            style={{
              flexShrink: 0,
              display: 'flex',
              gap: 16,
              alignItems: 'center',
            }}
          >
            <Stat label="Competencias" value={String(entry.totalCompetitions)} color="var(--subtle)" />
            <Stat label="Promedio" value={String(entry.avgScore)} color="var(--subtle)" />
            <Stat
              label="Mejor"
              value={String(entry.bestScore)}
              color={color}
              large
            />
          </div>

          {/* Arrow */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            style={{ flexShrink: 0, color: 'var(--subtle)', opacity: 0.5 }}
          >
            <path
              d="M6 3l5 5-5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </Link>
    </motion.div>
  );
}

function Stat({
  label,
  value,
  color,
  large,
}: {
  label: string;
  value: string;
  color: string;
  large?: boolean;
}) {
  return (
    <div style={{ textAlign: 'center', minWidth: large ? 60 : 48 }}>
      <div
        style={{
          fontFamily: 'Space Mono, monospace',
          fontSize: large ? 18 : 14,
          fontWeight: 700,
          color,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 10,
          color: 'var(--subtle)',
          marginTop: 2,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          fontWeight: 600,
        }}
      >
        {label}
      </div>
    </div>
  );
}

// ─── Gender section header ────────────────────────────────────────────────────

function GenderHeader({
  label,
  color,
  count,
}: {
  label: string;
  color: string;
  count: number;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        margin: '24px 0 12px',
      }}
    >
      <div
        style={{
          width: 4,
          height: 24,
          borderRadius: 2,
          background: color,
          boxShadow: `0 0 8px ${color}60`,
        }}
      />
      <h3
        style={{
          fontFamily: 'Clash Display, sans-serif',
          fontSize: 17,
          fontWeight: 700,
          color: 'var(--text)',
          margin: 0,
        }}
      >
        {label}
      </h3>
      <span
        style={{
          fontSize: 11,
          padding: '2px 10px',
          borderRadius: 20,
          background: `${color}18`,
          color,
          border: `1px solid ${color}40`,
          fontWeight: 600,
        }}
      >
        {count} atletas
      </span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Athletes() {
  const [activeTab, setActiveTab] = useState<BowKey>('RECURVE');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CacheEntry | null>(null);
  const [error, setError] = useState(false);

  // Fetch when tab changes, using per-tab cache
  const loadTab = (bow: BowKey) => {
    setActiveTab(bow);
    setSearch('');
    if (rankCache[bow]) {
      setData(rankCache[bow]!);
      return;
    }
    setLoading(true);
    setError(false);
    rankingApi
      .getByBowType(bow)
      .then((res) => {
        const entry = res.data.data;
        rankCache[bow] = entry;
        setData(entry);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  // Load initial tab on first render
  useMemo(() => {
    loadTab('RECURVE');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bowColor = BOW_COLOR[activeTab];
  const genderColors = GENDER_COLOR[activeTab];

  // Filter both genders by search
  const filtered = useMemo<CacheEntry>(() => {
    if (!data) return { M: [], F: [] };
    const q = search.trim().toLowerCase();
    if (!q) return data;
    const match = (e: RankingEntry) =>
      `${e.firstName} ${e.lastName}`.toLowerCase().includes(q);
    return { M: data.M.filter(match), F: data.F.filter(match) };
  }, [data, search]);

  const hasResults = filtered.M.length > 0 || filtered.F.length > 0;

  return (
    <>
      {/* ── Header ── */}
      <div style={{ marginBottom: 32 }}>
        <p className="page-eyebrow">Federación Hondureña de Tiro con Arco</p>
        <h1 className="page-title">Ranking de Atletas</h1>
        <p style={{ fontSize: 14, color: 'var(--subtle)', margin: '6px 0 0', maxWidth: 520 }}>
          Clasificación por distancia más larga competida y mejor puntaje en clasificatorias.
        </p>
      </div>

      {/* ── Tab pills ── */}
      <div className="dcard" style={{ padding: '14px 18px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {BOW_TABS.map(({ key, label }) => {
            const active = activeTab === key;
            const c = BOW_COLOR[key];
            return (
              <button
                key={key}
                onClick={() => loadTab(key)}
                style={{
                  padding: '6px 18px',
                  borderRadius: 20,
                  cursor: 'pointer',
                  border: `1px solid ${active ? c : 'var(--border)'}`,
                  background: active ? `${c}18` : 'transparent',
                  color: active ? c : 'var(--subtle)',
                  fontSize: 13,
                  fontFamily: 'Manrope, sans-serif',
                  fontWeight: active ? 700 : 400,
                  transition: 'all 0.15s',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Search ── */}
      <div style={{ marginBottom: 20, position: 'relative', maxWidth: 400 }}>
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
          placeholder="Buscar atleta..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ── Content ── */}
      {loading ? (
        <Loading />
      ) : error ? (
        <div className="dcard" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <p style={{ color: 'var(--subtle)', margin: 0, fontSize: 14 }}>
            Error al cargar el ranking. Intenta de nuevo.
          </p>
        </div>
      ) : !hasResults ? (
        <div className="dcard" style={{ padding: '64px 24px', textAlign: 'center' }}>
          <p style={{ color: 'var(--subtle)', margin: 0, fontSize: 14 }}>
            {search ? 'Sin resultados para tu busqueda.' : 'No hay datos de ranking para esta categoria aun.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Masculino */}
          {filtered.M.length > 0 && (
            <section>
              <GenderHeader
                label="Masculino"
                color={genderColors.M}
                count={filtered.M.length}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filtered.M.map((entry, i) => (
                  <AthleteRow
                    key={entry.athleteId}
                    entry={entry}
                    color={genderColors.M}
                    index={i}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Femenino */}
          {filtered.F.length > 0 && (
            <section>
              <GenderHeader
                label="Femenino"
                color={genderColors.F}
                count={filtered.F.length}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filtered.F.map((entry, i) => (
                  <AthleteRow
                    key={entry.athleteId}
                    entry={entry}
                    color={genderColors.F}
                    index={i}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </>
  );
}
