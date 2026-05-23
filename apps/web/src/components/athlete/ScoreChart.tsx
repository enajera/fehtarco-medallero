import { useState, useMemo } from 'react';
import type { AthleteHistoryEntry } from '@/api/client';

interface Props {
  history: AthleteHistoryEntry[];
}

const DISTANCE_LABEL: Record<string, string> = {
  FIVE_METERS:    '5 m',
  TEN_METERS:     '10 m',
  THIRTY_METERS:  '30 m',
  FIFTY_METERS:   '50 m',
  SEVENTY_METERS: '70 m',
  INDOOR:         'Indoor 18 m',
};

// Scores de fase QUALIFICATION son los totales comparables.
// FINAL en eliminatorias usa sistema de sets (máx 6 puntos por set)
// que no es un score acumulado — se excluye de la gráfica.
const VALID_PHASES = ['QUALIFICATION'];

// Umbral mínimo para descartar scores de sistemas de sets o errores de carga
const MIN_SCORE = 30;

export default function ScoreChart({ history }: Props) {
  // Solo resultados de QUALIFICATION con score real
  const eligible = useMemo(() =>
    history
      .filter(h => VALID_PHASES.includes(h.phase) && h.score >= MIN_SCORE)
      .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()),
    [history]
  );

  // Distancias únicas presentes
  const distances = useMemo(() => {
    const set = new Set(eligible.map(h => h.distance ?? 'SIN_DISTANCIA'));
    return Array.from(set).sort();
  }, [eligible]);

  const [selectedDistance, setSelectedDistance] = useState<string>('');

  const activeDistance = distances.includes(selectedDistance)
    ? selectedDistance
    : distances[0] ?? '';

  const points = useMemo(() =>
    eligible.filter(h => (h.distance ?? 'SIN_DISTANCIA') === activeDistance),
    [eligible, activeDistance]
  );

  if (eligible.length < 2) return null;

  // SVG dimensions
  const W = 600;
  const H = 200;
  const PAD = { top: 20, right: 16, bottom: 44, left: 52 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const scores = points.map(p => p.score);
  const minScore = Math.max(0, Math.min(...scores) - 30);
  const maxScore = Math.max(...scores) + 30;

  const toX = (i: number) =>
    points.length < 2 ? chartW / 2 : (i / (points.length - 1)) * chartW;
  const toY = (s: number) =>
    chartH - ((s - minScore) / (maxScore - minScore)) * chartH;

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(p.score).toFixed(1)}`)
    .join(' ');

  const areaD = points.length > 1
    ? `${pathD} L ${toX(points.length - 1).toFixed(1)} ${chartH} L ${toX(0).toFixed(1)} ${chartH} Z`
    : '';

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('es-HN', { month: 'short', year: '2-digit' });

  const medalColor = (medal: string | null) => {
    if (medal === 'GOLD')   return 'var(--gold)';
    if (medal === 'SILVER') return 'var(--silver)';
    if (medal === 'BRONZE') return 'var(--bronze)';
    return 'var(--accent)';
  };

  const distLabel = (d: string) =>
    d === 'SIN_DISTANCIA' ? 'Sin distancia' : (DISTANCE_LABEL[d] || d);

  return (
    <div style={{ marginTop: 4 }}>

      {/* Filtro por distancia */}
      {distances.length > 1 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {distances.map(d => (
            <button
              key={d}
              onClick={() => setSelectedDistance(d)}
              style={{
                padding: '4px 14px',
                borderRadius: 20,
                border: `1px solid ${d === activeDistance ? 'var(--accent)' : 'var(--border)'}`,
                background: d === activeDistance ? 'rgba(45,107,255,0.15)' : 'transparent',
                color: d === activeDistance ? 'var(--accent)' : 'var(--subtle)',
                fontSize: 12,
                fontFamily: 'Manrope, sans-serif',
                cursor: 'pointer',
                transition: 'all 0.15s',
                fontWeight: d === activeDistance ? 700 : 400,
              }}
            >
              {distLabel(d)}
            </button>
          ))}
        </div>
      )}

      {points.length < 2 ? (
        <p style={{ color: 'var(--subtle)', fontSize: 13, margin: 0 }}>
          Se necesitan al menos 2 competencias en esta distancia para mostrar la gráfica.
        </p>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <svg
              viewBox={`0 0 ${W} ${H}`}
              style={{ width: '100%', maxWidth: W, display: 'block', fontFamily: 'Manrope, sans-serif' }}
            >
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="var(--accent)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              <g transform={`translate(${PAD.left},${PAD.top})`}>
                {/* Grid + labels eje Y */}
                {[0, 0.25, 0.5, 0.75, 1].map(t => {
                  const y   = chartH * (1 - t);
                  const val = Math.round(minScore + t * (maxScore - minScore));
                  return (
                    <g key={t}>
                      <line x1={0} y1={y} x2={chartW} y2={y}
                        stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
                      <text x={-8} y={y + 4} textAnchor="end"
                        fill="var(--subtle)" fontSize={11}>
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* Area */}
                {areaD && <path d={areaD} fill="url(#scoreGrad)" />}

                {/* Línea */}
                <path d={pathD} fill="none" stroke="var(--accent)"
                  strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

                {/* Puntos + tooltip nativo */}
                {points.map((p, i) => (
                  <g key={i}>
                    <title>
                      {p.eventName}{'\n'}Score: {p.score}{p.medal ? ` · ${p.medal}` : ''}
                    </title>
                    <circle
                      cx={toX(i)} cy={toY(p.score)} r={6}
                      fill={medalColor(p.medal)}
                      stroke="var(--bg)" strokeWidth={2}
                    />
                    {/* Score label sobre el punto */}
                    <text
                      x={toX(i)} y={toY(p.score) - 10}
                      textAnchor="middle" fill="var(--text)" fontSize={10} fontWeight={700}
                    >
                      {p.score}
                    </text>
                    {/* Label eje X */}
                    <text
                      x={toX(i)} y={chartH + 16}
                      textAnchor="middle" fill="var(--subtle)" fontSize={10}
                    >
                      {formatDate(p.eventDate)}
                    </text>
                  </g>
                ))}
              </g>
            </svg>
          </div>

          {/* Stats resumen */}
          <div style={{ display: 'flex', gap: 24, marginTop: 4, flexWrap: 'wrap' }}>
            {[
              { label: 'Mejor score',  value: Math.max(...scores) },
              { label: 'Promedio',     value: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) },
              { label: 'Competencias', value: points.length },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{
                  fontFamily: 'Space Mono, monospace', fontSize: 20,
                  fontWeight: 700, color: 'var(--accent)',
                }}>
                  {value}
                </div>
                <div style={{ fontSize: 11, color: 'var(--subtle)', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
